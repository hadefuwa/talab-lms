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

## 5. Adding Content

All lesson content is managed through the admin UI at `/admin/lessons/<id>/edit` (founder role only). There are four lesson types, each suited to different content.

---

### 📄 Reading (type: `content`)

Plain or rich-text lessons. Rendered as HTML in the lesson page.

**How to add:**
1. In the admin lesson form, select **Reading**.
2. Paste or write HTML in the **Lesson Content** field.
3. Save. Live immediately.

**When to use:** Text explanations, vocabulary lists, reference material.

---

### 🎬 Video (type: `video`)

Streamed from Cloudflare R2 through the Gatekeeper Worker. Optionally includes reading notes below the video.

**How to add:**
1. Upload your video to R2 at a path like `videos/ks2-maths/fractions-intro.mp4`.
2. In the admin form, select **Video**.
3. Enter the R2 key (e.g. `videos/ks2-maths/fractions-intro.mp4`).
4. Optionally add HTML notes in the **Lesson Content** field — these appear below the player.
5. Save.

**When to use:** Recorded teaching, demonstrations, story-time content.

---

### 🎮 Game (type: `game`)

A self-contained HTML game loaded in a sandboxed iframe. The game communicates its score back via `postMessage`.

**How to add:**
1. Place your game files in `public/games/<game-name>/` (e.g. `public/games/flappy-bird/index.html`).
2. Register the game in `src/components/LessonForm.tsx` in the `BUILT_IN_GAMES` array:
   ```ts
   { label: "My Game", path: "/games/my-game/index.html" }
   ```
3. In the admin form, select **Game**, pick your game, and set a pass score.
4. Push to git. Vercel deploys automatically.

**Game API — postMessage contract:**
When the game ends, it must post this message to the parent window:
```js
window.parent.postMessage({ type: "GAME_OVER", score: 7 }, "*");
```
The LMS receives this, saves the score to Supabase, and marks the lesson complete if `score >= pass_score`.

**When to use:** Engagement exercises, timed challenges, reward activities.

---

### 🧩 Interactive (type: `interactive`)

Block-based interactive lessons with instant feedback, XP, and star ratings. Content lives as a JSON file in the repo — **no database updates needed for content changes**.

**How to add:**
1. Create a JSON file in `public/lessons/`, e.g. `public/lessons/ks1-place-value.json`.
2. In the admin form, select **Interactive** and enter the filename (`ks1-place-value.json`).
3. Push to git. Vercel deploys and the lesson is live.

**To update content later:** Edit the JSON file and push. No Supabase changes needed.

**JSON structure:**
```json
{
  "version": 1,
  "xp_reward": 50,
  "blocks": [ ... ]
}
```

**Available block types:**

| Type | Purpose | Required fields |
|---|---|---|
| `explanation` | Title + body text, optional emoji | `title`, `body`, `emoji?` |
| `worked_example` | Step-by-step reveal | `title`, `steps: string[]` |
| `multiple_choice` | Tap one option | `question`, `options: string[]`, `correct: number (0-based index)`, `hint?` |
| `fill_blank` | Type an answer into an inline blank | `question`, `template` (use `___` for the blank), `answer`, `hint?` |
| `celebration` | Final screen — triggers progress save | `message` |

> **Nursery / KS1 note:** Avoid `fill_blank` for young children — they cannot type. Use `multiple_choice` with large emoji-based options instead.

**Example — nursery counting lesson:**
```json
{
  "version": 1,
  "xp_reward": 50,
  "blocks": [
    {
      "type": "explanation",
      "emoji": "🖐️",
      "title": "Let's Count!",
      "body": "We say one number for each thing and stop when we've counted them all!"
    },
    {
      "type": "worked_example",
      "title": "Count your fingers with me!",
      "steps": [
        "Hold up your hand ✋",
        "Touch your thumb and say... 1",
        "Touch your little finger and say... 5 🖐️"
      ]
    },
    {
      "type": "multiple_choice",
      "question": "How many apples? 🍎 🍎 🍎",
      "options": ["1", "2", "3", "4"],
      "correct": 2,
      "hint": "Count them out loud: one... two... three..."
    },
    {
      "type": "celebration",
      "message": "You can count to 5! Amazing work! 🎉"
    }
  ]
}
```

**XP and scoring:**
- Correct on first attempt → full XP share for that question
- Correct after hints → half XP
- Answer revealed → 0 XP
- ⭐⭐⭐ = all correct first try | ⭐⭐ = completed with hints | ⭐ = completed

**Existing lesson files:**

| File | Lesson | Key stage |
|---|---|---|
| `public/lessons/nursery-counting-to-5.json` | Counting Together: 1 to 5 | Nursery |
| `src/data/example-adding-fractions.json` | Adding Fractions (same denominator) | KS2 |

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
