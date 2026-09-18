#!/usr/bin/env node
/**
 * hook.mjs — Antigravity (Google) -> Octarin capture hook (single file, zero deps).
 *
 * Wired as an Antigravity `Stop` hook (see clients/repo-template/dot-agents/hooks.json
 * and the global ~/.gemini/config/hooks.json that `octarin init` writes). Antigravity
 * invokes the hook at agent termination, passing one JSON payload on stdin shaped
 * roughly like:
 *     { "toolCall": {...}, "workspacePaths": ["/abs/repo"], "transcriptPath": "/abs/….jsonl" }
 * The payload itself carries NO token counts, so — exactly like the Codex hook — we
 * read usage from the session TRANSCRIPT it points at (`transcriptPath`).
 *
 * BEST-EFFORT / UNVERIFIED: Antigravity's transcript schema is not yet documented, so
 * `usageFromTranscript` is deliberately defensive. It scans every JSON object/line for
 * a usage-shaped sub-object and tolerates the three shapes we expect across Gemini /
 * OpenAI / Anthropic style records:
 *   - Gemini   : usageMetadata{ promptTokenCount, candidatesTokenCount, cachedContentTokenCount, totalTokenCount }
 *   - OpenAI   : usage{ input_tokens, output_tokens, cached_input_tokens, total_tokens }
 *   - Anthropic: usage{ input_tokens, output_tokens, cache_read_input_tokens }
 * Per-response usage objects are SUMMED (Gemini/Anthropic report per turn); a single
 * cumulative total object is taken as-is. Like the providers above, Gemini's
 * promptTokenCount INCLUDES cached, so billable input = prompt - cached and the cached
 * part rides in `cache_read_tokens` (matches clients/codex/hook.mjs + the backend's
 * de-fold convention). On any miss we fail open to 0 tokens — capture is never broken.
 *
 * It then builds one canonical IngestEvent (full `spans` form) and POSTs it to
 * `${OCTARIN_INGEST_URL:-$OCTARIN_API_BASE/v1/ingest}` with
 * `Authorization: Bearer $OCTARIN_API_KEY`. Pure Node stdlib, hard 5s timeout, and
 * fail-open: any error exits 0 (after emitting an `allow` decision) so Antigravity is
 * never blocked.
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

const SOURCE = "antigravity";
const PROVIDER = "google";
const MAX_TEXT = 20000;
const HTTP_TIMEOUT_MS = 5000;
const TRACE_NAMESPACE = "6f8d2c1e-9a3b-4f5e-8c7d-1a2b3c4d5e6f";

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
 * Resolve the engineer's real identity for attribution (OCTARIN_USER → git email →
 * OS user). A per-user key makes the server override this; a real identity is what
 * anonymous (slug-only) sends rely on. Mirrors codex/hook.mjs + backfill.py.
 */
function userRef() {
  const env = (process.env.OCTARIN_USER || "").trim();
  if (env) return env;
  const email = gitEmail();
  if (email) return email;
  return os.userInfo().username || "unknown";
}

/** RFC-4122 v5 UUID — matches the backend deterministic_trace_id namespace. */
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
    setTimeout(() => resolve(data), 1000).unref?.();
  });
}

async function readPayload() {
  // Antigravity passes the JSON on stdin; tolerate an argv form too (like Codex).
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
      "[octarin]   npx octarin-cli@latest login\n",
  );
}

