"""Claude Code -> Octarin capture hook (pure stdlib, fail-open).

Registered as a Claude Code ``Stop`` hook. On each turn-end Claude Code pipes a
small JSON payload on stdin (``session_id``, ``transcript_path``, ``cwd``, ...).
This hook:

  1. reads that payload and locates the session transcript JSONL;
  2. parses user/assistant turns, tool calls, token usage, and model;
  3. builds a single canonical ``IngestEvent`` (full ``spans`` form) covering the
     turns produced since the last run (tracked via a per-session offset file);
  4. POSTs it to ``${OCTARIN_INGEST_URL:-$OCTARIN_API_BASE/v1/ingest}`` with
     ``Authorization: Bearer $OCTARIN_API_KEY``.

It is deliberately tiny and dependency-free (stdlib only). Every failure path
exits 0 so the host tool is never blocked, and the network call has a hard
timeout. The canonical shape is defined in ``backend/app/schema/canonical.py``.

Why this file disables a few ruff rules at the module level:

  * ``BLE001`` (bare ``except Exception``) and ``S110``/``S112`` (try/except/
    pass / continue) are EXPLICITLY the design — a capture hook that raises
    or logs into stderr breaks the host tool's UX. We swallow everything and
    exit 0.
  * ``S310`` (unaudited URL scheme on ``urllib.request.urlopen``) — the URL
    comes from our own ``OCTARIN_INGEST_URL`` / ``OCTARIN_API_BASE`` env, not
    user input.

The hook is invoked by ``run.sh`` via ``exec python3 hook.py``, so no shebang
is needed — and dropping it sidesteps EXE001 (shebang on non-executable file)
in every consuming repo.
"""
# ruff: noqa: BLE001, S110, S112, S310, INP001
# (INP001: this is a standalone Claude Code hook script — `.claude/octarin/` is
# a config directory that happens to contain a .py; it's not a Python package
# and adding __init__.py would falsely advertise importability from elsewhere
# in the host repo.)

from __future__ import annotations

import base64
import getpass
import hashlib
import json
import os
import ssl
import subprocess
import sys
import time
import urllib.error
import urllib.request
import uuid
from datetime import datetime, timezone
from pathlib import Path

SOURCE = "claude-code"
STATE_DIR = Path.home() / ".octarin"
STATE_FILE = STATE_DIR / "claude_code_state.json"
MAX_TEXT = 20_000  # cap stored input/output text so payloads stay small
HTTP_TIMEOUT_S = 5.0
# Named HTTP status codes — keeps the response-handling logic free of magic
# numbers and matches the ``PLR2004`` lint contract in strict ruff profiles.
HTTP_OK = 200
HTTP_MULTIPLE_CHOICES = 300
HTTP_UNAUTHORIZED = 401
# Cap per-attachment base64 payload we ship inline. Larger items are recorded
# metadata-only (no b64) so a giant paste never bloats the POST or the backend.
MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024  # ~5MB of raw bytes
# Map common file extensions -> mime for file refs that lack one.
_EXT_MIME = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".pdf": "application/pdf",
    ".txt": "text/plain",
    ".md": "text/markdown",
    ".json": "application/json",
    ".csv": "text/csv",
}
# Same UUID5 namespace as backend deterministic_trace_id so retries de-dupe.
_TRACE_NAMESPACE = uuid.UUID("6f8d2c1e-9a3b-4f5e-8c7d-1a2b3c4d5e6f")


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _truncate(text: str) -> str:
    if not text:
        return ""
    return text if len(text) <= MAX_TEXT else text[:MAX_TEXT]


def read_payload() -> dict:
    """Read and parse the hook JSON from stdin; ``{}`` on any problem."""
    try:
        raw = sys.stdin.read()
        if not raw.strip():
            return {}
        parsed = json.loads(raw)
        return parsed if isinstance(parsed, dict) else {}
    except Exception:
        return {}


def locate_transcript(payload: dict) -> tuple[str | None, Path | None, str | None]:
    """Pull ``(session_id, transcript_path, cwd)`` from the hook payload."""
    session_id = (
        payload.get("session_id")
        or payload.get("sessionId")
        or (payload.get("session") or {}).get("id")
    )
    raw_path = (
        payload.get("transcript_path")
        or payload.get("transcriptPath")
        or (payload.get("transcript") or {}).get("path")
    )
    cwd = payload.get("cwd") or payload.get("workspace") or None
    path: Path | None = None
    if raw_path:
        try:
            path = Path(raw_path).expanduser()
        except Exception:
            path = None
    return session_id, path, cwd


