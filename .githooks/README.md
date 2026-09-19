# `.githooks/` — Octarin's committed, opt-in git hook path

These files let Octarin link your team's **commits** to the **AI coding sessions**
that produced them, so `why_this_code(path, line)` can answer "how was this
developed, and what did we already decide here".

Committing the files changes **nothing** on its own. Nobody's git behaviour
changes until someone opts in, per clone:

```bash
git config core.hooksPath .githooks     # enable
git config --unset core.hooksPath       # undo
```

That is deliberate: `core.hooksPath` is a real, machine-affecting setting, and
`octarin init-repo` will never flip it for your teammates behind their backs.

## You probably don't need this

The normal install (`npx octarin-cli@latest init`) sets a **global** hook path on
each teammate's own machine and captures commits in every repo. This committed
path exists for the cases the global install can't reach:

- machines where global git config is locked down;
- CI or container checkouts;
- teams that prefer hooks to be reviewable in the repo.

## What each file does

- `octarin-dispatch.sh` — all the logic. For the four POST hooks
  (`post-commit`, `post-rewrite`, `post-merge`, `post-checkout`) it runs the
  machine-level collector at `~/.octarin/git/`, **fully detached with a
  watchdog**, output discarded. With no Octarin installed on this machine that
  step is a silent no-op. No Octarin work happens in any blocking hook.
- every other file — a 3-line wrapper for one git hook name.

Everything here except this README is **generated** in Octarin's own repo, from
the machine-install dispatcher, so the two copies cannot drift apart. Don't edit
these files in place — the next regeneration would overwrite you. Repo-specific
hooks belong in your own `.git/hooks/`, which the dispatcher chains to.

  (`post-commit`, `post-rewrite`, `post-merge`, `post-checkout`) it hands off to
  the machine-level collector at `~/.octarin/git/`, **backgrounded**, output
  discarded. No Octarin work happens in any blocking hook.
- every other file — a 3-line wrapper for one git hook name.

**Why 28 wrappers?** Setting `core.hooksPath` makes git stop reading
`.git/hooks/` *entirely*. A hook path that only implements `post-commit` silently
disables every other hook in the repo — including the less-known names
(`proc-receive`, `post-index-change`, the `p4-*` family). So every name git
supports gets a stub, and the dispatcher **forwards** `"$@"` and stdin to the
first executable file it finds, propagating that hook's exit code **verbatim**:

1. `git rev-parse --git-path hooks` — the *configured* hooks dir. This honours
   `core.hooksPath`, so here it is usually this directory; a realpath self-check
   rejects it, which is also the recursion guard.
2. `<git-dir>/hooks` — this worktree's own dir, which `core.hooksPath` shadows.
3. `<git-common-dir>/hooks` — **in a linked worktree** `<git-dir>` is
   `.git/worktrees/<name>` and holds no `hooks/`; git's real hooks live in the
   common dir.
4. `<toplevel>/.husky/` — only when `.husky/_` exists, so a hook the user
   actually uninstalled is never resurrected.
5. `$OCTARIN_PREV_HOOKS_PATH` — whatever `core.hooksPath` was set to before.

Only `post-rewrite`'s stdin is copied (Octarin reads its `old-sha new-sha`
pairs); every other stdin hook reads the real stream untouched. Bare repos work:
`--show-toplevel` is fatal outside a work tree, so it gets its own `rev-parse`
call and cannot take the receive-side hooks down with it.

## Interaction with husky / lefthook / pre-commit

husky sets its own repo-local `core.hooksPath` (`.husky/_`), and only one
`core.hooksPath` can be in effect at a time. **If your repo uses husky, do not
switch to `.githooks`** — use the global machine install instead (`octarin init`
detects a repo-local hook path and installs a chained `post-commit` into it).

`lefthook` and the `pre-commit` framework install into `.git/hooks/`, so they are
picked up by the chain above and keep working.

## No source code leaves your machine

The collector sends commit metadata only: SHA, author, timestamps, message,
paths, ± counts, and hunk **line ranges**. Never a diff, never file contents.
The line ranges are what make line-level `blame_sessions` possible with no
source-code egress.

## Relationship to the machine install

This directory is a deliberate second copy of `clients/git/dispatcher.sh` — but a
*derived* one. It ships **inside your repo**, so it cannot depend on `~/.octarin/`
state, and it reads its previous-hooksPath from `$OCTARIN_PREV_HOOKS_PATH` rather
than `~/.octarin/git/config.json`. Everything else — the chain order, the stdin
handling, the exit-code passthrough, the hook-name set — is copied from the
machine dispatcher verbatim by a generator, and a test in Octarin's own repo
fails the build if these files stop matching it.
This directory is a deliberate second copy of `clients/git/dispatcher.sh`: it
ships **inside your repo**, so it cannot depend on `~/.octarin/` state, and it
reads its previous-hooksPath from `$OCTARIN_PREV_HOOKS_PATH` rather than
`~/.octarin/git/config.json`. The chaining semantics and the hook-name set are
identical, and a test in Octarin's own repo asserts the two never drift.

## Uninstall

```bash
git config --unset core.hooksPath
```

Nothing else to undo — these files are inert unless `core.hooksPath` points here.
