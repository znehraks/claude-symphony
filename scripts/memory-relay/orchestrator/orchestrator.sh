#!/bin/bash
# Memory Relay Orchestrator
# Listens for relay signals via FIFO and manages Claude session handoffs
# Part of claude-symphony package
#
# DEPRECATION NOTICE: This script is being replaced by TypeScript module
# See: src/relay/orchestrator.ts
# This shell script is kept for efficient FIFO blocking reads

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
SIGNALS_DIR="${ORCHESTRATOR_DIR}/signals"
FIFO_PATH="${SIGNALS_DIR}/relay.fifo"
LOG_DIR="${RELAY_BASE}/logs"
LOG_FILE="${LOG_DIR}/orchestrator.log"
PID_FILE="${ORCHESTRATOR_DIR}/orchestrator.pid"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging function
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    mkdir -p "${LOG_DIR}"
    echo "[${timestamp}] [${level}] ${message}" >> "${LOG_FILE}"

    case "${level}" in
        INFO)  echo -e "${GREEN}[INFO]${NC} ${message}" ;;
        WARN)  echo -e "${YELLOW}[WARN]${NC} ${message}" ;;
        ERROR) echo -e "${RED}[ERROR]${NC} ${message}" ;;
        DEBUG) echo -e "${BLUE}[DEBUG]${NC} ${message}" ;;
    esac
}

# Cleanup function
cleanup() {
    log "INFO" "Orchestrator shutting down..."
    rm -f "${PID_FILE}"
}

trap cleanup EXIT

# Ensure directories exist
mkdir -p "${SIGNALS_DIR}"
mkdir -p "${LOG_DIR}"

# Create FIFO if it doesn't exist
create_fifo() {
    if [[ ! -p "${FIFO_PATH}" ]]; then
        log "INFO" "Creating FIFO at ${FIFO_PATH}"
        rm -f "${FIFO_PATH}"
        mkfifo "${FIFO_PATH}"
        chmod 600 "${FIFO_PATH}"
    fi
}

# Check if orchestrator is already running
check_running() {
    if [[ -f "${PID_FILE}" ]]; then
        local pid=$(cat "${PID_FILE}")
        if kill -0 "${pid}" 2>/dev/null; then
            log "WARN" "Orchestrator already running (PID: ${pid})"
            return 0
        else
            log "INFO" "Removing stale PID file"
            rm -f "${PID_FILE}"
        fi
    fi
    return 1
}

# Send ACK back to Claude session
send_ack() {
    local source_pane="$1"
    local new_pane="$2"
    local ack_message="RELAY_ACK:${new_pane}"

    log "INFO" "Sending ACK to pane ${source_pane}: ${ack_message}"

    if tmux send-keys -t "${source_pane}" "# ${ack_message}" Enter 2>/dev/null; then
        log "INFO" "ACK sent successfully"
        return 0
    else
        log "WARN" "Failed to send ACK to pane ${source_pane}"
        return 1
    fi
}

# Handle relay signal
handle_relay_signal() {
    local signal="$1"
    log "INFO" "Received signal: ${signal}"

    # Parse signal: RELAY_READY:handoff_path:source_pane
    if [[ "${signal}" =~ ^RELAY_READY:(.+):(.+)$ ]]; then
        local handoff_path="${BASH_REMATCH[1]}"
        local source_pane="${BASH_REMATCH[2]}"

        log "INFO" "Processing relay request"
        log "INFO" "  Handoff path: ${handoff_path}"
        log "INFO" "  Source pane: ${source_pane}"

        if [[ ! -f "${handoff_path}" ]]; then
            log "ERROR" "Handoff file not found: ${handoff_path}"
            return 1
        fi

        local work_dir=$(dirname "${handoff_path}")

        log "INFO" "Creating new tmux pane for Claude session"

        local new_pane
        new_pane=$(tmux split-window -h -P -F "#{pane_id}" \
            -c "${work_dir}" \
            "${ORCHESTRATOR_DIR}/claude-wrapper.sh '${handoff_path}'" 2>&1)

        if [[ $? -eq 0 ]] && [[ -n "${new_pane}" ]]; then
            log "INFO" "New pane created: ${new_pane}"
            sleep 2

            if tmux list-panes -F "#{pane_id}" | grep -q "${new_pane}"; then
                log "INFO" "New Claude session started successfully"
                send_ack "${source_pane}" "${new_pane}"
                archive_handoff "${handoff_path}"
                return 0
            else
                log "ERROR" "New pane ${new_pane} not found after creation"
                return 1
            fi
        else
            log "ERROR" "Failed to create new pane: ${new_pane}"
            return 1
        fi
    else
        log "WARN" "Invalid signal format: ${signal}"
        return 1
    fi
}

