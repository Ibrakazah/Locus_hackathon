<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- octarin:start -->
# Octarin — your git history, with the AI sessions behind it

This repo is connected to **Octarin** over MCP. Octarin holds your team's
**commits and pull requests linked to the AI coding sessions that produced
them** (Claude Code / Cursor / Codex — every file, decision, and run), plus a
curated, shared **Memory** of decisions, conventions, and gotchas. It's there so
you inherit context instead of rediscovering it — reach for it when it earns its
place, not as a reflex on every turn.

## Start from the sessions

- **About to edit a file whose history you don't know?** `memory_for_file(path)`
  — what the team recorded about that exact file, so you don't re-break a fix a
  teammate already landed.
- **Starting something non-trivial in an unfamiliar area?** `memory_recall(query)`
  to inherit durable decisions before you relitigate a settled one. (For a quick,
  self-contained edit, skip it.)
- **Sweeping rather than pinpointing?** `search_sessions` by topic or person —
  it is vector search, so a description works as well as a keyword. Drill into
  one session with `get_session(trace_id)`; pull the transcript only for exact
  steps.
- **Who's working on what right now?** `team_activity` — check for collisions
  before starting.

If a recall comes back with nothing on-topic, that's a fine answer — just proceed.
Octarin will tell you honestly when it has nothing for a file rather than invent
a link.

## Writing back

Learned something durable (a decision + its why, or a convention/gotcha/runbook)?
Record it with `memory_record_decision` or `memory_add`, anchored to the repo (and
the files it concerns) so the next session in that area sees it. A recall result
carries a `recall_id` — `memory_feedback(recall_id, …)` flags what was `useful`,
`not_relevant`, or `stale`, which trains recall for the whole team.

## Scope

Prefer compact/summary tools; fetch transcripts and full bodies only when needed.
`list_teammates` and `team_activity` are available to Engineer keys; spend totals,
`get_spending`, and the analytics tool are Full-access only — call
only the tools your key actually lists. A group-scoped key sees only its team's
sessions and memories.
<!-- octarin:end -->
