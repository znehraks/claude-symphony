# Netlify Deployment Guide

> Auto-generated based on your tech stack selection: **Netlify**

## Overview

Netlify provides Git-based continuous deployment with instant rollbacks and preview deployments.

## Quick Setup

### 1. Connect Repository

1. Go to [app.netlify.com/start](https://app.netlify.com/start)
2. Connect GitHub and select your repository
3. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `.next` (or `out` for static export)

### 2. Configure Environment Variables

In Netlify Dashboard → Site Settings → Environment Variables:

| Variable | Scope | Required |
|----------|-------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | All | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | All | Yes |

### 3. Deploy

```bash
git push origin main
# Netlify automatically builds and deploys
```

## Configuration

### netlify.toml

```toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "20"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "SAMEORIGIN"
    X-Content-Type-Options = "nosniff"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

## Deploy Contexts

| Context | Branch | URL |
|---------|--------|-----|
| Production | `main` | your-app.netlify.app |
| Branch Deploy | Any branch | branch-name--your-app.netlify.app |
| Deploy Preview | Pull requests | deploy-preview-123--your-app.netlify.app |

## Edge Functions

```typescript
// netlify/edge-functions/hello.ts
export default async (request: Request) => {
  return new Response("Hello from the edge!");
};

export const config = { path: "/hello" };
```

## Custom Domain

1. Go to Domain Settings
2. Add custom domain
3. Configure DNS:
   - CNAME: `www` → `your-app.netlify.app`
   - A: `@` → Netlify load balancer IP

## Rollback

1. Go to Deploys tab
2. Find previous deployment
3. Click "Publish deploy"

## Pricing

| Feature | Starter (Free) | Pro ($19/mo) |
|---------|----------------|--------------|
| Bandwidth | 100 GB/mo | 1 TB/mo |
| Build Minutes | 300/mo | 25,000/mo |
| Functions | 125K/mo | 2M/mo |
| Team Members | 1 | Unlimited |

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Build timeout | Increase timeout in netlify.toml |
| 404 on routes | Add `_redirects` file or configure in netlify.toml |
| Function errors | Check function logs in dashboard |
