# Stage 05: Deployment

## Objective
Configure CI/CD pipeline and prepare the application for production deployment.

**SuperClaude Command**: `/sc:build`

## Inputs
- `stages/04-qa/HANDOFF.md` — context from QA
- `stages/04-qa/outputs/qa_report.md` — QA results
- `stages/01-planning/outputs/tech_stack.md` — infrastructure decisions
- Source code in project root
- `references/05-deployment/` — CI/CD templates, infrastructure configs

## Tasks

### 1. CI/CD Pipeline Configuration

Create GitHub Actions workflow(s):

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - run: npm test
      - run: npm run test:e2e
```

### 2. Deployment Script

Create `deploy.sh` for production deployment:

```bash
#!/bin/bash
set -e

echo "Starting deployment..."

# Build
npm run build

# Run tests
npm test

# Deploy (example for Vercel)
vercel --prod

echo "Deployment complete!"
```

### 3. Environment Configuration

Document environment variables:

```markdown
## Required Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| DATABASE_URL | Database connection string | Yes |
| API_KEY | External API key | Yes |
| NODE_ENV | Environment mode | Yes |
...
```

Create `.env.example` with placeholders.

### 4. Infrastructure Setup (based on tech stack)

#### For Vercel
- Create `vercel.json` configuration
- Set up environment variables
- Configure build settings

#### For AWS
- Create CloudFormation templates or Terraform
- Configure S3, CloudFront, Lambda, etc.

#### For Docker
- Create production Dockerfile
- Create docker-compose.prod.yml

### 5. Monitoring & Logging (Optional)
- Error tracking setup (Sentry, etc.)
- Logging configuration
- Health check endpoints

### 6. Documentation
- Deployment guide
- Rollback procedures
- Troubleshooting guide

## Required Outputs

### `.github/workflows/` (required directory)
At minimum, one CI/CD workflow file:
- `ci.yml` — Build and test on push/PR

### `deploy.sh` (required)
Deployment script that:
- Runs build
- Runs tests
- Deploys to production

### `stages/05-deployment/outputs/deployment_guide.md` (required)
```markdown
## Deployment Guide

### Prerequisites
- Node.js 20+
- npm 9+
- [Platform CLI] installed

### Environment Setup
1. Copy .env.example to .env
2. Fill in required values
...

### Deployment Steps
1. Run `./deploy.sh`
...

### Rollback Procedure
1. ...

### Troubleshooting
- Issue: ...
  Solution: ...
```

### `stages/05-deployment/outputs/ci_config.yaml` (optional)
Copy of CI/CD configuration for reference.

### `Dockerfile` (optional, if containerized)
Production-ready Dockerfile.

## Quality Criteria
- CI/CD pipeline runs successfully
- Deployment script is executable and documented
- Environment variables documented
- Rollback procedure defined
- All tests pass in CI environment

## Quality Checks (Automated)
- `ci_config_exists`: .github/workflows/ has content (blocking)
- `ci_syntax`: YAML syntax valid (non-critical)
- `deploy_script`: deploy.sh exists (critical)

## HANDOFF
Generate `stages/05-deployment/HANDOFF.md` summarizing:
- CI/CD configuration
- Deployment target and method
- Environment variables required
- Post-deployment verification steps
- Known deployment considerations
