/**
 * canonical.js — map Cursor hook payloads to Octarin canonical IngestEvents.
 *
 * Cursor fires a separate process per hook event (beforeSubmitPrompt,
 * afterAgentResponse, afterFileEdit, stop, ...), so each event becomes its own
 * IngestEvent carrying one span. All events for a conversation share a
 * deterministic trace_id (derived from `conversation_id`) so the backend rolls
 * them into a single trace. Shape: backend/app/schema/canonical.py::IngestEvent.
 */

import { SOURCE, truncate, nowIso, userRef, deterministicTraceId } from "./utils.js";

function repoFromRoots(roots) {
  if (!Array.isArray(roots) || roots.length === 0) return null;
  const r = String(roots[0]);
  return r.split("/").filter(Boolean).pop() || null;
}

/** Wrap one span into a full IngestEvent for the given conversation. */
function envelope(input, span, model) {
  const conv = input.conversation_id || input.generation_id || "cursor-session";
  return {
    trace_id: deterministicTraceId(conv),
    source: SOURCE,
    session_id: input.conversation_id || null,
    // Prefer the signed-in email Cursor puts on the event; else resolve a real
    // identity (git / OS user) rather than an opaque machine hash.
    user_ref: (input.user_email || "").trim() || userRef(),
    repo: repoFromRoots(input.workspace_roots),
    model: model || input.model || null,
    spans: [span],
    start_time: span.start_time,
    end_time: span.end_time,
  };
}

function baseSpan(spanId, name, spanType) {
  const ts = nowIso();
  return {
    span_id: spanId,
    parent_span_id: null,
    name,
    span_type: spanType,
    start_time: ts,
    end_time: ts,
    status: "ok",
    attributes: {},
  };
}

function spanId(input, suffix) {
  const conv = input.conversation_id || "conv";
  const gen = input.generation_id || Date.now();
  return `${conv}:${gen}:${suffix}`;
}

/**
 * Cursor `afterAgentResponse` carries the model output.
 *
 * TOKEN USAGE: as of Cursor 1.7 NO hook event exposes per-turn token usage —
 * the documented `afterAgentResponse` fields are only `text` (+ the shared
 * envelope: conversation_id, generation_id, model, workspace_roots,
 * transcript_path, ...). There is no `usage`, `input_tokens`, or `output_tokens`
 * anywhere in the hook payload, so these spans legitimately carry 0 tokens (not
 * a capture bug). The lookup below stays defensive against several possible
 * field shapes so we transparently pick usage up IF a future Cursor version
 * starts emitting it — but we never fabricate counts when it is absent.
 * (`preCompact.context_tokens` is context-window utilisation, not billable
 * usage, so we deliberately do not treat it as tokens.)
 */
function fromAfterAgentResponse(input) {
  const span = baseSpan(spanId(input, "gen"), "Cursor agent response", "llm");
  span.model = input.model || null;
  span.input = truncate(input.prompt || "");
  span.output = truncate(input.text || "");
  const usage = input.usage || input.token_usage || input.tokens || {};
  span.input_tokens = Number(usage.input_tokens || usage.prompt_tokens || 0) || 0;
  span.output_tokens = Number(usage.output_tokens || usage.completion_tokens || 0) || 0;
  span.cache_read_tokens =
    Number(usage.cache_read_input_tokens || usage.cached_input_tokens || 0) || 0;
  span.cache_write_tokens =
    Number(usage.cache_creation_input_tokens || usage.cache_write_tokens || 0) || 0;
  span.total_tokens =
    Number(usage.total_tokens || 0) || span.input_tokens + span.output_tokens;
  span.attributes = {
    generation_id: input.generation_id,
    hook: "afterAgentResponse",
    // Flag when Cursor supplied no usage so the gap is visible downstream
    // rather than looking like a silently-dropped count.
    usage_available: Object.keys(usage).length > 0,
  };
  return envelope(input, span, input.model);
}

/** `beforeSubmitPrompt` records the user turn (no tokens yet). */
function fromBeforeSubmitPrompt(input) {
  const span = baseSpan(spanId(input, "prompt"), "Cursor user prompt", "agent");
  span.input = truncate(input.prompt || "");
  span.attributes = {
    generation_id: input.generation_id,
    attachment_count: (input.attachments || []).length,
    hook: "beforeSubmitPrompt",
  };
  return envelope(input, span, input.model);
}

function asText(v) {
  if (v == null) return "";
  return typeof v === "string" ? v : JSON.stringify(v);
}

/**
 * Tool span id keyed on Cursor's `tool_use_id` (unique per call) so multiple
 * tools in ONE turn don't collide on the same id and get deduped to one (the
 * old `afterFileEdit` keyed on conversation:generation, so 3 edits in a turn
 * overwrote each other). Falls back to a per-call unique when absent.
 */
