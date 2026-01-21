#!/bin/bash
# claude-symphony Auto-Checkpoint Hook
# 자동 체크포인트 트리거 감지 및 생성

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CONFIG_FILE="$PROJECT_ROOT/config/auto_checkpoint.yaml"
CHECKPOINTS_DIR="$PROJECT_ROOT/state/checkpoints"
PROGRESS_FILE="$PROJECT_ROOT/state/progress.json"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 로그 함수
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 체크포인트 디렉토리 확인
ensure_checkpoint_dir() {
    mkdir -p "$CHECKPOINTS_DIR"
}

# 현재 스테이지 확인
get_current_stage() {
    if [ -f "$PROGRESS_FILE" ]; then
        cat "$PROGRESS_FILE" 2>/dev/null | grep -o '"current_stage"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4
    else
        echo "unknown"
    fi
}

# 변경된 라인 수 계산
get_changed_lines() {
    if git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
        git diff --stat 2>/dev/null | tail -1 | grep -oE '[0-9]+ insertion|[0-9]+ deletion' | grep -oE '[0-9]+' | paste -sd+ | bc 2>/dev/null || echo "0"
    else
        echo "0"
    fi
}

# 체크포인트 생성
create_checkpoint() {
    local trigger_reason="$1"
    local checkpoint_name="$2"

    ensure_checkpoint_dir

    local timestamp=$(date +%Y%m%d_%H%M%S)
    local stage=$(get_current_stage)

    if [ -z "$checkpoint_name" ]; then
        checkpoint_name="${trigger_reason}_${stage}_${timestamp}"
    fi

    local checkpoint_path="$CHECKPOINTS_DIR/$checkpoint_name"

    log_info "체크포인트 생성 중: $checkpoint_name"

    # 체크포인트 디렉토리 생성
    mkdir -p "$checkpoint_path"

    # 소스 코드 복사 (node_modules 제외)
    if [ -d "$PROJECT_ROOT/src" ]; then
        rsync -a --exclude='node_modules' --exclude='.git' --exclude='state/checkpoints' \
            "$PROJECT_ROOT/src" "$checkpoint_path/" 2>/dev/null || true
    fi

    # 설정 파일 복사
    if [ -d "$PROJECT_ROOT/config" ]; then
        cp -r "$PROJECT_ROOT/config" "$checkpoint_path/" 2>/dev/null || true
    fi

    # 상태 파일 복사
    if [ -d "$PROJECT_ROOT/state" ]; then
        mkdir -p "$checkpoint_path/state"
        cp "$PROJECT_ROOT/state/progress.json" "$checkpoint_path/state/" 2>/dev/null || true
    fi

    # 스테이지 outputs 복사
    if [ -d "$PROJECT_ROOT/stages" ]; then
        mkdir -p "$checkpoint_path/stages"
        find "$PROJECT_ROOT/stages" -name "outputs" -type d -exec cp -r {} "$checkpoint_path/stages/" \; 2>/dev/null || true
    fi

    # HANDOFF 복사
    find "$PROJECT_ROOT/stages" -name "HANDOFF.md" -exec cp {} "$checkpoint_path/" \; 2>/dev/null || true

    # 메타데이터 생성
    cat > "$checkpoint_path/metadata.json" << EOF
{
    "name": "$checkpoint_name",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "trigger": "$trigger_reason",
    "stage": "$stage",
    "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
    "files_changed": $(git diff --stat 2>/dev/null | grep -c '|' || echo 0)
}
EOF

    log_success "체크포인트 생성 완료: $checkpoint_name"

    # Git 태그 생성 (옵션)
    if git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
        git tag -a "checkpoint/$checkpoint_name" -m "Auto-checkpoint: $trigger_reason" 2>/dev/null || true
    fi

    # 오래된 체크포인트 정리
    cleanup_old_checkpoints

    echo "$checkpoint_name"
}

# 오래된 체크포인트 정리
cleanup_old_checkpoints() {
    local max_checkpoints=20
    local checkpoint_count=$(ls -1 "$CHECKPOINTS_DIR" 2>/dev/null | wc -l)

    if [ "$checkpoint_count" -gt "$max_checkpoints" ]; then
        local to_delete=$((checkpoint_count - max_checkpoints))
        log_info "오래된 체크포인트 정리: ${to_delete}개"

        # 가장 오래된 것부터 삭제 (milestone 제외)
        ls -1t "$CHECKPOINTS_DIR" | tail -n "$to_delete" | while read -r checkpoint; do
            # milestone 체크포인트는 보존
            if [[ ! "$checkpoint" =~ (stage_complete|pre_destructive|manual) ]]; then
                rm -rf "$CHECKPOINTS_DIR/$checkpoint"
                log_info "삭제됨: $checkpoint"
            fi
        done
    fi
}

# 파괴적 작업 감지
check_destructive_action() {
    local command="$1"

    # 파괴적 패턴
    local patterns=("rm -rf" "git reset --hard" "drop table" "DELETE FROM" "truncate")

    for pattern in "${patterns[@]}"; do
        if [[ "$command" == *"$pattern"* ]]; then
            log_warning "파괴적 작업 감지: $pattern"
            create_checkpoint "pre_destructive" ""
            return 0
        fi
    done

    return 1
}

# 메인 실행
main() {
    local action="$1"
    shift

    case "$action" in
        "create")
            create_checkpoint "${1:-manual}" "${2:-}"
            ;;
        "check-destructive")
            check_destructive_action "$*"
            ;;
        "cleanup")
            cleanup_old_checkpoints
            ;;
        "list")
            ls -1t "$CHECKPOINTS_DIR" 2>/dev/null || echo "체크포인트 없음"
            ;;
        *)
            echo "사용법: $0 {create|check-destructive|cleanup|list} [args]"
            exit 1
            ;;
    esac
}

# 직접 실행 시에만 main 호출
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
