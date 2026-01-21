# Output Validation Prompt - CI/CD & Deployment

## Validation Targets

| Output | Required Condition | Validation Method |
|--------|-------------------|-------------------|
| `.github/workflows/` | CI pipeline | Structure verification |
| `deployment_config/` | Environment settings | Structure verification |
| `deployment_log.md` | Deployment records | Item verification |
| `HANDOFF.md` | Final state | Item verification |

## Validation Command

```bash
/validate --stage 10-deployment
```

## Quality Criteria

### .github/workflows/
- [ ] CI workflow exists (ci.yml)
- [ ] CD workflow exists (cd.yml)
- [ ] Build step included
- [ ] Test step included
- [ ] Deploy step included

### deployment_config/
- [ ] Environment variable management
- [ ] Secrets configuration guide
- [ ] Domain/SSL configuration

### deployment_log.md
- [ ] Staging deployment record
- [ ] Production deployment record
- [ ] Deployment URLs

### HANDOFF.md (Final)
- [ ] Project completion checklist
- [ ] Operations guide links
- [ ] Monitoring configuration verification

## Auto Validation Script

```bash
# Check GitHub Actions workflows
ls -la outputs/.github/workflows/

# Workflow validity check (yamllint)
yamllint outputs/.github/workflows/*.yml

# Check deployment configuration
ls -la outputs/deployment_config/
```

## CI/CD Verification

| Item | Criteria | Verified |
|------|----------|----------|
| CI workflow | Exists | - |
| CD workflow | Exists | - |
| Staging deployment | Success | - |
| Production deployment | Success | - |
| Health check | Pass | - |

## Monitoring Checklist

- [ ] Error tracking configured (Sentry, etc.)
- [ ] Performance monitoring configured
- [ ] Log collection configured
- [ ] Alerts configured

## Documentation Checklist

- [ ] Deployment guide
- [ ] Operations manual
- [ ] Troubleshooting guide
- [ ] Rollback procedure

## Pipeline Completion Verification

```bash
# Verify all stages complete
/status

# Final validation
/validate --all
```

## Actions on Failure

1. CI failure → Fix workflow
2. Deployment failure → Check configuration and retry
3. Health check failure → Analyze logs and fix
