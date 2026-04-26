# KS1 Lab Migration Plan

This plan is for AI agents migrating games from the old KS1 Lab site into Talab LMS.

Source site:
https://hadefuwa.github.io/ks1-lab/

Source manifest:
https://hadefuwa.github.io/ks1-lab/lessons.json

Progress checklist:
`migration_checklist.md`

## Goal

Migrate each old KS1 Lab HTML game into Talab as a local `game` lesson.

Games should live in:

```txt
public/games/ks1-lab/lessonN/
```

Talab lesson rows should point to:

```txt
/games/ks1-lab/lessonN/index.html
```

## Current State

Lesson 1 has already been migrated:

```txt
public/games/ks1-lab/lesson1/index.html
public/games/ks1-lab/lesson1/script.js
public/games/ks1-lab/lesson1/styles.css
```

It has also been inserted into the `KS1 English` course by:

```txt
supabase/migrations/009_add_ks1_lab_lesson1.sql
```

`GameLesson.tsx` already supports the legacy completion event:

```js
window.parent.postMessage({ type: "lessonCompleted", lessonId: 1 }, "*");
```

For legacy games, Talab treats this as a completed game with score equal to `game_pass_score`.

## Migration Steps Per Game

1. Check `migration_checklist.md` and pick the next unchecked lesson.
2. Create a folder:

   ```txt
   public/games/ks1-lab/lessonN/
   ```

3. Download or copy all files required by that lesson.

   Many early lessons use:

   ```txt
   index.html
   script.js
   styles.css
   ```

   Some later lessons may be single-file HTML with inline CSS/JS.

4. Open the lesson locally and inspect for external dependencies:

   - CDN scripts
   - Google Fonts
   - images
   - audio files
   - `fetch(...)`
   - hardcoded relative paths

5. Ensure completion works.

   Preferred Talab contract:

   ```js
   window.parent.postMessage({ type: "GAME_OVER", score: 1 }, "*");
   ```

   Legacy contract is currently accepted:

   ```js
   window.parent.postMessage({ type: "lessonCompleted", lessonId: N }, "*");
   ```

6. If the game does not send either completion event, add one when the win condition is reached.
7. Add an idempotent numbered Supabase migration to create the Talab lesson row.
8. Use the correct course:

   - English/spelling/phonics games -> `KS1 English`
   - Maths games -> `KS1 Maths`
   - Time/money/word-problem maths games -> usually `KS1 Maths`

9. Set `lesson_type = 'game'`.
10. Set `game_path = '/games/ks1-lab/lessonN/index.html'`.
11. Set `game_pass_score = 1` for legacy completion-only games unless the game has a meaningful score.
12. Run:

   ```bash
   npm run build
   ```

13. Apply the DB migration:

   ```bash
   npx supabase db push --linked
   ```

14. Verify the lesson row exists in Supabase.
15. Mark the game as complete in `migration_checklist.md`.
16. Commit and push.

## Migration SQL Pattern

Use a safe migration that only inserts when the `game_path` is absent.

```sql
do $$
declare
  target_course_id uuid;
  next_position integer;
begin
  select id
  into target_course_id
  from public.courses
  where title = 'KS1 English'
  order by created_at
  limit 1;

  if target_course_id is null then
    return;
  end if;

  if exists (
    select 1
    from public.lessons
    where game_path = '/games/ks1-lab/lessonN/index.html'
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
    'KS1 Lab: Lesson Title',
    null,
    null,
    next_position,
    600,
    'game',
    null,
    '/games/ks1-lab/lessonN/index.html',
    1
  );
end $$;
```

## Important Checks

- Do not overwrite existing migrated lesson folders unless intentionally updating that specific game.
- Keep each old game self-contained under its own `lessonN` folder.
- Do not rely on the old KS1 Lab sidebar or old `localStorage` progress. Talab progress is saved through Supabase.
- Test games in Talab's iframe, not only by opening the HTML directly.
- Keep wide KS1 Lab games using the existing wide iframe behavior in `GameLesson.tsx`.
- Some spelling games require keyboard input, so do not place them in nursery courses.
- Prefer one migration per batch, but keep it idempotent.

## Verification Commands

```bash
npm run build
npx supabase db push --linked
```

Optional row check:

```bash
npx supabase db query --linked "select l.title, l.game_path, c.title as course_title from public.lessons l join public.courses c on c.id = l.course_id where l.game_path like '/games/ks1-lab/%' order by c.title, l.position;"
```
