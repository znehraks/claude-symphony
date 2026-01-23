#!/bin/bash
# moodboard-manager.sh - Moodboard Collection and Analysis Manager
# Manages interactive moodboard collection and analysis workflow

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PROGRESS_FILE="$PROJECT_ROOT/state/progress.json"
CONFIG_FILE="$PROJECT_ROOT/config/ui-ux.yaml"
MOODBOARD_DIR="$PROJECT_ROOT/stages/04-ui-ux/inputs/moodboard"
OUTPUTS_DIR="$PROJECT_ROOT/stages/04-ui-ux/outputs"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check dependencies
check_dependencies() {
    if ! command -v jq &> /dev/null; then
        log_error "jq is required but not installed. Please install jq."
        exit 1
    fi
}

# Initialize moodboard directories
init_directories() {
    local dirs=(
        "$MOODBOARD_DIR/ui-references"
        "$MOODBOARD_DIR/brand-assets"
        "$MOODBOARD_DIR/sketches"
        "$MOODBOARD_DIR/inspirations"
        "$MOODBOARD_DIR/competitors"
        "$OUTPUTS_DIR"
    )

    for dir in "${dirs[@]}"; do
        if [[ ! -d "$dir" ]]; then
            mkdir -p "$dir"
            log_info "Created directory: $dir"
        fi
    done
}

# Get category directory mapping
get_category_dir() {
    local category="$1"
    case "$category" in
        ui|ui_screenshots|ui-references)
            echo "ui-references"
            ;;
        colors|color_palettes|brand|brand_assets|brand-assets|typography)
            echo "brand-assets"
            ;;
        sketches|wireframes)
            echo "sketches"
            ;;
        inspirations)
            echo "inspirations"
            ;;
        competitors)
            echo "competitors"
            ;;
        *)
            echo ""
            ;;
    esac
}

# Show moodboard status
show_status() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}                   Moodboard Status                         ${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo ""

    # Get state from progress.json
    local active=$(jq -r '.moodboard.collection_active // false' "$PROGRESS_FILE" 2>/dev/null || echo "false")
    local step=$(jq -r '.moodboard.current_step // "not started"' "$PROGRESS_FILE" 2>/dev/null || echo "not started")
    local iterations=$(jq -r '.moodboard.analysis_iterations // 0' "$PROGRESS_FILE" 2>/dev/null || echo "0")

    if [[ "$active" == "true" ]]; then
        echo -e "  Collection:      ${GREEN}ACTIVE${NC}"
        echo -e "  Current Step:    ${BLUE}$step${NC} / 4"
    else
        echo -e "  Collection:      ${YELLOW}INACTIVE${NC}"
    fi

    echo -e "  Analysis Iterations: ${iterations}"
    echo ""

    # Count images per category
    echo -e "${CYAN}  Images by Category:${NC}"

    local categories=("ui-references" "brand-assets" "sketches" "inspirations" "competitors")
    local total=0

    for category in "${categories[@]}"; do
        local dir="$MOODBOARD_DIR/$category"
        if [[ -d "$dir" ]]; then
            local count=$(find "$dir" -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.webp" -o -name "*.svg" -o -name "*.gif" \) 2>/dev/null | wc -l | tr -d ' ')
            printf "    %-20s %s files\n" "$category:" "$count"
            total=$((total + count))
        fi
    done

    echo ""
    echo -e "  ${MAGENTA}Total Images:${NC} $total"
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
}

# Start interactive collection flow
start_flow() {
    log_info "Starting interactive moodboard collection flow..."

    # Update state
    jq '.moodboard.collection_active = true | .moodboard.current_step = 1' \
       "$PROGRESS_FILE" > "${PROGRESS_FILE}.tmp" && mv "${PROGRESS_FILE}.tmp" "$PROGRESS_FILE"

    init_directories

    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}          Interactive Moodboard Collection                  ${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "This wizard will guide you through collecting visual references"
    echo "for your design system. Follow the prompts to build your moodboard."
    echo ""
    echo -e "${YELLOW}Step 1 of 4: Style Discovery${NC}"
    echo ""
    echo "What visual style are you aiming for?"
    echo ""
    echo "  1. Modern/Minimal    - Clean lines, whitespace, subtle colors"
    echo "  2. Bold/Colorful     - Vibrant colors, strong contrasts"
    echo "  3. Professional      - Trust, stability, formal"
    echo "  4. Playful/Creative  - Fun, unconventional, expressive"
    echo "  5. Custom            - Describe your own style"
    echo ""
    echo -e "Use ${BLUE}/moodboard style <number or description>${NC} to set your style."
    echo ""
}

# Set style selection
set_style() {
    local style="$1"

    local style_id=""
    case "$style" in
        1|modern|minimal|modern_minimal)
            style_id="modern_minimal"
            ;;
        2|bold|colorful|bold_colorful)
            style_id="bold_colorful"
            ;;
        3|professional|corporate)
            style_id="professional"
            ;;
        4|playful|creative)
            style_id="playful"
            ;;
        5|custom|*)
            style_id="custom"
            ;;
    esac

    jq --arg style "$style_id" \
       '.moodboard.selected_style = $style | .moodboard.current_step = 2' \
       "$PROGRESS_FILE" > "${PROGRESS_FILE}.tmp" && mv "${PROGRESS_FILE}.tmp" "$PROGRESS_FILE"

    log_success "Style set to: $style_id"

    echo ""
    echo -e "${YELLOW}Step 2 of 4: Category Selection${NC}"
    echo ""
    echo "What types of references do you want to collect?"
    echo ""
    echo "  ui          - UI Screenshots"
    echo "  colors      - Color Palettes"
    echo "  typography  - Typography samples"
    echo "  brand       - Brand Assets"
    echo "  sketches    - Wireframes/Sketches"
    echo "  competitors - Competitor Analysis"
    echo "  inspirations - General Inspirations"
    echo ""
    echo -e "Use ${BLUE}/moodboard add <category>${NC} to add images to a category."
    echo ""
}

