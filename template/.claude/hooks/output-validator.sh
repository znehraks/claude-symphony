#!/bin/bash
# output-validator.sh - Output validation hook (TypeScript wrapper)
# claude-symphony workflow pipeline
#
# This is a thin shell wrapper that delegates to the TypeScript implementation.
# Actual logic is in dist/hooks/output-validator.js

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
if [ -f "$PACKAGE_ROOT/dist/hooks/output-validator.js" ]; then
  exec node "$PACKAGE_ROOT/dist/hooks/output-validator.js" "$@"
else
  echo "Warning: TypeScript hook not found at $PACKAGE_ROOT/dist/hooks/output-validator.js"
  echo "Output validation skipped - TypeScript build required"
  exit 0
fi
