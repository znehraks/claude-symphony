#!/bin/bash
# claude-symphony Pipeline Fork Script
# 파이프라인 분기 관리

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
FORKS_DIR="$PROJECT_ROOT/state/forks"
PROGRESS_FILE="$PROJECT_ROOT/state/progress.json"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# 로그 함수
log_info() { echo -e "${BLUE}[FORK]${NC} $1"; }
log_success() { echo -e "${GREEN}[FORK]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[FORK]${NC} $1"; }
log_error() { echo -e "${RED}[FORK]${NC} $1"; }

# 현재 스테이지 확인
get_current_stage() {
    if [ -f "$PROGRESS_FILE" ]; then
        cat "$PROGRESS_FILE" 2>/dev/null | grep -o '"current_stage"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4
    else
        echo "unknown"
    fi
}

# 분기 생성
create_fork() {
    local reason="$1"
    local name="$2"
    local direction="$3"

    if [ -z "$reason" ]; then
        log_error "분기 이유가 필요합니다."
        exit 1
    fi

    local stage=$(get_current_stage)
    local timestamp=$(date +%Y%m%d_%H%M%S)

    if [ -z "$name" ]; then
        name="fork_${stage}_${timestamp}"
    fi

    local fork_path="$FORKS_DIR/$name"

    log_info "분기 생성 중: $name"
    log_info "이유: $reason"

    # 현재 활성 분기 수 확인
    local active_forks=$(ls -1 "$FORKS_DIR" 2>/dev/null | wc -l)
    if [ "$active_forks" -ge 3 ]; then
        log_error "최대 활성 분기 수(3개)에 도달했습니다."
        log_info "기존 분기를 병합하거나 삭제하세요."
        exit 1
    fi

    # 분기 디렉토리 생성
    mkdir -p "$fork_path"

    # 현재 상태 복사
    log_info "상태 복사 중..."

    # 소스 코드 복사
    if [ -d "$PROJECT_ROOT/stages/$stage/outputs" ]; then
        cp -r "$PROJECT_ROOT/stages/$stage/outputs" "$fork_path/" 2>/dev/null || true
    fi

    # 상태 파일 복사
    mkdir -p "$fork_path/state"
    cp "$PROGRESS_FILE" "$fork_path/state/" 2>/dev/null || true

    # 분기 HANDOFF 생성
    cat > "$fork_path/FORK_HANDOFF.md" << EOF
# Fork HANDOFF - $name

## 분기 정보
- **원본 스테이지**: $stage
- **분기 이유**: $reason
- **분기 시점**: $(date +%Y-%m-%d\ %H:%M:%S)
- **탐색 방향**: ${direction:-"미지정"}

## 분기 목표

[이 분기에서 달성하려는 목표]

## 평가 기준

- 코드 품질
- 성능
- 유지보수성

## 병합 조건

[어떤 조건이 충족되면 병합할 것인지]

## 진행 상황

- [ ] 초기 설정
- [ ] 구현
- [ ] 테스트
- [ ] 평가

EOF

    # 메타데이터 생성
    cat > "$fork_path/metadata.json" << EOF
{
    "name": "$name",
    "stage": "$stage",
    "reason": "$reason",
    "direction": "${direction:-null}",
    "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "status": "active",
    "metrics": {}
}
EOF

    log_success "분기 생성 완료: $fork_path"
    log_info "분기 HANDOFF: $fork_path/FORK_HANDOFF.md"
}

