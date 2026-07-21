#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CLINE_DIR="$HOME/Documents/Cline"
HOOKS_TARGET="$CLINE_DIR/Hooks"
SKILLS_TARGET="$CLINE_DIR/Workflows"

echo "Installing atomic-cline..."

# 1. Hook scripts (must be extensionless and executable)
mkdir -p "$HOOKS_TARGET"
hooks_installed=0
for hook in TaskStart TaskResume TaskComplete TaskCancel UserPromptSubmit PostToolUse PreToolUse; do
  src="$SCRIPT_DIR/hooks/$hook"
  dst="$HOOKS_TARGET/atomic-$hook"
  if [ -f "$src" ]; then
    cp "$src" "$dst"
    chmod +x "$dst"
    hooks_installed=$((hooks_installed + 1))
    echo "  hook: $hook"
  fi
done

# 1b. Cline CLI hooks → ~/.cline/hooks/
#     The Hooks above target the Cline VS Code extension (~/Documents/Cline).
#     The Cline *CLI* loads hooks from ~/.cline/hooks (see `cline --hooks-dir`),
#     named by event (TaskStart, TaskComplete, ...). Install them there too so
#     the CLI records tasks. TaskComplete triggers the change + provenance.
CLI_HOOKS_TARGET="${CLINE_DATA_DIR:-$HOME/.cline}/hooks"
mkdir -p "$CLI_HOOKS_TARGET"
cli_hooks=0
for hook in TaskStart TaskResume TaskComplete TaskCancel UserPromptSubmit PostToolUse PreToolUse; do
  src="$SCRIPT_DIR/hooks/$hook"
  if [ -f "$src" ]; then
    cp "$src" "$CLI_HOOKS_TARGET/$hook"
    chmod +x "$CLI_HOOKS_TARGET/$hook"
    cli_hooks=$((cli_hooks + 1))
  fi
done
echo "  cli hooks: $cli_hooks → $CLI_HOOKS_TARGET/"

# 2. Skills → symlinked into Workflows so they resolve as /atomic-vault,
#    /atomic-vcs, /code-intelligence slash commands.
mkdir -p "$SKILLS_TARGET"
skills_linked=0
for skill in atomic-vault atomic-vcs code-intelligence; do
  src="$SCRIPT_DIR/skills/$skill/SKILL.md"
  dst="$SKILLS_TARGET/$skill.md"
  if [ -f "$src" ]; then
    ln -sf "$src" "$dst"
    skills_linked=$((skills_linked + 1))
    echo "  skill: /$skill"
  fi
done

cat <<EOF

────────────────────────────────────────────────────────────
✓ Installed atomic-cline
────────────────────────────────────────────────────────────

What was installed:
  • Hooks      ${hooks_installed} copied (extensionless, executable)
               → ${HOOKS_TARGET}/  (atomic-TaskStart, atomic-TaskComplete, ...)
  • Skills     ${skills_linked} symlinked
               → ${SKILLS_TARGET}/  (/atomic-vault, /atomic-vcs, /code-intelligence)

Skill symlinks point back into this checkout:
  ${SCRIPT_DIR}
Keep this directory in place; moving or deleting it breaks the /workflow links.

Manual steps to finish:
  1. Enable the hooks in Cline's Hooks tab (the scale icon).
  2. Per project, copy the Atomic rules into the repo:
       mkdir -p /path/to/your/project/.clinerules
       cp "${SCRIPT_DIR}/rules/atomic.md" /path/to/your/project/.clinerules/atomic.md
  3. Ensure the project is an Atomic repo (one-time):
       cd /path/to/your/project && atomic init

Verify:
  • Skills: ls ${SKILLS_TARGET}/
  • Hooks:  ls ${HOOKS_TARGET}/atomic-* && echo OK
  • Rules:  ls .clinerules/atomic.md   (run inside a configured project)

Uninstall:
  ./install.sh is install-only; to remove run:
    node install.js --uninstall
────────────────────────────────────────────────────────────
EOF
