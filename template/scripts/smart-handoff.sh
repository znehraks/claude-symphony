#!/bin/bash
# claude-symphony Smart HANDOFF Script
# 스마트 컨텍스트 추출 및 HANDOFF 생성

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PROGRESS_FILE="$PROJECT_ROOT/state/progress.json"
CONTEXT_DIR="$PROJECT_ROOT/state/context"

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 로그 함수
log_info() { echo -e "${BLUE}[HANDOFF]${NC} $1"; }
log_success() { echo -e "${GREEN}[HANDOFF]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[HANDOFF]${NC} $1"; }

# 현재 스테이지 확인
get_current_stage() {
    if [ -f "$PROGRESS_FILE" ]; then
        cat "$PROGRESS_FILE" 2>/dev/null | grep -o '"current_stage"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4
    else
        echo "unknown"
    fi
}

# Git 변경 파일 추출
extract_changed_files() {
    log_info "변경된 파일 추출 중..."

    if git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
        echo "### 수정된 파일"
        echo ""
        echo "| 파일 | 변경 유형 | 변경량 |"
        echo "|------|----------|--------|"

        git diff --stat HEAD~10 2>/dev/null | head -20 | while read -r line; do
            if [[ "$line" =~ ^[[:space:]]*([^|]+)\|[[:space:]]*([0-9]+) ]]; then
                local file="${BASH_REMATCH[1]}"
                local changes="${BASH_REMATCH[2]}"
                echo "| ${file} | modified | ${changes} |"
            fi
        done

        echo ""
    else
        echo "Git 저장소가 아닙니다."
    fi
}

# 최근 커밋 추출
extract_recent_commits() {
    log_info "최근 커밋 추출 중..."

    if git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
        echo "### 최근 커밋"
        echo ""

        git log --oneline -5 2>/dev/null | while read -r line; do
            echo "- $line"
        done

        echo ""
    fi
}

# HANDOFF 템플릿 생성
generate_handoff() {
    local stage="$1"
    local mode="$2"
    local stage_dir="$PROJECT_ROOT/stages/$stage"
    local handoff_file="$stage_dir/HANDOFF.md"

    log_info "HANDOFF 생성 중: $stage"

    mkdir -p "$stage_dir"

    # 타임스탬프
    local timestamp=$(date +%Y-%m-%d\ %H:%M:%S)

    cat > "$handoff_file" << EOF
# HANDOFF - $stage

> 생성 시간: $timestamp
> 모드: $mode

## 요약

[스테이지 완료 상태를 1-2문장으로 요약]

## 완료된 작업

- [ ] 완료된 작업 1
- [ ] 완료된 작업 2
- [ ] 완료된 작업 3

## 핵심 결정사항

### 결정 1
- **선택**: [선택한 옵션]
- **이유**: [선택 이유]
- **대안**: [고려한 대안]

$(extract_changed_files)

$(extract_recent_commits)

## 대기 이슈

- [ ] 이슈 1 (우선순위: 높음)
- [ ] 이슈 2 (우선순위: 중간)

## 다음 단계

1. [즉시 실행 가능한 첫 번째 액션]
2. [두 번째 액션]
3. [세 번째 액션]

## 참조

- 이전 HANDOFF: [링크]
- 관련 문서: [링크]

---

## AI 호출 기록

| AI | 시간 | 목적 | 결과 |
|----|------|------|------|
| - | - | - | - |

EOF

    log_success "HANDOFF 생성 완료: $handoff_file"
}

# 컴팩트 모드 HANDOFF
generate_compact_handoff() {
    local stage="$1"
    local stage_dir="$PROJECT_ROOT/stages/$stage"
    local handoff_file="$stage_dir/HANDOFF.md"

    log_info "컴팩트 HANDOFF 생성 중: $stage"

    mkdir -p "$stage_dir"

    cat > "$handoff_file" << EOF
# HANDOFF - $stage (Compact)

> $(date +%Y-%m-%d\ %H:%M:%S)

## Critical

[차단 이슈 및 즉시 해결 필요 사항]

## Next Actions

1. [첫 번째 즉시 실행 액션]
2. [두 번째 액션]

## Context

[최소 필수 컨텍스트]

EOF

    log_success "컴팩트 HANDOFF 생성 완료: $handoff_file"
}

# 복구용 상세 HANDOFF
generate_recovery_handoff() {
    local stage="$1"
    local stage_dir="$PROJECT_ROOT/stages/$stage"
    local handoff_file="$stage_dir/HANDOFF_RECOVERY.md"

    log_info "복구용 HANDOFF 생성 중: $stage"

    mkdir -p "$stage_dir"

    cat > "$handoff_file" << EOF
# HANDOFF - $stage (Recovery)

> $(date +%Y-%m-%d\ %H:%M:%S)

## Full Context

### 현재 상태
[상세 상태 설명]

### 완료된 모든 작업
[상세 작업 목록]

### 모든 결정사항
[결정사항 전체 목록]

$(extract_changed_files)

$(extract_recent_commits)

## Step-by-Step Recovery

### 1단계: 환경 확인
\`\`\`bash
# 필요한 명령어
\`\`\`

### 2단계: 상태 복원
[복원 절차]

### 3단계: 작업 재개
[재개 절차]

## 관련 체크포인트

- [체크포인트 목록]

EOF

    log_success "복구용 HANDOFF 생성 완료: $handoff_file"
}

# 메인 실행
main() {
    local mode="${1:-default}"
    local stage="${2:-$(get_current_stage)}"

    if [ "$stage" = "unknown" ]; then
        log_warning "현재 스테이지를 확인할 수 없습니다. 기본값 사용"
        stage="00-unknown"
    fi

    case "$mode" in
        "default"|"smart")
            generate_handoff "$stage" "smart"
            ;;
        "compact")
            generate_compact_handoff "$stage"
            ;;
        "recovery")
            generate_recovery_handoff "$stage"
            ;;
        *)
            echo "사용법: $0 [default|compact|recovery] [stage_id]"
            exit 1
            ;;
    esac
}

main "$@"
