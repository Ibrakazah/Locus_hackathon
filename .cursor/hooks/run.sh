#!/usr/bin/env bash
# Wrapper that runs the Octarin Cursor capture hook (hook-handler.js).
#
# Mirrors the Claude/Codex wrappers so all three agents load config the same way:
# source the committed team config (.octarin/project — carries OCTARIN_PROJECT +
# OCTARIN_INGEST_URL) FIRST, then the per-user key from ~/.octarin/octarin.env
# (written by `octarin login`), then exec node so Cursor's stdin payload passes
# straight through. Plain `bash` (no login shell) keeps per-event latency low —
# postToolUse fires on every tool call. Fails open: any problem exits 0 so Cursor
# is never blocked.

set +e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." 2>/dev/null && pwd)"

# Committed team config — gives the ingest URL + project slug. Subdir path, so it
# never matches the `*.env` rule in common .gitignore patterns.
for envfile in "$PROJECT_ROOT/.octarin/project" "$PWD/.octarin/project"; do
  if [ -n "$envfile" ] && [ -f "$envfile" ]; then
    set -a
    # shellcheck disable=SC1090
    . "$envfile"
    set +a
    break
  fi
done

# ── credential resolution (RFC 0003) ─────────────────────────────────────────
# Attribution is decided by the KEY alone: the ingest service takes project_id
# from the authenticated key and ignores the `project` on the body. So the key
# has to be chosen PER REPOSITORY, or a laptop with two orgs reports both to
# whichever one was installed last (this leaked an employer's sessions into a
# throwaway onboarding org — RFC 0003).
#
# Order:
#   1. an OCTARIN_API_KEY already in the environment (CI, .github/hooks) wins;
#   2. the key stored for THIS repo's project in ~/.octarin/credentials;
#   3. the `*` entry — catch-all, and only there if someone ran
#      `octarin init --all-repos`. Applies only when the repo names no project:
#      a repo bound to a project we hold no key for must NOT borrow it;
#   4. legacy pre-keyring installs: the single key in ~/.octarin/octarin.env,
#      honoured only when it names the same project this repo is bound to.
#
# Values are read field by field with awk rather than sourced. Sourcing
# octarin.env for its side effects is what used to overwrite the repo's own
# OCTARIN_PROJECT with the machine's personal one.
#
# No match leaves the key empty: the hook then captures locally and posts
# nothing, which is the only safe answer.
oct_field() { # <file> <key>
  [ -f "$1" ] || return 0
  awk -F= -v k="$2" '$1==k {sub(/^[^=]*=/, ""); print; exit}' "$1"
}

oct_cred="$HOME/.octarin/credentials"
oct_user_env="$HOME/.octarin/octarin.env"
oct_slug="${OCTARIN_PROJECT:-}"

if [ -z "${OCTARIN_API_KEY:-}" ]; then
  if [ -f "$oct_cred" ]; then
    if [ -n "$oct_slug" ]; then
      OCTARIN_API_KEY="$(oct_field "$oct_cred" "$oct_slug")"
    else
      # No binding in the repo: consult the rules file, which states ownership
      # once per org ("everything from github.com/acme is acme's") instead of
      # once per repository. First match wins; `*` is the last resort.
      oct_rules="$HOME/.octarin/rules"
      if [ -f "$oct_rules" ]; then
        oct_root="$(git rev-parse --show-toplevel 2>/dev/null)"
        oct_remote="$(git config --get remote.origin.url 2>/dev/null)"
        # Canonical host/org/repo, so ssh and https forms match one rule.
        oct_remote="$(printf '%s' "$oct_remote" | sed -e 's#^[a-zA-Z+]*://##' -e 's#^[^@/]*@##' -e 's#:\([^/]\)#/\1#' -e 's#\.git$##' -e 's#/*$##' | tr 'A-Z' 'a-z')"
        while IFS= read -r oct_line; do
          case $oct_line in ''|'#'*) continue ;; esac
          oct_pat=${oct_line%%=*}
          oct_val=${oct_line#*=}
          [ -n "$oct_pat" ] && [ -n "$oct_val" ] || continue
          case $oct_pat in
            /*|'~'*)
              # Path rule: the directory and everything under it.
              oct_base=${oct_pat%/}
              oct_base=${oct_base%/\*\*}
              oct_base=${oct_base%/\*}
              case $oct_base in '~'*) oct_base="$HOME${oct_base#\~}" ;; esac
              [ -n "$oct_root" ] || continue
              case $oct_root in
                "$oct_base"|"$oct_base"/*) oct_slug=$oct_val; break ;;
              esac
              ;;
            *)
              [ -n "$oct_remote" ] || continue
              # shellcheck disable=SC2254  # the pattern IS a glob, deliberately
              case $oct_remote in
                $oct_pat) oct_slug=$oct_val; break ;;
              esac
              ;;
          esac
        done < "$oct_rules"
      fi
      if [ -n "$oct_slug" ]; then
        OCTARIN_PROJECT=$oct_slug
        export OCTARIN_PROJECT
        OCTARIN_API_KEY="$(oct_field "$oct_cred" "$oct_slug")"
      else
        OCTARIN_API_KEY="$(oct_field "$oct_cred" '*')"
      fi
    fi
  elif [ -n "$oct_slug" ] && [ "$oct_slug" = "$(oct_field "$oct_user_env" OCTARIN_PROJECT)" ]; then
    OCTARIN_API_KEY="$(oct_field "$oct_user_env" OCTARIN_API_KEY)"
  fi
  export OCTARIN_API_KEY
fi

# Ingest URL: the repo's team config owns it (self-hosted teams point at their
# own endpoint); fall back to the machine's only when the repo didn't say.
if [ -z "${OCTARIN_INGEST_URL:-}" ]; then
  OCTARIN_INGEST_URL="$(oct_field "$oct_user_env" OCTARIN_INGEST_URL)"
  export OCTARIN_INGEST_URL
fi

# Unbound, or bound to a project this machine has no key for: say so once per
# project, then never again (same shape as the hook's auth_required notice).
if [ -z "${OCTARIN_API_KEY:-}" ] && [ "${OCTARIN_QUIET:-}" != "1" ]; then
  oct_marker="$HOME/.octarin/bind-hint.$(printf '%s' "${oct_slug:-unbound}" | tr -c 'A-Za-z0-9._-' '_')"
  if [ ! -f "$oct_marker" ]; then
    mkdir -p "$HOME/.octarin" 2>/dev/null
    : > "$oct_marker" 2>/dev/null
    if [ -n "$oct_slug" ]; then
      echo "[octarin] no key stored for '$oct_slug' — capturing locally only." >&2
      echo "[octarin]   authorize this machine:  npx octarin-cli@latest login" >&2
    else
      echo "[octarin] this repo is not bound to a project — capturing locally only." >&2
      echo "[octarin]   bind it:  npx octarin-cli@latest init <oct_key>" >&2
    fi
  fi
fi

if command -v node >/dev/null 2>&1; then
  exec node "$SCRIPT_DIR/hook-handler.js"
fi

exit 0
