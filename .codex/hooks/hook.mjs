#!/usr/bin/env node
/**
 * hook.mjs — Codex -> Octarin capture hook (single unbundled file, zero deps).
 *
 * Wired as a Codex `notify` / stop hook: Codex invokes it at turn/session end,
 * passing a JSON payload either as argv[2] or on stdin. The payload carries the
 * turn id, the last assistant message, and the cwd. This builds one canonical
 * IngestEvent (full `spans` form) and POSTs it to
 * `${OCTARIN_INGEST_URL:-$OCTARIN_API_BASE/v1/ingest}` with
 * `Authorization: Bearer $OCTARIN_API_KEY`.
 *
 * TOKEN USAGE: Codex's `notify` payload does NOT carry token counts (it only
 * has type / turn-id / input-messages / last-assistant-message / cwd). So we
 * read usage from the session's rollout JSONL that Codex writes under
 * `~/.codex/sessions/.../rollout-*.jsonl`. Those carry `event_msg` records of
 * type `token_count`, whose `info.total_token_usage` holds the cumulative
 * input / cached_input / output / total counts for the whole session. We locate
 * the current session's rollout file (by session id if the payload exposes one,
 * else the most-recently-modified file matching the payload `cwd`), read the
 * last `token_count` event, and populate the span + event token fields from it.
 *
 * OpenAI's `input_tokens` is the FULL prompt count INCLUDING cached tokens, so
 * billable (uncached) input = input_tokens - cached_input_tokens; the cached
 * part rides in `cache_read_tokens` (the backend bills it at the cache rate and
 * adds it into input cost — see backend/app/schema/prices.py::compute_cost).
 *
 * Pure Node stdlib (`node:https`, `node:fs`), hard 5s timeout, fail-open: any
 * error exits 0 so Codex is never blocked, and a missing/unparseable rollout
 * file just yields 0 tokens (capture is never broken).
 * Shape: backend/app/schema/canonical.py::IngestEvent.
 */

import https from "node:https";
import http from "node:http";
import crypto from "node:crypto";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";

const SOURCE = "codex";
const MAX_TEXT = 20000;
const HTTP_TIMEOUT_MS = 5000;
const TRACE_NAMESPACE = "6f8d2c1e-9a3b-4f5e-8c7d-1a2b3c4d5e6f";
// Only consider rollout files this much newer/older than "now" when matching
// the active session by recency, so a stale file from another machine/day is
// never picked up. The active session's file is written to seconds ago.
const ROLLOUT_RECENT_MS = 6 * 60 * 60 * 1000; // 6h

function truncate(text) {
  if (typeof text !== "string") return text == null ? "" : String(text);
  return text.length <= MAX_TEXT ? text : text.slice(0, MAX_TEXT);
}

function gitEmail() {
  try {
    return execFileSync("git", ["config", "user.email"], {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
  } catch {
    return "";
  }
}

/**
 * Resolve the engineer's real identity for attribution.
 *
 * Priority: an explicit OCTARIN_USER override → the git user.email → the OS
 * username. We attribute to a real person (matching backfill.py + the per-user
 * ingest key) rather than an opaque per-machine hash. When a per-user key is
 * present the server overrides this with the key owner anyway; a real identity
 * here is what ANONYMOUS (slug-only) sends rely on.
 */
function userRef() {
  const env = (process.env.OCTARIN_USER || "").trim();
  if (env) return env;
  const email = gitEmail();
  if (email) return email;
  return os.userInfo().username || "unknown";
}

function uuid5(name) {
  const ns = Buffer.from(TRACE_NAMESPACE.replace(/-/g, ""), "hex");
  const hash = crypto.createHash("sha1").update(Buffer.concat([ns, Buffer.from(name, "utf8")])).digest();
  const b = hash.subarray(0, 16);
  b[6] = (b[6] & 0x0f) | 0x50;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = b.toString("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

function readStdin() {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) return resolve("");
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (c) => (data += c));
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", () => resolve(data));
    // Guard against a stdin that never closes.
    setTimeout(() => resolve(data), 1000).unref?.();
  });
}