# ── transcript helpers (mirror Claude Code's JSONL shape) ──


def _msg(entry: dict) -> dict:
    m = entry.get("message")
    return m if isinstance(m, dict) else {}


def _role(entry: dict) -> str | None:
    t = entry.get("type")
    if t in ("user", "assistant"):
        return t
    r = _msg(entry).get("role")
    return r if r in ("user", "assistant") else None


def _content(entry: dict):
    m = _msg(entry)
    return m.get("content") if "message" in entry else entry.get("content")


def _text(content) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for x in content:
            if isinstance(x, dict) and x.get("type") == "text":
                parts.append(x.get("text", ""))
            elif isinstance(x, str):
                parts.append(x)
        return "\n".join(p for p in parts if p)
    return ""


def _blocks(content, block_type: str) -> list[dict]:
    if not isinstance(content, list):
        return []
    return [x for x in content if isinstance(x, dict) and x.get("type") == block_type]


def _attachment_from_image_block(block: dict) -> dict | None:
    """Build an attachment dict from a Claude ``image`` content block.

    Claude carries pasted images as ``{"type":"image","source":{"type":"base64",
    "media_type":"image/png","data":"..."}}``. We capture the base64 bytes inline
    when within the size cap; larger images are recorded metadata-only (no b64).
    Returns ``None`` if the block carries no usable image data.
    """
    src = block.get("source")
    if not isinstance(src, dict):
        return None
    mime = src.get("media_type") or "image/png"
    name = block.get("name") or block.get("filename") or "pasted-image"
    if src.get("type") == "base64":
        data = src.get("data")
        if not isinstance(data, str) or not data:
            return None
        # Authoritative size: decode once (cheap vs. the network cost we save).
        try:
            raw = base64.b64decode(data, validate=False)
        except Exception:
            return None
        nbytes = len(raw)
        att = {"kind": "image", "mime": mime, "name": str(name), "bytes": nbytes}
        att["b64"] = data if nbytes <= MAX_ATTACHMENT_BYTES else None
        return att
    # URL-backed image (rare in transcripts): record metadata only.
    if src.get("type") == "url" and src.get("url"):
        return {
            "kind": "image",
            "mime": mime,
            "name": str(name),
            "bytes": 0,
            "b64": None,
        }
    return None


def _mime_for_name(name: str) -> str:
    """Best-effort mime from a filename extension; generic when unknown."""
    lower = name.lower()
    for ext, mime in _EXT_MIME.items():
        if lower.endswith(ext):
            return mime
    return "application/octet-stream"


def _attachment_from_file_block(block: dict) -> dict | None:
    """Build a metadata attachment from a ``document``/file-ref content block.

    Claude can carry document blocks (``{"type":"document","source":{...}}``) and
    tool results sometimes reference files. We capture base64 ``document`` bytes
    when present (within the cap); otherwise record the file name as metadata so
    the trace at least shows that a file was attached.
    """
    src = block.get("source")
    name = (
        block.get("name")
        or block.get("title")
        or block.get("filename")
        or "attached-file"
    )
    name = str(name)
    if (
        isinstance(src, dict)
        and src.get("type") == "base64"
        and isinstance(src.get("data"), str)
    ):
        data = src["data"]
        mime = src.get("media_type") or _mime_for_name(name)
        try:
            raw = base64.b64decode(data, validate=False)
        except Exception:
            return None
        nbytes = len(raw)
        return {
            "kind": "file",
            "mime": mime,
            "name": name,
            "bytes": nbytes,
            "b64": data if nbytes <= MAX_ATTACHMENT_BYTES else None,
        }
    # Bare reference with a name/path but no inline bytes: metadata only.
    if block.get("name") or block.get("title") or block.get("filename"):
        return {
            "kind": "file",
            "mime": _mime_for_name(name),
            "name": name,
            "bytes": 0,
            "b64": None,
        }
    return None


def _extract_attachments(content) -> list[dict]:
    """Pull image/file attachments from a message/tool-result content list.

    Walks ``image`` and ``document`` content blocks (Claude's pasted-binary
    shapes). Pure + fail-open: any malformed block is skipped, never raised, so
    attachment capture can NEVER break the hook's core span extraction.
    """
    out: list[dict] = []
    if not isinstance(content, list):
        return out
    for block in content:
        if not isinstance(block, dict):
            continue
        try:
            btype = block.get("type")
            if btype == "image":
                att = _attachment_from_image_block(block)
            elif btype in ("document", "file"):
                att = _attachment_from_file_block(block)
            else:
                att = None
            if att:
                out.append(att)
        except Exception:
            continue
    return out


