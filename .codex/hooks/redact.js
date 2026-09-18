/**
 * redact.js — the JS twin of `clients/git/redact.py`.
 *
 * Same rules, same order, same markers. The two implementations exist because
 * capture is written in two languages and the local spool redacts on write; they
 * are kept honest by a shared, language-neutral fixture
 * (`clients/git/fixtures/checkpoints/redaction_cases.json`), which both suites
 * replay. Change a rule here and you must change it there — the fixture is what
 * makes the drift fail loudly instead of silently leaking from one client only.
 *
 * Ordering is behaviour, not style: specific rules run before general ones, so a
 * Postgres DSN is reported as a connection string rather than a generic
 * credentialed URL.
 *
 * Zero dependencies, never throws.
 */

export const REDACTION_V = 2;

const MIN_TOKEN_CHARS = 32;
const MIN_ENTROPY_BITS = 3.5;

/** Ordered. The first rule to match a span owns it. */
export const RULES = [
  [
    "private_key",
    /-----BEGIN[ A-Z]*PRIVATE KEY-----[\s\S]*?-----END[ A-Z]*PRIVATE KEY-----/g,
  ],
  ["jwt", /\beyJ[A-Za-z0-9_-]{6,}\.eyJ[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}/g],
  [
    "connection_string",
    /\b(?:postgres|postgresql|mysql|mariadb|mongodb(?:\+srv)?|redis|rediss|amqp|amqps):\/\/[^\s:/@]+:[^\s@]+@[^\s]+/gi,
  ],
  ["credentialed_url", /\b[a-z][a-z0-9+.-]*:\/\/[^\s:/@]+:[^\s@]+@[^\s]+/gi],
  ["aws_key", /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g],
  ["google_key", /\bAIza[0-9A-Za-z_-]{35}\b/g],
  [
    "provider_key",
    /\b(?:sk-[A-Za-z0-9_-]{16,}|oct_[A-Za-z0-9_-]{16,}|gh[pousr]_[A-Za-z0-9]{16,}|xox[baprs]-[A-Za-z0-9-]{10,}|glpat-[A-Za-z0-9_-]{16,}|npm_[A-Za-z0-9]{30,})/g,
  ],
  // One rule per vendor below, so the marker names what leaked. Every pattern
  // is anchored on a distinctive vendor prefix — never a bare keyword like
  // `password=` — because over-redaction destroys the prose this tool keeps.
  ["stripe_key", /\b(?:sk|rk)_(?:live|test|prod)_[A-Za-z0-9]{10,}/g],
  ["sendgrid_key", /\bSG\.[A-Za-z0-9_-]{16,32}\.[A-Za-z0-9_-]{16,64}\b/g],
  // 34 chars total: the exact SID shape, hex tail, hard boundaries. `SK` alone
  // would be far too generic; the full shape cannot occur in prose.
  ["twilio_key", /\bSK[0-9a-fA-F]{32}\b/g],
  [
    "slack_webhook",
    /(?:https?:\/\/)?hooks\.slack\.com\/(?:services|workflows|triggers)\/[A-Za-z0-9+/]{40,}/g,
  ],
  ["huggingface_token", /\bhf_[A-Za-z0-9]{30,}/g],
  // PyPI macaroons: base64 of the location header, so `pypi-AgE` is fixed for
  // both pypi.org and test.pypi.org tokens.
  ["pypi_token", /\bpypi-AgE[A-Za-z0-9_-]{40,}/g],
  ["shopify_token", /\bshp(?:at|ca|pa|ss)_[a-fA-F0-9]{32}\b/g],
  ["digitalocean_token", /\bdo[opr]_v1_[a-f0-9]{64}\b/g],
  ["databricks_token", /\bdapi[a-f0-9]{32}(?:-\d)?\b/g],
  // `pat` is an English word; the exact 14-char id plus 64-hex tail is not.
  ["airtable_pat", /\bpat[A-Za-z0-9]{14}\.[a-f0-9]{64}\b/g],
  ["figma_token", /\bfigd_[A-Za-z0-9_-]{20,}/g],
  ["notion_token", /\bntn_[A-Za-z0-9]{40,}/g],
  // Fine-grained PATs; NOT covered by the classic gh[pousr]_ rule above.
  ["github_pat", /\bgithub_pat_[A-Za-z0-9_]{36,}/g],
  ["gitlab_runner_token", /\bglrt-[A-Za-z0-9_-]{20,}/g],
  ["linear_key", /\blin_api_[A-Za-z0-9]{32,}/g],
];

