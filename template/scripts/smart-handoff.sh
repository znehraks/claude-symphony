#!/bin/bash
# claude-symphony Smart HANDOFF Script
# Smart context extraction and HANDOFF generation

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PROGRESS_FILE="$PROJECT_ROOT/state/progress.json"
CONTEXT_DIR="$PROJECT_ROOT/state/context"

# Color definitions
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Log functions
log_info() { echo -e "${BLUE}[HANDOFF]${NC} $1"; }
log_success() { echo -e "${GREEN}[HANDOFF]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[HANDOFF]${NC} $1"; }

# Get current stage
get_current_stage() {
    if [ -f "$PROGRESS_FILE" ]; then
        cat "$PROGRESS_FILE" 2>/dev/null | grep -o '"current_stage"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4
    else
        echo "unknown"
    fi
}

# Extract changed files from Git
extract_changed_files() {
    log_info "Extracting changed files..."

    if git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
        echo "### Modified Files"
        echo ""
        echo "| File | Change Type | Changes |"
        echo "|------|-------------|---------|"

        git diff --stat HEAD~10 2>/dev/null | head -20 | while read -r line; do
            if [[ "$line" =~ ^[[:space:]]*([^|]+)\|[[:space:]]*([0-9]+) ]]; then
                local file="${BASH_REMATCH[1]}"
                local changes="${BASH_REMATCH[2]}"
                echo "| ${file} | modified | ${changes} |"
            fi
        done

        echo ""
    else
        echo "Not a Git repository."
    fi
}

# Extract recent commits
extract_recent_commits() {
    log_info "Extracting recent commits..."

    if git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
        echo "### Recent Commits"
        echo ""

        git log --oneline -5 2>/dev/null | while read -r line; do
            echo "- $line"
        done

        echo ""
    fi
}

# Generate HANDOFF template
generate_handoff() {
    local stage="$1"
    local mode="$2"
    local stage_dir="$PROJECT_ROOT/stages/$stage"
    local handoff_file="$stage_dir/HANDOFF.md"

    log_info "Generating HANDOFF: $stage"

    mkdir -p "$stage_dir"

    # Timestamp
    local timestamp=$(date +%Y-%m-%d\ %H:%M:%S)

    cat > "$handoff_file" << EOF
# HANDOFF - $stage

> Generated: $timestamp
> Mode: $mode

## Summary

[Summarize stage completion status in 1-2 sentences]

## Completed Tasks

- [ ] Completed task 1
- [ ] Completed task 2
- [ ] Completed task 3

## Key Decisions

### Decision 1
- **Choice**: [Selected option]
- **Reason**: [Selection rationale]
- **Alternatives**: [Considered alternatives]

$(extract_changed_files)

$(extract_recent_commits)

## Pending Issues

- [ ] Issue 1 (Priority: High)
- [ ] Issue 2 (Priority: Medium)

## Next Steps

1. [First immediately actionable item]
2. [Second action]
3. [Third action]

## References

- Previous HANDOFF: [link]
- Related documents: [link]

---

## AI Call Log

| AI | Time | Purpose | Result |
|----|------|---------|--------|
| - | - | - | - |

EOF

    log_success "HANDOFF generated: $handoff_file"
}

# Compact mode HANDOFF
generate_compact_handoff() {
    local stage="$1"
    local stage_dir="$PROJECT_ROOT/stages/$stage"
    local handoff_file="$stage_dir/HANDOFF.md"

    log_info "Generating compact HANDOFF: $stage"

    mkdir -p "$stage_dir"

    cat > "$handoff_file" << EOF
# HANDOFF - $stage (Compact)

> $(date +%Y-%m-%d\ %H:%M:%S)

## Critical

[Blocking issues and items requiring immediate resolution]

## Next Actions

1. [First immediately actionable item]
2. [Second action]

## Context

[Minimum essential context]

EOF

    log_success "Compact HANDOFF generated: $handoff_file"
}

# Recovery detailed HANDOFF
generate_recovery_handoff() {
    local stage="$1"
    local stage_dir="$PROJECT_ROOT/stages/$stage"
    local handoff_file="$stage_dir/HANDOFF_RECOVERY.md"

    log_info "Generating recovery HANDOFF: $stage"

    mkdir -p "$stage_dir"

    cat > "$handoff_file" << EOF
# HANDOFF - $stage (Recovery)

> $(date +%Y-%m-%d\ %H:%M:%S)

## Full Context

### Current State
[Detailed state description]

### All Completed Tasks
[Complete task list]

### All Decisions
[Full decision list]

$(extract_changed_files)

$(extract_recent_commits)

## Step-by-Step Recovery

### Step 1: Verify Environment
\`\`\`bash
# Required commands
\`\`\`

### Step 2: Restore State
[Restoration procedure]

### Step 3: Resume Work
[Resume procedure]

## Related Checkpoints

- [Checkpoint list]

EOF

    log_success "Recovery HANDOFF generated: $handoff_file"
}

# Main execution
main() {
    local mode="${1:-default}"
    local stage="${2:-$(get_current_stage)}"

    if [ "$stage" = "unknown" ]; then
        log_warning "Cannot determine current stage. Using default value"
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
            echo "Usage: $0 [default|compact|recovery] [stage_id]"
            exit 1
            ;;
    esac
}

main "$@"