// Team/repo variant of postEvent: when a teammate hasn't run `octarin login` yet
// (no OCTARIN_API_KEY, only the committed OCTARIN_PROJECT slug), send anonymously
// via the X-Octarin-Project header and nag once to authorize.
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
              const b = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
              if (b && b.error && b.error.code === "auth_required") {
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

/**
 * Pull a normalised {input,output,cached,total} out of one usage-shaped object,
 * tolerating Gemini (usageMetadata), OpenAI and Anthropic key names. Returns null
 * if the object doesn't look like usage. Counts are RAW (input still includes
 * cached for Gemini/OpenAI — de-folded by the caller).
 */
function readUsageObject(obj) {
  if (!obj || typeof obj !== "object") return null;
  const num = (...keys) => {
    for (const k of keys) {
      if (obj[k] != null && Number.isFinite(Number(obj[k]))) return Number(obj[k]);
    }
    return null;
  };
  const input = num("promptTokenCount", "input_tokens", "prompt_tokens", "inputTokens");
  const output = num("candidatesTokenCount", "output_tokens", "completion_tokens", "outputTokens");
  const cached = num(
    "cachedContentTokenCount",
    "cached_input_tokens",
    "cache_read_input_tokens",
    "cacheReadInputTokens",
  );
  const total = num("totalTokenCount", "total_tokens", "totalTokens");
  if (input == null && output == null && total == null && cached == null) return null;
  return { input: input || 0, output: output || 0, cached: cached || 0, total: total || 0 };
}

/** Recursively find the first usage-shaped object nested anywhere in `node`. */
function findUsageDeep(node, depth) {
  if (!node || typeof node !== "object" || depth > 6) return null;
  // A wrapper key Gemini uses; check it first so we don't grab a parent by mistake.
  for (const key of ["usageMetadata", "usage", "token_usage", "tokenUsage", "total_token_usage"]) {
    const u = readUsageObject(node[key]);
    if (u) return u;
  }
  const self = readUsageObject(node);
  if (self) return self;
  for (const v of Object.values(node)) {
    if (v && typeof v === "object") {
      const found = findUsageDeep(v, depth + 1);
      if (found) return found;
    }
  }
  return null;
}

/** Best-effort recursive scan for a model id and the latest assistant text. */
function scrapeModelAndText(node, acc, depth) {
  if (!node || typeof node !== "object" || depth > 6) return;
  if (typeof node.model === "string" && node.model) acc.model = node.model;
  if (typeof node.modelId === "string" && node.modelId) acc.model = node.modelId;
  const role = node.role || node.author;
  if ((role === "assistant" || role === "model") && typeof node.text === "string") acc.text = node.text;
  if ((role === "assistant" || role === "model") && typeof node.content === "string") acc.text = node.content;
  for (const v of Object.values(node)) {
    if (v && typeof v === "object") scrapeModelAndText(v, acc, depth + 1);
  }
}

/**
 * Parse an Antigravity transcript (JSONL preferred, single-JSON fallback) and return
 * `{ inputTokens, cachedTokens, outputTokens, totalTokens, model }` with cached
 * de-folded out of input. Per-turn usage objects are summed; a lone cumulative total
 * object is used as-is. Never throws — returns all-zero on any failure.
 */
function usageFromTranscript(file) {
  const zero = { inputTokens: 0, cachedTokens: 0, outputTokens: 0, totalTokens: 0, model: null };
  let raw;
  try {
    raw = fs.readFileSync(file, "utf8");
  } catch {
    return zero;
  }

  const records = [];
  // Try JSONL first (one record per line), then a single JSON document.
  let anyLine = false;
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t) continue;
    try {
      records.push(JSON.parse(t));
      anyLine = true;
    } catch {
      /* not a JSONL line */
    }
  }
  if (!anyLine) {
    try {
      const doc = JSON.parse(raw);
      if (Array.isArray(doc)) records.push(...doc);
      else records.push(doc);
    } catch {
      return zero;
    }
  }

  const acc = { model: null, text: null };
  let sum = { input: 0, output: 0, cached: 0, total: 0 };
  let nUsage = 0;
  for (const rec of records) {
    scrapeModelAndText(rec, acc, 0);
    const u = findUsageDeep(rec, 0);
    if (u) {
      sum.input += u.input;
      sum.output += u.output;
      sum.cached += u.cached;
      sum.total += u.total;
      nUsage += 1;
    }
  }
  if (nUsage === 0) return { ...zero, model: acc.model };

  const cachedTokens = sum.cached;
  // Gemini/OpenAI fold cached into the prompt count; de-fold so cache_read bills
  // separately. We deliberately recompute total as fresh input + output rather than
  // trusting the provider total (Gemini's totalTokenCount INCLUDES cached): the
  // backend only de-folds the `codex` source (_OPENAI_USAGE_SOURCES), so for
  // antigravity we must already send the Anthropic convention — input/total exclude
  // cache, which rides in its own cache_read column.
  const inputTokens = Math.max(0, sum.input - cachedTokens);
  const outputTokens = sum.output;
  const totalTokens = inputTokens + outputTokens;
  return { inputTokens, cachedTokens, outputTokens, totalTokens, model: acc.model };
}

