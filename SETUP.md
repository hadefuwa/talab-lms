# Talab LMS — Setup Guide

## Prerequisites
- Node.js 20+
- A [Supabase](https://supabase.com) account
- A [Cloudflare](https://dash.cloudflare.com) account (for R2 + Workers)
- A [Google AI Studio](https://aistudio.google.com) API key (Gemini)

---

## 1. Supabase Setup

1. Create a new Supabase project.
2. Go to **SQL Editor** and run `supabase/migrations/001_initial_schema.sql`.
3. In **Authentication → Providers**, enable **Google OAuth** and add your credentials.
   - Redirect URL: `https://your-domain.com/auth/callback`
4. Copy your **Project URL** and **anon public key** from **Project Settings → API**.

### Set your role as Founder
After first sign-in, run this in the SQL editor (replace with your actual user ID):
```sql
update profiles set role = 'founder' where id = 'your-user-id-here';
```

---

## 2. Cloudflare R2 + Worker Setup

### R2 Bucket
1. In Cloudflare dashboard → **R2** → create a bucket named `talab-content`.
2. Upload your video files. Use paths like `videos/course-name/lesson.mp4`.

### Gatekeeper Worker
```bash
cd workers/gatekeeper
npm install
```

Add secrets via Wrangler CLI:
```bash
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_ANON_KEY
wrangler secret put SUPABASE_JWT_SECRET  # Found in Supabase: Settings → API → JWT Secret
```

Deploy:
```bash
npm run deploy
```

Note the Worker URL (e.g. `https://talab-gatekeeper.your-subdomain.workers.dev`).

---

## 3. Next.js App Setup

```bash
# Install dependencies
npm install

# Copy env file and fill in values
cp .env.local.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
GEMINI_API_KEY=your-gemini-key
GATEKEEPER_WORKER_URL=https://talab-gatekeeper.your-subdomain.workers.dev
```

Run locally:
```bash
npm run dev
```

---

## 4. Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Add the same environment variables in Vercel's dashboard under **Settings → Environment Variables**.

---

## Architecture

```
Browser → Next.js (Vercel)
              │
              ├── /api/gemini → Gemini API (lesson Q&A)
              ├── /api/progress → Supabase (progress tracking)
              └── /api/video-token → Gatekeeper Worker
                                          │
                                          ├── Validates Supabase JWT
                                          ├── Checks org subscription
                                          └── Streams R2 video (HTTP 206)
```

**Security model:** Videos are never exposed directly. All access goes through the Worker which validates identity + subscription before streaming.
