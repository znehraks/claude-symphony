# Stage 10: CI/CD & Deployment

Deployment pipeline setup and deployment

## Overview

This is the final stage, setting up CI/CD pipelines, configuring deployment environments, and establishing monitoring.

## Execution Model

| Role | Model | Purpose |
|------|-------|---------|
| Primary | ClaudeCode | CI/CD configuration |

**Mode**: Headless (CI/CD environment automation)

## Getting Started

### 1. Verify Prerequisites

```bash
# Check previous stage HANDOFF
cat ../09-testing/HANDOFF.md

# Verify all tests pass
npm run test
```

### 2. Run Stage

```bash
# Method 1: Slash command
/run-stage 10-deployment

# Method 2: Direct script execution
../../scripts/run-stage.sh 10-deployment
```

### 3. Manual Workflow

```bash
# Step 1: CI pipeline setup
# Create .github/workflows/ci.yml

# Step 2: CD pipeline setup
# Configure staging/production deployment

# Step 3: Environment configuration
# Secrets, environment variables

# Step 4: Monitoring setup
# Error tracking, performance monitoring

# Step 5: Generate final HANDOFF.md
/handoff
```

## Directory Structure

```
10-deployment/
├── README.md           # This file
├── CLAUDE.md           # AI instructions
├── config.yaml         # Stage configuration
├── prompts/
│   ├── ci_setup.md     # CI setup prompt
│   ├── cd_setup.md     # CD setup prompt
│   └── monitoring.md   # Monitoring prompt
├── templates/
├── inputs/             # Input files
├── outputs/
│   ├── .github/workflows/
│   ├── deployment_config/
│   └── deployment_log.md
├── HANDOFF.md.template # Handoff template
└── HANDOFF.md          # Final handoff
```

## Git Commit Rules

> **CRITICAL**: Git commit required after each configuration task

```bash
# Per-task commit
git add <relevant-files>
git commit -m "ci(deploy): <task description>"
git status  # Verify clean state
```

## Deployment Platform Options

| Platform | Best For |
|----------|----------|
| Vercel | Next.js applications |
| Railway | Full-stack applications |
| AWS | Enterprise deployments |
| Cloudflare | Edge deployments |

## Completion Criteria

- [ ] CI pipeline configured
- [ ] CD pipeline configured
- [ ] Staging deployment successful
- [ ] Production deployment successful
- [ ] Monitoring configured
- [ ] Deployment documentation written
- [ ] HANDOFF.md generated (final)

## Outputs

| File | Description |
|------|-------------|
| `outputs/.github/workflows/` | GitHub Actions workflows |
| `outputs/deployment_config/` | Deployment configuration |
| `outputs/deployment_log.md` | Deployment log |
| `HANDOFF.md` | Final project handoff |

## Pipeline Complete

This is the final stage. After completion:

1. **Project retrospective**: Document lessons learned
2. **Maintenance plan**: Establish ongoing maintenance procedures
3. **Handover**: Transfer knowledge to stakeholders

## Tips

1. **Safety first**: Always have rollback strategy
2. **Environment separation**: Keep staging and production separate
3. **Secrets management**: Never commit secrets to repository
4. **Monitoring**: Set up alerts for critical issues