/** Build a canonical IngestEvent from an Antigravity Stop payload. */
function buildEvent(p) {
  const transcriptPath =
    p.transcriptPath || p.transcript_path || p.transcript || null;
  const workspaces = p.workspacePaths || p.workspace_paths || p["workspace-roots"];
  const cwd =
    (Array.isArray(workspaces) ? workspaces[0] : workspaces) || p.cwd || p.workspace || null;
  const repo = cwd ? String(cwd).split("/").filter(Boolean).pop() : null;

  let sessionId =
    p.conversationId ||
    p.conversation_id ||
    p.sessionId ||
    p.session_id ||
    p.threadId ||
    p.thread_id ||
    null;

  // 1) Usage straight off the payload, if a future Antigravity adds it.
  let usage = readUsageObject(p.usage || p.usageMetadata || p.token_usage);
  let inTok = 0;
  let outTok = 0;
  let cacheRead = 0;
  let totalTok = 0;
  let model = p.model || p.modelId || null;
  let output = "";

  if (usage) {
    cacheRead = usage.cached;
    inTok = Math.max(0, usage.input - cacheRead);
    outTok = usage.output;
  }

  // 2) The real path: derive usage (and model/text) from the session transcript.
  if (inTok === 0 && outTok === 0 && cacheRead === 0 && transcriptPath) {
    const r = usageFromTranscript(transcriptPath);
    inTok = r.inputTokens;
    outTok = r.outputTokens;
    cacheRead = r.cachedTokens;
    if (!model && r.model) model = r.model;
  }
  // Anthropic convention (see usageFromTranscript): total excludes cache.
  totalTok = inTok + outTok;

  // Stable id: prefer a session/conversation id; else derive one from the transcript
  // path so every Stop for one session collapses onto a single trace (the backend
  // dedups by deterministic trace id, ReplacingMergeTree).
  if (!sessionId && transcriptPath) {
    sessionId = path.basename(String(transcriptPath)).replace(/\.[a-z]+$/i, "") || null;
  }
  const conv = sessionId || "antigravity-session";

  const ts = new Date().toISOString();
  const span = {
    span_id: `${conv}:gen`,
    parent_span_id: null,
    name: model ? `Antigravity session (${model})` : "Antigravity session",
    span_type: "llm",
    start_time: ts,
    end_time: ts,
    model,
    provider: PROVIDER,
    input: null,
    output: truncate(output) || null,
    input_tokens: inTok,
    output_tokens: outTok,
    total_tokens: totalTok,
    cache_read_tokens: cacheRead,
    cache_write_tokens: 0,
    status: p.status === "error" ? "error" : "ok",
    attributes: { type: p.type || p.event || "stop" },
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
  // Antigravity reads a decision on stdout; allow is the non-blocking answer.
  try {
    process.stdout.write(JSON.stringify({ decision: "allow" }) + "\n");
  } catch {
    /* ignore */
  }
  process.exit(0);
}

// Run only when invoked directly (Antigravity). When imported by a test, the module
// just exposes its pure functions and does nothing.
const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  main();
}

export { buildEvent, usageFromTranscript, readUsageObject, findUsageDeep };
