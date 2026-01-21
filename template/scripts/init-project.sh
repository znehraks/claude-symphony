#!/bin/bash
# init-project.sh - New project initialization
# claude-symphony workflow pipeline

set -e

PROJECT_NAME="$1"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Usage
if [ -z "$PROJECT_NAME" ]; then
    echo "Usage: $0 <project-name>"
    echo "Example: $0 my-saas-app"
    exit 1
fi

# Validate project name
if ! [[ "$PROJECT_NAME" =~ ^[a-z0-9-]+$ ]]; then
    echo -e "${RED}Error:${NC} Project name can only contain lowercase letters, numbers, and hyphens."
    exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Project initialization: $PROJECT_NAME"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. Create project directory
PROJECT_DIR="$PROJECT_ROOT/projects/$PROJECT_NAME"

if [ -d "$PROJECT_DIR" ]; then
    echo -e "${RED}Error:${NC} Project '$PROJECT_NAME' already exists."
    exit 1
fi

mkdir -p "$PROJECT_DIR"
echo -e "${GREEN}✓${NC} Project directory created: $PROJECT_DIR"

# 2. Initialize state file
PROGRESS_FILE="$PROJECT_ROOT/state/progress.json"

if command -v jq &> /dev/null; then
    jq ".pipeline.project_name = \"$PROJECT_NAME\" | \
        .pipeline.started_at = \"$TIMESTAMP\" | \
        .pipeline.updated_at = \"$TIMESTAMP\" | \
        .current_stage = \"01-brainstorm\"" \
        "$PROGRESS_FILE" > "${PROGRESS_FILE}.tmp" && mv "${PROGRESS_FILE}.tmp" "$PROGRESS_FILE"
    echo -e "${GREEN}✓${NC} State file updated"
else
    echo -e "${YELLOW}⚠${NC} jq not installed - manual state file update required"
fi

# 3. Create input file template
BRAINSTORM_DIR="$PROJECT_ROOT/stages/01-brainstorm"
mkdir -p "$BRAINSTORM_DIR/inputs"

cat > "$BRAINSTORM_DIR/inputs/project_brief.md" << 'EOF'
# Project Brief

## Project Name
{{PROJECT_NAME}}

## One-Line Description
[Describe the project in one line]

## Problem Definition
[What problem are you solving?]

## Target Users
[Who are the main users?]

## Core Features (Draft)
1. [Feature 1]
2. [Feature 2]
3. [Feature 3]

## Success Criteria
[What are the criteria for project success?]

## Constraints
- Timeline:
- Budget:
- Technology:

## References
- [URL or document]
EOF

sed -i '' "s/{{PROJECT_NAME}}/$PROJECT_NAME/g" "$BRAINSTORM_DIR/inputs/project_brief.md" 2>/dev/null || \
sed -i "s/{{PROJECT_NAME}}/$PROJECT_NAME/g" "$BRAINSTORM_DIR/inputs/project_brief.md"

echo -e "${GREEN}✓${NC} Project brief template created: stages/01-brainstorm/inputs/project_brief.md"

# 4. Completion message
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✓${NC} Project '$PROJECT_NAME' initialization complete!"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Fill out stages/01-brainstorm/inputs/project_brief.md"
echo "2. Run /run-stage 01-brainstorm"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
