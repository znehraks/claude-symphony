# AI Collaboration Prompt - CI/CD & Deployment

## Collaboration Mode: Deployment Chain

This stage uses **deployment chain** to perform safe deployment.

### Participating Models
- **ClaudeCode**: CI/CD configuration, deployment automation

### Collaboration Prompt

```
# Deployment chain
/collaborate --mode sequential --chain "claudecode:ci_setup -> claudecode:cd_setup -> claudecode:deploy"
```

### Deployment Steps

| Step | Task | Verification |
|------|------|--------------|
| CI Setup | Build/test pipeline | Tests pass |
| CD Setup | Staging/production pipeline | Environment separation |
| Deploy | Execute actual deployment | Health check |

### CI/CD Pipeline Configuration

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm test
      - run: npm run build
```

### Deployment Platform Selection

| Platform | Advantages | Recommended Use |
|----------|------------|-----------------|
| Vercel | Next.js optimized | Frontend |
| Railway | Full-stack support | Full-stack apps |
| AWS | Scalability | Enterprise |
| Cloudflare | Edge deployment | Static/Edge |

### Rollback Strategy

```bash
# Rollback preparation
/checkpoint --reason "Pre-deployment state"

# Execute rollback (if needed)
/restore checkpoint_id
```

### Output Format

```markdown
## Deployment Results

### CI Pipeline
- Build: Success/Failure
- Tests: Pass/Fail
- Lint: Pass/Fail

### CD Pipeline
- Staging: [URL]
- Production: [URL]

### Monitoring
- Error tracking: [Configured/Not configured]
- Performance monitoring: [Configured/Not configured]
```
