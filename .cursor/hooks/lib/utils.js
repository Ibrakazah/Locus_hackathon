/**
 * utils.js — tiny stdlib helpers for the Cursor -> Octarin capture hook.
 *
 * Zero npm dependencies: stdin reading, a raw `https`/`http` POST with a hard
 * timeout, a real-identity user_ref (git email / OS user), and a deterministic UUID5 (matching the
 * backend's trace-id namespace). Everything here is fail-open friendly — the
 * caller decides what to do on rejection.
 */

import fs from "node:fs";
import https from "node:https";
import http from "node:http";
import crypto from "node:crypto";
import os from "node:os";
import { execFileSync } from "node:child_process";

export const SOURCE = "cursor";
export const MAX_TEXT = 20000;
export const HTTP_TIMEOUT_MS = 5000;
// Same namespace as backend deterministic_trace_id so retries de-duplicate.
const TRACE_NAMESPACE = "6f8d2c1e-9a3b-4f5e-8c7d-1a2b3c4d5e6f";

export function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => {
      try {
        resolve(data.trim() ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });
    process.stdin.on("error", () => resolve({}));
  });
}

export function truncate(text) {
  if (typeof text !== "string") return text == null ? "" : String(text);
  return text.length <= MAX_TEXT ? text : text.slice(0, MAX_TEXT);
}

export function nowIso() {
  return new Date().toISOString();
}

/** The committing git identity, or "" if git isn't configured here. */
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
 * ingest key) rather than an opaque per-machine hash, so the dashboard shows who
 * actually did the work. When a per-user key is present the server overrides
 * this with the key owner anyway; a real identity here is what ANONYMOUS
 * (slug-only) sends rely on. Cursor exposes no signed-in account email locally,
 * so git is the best available signal (the backend prefers the event's
 * user_email when Cursor supplies one).
 */
export function userRef() {
  const env = (process.env.OCTARIN_USER || "").trim();
  if (env) return env;
  const email = gitEmail();
  if (email) return email;
  return os.userInfo().username || "unknown";
}

/** RFC-4122 v5 UUID from (namespace, name) — matches Python's uuid.uuid5. */
export function uuid5(name) {
  const ns = Buffer.from(TRACE_NAMESPACE.replace(/-/g, ""), "hex");
  const hash = crypto.createHash("sha1").update(Buffer.concat([ns, Buffer.from(name, "utf8")])).digest();
  const bytes = hash.subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50; // version 5
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function deterministicTraceId(sourceTraceId) {
  return uuid5(`${SOURCE}:${sourceTraceId}`);
}

/**
 * Fire-and-forget POST of an IngestEvent. Resolves true on 2xx, false otherwise.
 * Never throws — the hook must stay fail-open.
 *
 * Two auth modes (same as the Python hook):
 *  - Bearer: ``OCTARIN_API_KEY`` set → ``Authorization: Bearer …``.
 *  - Slug-only: only ``OCTARIN_PROJECT`` set → ``X-Octarin-Project: <slug>``
 *    header + the slug embedded in the body. Server enforces the project's
 *    ``allow_anonymous_ingest`` policy. On a ``auth_required`` 401 we print
 *    the one-time ``login.sh`` hint via the same marker mechanism the
 *    Python hook uses.
 */
export function postEvent(event) {
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

    // Embed `project` in the body for slug-auth (the server reads it from
    // EITHER the body or the X-Octarin-Project header). No-op when a Bearer
    // is present.
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
          // Strict-auth signal from the server — print the bootstrap hint once.
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

/**
 * Print the one-time stderr hint when the project requires per-user auth.
 * Marker file at ~/.octarin/hint.<sha12> so we don't re-print on every event.
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
    // fall through — better to nag once-a-session than to spam
  }
  process.stderr.write(
    `[octarin] project '${project}' now requires per-user auth. Run once to authorize:\n` +
      "[octarin]   curl -fsSL https://octarin.ai/hooks/login.sh | bash\n",
  );
}