# Archive handoff file
archive_handoff() {
    local handoff_path="$1"
    local archive_dir="${RELAY_BASE}/handoffs"
    local timestamp=$(date '+%Y%m%d_%H%M%S')
    local archive_name="handoff_${timestamp}.md"

    mkdir -p "${archive_dir}"
    cp "${handoff_path}" "${archive_dir}/${archive_name}"
    log "INFO" "Handoff archived to ${archive_dir}/${archive_name}"
}

# Main loop
main_loop() {
    log "INFO" "Orchestrator main loop started"
    log "INFO" "Listening on FIFO: ${FIFO_PATH}"

    while true; do
        if read -r signal < "${FIFO_PATH}"; then
            if [[ -n "${signal}" ]]; then
                handle_relay_signal "${signal}" || true
            fi
        else
            log "DEBUG" "FIFO read returned empty, reopening..."
            sleep 0.5
        fi
    done
}

# Status command
show_status() {
    echo -e "${BLUE}Memory Relay Orchestrator Status${NC}"
    echo "=================================="
    echo "Base: ${RELAY_BASE}"
    echo ""

    if [[ -f "${PID_FILE}" ]]; then
        local pid=$(cat "${PID_FILE}")
        if kill -0 "${pid}" 2>/dev/null; then
            echo -e "Status: ${GREEN}Running${NC} (PID: ${pid})"
        else
            echo -e "Status: ${RED}Stopped${NC} (stale PID file)"
        fi
    else
        echo -e "Status: ${YELLOW}Not running${NC}"
    fi

    echo ""
    echo "FIFO Path: ${FIFO_PATH}"
    [[ -p "${FIFO_PATH}" ]] && echo -e "FIFO: ${GREEN}Exists${NC}" || echo -e "FIFO: ${RED}Missing${NC}"

    echo ""
    echo "Recent logs:"
    tail -5 "${LOG_FILE}" 2>/dev/null || echo "(no logs)"
}

# Stop command
stop_orchestrator() {
    if [[ -f "${PID_FILE}" ]]; then
        local pid=$(cat "${PID_FILE}")
        if kill -0 "${pid}" 2>/dev/null; then
            log "INFO" "Stopping orchestrator (PID: ${pid})"
            kill "${pid}"
            rm -f "${PID_FILE}"
            echo "Orchestrator stopped"
        else
            echo "Orchestrator not running (stale PID)"
            rm -f "${PID_FILE}"
        fi
    else
        echo "Orchestrator not running"
    fi
}

# Parse arguments
case "${1:-start}" in
    start)
        if check_running; then
            echo "Orchestrator is already running"
            exit 1
        fi

        create_fifo
        echo $$ > "${PID_FILE}"
        log "INFO" "Orchestrator starting (PID: $$)"
        main_loop
        ;;
    stop)
        stop_orchestrator
        ;;
    status)
        show_status
        ;;
    restart)
        stop_orchestrator
        sleep 1
        exec "$0" start
        ;;
    *)
        echo "Usage: $0 {start|stop|status|restart}"
        exit 1
        ;;
esac