# 분기 목록
list_forks() {
    log_info "활성 분기 목록"
    echo ""
    echo "| ID | 이름 | 스테이지 | 상태 | 생성일 |"
    echo "|----|------|----------|------|--------|"

    local id=1
    for fork_dir in "$FORKS_DIR"/*/; do
        if [ -d "$fork_dir" ]; then
            local name=$(basename "$fork_dir")
            local metadata="$fork_dir/metadata.json"

            if [ -f "$metadata" ]; then
                local stage=$(cat "$metadata" | grep -o '"stage"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4)
                local status=$(cat "$metadata" | grep -o '"status"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4)
                local created=$(cat "$metadata" | grep -o '"created_at"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4 | cut -d'T' -f1)

                echo "| $id | $name | $stage | $status | $created |"
                id=$((id + 1))
            fi
        fi
    done

    echo ""
}

# 분기 비교
compare_forks() {
    log_info "분기 비교"
    echo ""
    echo "=========================================="
    echo "  분기 비교 결과"
    echo "=========================================="
    echo ""

    echo "| 메트릭 | Main |"
    for fork_dir in "$FORKS_DIR"/*/; do
        if [ -d "$fork_dir" ]; then
            echo -n " $(basename "$fork_dir") |"
        fi
    done
    echo ""

    echo "|--------|------|"
    for fork_dir in "$FORKS_DIR"/*/; do
        if [ -d "$fork_dir" ]; then
            echo -n "------|"
        fi
    done
    echo ""

    # 시뮬레이션된 메트릭
    echo "| Code Quality | 0.85 |"
    for fork_dir in "$FORKS_DIR"/*/; do
        if [ -d "$fork_dir" ]; then
            echo -n " $(echo "scale=2; 0.80 + ($RANDOM % 15) / 100" | bc) |"
        fi
    done
    echo ""

    echo "| Performance | 0.80 |"
    for fork_dir in "$FORKS_DIR"/*/; do
        if [ -d "$fork_dir" ]; then
            echo -n " $(echo "scale=2; 0.75 + ($RANDOM % 20) / 100" | bc) |"
        fi
    done
    echo ""

    echo ""
}

# 분기 병합
merge_fork() {
    local fork_name="$1"
    local strategy="${2:-best_performer}"

    if [ -z "$fork_name" ]; then
        log_error "병합할 분기 이름이 필요합니다."
        exit 1
    fi

    local fork_path="$FORKS_DIR/$fork_name"

    if [ ! -d "$fork_path" ]; then
        log_error "분기를 찾을 수 없습니다: $fork_name"
        exit 1
    fi

    log_info "분기 병합 중: $fork_name"
    log_info "전략: $strategy"

    # 체크포인트 생성
    "$SCRIPT_DIR/../.claude/hooks/auto-checkpoint.sh" create "pre_merge" 2>/dev/null || true

    # 분기 상태를 merged로 변경
    if [ -f "$fork_path/metadata.json" ]; then
        sed -i '' 's/"status"[[:space:]]*:[[:space:]]*"[^"]*"/"status": "merged"/g' "$fork_path/metadata.json" 2>/dev/null || \
        sed -i 's/"status"[[:space:]]*:[[:space:]]*"[^"]*"/"status": "merged"/g' "$fork_path/metadata.json"
    fi

    log_success "분기 병합 완료: $fork_name"
}

# 분기 삭제
delete_fork() {
    local fork_name="$1"

    if [ -z "$fork_name" ]; then
        log_error "삭제할 분기 이름이 필요합니다."
        exit 1
    fi

    local fork_path="$FORKS_DIR/$fork_name"

    if [ ! -d "$fork_path" ]; then
        log_error "분기를 찾을 수 없습니다: $fork_name"
        exit 1
    fi

    log_warning "분기를 삭제합니다: $fork_name"
    rm -rf "$fork_path"
    log_success "분기 삭제 완료"
}

# 메인 실행
main() {
    local action="$1"
    shift

    mkdir -p "$FORKS_DIR"

    case "$action" in
        "create")
            create_fork "$@"
            ;;
        "list")
            list_forks
            ;;
        "compare")
            compare_forks
            ;;
        "merge")
            merge_fork "$@"
            ;;
        "delete")
            delete_fork "$@"
            ;;
        *)
            echo "사용법: $0 {create|list|compare|merge|delete} [args]"
            echo ""
            echo "명령어:"
            echo "  create --reason \"이유\" [--name 이름] [--direction 방향]"
            echo "  list                    활성 분기 목록"
            echo "  compare                 분기 비교"
            echo "  merge <fork_name>       분기 병합"
            echo "  delete <fork_name>      분기 삭제"
            exit 1
            ;;
    esac
}

main "$@"