def _is_tool_result(entry: dict) -> bool:
    return _role(entry) == "user" and bool(_blocks(_content(entry), "tool_result"))


def _usage(entry: dict) -> dict:
    u = _msg(entry).get("usage")
    if not isinstance(u, dict):
        return {}
    return {
        "input": int(u.get("input_tokens") or 0),
        "output": int(u.get("output_tokens") or 0),
        "cache_read": int(u.get("cache_read_input_tokens") or 0),
        "cache_write": int(u.get("cache_creation_input_tokens") or 0),
    }


def _ts(entry: dict) -> str | None:
    v = entry.get("timestamp")
    return v if isinstance(v, str) and v else None


def read_new_entries(path: Path, state: dict, key: str) -> list[dict]:
    """Return transcript entries appended since the last processed byte offset."""
    if not path.exists():
        return []
    sess = state.get(key) or {}
    offset = int(sess.get("offset", 0))
    try:
        size = path.stat().st_size
        if size < offset:  # transcript rotated/truncated -> reprocess from start
            offset = 0
        with path.open("rb") as fh:
            fh.seek(offset)
            chunk = fh.read()
            new_offset = fh.tell()
    except Exception:
        return []
    sess["offset"] = new_offset
    state[key] = sess
    out: list[dict] = []
    for raw_line in chunk.decode("utf-8", errors="replace").splitlines():
        line = raw_line.strip()
        if not line:
            continue
        try:
            obj = json.loads(line)
            if isinstance(obj, dict):
                out.append(obj)
        except Exception:
            continue
    return out


