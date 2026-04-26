# Talab LMS — Claude Code Context

## What this project is

Talab is a homeschool LMS built for a single founder (Hamed) who creates all curriculum content. Parents subscribe and their children work through lessons. The founder has full admin access; parents manage their family "organisation"; students consume content.

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, Turbopack) |
| Database | Supabase (Postgres + Auth) |
| Video storage | Cloudflare R2, served via a Gatekeeper Worker |
| AI assistant | Google Gemini 2.0 Flash |
| TTS | Browser Web Speech API (`SpeechSynthesisUtterance`) |
| Payments | Stripe (checkout + customer portal + webhook) |
| Deployment | Vercel |

## Key conventions

- **TypeScript throughout.** All types live in `src/lib/types.ts`.
- **Server components by default.** Pages fetch data server-side via `src/lib/supabase/server.ts`. Client components are marked `"use client"` and use `src/lib/supabase/client.ts`.
- **No ORM.** Raw Supabase queries everywhere.
- **Roles:** `founder` | `parent` | `student`. The founder is the only admin. Role gates are checked on every protected page.
- **Organisations:** Each family is an `organization` row. A parent's `org_id` links them to it. Subscription status lives on the org.
- **Migrations:** All schema changes go in `supabase/migrations/` as numbered SQL files (e.g. `007_lesson_content_path.sql`). Apply with `npx supabase db push --linked`.

## File structure highlights

```
src/
  app/
    (auth)/              — login, callback
    admin/               — founder-only course/lesson/quiz management
    api/
      gemini/            — AI lesson assistant endpoint
      progress/          — mark lesson complete
      game/complete/     — save game score
      video-token/       — proxy to Gatekeeper Worker for signed URLs
      stripe/            — checkout, portal, webhook
    courses/             — course listing + detail pages
    lessons/[lessonId]/  — lesson viewer (all types)
    billing/             — subscription management
  components/
    InteractiveLessonPlayer.tsx  — block-based interactive lesson engine
    GameLesson.tsx               — iframe game wrapper + postMessage handler
    GeminiSidebar.tsx            — AI chat sidebar
    TTSButton.tsx                — text-to-speech button
    LessonForm.tsx               — admin lesson create/edit form
  lib/
    types.ts             — all TypeScript interfaces
    supabase/
      server.ts          — SSR Supabase client
      client.ts          — browser Supabase client
public/
  lessons/               — interactive lesson JSON files (served as static assets)
  games/                 — self-contained HTML game files
supabase/
  migrations/            — numbered SQL migration files
```

## Lesson types

There are four lesson types (`lesson_type` column on `lessons` table):

| Type | How content is stored | How it renders |
|---|---|---|
| `content` | HTML string in `content_body` | `dangerouslySetInnerHTML` + TTS button |
| `video` | R2 key in `r2_key`, optional HTML in `content_body` | `VideoPlayer` component + notes |
| `game` | Path in `game_path` | `GameLesson` iframe + postMessage |
| `interactive` | Filename in `content_path` → `/public/lessons/*.json` | `InteractiveLessonPlayer` |

For `interactive` lessons, content changes only require editing the JSON file and pushing to git — no database update needed.

## Interactive lesson JSON format

Files live in `public/lessons/`. The player (`InteractiveLessonPlayer.tsx`) fetches them at runtime.

```json
{
  "version": 1,
  "xp_reward": 50,
  "blocks": [
    { "type": "explanation", "emoji": "🍕", "title": "...", "body": "..." },
    { "type": "worked_example", "title": "...", "steps": ["..."] },
    { "type": "multiple_choice", "question": "...", "options": ["a","b","c"], "correct": 1, "hint": "..." },
    { "type": "fill_blank", "question": "...", "template": "3 + ___ = 5", "answer": "2", "hint": "..." },
    { "type": "celebration", "message": "Well done! 🎉" }
  ]
}
```

Avoid `fill_blank` for nursery/KS1 — young children cannot type. Use `multiple_choice` instead.

## Database migration workflow

```bash
# Make changes in supabase/migrations/NNN_description.sql
npx supabase db push --linked   # applies to remote Supabase project
```

One-off SQL queries against the live DB:
```bash
SUPABASE_ACCESS_TOKEN=<token> npx supabase db query --linked "SELECT ..."
```

## Common commands

```bash
npm run dev          # local dev server
npm run build        # production build (run to check types before pushing)
npx supabase db push --linked   # apply migrations
```

## Things to watch out for

- **Lesson page branch order matters.** In `src/app/lessons/[lessonId]/page.tsx`, `interactive` is checked before `game` before the content/video fallback. Adding a new type needs a new branch.
- **`fill_blank` is keyboard-only.** Never use it for nursery or KS1 lessons.
- **Game postMessage contract.** Games must post `{ type: "GAME_OVER", score: number }` to `window.parent` or the score will never be saved.
- **Content body vs content path.** Old lessons may have JSON in `content_body`. New interactive lessons use `content_path`. The player handles both — `content_path` takes priority.
- **Supabase CLI needs the access token.** Set `SUPABASE_ACCESS_TOKEN` env var or the linked commands will fail.
- **Vercel build fails on TypeScript errors.** Run `npm run build` locally before pushing if you've changed types.