async function readPayload() {
  // Codex passes the JSON either as the last argv or on stdin.
  for (const arg of process.argv.slice(2)) {
    try {
      const parsed = JSON.parse(arg);
      if (parsed && typeof parsed === "object") return parsed;
    } catch {
      /* not json arg */
    }
  }
  const raw = await readStdin();
  try {
    return raw.trim() ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Print the one-time stderr hint when the project requires per-user auth.
 * Marker file at ~/.octarin/auth_hint.<sha12> so we don't re-print on every event.
 */
function notifyAuthRequiredOnce(project) {
  try {
    const home = process.env.HOME || process.env.USERPROFILE || "/tmp";
    const dir = `${home}/.octarin`;
    fs.mkdirSync(dir, { recursive: true });
    const sha = crypto.createHash("sha256").update(project).digest("hex").slice(0, 12);
    const marker = `${dir}/auth_hint.${sha}`;
    if (fs.existsSync(marker)) return;
    fs.writeFileSync(marker, "");
  } catch {
    // fall through — fail-open, better to nag once a session than spam
  }
  process.stderr.write(
    `[octarin] project '${project}' now requires per-user auth. Run once to authorize:\n` +
      "[octarin]   curl -fsSL https://octarin.ai/hooks/login.sh | bash\n",
  );
}

function postEvent(event) {
  return new Promise((resolve) => {
    let url = process.env.OCTARIN_INGEST_URL;
    if (!url) {
      const base = (process.env.OCTARIN_API_BASE || "").replace(/\/+$/, "");
      if (!base) return resolve(false);
      url = `${base}/v1/ingest`;
    }
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      return resolve(false);
    }
    const apiKey = process.env.OCTARIN_API_KEY || "";
    const project = (process.env.OCTARIN_PROJECT || "").trim();

    const payload = { ...event };
    if (project && payload.project == null) payload.project = project;

    const body = Buffer.from(JSON.stringify(payload), "utf8");
    const headers = { "Content-Type": "application/json", "Content-Length": body.length };
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
    else if (project) headers["X-Octarin-Project"] = project;

    const lib = parsed.protocol === "http:" ? http : https;
    const req = lib.request(
      {
        method: "POST",
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === "http:" ? 80 : 443),
        path: parsed.pathname + parsed.search,
        headers,
        timeout: HTTP_TIMEOUT_MS,
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const ok = res.statusCode >= 200 && res.statusCode < 300;
          if (!ok && res.statusCode === 401 && project && !apiKey) {
            try {
              const body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
              if (body && body.error && body.error.code === "auth_required") {
                notifyAuthRequiredOnce(project);
              }
            } catch {
              // ignore parse errors — hook stays fail-open
            }
          }
          resolve(ok);
        });
      },
    );
    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
    req.write(body);
    req.end();
  });
}

/** The Codex sessions root, honouring CODEX_HOME (defaults to ~/.codex). */
function codexSessionsRoot() {
  const home = process.env.CODEX_HOME
    ? process.env.CODEX_HOME
    : path.join(os.homedir() || "", ".codex");
  return path.join(home, "sessions");
}

/**
 * Recursively collect rollout-*.jsonl files under `dir`. Bounded + fail-open:
 * returns `[]` on any error and stops once `limit` files are gathered. The
 * sessions tree is shallow (YYYY/MM/DD), so this stays cheap.
 */
function collectRolloutFiles(dir, out, limit) {
  if (out.length >= limit) return;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const ent of entries) {
    if (out.length >= limit) return;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      collectRolloutFiles(full, out, limit);
    } else if (ent.isFile() && ent.name.startsWith("rollout-") && ent.name.endsWith(".jsonl")) {
      out.push(full);
    }
  }
}

/**
 * Locate the rollout file for the active session.
 *
 *  1. If a session id is known, prefer the file whose name embeds it
 *     (rollout files are named `rollout-<iso>-<session-id>.jsonl`).
 *  2. Otherwise (the common case — notify omits the id), pick the most
 *     recently modified rollout file. If `cwd` is known, restrict to files
 *     whose `session_meta.cwd` matches before falling back to plain recency.
 *
 * Returns an absolute path or null. Never throws.
 */
function findRolloutFile(sessionId, cwd) {
  const root = codexSessionsRoot();
  const files = [];
  collectRolloutFiles(root, files, 5000);
  if (files.length === 0) return null;

  if (sessionId) {
    const byId = files.find((f) => path.basename(f).includes(sessionId));
    if (byId) return byId;
  }

  // Sort newest-first by mtime so the active session (written seconds ago) wins.
  const stamped = [];
  for (const f of files) {
    try {
      stamped.push({ f, mtime: fs.statSync(f).mtimeMs });
    } catch {
      /* skip unreadable */
    }
  }
  stamped.sort((a, b) => b.mtime - a.mtime);

  // Ignore anything that hasn't been touched recently — guards against picking
  // up an old session when the current one wrote no rollout (no usage anyway).
  const fresh = stamped.filter((s) => Date.now() - s.mtime <= ROLLOUT_RECENT_MS);
  const pool = fresh.length ? fresh : stamped;

  if (cwd) {
    for (const s of pool) {
      if (rolloutCwd(s.f) === cwd) return s.f;
    }
  }
  return pool.length ? pool[0].f : null;
}

