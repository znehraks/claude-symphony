#!/bin/bash
# session-start.sh - 세션 시작 시 자동 복구
# claude-symphony workflow pipeline
#
# SessionStart hook: Claude Code 세션 시작/재개 시 실행
# /compact 후 저장된 스냅샷이 있으면 자동으로 컨텍스트 복구 안내

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TRIGGER_FILE="$PROJECT_ROOT/state/context/auto-trigger.json"
CONTEXT_DIR="$PROJECT_ROOT/state/context"
PROGRESS_FILE="$PROJECT_ROOT/state/progress.json"

# 컨텍스트 디렉토리 확인
mkdir -p "$CONTEXT_DIR"

# jq 필요
if ! command -v jq &> /dev/null; then
    exit 0
fi

# 1. 트리거 파일 확인 - compact가 실행되었는지
if [ ! -f "$TRIGGER_FILE" ]; then
    exit 0  # 복구 필요 없음
fi

COMPACT_SCHEDULED=$(jq -r '.compact_scheduled // false' "$TRIGGER_FILE" 2>/dev/null || echo "false")
if [ "$COMPACT_SCHEDULED" != "true" ]; then
    exit 0  # compact가 예정되지 않았음
fi

# 2. 최근 스냅샷 찾기
LATEST_SNAPSHOT=$(ls -1t "$CONTEXT_DIR"/auto-snapshot-*.md 2>/dev/null | head -1)
if [ -z "$LATEST_SNAPSHOT" ]; then
    # 스냅샷 없음 - 트리거 파일 정리
    rm -f "$TRIGGER_FILE"
    exit 0
fi

# 3. 현재 스테이지 정보
CURRENT_STAGE="none"
if [ -f "$PROGRESS_FILE" ]; then
    CURRENT_STAGE=$(jq -r '.current_stage // "none"' "$PROGRESS_FILE" 2>/dev/null || echo "none")
fi

# 4. 복구 컨텍스트 생성 (Claude에게 전달)
RECOVERY_CONTEXT=$(cat << EOF

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 세션 복구 - 자동 /compact 후 재시작
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 복구 정보
- 스냅샷: $(basename "$LATEST_SNAPSHOT")
- 스테이지: $CURRENT_STAGE
- 저장 시간: $(jq -r '.timestamp // "unknown"' "$TRIGGER_FILE" 2>/dev/null)

## 스냅샷 내용
$(cat "$LATEST_SNAPSHOT" 2>/dev/null | head -50)

## 복구 지침
1. 위 스냅샷 내용을 참고하여 작업 컨텍스트 파악
2. stages/$CURRENT_STAGE/CLAUDE.md 확인
3. 중단된 작업부터 재개

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EOF
)

# 5. JSON 출력 (Claude에게 컨텍스트 전달)
# additionalContext를 통해 Claude가 복구 정보를 받음
cat << EOF
{
    "hookSpecificOutput": {
        "hookEventName": "SessionStart",
        "additionalContext": $(echo "$RECOVERY_CONTEXT" | jq -Rs .)
    }
}
EOF

# 6. 트리거 파일 정리 (복구 완료 표시)
jq '. + {"recovered": true, "recovery_time": "'"$(date -Iseconds)"'"}' \
    "$TRIGGER_FILE" > "$TRIGGER_FILE.tmp" && mv "$TRIGGER_FILE.tmp" "$TRIGGER_FILE"

# 일정 시간 후 트리거 파일 삭제 (다음 세션에서 중복 복구 방지)
# 백그라운드에서 5분 후 삭제
(sleep 300 && rm -f "$TRIGGER_FILE" 2>/dev/null) &

exit 0
