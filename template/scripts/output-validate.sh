#!/bin/bash
# claude-symphony Output Validation Script
# Run output validation

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
HOOKS_DIR="$PROJECT_ROOT/.claude/hooks"

# Call validation hook
exec "$HOOKS_DIR/output-validator.sh" "$@"