const CANDIDATE_TOKEN_RE = new RegExp(`[A-Za-z0-9_\\-+/=]{${MIN_TOKEN_CHARS},}`, "g");

/** Bits of entropy per character. */
function shannonEntropy(text) {
  if (!text) return 0;
  const counts = new Map();
  for (const char of text) counts.set(char, (counts.get(char) || 0) + 1);
  let bits = 0;
  for (const n of counts.values()) {
    const p = n / text.length;
    bits -= p * Math.log2(p);
  }
  return bits;
}

/**
 * Length, class mix AND entropy — all three. Requiring a digit and both letter
 * cases is what spares `getCurrentWorkingDirectory` and a lowercase-hex git SHA,
 * the two long strings that genuinely turn up in commit-time text.
 */
function looksLikeASecret(token) {
  if (token.length < MIN_TOKEN_CHARS) return false;
  if (!/[a-z]/.test(token)) return false;
  if (!/[A-Z]/.test(token)) return false;
  if (!/[0-9]/.test(token)) return false;
  return shannonEntropy(token) >= MIN_ENTROPY_BITS;
}

/**
 * Redact `text`. Returns `{ text, hits }`; `hits` is a count and never the
 * matched bytes, so it is safe to record in checkpoint metadata.
 */
export function redactText(text) {
  if (typeof text !== "string" || text === "") return { text: "", hits: 0 };
  try {
    let out = text;
    let hits = 0;
    for (const [name, pattern] of RULES) {
      const marker = `[redacted:${name}]`;
      out = out.replace(new RegExp(pattern.source, pattern.flags), () => {
        hits += 1;
        return marker;
      });
    }
    out = out.replace(CANDIDATE_TOKEN_RE, (token) => {
      if (!looksLikeASecret(token)) return token;
      hits += 1;
      return "[redacted:generic_token]";
    });
    return { text: out, hits };
  } catch {
    // A redactor that throws inside a capture hook must not emit the original.
    return { text: "[redacted:error]", hits: 1 };
  }
}

/** Number of active rules, recorded as `meta.redaction.rules`. */
export function ruleCount() {
  return RULES.length + 1; // named rules + the generic entropy rule
}

// The IngestEvent text surface. Hooks call redactEvent and never learn these.
const SPAN_TEXT_FIELDS = ["input", "output", "error_message"];
const EVENT_TEXT_FIELDS = ["prompt", "response"];

/**
 * Redact span and simple-form text on an IngestEvent. Never throws.
 * Mutates `event` in place and stamps `event.redaction`.
 */
export function redactEvent(event) {
  if (!event || typeof event !== "object") return { event: {}, hits: 0 };
  try {
    let hits = 0;
    if (Array.isArray(event.spans)) {
      for (const span of event.spans) {
        if (!span || typeof span !== "object") continue;
        for (const field of SPAN_TEXT_FIELDS) {
          if (typeof span[field] === "string") {
            const result = redactText(span[field]);
            span[field] = result.text;
            hits += result.hits;
          }
        }
      }
    }
    for (const field of EVENT_TEXT_FIELDS) {
      if (typeof event[field] === "string") {
        const result = redactText(event[field]);
        event[field] = result.text;
        hits += result.hits;
      }
    }
    event.redaction = { v: REDACTION_V, hits };
    return { event, hits };
  } catch {
    return { event, hits: 0 };
  }
}
