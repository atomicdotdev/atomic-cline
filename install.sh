#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TARGET="$HOME/Documents/Cline/Hooks"

echo "Installing atomic-cline hooks..."

# Create global hooks directory
mkdir -p "$TARGET"

# Copy hook scripts (must be extensionless and executable)
for hook in TaskStart TaskResume TaskComplete TaskCancel UserPromptSubmit PostToolUse PreToolUse; do
  src="$SCRIPT_DIR/hooks/$hook"
  dst="$TARGET/atomic-$hook"
  if [ -f "$src" ]; then
    cp "$src" "$dst"
    chmod +x "$dst"
    echo "  installed: $hook"
  fi
done

echo ""
echo "✓ Installed atomic-cline"
echo "  Hooks: $TARGET/"
echo ""
echo "  To add Atomic rules to a project:"
echo "    mkdir -p .clinerules"
echo "    cp $SCRIPT_DIR/rules/atomic.md .clinerules/atomic.md"
echo ""
echo "  Note: Enable hooks in Cline's Hooks tab (scale icon)."
