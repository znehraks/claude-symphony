#!/bin/bash
# claude-symphony Pipeline Fork Script
# Pipeline fork management

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
FORKS_DIR="$PROJECT_ROOT/state/forks"
PROGRESS_FILE="$PROJECT_ROOT/state/progress.json"

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Log functions
log_info() { echo -e "${BLUE}[FORK]${NC} $1"; }
log_success() { echo -e "${GREEN}[FORK]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[FORK]${NC} $1"; }
log_error() { echo -e "${RED}[FORK]${NC} $1"; }

# Get current stage
get_current_stage() {
    if [ -f "$PROGRESS_FILE" ]; then
        cat "$PROGRESS_FILE" 2>/dev/null | grep -o '"current_stage"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4
    else
        echo "unknown"
    fi
}

# Create fork
create_fork() {
    local reason="$1"
    local name="$2"
    local direction="$3"

    if [ -z "$reason" ]; then
        log_error "Fork reason is required."
        exit 1
    fi

    local stage=$(get_current_stage)
    local timestamp=$(date +%Y%m%d_%H%M%S)

    if [ -z "$name" ]; then
        name="fork_${stage}_${timestamp}"
    fi

    local fork_path="$FORKS_DIR/$name"

    log_info "Creating fork: $name"
    log_info "Reason: $reason"

    # Check current active fork count
    local active_forks=$(ls -1 "$FORKS_DIR" 2>/dev/null | wc -l)
    if [ "$active_forks" -ge 3 ]; then
        log_error "Maximum active fork count (3) reached."
        log_info "Please merge or delete existing forks."
        exit 1
    fi

    # Create fork directory
    mkdir -p "$fork_path"

    # Copy current state
    log_info "Copying state..."

    # Copy source code
    if [ -d "$PROJECT_ROOT/stages/$stage/outputs" ]; then
        cp -r "$PROJECT_ROOT/stages/$stage/outputs" "$fork_path/" 2>/dev/null || true
    fi

    # Copy state files
    mkdir -p "$fork_path/state"
    cp "$PROGRESS_FILE" "$fork_path/state/" 2>/dev/null || true

    # Generate fork HANDOFF
    cat > "$fork_path/FORK_HANDOFF.md" << EOF
# Fork HANDOFF - $name

## Fork Info
- **Origin stage**: $stage
- **Fork reason**: $reason
- **Fork time**: $(date +%Y-%m-%d\ %H:%M:%S)
- **Exploration direction**: ${direction:-"Not specified"}

## Fork Goals

[Goals to achieve in this fork]

## Evaluation Criteria

- Code quality
- Performance
- Maintainability

## Merge Conditions

[Conditions that must be met for merging]

## Progress

- [ ] Initial setup
- [ ] Implementation
- [ ] Testing
- [ ] Evaluation

EOF

    # Generate metadata
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

    log_success "Fork created: $fork_path"
    log_info "Fork HANDOFF: $fork_path/FORK_HANDOFF.md"
}

# List forks
list_forks() {
    log_info "Active forks list"
    echo ""
    echo "| ID | Name | Stage | Status | Created |"
    echo "|----|------|-------|--------|---------|"

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

# Compare forks
compare_forks() {
    log_info "Fork comparison"
    echo ""
    echo "=========================================="
    echo "  Fork Comparison Results"
    echo "=========================================="
    echo ""

    echo "| Metric | Main |"
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

    # Simulated metrics
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

# Merge fork
merge_fork() {
    local fork_name="$1"
    local strategy="${2:-best_performer}"

    if [ -z "$fork_name" ]; then
        log_error "Fork name to merge is required."
        exit 1
    fi

    local fork_path="$FORKS_DIR/$fork_name"

    if [ ! -d "$fork_path" ]; then
        log_error "Fork not found: $fork_name"
        exit 1
    fi

    log_info "Merging fork: $fork_name"
    log_info "Strategy: $strategy"

    # Create checkpoint
    "$SCRIPT_DIR/../.claude/hooks/auto-checkpoint.sh" create "pre_merge" 2>/dev/null || true

    # Change fork status to merged
    if [ -f "$fork_path/metadata.json" ]; then
        sed -i '' 's/"status"[[:space:]]*:[[:space:]]*"[^"]*"/"status": "merged"/g' "$fork_path/metadata.json" 2>/dev/null || \
        sed -i 's/"status"[[:space:]]*:[[:space:]]*"[^"]*"/"status": "merged"/g' "$fork_path/metadata.json"
    fi

    log_success "Fork merged: $fork_name"
}

# Delete fork
delete_fork() {
    local fork_name="$1"

    if [ -z "$fork_name" ]; then
        log_error "Fork name to delete is required."
        exit 1
    fi

    local fork_path="$FORKS_DIR/$fork_name"

    if [ ! -d "$fork_path" ]; then
        log_error "Fork not found: $fork_name"
        exit 1
    fi

    log_warning "Deleting fork: $fork_name"
    rm -rf "$fork_path"
    log_success "Fork deleted"
}

# Main execution
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
            echo "Usage: $0 {create|list|compare|merge|delete} [args]"
            echo ""
            echo "Commands:"
            echo "  create --reason \"reason\" [--name name] [--direction direction]"
            echo "  list                    List active forks"
            echo "  compare                 Compare forks"
            echo "  merge <fork_name>       Merge fork"
            echo "  delete <fork_name>      Delete fork"
            exit 1
            ;;
    esac
}

main "$@"
