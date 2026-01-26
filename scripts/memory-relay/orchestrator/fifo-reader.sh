#!/bin/bash
# Minimal FIFO reader - only blocking read, outputs to stdout
# Part of claude-symphony package
#
# This is a minimal bash script kept for efficient FIFO blocking reads
# The main orchestrator logic is now in TypeScript (src/relay/orchestrator.ts)
#
# Usage: ./fifo-reader.sh <fifo_path>

set -euo pipefail

FIFO_PATH="${1:-}"

if [[ -z "${FIFO_PATH}" ]]; then
    echo "Usage: $0 <fifo_path>" >&2
    exit 1
fi

if [[ ! -p "${FIFO_PATH}" ]]; then
    echo "Error: FIFO not found at ${FIFO_PATH}" >&2
    exit 1
fi

# Simple blocking read loop
# Outputs each line to stdout for the TypeScript orchestrator to process
while true; do
    if read -r line < "${FIFO_PATH}"; then
        if [[ -n "${line}" ]]; then
            echo "${line}"
        fi
    else
        # FIFO closed, small delay before retry
        sleep 0.1
    fi
done
