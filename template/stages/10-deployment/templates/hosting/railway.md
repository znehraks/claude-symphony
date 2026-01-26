# Railway Deployment Guide

> Auto-generated based on your tech stack selection: **Railway**

## Overview

Railway provides fullstack hosting with built-in PostgreSQL, Redis, and more. Great for apps that need backend services.

## Quick Setup

### 1. Connect Repository

1. Go to [railway.app/new](https://railway.app/new)
2. Select "Deploy from GitHub repo"
3. Select your repository
4. Railway auto-detects your framework

### 2. Add Services (Optional)

Click "New" → "Database" to add:
- PostgreSQL
- Redis
- MongoDB

### 3. Configure Environment Variables

Railway auto-generates DATABASE_URL for databases. Add your custom vars:

| Variable | Source | Required |
|----------|--------|----------|
| `DATABASE_URL` | Auto (Railway) | Yes (if using Railway DB) |
| `NEXT_PUBLIC_SUPABASE_URL` | Manual | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Manual | Yes |

### 4. Deploy

```bash
git push origin main
# Railway automatically builds and deploys
```

## Configuration

### railway.toml (Optional)

```toml
[build]
builder = "nixpacks"
buildCommand = "npm run build"

[deploy]
startCommand = "npm start"
healthcheckPath = "/api/health"
healthcheckTimeout = 300
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3
```

### Nixpacks Configuration

```toml
# nixpacks.toml
[phases.setup]
nixPkgs = ["nodejs-20_x"]

[phases.install]
cmds = ["npm ci"]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "npm start"
```

## Environments

| Environment | Branch | URL |
|-------------|--------|-----|
| Production | `main` | your-app.up.railway.app |
| Staging | `develop` | your-app-staging.up.railway.app |
| PR Previews | Pull requests | Configurable |

## Custom Domain

1. Go to Settings → Custom Domain
2. Add domain (e.g., `app.example.com`)
3. Add CNAME record pointing to Railway domain

## Database Connection

```typescript
// For Railway PostgreSQL
const connectionString = process.env.DATABASE_URL;

// With Prisma
// schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## Scaling

```bash
# railway.toml
[deploy]
numReplicas = 2  # Horizontal scaling (Pro plan)
```

## Monitoring

- Built-in metrics dashboard
- Log streaming in real-time
- Integrates with external monitoring

## Rollback

1. Go to Deployments tab
2. Select previous deployment
3. Click "Rollback"

## Pricing

| Feature | Hobby (Free) | Pro ($20/mo) |
|---------|--------------|--------------|
| Execution Hours | 500/mo | Unlimited |
| Memory | 512 MB | 8 GB |
| Storage | 1 GB | 100 GB |
| Replicas | 1 | Multiple |

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails | Check build logs, verify start command |
| Database connection | Verify DATABASE_URL is set |
| Out of memory | Upgrade plan or optimize app |
| Port binding | Use `process.env.PORT` |

## Backend-Specific Notes

Railway excels for:
- Full-stack apps with API backends
- Apps needing background jobs
- Microservices architecture
- Long-running processes
