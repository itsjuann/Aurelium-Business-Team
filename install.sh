#!/usr/bin/env bash
# Install the Aurelium Motion agent team into Claude Code's user-level agents folder.
# Usage: ./install.sh    (copies .claude/agents/*.md to ~/.claude/agents/)
# The project-level copies in .claude/agents/ are picked up automatically when Claude Code runs inside this repo,
# so this is only needed if you want the team available from any directory.
set -euo pipefail
SRC="$(cd "$(dirname "$0")" && pwd)/.claude/agents"
DEST="${HOME}/.claude/agents"
mkdir -p "$DEST"
n=0
for f in "$SRC"/*.md; do cp "$f" "$DEST/"; n=$((n+1)); done
echo "Installed $n agents to $DEST"
