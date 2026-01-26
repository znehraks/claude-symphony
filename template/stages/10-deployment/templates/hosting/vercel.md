# Vercel Deployment Guide

> Auto-generated based on your tech stack selection: **Vercel**

## Overview

Vercel provides zero-config deployments with Git integration. Every `git push` automatically triggers a build and deploy.

## Quick Setup

### 1. Connect Repository

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Vercel auto-detects Next.js and configures build settings

### 2. Configure Environment Variables

In Vercel Dashboard → Your Project → Settings → Environment Variables:

| Variable | Environment | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | All | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview | Yes |

### 3. Deploy

```bash
# That's it! Just push to deploy
git push origin main
```

## Configuration

### vercel.json (Optional)

```json
{
  "buildCommand": "npm run build",
  "framework": "nextjs",
  "regions": ["iad1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "X-Content-Type-Options", "value": "nosniff" }
      ]
    }
  ]
}
```

## Environments

| Branch | Environment | URL |
|--------|-------------|-----|
| `main` | Production | your-app.vercel.app |
| `develop` | Preview | your-app-git-develop.vercel.app |
| Pull Requests | Preview | your-app-git-pr-123.vercel.app |

## Custom Domain

1. Go to Settings → Domains
2. Add your domain (e.g., `app.example.com`)
3. Update DNS records as instructed
4. SSL certificate auto-provisioned

## Monitoring

### Built-in Analytics
- Enable at Settings → Analytics
- Tracks Web Vitals, page views, unique visitors

### Logs
```bash
# View logs via CLI
npx vercel logs

# Or in Dashboard → Deployments → Select deployment → Logs
```

## Rollback

1. Go to Deployments tab
2. Find previous working deployment
3. Click "..." → "Promote to Production"

## Pricing

| Feature | Hobby (Free) | Pro ($20/mo) |
|---------|--------------|--------------|
| Bandwidth | 100 GB | 1 TB |
| Serverless Execution | 100 GB-hrs | 1000 GB-hrs |
| Build Minutes | 6000/mo | Unlimited |
| Team Members | 1 | Unlimited |

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails | Check build logs, verify all env vars |
| 500 errors | Check function logs, verify API keys |
| Slow cold starts | Enable Edge Functions for critical paths |
