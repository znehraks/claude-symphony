# Deployment Guide
<!-- SCHEMA VERSION: 1.0 -->
<!-- REF: GitOps, 12-Factor App, Git Push Auto-Deploy -->

> This is a sample file demonstrating the expected output format.
> Real output should be saved as `deployment_guide.md`.

---

## Metadata

| Field | Value |
|-------|-------|
| version | 1.0.0 |
| last_updated | YYYY-MM-DD |
| author | AI: ClaudeCode (DevOps Specialist) |
| approved_by | @platform-lead |
| tech_stack | Vercel + Supabase |

---

## Quick Start (3 Steps)

### 1. Connect Repository

```bash
# Vercel automatically deploys on git push
# Just connect your GitHub repo at vercel.com/new
```

### 2. Set Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service key (server-side) |
| `OPENAI_API_KEY` | Yes | OpenAI API key |
| `GITHUB_CLIENT_ID` | Yes | GitHub OAuth app ID |
| `GITHUB_CLIENT_SECRET` | Yes | GitHub OAuth secret |

### 3. Deploy

```bash
git push origin main
# That's it! Vercel builds and deploys automatically
```

---

## Architecture Overview

### Git Push Auto-Deploy Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Developer   │     │   GitHub     │     │   Vercel     │
│              │     │              │     │              │
│  git push    │────►│  Webhook     │────►│  Build       │
│              │     │  Trigger     │     │  Deploy      │
└──────────────┘     └──────────────┘     └──────────────┘
                                                 │
                                                 ▼
                     ┌──────────────────────────────────────┐
                     │              Production              │
                     │                                      │
                     │  ┌────────┐  ┌────────┐  ┌────────┐ │
                     │  │ Vercel │  │Supabase│  │ OpenAI │ │
                     │  │ Edge   │  │   DB   │  │  API   │ │
                     │  └────────┘  └────────┘  └────────┘ │
                     │                                      │
                     └──────────────────────────────────────┘