# Add images to category
add_to_category() {
    local category="$1"
    local source="$2"

    local dir=$(get_category_dir "$category")

    if [[ -z "$dir" ]]; then
        log_error "Unknown category: $category"
        echo "Valid categories: ui, colors, typography, brand, sketches, competitors, inspirations"
        exit 1
    fi

    local target_dir="$MOODBOARD_DIR/$dir"
    mkdir -p "$target_dir"

    if [[ -z "$source" ]]; then
        echo ""
        echo "Adding images to: $category ($dir)"
        echo ""
        echo "Provide image sources:"
        echo "  - Local file path"
        echo "  - Image URL"
        echo "  - Figma link (if Figma MCP configured)"
        echo ""
        echo "Images will be saved to: $target_dir"
        echo ""
    elif [[ -f "$source" ]]; then
        # Copy local file
        local filename=$(basename "$source")
        cp "$source" "$target_dir/$filename"
        log_success "Added: $filename to $dir"
    elif [[ "$source" == http* ]]; then
        # Download from URL
        local filename=$(basename "$source" | cut -d'?' -f1)
        if [[ -z "$filename" || "$filename" == "/" ]]; then
            filename="image_$(date +%s).png"
        fi
        curl -sL "$source" -o "$target_dir/$filename"
        log_success "Downloaded: $filename to $dir"
    else
        log_error "Invalid source: $source"
        echo "Provide a valid file path or URL"
    fi
}

