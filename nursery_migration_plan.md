# Nursery Lab Migration Plan

This plan is for AI agents migrating activities from the Nursery Lab repo into Talab LMS.

Source repo:
https://github.com/hadefuwa/nursery-lab

Live app:
https://hadefuwa.github.io/nursery-lab/#/

Progress checklist:
`nursery_migration_checklist.md`

## What This Repo Is

Nursery Lab is a React + Vite PWA for 3-year-olds. It is different from the KS1 and KS2 imports:

- It is not mainly a folder of standalone HTML games.
- Most activities are React components under `src/components/games/`.
- The app uses `HashRouter` in `src/App.jsx`.
- Game metadata is centralized in `src/config/games.js`.
- Progress is local-only through `src/context/ProgressContext.jsx`.
- It uses Web Speech API heavily.
- It has one standalone static file: `numbers.html`.

Because Talab is already a Next.js app, do not migrate the whole React/Vite app shell directly unless explicitly requested.

## Migration Strategy

Prefer rebuilding Nursery Lab activities as Talab `interactive` lessons when the activity is:

- tap-based
- count/listen based
- multiple choice
- sorting
- matching
- audio-first
- simple enough to express as JSON blocks or a small shared block extension

Use Talab `game` lessons only when the activity is:

- canvas-like
- movement/action based
- timing based
- hard to express through interactive JSON
- easier to preserve as an iframe-style standalone app

Do not use `fill_blank` for nursery. Three-year-olds generally cannot type reliably.

## Target Folder Conventions

For activities migrated as Talab interactive lessons:

```txt
public/lessons/nursery-<slug>.json
```

For activities migrated as iframe games:

```txt
public/games/nursery-lab/<slug>/index.html
```

Talab lesson rows should use:

```txt
lesson_type = 'interactive'
content_path = 'nursery-<slug>.json'
```

or:

```txt
lesson_type = 'game'
game_path = '/games/nursery-lab/<slug>/index.html'
```

## Important Product Rules

Nursery lessons must be audio-first:

- autoplay or repeat TTS instructions where useful
- keep visible text minimal
- use big symbols, emoji, pictures, or icons
- use large tap targets
- keep rounds short
- make success/failure obvious
- allow retry without shame or complex explanation
- avoid keyboard entry unless the lesson is explicitly a keyboard/fine-motor activity

## Current Talab Support

Talab already has a nursery-friendly `counting_game` block in `InteractiveLessonPlayer.tsx`.

Useful fields:

```json
{
  "type": "counting_game",
  "prompt": "Tap three stars",
  "item": "⭐",
  "count": 3,
  "total_items": 5,
  "success": "One, two, three. Three stars.",
  "fail_message": "Too many. Try again."
}
```

Use `total_items` when the child should be able to over-tap and fail/reset.

## Recommended First Migrations

Start with these because they map cleanly to existing Talab interaction patterns:

1. Count Aloud
2. Object Count
3. Number Hunt
4. Sorting
5. Shape Hunt
6. Color Hunt
7. Letter Match
8. Animal Sounds

Defer these until after the simple activities:

- Pacman Letters
- Pacman Numbers
- Falling Letters
- Drawing
- Rhythm Maker
- Bubble Pop

Those likely need iframe game wrappers or custom components.

## Migration Steps For Interactive Lessons

1. Pick the next unchecked item in `nursery_migration_checklist.md`.
2. Review the source component in:

   ```txt
   src/components/games/<ComponentName>.jsx
   ```

3. Identify the actual learning objective.
4. Convert the activity into one or more small JSON lesson files in:

   ```txt
   public/lessons/
   ```

5. Use only nursery-safe block types.
6. If an activity needs a new block type, update `InteractiveLessonPlayer.tsx`.
7. Keep the new block generic enough to reuse across multiple nursery lessons.
8. Add an idempotent Supabase migration to insert the lesson row.
9. Use the correct course:

   - counting, numbers, shape, color, sorting -> `Nursery Maths`
   - letters, phonics, animal sounds -> `Nursery English`
   - clicking, drawing, rhythm, keyboard/fine-motor -> `Nursery Technology`

10. Run:

    ```bash
    npm run build
    ```

11. Apply migrations:

    ```bash
    npx supabase db push --linked
    ```

12. Verify the lesson row exists.
13. Mark the checklist item complete.
14. Commit and push.

## Migration Steps For Iframe Games

Use this only for activities that should remain app-like.

1. Create:

   ```txt
   public/games/nursery-lab/<slug>/index.html
   ```

2. Convert the React component into a standalone HTML/CSS/JS file, or build a minimal standalone React bundle if necessary.
3. Add a completion event:

   ```js
   window.parent.postMessage({ type: "GAME_OVER", score: 1 }, "*");
   ```

4. Add an idempotent Supabase migration with:

   ```txt
   lesson_type = 'game'
   game_path = '/games/nursery-lab/<slug>/index.html'
   game_pass_score = 1
   ```

5. Verify it works inside Talab's iframe.

## SQL Migration Pattern

Use a safe migration that only inserts when the lesson content path or game path is absent.

```sql
do $$
declare
  target_course_id uuid;
  next_position integer;
begin
  select id
  into target_course_id
  from public.courses
  where title = 'Nursery Maths'
     or (key_stage = 'nursery' and subject_category = 'Maths')
  order by created_at
  limit 1;

  if target_course_id is null then
    return;
  end if;

  if exists (
    select 1
    from public.lessons
    where content_path = 'nursery-example.json'
       or game_path = '/games/nursery-lab/example/index.html'
  ) then
    return;
  end if;

  select coalesce(max(position), 0) + 1
  into next_position
  from public.lessons
  where course_id = target_course_id;

  insert into public.lessons (
    course_id,
    title,
    r2_key,
    content_body,
    position,
    duration_seconds,
    lesson_type,
    content_path,
    game_path,
    game_pass_score
  )
  values (
    target_course_id,
    'Nursery Lab: Example Title',
    null,
    null,
    next_position,
    300,
    'interactive',
    'nursery-example.json',
    null,
    null
  );
end $$;
```

## Checks For Other AI Agents

- Read `CLAUDE.md`, `SETUP.md`, `agents.md`, and `README.md` before code changes.
- Check `src/lib/types.ts` if database schema changes are made.
- Do not add `fill_blank` blocks for nursery.
- Do not depend on Nursery Lab `localStorage` progress.
- Do not import the whole Vite app into Next.js without a specific plan.
- Prefer reusable Talab interactive blocks over one-off iframe ports.
- Keep text short and TTS clear.
- Run `npm run build`.
- Push after completion.

## Verification Commands

```bash
npm run build
npx supabase db push --linked
```

Optional row check:

```bash
npx supabase db query --linked "select l.title, l.lesson_type, l.content_path, l.game_path, c.title as course_title from public.lessons l join public.courses c on c.id = l.course_id where c.key_stage = 'nursery' order by c.title, l.position;"
```