def build_spans(  # noqa: PLR0915 - top-down transcript parser; splitting it
    entries: list[dict],  # would scatter the local span-bookkeeping state.
) -> tuple[list[dict], dict, list[str], str | None]:
    """Turn transcript entries into canonical spans + rolled-up totals.

    Each assistant message becomes one ``llm`` span (model + token usage); each
    ``tool_use`` inside it becomes a child ``tool`` span. Returns
    ``(spans, totals, models, repo)``.
    """
    # Map tool_use_id -> tool_result text for output enrichment, and
    # tool_use_id -> attachments for any images a tool returned.
    results_by_id: dict[str, str] = {}
    attachments_by_tool_id: dict[str, list[dict]] = {}
    # tool_use_id -> ts of the message that returned the result. Gives tool spans
    # a real (assistant_ts -> result_ts) duration instead of zero.
    result_ts_by_id: dict[str, str] = {}
    for entry in entries:
        if _is_tool_result(entry):
            entry_ts = _ts(entry)
            for tr in _blocks(_content(entry), "tool_result"):
                tid = tr.get("tool_use_id")
                if tid:
                    out = tr.get("content")
                    results_by_id[str(tid)] = (
                        out
                        if isinstance(out, str)
                        else json.dumps(out, ensure_ascii=False)
                    )
                    atts = _extract_attachments(out)
                    if atts:
                        attachments_by_tool_id[str(tid)] = atts
                    if entry_ts:
                        result_ts_by_id[str(tid)] = entry_ts

    spans: list[dict] = []
    models: list[str] = []
    totals = {
        "input_tokens": 0,
        "output_tokens": 0,
        "total_tokens": 0,
        "cache_read_tokens": 0,
        "cost_usd": 0.0,
        "span_count": 0,
        "tool_call_count": 0,
    }

    pending_user_text = ""
    pending_user_attachments: list[dict] = []
    # One API generation streams as SEVERAL transcript entries (one per content
    # block — text, then each tool_use) that share the same message id and each
    # repeat the generation's FULL usage. Merge them into ONE span keyed by that
    # id: usage/cost counted once, outputs concatenated, tool children attached.
    llm_span_by_id: dict[str, dict] = {}
    # ts of the previous transcript entry; the LLM call started when the user
    # prompt / tool result landed, finished when the assistant message appears.
    prev_ts: str | None = None
    for entry in entries:
        role = _role(entry)
        if role == "user" and not _is_tool_result(entry):
            pending_user_text = _truncate(_text(_content(entry)))
            # Images/files the user pasted into this turn ride along to the
            # assistant span they prompted (accumulate across consecutive user
            # messages until the next assistant generation consumes them).
            pending_user_attachments.extend(_extract_attachments(_content(entry)))
            prev_ts = _ts(entry) or prev_ts
            continue
        if role != "assistant":
            prev_ts = _ts(entry) or prev_ts
            continue

        content = _content(entry)
        usage = _usage(entry)
        model = _msg(entry).get("model")
        if model and model not in models:
            models.append(model)
        ts = _ts(entry) or _now_iso()
        span_id = _msg(entry).get("id") or uuid.uuid4().hex
        out_text = _truncate(_text(content))

        existing = llm_span_by_id.get(str(span_id))
        if existing is not None:
            # Continuation entry of an already-seen generation: extend the span,
            # never re-count its usage (each entry repeats the full totals).
            existing["end_time"] = ts
            if out_text:
                joined = (
                    f"{existing['output']}\n{out_text}"
                    if existing["output"]
                    else out_text
                )
                existing["output"] = _truncate(joined)
            for tu in _blocks(content, "tool_use"):
                _append_tool_span(
                    spans,
                    totals,
                    tu,
                    parent_span_id=str(span_id),
                    ts=ts,
                    results_by_id=results_by_id,
                    result_ts_by_id=result_ts_by_id,
                    attachments_by_tool_id=attachments_by_tool_id,
                )
            prev_ts = ts
            continue

        in_tok = usage.get("input", 0)
        out_tok = usage.get("output", 0)
        cache_r = usage.get("cache_read", 0)
        cache_w = usage.get("cache_write", 0)
        llm_span = {
            "span_id": str(span_id),
            "parent_span_id": None,
            "name": f"Claude generation ({model})" if model else "Claude generation",
            "span_type": "llm",
            "start_time": prev_ts or ts,
            "end_time": ts,
            "model": model,
            "provider": "anthropic",
            "input": pending_user_text or None,
            "output": out_text or None,
            "input_tokens": in_tok,
            "output_tokens": out_tok,
            "total_tokens": in_tok + out_tok,
            "cache_read_tokens": cache_r,
            "cache_write_tokens": cache_w,
            "status": "ok",
            "attributes": {"turn_role": "assistant"},
        }
        if pending_user_attachments:
            llm_span["attachments"] = pending_user_attachments
        spans.append(llm_span)
        llm_span_by_id[str(span_id)] = llm_span
        pending_user_text = ""  # consumed by this generation
        pending_user_attachments = []  # consumed by this generation

        totals["input_tokens"] += in_tok
        totals["output_tokens"] += out_tok
        totals["cache_read_tokens"] += cache_r
        totals["total_tokens"] += in_tok + out_tok

        for tu in _blocks(content, "tool_use"):
            _append_tool_span(
                spans,
                totals,
                tu,
                parent_span_id=str(span_id),
                ts=ts,
                results_by_id=results_by_id,
                result_ts_by_id=result_ts_by_id,
                attachments_by_tool_id=attachments_by_tool_id,
            )

        prev_ts = ts

    totals["span_count"] = len(spans)
    return spans, totals, models, None


def _append_tool_span(
    spans: list[dict],
    totals: dict,
    tu: dict,
    *,
    parent_span_id: str,
    ts: str,
    results_by_id: dict[str, str],
    result_ts_by_id: dict[str, str],
    attachments_by_tool_id: dict[str, list[dict]],
) -> None:
    """Append one ``tool`` child span for a ``tool_use`` block to ``spans``."""
    tid = str(tu.get("id") or uuid.uuid4().hex)
    tname = tu.get("name") or "unknown"
    tu_input = tu.get("input")
    input_str = (
        tu_input if isinstance(tu_input, str) else json.dumps(tu_input, ensure_ascii=False)
    )
    tool_span = {
        "span_id": tid,
        "parent_span_id": parent_span_id,
        # Canonical span name is lowercase ``tool:<Name>`` (matches backfill.py +
        # every analytics/usage/chat classifier). The earlier ``Tool: <Name>``
        # shape silently bucketed every tool call as ``other`` on the dashboards.
        "name": f"tool:{tname}",
        "span_type": "tool",
        "start_time": ts,
        "end_time": result_ts_by_id.get(tid, ts),
        "input": _truncate(input_str),
        "output": _truncate(results_by_id.get(tid, "")) or None,
        "status": "ok",
        "attributes": {"tool_name": tname, "tool_id": tid},
    }
    tool_atts = attachments_by_tool_id.get(tid)
    if tool_atts:
        tool_span["attachments"] = tool_atts
    spans.append(tool_span)
    totals["tool_call_count"] += 1


