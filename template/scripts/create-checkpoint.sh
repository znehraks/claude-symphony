#!/bin/bash
# create-checkpoint.sh - Checkpoint creation
# claude-symphony workflow pipeline

set -e

DESCRIPTION="$1"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROGRESS_FILE="$PROJECT_ROOT/state/progress.json"
TIMESTAMP=$(date +%Y%m%d-%H%M)
TIMESTAMP_ISO=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check current stage
if command -v jq &> /dev/null; then
    CURRENT_STAGE=$(jq -r '.current_stage' "$PROGRESS_FILE")
else
    echo -e "${RED}Error:${NC} jq is required."
    exit 1
fi

if [ -z "$CURRENT_STAGE" ] || [ "$CURRENT_STAGE" == "null" ]; then
    echo -e "${RED}Error:${NC} No stage currently in progress."
    exit 1
fi

# Default description
if [ -z "$DESCRIPTION" ]; then
    DESCRIPTION="Checkpoint - $CURRENT_STAGE"
fi

# Generate checkpoint ID
STAGE_NUM=$(echo "$CURRENT_STAGE" | cut -d'-' -f1)
CP_ID="CP-$STAGE_NUM-$TIMESTAMP"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💾 Creating checkpoint: $CP_ID"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Stage: $CURRENT_STAGE"
echo "  Description: $DESCRIPTION"
echo ""

# Create checkpoint directory
CP_DIR="$PROJECT_ROOT/state/checkpoints/$CP_ID"
mkdir -p "$CP_DIR"

# 1. Copy state files
echo -e "${BLUE}[1/4] Copying state files${NC}"
cp "$PROGRESS_FILE" "$CP_DIR/progress.json"
echo -e "${GREEN}✓${NC} progress.json copied"

# 2. Copy stage outputs
echo -e "${BLUE}[2/4] Copying stage output files${NC}"
STAGE_DIR="$PROJECT_ROOT/stages/$CURRENT_STAGE"
if [ -d "$STAGE_DIR/outputs" ]; then
    cp -r "$STAGE_DIR/outputs" "$CP_DIR/outputs"
    FILE_COUNT=$(find "$CP_DIR/outputs" -type f | wc -l)
    echo -e "${GREEN}✓${NC} outputs copied ($FILE_COUNT files)"
else
    mkdir -p "$CP_DIR/outputs"
    echo -e "${YELLOW}⚠${NC} No outputs directory (empty directory created)"
fi

# 3. Copy HANDOFF.md (if exists)
echo -e "${BLUE}[3/4] Copying HANDOFF.md${NC}"
if [ -f "$STAGE_DIR/HANDOFF.md" ]; then
    cp "$STAGE_DIR/HANDOFF.md" "$CP_DIR/"
    echo -e "${GREEN}✓${NC} HANDOFF.md copied"
else
    echo -e "${YELLOW}⚠${NC} No HANDOFF.md"
fi

# 4. Generate metadata
echo -e "${BLUE}[4/4] Generating metadata${NC}"
cat > "$CP_DIR/metadata.json" << EOF
{
    "id": "$CP_ID",
    "stage": "$CURRENT_STAGE",
    "description": "$DESCRIPTION",
    "created_at": "$TIMESTAMP_ISO",
    "files": []
}
EOF

# Add file list
if command -v jq &> /dev/null; then
    FILES=$(find "$CP_DIR" -type f -not -name "metadata.json" | jq -R -s -c 'split("\n") | map(select(length > 0))')
    jq ".files = $FILES" "$CP_DIR/metadata.json" > "$CP_DIR/metadata.json.tmp" && mv "$CP_DIR/metadata.json.tmp" "$CP_DIR/metadata.json"
fi
echo -e "${GREEN}✓${NC} Metadata generated"

# 5. Add checkpoint to progress.json
echo ""
echo -e "${BLUE}Updating state${NC}"
jq ".checkpoints += [{\"id\": \"$CP_ID\", \"stage\": \"$CURRENT_STAGE\", \"description\": \"$DESCRIPTION\", \"created_at\": \"$TIMESTAMP_ISO\"}] | \
    .stages.\"$CURRENT_STAGE\".checkpoint_id = \"$CP_ID\"" \
    "$PROGRESS_FILE" > "${PROGRESS_FILE}.tmp" && mv "${PROGRESS_FILE}.tmp" "$PROGRESS_FILE"
echo -e "${GREEN}✓${NC} progress.json updated"

# Completion message
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✓${NC} Checkpoint creation complete!"
echo ""
echo "  ID: $CP_ID"
echo "  Location: state/checkpoints/$CP_ID/"
echo ""
echo -e "${BLUE}Restore command:${NC}"
echo "  scripts/restore-checkpoint.sh $CP_ID"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
