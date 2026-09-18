#!/usr/bin/env bash
# capture.sh — GitHub Copilot (cloud coding agent) -> Octarin capture hook.
#
# Wired as a Copilot `sessionEnd` hook (see .github/hooks/octarin.json). Copilot
# runs this in its cloud runner at session end, piping the event JSON on stdin.
# It POSTs a best-effort single-event IngestEvent (source "copilot") to
# ${OCTARIN_INGEST_URL:-$OCTARIN_API_BASE/v1/ingest} with Authorization Bearer
# from $OCTARIN_API_KEY (or $COPILOT_MCP_OCTARIN_INGEST_KEY, the Copilot env secret).
#
# BEST-EFFORT: the cloud-agent hook payload does not expose token counts, so this
# records a per-session marker (repo + actor + any last message) — token accuracy
# is a follow-up. Fail-open: every path exits 0 so Copilot is never blocked.

set +e
INPUT="$(cat 2>/dev/null)"

KEY="${OCTARIN_API_KEY:-${COPILOT_MCP_OCTARIN_INGEST_KEY:-}}"
URL="${OCTARIN_INGEST_URL:-}"
if [ -z "$URL" ] && [ -n "${OCTARIN_API_BASE:-}" ]; then
  URL="${OCTARIN_API_BASE%/}/v1/ingest"
fi
[ -z "$KEY" ] && exit 0
[ -z "$URL" ] && exit 0

REPO="${GITHUB_REPOSITORY##*/}"
SESSION="${GITHUB_RUN_ID:-}"
[ -n "$SESSION" ] && [ -n "${GITHUB_RUN_ATTEMPT:-}" ] && SESSION="${SESSION}-${GITHUB_RUN_ATTEMPT}"
[ -z "$SESSION" ] && SESSION="copilot-$(date -u +%Y%m%dT%H%M%S)"

# Preferred path: python3 (always present on GitHub runners) parses stdin safely
# and POSTs via urllib — robust JSON, no shell-escaping pitfalls.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if command -v python3 >/dev/null 2>&1; then
  OCTARIN_INPUT="$INPUT" OCTARIN_URL="$URL" OCTARIN_KEY="$KEY" \
  OCTARIN_REPO="$REPO" OCTARIN_SESSION="$SESSION" OCTARIN_ACTOR="${GITHUB_ACTOR:-}" \
  OCTARIN_REDACT="$SCRIPT_DIR/redact.py" \
  python3 - <<'PY'
import json, os, datetime, importlib.util, urllib.request
raw = os.environ.get("OCTARIN_INPUT") or ""
try:
    p = json.loads(raw) if raw.strip() else {}
except Exception:
    p = {}
if not isinstance(p, dict):
    p = {}
session = (p.get("sessionId") or p.get("session_id") or p.get("threadId")
           or os.environ.get("OCTARIN_SESSION"))
resp = p.get("lastAgentMessage") or p.get("last_agent_message") or p.get("response")
now = datetime.datetime.now(datetime.timezone.utc).isoformat()
event = {
    "source": "copilot",
    "session_id": str(session),
    "repo": os.environ.get("OCTARIN_REPO") or None,
    "user_ref": os.environ.get("OCTARIN_ACTOR") or None,
    "response": resp if isinstance(resp, str) else None,
    "start_time": now,
    "end_time": now,
}
try:
    path = os.environ.get("OCTARIN_REDACT") or ""
    if path and os.path.isfile(path):
        spec = importlib.util.spec_from_file_location("octarin_redact", path)
        if spec is not None and spec.loader is not None:
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            event, _hits = module.redact_event(event)
except Exception:
    pass
data = json.dumps(event).encode("utf-8")
req = urllib.request.Request(
    os.environ["OCTARIN_URL"], data=data, method="POST",
    headers={"Content-Type": "application/json",
             "Authorization": "Bearer " + os.environ["OCTARIN_KEY"]},
)
try:
    urllib.request.urlopen(req, timeout=5).read()
except Exception:
    pass
PY
  exit 0
fi

# Fallback: a minimal curl marker (no stdin parsing).
if command -v curl >/dev/null 2>&1; then
  NOW="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  BODY="{\"source\":\"copilot\",\"session_id\":\"${SESSION}\",\"repo\":\"${REPO}\",\"user_ref\":\"${GITHUB_ACTOR:-}\",\"start_time\":\"${NOW}\",\"end_time\":\"${NOW}\"}"
  curl -s -m 5 -X POST "$URL" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${KEY}" \
    -d "$BODY" >/dev/null 2>&1
fi
exit 0
