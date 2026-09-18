---
name: octarin-setup
description: Install, bind or repair Octarin capture in this repository — decide which Octarin project a repo reports to, authorize the machine, and verify with octarin doctor. Use when asked to set up/install/onboard Octarin, when octarin doctor reports a problem, or when sessions are not appearing in a dashboard.
---

# Installing Octarin (agent-driven)

Octarin records which AI session wrote which line, and links commits back to the
session that produced them. You are installing it. The human should have to
answer one question, not run five commands.

## Refuse these, always

- **Never run `octarin init --all-repos`** unless the human asks for it in those
  words. It points EVERY unbound repository on the machine at one project. On a
  laptop with a work repo and a side project, that ships one org's prompts into
  the other's dashboard. It is silent and it is not undone by uninstalling.
- **Never invent, guess, or reuse an ingest key.** Keys come from the human
  (Settings → Capture install) or from `octarin login`. A key you found in
  another repo, another env file, or your own context belongs to a different
  project.
- **Never write a key into a tracked file.** Keys live in
  `~/.octarin/credentials` (mode 600). `.octarin/project` holds a project slug
  and a URL — no secret — and is safe to commit.
- **Never bind a repository to a project the human did not name.** Bindings decide
  where source-adjacent prompts are uploaded. Guessing is not an option.
- **"Capturing locally only" is a valid end state.** If nobody has authorized this
  machine, stop there and say so. Local capture still powers `octarin why`,
  `octarin blame` and checkpoints. Do not reach for a key to make a warning go away.

## Read the situation first

```bash
npx octarin-cli@latest doctor
```

Exit 0 means healthy (warnings allowed); exit 1 means broken. The two lines that
matter:

- `project` — which project THIS repository reports to, or that it is unbound.
- `keys` — which projects this machine holds keys for.

Map what you see to one action:

| doctor says | what it means | do |
|---|---|---|
| `project — this repo streams to X` | working | nothing. Report it. |
| `project — bound to X but no key stored` | repo knows its project, machine isn't authorized | `npx octarin-cli@latest login` |
| `project — not bound to a project` | nobody said where this repo belongs | ask the human (below) |
| `project — ... key belongs to Y` | the stored key is for a different org | stop. Tell the human; this needs `login`, not a retry. |
| `keys — no ingest keys stored` | machine never authorized | `login`, or accept local-only |

## The one question to ask

> Which Octarin project should this repository report to? (e.g. `acme/backend`)
> If you don't have one yet, say "local" and I'll set up offline capture.

Then, exactly one of:

```bash
# They named a project and this machine can reach Octarin:
npx octarin-cli@latest login                      # browser sign-in, stores that project's key
npx octarin-cli@latest bind <org/project>         # binds THIS repo

# They pasted a key from Settings → Capture install:
npx octarin-cli@latest init <oct_key>             # installs hooks, binds THIS repo only

# They said "local":
npx octarin-cli@latest init --local               # capture + checkpoints, nothing leaves the machine
```

If they own many repositories under one org, offer the rule instead of repeating
yourself — it states the fact once:

```bash
npx octarin-cli@latest bind acme/backend --remote 'github.com/acme/*'
npx octarin-cli@latest bind me/sandbox --path ~/src/personal
```

## For a whole team

```bash
npx octarin-cli@latest init-repo <org/project>
```

Commits the capture config so every teammate is bound on clone, and opens a PR.
Each teammate still runs `octarin login` once per machine — that is the key, and
it is per-person on purpose. Run this only when the human asks to set up the team,
not to fix your own repo.

## Finish by verifying, not by asserting

```bash
npx octarin-cli@latest doctor
```

Report the `project` line verbatim. If it still says unbound or missing-key, say
so plainly — do not describe the install as complete. A wrong destination is worse
than no capture, so an honest "capturing locally, not uploading" is the better
answer whenever you are unsure.

