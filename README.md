# atomic-cline

[Atomic VCS](https://atomic.dev) integration for [Cline](https://cline.bot).

Automatic task recording with AI provenance, intent tracking, and knowledge graph skills.

> **Definitive source:** this repository lives on Atomic storage at `https://atomic.atomic.storage/workspaces/oss/projects/atomic-cline/code`. The GitHub repo is a mirror.

## What it does

- **1 task = 1 view** — a draft view is created automatically when a Cline task starts
- **Every task records with provenance** — model, vendor, session, timing
- **Tool executions tracked** — file reads, writes, commands captured in a causal decision graph
- **Intent workflow** — rules guide problem-first development with vault intents

## Skills

Installed as Cline workflows (symlinked into `~/Documents/Cline/Workflows/`), so the agent can pull them in on demand via slash commands:

- **`/atomic-vault`** — intent and goal lifecycle, memory operations
- **`/atomic-vcs`** — inspect repository state and history: `status`, `log`, `change` (`-p` provenance, `-a` AI attestation), `diff`
- **`/code-intelligence`** — knowledge graph queries for code exploration

## Install

### Quick start

Requires the [Atomic VCS](https://atomic.dev) CLI on your PATH. Then:

```bash
atomic agent enable --agent cline
```

The enable command syncs the package from Atomic storage and installs it.

### Development install

From a local checkout:

```bash
git clone https://github.com/atomicdotdev/atomic-cline
cd atomic-cline
atomic agent enable --agent cline --from .

# or the legacy script path:
./install.sh
```

### What install does

1. **Hook scripts** — copies 7 executable scripts to `~/Documents/Cline/Hooks/`
2. **Skills** — symlinks the 3 skills into `~/Documents/Cline/Workflows/` as `/atomic-vault`, `/atomic-vcs`, `/code-intelligence`
3. **Enable hooks** — toggle them on in Cline's Hooks tab (scale icon)
4. **Rules** — copy `rules/atomic.md` to `.clinerules/` in each project

### Add rules to a project

```bash
mkdir -p .clinerules
cp /path/to/atomic-cline/rules/atomic.md .clinerules/atomic.md
```

## Prerequisites

- [Atomic VCS](https://atomic.dev) installed and on your PATH (`atomic --version`)
- A project with an `.atomic/` repository (`atomic init`)
- [Cline](https://cline.bot) installed in VS Code
- `jq` installed (used by hook scripts to parse JSON)

## How hooks work

Cline hooks are executable scripts that receive JSON on stdin. Each Atomic hook:

1. Reads the JSON input
2. Checks if `.atomic/` exists in the workspace
3. Pipes the JSON to `atomic agent hooks cline <verb>`
4. Returns `{"cancel":false}` to let Cline continue

```
Cline task start
  │
  ├── TaskStart → Rust creates haikunator-named draft view
  │
  ├── User sends prompt
  │   ├── UserPromptSubmit → Rust saves prompt + model on session
  │   ├── Agent works (file reads, writes, commands)
  │   │   └── PostToolUse → Rust appends to provenance graph
  │   └── User sends another prompt → repeat
  │
  └── Task ends
      ├── TaskComplete → Rust records all changes with provenance
      └── TaskCancel → Rust cleans up session
```

## Uninstall

```bash
atomic agent disable --agent cline
```

Or manually remove the `atomic-*` files from `~/Documents/Cline/Hooks/` and the `atomic-vault.md` / `atomic-vcs.md` / `code-intelligence.md` symlinks from `~/Documents/Cline/Workflows/`.

## License

Apache-2.0 — same as [Atomic VCS](https://github.com/atomicdotdev/atomic).