def user_ref() -> str:
    """Resolve the engineer's real identity for attribution.

    Priority: an explicit ``OCTARIN_USER`` override → the Claude Code account
    email (``~/.claude.json`` ``oauthAccount.emailAddress`` — the signed-in user)
    → the git ``user.email`` → the OS username. We attribute to a real person
    (matching ``backfill.py`` and the per-user ingest key) rather than an opaque
    per-machine hash, so the dashboard shows who actually did the work. When the
    request carries a per-user key the server overrides this with the key owner
    anyway; a real identity here is what ANONYMOUS (slug-only) sends rely on.
    """
    ref = (os.environ.get("OCTARIN_USER") or "").strip()
    if ref:
        return ref
    try:
        with open(Path.home() / ".claude.json", encoding="utf-8") as fh:
            account = json.load(fh).get("oauthAccount") or {}
        email = (account.get("emailAddress") or "").strip()
        if email:
            return email
    except Exception:
        pass
    try:
        out = subprocess.check_output(
            ["git", "config", "user.email"],
            cwd=os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd(),
            stderr=subprocess.DEVNULL,
        )
        email = out.decode().strip()
        if email:
            return email
    except Exception:
        pass
    try:
        return getpass.getuser()
    except Exception:
        return "unknown"


def _notify_auth_required_once(project: str) -> None:
    """Print the one-time ``login.sh`` hint when the server says auth_required.

    Only fires when the project has flipped per-user auth on AND this machine
    has no Bearer key yet — i.e. the precise moment the teammate needs to run
    the bootstrap. The marker is per-project so different repos don't suppress
    each other's hint.
    """
    try:
        STATE_DIR.mkdir(parents=True, exist_ok=True)
        marker = (
            STATE_DIR / f"auth_hint.{hashlib.sha256(project.encode()).hexdigest()[:12]}"
        )
        if marker.exists():
            return
        marker.write_text("", encoding="utf-8")
    except Exception:
        pass
    sys.stderr.write(
        f"[octarin] project {project!r} now requires per-user auth. "
        "Run once to authorize:\n"
        "[octarin]   curl -fsSL https://octarin.ai/hooks/login.sh | bash\n"
    )


_SSL_CTX = None


def _ssl_context():
    """Cert-verifying TLS context resilient to empty trust stores (the macOS
    python.org ``CERTIFICATE_VERIFY_FAILED`` issue). Resolves a CA bundle —
    OCTARIN_CA_BUNDLE / SSL_CERT_FILE env, certifi if importable, known system
    bundles, else the interpreter default — and reuses it."""
    global _SSL_CTX
    if _SSL_CTX is not None:
        return _SSL_CTX
    cafile = None
    for env in ("OCTARIN_CA_BUNDLE", "SSL_CERT_FILE"):
        p = os.environ.get(env)
        if p and os.path.exists(p):
            cafile = p
            break
    if cafile is None:
        try:
            import certifi

            cafile = certifi.where()
        except Exception:
            for p in (
                "/etc/ssl/cert.pem",
                "/opt/homebrew/etc/openssl@3/cert.pem",
                "/usr/local/etc/openssl@3/cert.pem",
                "/etc/ssl/certs/ca-certificates.crt",
                "/etc/pki/tls/certs/ca-bundle.crt",
            ):
                if os.path.exists(p):
                    cafile = p
                    break
    try:
        _SSL_CTX = ssl.create_default_context(cafile=cafile)
    except Exception:
        _SSL_CTX = ssl.create_default_context()
    return _SSL_CTX


