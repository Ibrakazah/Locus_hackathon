#!/usr/bin/env node
/**
 * hook-handler.js — Cursor -> Octarin capture hook entry point.
 *
 * Registered for the key Cursor hook events in hooks.json. Cursor pipes one
 * JSON payload on stdin and reads one JSON line on stdout (the hook's
 * permission/continue response). This handler reads the payload, builds a
 * canonical IngestEvent (lib/canonical.js), POSTs it to Octarin
 * (`${OCTARIN_INGEST_URL:-$OCTARIN_API_BASE/v1/ingest}`, Bearer
 * `$OCTARIN_API_KEY`), then emits a permissive `{ continue: true }` response.
 *
 * Fail-open: any error still prints an allow response and exits 0 so Cursor is
 * never blocked. Zero npm dependencies — raw `node:https` POST.
 */

import { readStdin, postEvent } from "./lib/utils.js";
import { buildEvent } from "./lib/canonical.js";

const ALLOW = { continue: true, permission: "allow" };

async function main() {
  let response = ALLOW;
  try {
    const input = await readStdin();
    const event = buildEvent(input.hook_event_name, input);
    if (event) {
      try {
        const { redactEvent } = await import("./lib/redact.js");
        redactEvent(event);
      } catch {
        /* fail-open — an older install without redact.js must keep capturing */
      }
      // Hard-capped by the 5s timeout inside postEvent; never throws.
      await postEvent(event);
    }
  } catch {
    response = ALLOW;
  }
  try {
    process.stdout.write(JSON.stringify(response) + "\n");
  } catch {
    // ignore
  }
  process.exit(0);
}

main();
