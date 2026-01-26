#!/bin/bash
# Stitch Quota Monitor
# Tracks Google Stitch MCP usage for claude-symphony

set -e

# Configuration
USAGE_FILE="state/stitch_usage.json"
QUOTA_STANDARD=350
QUOTA_EXPERIMENTAL=50
WARNING_THRESHOLD=80

# Ensure state directory exists
mkdir -p "$(dirname "$USAGE_FILE")"

# Initialize usage file if it doesn't exist
initialize_usage() {
    local current_month
    current_month=$(date +%Y-%m)
    echo "{\"standard\":0,\"experimental\":0,\"month\":\"$current_month\",\"history\":[]}" > "$USAGE_FILE"
}

# Check and reset monthly if needed
check_monthly_reset() {
    if [ ! -f "$USAGE_FILE" ]; then
        initialize_usage
        return
    fi

    local current_month stored_month
    current_month=$(date +%Y-%m)
    stored_month=$(jq -r '.month // ""' "$USAGE_FILE" 2>/dev/null || echo "")

    if [ "$current_month" != "$stored_month" ]; then
        # Archive previous month's usage
        local prev_standard prev_experimental
        prev_standard=$(jq -r '.standard // 0' "$USAGE_FILE")
        prev_experimental=$(jq -r '.experimental // 0' "$USAGE_FILE")

        # Reset with history
        jq --arg month "$current_month" \
           --arg prev_month "$stored_month" \
           --argjson prev_std "$prev_standard" \
           --argjson prev_exp "$prev_experimental" \
           '.history += [{"month": $prev_month, "standard": $prev_std, "experimental": $prev_exp}] |
            .standard = 0 | .experimental = 0 | .month = $month' \
           "$USAGE_FILE" > "${USAGE_FILE}.tmp" && mv "${USAGE_FILE}.tmp" "$USAGE_FILE"

        echo "Monthly quota reset. Previous usage archived."
    fi
}

# Display usage status
display_status() {
    check_monthly_reset

    local standard experimental std_percent exp_percent
    standard=$(jq -r '.standard // 0' "$USAGE_FILE")
    experimental=$(jq -r '.experimental // 0' "$USAGE_FILE")
    std_percent=$((standard * 100 / QUOTA_STANDARD))
    exp_percent=$((experimental * 100 / QUOTA_EXPERIMENTAL))

    echo "=== Stitch MCP Quota Status ==="
    echo ""
    echo "Standard:     $standard / $QUOTA_STANDARD ($std_percent%)"
    printf "              ["
    for i in $(seq 1 20); do
        if [ $i -le $((std_percent / 5)) ]; then
            printf "#"
        else
            printf "-"
        fi
    done
    printf "]\n"

    echo ""
    echo "Experimental: $experimental / $QUOTA_EXPERIMENTAL ($exp_percent%)"
    printf "              ["
    for i in $(seq 1 20); do
        if [ $i -le $((exp_percent / 5)) ]; then
            printf "#"
        else
            printf "-"
        fi
    done
    printf "]\n"

    echo ""

    # Warnings
    if [ "$std_percent" -ge "$WARNING_THRESHOLD" ]; then
        echo "WARNING: Standard quota at ${std_percent}%. Consider using fallback."
    fi
    if [ "$exp_percent" -ge "$WARNING_THRESHOLD" ]; then
        echo "WARNING: Experimental quota at ${exp_percent}%. Consider using fallback."
    fi

    echo ""
    echo "Reset date: 1st of next month"
}

# Increment usage
increment_usage() {
    local mode="${1:-standard}"
    check_monthly_reset

    if [ "$mode" != "standard" ] && [ "$mode" != "experimental" ]; then
        echo "ERROR: Invalid mode. Use 'standard' or 'experimental'."
        exit 1
    fi

    jq ".$mode += 1" "$USAGE_FILE" > "${USAGE_FILE}.tmp" && mv "${USAGE_FILE}.tmp" "$USAGE_FILE"

    local new_value limit percent
    new_value=$(jq -r ".$mode" "$USAGE_FILE")

    if [ "$mode" = "standard" ]; then
        limit=$QUOTA_STANDARD
    else
        limit=$QUOTA_EXPERIMENTAL
    fi

    percent=$((new_value * 100 / limit))
    echo "Stitch $mode usage: $new_value / $limit ($percent%)"

    if [ "$percent" -ge "$WARNING_THRESHOLD" ]; then
        echo "WARNING: Approaching quota limit!"
    fi

    if [ "$new_value" -ge "$limit" ]; then
        echo "ERROR: Quota exceeded! Fallback to Figma MCP recommended."
        return 1
    fi
}

# Output JSON
output_json() {
    check_monthly_reset
    cat "$USAGE_FILE"
}

# Check remaining quota
check_remaining() {
    check_monthly_reset

    local standard experimental
    standard=$(jq -r '.standard // 0' "$USAGE_FILE")
    experimental=$(jq -r '.experimental // 0' "$USAGE_FILE")

    local std_remaining exp_remaining
    std_remaining=$((QUOTA_STANDARD - standard))
    exp_remaining=$((QUOTA_EXPERIMENTAL - experimental))

    echo "Remaining quota:"
    echo "  Standard:     $std_remaining requests"
    echo "  Experimental: $exp_remaining requests"
}

# Show usage history
show_history() {
    check_monthly_reset

    echo "=== Usage History ==="
    jq -r '.history[] | "  \(.month): Standard=\(.standard), Experimental=\(.experimental)"' "$USAGE_FILE" 2>/dev/null || echo "  No history available"
}

# Main
case "${1:-status}" in
    status|"")
        display_status
        ;;
    increment)
        increment_usage "${2:-standard}"
        ;;
    json)
        output_json
        ;;
    remaining)
        check_remaining
        ;;
    history)
        show_history
        ;;
    reset)
        initialize_usage
        echo "Usage reset to 0."
        ;;
    help|--help|-h)
        echo "Stitch Quota Monitor"
        echo ""
        echo "Usage: $0 [command] [options]"
        echo ""
        echo "Commands:"
        echo "  status              Show quota status (default)"
        echo "  increment [mode]    Increment usage (standard|experimental)"
        echo "  remaining           Show remaining quota"
        echo "  json                Output raw JSON"
        echo "  history             Show usage history"
        echo "  reset               Reset current month usage"
        echo "  help                Show this help"
        echo ""
        echo "Examples:"
        echo "  $0                        # Show status"
        echo "  $0 increment standard     # Increment standard usage"
        echo "  $0 increment experimental # Increment experimental usage"
        echo "  $0 remaining              # Check remaining quota"
        ;;
    *)
        echo "Unknown command: $1"
        echo "Run '$0 help' for usage."
        exit 1
        ;;
esac
