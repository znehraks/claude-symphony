#!/bin/bash
# restore-checkpoint.sh - 체크포인트 복구
# claude-symphony workflow pipeline

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROGRESS_FILE="$PROJECT_ROOT/state/progress.json"
CHECKPOINTS_DIR="$PROJECT_ROOT/state/checkpoints"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

# 옵션 처리
LIST_MODE=false
LATEST_MODE=false
FORCE_MODE=false
BACKUP_MODE=false
DRY_RUN=false
CP_ID=""

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --list) LIST_MODE=true ;;
        --latest) LATEST_MODE=true ;;
        --force) FORCE_MODE=true ;;
        --backup) BACKUP_MODE=true ;;
        --dry-run) DRY_RUN=true ;;
        CP-*) CP_ID="$1" ;;
        *) ;;
    esac
    shift
done

# jq 확인
if ! command -v jq &> /dev/null; then
    echo -e "${RED}오류:${NC} jq가 필요합니다."
    exit 1
fi

# 체크포인트 목록 함수
list_checkpoints() {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "💾 ${WHITE}Checkpoint List${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    if [ ! -d "$CHECKPOINTS_DIR" ] || [ -z "$(ls -A "$CHECKPOINTS_DIR" 2>/dev/null)" ]; then
        echo ""
        echo -e "  ${GRAY}체크포인트가 없습니다.${NC}"
        echo -e "  ${GRAY}/checkpoint 명령어로 생성하세요.${NC}"
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        return 0
    fi

    printf " ${GRAY}%-22s %-18s %-20s${NC}\n" "ID" "Stage" "Created"
    echo "─────────────────────────────────────────────────────────"

    COUNT=0
    for cp_dir in "$CHECKPOINTS_DIR"/CP-*; do
        if [ -d "$cp_dir" ]; then
            CP_NAME=$(basename "$cp_dir")
            META_FILE="$cp_dir/metadata.json"

            if [ -f "$META_FILE" ]; then
                STAGE=$(jq -r '.stage // "unknown"' "$META_FILE")
                CREATED=$(jq -r '.created_at // "unknown"' "$META_FILE")
                DESC=$(jq -r '.description // ""' "$META_FILE")

                # 날짜 포맷팅
                if [[ "$OSTYPE" == "darwin"* ]]; then
                    CREATED_FMT=$(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$CREATED" "+%Y-%m-%d %H:%M" 2>/dev/null || echo "$CREATED")
                else
                    CREATED_FMT=$(date -d "$CREATED" "+%Y-%m-%d %H:%M" 2>/dev/null || echo "$CREATED")
                fi

                printf " %-22s %-18s %s\n" "$CP_NAME" "$STAGE" "$CREATED_FMT"
                if [ -n "$DESC" ] && [ "$DESC" != "null" ]; then
                    printf "   ${GRAY}└─ %s${NC}\n" "$DESC"
                fi
                ((COUNT++))
            fi
        fi
    done

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "총 ${CYAN}${COUNT}개${NC} 체크포인트 | ${GREEN}/restore [ID]${NC}로 복구"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# 최신 체크포인트 찾기
find_latest_checkpoint() {
    local latest=""
    local latest_time=0

    for cp_dir in "$CHECKPOINTS_DIR"/CP-*; do
        if [ -d "$cp_dir" ]; then
            META_FILE="$cp_dir/metadata.json"
            if [ -f "$META_FILE" ]; then
                CREATED=$(jq -r '.created_at // ""' "$META_FILE")
                if [ -n "$CREATED" ]; then
                    # 타임스탬프 비교 (간단히 문자열 비교)
                    if [[ "$CREATED" > "$latest_time" ]]; then
                        latest_time="$CREATED"
                        latest=$(basename "$cp_dir")
                    fi
                fi
            fi
        fi
    done

    echo "$latest"
}

# 복구 함수
restore_checkpoint() {
    local cp_id=$1
    local cp_dir="$CHECKPOINTS_DIR/$cp_id"

    if [ ! -d "$cp_dir" ]; then
        echo -e "${RED}오류:${NC} 체크포인트를 찾을 수 없습니다: $cp_id"
        echo "  /restore --list 로 목록을 확인하세요."
        exit 1
    fi

    META_FILE="$cp_dir/metadata.json"
    STAGE=$(jq -r '.stage // "unknown"' "$META_FILE")
    DESC=$(jq -r '.description // ""' "$META_FILE")
    CREATED=$(jq -r '.created_at // "unknown"' "$META_FILE")

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "⚠️  ${WHITE}체크포인트 복구${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "체크포인트: ${CYAN}$cp_id${NC}"
    echo -e "스테이지:   ${CYAN}$STAGE${NC}"
    if [ -n "$DESC" ] && [ "$DESC" != "null" ]; then
        echo -e "설명:       $DESC"
    fi
    echo -e "생성일:     $CREATED"
    echo ""

    if [ "$DRY_RUN" = true ]; then
        echo -e "${YELLOW}[DRY-RUN] 실제 복구를 실행하지 않습니다.${NC}"
        echo ""
        echo "복구될 파일:"
        find "$cp_dir" -type f | while read -r f; do
            echo "  - $(basename "$f")"
        done
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        return 0
    fi

    if [ "$FORCE_MODE" = false ]; then
        echo -e "${YELLOW}⚠️  경고: 현재 상태가 해당 시점으로 복구됩니다.${NC}"
        echo -e "   현재 변경사항이 손실될 수 있습니다."
        echo ""
        read -p "복구를 진행하시겠습니까? [y/N] " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}취소되었습니다.${NC}"
            exit 0
        fi
    fi

    echo ""
    echo "복구 중..."

    # 현재 상태 백업 (옵션)
    if [ "$BACKUP_MODE" = true ]; then
        BACKUP_ID="BACKUP-$(date +%Y%m%d-%H%M%S)"
        BACKUP_DIR="$CHECKPOINTS_DIR/$BACKUP_ID"
        mkdir -p "$BACKUP_DIR"
        cp "$PROGRESS_FILE" "$BACKUP_DIR/progress.json" 2>/dev/null || true
        echo -e "${GREEN}✓${NC} 현재 상태 백업됨: $BACKUP_ID"
    fi

    # progress.json 복원
    if [ -f "$cp_dir/progress.json" ]; then
        cp "$cp_dir/progress.json" "$PROGRESS_FILE"
        echo -e "${GREEN}✓${NC} progress.json 복원됨"
    fi

    # outputs 복원
    STAGE_DIR="$PROJECT_ROOT/stages/$STAGE"
    if [ -d "$cp_dir/outputs" ]; then
        rm -rf "$STAGE_DIR/outputs" 2>/dev/null || true
        cp -r "$cp_dir/outputs" "$STAGE_DIR/"
        FILE_COUNT=$(find "$cp_dir/outputs" -type f | wc -l | tr -d ' ')
        echo -e "${GREEN}✓${NC} outputs 파일 복원됨 (${FILE_COUNT}개)"
    fi

    # HANDOFF.md 복원
    if [ -f "$cp_dir/HANDOFF.md" ]; then
        cp "$cp_dir/HANDOFF.md" "$STAGE_DIR/"
        echo -e "${GREEN}✓${NC} HANDOFF.md 복원됨"
    fi

    # progress.json에서 현재 스테이지 업데이트
    jq ".current_stage = \"$STAGE\" | .stages.\"$STAGE\".status = \"in_progress\"" \
        "$PROGRESS_FILE" > "${PROGRESS_FILE}.tmp" && mv "${PROGRESS_FILE}.tmp" "$PROGRESS_FILE"

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${GREEN}✅${NC} 체크포인트 복구 완료!"
    echo -e "현재 스테이지: ${CYAN}$STAGE${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# 메인 로직
if [ "$LIST_MODE" = true ]; then
    list_checkpoints
    exit 0
fi

if [ "$LATEST_MODE" = true ]; then
    CP_ID=$(find_latest_checkpoint)
    if [ -z "$CP_ID" ]; then
        echo -e "${RED}오류:${NC} 복구할 체크포인트가 없습니다."
        exit 1
    fi
    echo -e "최신 체크포인트: ${CYAN}$CP_ID${NC}"
    restore_checkpoint "$CP_ID"
    exit 0
fi

if [ -n "$CP_ID" ]; then
    restore_checkpoint "$CP_ID"
    exit 0
fi

# 인자 없으면 도움말
echo "사용법:"
echo "  /restore --list          체크포인트 목록 보기"
echo "  /restore --latest        최신 체크포인트로 복구"
echo "  /restore [CP-ID]         특정 체크포인트로 복구"
echo ""
echo "옵션:"
echo "  --force     확인 없이 복구"
echo "  --backup    복구 전 현재 상태 백업"
echo "  --dry-run   실제 복구 없이 미리보기"