function toolSpanId(input) {
  const conv = input.conversation_id || "conv";
  return `${conv}:tool:${input.tool_use_id || input.generation_id || Date.now()}`;
}

/**
 * `postToolUse` — the GENERIC post-tool hook; fires for EVERY tool (edit, shell,
 * read, MCP, ...) with its result. Replaces the per-tool afterFileEdit /
 * afterShellExecution / afterMCPExecution (which would double-count).
 */
function fromPostToolUse(input) {
  const tool = input.tool_name || "tool";
  const span = baseSpan(toolSpanId(input), tool, "tool");
  // Cursor never exposes token usage, so the backend estimates tool spans from
  // their I/O — stamp the session model so the estimate prices at its real rate.
  span.model = input.model || null;
  span.input = truncate(asText(input.tool_input));
  span.output = truncate(asText(input.tool_output));
  span.attributes = {
    tool_name: tool,
    tool_use_id: input.tool_use_id,
    duration_ms: input.duration,
    hook: "postToolUse",
  };
  return envelope(input, span, input.model);
}

/** `postToolUseFailure` — a tool that errored; this is what powers a real
 *  Cursor error rate (status=error, failure_type, is_interrupt). */
function fromPostToolUseFailure(input) {
  const tool = input.tool_name || "tool";
  const span = baseSpan(toolSpanId(input), tool, "tool");
  span.model = input.model || null;
  span.status = "error";
  span.error_message = input.error_message || input.failure_type || "tool failed";
  span.input = truncate(asText(input.tool_input));
  span.attributes = {
    tool_name: tool,
    tool_use_id: input.tool_use_id,
    failure_type: input.failure_type,
    is_interrupt: input.is_interrupt,
    duration_ms: input.duration,
    hook: "postToolUseFailure",
  };
  return envelope(input, span, input.model);
}

/** `sessionStart` — explicit session boundary (identity rides the envelope). */
function fromSessionStart(input) {
  const span = baseSpan(spanId(input, "session-start"), "Cursor session start", "agent");
  span.attributes = {
    session_id: input.session_id,
    is_background_agent: input.is_background_agent,
    composer_mode: input.composer_mode,
    hook: "sessionStart",
  };
  return envelope(input, span, input.model);
}

/** `sessionEnd` — richer close than `stop`: final status + reason + duration. */
function fromSessionEnd(input) {
  const span = baseSpan(spanId(input, "session-end"), "Cursor session end", "agent");
  span.status = input.final_status === "error" ? "error" : "ok";
  if (span.status === "error") span.error_message = input.error_message || "session error";
  span.attributes = {
    session_id: input.session_id,
    reason: input.reason,
    final_status: input.final_status,
    duration_ms: input.duration_ms,
    hook: "sessionEnd",
  };
  return envelope(input, span, input.model);
}

/**
 * `preCompact` — context-window compaction signal. NOTE: `context_tokens` here
 * is context UTILISATION, not billable usage, so it is deliberately NOT mapped
 * to span tokens (no Cursor hook exposes real usage).
 */
function fromPreCompact(input) {
  const span = baseSpan(
    spanId(input, `compact-${input.message_count || 0}`),
    "Context compaction",
    "agent",
  );
  span.attributes = {
    hook: "preCompact",
    trigger: input.trigger,
    context_usage_percent: input.context_usage_percent,
    context_tokens: input.context_tokens,
    context_window_size: input.context_window_size,
    message_count: input.message_count,
    messages_to_compact: input.messages_to_compact,
    is_first_compaction: input.is_first_compaction,
  };
  return envelope(input, span, input.model);
}

/** `stop` records task completion + status. */
function fromStop(input) {
  const span = baseSpan(spanId(input, "stop"), "Cursor agent stopped", "agent");
  span.status = input.status === "error" ? "error" : "ok";
  if (input.status === "error") span.error_message = "agent error";
  span.attributes = { status: input.status, loop_count: input.loop_count, hook: "stop" };
  return envelope(input, span, input.model);
}

const BUILDERS = {
  sessionStart: fromSessionStart,
  beforeSubmitPrompt: fromBeforeSubmitPrompt,
  afterAgentResponse: fromAfterAgentResponse,
  postToolUse: fromPostToolUse,
  postToolUseFailure: fromPostToolUseFailure,
  preCompact: fromPreCompact,
  stop: fromStop,
  sessionEnd: fromSessionEnd,
};

/**
 * Build an IngestEvent for a Cursor hook event, or null if this event carries
 * nothing worth sending. `hookName` falls back to `input.hook_event_name`.
 */
export function buildEvent(hookName, input) {
  const name = hookName || input.hook_event_name;
  const builder = BUILDERS[name];
  return builder ? builder(input) : null;
}
