#!/bin/bash
# post-stage.sh - Post-stage execution hook (TypeScript wrapper)
# claude-symphony workflow pipeline
#
# This is a thin shell wrapper that delegates to the TypeScript implementation.
# Actual logic is in dist/hooks/post-stage.js

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Find the claude-symphony package root (where dist/ exists)
if [ -d "$PROJECT_ROOT/dist" ]; then
  PACKAGE_ROOT="$PROJECT_ROOT"
elif [ -d "$PROJECT_ROOT/node_modules/claude-symphony/dist" ]; then
  PACKAGE_ROOT="$PROJECT_ROOT/node_modules/claude-symphony"
else
  PACKAGE_ROOT=$(npm root -g 2>/dev/null)/claude-symphony
fi

# Check if the compiled TypeScript exists
if [ -f "$PACKAGE_ROOT/dist/hooks/post-stage.js" ]; then
  exec node "$PACKAGE_ROOT/dist/hooks/post-stage.js" "$@"
else
  echo "Warning: TypeScript hook not found at $PACKAGE_ROOT/dist/hooks/post-stage.js"
  echo "Falling back to basic completion..."

  STAGE_ID="$1"

  if [ -z "$STAGE_ID" ]; then
    echo "Usage: post-stage.sh <stage-id>"
    exit 1
  fi

  echo "Post-stage tasks for: $STAGE_ID"
  echo "Tip: Run 'npm run build' in claude-symphony to enable full hook functionality"
  exit 0
fi
