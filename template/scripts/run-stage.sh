#!/bin/bash
# run-stage.sh - Stage execution
# claude-symphony workflow pipeline

set -e

STAGE_ID="$1"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Usage
if [ -z "$STAGE_ID" ]; then
    echo "Usage: $0 <stage-id>"
    echo ""
    echo "Available stages:"
    echo "  01-brainstorm    Brainstorming"
    echo "  02-research      Research"
    echo "  03-planning      Planning"
    echo "  04-ui-ux         UI/UX Design"
    echo "  05-task-management Task Management"
    echo "  06-implementation Implementation"
    echo "  07-refactoring   Refactoring"
    echo "  08-qa            QA"
    echo "  09-testing       Testing"
    echo "  10-deployment    Deployment"
    exit 1
fi

# Check stage directory
STAGE_DIR="$PROJECT_ROOT/stages/$STAGE_ID"

if [ ! -d "$STAGE_DIR" ]; then
    echo -e "${RED}Error:${NC} Stage not found: $STAGE_ID"
    exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Stage Execution: $STAGE_ID"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. Execute pre-stage hook
echo ""
echo -e "${BLUE}[1/3] Executing Pre-Stage Hook${NC}"
if [ -f "$PROJECT_ROOT/.claude/hooks/pre-stage.sh" ]; then
    bash "$PROJECT_ROOT/.claude/hooks/pre-stage.sh" "$STAGE_ID"
else
    echo -e "${YELLOW}⚠${NC} No pre-stage hook found."
fi

# 2. Update status
echo ""
echo -e "${BLUE}[2/3] Updating Status${NC}"
PROGRESS_FILE="$PROJECT_ROOT/state/progress.json"

if command -v jq &> /dev/null; then
    jq ".current_stage = \"$STAGE_ID\" | \
        .stages.\"$STAGE_ID\".status = \"in_progress\" | \
        .stages.\"$STAGE_ID\".started_at = \"$TIMESTAMP\" | \
        .pipeline.updated_at = \"$TIMESTAMP\"" \
        "$PROGRESS_FILE" > "${PROGRESS_FILE}.tmp" && mv "${PROGRESS_FILE}.tmp" "$PROGRESS_FILE"
    echo -e "${GREEN}✓${NC} progress.json updated"
else
    echo -e "${YELLOW}⚠${NC} jq not installed - Manual update required"
fi

# 3. Model enforcement check (Issue #12, #14 resolution)
echo ""
echo -e "${BLUE}[3/5] AI Model Enforcement Check${NC}"
STAGE_CONFIG="$STAGE_DIR/config.yaml"
MODEL_ENFORCEMENT="$PROJECT_ROOT/config/model_enforcement.yaml"

if command -v yq &> /dev/null && [ -f "$STAGE_CONFIG" ]; then
    AUTO_INVOKE_ENABLED=$(yq '.auto_invoke.enabled // false' "$STAGE_CONFIG" 2>/dev/null)
    AUTO_INVOKE_MODEL=$(yq '.auto_invoke.model // ""' "$STAGE_CONFIG" 2>/dev/null)
    AUTO_INVOKE_MSG=$(yq '.auto_invoke.message // ""' "$STAGE_CONFIG" 2>/dev/null)
    AUTO_INVOKE_REQUIRED=$(yq '.auto_invoke.required // false' "$STAGE_CONFIG" 2>/dev/null)

    if [ "$AUTO_INVOKE_ENABLED" = "true" ]; then
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo -e "${YELLOW}🤖 AI Model Auto-Invoke Settings${NC}"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "  Model: $AUTO_INVOKE_MODEL"
        echo "  Required: $AUTO_INVOKE_REQUIRED"
        if [ -n "$AUTO_INVOKE_MSG" ] && [ "$AUTO_INVOKE_MSG" != "null" ]; then
            echo ""
            echo -e "  ${GREEN}$AUTO_INVOKE_MSG${NC}"
        fi

        if [ "$AUTO_INVOKE_REQUIRED" = "true" ]; then
            echo ""
            echo -e "  ${YELLOW}⚠️  This stage requires using ${AUTO_INVOKE_MODEL}.${NC}"
            echo -e "  ${BLUE}→ Use /${AUTO_INVOKE_MODEL} command to invoke.${NC}"
        fi
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    fi
else
    echo -e "${YELLOW}⚠${NC} yq not installed or config.yaml not found - Skipping model enforcement check"
fi

# 4. Display CLAUDE.md
echo ""
echo -e "${BLUE}[4/5] Loading Stage Instructions${NC}"
CLAUDE_MD="$STAGE_DIR/CLAUDE.md"

if [ -f "$CLAUDE_MD" ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${GREEN}Stage CLAUDE.md:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    cat "$CLAUDE_MD"
    echo ""
else
    echo -e "${YELLOW}⚠${NC} CLAUDE.md not found."
fi

# 5. Next steps guidance
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✓${NC} Stage $STAGE_ID started"
echo ""
echo -e "${BLUE}After completing work:${NC}"
echo "  /handoff - Generate handoff document"
echo "  /checkpoint [description] - Create checkpoint (stages 06, 07)"

# Add AI model invoke guidance
if [ -n "$AUTO_INVOKE_MODEL" ] && [ "$AUTO_INVOKE_MODEL" != "null" ]; then
    echo ""
    echo -e "${YELLOW}AI Model Usage:${NC}"
    echo "  /${AUTO_INVOKE_MODEL} \"prompt\" - Invoke ${AUTO_INVOKE_MODEL}"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
