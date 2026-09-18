#!/usr/bin/env python3
"""Secret redaction — the last thing that runs before text becomes a git object.

A git object is permanent and readable by everyone who can read the repository;
on a public repo that is everyone alive. There is no undo, no rotation of a
transcript, and no way to reach the clones. So this module runs on **every**
free-text field a checkpoint carries (prompts, transcript text) before
``checkpoint.py`` writes anything, and its rules are not configurable away.
Configurable rule packs (RFC §6, P3) may only ADD to this set.

Two design points worth stating, because both are easy to get backwards:

* **Replacements name the rule, never the match.** ``[redacted:aws_key]`` tells
  a reader what was removed without re-introducing what was removed.
* **Specific rules run before general ones.** A Postgres DSN is also a
  credentialed URL; whichever fires first owns the span, so ordering in
  :data:`RULES` is behaviour, not style.

The generic high-entropy rule is deliberately conservative: it demands length,
mixed character classes AND entropy together, because the cost of a false
positive here is corrupting the very prose that makes ``octarin why`` worth
running. A 40-character SHA (lowercase hex, no uppercase) and a long
``camelCaseIdentifier`` (no digits) both fall outside it by construction.

Pure stdlib, fail-open: :func:`redact_text` returns the input unchanged rather
than raising, because a redactor that throws inside a git hook would be a
redactor that blocks commits.
"""

from __future__ import annotations

import math
import re

# Bump when the rule set changes in a way that alters output; recorded as
# `meta.redaction.v` so a reader can tell which vintage redacted a checkpoint.
REDACTION_V = 2

# Minimum length, character-class mix and Shannon entropy for the generic rule.
_MIN_TOKEN_CHARS = 32
_MIN_ENTROPY_BITS = 3.5

_PRIVATE_KEY_RE = re.compile(
    r"-----BEGIN[ A-Z]*PRIVATE KEY-----.*?-----END[ A-Z]*PRIVATE KEY-----",
    re.DOTALL,
)

# Ordered: the first rule to match a span owns it. Specific before general.
RULES: tuple[tuple[str, re.Pattern[str]], ...] = (
    # Whole PEM blocks first — the body would otherwise be shredded piecemeal by
    # the generic token rule into something unreadable but still revealing.
    ("private_key", _PRIVATE_KEY_RE),
    ("jwt", re.compile(r"\beyJ[A-Za-z0-9_-]{6,}\.eyJ[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}")),
    # Before credentialed_url: a DSN is a credentialed URL, and naming the
    # database case is more useful to whoever reads the redacted transcript.
    (
        "connection_string",
        re.compile(
            r"\b(?:postgres|postgresql|mysql|mariadb|mongodb(?:\+srv)?|redis|rediss|amqp|amqps)"
            r"://[^\s:/@]+:[^\s@]+@[^\s]+",
            re.IGNORECASE,
        ),
    ),
    ("credentialed_url", re.compile(r"\b[a-z][a-z0-9+.-]*://[^\s:/@]+:[^\s@]+@[^\s]+", re.I)),
    ("aws_key", re.compile(r"\b(?:AKIA|ASIA)[0-9A-Z]{16}\b")),
    ("google_key", re.compile(r"\bAIza[0-9A-Za-z_-]{35}\b")),
    (
        "provider_key",
        re.compile(
            r"\b(?:"
            r"sk-[A-Za-z0-9_-]{16,}"  # OpenAI / Anthropic
            r"|oct_[A-Za-z0-9_-]{16,}"  # Octarin ingest keys
            r"|gh[pousr]_[A-Za-z0-9]{16,}"  # GitHub
            r"|xox[baprs]-[A-Za-z0-9-]{10,}"  # Slack
            r"|glpat-[A-Za-z0-9_-]{16,}"  # GitLab
            r"|npm_[A-Za-z0-9]{30,}"  # npm
            r")"
        ),
    ),
    # One rule per vendor below, so the marker names what leaked. Every pattern
    # is anchored on a distinctive vendor prefix — never a bare keyword like
    # `password=` — because over-redaction destroys the prose this tool keeps.
    ("stripe_key", re.compile(r"\b(?:sk|rk)_(?:live|test|prod)_[A-Za-z0-9]{10,}")),
    ("sendgrid_key", re.compile(r"\bSG\.[A-Za-z0-9_-]{16,32}\.[A-Za-z0-9_-]{16,64}\b")),
    # 34 chars total: the exact SID shape, hex tail, hard boundaries. `SK` alone
    # would be far too generic; the full shape cannot occur in prose.
    ("twilio_key", re.compile(r"\bSK[0-9a-fA-F]{32}\b")),
    (
        "slack_webhook",
        re.compile(
            r"(?:https?://)?hooks\.slack\.com/(?:services|workflows|triggers)/[A-Za-z0-9+/]{40,}"
        ),
    ),
    ("huggingface_token", re.compile(r"\bhf_[A-Za-z0-9]{30,}")),
    # PyPI macaroons: base64 of the location header, so `pypi-AgE` is fixed for
    # both pypi.org and test.pypi.org tokens.
    ("pypi_token", re.compile(r"\bpypi-AgE[A-Za-z0-9_-]{40,}")),
    ("shopify_token", re.compile(r"\bshp(?:at|ca|pa|ss)_[a-fA-F0-9]{32}\b")),
    ("digitalocean_token", re.compile(r"\bdo[opr]_v1_[a-f0-9]{64}\b")),
    ("databricks_token", re.compile(r"\bdapi[a-f0-9]{32}(?:-\d)?\b")),
    # `pat` is an English word; the exact 14-char id plus 64-hex tail is not.
    ("airtable_pat", re.compile(r"\bpat[A-Za-z0-9]{14}\.[a-f0-9]{64}\b")),
    ("figma_token", re.compile(r"\bfigd_[A-Za-z0-9_-]{20,}")),
    ("notion_token", re.compile(r"\bntn_[A-Za-z0-9]{40,}")),
    # Fine-grained PATs; NOT covered by the classic gh[pousr]_ rule above.
    ("github_pat", re.compile(r"\bgithub_pat_[A-Za-z0-9_]{36,}")),
    ("gitlab_runner_token", re.compile(r"\bglrt-[A-Za-z0-9_-]{20,}")),
    ("linear_key", re.compile(r"\blin_api_[A-Za-z0-9]{32,}")),
)


