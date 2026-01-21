#!/bin/bash
# claude-symphony Output Validation Script
# 산출물 검증 실행

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
HOOKS_DIR="$PROJECT_ROOT/.claude/hooks"

# 검증 훅 호출
exec "$HOOKS_DIR/output-validator.sh" "$@"
