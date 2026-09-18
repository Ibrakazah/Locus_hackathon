#!/bin/sh
# ─────────────────────────────────────────────────────────────────────────────
# GENERATED FILE — DO NOT EDIT.
#
# Generated from `clients/git/dispatcher.sh` (Octarin's machine-install hook
# dispatcher) by `clients/git/gen_repo_template.py`. Everything except the few
# marked variant blocks is copied from it byte for byte, so the two copies of
# the dispatcher contract cannot drift. To change this file, change
# `clients/git/dispatcher.sh` (or the variant block in the generator) and run:
#
#     python3 clients/git/gen_repo_template.py
# ─────────────────────────────────────────────────────────────────────────────
# Octarin repo-level git hook dispatcher — the committed, OPT-IN hook path.
#
# The self-contained twin of `clients/git/dispatcher.sh` (the machine install).
# Identical chaining semantics and identical hook-name set — literally the same
# code — but no dependency on `~/.octarin/` state: this file is COMMITTED into
# the user's repo, so its previous-hooksPath comes from the environment
# ($OCTARIN_PREV_HOOKS_PATH) rather than from ~/.octarin/git/config.json, and it
# has no collectors of its own (it delegates to the machine install's, if the
# person running the hook happens to have one).
#
# Every other file next to this one is a 3-line wrapper that exports
# OCTARIN_HOOK_NAME and execs this script. It does two things, in this order:
#
#   1. Octarin's own capture, for POST hooks ONLY (post-commit, post-rewrite,
#      post-merge, post-checkout): run the machine-level collectors installed by
#      `octarin init` at ~/.octarin/git/. Fully detached with a watchdog, output
#      discarded, never able to fail your commit. If Octarin is not installed on
#      this machine this is a silent no-op — the hooks are committed for the
#      whole team, but only teammates who installed Octarin capture anything.
#
#   2. FORWARD to whatever hook the repo/teammate already had. This is the
#      load-bearing part: setting `core.hooksPath` makes git stop reading
#      `.git/hooks/` ENTIRELY, so a hook path that only implements post-commit
#      silently disables every other hook in the repo. We therefore ship a
#      wrapper for EVERY hook name git supports, forward "$@" and stdin, and
#      propagate the chained hook's exit code VERBATIM. Octarin does zero work in
#      any blocking hook (pre-commit, commit-msg, pre-push, …) — those are pure
#      passthrough.
#
# Chain order, first existing+executable file wins and owns the exit code:
#   a. `git rev-parse --git-path hooks` — the CONFIGURED hooks dir. Note this
#      DOES honour core.hooksPath, so under `core.hooksPath=.githooks` it is US;
#      the realpath self-check below rejects it. That is the recursion guard.
#   b. `<git-dir>/hooks` — this worktree's own dir, which core.hooksPath shadows.
#   c. `<git-common-dir>/hooks` — in a LINKED WORKTREE (b) is
#      `.git/worktrees/<name>`, which holds no hooks; git's real hooks live in
#      the common dir. Omitting this silently skips the repo's hooks in every
#      worktree.
#   d. `<toplevel>/.husky/<name>`, only when `.husky/_` exists — running a hook
#      the user actually uninstalled would be a regression, not a rescue.
#   e. $OCTARIN_PREV_HOOKS_PATH — whatever core.hooksPath was set to before.
#
# BARE REPOS: `git rev-parse --show-toplevel` is FATAL outside a work tree, so it
# gets its own invocation. Sharing it with the dir lookups would take the whole
# command down and with it every receive-side hook (pre-receive, update,
# post-receive, post-update, proc-receive) in every bare repo.
#
# NOTE: husky sets a repo-local `core.hooksPath=.husky/_`, and only one
# core.hooksPath can be in effect — a husky repo should NOT switch to .githooks
# (see README.md next to this file).
#
# Contract: this script's exit status is the chained hook's exit status, or 0.
# Octarin's own work never influences it. POSIX sh only (no bashisms) — it has to
# work under dash and under macOS's ancient bash. No dependencies.
#
# Enable with:  git config core.hooksPath .githooks
#
# Env: OCTARIN_PREV_HOOKS_PATH (the core.hooksPath this replaced), OCTARIN_HOME
# (machine state root, default ~/.octarin), OCTARIN_GIT_ASSETS (dir holding
# collect.py/reconcile.py), OCTARIN_PYTHON, OCTARIN_GIT_TIMEOUT (watchdog
# seconds), OCTARIN_GIT_LOG (diagnostic log path), OCTARIN_GIT_DISABLE=1 /
# OCTARIN_DISABLE=1 (kill switch), OCTARIN_GIT_NO_CHAIN=1 (dispatch only, for
# debugging). The ingest key is read by the Python side from the environment at
# run time and is never written to any file here.