# Run analysis
run_analysis() {
    log_info "Running moodboard analysis..."

    # Count images
    local total=0
    for dir in "$MOODBOARD_DIR"/*; do
        if [[ -d "$dir" ]]; then
            local count=$(find "$dir" -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.webp" -o -name "*.svg" \) 2>/dev/null | wc -l | tr -d ' ')
            total=$((total + count))
        fi
    done

    if [[ "$total" -eq 0 ]]; then
        log_warning "No images found in moodboard directories"
        echo "Add images using: /moodboard add <category> <source>"
        exit 1
    fi

    log_info "Found $total images for analysis"

    # Update state
    local iterations=$(jq -r '.moodboard.analysis_iterations // 0' "$PROGRESS_FILE" 2>/dev/null || echo "0")
    iterations=$((iterations + 1))

    jq --argjson iter "$iterations" \
       '.moodboard.analysis_iterations = $iter | .moodboard.current_step = 4' \
       "$PROGRESS_FILE" > "${PROGRESS_FILE}.tmp" && mv "${PROGRESS_FILE}.tmp" "$PROGRESS_FILE"

    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}                  Analysis Instructions                     ${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "To analyze the moodboard images, Claude should:"
    echo ""
    echo "1. Read images from each moodboard directory"
    echo "2. Extract colors, typography, and layout patterns"
    echo "3. Generate design token recommendations"
    echo ""
    echo "Directories to analyze:"
    for dir in "$MOODBOARD_DIR"/*; do
        if [[ -d "$dir" ]]; then
            local count=$(find "$dir" -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.webp" -o -name "*.svg" \) 2>/dev/null | wc -l | tr -d ' ')
            if [[ "$count" -gt 0 ]]; then
                echo "  - $(basename "$dir"): $count images"
            fi
        fi
    done
    echo ""
    echo "After analysis, use '/moodboard feedback' to provide refinement feedback."
    echo ""
}

# Record feedback
record_feedback() {
    local feedback="$1"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local iteration=$(jq -r '.moodboard.analysis_iterations // 1' "$PROGRESS_FILE")

    jq --arg feedback "$feedback" \
       --arg timestamp "$timestamp" \
       --argjson iter "$iteration" \
       '.moodboard.feedback_history += [{"iteration": $iter, "feedback": $feedback, "timestamp": $timestamp}]' \
       "$PROGRESS_FILE" > "${PROGRESS_FILE}.tmp" && mv "${PROGRESS_FILE}.tmp" "$PROGRESS_FILE"

    log_success "Feedback recorded for iteration $iteration"
    echo ""
    echo "Feedback: $feedback"
    echo ""
    echo "Run '/moodboard analyze' again to apply refinements."
}

# Export design tokens
export_tokens() {
    log_info "Exporting design tokens..."

    mkdir -p "$OUTPUTS_DIR"

    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}                  Design Token Export                       ${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "Export locations:"
    echo "  - $OUTPUTS_DIR/design_tokens.json"
    echo "  - $OUTPUTS_DIR/design_system.md"
    echo "  - $OUTPUTS_DIR/component_spec.md"
    echo ""
    echo "Claude should generate these files based on the moodboard analysis."
    echo ""

    # Mark collection as complete
    jq '.moodboard.collection_active = false' \
       "$PROGRESS_FILE" > "${PROGRESS_FILE}.tmp" && mv "${PROGRESS_FILE}.tmp" "$PROGRESS_FILE"

    log_success "Export initiated. Files will be generated in outputs/"
}

# Reset moodboard state
reset_state() {
    log_warning "Resetting moodboard state..."

    jq '.moodboard = {
        "collection_active": false,
        "current_step": null,
        "selected_style": null,
        "selected_categories": [],
        "analysis_iterations": 0,
        "feedback_history": []
    }' "$PROGRESS_FILE" > "${PROGRESS_FILE}.tmp" && mv "${PROGRESS_FILE}.tmp" "$PROGRESS_FILE"

    log_success "Moodboard state reset"
}

# Show usage
show_usage() {
    echo ""
    echo "Usage: moodboard-manager.sh <command> [options]"
    echo ""
    echo "Commands:"
    echo "  status              Show moodboard collection status"
    echo "  start               Start interactive collection flow"
    echo "  style <selection>   Set visual style (1-5 or name)"
    echo "  add <category> [src] Add image to category"
    echo "  analyze             Run analysis on collected images"
    echo "  feedback \"...\"      Record feedback for refinement"
    echo "  export              Export design tokens"
    echo "  reset               Reset moodboard state"
    echo ""
    echo "Categories:"
    echo "  ui, colors, typography, brand, sketches, competitors, inspirations"
    echo ""
    echo "Examples:"
    echo "  moodboard-manager.sh start"
    echo "  moodboard-manager.sh style 1"
    echo "  moodboard-manager.sh add ui ~/Desktop/screenshot.png"
    echo "  moodboard-manager.sh add colors https://example.com/palette.png"
    echo "  moodboard-manager.sh analyze"
    echo "  moodboard-manager.sh feedback \"colors too muted\""
    echo ""
}

# Main
main() {
    check_dependencies

    local command="${1:-status}"

    case "$command" in
        status)
            show_status
            ;;
        start)
            start_flow
            ;;
        style)
            if [[ -z "$2" ]]; then
                log_error "Style selection required"
                exit 1
            fi
            set_style "$2"
            ;;
        add)
            if [[ -z "$2" ]]; then
                log_error "Category required"
                show_usage
                exit 1
            fi
            add_to_category "$2" "$3"
            ;;
        analyze)
            run_analysis
            ;;
        feedback)
            if [[ -z "$2" ]]; then
                log_error "Feedback text required"
                exit 1
            fi
            record_feedback "$2"
            ;;
        export)
            export_tokens
            ;;
        reset)
            reset_state
            ;;
        help|--help|-h)
            show_usage
            ;;
        *)
            log_error "Unknown command: $command"
            show_usage
            exit 1
            ;;
    esac
}

main "$@"
