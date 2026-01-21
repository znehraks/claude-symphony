#!/bin/bash
# claude-symphony Auto-Checkpoint Hook
# Auto-checkpoint trigger detection and creation

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CONFIG_FILE="$PROJECT_ROOT/config/auto_checkpoint.yaml"
CHECKPOINTS_DIR="$PROJECT_ROOT/state/checkpoints"
PROGRESS_FILE="$PROJECT_ROOT/state/progress.json"

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Log functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Ensure checkpoint directory
ensure_checkpoint_dir() {
    mkdir -p "$CHECKPOINTS_DIR"
}

# Get current stage
get_current_stage() {
    if [ -f "$PROGRESS_FILE" ]; then
        cat "$PROGRESS_FILE" 2>/dev/null | grep -o '"current_stage"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4
    else
        echo "unknown"
    fi
}

# Calculate changed lines
get_changed_lines() {
    if git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
        git diff --stat 2>/dev/null | tail -1 | grep -oE '[0-9]+ insertion|[0-9]+ deletion' | grep -oE '[0-9]+' | paste -sd+ | bc 2>/dev/null || echo "0"
    else
        echo "0"
    fi
}

# Create checkpoint
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

    log_info "Creating checkpoint: $checkpoint_name"

    # Create checkpoint directory
    mkdir -p "$checkpoint_path"

    # Copy source code (exclude node_modules)
    if [ -d "$PROJECT_ROOT/src" ]; then
        rsync -a --exclude='node_modules' --exclude='.git' --exclude='state/checkpoints' \
            "$PROJECT_ROOT/src" "$checkpoint_path/" 2>/dev/null || true
    fi

    # Copy config files
    if [ -d "$PROJECT_ROOT/config" ]; then
        cp -r "$PROJECT_ROOT/config" "$checkpoint_path/" 2>/dev/null || true
    fi

    # Copy state files
    if [ -d "$PROJECT_ROOT/state" ]; then
        mkdir -p "$checkpoint_path/state"
        cp "$PROJECT_ROOT/state/progress.json" "$checkpoint_path/state/" 2>/dev/null || true
    fi

    # Copy stage outputs
    if [ -d "$PROJECT_ROOT/stages" ]; then
        mkdir -p "$checkpoint_path/stages"
        find "$PROJECT_ROOT/stages" -name "outputs" -type d -exec cp -r {} "$checkpoint_path/stages/" \; 2>/dev/null || true
    fi

    # Copy HANDOFF
    find "$PROJECT_ROOT/stages" -name "HANDOFF.md" -exec cp {} "$checkpoint_path/" \; 2>/dev/null || true

    # Create metadata
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

    log_success "Checkpoint created: $checkpoint_name"

    # Create Git tag (optional)
    if git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
        git tag -a "checkpoint/$checkpoint_name" -m "Auto-checkpoint: $trigger_reason" 2>/dev/null || true
    fi

    # Cleanup old checkpoints
    cleanup_old_checkpoints

    echo "$checkpoint_name"
}

# Cleanup old checkpoints
cleanup_old_checkpoints() {
    local max_checkpoints=20
    local checkpoint_count=$(ls -1 "$CHECKPOINTS_DIR" 2>/dev/null | wc -l)

    if [ "$checkpoint_count" -gt "$max_checkpoints" ]; then
        local to_delete=$((checkpoint_count - max_checkpoints))
        log_info "Cleaning up old checkpoints: ${to_delete}"

        # Delete oldest first (exclude milestones)
        ls -1t "$CHECKPOINTS_DIR" | tail -n "$to_delete" | while read -r checkpoint; do
            # Preserve milestone checkpoints
            if [[ ! "$checkpoint" =~ (stage_complete|pre_destructive|manual) ]]; then
                rm -rf "$CHECKPOINTS_DIR/$checkpoint"
                log_info "Deleted: $checkpoint"
            fi
        done
    fi
}

# Detect destructive action
check_destructive_action() {
    local command="$1"

    # Destructive patterns
    local patterns=("rm -rf" "git reset --hard" "drop table" "DELETE FROM" "truncate")

    for pattern in "${patterns[@]}"; do
        if [[ "$command" == *"$pattern"* ]]; then
            log_warning "Destructive action detected: $pattern"
            create_checkpoint "pre_destructive" ""
            return 0
        fi
    done

    return 1
}

# Main execution
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
            ls -1t "$CHECKPOINTS_DIR" 2>/dev/null || echo "No checkpoints"
            ;;
        *)
            echo "Usage: $0 {create|check-destructive|cleanup|list} [args]"
            exit 1
            ;;
    esac
}

# Call main only when executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
