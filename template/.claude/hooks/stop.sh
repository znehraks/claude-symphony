#!/bin/bash
# stop.sh - Claude 응답 완료 후 컨텍스트 자동 관리
# claude-symphony workflow pipeline
#
# Stop hook: Claude 응답이 완료된 후 실행됨
# 컨텍스트가 50% 이하이면 자동으로 /compact 실행

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TRIGGER_FILE="$PROJECT_ROOT/state/context/auto-trigger.json"
COOLDOWN_FILE="$PROJECT_ROOT/state/context/.last-compact"
CONTEXT_DIR="$PROJECT_ROOT/state/context"
PROGRESS_FILE="$PROJECT_ROOT/state/progress.json"

# 쿨다운 시간 (초) - 5분
COOLDOWN_SECONDS=300

# 컨텍스트 디렉토리 확인
mkdir -p "$CONTEXT_DIR"

# jq 필요
if ! command -v jq &> /dev/null; then
    exit 0
fi

# stdin에서 hook 데이터 읽기
input=$(cat)

# 1. 트리거 파일 확인 (statusline.sh에서 생성)
if [ ! -f "$TRIGGER_FILE" ]; then
    exit 0  # 트리거 없음 - 정상 상태
fi

TRIGGERED=$(jq -r '.triggered // false' "$TRIGGER_FILE" 2>/dev/null || echo "false")
if [ "$TRIGGERED" != "true" ]; then
    exit 0
fi

REMAINING=$(jq -r '.remaining // 100' "$TRIGGER_FILE" 2>/dev/null || echo "100")
LEVEL=$(jq -r '.level // "warning"' "$TRIGGER_FILE" 2>/dev/null || echo "warning")

# 50% 이하가 아니면 스킵
if [ "$REMAINING" -gt 50 ]; then
    exit 0
fi

# 2. 쿨다운 확인 (5분 내 재실행 방지)
if [ -f "$COOLDOWN_FILE" ]; then
    LAST_COMPACT=$(cat "$COOLDOWN_FILE" 2>/dev/null || echo "0")
    NOW=$(date +%s)
    ELAPSED=$((NOW - LAST_COMPACT))

    if [ "$ELAPSED" -lt "$COOLDOWN_SECONDS" ]; then
        # 쿨다운 중 - 스킵
        REMAINING_COOLDOWN=$((COOLDOWN_SECONDS - ELAPSED))
        exit 0
    fi
fi

# 3. tmux 세션 확인
if [ -z "$TMUX" ]; then
    # tmux 세션이 아님 - 수동 안내만 제공
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "⚠️  컨텍스트 ${REMAINING}% - /compact 실행을 권장합니다"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    exit 0
fi

# 4. 스냅샷 저장 확인 (이미 statusline.sh에서 저장했어야 함)
LATEST_SNAPSHOT=$(ls -1t "$CONTEXT_DIR"/auto-snapshot-*.md 2>/dev/null | head -1)
if [ -z "$LATEST_SNAPSHOT" ]; then
    # 스냅샷 없음 - 먼저 저장
    "$PROJECT_ROOT/scripts/context-manager.sh" --auto-compact "$LEVEL" 2>/dev/null || true
    LATEST_SNAPSHOT=$(ls -1t "$CONTEXT_DIR"/auto-snapshot-*.md 2>/dev/null | head -1)
fi

# 스냅샷이 여전히 없으면 안전을 위해 스킵
if [ -z "$LATEST_SNAPSHOT" ]; then
    echo ""
    echo "⚠️  스냅샷 저장 실패 - /compact 자동 실행 취소"
    exit 0
fi

# 5. 사전 알림
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 컨텍스트 ${REMAINING}% - 자동 /compact 실행 중..."
echo "   스냅샷: $(basename "$LATEST_SNAPSHOT")"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 6. 쿨다운 타이머 기록
date +%s > "$COOLDOWN_FILE"

# 7. 트리거 파일에 compact 예정 표시
jq '. + {"compact_scheduled": true, "compact_time": "'"$(date -Iseconds)"'"}' \
    "$TRIGGER_FILE" > "$TRIGGER_FILE.tmp" && mv "$TRIGGER_FILE.tmp" "$TRIGGER_FILE"

# 8. tmux send-keys로 /compact 실행 (현재 pane에)
sleep 1  # 잠시 대기 (출력이 보이도록)
tmux send-keys "/compact" Enter

exit 0
