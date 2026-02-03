# Stage 08: Deployment

## Objective
Set up CI/CD pipeline and deploy the application to production.

## Inputs
- `stages/07-qa/HANDOFF.md` — QA & testing context
- `stages/07-qa/outputs/` — test results, coverage, and QA reports
- `stages/03-planning/outputs/tech_stack.md` — hosting platform selection
- `stages/03-planning/outputs/conventions.md` — conventions (git workflow, CI rules)
- Source code in project root
- `references/08-deployment/` — CI/CD templates, infrastructure configs

## Tasks

1. **CI pipeline** — configure GitHub Actions (or chosen CI) for lint, typecheck, test on push
2. **Environment configuration** — set up environment variables, secrets management
3. **Build configuration** — optimize production build (minification, tree-shaking, etc.)
4. **Deployment setup** — configure hosting platform (Vercel/Netlify/Railway/etc.)
5. **Database migration** — set up production database and run migrations
6. **Deployment verification** — deploy and verify the application works in production

## Required Outputs

### CI/CD configuration (in project root)
- `.github/workflows/ci.yml` — CI pipeline
- `.github/workflows/deploy.yml` — deployment pipeline (if applicable)
- Hosting platform configuration (vercel.json, netlify.toml, etc.)

### `stages/08-deployment/outputs/deployment_guide.md` (required)
- Deployment steps (manual and automated)
- Environment variables needed
- Database setup instructions
- Monitoring and logging setup
- Rollback procedure
- Production URL(s)

### `stages/08-deployment/outputs/ci_config.yaml` (optional)
- CI/CD pipeline documentation

## Quality Criteria
- CI pipeline runs lint, typecheck, and tests
- Application deploys without errors
- Production environment is accessible
- Environment variables are properly configured (no secrets in code)

## HANDOFF
Generate `stages/08-deployment/HANDOFF.md` summarizing:
- Deployment URLs and access info
- CI/CD pipeline status
- Post-deployment checklist
- Monitoring and maintenance notes

## Pipeline Complete
This is the final stage. After successful deployment, the pipeline is complete.
Update `state/progress.json` to reflect pipeline completion.