/** Read just the `session_meta.cwd` from a rollout file (first line). Null on miss. */
function rolloutCwd(file) {
  try {
    const head = fs.readFileSync(file, "utf8").split("\n", 1)[0];
    if (!head) return null;
    const obj = JSON.parse(head);
    if (obj && obj.type === "session_meta" && obj.payload && typeof obj.payload.cwd === "string") {
      return obj.payload.cwd;
    }
  } catch {
    /* fail-open */
  }
  return null;
}

/**
 * Pull a TokenUsage-shaped object out of a Codex `token_count` payload,
 * tolerating the shape drift across Codex versions:
 *   - newer: payload.info.total_token_usage
 *   - older: payload.total_token_usage  /  payload.info (flat)  /  payload (flat)
 * Returns the cumulative usage object, or null.
 */
function tokenUsageFromPayload(payload) {
  if (!payload || typeof payload !== "object") return null;
  const info = payload.info && typeof payload.info === "object" ? payload.info : payload;
  const candidate =
    (info && typeof info.total_token_usage === "object" && info.total_token_usage) ||
    (typeof payload.total_token_usage === "object" && payload.total_token_usage) ||
    info ||
    payload;
  if (!candidate || typeof candidate !== "object") return null;
  // Only accept it if it actually looks like a usage object.
  if (
    "input_tokens" in candidate ||
    "output_tokens" in candidate ||
    "total_tokens" in candidate ||
    "cached_input_tokens" in candidate
  ) {
    return candidate;
  }
  return null;
}

/**
 * Parse a Codex rollout JSONL file and return the session's cumulative token
 * usage from the LAST `token_count` event (these report running totals).
 * Falls back to summing per-turn `last_token_usage` if no cumulative total is
 * present. Also recovers the model when the notify payload omitted it.
 *
 * Returns `{ inputTokens, cachedTokens, outputTokens, totalTokens, model,
 * sessionId }` (all numeric except model/sessionId which may be null). Never
 * throws; returns all-zero on any failure so capture is preserved.
 */
function usageFromRollout(file) {
  const zero = {
    inputTokens: 0,
    cachedTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    model: null,
    sessionId: null,
  };
  let raw;
  try {
    raw = fs.readFileSync(file, "utf8");
  } catch {
    return zero;
  }

  let latestTotal = null; // cumulative usage from the most recent token_count
  let summedLast = null; // fallback: sum of per-turn last_token_usage
  let model = null;
  let sessionId = null;

  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let obj;
    try {
      obj = JSON.parse(trimmed);
    } catch {
      continue;
    }
    if (!obj || typeof obj !== "object") continue;
    const payload = obj.payload;

    if (obj.type === "session_meta" && payload && typeof payload === "object") {
      if (typeof payload.model === "string") model = payload.model;
      if (typeof payload.id === "string") sessionId = payload.id;
      continue;
    }
    if (payload && typeof payload === "object" && typeof payload.model === "string") {
      model = payload.model;
    }

    // token_count events are wrapped as {type:"event_msg", payload:{type:"token_count", ...}}
    const isTokenCount =
      (payload && payload.type === "token_count") || obj.type === "token_count";
    if (!isTokenCount) continue;

    const tcPayload = payload && payload.type === "token_count" ? payload : obj;
    const total = tokenUsageFromPayload(tcPayload);
    if (total) latestTotal = total;

    // Per-turn fallback: accumulate last_token_usage when present.
    const info = tcPayload.info && typeof tcPayload.info === "object" ? tcPayload.info : tcPayload;
    const last = info && typeof info.last_token_usage === "object" ? info.last_token_usage : null;
    if (last) {
      summedLast = summedLast || { input_tokens: 0, cached_input_tokens: 0, output_tokens: 0 };
      summedLast.input_tokens += Number(last.input_tokens) || 0;
      summedLast.cached_input_tokens += Number(last.cached_input_tokens) || 0;
      summedLast.output_tokens += Number(last.output_tokens) || 0;
    }
  }

  const usage = latestTotal || summedLast;
  if (!usage) return { ...zero, model, sessionId };

  const inputTotal = Number(usage.input_tokens) || 0;
  const cachedTokens = Number(usage.cached_input_tokens || usage.cache_read_input_tokens || 0) || 0;
  const outputTokens = Number(usage.output_tokens) || 0;
  // Codex's input_tokens INCLUDES cached; bill the uncached remainder at the
  // full input rate and the cached part at the cache_read rate.
  const inputTokens = Math.max(0, inputTotal - cachedTokens);
  const totalTokens = Number(usage.total_tokens) || inputTotal + outputTokens;

  return { inputTokens, cachedTokens, outputTokens, totalTokens, model, sessionId };
}