```

### Environment Strategy

| Branch | Environment | URL | Auto-Deploy |
|--------|-------------|-----|-------------|
| `main` | Production | app.example.com | Yes |
| `develop` | Staging | staging.example.com | Yes |
| `feature/*` | Preview | *.vercel.app | Yes (PR) |

---

## Vercel Configuration

### vercel.json

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["iad1", "sfo1"],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "no-store, max-age=0" }
      ]
    }
  ],
  "rewrites": [
    { "source": "/health", "destination": "/api/health" }
  ]
}
```

### Build Settings

| Setting | Value |
|---------|-------|
| Framework Preset | Next.js |
| Build Command | `npm run build` |
| Output Directory | `.next` |
| Install Command | `npm ci` |
| Node.js Version | 20.x |

---

## Supabase Setup

### 1. Create Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Select organization and region (choose closest to users)
4. Copy project URL and keys

### 2. Configure Authentication

```sql
-- Enable email auth (default)
-- Enable OAuth providers in Dashboard > Authentication > Providers

-- Configure Site URL
-- Settings > Authentication > Site URL: https://app.example.com

-- Configure Redirect URLs
-- https://app.example.com/api/auth/callback
-- https://*.vercel.app/api/auth/callback (for previews)
```

### 3. Set Up Database

```sql
-- Run migrations
-- Located in: supabase/migrations/

-- Example: Create users profile table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);
```

---

## Environment Variables

### Required Variables

| Variable | Environment | Description | Example |
|----------|-------------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | All | Supabase URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All | Public anon key | `eyJhbG...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Service key | `eyJhbG...` |
| `OPENAI_API_KEY` | Server only | OpenAI key | `sk-...` |
| `GITHUB_CLIENT_ID` | All | OAuth app ID | `Iv1.abc123` |
| `GITHUB_CLIENT_SECRET` | Server only | OAuth secret | `***` |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_APP_URL` | Auto-detected | Public app URL |
| `LOG_LEVEL` | `info` | Logging verbosity |
| `RATE_LIMIT_MAX` | `100` | API rate limit |

### .env.example

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI
OPENAI_API_KEY=

# GitHub OAuth
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Optional
NEXT_PUBLIC_APP_URL=http://localhost:3000
LOG_LEVEL=debug
```

---

## Deployment Commands

### Manual Deploy (if needed)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Deploy via Git (Recommended)

```bash
# Production deployment
git push origin main

# Preview deployment (automatic on PR)
git push origin feature/my-feature
gh pr create
```

---

## Health Checks

### Endpoints

| Endpoint | Method | Response | Purpose |
|----------|--------|----------|---------|
| `/api/health` | GET | 200 OK | Basic health |
| `/api/health/ready` | GET | 200 OK | Readiness |
| `/api/health/live` | GET | 200 OK | Liveness |

### Health Check Response

```json
{
  "status": "healthy",
  "version": "1.2.3",
  "commit": "abc1234",
  "timestamp": "2024-01-20T14:30:00Z",
  "checks": {
    "database": "ok",
    "auth": "ok",
    "external_apis": "ok"
  }
}
```

### Uptime Monitoring

Configure in Better Uptime, Vercel Checks, or similar:

```yaml
monitors:
  - name: "Production Health"
    url: "https://app.example.com/api/health"
    method: GET
    interval: 60  # seconds
    alertChannels: ["slack", "email"]

  - name: "API Endpoint"
    url: "https://app.example.com/api/users/me"
    method: GET
    headers:
      Authorization: "Bearer ${TEST_TOKEN}"
    expectedStatus: 200
```

---

## Rollback Procedures

### Automatic Rollback (Vercel)

Vercel keeps deployment history. To rollback:

1. Go to Vercel Dashboard → Deployments
2. Find the last working deployment
3. Click "..." → "Promote to Production"

### Git-based Rollback

```bash
# Revert last commit
git revert HEAD
git push origin main

# Or reset to specific commit (careful!)
git reset --hard <commit-hash>
git push origin main --force  # Requires admin
```

### Rollback Triggers

Automatically rollback if:
- [ ] Error rate > 5% for 5 minutes
- [ ] p95 latency > 2s for 5 minutes
- [ ] Health check fails 3 consecutive times

---

## Monitoring & Observability

### Vercel Analytics

Built-in with Vercel:
- Web Vitals (LCP, FID, CLS)
- Page views and unique visitors
- Edge function performance

### Error Tracking (Sentry)

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.VERCEL_ENV,
  tracesSampleRate: 0.1,
});
```

### Logging

```typescript
// lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: { colorize: true },
  },
});
```

---

## Security Checklist

### Pre-deployment

- [ ] All secrets in environment variables (not committed)
- [ ] `.env` files in `.gitignore`
- [ ] HTTPS enforced (Vercel default)
- [ ] Security headers configured
- [ ] Rate limiting enabled

### Security Headers (next.config.js)

```javascript
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
];

module.exports = {
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};
```

---

## Cost Optimization

### Vercel Pricing Considerations

| Tier | Cost | Includes |
|------|------|----------|
| Hobby | Free | 100GB bandwidth, 100 deployments |
| Pro | $20/user/mo | 1TB bandwidth, unlimited deployments |

### Supabase Pricing

| Tier | Cost | Includes |
|------|------|----------|
| Free | $0 | 500MB DB, 1GB storage, 2GB bandwidth |
| Pro | $25/mo | 8GB DB, 100GB storage, 50GB bandwidth |

### Cost Reduction Tips

1. **Enable ISR** for static pages (reduces function invocations)
2. **Use Edge Config** for feature flags (cheaper than DB reads)
3. **Implement caching** at edge and API level
4. **Set budget alerts** in both Vercel and Supabase

---

## Troubleshooting

### Common Issues

| Issue | Symptom | Solution |
|-------|---------|----------|
| Build failure | Deploy stuck | Check build logs, verify deps |
| Environment vars | Runtime errors | Verify vars set for environment |
| Database connection | 500 errors | Check Supabase status, connection string |
| Auth redirect | Login fails | Verify redirect URLs in Supabase |

### Debug Commands

```bash
# Check Vercel logs
vercel logs

# Check environment
vercel env ls

# Check deployments
vercel ls

# Pull remote env to local
vercel env pull
```

---

## Post-Deployment Verification

### Smoke Test Checklist

- [ ] Homepage loads
- [ ] Login flow works
- [ ] Core feature (PR analysis) functions
- [ ] Error pages display correctly
- [ ] API health endpoint returns 200

### Automated Smoke Test

```bash
#!/bin/bash
# scripts/smoke-test.sh

BASE_URL=${1:-"https://app.example.com"}

echo "Running smoke tests against $BASE_URL..."

# Health check
curl -sf "$BASE_URL/api/health" || exit 1
echo "✓ Health check passed"

# Homepage
curl -sf "$BASE_URL" > /dev/null || exit 1
echo "✓ Homepage loads"

# Login page
curl -sf "$BASE_URL/login" > /dev/null || exit 1
echo "✓ Login page loads"

echo "All smoke tests passed!"
```

---

## Contacts

| Role | Contact | Escalation |
|------|---------|------------|
| On-call Engineer | @oncall | Slack #incidents |
| Platform Team | @platform | Slack #platform |
| Security | @security | security@example.com |

### Incident Response

1. **Detect** - Monitor alerts, user reports
2. **Triage** - Assess severity (P0-P3)
3. **Mitigate** - Rollback if needed
4. **Resolve** - Fix root cause
5. **Review** - Post-mortem within 48h

---

## Appendix: Stack-Specific Guides

Depending on your tech stack selection during `npx claude-symphony`, refer to:

| Stack | Guide |
|-------|-------|
| Vercel + Supabase | This document |
| Netlify + Supabase | `./templates/hosting/netlify.md` |
| Railway + PostgreSQL | `./templates/hosting/railway.md` |
| AWS + RDS | `./templates/hosting/aws.md` |
