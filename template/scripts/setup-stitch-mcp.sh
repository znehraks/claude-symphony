#!/bin/bash
# Stitch MCP Setup Script
# Sets up Google Stitch MCP for claude-symphony UI/UX stage

set -e

echo "=== Google Stitch MCP Setup ==="
echo ""

# Prerequisites check
echo "[1/4] Checking prerequisites..."

if ! command -v gcloud &>/dev/null; then
    echo "ERROR: gcloud CLI is required but not installed."
    echo "Install: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

if ! command -v npx &>/dev/null; then
    echo "ERROR: npx is required but not installed."
    echo "Install Node.js: https://nodejs.org/"
    exit 1
fi

if ! command -v claude &>/dev/null; then
    echo "ERROR: Claude CLI is required but not installed."
    echo "Install: npm install -g @anthropic-ai/claude-code"
    exit 1
fi

echo "  - gcloud CLI: OK"
echo "  - npx: OK"
echo "  - claude CLI: OK"
echo ""

# GCloud authentication
echo "[2/4] Checking Google Cloud authentication..."

if ! gcloud auth print-access-token &>/dev/null 2>&1; then
    echo "  Google Cloud not authenticated. Starting login..."
    gcloud auth login
else
    echo "  Already authenticated."
fi

# Check for application-default credentials
if ! gcloud auth application-default print-access-token &>/dev/null 2>&1; then
    echo "  Setting up application-default credentials..."
    gcloud auth application-default login
fi
echo ""

# Set quota project
echo "[3/4] Setting quota project..."

# Try to get current project
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null || echo "")

if [ -z "$CURRENT_PROJECT" ]; then
    read -p "Enter GCP project ID for Stitch API quota: " PROJECT_ID
else
    read -p "Enter GCP project ID for Stitch API quota [$CURRENT_PROJECT]: " PROJECT_ID
    PROJECT_ID=${PROJECT_ID:-$CURRENT_PROJECT}
fi

if [ -z "$PROJECT_ID" ]; then
    echo "ERROR: Project ID is required."
    exit 1
fi

echo "  Setting quota project to: $PROJECT_ID"
gcloud auth application-default set-quota-project "$PROJECT_ID"

# Enable Stitch API
echo ""
echo "  Enabling Stitch API..."
if gcloud services list --enabled --project="$PROJECT_ID" 2>/dev/null | grep -q "stitch.googleapis.com"; then
    echo "  Stitch API already enabled."
else
    gcloud beta services mcp enable stitch.googleapis.com --project="$PROJECT_ID" 2>/dev/null || \
    gcloud services enable stitch.googleapis.com --project="$PROJECT_ID" 2>/dev/null || \
    echo "  Note: Could not auto-enable API. Enable manually at: https://console.cloud.google.com/apis/library/stitch.googleapis.com"
fi
echo ""

# Add MCP to Claude
echo "[4/4] Adding Stitch MCP to Claude..."

# Check if already added
if claude mcp list 2>/dev/null | grep -q "stitch"; then
    echo "  Stitch MCP already configured."
else
    echo "  Adding Stitch MCP..."
    claude mcp add --transport stdio stitch -- npx -y stitch-mcp
fi
echo ""

# Verify installation
echo "=== Setup Complete ==="
echo ""
echo "Verification:"
if claude mcp list 2>/dev/null | grep -q "stitch"; then
    echo "  Stitch MCP: CONFIGURED"
else
    echo "  Stitch MCP: NOT FOUND (manual configuration may be needed)"
fi
echo ""
echo "Quota limits (monthly):"
echo "  - Standard requests: 350"
echo "  - Experimental requests: 50"
echo ""
echo "Usage in Stage 04 (UI/UX):"
echo "  /stitch              # Show status"
echo "  /stitch dna          # Extract Design DNA from moodboard"
echo "  /stitch generate     # Generate UI from description"
echo "  /stitch quota        # Check usage"
echo ""
echo "For more info: template/.claude/commands/stitch.md"
