#!/bin/bash
# context-manager.sh - 컨텍스트 상태 관리
# claude-symphony workflow pipeline

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROGRESS_FILE="$PROJECT_ROOT/state/progress.json"
CONTEXT_DIR="$PROJECT_ROOT/state/context"
SETTINGS_FILE="$PROJECT_ROOT/.claude/settings.json"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

# 기본값
WARNING_THRESHOLD=50000
LIMIT_THRESHOLD=80000

# 설정 파일에서 임계값 로드
if [ -f "$SETTINGS_FILE" ] && command -v jq &> /dev/null; then
    WARNING_THRESHOLD=$(jq -r '.context.warning_threshold // 50000' "$SETTINGS_FILE")
    LIMIT_THRESHOLD=$(jq -r '.context.limit_threshold // 80000' "$SETTINGS_FILE")
fi

# 컨텍스트 디렉토리 생성
mkdir -p "$CONTEXT_DIR"

# 옵션 처리
ACTION="status"
DESCRIPTION=""
RESTORE_FILE=""
OUTPUT_JSON=false

TRIGGER_LEVEL=""

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --save) ACTION="save"; shift; DESCRIPTION="$1" ;;
        --compress) ACTION="compress" ;;
        --restore) ACTION="restore"; shift; RESTORE_FILE="$1" ;;
        --list) ACTION="list" ;;
        --clean) ACTION="clean" ;;
        --json) OUTPUT_JSON=true ;;
        --auto-compact) ACTION="auto_compact"; shift; TRIGGER_LEVEL="$1" ;;
        *) if [ -z "$DESCRIPTION" ]; then DESCRIPTION="$1"; fi ;;
    esac
    shift 2>/dev/null || true
done

# 현재 스테이지 가져오기
get_current_stage() {
    if [ -f "$PROGRESS_FILE" ] && command -v jq &> /dev/null; then
        jq -r '.current_stage // "none"' "$PROGRESS_FILE"
    else
        echo "unknown"
    fi
}

# 토큰 추정 (간단한 추정)
estimate_tokens() {
    # 실제로는 대화 로그를 분석해야 하지만, 여기서는 placeholder
    # 실제 구현에서는 Claude API나 로그 파일을 참조
    echo "45000"  # placeholder
}

# 진행률 바 생성
progress_bar() {
    local percent=$1
    local width=20
    local filled=$((percent * width / 100))
    local empty=$((width - filled))
    printf "["
    for ((i=0; i<filled; i++)); do printf "█"; done
    for ((i=0; i<empty; i++)); do printf "░"; done
    printf "]"
}

