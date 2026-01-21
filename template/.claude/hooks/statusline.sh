#!/bin/bash
# statusline.sh - Claude Code Statusline API를 통한 실시간 컨텍스트 모니터링
# claude-symphony workflow pipeline
#
# Claude Code가 ~300ms마다 JSON을 stdin으로 전달합니다.
# 이 스크립트는 remaining_percentage를 분석하여 임계값 도달 시 자동 조치를 수행합니다.

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STATE_FILE="$PROJECT_ROOT/state/context/auto-trigger.json"
PROGRESS_FILE="$PROJECT_ROOT/state/progress.json"
CONTEXT_DIR="$PROJECT_ROOT/state/context"

# 컨텍스트 디렉토리 확인
mkdir -p "$CONTEXT_DIR"

# stdin에서 JSON 읽기
input=$(cat)

# JSON 파싱 (jq 필요)
if ! command -v jq &> /dev/null; then
    echo "[CTX] jq 필요"
    exit 0
fi

# 컨텍스트 데이터 추출
REMAINING=$(echo "$input" | jq -r '.context_window.remaining_percentage // 100' 2>/dev/null || echo "100")
USED=$(echo "$input" | jq -r '.context_window.used_percentage // 0' 2>/dev/null || echo "0")
MODEL=$(echo "$input" | jq -r '.model.display_name // "Claude"' 2>/dev/null || echo "Claude")
CONTEXT_SIZE=$(echo "$input" | jq -r '.context_window.context_window_size // 200000' 2>/dev/null || echo "200000")

# 현재 스테이지 가져오기
if [ -f "$PROGRESS_FILE" ]; then
    CURRENT_STAGE=$(jq -r '.current_stage // "none"' "$PROGRESS_FILE" 2>/dev/null || echo "none")
else
    CURRENT_STAGE="none"
fi

# 숫자 비교를 위한 정수 변환
REMAINING_INT=$(printf "%.0f" "$REMAINING" 2>/dev/null || echo "100")

# 상태 및 색상 결정
# 임계값: 60% 경고, 50% 자동저장, 40% 크리티컬
if [ "$REMAINING_INT" -le 40 ]; then
    # 40% 이하: 크리티컬 - /clear 권고
    STATUS_ICON="🔴"
    STATUS_TEXT="CTX≤40%"
    NEEDS_ACTION="critical"
elif [ "$REMAINING_INT" -le 50 ]; then
    # 50% 이하: 자동 스냅샷 트리거
    STATUS_ICON="⚠️"
    STATUS_TEXT="CTX≤50%"
    NEEDS_ACTION="warning"
elif [ "$REMAINING_INT" -le 60 ]; then
    # 60% 이하: 경고 표시
    STATUS_ICON="⚡"
    STATUS_TEXT="CTX≤60%"
    NEEDS_ACTION="notice"
else
    # 정상
    STATUS_ICON="✓"
    STATUS_TEXT=""
    NEEDS_ACTION="none"
fi

# 50% 이하일 때 자동 조치
if [ "$NEEDS_ACTION" = "warning" ] || [ "$NEEDS_ACTION" = "critical" ]; then
    # 이미 트리거 되었는지 확인 (중복 방지)
    ALREADY_TRIGGERED=false
    if [ -f "$STATE_FILE" ]; then
        TRIGGERED=$(jq -r '.triggered // false' "$STATE_FILE" 2>/dev/null || echo "false")
        TRIGGER_REMAINING=$(jq -r '.remaining // 100' "$STATE_FILE" 2>/dev/null || echo "100")

        # 같은 레벨에서 이미 트리거 되었으면 스킵
        if [ "$TRIGGERED" = "true" ]; then
            # 더 낮은 레벨로 떨어지면 다시 트리거
            if [ "$REMAINING_INT" -lt "$TRIGGER_REMAINING" ]; then
                ALREADY_TRIGGERED=false
            else
                ALREADY_TRIGGERED=true
            fi
        fi
    fi

    if [ "$ALREADY_TRIGGERED" = false ]; then
        # 트리거 상태 기록
        cat > "$STATE_FILE" << EOF
{
    "triggered": true,
    "timestamp": "$(date -Iseconds)",
    "remaining": $REMAINING_INT,
    "level": "$NEEDS_ACTION",
    "stage": "$CURRENT_STAGE"
}
EOF

        # 자동 스냅샷 생성 (백그라운드)
        if [ -x "$PROJECT_ROOT/scripts/context-manager.sh" ]; then
            "$PROJECT_ROOT/scripts/context-manager.sh" --auto-compact "$NEEDS_ACTION" 2>/dev/null &
        fi
    fi
fi

# 컨텍스트가 충분해지면 (70% 이상) 트리거 상태 리셋
if [ "$REMAINING_INT" -ge 70 ] && [ -f "$STATE_FILE" ]; then
    rm -f "$STATE_FILE"
fi

# 상태줄 출력
if [ -n "$STATUS_TEXT" ]; then
    echo "[$MODEL] $STATUS_ICON $STATUS_TEXT ${REMAINING_INT}% | Stage: $CURRENT_STAGE"
else
    echo "[$MODEL] $STATUS_ICON ${REMAINING_INT}% | Stage: $CURRENT_STAGE"
fi