# Never abort early on our own account; the chained hook owns the exit status.
# The committed stubs cannot be symlinks (unreviewable in a diff, and unreliable
# on Windows checkouts), so each one exports its own name and execs this script.
# $0 is then always `octarin-dispatch.sh`, hence the env var comes first.
OCT_HOOK=${OCTARIN_HOOK_NAME:-${0##*/}}
OCT_RC=0

# ── locate this script's own hooks dir, and the machine collectors ────────────
# Only the directory this file sits in matters here: it is the self-check that
# stops the chain below from calling us again. No symlink resolution — the
# committed stubs are real files, not links.
oct_self=$0
case $oct_self in
    */*) ;;
    *) oct_self=./$oct_self ;;
esac
oct_hooks_dir=$(CDPATH='' cd -P -- "$(dirname -- "$oct_self")" 2>/dev/null && pwd -P) || oct_hooks_dir=

# This copy is COMMITTED in someone's repo and ships no collectors of its own.
# Capture is delegated to the machine install at ~/.octarin/git/ when there is
# one; with no machine install OCT_ASSETS stays empty and oct_do_work is a
# no-op. Chaining below happens either way — that part is not optional.
OCT_ASSETS=
oct_machine_dir=${OCTARIN_HOME:-$HOME/.octarin}/git
if [ -n "${OCTARIN_GIT_ASSETS:-}" ] && [ -f "${OCTARIN_GIT_ASSETS}/collect.py" ]; then
    OCT_ASSETS=$OCTARIN_GIT_ASSETS
elif [ -f "$oct_machine_dir/collect.py" ]; then
    OCT_ASSETS=$oct_machine_dir
fi

OCT_TIMEOUT=${OCTARIN_GIT_TIMEOUT:-20}
# A non-numeric value would make `sleep` fail instantly and kill the work before
# it ran, silently. Fall back rather than "succeed" at doing nothing.
case $OCT_TIMEOUT in
    '' | *[!0-9]*) OCT_TIMEOUT=20 ;;
esac

# ── recursion guard ───────────────────────────────────────────────────────────
# Nested hook fires are legitimate (a post-checkout that runs `git submodule
# update` fires the submodule's post-checkout), so this is a bounded depth
# counter, not a one-shot latch: deep enough for real nesting, shallow enough
# that two dispatchers chained to each other cannot loop.
OCT_MAX_DEPTH=3
oct_hook_depth=${OCTARIN_HOOK_DEPTH:-0}
case $oct_hook_depth in
    '' | *[!0-9]*) oct_hook_depth=0 ;;
esac
oct_reentry=0
[ "$oct_hook_depth" -ge "$OCT_MAX_DEPTH" ] && oct_reentry=1
OCTARIN_HOOK_DEPTH=$((oct_hook_depth + 1))
OCTARIN_HOOK_CHAIN="${OCTARIN_HOOK_CHAIN:-}$OCT_HOOK "
export OCTARIN_HOOK_DEPTH OCTARIN_HOOK_CHAIN

# Every Octarin dispatcher on the way in records its own hooks dir here, and
# oct_try_dir refuses any dir already listed. The realpath self-check below only
# knows about *this* copy's dir, so without this the machine install and the
# committed repo twin chain into each other: the repo's own hooks still run
# exactly once (the chain stops at the first hit either way), but Octarin
# collects the same commit two or three times before OCT_MAX_DEPTH bites. That
# happens with no exotic setup at all — a `chain_target` of `.githooks`, which
# is exactly what `octarin init` records when the user was already on the
# committed path. (A hooks dir whose path contains a literal `:` can defeat the
# delimiter; the failure mode is skipping a candidate, never looping.)
if [ -n "$oct_hooks_dir" ]; then
    OCTARIN_HOOK_DIRS="${OCTARIN_HOOK_DIRS:+$OCTARIN_HOOK_DIRS:}$oct_hooks_dir"
    export OCTARIN_HOOK_DIRS
fi

oct_log() {
    [ -n "${OCTARIN_GIT_LOG:-}" ] || return 0
    printf '%s %s %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$OCT_HOOK" "$1" \
        >>"$OCTARIN_GIT_LOG" 2>/dev/null || true
}

oct_disabled() {
    case "${OCTARIN_DISABLE:-}${OCTARIN_GIT_DISABLE:-}" in
        *1* | *true* | *TRUE* | *yes* | *on*) return 0 ;;
    esac
    return 1
}

# The self-contained twin has no ~/.octarin/git/config.json to read — it ships
# inside the user's repo — so the one key the chaining code asks for comes from
# the environment instead. Keeping the same function name and the same single
# question (`chain_target`) is what lets the chain-order block below be shared
# with the machine copy byte for byte.
oct_config_get() {
    case $1 in
        chain_target) printf '%s' "${OCTARIN_PREV_HOOKS_PATH:-}" ;;
        *) return 1 ;;
    esac
}

# ── stdin ─────────────────────────────────────────────────────────────────────
# Several hooks receive data on stdin (pre-push, pre-receive, post-receive,
# reference-transaction, post-rewrite). For all but `post-rewrite` Octarin does no
# work, so stdin is left completely alone and the chained hook reads the real
# thing — no temp file, no truncation risk, no cost on hot hooks like
# reference-transaction. Only `post-rewrite` is tee'd, because Octarin needs the
# `old-sha new-sha` pairs too.
#
# We must never read stdin in a hook that has none (post-commit, pre-commit, …):
# that would block on the terminal, and a hang is far worse than a missed capture.
oct_stdin_file=
# shellcheck disable=SC2317,SC2329  # invoked indirectly, from the EXIT trap below
# Both codes, because shellcheck renamed this diagnostic: <=0.9 reports SC2317
# ("unreachable") on the body lines, >=0.10 reports SC2329 ("never invoked") on
# the function. CI runs the older one, so disabling only SC2329 fails there.
oct_cleanup() {
    [ -n "$oct_stdin_file" ] && rm -f "$oct_stdin_file" 2>/dev/null
    return 0
}
trap oct_cleanup EXIT

# `! -t 0` as well: git always pipes post-rewrite, but a human running the hook
# by hand from a terminal would otherwise sit in `cat` waiting for EOF forever.
if [ "$OCT_HOOK" = post-rewrite ] && [ ! -t 0 ] && [ "$oct_reentry" -eq 0 ] &&
    ! oct_disabled; then
    oct_stdin_file=$(mktemp "${TMPDIR:-/tmp}/octarin-hook.XXXXXX" 2>/dev/null) || oct_stdin_file=
    if [ -n "$oct_stdin_file" ]; then
        if ! cat >"$oct_stdin_file" 2>/dev/null; then
            # A partial read would hand the chained hook a truncated ref list.
            # post-rewrite is not a gate, so drop our copy and let the chained
            # hook read what is left of the original stream instead of a lie.
            oct_log "stdin tee failed"
            rm -f "$oct_stdin_file" 2>/dev/null
            oct_stdin_file=
        fi
    fi
fi

# ── Octarin's own work: post hooks only, detached, watchdogged, silent ────────
OCT_WORK_HOOKS=" post-commit post-rewrite post-merge post-checkout "

oct_python() {
    for candidate in "${OCTARIN_PYTHON:-}" python3 python; do
        [ -n "$candidate" ] || continue
        if command -v "$candidate" >/dev/null 2>&1; then
            printf '%s' "$candidate"
            return 0
        fi
    done
    return 1
}

# Run "$@" detached from git with a hard watchdog, discarding everything.
# The watchdog traps TERM so that killing it also kills its `sleep`; otherwise
# every hook fire would leak an orphaned `sleep` for the whole timeout.
oct_spawn() {
    (
        (
            "$@" &
            oct_child=$!
            (
                trap 'kill -9 "$oct_napper" 2>/dev/null; exit 0' TERM
                sleep "$OCT_TIMEOUT" &
                oct_napper=$!
                wait "$oct_napper" 2>/dev/null
                kill -9 "$oct_child" 2>/dev/null
            ) &
            oct_guard=$!
            wait "$oct_child" 2>/dev/null
            kill -TERM "$oct_guard" 2>/dev/null
            [ -n "${OCT_PAYLOAD:-}" ] && rm -f "$OCT_PAYLOAD" 2>/dev/null
            exit 0
        ) >/dev/null 2>&1 </dev/null &
    ) >/dev/null 2>&1
    return 0
}

# ── AI-Session trailers (prepare-commit-msg) ──────────────────────────────────
# The ONE piece of Octarin that runs SYNCHRONOUSLY and is allowed to change git's
# input: it must edit the message file before git opens the editor, so it cannot be
# detached like the collectors above. Kept cheap and fail-open — the script itself
# is gated on `octarin.trailers` (off by default) and returns 0 on every path, and
# we ignore its status here regardless, so a commit can never fail because of it.
#
# `--amend` re-fires this hook; idempotence lives in trailers.py, not here.
oct_do_trailers() {
    [ "$oct_reentry" -eq 0 ] || return 0
    oct_disabled && return 0
    [ "$OCT_HOOK" = prepare-commit-msg ] || return 0
    [ -n "$1" ] || return 0
    [ -n "$OCT_ASSETS" ] || return 0
    [ -f "$OCT_ASSETS/trailers.py" ] || return 0
    OCT_PY=$(oct_python) || return 0
    oct_log "trailers ($2)"
    # $3 travels as ENVIRONMENT, not as a flag, so that a dispatcher and its
    # python assets from different releases keep working together: the committed
    # repo-template copy of this script and each engineer's ~/.octarin/git update
    # on independent schedules, an older argparse dies on a flag it doesn't know
    # (and `|| :` would swallow that, turning capture off silently), while an
    # unknown env var is ignored by every version ever shipped.
    OCT_COMMIT_REF="${3:-}" "$OCT_PY" "$OCT_ASSETS/trailers.py" --msg-file "$1" \
        --source "${2:-}" >/dev/null 2>&1 || :
    return 0
}

# ── checkpoint minting (prepare-commit-msg) ───────────────────────────────────
# The second synchronous step, and for the same unavoidable reason as trailers:
# the checkpoint id has to be IN the message before git writes the commit, since
# the message is the only place git will carry it through a rebase for us. The
# expensive half (condensing sessions into git objects) is deferred to the
# detached post-commit pass below.
#
# Gated on `octarin.checkpoints` (off by default) and returns 0 on every path;
# its status is ignored here too, so a commit can never fail because of it.
oct_do_checkpoint_mint() {
    [ "$oct_reentry" -eq 0 ] || return 0
    oct_disabled && return 0
    [ "$OCT_HOOK" = prepare-commit-msg ] || return 0
    [ -n "$1" ] || return 0
    [ -n "$OCT_ASSETS" ] || return 0
    [ -f "$OCT_ASSETS/checkpoint.py" ] || return 0
    OCT_PY=$(oct_python) || return 0
    oct_log "checkpoint mint ($2)"
    # $3 as environment, for the same skew reason as trailers above.
    OCT_COMMIT_REF="${3:-}" "$OCT_PY" "$OCT_ASSETS/checkpoint.py" --mint \
        --msg-file "$1" --source "${2:-}" >/dev/null 2>&1 || :
    return 0
}

# ── checkpoint sync (pre-push) ────────────────────────────────────────────────
# Checkpoints have to reach the teammate who pulls, and the obvious way to do
# that — a `remote.<name>.push` refspec — is a trap: configuring one REPLACES
# git's default push behaviour, so a user on `push.default = simple` would find
# `git push` silently stopped pushing their branch. So the refs go out here, in
# a detached push that cannot fail (or slow down) the push the user asked for.
#
# The guard is not optional. This push fires `pre-push` again; without
# OCTARIN_CHECKPOINT_PUSH it would recurse until the depth counter stopped it,
# doing three pushes for every one the user asked for.
oct_do_checkpoint_push() {
    [ "$oct_reentry" -eq 0 ] || return 0
    oct_disabled && return 0
    [ "$OCT_HOOK" = pre-push ] || return 0
    [ -z "${OCTARIN_CHECKPOINT_PUSH:-}" ] || return 0
    [ -n "$1" ] || return 0
    [ "$(git config --get --type=bool octarin.checkpoints 2>/dev/null)" = "true" ] || return 0
    # Nothing to send is the common case; skip before spawning anything.
    oct_refs=$(git for-each-ref --count=1 --format='%(refname)' \
        refs/octarin/checkpoints 2>/dev/null)
    [ -n "$oct_refs" ] || return 0
    oct_log "checkpoint push -> $1"
    oct_spawn env OCTARIN_CHECKPOINT_PUSH=1 git push --quiet "$1" \
        'refs/octarin/checkpoints/*:refs/octarin/checkpoints/*'
    return 0
}

oct_do_work() {
    [ "$oct_reentry" -eq 0 ] || return 0
    oct_disabled && return 0
    case $OCT_WORK_HOOKS in
        *" $OCT_HOOK "*) ;;
        *) return 0 ;;
    esac
    [ -n "$OCT_ASSETS" ] || {
        oct_log "skip: assets not found"
        return 0
    }
    OCT_PY=$(oct_python) || {
        oct_log "skip: no python"
        return 0
    }

    # post-checkout fires for file checkouts too ($3 == 1 means branch switch).
    if [ "$OCT_HOOK" = post-checkout ] && [ "${3:-0}" != "1" ]; then
        return 0
    fi

    case $OCT_HOOK in
        post-commit)
            oct_log "collect HEAD"
            oct_spawn "$OCT_PY" "$OCT_ASSETS/collect.py" --repo "$PWD" \
                --rev HEAD --producer git-hook --post
            # Condense this commit's sessions into refs/octarin/checkpoints/*.
            # Detached like the collector: it reads the spool and writes git
            # objects, which is far too much work for the commit's critical path.
            if [ -f "$OCT_ASSETS/checkpoint.py" ]; then
                oct_log "checkpoint HEAD"
                oct_spawn "$OCT_PY" "$OCT_ASSETS/checkpoint.py" --write \
                    --repo "$PWD" --rev HEAD
            fi
            ;;
        post-rewrite)
            # stdin carries `old-sha new-sha` pairs: this is what makes amend /
            # rebase / squash inherit the old sha's session links.
            [ -n "$oct_stdin_file" ] || return 0
            OCT_PAYLOAD=$oct_stdin_file.oct
            cp "$oct_stdin_file" "$OCT_PAYLOAD" 2>/dev/null || {
                OCT_PAYLOAD=
                return 0
            }
            oct_log "collect rewrites"
            # shellcheck disable=SC2016  # the body must NOT expand out here
            oct_spawn sh -c '
                exec <"$1"
                shift
                exec "$@"
            ' oct-rewrite "$OCT_PAYLOAD" "$OCT_PY" "$OCT_ASSETS/collect.py" \
                --repo "$PWD" --rewritten-stdin --producer git-rewrite --post
            ;;
        post-merge | post-checkout)
            oct_log "reconcile"
            oct_spawn "$OCT_PY" "$OCT_ASSETS/reconcile.py" --repo "$PWD" \
                --producer "git-$OCT_HOOK"
            ;;
    esac
    return 0
}

# ── chaining ──────────────────────────────────────────────────────────────────
oct_chain=
oct_try_dir() {
    [ -z "$oct_chain" ] || return 1
    [ -n "$1" ] || return 1
    [ -d "$1" ] || return 1
    oct_cand_dir=$(CDPATH='' cd -P -- "$1" 2>/dev/null && pwd -P) || return 1
    # Never chain into our own hooks dir: that is an infinite loop.
    [ "$oct_cand_dir" = "$oct_hooks_dir" ] && return 1
    # ...nor into any dir an Octarin dispatcher already ran from on the way in
    # (the check above only knows this copy; the two copies are different dirs).
    case ":${OCTARIN_HOOK_DIRS:-}:" in
        *":$oct_cand_dir:"*) return 1 ;;
    esac
    oct_cand=$oct_cand_dir/$OCT_HOOK
    # git only runs hooks that are executable files; match that exactly.
    [ -f "$oct_cand" ] || return 1
    [ -x "$oct_cand" ] || return 1
    oct_chain=$oct_cand
    return 0
}

oct_find_chain() {
    [ "$oct_reentry" -eq 0 ] || return 0
    case "${OCTARIN_GIT_NO_CHAIN:-}" in 1 | true | yes | on) return 0 ;; esac

    # One call for the three dir paths. Deliberately WITHOUT --show-toplevel:
    # that argument is fatal outside a work tree, and it would take the whole
    # command (and therefore every receive-side hook in a bare repo) down with it.
    oct_paths=$(git rev-parse --git-dir --git-common-dir --git-path hooks 2>/dev/null) ||
        oct_paths=
    oct_git_dir=$(printf '%s\n' "$oct_paths" | sed -n 1p)
    oct_common_dir=$(printf '%s\n' "$oct_paths" | sed -n 2p)
    oct_cfg_hooks=$(printf '%s\n' "$oct_paths" | sed -n 3p)
    case $oct_git_dir in /* | '') ;; *) oct_git_dir=$PWD/$oct_git_dir ;; esac
    case $oct_common_dir in /* | '') ;; *) oct_common_dir=$PWD/$oct_common_dir ;; esac
    case $oct_cfg_hooks in /* | '') ;; *) oct_cfg_hooks=$PWD/$oct_cfg_hooks ;; esac
    # Its own call, so a bare repo (where this fails) keeps everything above.
    oct_toplevel=$(git rev-parse --show-toplevel 2>/dev/null) || oct_toplevel=

    # a. the configured hooks dir (usually us — rejected by the self-check)
    oct_try_dir "$oct_cfg_hooks"
    # b. this worktree's own .git/hooks, which our global core.hooksPath shadows
    [ -n "$oct_git_dir" ] && oct_try_dir "$oct_git_dir/hooks"
    # c. the shared common dir — in a linked worktree (b) is .git/worktrees/<name>
    #    and holds no hooks, so this is where the repo's real hooks live
    [ -n "$oct_common_dir" ] && oct_try_dir "$oct_common_dir/hooks"
    # d. husky, but only when `.husky/_` shows husky is actually installed here;
    #    running a hook the user uninstalled would be a regression, not a rescue.
    if [ -z "$oct_chain" ] && [ -n "$oct_toplevel" ] && [ -d "$oct_toplevel/.husky/_" ]; then
        oct_try_dir "$oct_toplevel/.husky"
    fi
    # e. whatever core.hooksPath pointed at before we installed (never clobbered)
    if [ -z "$oct_chain" ]; then
        oct_prev=$(oct_config_get chain_target)
        if [ -n "$oct_prev" ]; then
            case $oct_prev in
                '~'/*) oct_prev=$HOME/${oct_prev#'~'/} ;;
                /*) ;;
                *) [ -n "$oct_toplevel" ] && oct_prev=$oct_toplevel/$oct_prev ;;
            esac
            oct_try_dir "$oct_prev"
        fi
    fi
    return 0
}

# ── run ───────────────────────────────────────────────────────────────────────
# Octarin first (it is detached and returns immediately), then the chained hook,
# whose exit status is ours.
oct_do_trailers "$@"
oct_do_checkpoint_mint "$@"
oct_do_checkpoint_push "$@"
oct_do_work "$@"
oct_find_chain

if [ -n "$oct_chain" ]; then
    oct_log "chain -> $oct_chain"
    if [ -n "$oct_stdin_file" ]; then
        "$oct_chain" "$@" <"$oct_stdin_file"
        OCT_RC=$?
    else
        "$oct_chain" "$@"
        OCT_RC=$?
    fi
fi

exit $OCT_RC