def post_event(event: dict) -> bool:
    """POST the IngestEvent. Returns True on 2xx, False otherwise (fail-open).

    Two auth modes:
      * Bearer key (``OCTARIN_API_KEY`` set) — per-user, minted by ``login.sh``.
      * Slug-only — no key, but ``OCTARIN_PROJECT`` is set. Hook adds
        ``X-Octarin-Project: <slug>`` AND embeds ``project`` in the body so
        the backend can match either way. Server enforces the project's
        ``allow_anonymous_ingest`` policy and rate-limits per IP.

    On a 401 with the ``auth_required`` server code (project flipped strict),
    we print the one-time ``login.sh`` hint so the user knows what to do next.
    """
    url = os.environ.get("OCTARIN_INGEST_URL")
    if not url:
        base = (os.environ.get("OCTARIN_API_BASE") or "").rstrip("/")
        if not base:
            return False
        url = f"{base}/v1/ingest"

    api_key = os.environ.get("OCTARIN_API_KEY", "")
    project = os.environ.get("OCTARIN_PROJECT", "").strip()

    # Embed `project` in the body for slug-auth (server reads it from the body
    # OR an X-Octarin-Project header). Always safe to include — server ignores
    # it when a valid Bearer is present.
    payload = dict(event)
    if project and "project" not in payload:
        payload["project"] = project

    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=body, method="POST")
    req.add_header("Content-Type", "application/json")
    if api_key:
        req.add_header("Authorization", f"Bearer {api_key}")
    elif project:
        req.add_header("X-Octarin-Project", project)
    try:
        with urllib.request.urlopen(req, timeout=HTTP_TIMEOUT_S, context=_ssl_context()) as resp:
            return HTTP_OK <= resp.status < HTTP_MULTIPLE_CHOICES
    except urllib.error.HTTPError as exc:
        # Strict-auth signal from the server: print the login.sh hint, once.
        if exc.code == HTTP_UNAUTHORIZED and project and not api_key:
            try:
                envelope = json.loads(exc.read().decode("utf-8") or "{}")
            except Exception:
                envelope = {}
            if envelope.get("error", {}).get("code") == "auth_required":
                _notify_auth_required_once(project)
        return False
    except Exception:
        return False


def load_state() -> dict:
    try:
        return (
            json.loads(STATE_FILE.read_text(encoding="utf-8"))
            if STATE_FILE.exists()
            else {}
        )
    except Exception:
        return {}


def save_state(state: dict) -> None:
    try:
        STATE_DIR.mkdir(parents=True, exist_ok=True)
        tmp = STATE_FILE.with_suffix(".tmp")
        tmp.write_text(json.dumps(state, sort_keys=True), encoding="utf-8")
        tmp.replace(STATE_FILE)
    except Exception:
        pass


def build_event(payload: dict) -> dict | None:
    """Assemble the canonical IngestEvent from a hook payload (or None to skip)."""
    session_id, path, cwd = locate_transcript(payload)
    if not session_id or path is None:
        return None

    state = load_state()
    key = hashlib.sha256(f"{session_id}::{path}".encode()).hexdigest()
    entries = read_new_entries(path, state, key)
    save_state(state)
    if not entries:
        return None

    spans, totals, models, _ = build_spans(entries)
    if not spans:
        return None

    repo = Path(cwd).name if cwd else None
    src_trace = f"{session_id}:{int(time.time())}"
    trace_id = str(uuid.uuid5(_TRACE_NAMESPACE, f"{SOURCE}:{src_trace}"))
    times = [s["start_time"] for s in spans]

    return {
        "trace_id": trace_id,
        "source": SOURCE,
        "session_id": session_id,
        "user_ref": user_ref(),
        "repo": repo,
        "model": models[0] if models else None,
        "spans": spans,
        "start_time": min(times),
        "end_time": max(times),
        "total_tokens": totals["total_tokens"],
        "input_tokens": totals["input_tokens"],
        "output_tokens": totals["output_tokens"],
        "cache_read_tokens": totals["cache_read_tokens"],
        # extra (extra="allow"): handy for the backend rollup/audit
        "totals": totals,
        "models": models,
    }


def main() -> int:
    try:
        payload = read_payload()
        event = build_event(payload)
        if event is None:
            return 0
        try:
            import importlib.util

            path = Path(__file__).resolve().parent / "redact.py"
            if path.is_file():
                spec = importlib.util.spec_from_file_location("octarin_redact", str(path))
                if spec is not None and spec.loader is not None:
                    module = importlib.util.module_from_spec(spec)
                    spec.loader.exec_module(module)
                    event, _hits = module.redact_event(event)
        except Exception:
            pass
        # post_event handles the auth path internally (Bearer if a per-user key
        # is set, slug-only otherwise). It only prints the login.sh hint if the
        # server actually refuses with auth_required — i.e. the project flipped
        # per-user auth on. Until then, slug-only mode just works silently.
        post_event(event)
    except Exception:
        # Absolutely never let the hook break the host tool.
        return 0
    return 0


if __name__ == "__main__":
    sys.exit(main())