# 상태 표시
show_status() {
    local CURRENT_STAGE=$(get_current_stage)
    local ESTIMATED_TOKENS=$(estimate_tokens)
    local PERCENT=$((ESTIMATED_TOKENS * 100 / LIMIT_THRESHOLD))

    # 상태 결정
    local STATUS_TEXT="정상"
    local STATUS_COLOR=$GREEN
    if [ "$ESTIMATED_TOKENS" -ge "$LIMIT_THRESHOLD" ]; then
        STATUS_TEXT="한도 초과"
        STATUS_COLOR=$RED
    elif [ "$ESTIMATED_TOKENS" -ge "$WARNING_THRESHOLD" ]; then
        STATUS_TEXT="경고"
        STATUS_COLOR=$YELLOW
    fi

    if [ "$OUTPUT_JSON" = true ]; then
        echo "{\"tokens\":$ESTIMATED_TOKENS,\"limit\":$LIMIT_THRESHOLD,\"warning\":$WARNING_THRESHOLD,\"stage\":\"$CURRENT_STAGE\",\"percent\":$PERCENT}"
        return
    fi

    if [ "$ESTIMATED_TOKENS" -ge "$WARNING_THRESHOLD" ]; then
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo -e "⚠️ ${WHITE}Context Status${NC} - ${STATUS_COLOR}${STATUS_TEXT}${NC}"
    else
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo -e "📊 ${WHITE}Context Status${NC}"
    fi
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo -e "토큰 사용량: ${CYAN}~${ESTIMATED_TOKENS}${NC} / ${LIMIT_THRESHOLD}"
    echo -e "상태: $(progress_bar $PERCENT) ${PERCENT}% [${STATUS_COLOR}${STATUS_TEXT}${NC}]"
    echo ""
    echo "임계값:"
    if [ "$ESTIMATED_TOKENS" -ge "$WARNING_THRESHOLD" ]; then
        echo -e "• 경고 (${WARNING_THRESHOLD}): ${YELLOW}초과됨${NC}"
    else
        echo -e "• 경고 (${WARNING_THRESHOLD}): 여유 있음"
    fi
    echo -e "• 한도 (${LIMIT_THRESHOLD}): ~$((LIMIT_THRESHOLD - ESTIMATED_TOKENS)) 토큰 남음"
    echo ""
    echo -e "현재 스테이지: ${CYAN}$CURRENT_STAGE${NC}"

    # 저장된 스냅샷 목록
    if [ -d "$CONTEXT_DIR" ]; then
        SNAPSHOTS=$(ls -1 "$CONTEXT_DIR"/state-*.md 2>/dev/null | wc -l | tr -d ' ')
        if [ "$SNAPSHOTS" -gt 0 ]; then
            echo ""
            echo "[저장된 스냅샷]"
            ls -1t "$CONTEXT_DIR"/state-*.md 2>/dev/null | head -3 | while read -r f; do
                echo "• $(basename "$f")"
            done
        fi
    fi

    echo ""

    # 경고 시 권장 조치
    if [ "$ESTIMATED_TOKENS" -ge "$WARNING_THRESHOLD" ]; then
        echo -e "${YELLOW}⚠️ 경고 임계값 초과!${NC}"
        echo ""
        echo "권장 조치:"
        echo "1. /context --compress 로 압축"
        echo "2. /context --save 후 /clear"
    fi

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# 스냅샷 저장
save_snapshot() {
    local CURRENT_STAGE=$(get_current_stage)
    local TIMESTAMP=$(date +%Y%m%d-%H%M)
    local TIMESTAMP_READABLE=$(date "+%Y-%m-%d %H:%M")
    local FILENAME="state-$TIMESTAMP.md"
    local FILEPATH="$CONTEXT_DIR/$FILENAME"

    if [ -z "$DESCRIPTION" ]; then
        DESCRIPTION="컨텍스트 스냅샷"
    fi

    cat > "$FILEPATH" << EOF
# 작업 상태 저장 - $TIMESTAMP_READABLE

## 설명
$DESCRIPTION

## 현재 스테이지
$CURRENT_STAGE

## 진행 상황
EOF

    # progress.json에서 정보 추출
    if [ -f "$PROGRESS_FILE" ] && command -v jq &> /dev/null; then
        echo "" >> "$FILEPATH"
        echo "### 스테이지 상태" >> "$FILEPATH"
        jq -r '.stages | to_entries[] | "- \(.key): \(.value.status // "pending")"' "$PROGRESS_FILE" >> "$FILEPATH" 2>/dev/null || true
    fi

    cat >> "$FILEPATH" << EOF

## 복구 지침
1. 이 파일 읽기
2. stages/$CURRENT_STAGE/CLAUDE.md 참조
3. 작업 재개

## 참조 파일
- state/progress.json
- stages/$CURRENT_STAGE/outputs/
EOF

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "💾 ${WHITE}Context Snapshot Saved${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo -e "파일: ${CYAN}$FILEPATH${NC}"
    echo -e "설명: $DESCRIPTION"
    echo -e "스테이지: $CURRENT_STAGE"
    echo ""
    echo "[저장 내용]"
    echo "✓ 현재 스테이지 정보"
    echo "✓ 진행 상황"
    echo "✓ 복구 지침"
    echo ""
    echo -e "복구: ${GREEN}/context --restore $FILENAME${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# 스냅샷 목록
list_snapshots() {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "📂 ${WHITE}Context Snapshots${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    if [ ! -d "$CONTEXT_DIR" ] || [ -z "$(ls -A "$CONTEXT_DIR"/*.md 2>/dev/null)" ]; then
        echo -e "  ${GRAY}저장된 스냅샷이 없습니다.${NC}"
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        return
    fi

    printf " ${GRAY}%-25s %-15s %s${NC}\n" "파일" "크기" "수정일"
    echo "─────────────────────────────────────────────────"

    ls -1t "$CONTEXT_DIR"/*.md 2>/dev/null | while read -r f; do
        SIZE=$(du -h "$f" | cut -f1)
        MODIFIED=$(date -r "$f" "+%Y-%m-%d %H:%M" 2>/dev/null || stat -c %y "$f" 2>/dev/null | cut -d' ' -f1,2 | cut -d'.' -f1)
        printf " %-25s %-15s %s\n" "$(basename "$f")" "$SIZE" "$MODIFIED"
    done

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "복구: ${GREEN}/context --restore [filename]${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# 스냅샷 복구
restore_snapshot() {
    local FILE="$RESTORE_FILE"

    if [ -z "$FILE" ]; then
        # 최신 스냅샷 찾기
        FILE=$(ls -1t "$CONTEXT_DIR"/state-*.md 2>/dev/null | head -1)
        if [ -z "$FILE" ]; then
            echo -e "${RED}오류:${NC} 복구할 스냅샷이 없습니다."
            exit 1
        fi
        FILE=$(basename "$FILE")
    fi

    local FILEPATH="$CONTEXT_DIR/$FILE"
    if [ ! -f "$FILEPATH" ]; then
        FILEPATH="$CONTEXT_DIR/state-$FILE"
    fi
    if [ ! -f "$FILEPATH" ]; then
        echo -e "${RED}오류:${NC} 파일을 찾을 수 없습니다: $FILE"
        echo "  /context --list 로 목록을 확인하세요."
        exit 1
    fi

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "📂 ${WHITE}Context Restore${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo -e "파일: ${CYAN}$(basename "$FILEPATH")${NC}"
    echo ""
    echo "[내용 미리보기]"
    echo "─────────────────────────────────────────────────"
    head -20 "$FILEPATH"
    echo "..."
    echo "─────────────────────────────────────────────────"
    echo ""
    echo "이 파일의 내용을 참조하여 작업을 계속하세요."
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# 압축 실행 (placeholder - 실제로는 AI가 처리)
compress_context() {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "🗜️ ${WHITE}Context Compression${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "컨텍스트 압축을 실행합니다."
    echo ""
    echo "이 작업은 AI가 대화 내용을 분석하여:"
    echo "• 핵심 결정사항 유지"
    echo "• 긴 토론 요약"
    echo "• 불필요한 내용 제거"
    echo ""
    echo "context-compression 스킬이 활성화됩니다."
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# 자동 컨텍스트 관리 (Statusline API 트리거)
auto_compact() {
    local LEVEL="${TRIGGER_LEVEL:-warning}"
    local TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    local SNAPSHOT_FILE="$CONTEXT_DIR/auto-snapshot-$TIMESTAMP.md"
    local CURRENT_STAGE=$(get_current_stage)
    local TRIGGER_FILE="$CONTEXT_DIR/auto-trigger.json"

    # 트리거 정보 읽기
    local REMAINING="50"
    if [ -f "$TRIGGER_FILE" ]; then
        REMAINING=$(jq -r '.remaining // 50' "$TRIGGER_FILE" 2>/dev/null || echo "50")
    fi

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "🔄 ${WHITE}자동 컨텍스트 관리${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    if [ "$LEVEL" = "critical" ]; then
        echo -e "${RED}⚠️ 크리티컬: 잔여 컨텍스트 40% 이하${NC}"
    else
        echo -e "${YELLOW}⚠️ 경고: 잔여 컨텍스트 50% 이하 (${REMAINING}%)${NC}"
    fi
    echo ""

    # Step 1: 스냅샷 저장
    echo "📸 스냅샷 저장 중..."

    cat > "$SNAPSHOT_FILE" << EOF
# 자동 저장된 컨텍스트 스냅샷
- 저장 시간: $(date "+%Y-%m-%d %H:%M:%S")
- 현재 스테이지: $CURRENT_STAGE
- 트리거: 잔여 컨텍스트 ${REMAINING}% (레벨: $LEVEL)

## 현재 진행 상황
EOF

    # progress.json에서 스테이지 상태 추출
    if [ -f "$PROGRESS_FILE" ] && command -v jq &> /dev/null; then
        echo "" >> "$SNAPSHOT_FILE"
        echo "### 스테이지 상태" >> "$SNAPSHOT_FILE"
        jq -r '.stages | to_entries[] | select(.value.status != "pending") | "- \(.key): \(.value.status)"' "$PROGRESS_FILE" >> "$SNAPSHOT_FILE" 2>/dev/null || true

        # 최근 체크포인트 정보
        local CHECKPOINTS=$(jq -r '.checkpoints // [] | length' "$PROGRESS_FILE" 2>/dev/null || echo "0")
        if [ "$CHECKPOINTS" -gt 0 ]; then
            echo "" >> "$SNAPSHOT_FILE"
            echo "### 체크포인트" >> "$SNAPSHOT_FILE"
            echo "- 총 체크포인트: $CHECKPOINTS 개" >> "$SNAPSHOT_FILE"
            jq -r '.checkpoints[-1] // empty | "- 최근: \(.name // .timestamp)"' "$PROGRESS_FILE" >> "$SNAPSHOT_FILE" 2>/dev/null || true
        fi
    fi

    cat >> "$SNAPSHOT_FILE" << EOF

## 복구 지침
1. 이 파일 읽기
2. stages/$CURRENT_STAGE/CLAUDE.md 참조
3. stages/$CURRENT_STAGE/HANDOFF.md 참조 (있는 경우)
4. 작업 재개

## 참조 파일
- state/progress.json
- stages/$CURRENT_STAGE/outputs/
EOF

    echo -e "${GREEN}✓${NC} 스냅샷 저장 완료: $(basename "$SNAPSHOT_FILE")"
    echo ""

    # progress.json에 스냅샷 기록
    if [ -f "$PROGRESS_FILE" ] && command -v jq &> /dev/null; then
        # context_snapshots 배열이 없으면 생성
        local HAS_SNAPSHOTS=$(jq 'has("context_snapshots")' "$PROGRESS_FILE" 2>/dev/null || echo "false")
        if [ "$HAS_SNAPSHOTS" = "false" ]; then
            jq '. + {"context_snapshots": []}' "$PROGRESS_FILE" > "$PROGRESS_FILE.tmp" && mv "$PROGRESS_FILE.tmp" "$PROGRESS_FILE"
        fi

        # 스냅샷 정보 추가
        jq ".context_snapshots += [{\"file\": \"$SNAPSHOT_FILE\", \"reason\": \"auto-${LEVEL}\", \"remaining\": $REMAINING, \"timestamp\": \"$(date -Iseconds)\"}]" \
            "$PROGRESS_FILE" > "$PROGRESS_FILE.tmp" && mv "$PROGRESS_FILE.tmp" "$PROGRESS_FILE"
    fi

    # Step 2: 권장 조치 안내
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    if [ "$LEVEL" = "critical" ]; then
        echo -e "${RED}⚠️ 컨텍스트 임계값 도달 (40% 이하)${NC}"
        echo ""
        echo -e "스냅샷이 자동 저장되었습니다: ${CYAN}$(basename "$SNAPSHOT_FILE")${NC}"
        echo ""

        # 사용자 확인 프롬프트
        echo -e "${WHITE}컨텍스트를 초기화하시겠습니까?${NC}"
        echo ""
        echo "  [y] /clear 실행 (스냅샷에서 복구 가능)"
        echo "  [c] /compact 실행 (대화 요약 후 계속)"
        echo "  [n] 취소 (수동으로 처리)"
        echo ""
        read -p "선택 [y/c/n]: " -n 1 -r CLEAR_CHOICE
        echo ""
        echo ""

        case $CLEAR_CHOICE in
            [Yy])
                echo -e "${GREEN}✓${NC} /clear 실행 중..."
                echo ""

                # 복구 정보 저장
                echo "{\"action\": \"clear\", \"snapshot\": \"$SNAPSHOT_FILE\", \"timestamp\": \"$(date -Iseconds)\"}" > "$CONTEXT_DIR/pending-clear.json"

                # tmux를 통해 /clear 자동 실행
                if [ -n "$TMUX" ]; then
                    # 현재 tmux 세션에서 실행
                    sleep 1
                    tmux send-keys "/clear" Enter
                    echo -e "${GREEN}✓${NC} /clear 명령이 전송되었습니다."
                elif tmux list-sessions 2>/dev/null | grep -q "claude"; then
                    # claude 세션 찾아서 전송
                    CLAUDE_SESSION=$(tmux list-sessions 2>/dev/null | grep "claude" | head -1 | cut -d: -f1)
                    tmux send-keys -t "$CLAUDE_SESSION" "/clear" Enter
                    echo -e "${GREEN}✓${NC} /clear 명령이 '$CLAUDE_SESSION' 세션으로 전송되었습니다."
                else
                    echo -e "${YELLOW}⚠️${NC} tmux 세션을 찾을 수 없습니다."
                    echo "다음 명령을 수동으로 실행하세요:"
                    echo -e "${CYAN}/clear${NC}"
                fi

                echo ""
                echo "복구 시:"
                echo -e "${CYAN}/context --restore $(basename "$SNAPSHOT_FILE")${NC}"
                ;;
            [Cc])
                echo -e "${GREEN}✓${NC} /compact 실행 중..."
                echo ""

                # tmux를 통해 /compact 자동 실행
                if [ -n "$TMUX" ]; then
                    sleep 1
                    tmux send-keys "/compact" Enter
                    echo -e "${GREEN}✓${NC} /compact 명령이 전송되었습니다."
                elif tmux list-sessions 2>/dev/null | grep -q "claude"; then
                    CLAUDE_SESSION=$(tmux list-sessions 2>/dev/null | grep "claude" | head -1 | cut -d: -f1)
                    tmux send-keys -t "$CLAUDE_SESSION" "/compact" Enter
                    echo -e "${GREEN}✓${NC} /compact 명령이 '$CLAUDE_SESSION' 세션으로 전송되었습니다."
                else
                    echo -e "${YELLOW}⚠️${NC} tmux 세션을 찾을 수 없습니다."
                    echo "다음 명령을 수동으로 실행하세요:"
                    echo -e "${CYAN}/compact${NC}"
                fi
                ;;
            *)
                echo "취소되었습니다. 수동으로 /clear 또는 /compact를 실행하세요."
                ;;
        esac
    else
        echo -e "${YELLOW}⚠️ /compact 실행을 권장합니다${NC}"
        echo ""
        echo "실행 후 자동으로 스냅샷에서 복구됩니다."
        echo "저장된 스냅샷: $(basename "$SNAPSHOT_FILE")"
    fi
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # 터미널 벨 (알림)
    echo -e "\a"
}

# 오래된 스냅샷 정리
clean_snapshots() {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "🧹 ${WHITE}Clean Old Snapshots${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    # 7일 이상 된 스냅샷 찾기
    OLD_FILES=$(find "$CONTEXT_DIR" -name "state-*.md" -mtime +7 2>/dev/null)

    if [ -z "$OLD_FILES" ]; then
        echo "정리할 오래된 스냅샷이 없습니다."
    else
        echo "다음 파일이 삭제됩니다 (7일 이상):"
        echo "$OLD_FILES" | while read -r f; do
            echo "  - $(basename "$f")"
        done
        echo ""
        read -p "삭제하시겠습니까? [y/N] " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "$OLD_FILES" | xargs rm -f
            echo -e "${GREEN}✓${NC} 정리 완료"
        else
            echo "취소되었습니다."
        fi
    fi

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# 메인 로직
case $ACTION in
    status)
        show_status
        ;;
    save)
        save_snapshot
        ;;
    compress)
        compress_context
        ;;
    restore)
        restore_snapshot
        ;;
    list)
        list_snapshots
        ;;
    clean)
        clean_snapshots
        ;;
    auto_compact)
        auto_compact
        ;;
    *)
        show_status
        ;;
esac
