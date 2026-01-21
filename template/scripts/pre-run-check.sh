#!/bin/bash
# pre-run-check.sh - Pre-pipeline execution check script
# claude-symphony workflow pipeline
#
# This script verifies all required tools and settings are correct before running the pipeline.

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Counters
PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

# Store results
RESULTS=()

# Print header
print_header() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  🔍 claude-symphony Pre-Run Checklist${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# Section header
print_section() {
    echo ""
    echo -e "${BLUE}▸ $1${NC}"
    echo -e "${BLUE}──────────────────────────────────────${NC}"
}

# Result output functions
check_pass() {
    echo -e "  ${GREEN}✓${NC} $1"
    PASS_COUNT=$((PASS_COUNT + 1))
    RESULTS+=("PASS: $1")
}

check_fail() {
    echo -e "  ${RED}✗${NC} $1"
    FAIL_COUNT=$((FAIL_COUNT + 1))
    RESULTS+=("FAIL: $1")
}

check_warn() {
    echo -e "  ${YELLOW}⚠${NC} $1"
    WARN_COUNT=$((WARN_COUNT + 1))
    RESULTS+=("WARN: $1")
}

# =============================================================================
# 1. AI CLI Installation Check
# =============================================================================
check_ai_cli() {
    print_section "AI CLI Installation Check"

    # Gemini CLI
    if command -v gemini &> /dev/null; then
        GEMINI_PATH=$(which gemini)
        check_pass "Gemini CLI installed: $GEMINI_PATH"
    else
        check_fail "Gemini CLI not installed - Issues expected in stages 01, 03, 04"
    fi

    # Codex CLI
    if command -v codex &> /dev/null; then
        CODEX_PATH=$(which codex)
        check_pass "Codex CLI installed: $CODEX_PATH"
    else
        check_fail "Codex CLI not installed - Issues expected in stages 07, 09"
    fi

    # Claude Code (current environment)
    check_pass "Claude Code: Currently running"
}

# =============================================================================
# 2. tmux Check
# =============================================================================
check_tmux() {
    print_section "tmux Environment Check"

    if command -v tmux &> /dev/null; then
        TMUX_VERSION=$(tmux -V)
        check_pass "tmux installed: $TMUX_VERSION"
    else
        check_fail "tmux not installed - External AI calls not possible"
        return
    fi

    # Check existing sessions
    if tmux has-session -t ax-gemini 2>/dev/null; then
        check_pass "tmux session 'ax-gemini' active"
    else
        check_warn "tmux session 'ax-gemini' not found - Will be auto-created when needed"
    fi

    if tmux has-session -t ax-codex 2>/dev/null; then
        check_pass "tmux session 'ax-codex' active"
    else
        check_warn "tmux session 'ax-codex' not found - Will be auto-created when needed"
    fi
}

# =============================================================================
# 3. Wrapper Scripts Check
# =============================================================================
check_wrapper_scripts() {
    print_section "Wrapper Scripts Check"

    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

    # gemini-wrapper.sh
    if [[ -x "$SCRIPT_DIR/gemini-wrapper.sh" ]]; then
        check_pass "gemini-wrapper.sh executable"
    elif [[ -f "$SCRIPT_DIR/gemini-wrapper.sh" ]]; then
        check_warn "gemini-wrapper.sh exists but not executable"
        echo -e "      ${YELLOW}Fix: chmod +x $SCRIPT_DIR/gemini-wrapper.sh${NC}"
    else
        check_fail "gemini-wrapper.sh not found"
    fi

    # codex-wrapper.sh
    if [[ -x "$SCRIPT_DIR/codex-wrapper.sh" ]]; then
        check_pass "codex-wrapper.sh executable"
    elif [[ -f "$SCRIPT_DIR/codex-wrapper.sh" ]]; then
        check_warn "codex-wrapper.sh exists but not executable"
        echo -e "      ${YELLOW}Fix: chmod +x $SCRIPT_DIR/codex-wrapper.sh${NC}"
    else
        check_fail "codex-wrapper.sh not found"
    fi
}

# =============================================================================
# 4. Configuration Files Check
# =============================================================================
check_config_files() {
    print_section "Configuration Files Check"

    CONFIG_DIR="$(dirname "$(dirname "${BASH_SOURCE[0]}")")/config"

    required_configs=(
        "pipeline.yaml"
        "models.yaml"
        "ai_collaboration.yaml"
        "mcp_fallbacks.yaml"
        "output_validation.yaml"
    )

    for config in "${required_configs[@]}"; do
        if [[ -f "$CONFIG_DIR/$config" ]]; then
            check_pass "$config exists"
        else
            check_fail "$config not found"
        fi
    done
}

# =============================================================================
# 5. State Files Check
# =============================================================================
check_state_files() {
    print_section "State Files Check"

    STATE_DIR="$(dirname "$(dirname "${BASH_SOURCE[0]}")")/state"

    if [[ -f "$STATE_DIR/progress.json" ]]; then
        CURRENT_STAGE=$(grep -o '"current_stage"[^,]*' "$STATE_DIR/progress.json" 2>/dev/null | cut -d'"' -f4)
        check_pass "progress.json exists (current stage: ${CURRENT_STAGE:-unknown})"
    else
        check_warn "progress.json not found - Starting as new pipeline"
    fi

    # Checkpoints directory
    if [[ -d "$STATE_DIR/checkpoints" ]]; then
        CP_COUNT=$(ls -1 "$STATE_DIR/checkpoints" 2>/dev/null | wc -l | tr -d ' ')
        check_pass "Checkpoints directory exists ($CP_COUNT checkpoints)"
    else
        check_warn "Checkpoints directory not found"
    fi
}

# =============================================================================
# 6. Stage Files Check
# =============================================================================
check_stage_files() {
    print_section "Stage Files Check"

    STAGES_DIR="$(dirname "$(dirname "${BASH_SOURCE[0]}")")/stages"

    stages=(
        "01-brainstorm"
        "02-research"
        "03-planning"
        "04-ui-ux"
        "05-task-management"
        "06-implementation"
        "07-refactoring"
        "08-qa"
        "09-testing"
        "10-deployment"
    )

    for stage in "${stages[@]}"; do
        if [[ -f "$STAGES_DIR/$stage/CLAUDE.md" ]]; then
            check_pass "$stage/CLAUDE.md"
        else
            check_fail "$stage/CLAUDE.md not found"
        fi
    done
}

# =============================================================================
# 7. AI CLI Simple Test (Optional)
# =============================================================================
test_ai_cli() {
    print_section "AI CLI Connection Test (Optional)"

    echo -e "  ${YELLOW}This test will make actual API calls.${NC}"
    echo -e "  ${YELLOW}Press Enter to skip, or type 'y' to run:${NC}"
    read -r -t 10 response

    if [[ "$response" != "y" ]]; then
        check_warn "AI connection test skipped"
        return
    fi

    # Gemini test
    if command -v gemini &> /dev/null; then
        echo -e "  ${BLUE}Testing Gemini...${NC}"
        if timeout 30 gemini "Say 'Hello'" &>/dev/null; then
            check_pass "Gemini API connection successful"
        else
            check_fail "Gemini API connection failed"
        fi
    fi

    # Codex test
    if command -v codex &> /dev/null; then
        echo -e "  ${BLUE}Testing Codex...${NC}"
        if timeout 30 codex --help &>/dev/null; then
            check_pass "Codex CLI working"
        else
            check_fail "Codex CLI error"
        fi
    fi
}

# =============================================================================
# Summary
# =============================================================================
print_summary() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  📊 Check Results Summary${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "  ${GREEN}Passed: $PASS_COUNT${NC}"
    echo -e "  ${YELLOW}Warnings: $WARN_COUNT${NC}"
    echo -e "  ${RED}Failed: $FAIL_COUNT${NC}"
    echo ""

    if [[ $FAIL_COUNT -eq 0 ]]; then
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${GREEN}  ✅ All required checks passed! Pipeline ready to run${NC}"
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    else
        echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${RED}  ❌ $FAIL_COUNT items failed. Please resolve the issues above.${NC}"
        echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    fi

    # Failed items detail
    if [[ $FAIL_COUNT -gt 0 ]]; then
        echo ""
        echo -e "${RED}Failed Items Detail:${NC}"
        for result in "${RESULTS[@]}"; do
            if [[ $result == FAIL:* ]]; then
                echo -e "  ${RED}•${NC} ${result#FAIL: }"
            fi
        done
    fi

    echo ""
}

# =============================================================================
# Recommendations
# =============================================================================
print_recommendations() {
    if [[ $FAIL_COUNT -gt 0 || $WARN_COUNT -gt 0 ]]; then
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${BLUE}  💡 Recommended Actions${NC}"
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""

        # If Gemini not installed
        if ! command -v gemini &> /dev/null; then
            echo -e "  ${YELLOW}Install Gemini CLI:${NC}"
            echo "    pip install google-generativeai"
            echo "    # Or refer to official documentation"
            echo ""
        fi

        # If Codex not installed
        if ! command -v codex &> /dev/null; then
            echo -e "  ${YELLOW}Install Codex CLI:${NC}"
            echo "    npm install -g @openai/codex-cli"
            echo ""
        fi

        # If tmux not installed
        if ! command -v tmux &> /dev/null; then
            echo -e "  ${YELLOW}Install tmux:${NC}"
            echo "    brew install tmux  # macOS"
            echo "    apt install tmux   # Ubuntu"
            echo ""
        fi

        echo ""
    fi
}

# =============================================================================
# Main execution
# =============================================================================
main() {
    print_header

    check_ai_cli
    check_tmux
    check_wrapper_scripts
    check_config_files
    check_state_files
    check_stage_files

    # Optional test
    if [[ "$1" == "--test" ]]; then
        test_ai_cli
    fi

    print_summary
    print_recommendations

    # Exit code
    if [[ $FAIL_COUNT -gt 0 ]]; then
        exit 1
    else
        exit 0
    fi
}

# Run
main "$@"