/** Extract the session id embedded in a rollout filename, or null. */
function sessionIdFromRolloutPath(file) {
  if (!file) return null;
  // rollout-<iso>-<uuid>.jsonl → trailing uuid-ish segment.
  const stem = path.basename(file).replace(/\.jsonl$/, "");
  const m = stem.match(/([0-9a-fA-F-]{8,})$/);
  return m ? m[1] : stem || null;
}

/** Best-effort pull of identity/usage from a Codex notify payload. */
function buildEvent(p) {
  let sessionId =
    p.conversation_id || p["conversation-id"] || p.session_id || p["session-id"] || p.thread_id || null;
  const cwd = p.cwd || p.workspace || (Array.isArray(p["workspace-roots"]) ? p["workspace-roots"][0] : null);
  const repo = cwd ? String(cwd).split("/").filter(Boolean).pop() : null;
  const input = p["input-messages"] || p.input || p.prompt;
  const inputText = Array.isArray(input) ? input.join("\n") : input;
  const output = p["last-assistant-message"] || p["last-agent-message"] || p.response || p.text || "";

  // 1) Usage straight from the payload, on the off chance a future Codex adds it.
  const usage = p.usage || p.token_usage || {};
  let inTok = Number(usage.input_tokens || usage.prompt_tokens || 0) || 0;
  let outTok = Number(usage.output_tokens || usage.completion_tokens || 0) || 0;
  let cacheRead = Number(usage.cached_input_tokens || usage.cache_read_input_tokens || 0) || 0;
  let totalTok = Number(usage.total_tokens) || 0;
  // OpenAI usage.input_tokens includes cached — normalise the same way as rollout.
  if (cacheRead && inTok >= cacheRead) inTok = inTok - cacheRead;

  // 2) Fallback (the real path): derive usage from the session's rollout JSONL.
  //    The rollout also yields a stable session id + the model when the notify
  //    payload omits them.
  let model = p.model || p["last-agent-model"] || null;
  if (inTok === 0 && outTok === 0 && cacheRead === 0) {
    const rollout = findRolloutFile(sessionId, cwd);
    if (rollout) {
      const r = usageFromRollout(rollout);
      inTok = r.inputTokens;
      outTok = r.outputTokens;
      cacheRead = r.cachedTokens;
      totalTok = r.totalTokens;
      if (!model && r.model) model = r.model;
      // Prefer the session id Codex recorded; this stabilises the trace id so
      // every per-turn notify for one session collapses onto a single trace
      // (the backend dedups by deterministic trace id, ReplacingMergeTree).
      if (!sessionId) sessionId = r.sessionId || sessionIdFromRolloutPath(rollout);
    }
  }
  if (!totalTok) totalTok = inTok + outTok;

  // Stable per-session identity. We DON'T mix in a timestamp here: the rollout
  // token_count totals are cumulative for the whole session, so each turn's
  // notify re-sends the same trace with a larger total and must REPLACE the
  // prior one rather than create a new trace.
  const conv = sessionId || "codex-session";

  const ts = new Date().toISOString();
  const span = {
    span_id: `${conv}:gen`,
    parent_span_id: null,
    name: model ? `Codex session (${model})` : "Codex session",
    span_type: "llm",
    start_time: ts,
    end_time: ts,
    model,
    provider: "openai",
    input: truncate(inputText || "") || null,
    output: truncate(output) || null,
    input_tokens: inTok,
    output_tokens: outTok,
    total_tokens: totalTok,
    cache_read_tokens: cacheRead,
    cache_write_tokens: 0,
    status: p.status === "error" ? "error" : "ok",
    attributes: { type: p.type || "agent-turn-complete" },
  };

  return {
    trace_id: uuid5(`${SOURCE}:${conv}`),
    source: SOURCE,
    session_id: String(conv),
    user_ref: userRef(),
    repo,
    model,
    spans: [span],
    start_time: ts,
    end_time: ts,
    input_tokens: inTok,
    output_tokens: outTok,
    total_tokens: totalTok,
    cache_read_tokens: cacheRead,
  };
}

async function main() {
  try {
    const payload = await readPayload();
    const event = buildEvent(payload);
    try {
      const { redactEvent } = await import("./redact.js");
      redactEvent(event);
    } catch {
      /* fail-open — an older install without redact.js must keep capturing */
    }
    await postEvent(event);
  } catch {
    /* fail-open */
  }
  process.exit(0);
}

// Run only when invoked directly (Codex). When imported by a test, the module
// just exposes its pure functions and does nothing.
const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  main();
}

export { buildEvent, usageFromRollout, findRolloutFile, tokenUsageFromPayload };