def _shannon_entropy(text: str) -> float:
    """Bits of entropy per character. 0.0 for empty input."""
    if not text:
        return 0.0
    counts: dict[str, int] = {}
    for char in text:
        counts[char] = counts.get(char, 0) + 1
    length = len(text)
    return -sum((n / length) * math.log2(n / length) for n in counts.values())


def _looks_like_a_secret(token: str) -> bool:
    """Length, class mix and entropy — all three, or it is prose we must keep.

    Requiring a digit AND both letter cases is what protects identifiers
    (``getCurrentWorkingDirectory``) and lowercase hex (a git SHA), which are the
    two long strings that genuinely appear in commit-time text.
    """
    if len(token) < _MIN_TOKEN_CHARS:
        return False
    if not any(c.islower() for c in token):
        return False
    if not any(c.isupper() for c in token):
        return False
    if not any(c.isdigit() for c in token):
        return False
    return _shannon_entropy(token) >= _MIN_ENTROPY_BITS


_CANDIDATE_TOKEN_RE = re.compile(r"[A-Za-z0-9_\-+/=]{%d,}" % _MIN_TOKEN_CHARS)


def _redact_generic(text: str) -> tuple[str, int]:
    """Replace high-entropy runs that survived the named rules."""
    hits = 0

    def replace(match: re.Match[str]) -> str:
        nonlocal hits
        token = match.group(0)
        if not _looks_like_a_secret(token):
            return token
        hits += 1
        return "[redacted:generic_token]"

    return _CANDIDATE_TOKEN_RE.sub(replace, text), hits


def redact_text(text: str) -> tuple[str, int]:
    """Redact ``text``. Returns ``(redacted, hits)``; never raises.

    ``hits`` is a count and nothing more — the number is safe to record in
    ``meta.redaction``, the matched bytes never are.
    """
    if not isinstance(text, str) or not text:
        return (text if isinstance(text, str) else "", 0)
    try:
        total = 0
        out = text
        for name, pattern in RULES:
            marker = f"[redacted:{name}]"
            out, count = pattern.subn(marker, out)
            total += count
        out, count = _redact_generic(out)
        return out, total + count
    except Exception:
        # A redactor that raises inside a git hook is a redactor that blocks a
        # commit. Dropping the text is the safe failure: never emit the original.
        return "[redacted:error]", 1


def redact_all(values: list[str]) -> tuple[list[str], int]:
    """Redact every string in a list, summing the hit counts."""
    out: list[str] = []
    total = 0
    for value in values or []:
        redacted, hits = redact_text(value if isinstance(value, str) else "")
        out.append(redacted)
        total += hits
    return out, total


# The IngestEvent text surface. Hooks call redact_event and never learn these.
_SPAN_TEXT_FIELDS = ("input", "output", "error_message")
_EVENT_TEXT_FIELDS = ("prompt", "response")


def redact_event(event: dict) -> tuple[dict, int]:
    """Redact span and simple-form text on an IngestEvent. Never raises.

    Mutates ``event`` in place. Always stamps ``event["redaction"]`` so the
    server can later show what was scrubbed (IngestEvent is ``extra="allow"``).
    """
    if not isinstance(event, dict):
        return {}, 0
    try:
        total = 0
        spans = event.get("spans")
        if isinstance(spans, list):
            for span in spans:
                if not isinstance(span, dict):
                    continue
                for field in _SPAN_TEXT_FIELDS:
                    value = span.get(field)
                    if isinstance(value, str):
                        redacted, hits = redact_text(value)
                        span[field] = redacted
                        total += hits
        for field in _EVENT_TEXT_FIELDS:
            value = event.get(field)
            if isinstance(value, str):
                redacted, hits = redact_text(value)
                event[field] = redacted
                total += hits
        event["redaction"] = {"v": REDACTION_V, "hits": total}
        return event, total
    except Exception:
        return event, 0


def rule_count() -> int:
    """Number of active rules, recorded as ``meta.redaction.rules``."""
    return len(RULES) + 1  # named rules + the generic entropy rule
