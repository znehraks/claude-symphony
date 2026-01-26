# Supabase Setup Guide

> Auto-generated based on your tech stack selection: **Supabase**

## Overview

Supabase is an open-source Firebase alternative providing PostgreSQL database, authentication, real-time subscriptions, storage, and edge functions.

## Quick Setup

### 1. Create Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create organization (if needed)
4. New Project:
   - Name: your-project-name
   - Database Password: (save securely)
   - Region: Choose closest to users
5. Wait for project to provision (~2 minutes)

### 2. Get API Keys

Go to Settings → API:

| Key | Usage | Environment Variable |
|-----|-------|---------------------|
| Project URL | All requests | `NEXT_PUBLIC_SUPABASE_URL` |
| anon (public) | Client-side, with RLS | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| service_role | Server-side, bypasses RLS | `SUPABASE_SERVICE_ROLE_KEY` |

### 3. Configure Authentication

#### Site URL
Settings → Authentication → URL Configuration:
- Site URL: `https://your-app.vercel.app`

#### Redirect URLs (whitelist)
```
https://your-app.vercel.app/api/auth/callback
https://*.vercel.app/api/auth/callback
http://localhost:3000/api/auth/callback
```

#### OAuth Providers
Enable in Authentication → Providers:
- GitHub: Add Client ID and Secret
- Google: Add Client ID and Secret

## Database Setup

### Create Tables

```sql
-- User profiles (extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Row Level Security (RLS) Policies

```sql
-- Users can read own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admins can view all profiles (example)
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
```

## Client Setup

### Install SDK

```bash
npm install @supabase/supabase-js
```

### Initialize Client

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### Server Client (Next.js App Router)

```typescript
// lib/supabase/server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
}
```

## Authentication Examples

### Sign In with OAuth

```typescript
const supabase = createClient();

async function signInWithGitHub() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${window.location.origin}/api/auth/callback`,
    },
  });
}
```

### Auth Callback Route

```typescript
// app/api/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL('/dashboard', request.url));
}
```

## Real-time Subscriptions

```typescript
// Subscribe to changes
const supabase = createClient();

const channel = supabase
  .channel('profiles')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'profiles' },
    (payload) => {
      console.log('Change received!', payload);
    }
  )
  .subscribe();

// Cleanup
channel.unsubscribe();
```

## Storage

```typescript
// Upload file
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`${userId}/avatar.png`, file);

// Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('avatars')
  .getPublicUrl(`${userId}/avatar.png`);
```

## Edge Functions

```typescript
// supabase/functions/hello/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  const { name } = await req.json();
  return new Response(
    JSON.stringify({ message: `Hello ${name}!` }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
```

Deploy:
```bash
supabase functions deploy hello
```

## Migrations

### Create Migration

```bash
supabase migration new create_profiles
```

### Apply Migrations

```bash
# Local
supabase db reset

# Production
supabase db push
```

## Pricing

| Feature | Free | Pro ($25/mo) |
|---------|------|--------------|
| Database | 500 MB | 8 GB |
| Storage | 1 GB | 100 GB |
| Bandwidth | 2 GB | 50 GB |
| Auth MAUs | 50,000 | 100,000 |
| Edge Functions | 500K/mo | 2M/mo |

## Troubleshooting

| Issue | Solution |
|-------|----------|
| RLS blocking queries | Check policies, use `service_role` for admin |
| Auth redirect fails | Verify redirect URL whitelist |
| Real-time not working | Enable replication for table |
| Storage CORS errors | Configure bucket CORS policy |
