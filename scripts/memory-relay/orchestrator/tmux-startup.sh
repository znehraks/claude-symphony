#!/bin/bash
# tmux Startup Script for Memory Relay
# Creates a tmux session with Claude and the relay orchestrator
# Part of claude-symphony package
#
# DEPRECATION NOTICE: This script is being replaced by TypeScript module
# See: src/relay/startup.ts
# This shell script is kept for backward compatibility and FIFO operations

set -euo pipefail

# Determine base directory (supports both package and global installation)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Configuration - prefer project-local, fallback to global
if [[ -f "${SCRIPT_DIR}/../config.json" ]]; then
    RELAY_BASE="$(dirname "${SCRIPT_DIR}")"
else
    RELAY_BASE="${HOME}/.claude/memory-relay"
fi

ORCHESTRATOR_DIR="${RELAY_BASE}/orchestrator"
ORCHESTRATOR_SCRIPT="${ORCHESTRATOR_DIR}/orchestrator.sh"
WRAPPER_SCRIPT="${ORCHESTRATOR_DIR}/claude-wrapper.sh"

# Session name prefix - symphony branding
SESSION_PREFIX="symphony-session"

# Function to find next available session name
# Returns: symphony-session, symphony-session-2, symphony-session-3, ...
find_next_session_name() {
    local base="${SESSION_PREFIX}"

    # Check if base session exists
    if ! tmux has-session -t "${base}" 2>/dev/null; then
        echo "${base}"
        return
    fi

    # Find next available numbered session
    local n=2
    while tmux has-session -t "${base}-${n}" 2>/dev/null; do
        ((n++))
    done
    echo "${base}-${n}"
}

# Default session name (will be updated if creating new parallel session)
SESSION_NAME="${SESSION_PREFIX}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Get working directory (default to current)
WORK_DIR="${1:-$(pwd)}"

# Parse bypass mode argument
BYPASS_MODE=""
if [[ "${2:-}" == "--bypass" ]]; then
    BYPASS_MODE="--bypass"
fi

echo -e "${CYAN}Claude Symphony - Memory Relay Session${NC}"
echo "======================================="
echo ""

# Check if tmux is available
if ! command -v tmux &> /dev/null; then
    echo -e "${RED}Error: tmux is not installed${NC}"
    echo "Install with: brew install tmux (macOS) or apt install tmux (Linux)"
    exit 1
fi

# Check if claude is available
if ! command -v claude &> /dev/null; then
    echo -e "${RED}Error: claude CLI is not installed${NC}"
    echo "Please install Claude Code CLI first"
    exit 1
fi

# Check if scripts exist and are executable
for script in "${ORCHESTRATOR_SCRIPT}" "${WRAPPER_SCRIPT}"; do
    if [[ ! -f "${script}" ]]; then
        echo -e "${RED}Error: Script not found: ${script}${NC}"
        echo ""
        echo "Have you run the install script?"
        echo "  ./scripts/memory-relay/install.sh"
        exit 1
    fi
    chmod +x "${script}"
done

# Check if session already exists
if tmux has-session -t "${SESSION_PREFIX}" 2>/dev/null; then
    NEXT_SESSION_NAME=$(find_next_session_name)
    echo -e "${YELLOW}Session '${SESSION_PREFIX}' already exists.${NC}"
    echo ""
    echo "Options:"
    echo "  1. Attach to existing session"
    echo "  2. Create new session (${NEXT_SESSION_NAME})"
    echo "  3. Kill and recreate"
    echo "  4. Cancel"
    echo ""
    read -p "Choice [1/2/3/4]: " choice

    case "${choice}" in
        1)
            echo "Attaching to existing session..."
            exec tmux attach-session -t "${SESSION_PREFIX}"
            ;;
        2)
            echo -e "Creating parallel session: ${GREEN}${NEXT_SESSION_NAME}${NC}"
            SESSION_NAME="${NEXT_SESSION_NAME}"
            ;;
        3)
            echo "Killing existing session..."
            tmux kill-session -t "${SESSION_PREFIX}"
            SESSION_NAME="${SESSION_PREFIX}"
            ;;
        *)
            echo "Cancelled."
            exit 0
            ;;
    esac
fi

echo ""
echo -e "Creating new session: ${GREEN}${SESSION_NAME}${NC}"
echo -e "Working directory: ${BLUE}${WORK_DIR}${NC}"
echo -e "Relay base: ${BLUE}${RELAY_BASE}${NC}"
echo ""

# Create new tmux session with orchestrator in the first pane (background)
tmux new-session -d -s "${SESSION_NAME}" -c "${WORK_DIR}" -x 200 -y 50

# Rename the window
tmux rename-window -t "${SESSION_NAME}:0" "symphony"

# Split 50/50 - orchestrator on left, Claude on right
# -b flag creates new pane to the LEFT of current pane
# -p 50 for 50% split
tmux split-window -h -b -t "${SESSION_NAME}:0" -p 50 -c "${WORK_DIR}"

# After -b split:
# Pane 0: New pane (left) - Orchestrator
# Pane 1: Original pane (right) - Claude

# Start orchestrator in pane 0 (left side)
tmux send-keys -t "${SESSION_NAME}:0.0" "${ORCHESTRATOR_SCRIPT} start" Enter

# Wait for orchestrator to initialize
sleep 1

# Start Claude wrapper in pane 1 (right side), pass bypass flag if set
tmux send-keys -t "${SESSION_NAME}:0.1" "${WRAPPER_SCRIPT} ${BYPASS_MODE}" Enter

# Select the Claude pane as active (right side)
tmux select-pane -t "${SESSION_NAME}:0.1"

# Set up pane titles for clarity
tmux select-pane -t "${SESSION_NAME}:0.0" -T "Context Manager"
tmux select-pane -t "${SESSION_NAME}:0.1" -T "Claude"

# Enable pane titles display
tmux set-option -t "${SESSION_NAME}" pane-border-status top
tmux set-option -t "${SESSION_NAME}" pane-border-format " #{pane_title} "

echo -e "${GREEN}Session created successfully!${NC}"
echo ""
echo "Layout:"
echo "+------------------+------------------------+"
echo "|                  |                        |"
echo "| Context Manager  |      Claude (50%)      |"
echo "|      (50%)       |                        |"
echo "|                  |                        |"
echo "+------------------+------------------------+"
echo ""
echo -e "Attaching to session ${GREEN}${SESSION_NAME}${NC}..."

# Attach to the session
exec tmux attach-session -t "${SESSION_NAME}"
