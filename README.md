# Talab LMS

A secure, modern Learning Management System built for homeschool families. Founders publish curriculum; families subscribe and track their children's progress.

**Live:** [talab.space](https://talab.space)

---

## Features

### For Students
- Browse free and premium courses
- Watch lessons, read content, and play interactive JavaScript games
- Take quizzes with instant scoring and answer explanations
- View personal progress across all courses
- Earn a printable completion certificate when a course is finished

### For Parents
- Manage a family organisation and invite students
- View each student's detailed progress — lesson completion, quiz scores, and game high scores
- Manage billing and subscription

### For the Founder (Admin)
- Full course and lesson management — create, edit, delete, reorder
- Three lesson types: **Reading**, **Video** (Cloudflare R2), **Game** (custom JS)
- Quiz builder with multiple-choice questions, pass marks, and explanations
- Free vs. premium course designation — free courses are open to all, premium requires subscription
- Platform analytics — student counts, active subscriptions, lesson completions, quiz pass rates
- Publish/draft control on courses and quizzes

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS |
| Auth | Supabase (Google OAuth) |
| Database | Supabase / PostgreSQL with Row Level Security |
| Storage | Cloudflare R2 (videos, PDFs) |
| Edge streaming | Cloudflare Worker (JWT validation + HTTP 206) |
| AI assistant | Google Gemini 2.0 Flash (lesson chatbot) |
| Billing | Stripe (subscriptions + webhooks) |
| Deployment | Vercel |

---

## Project Structure

```
src/
├── app/
│   ├── admin/          # Founder-only: create/edit courses, lessons, quizzes, analytics
│   ├── api/            # Route handlers: quiz submit, game complete, admin CRUD, Stripe webhook
│   ├── billing/        # Subscription management
│   ├── courses/        # Course detail, quiz player, completion certificate
│   ├── dashboard/      # Course grid with search and filter
│   ├── family/         # Family management and student progress views
│   ├── lessons/        # Lesson viewer (video, reading, game)
│   └── progress/       # Student self-view progress page
├── components/         # Shared UI components
├── lib/
│   ├── supabase/       # Server and client Supabase helpers
│   ├── stripe.ts       # Stripe client and plan config
│   └── types.ts        # TypeScript interfaces
public/
└── games/
    └── flappy-bird/    # Example JS game lesson (postMessage scoring)
supabase/
└── migrations/         # SQL migrations (001–005)
workers/
└── gatekeeper/         # Cloudflare Worker for R2 video streaming
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Google Cloud](https://console.cloud.google.com) OAuth 2.0 Client ID
- (Optional) Cloudflare account for R2 video storage
- (Optional) Stripe account for billing
- (Optional) Google Gemini API key for the AI chatbot

### 1. Clone and install

```bash
git clone https://github.com/hadefuwa/talab-lms.git
cd talab-lms
npm install
```

### 2. Environment variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

GEMINI_API_KEY=your_gemini_api_key

# Optional — leave empty until Cloudflare Worker is deployed
GATEKEEPER_WORKER_URL=

# Optional — required for billing
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_MONTHLY=
STRIPE_PRICE_ANNUAL=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

### 3. Run database migrations

```bash
npx supabase login
npx supabase link --project-ref your_project_ref
npx supabase db push
```

### 4. Set up Google OAuth

In your Supabase project → Authentication → Providers → Google, add your Google OAuth Client ID and Secret. Add these redirect URIs in Google Cloud Console:

- `https://your-project.supabase.co/auth/v1/callback`
- `http://localhost:3000/auth/callback` (for local dev)

### 5. Set your founder role

After signing in for the first time, run this in the Supabase SQL editor:

```sql
UPDATE profiles SET role = 'founder' WHERE id = (
  SELECT id FROM auth.users WHERE email = 'your@email.com'
);
```

### 6. Start dev server

```bash
npm run dev
```

---

## Lesson Types

Talab supports three lesson types set when creating a lesson:

| Type | Description |
|---|---|
| **Reading** | HTML content rendered in the lesson view |
| **Video** | Streamed from Cloudflare R2 via the Gatekeeper Worker |
| **Game** | Custom JavaScript game in an iframe with score-based completion |

### Adding a custom game

1. Create `public/games/your-game/index.html`
2. When the game ends, call:
   ```js
   window.parent.postMessage({ type: 'GAME_OVER', score: N }, '*')
   ```
3. Register it in `src/components/LessonForm.tsx` → `BUILT_IN_GAMES` array
4. Create a Game lesson in the admin panel and set a pass score

---

## Access Control

| Role | Access |
|---|---|
| **Founder** | Full access to everything — all courses, admin pages, analytics |
| **Parent** | Access to courses (free always, premium with active subscription), family management, billing |
| **Student** | Access to courses (same subscription rules as parent), personal progress |

Free courses are accessible to all logged-in users. Premium courses require an `active` or `trialing` subscription on the family's organisation.

---

## Cloudflare R2 / Gatekeeper Worker

The Worker code lives in `workers/gatekeeper/`. It validates the user's Supabase JWT, checks their subscription, and streams R2 objects with HTTP 206 range request support (required for video scrubbing).

To deploy:

```bash
cd workers/gatekeeper
npm install
npx wrangler deploy
```

Then set `GATEKEEPER_WORKER_URL` in your Vercel environment variables.

---

## Deployment

The app is deployed on Vercel. Connect the GitHub repo and add the environment variables from step 2 in the Vercel dashboard. Database migrations are run separately via the Supabase CLI.

---

## Roadmap

- [ ] Stripe billing live (keys pending)
- [ ] Cloudflare R2 Worker deployed
- [ ] More custom game lessons
- [ ] Email notifications for parents on student activity
