# KS2 Lab Migration Plan

This plan is for AI agents migrating games from the KS2 Lab repo into Talab LMS.

Source repo:
https://github.com/hadefuwa/ks2-lab

Progress checklist:
`ks2_migration_checklist.md`

## Goal

Migrate standalone KS2 Lab HTML games into Talab as local `game` lessons.

Standalone game files should be copied from the source repo:

```txt
public/html-games/<source-file>.html
```

into Talab folders:

```txt
public/games/ks2-lab/<slug>/index.html
```

Talab lesson rows should point to:

```txt
/games/ks2-lab/<slug>/index.html
```

## Source Structure Notes

KS2 Lab is a React/Electron app, not only a static HTML lesson hub.

Use this order of priority:

1. `public/html-games/` - best source for direct Talab `game` imports.
2. `html games/` - older or duplicate standalone files; use only when the `public/html-games` version is absent.
3. `src/data/lessons/year*.js` - React lesson content; migrate later as Talab `content`, `interactive`, or quiz content, not as raw game files.

## Existing Talab Support

Talab's `GameLesson.tsx` already accepts:

```js
window.parent.postMessage({ type: "GAME_OVER", score: 1 }, "*");
```

It also currently accepts the KS1 legacy completion event:

```js
window.parent.postMessage({ type: "lessonCompleted", lessonId: 1 }, "*");
```

KS2 games may use other event names, for example:

```js
window.parent.postMessage({ type: "html-game-complete", game: "fractions", score: stars }, "*");
```

Before importing a KS2 game, inspect the source for `postMessage`. If it does not send `GAME_OVER`, either:

- update the game to send `GAME_OVER`, or
- extend `GameLesson.tsx` to support that specific legacy event safely.

Preferred final contract:

```js
window.parent.postMessage({ type: "GAME_OVER", score: score }, "*");
```

## Migration Steps Per Game

1. Open `ks2_migration_checklist.md` and pick the next unchecked game.
2. Create a folder:

   ```txt
   public/games/ks2-lab/<slug>/
   ```

3. Copy the source HTML to:

   ```txt
   public/games/ks2-lab/<slug>/index.html
   ```

4. Inspect the HTML for dependencies:

   - `https://...` CDN imports
   - local images/audio/models
   - `public/models`
   - `public/blockly-games`
   - `fetch(...)`
   - ES module imports
   - import maps

5. Vendor important local assets into the same game folder when practical.
6. Keep CDN dependencies only when they are acceptable for production reliability.
7. Ensure completion sends `GAME_OVER`.
8. If the game has stars or score, pass that score. If it only has completion, use score `1`.
9. Add an idempotent Supabase migration that inserts the Talab lesson row.
10. Choose the right Talab course:

    - Technology, circuits, 3D modelling, Blockly -> `KS2 Technology`
    - Fractions, place value, measurement, days/time -> `KS2 Maths`
    - Ancient history, dinosaurs, medieval, modern history, world wars -> `KS2 History`
    - Reading/writing/language games, if found -> `KS2 English`

11. Set `lesson_type = 'game'`.
12. Set `game_path = '/games/ks2-lab/<slug>/index.html'`.
13. Set `game_pass_score` based on the game:

    - Completion-only games: `1`
    - Star games: usually `1` to pass, or `3` if mastery is required
    - Score games: choose a sensible pass score from the game logic

14. Run:

    ```bash
    npm run build
    ```

15. Apply migrations:

    ```bash
    npx supabase db push --linked
    ```

16. Verify the lesson row exists.
17. Test the game inside Talab's iframe.
18. Mark the checklist item complete.
19. Commit and push.

## SQL Migration Pattern

Use one numbered migration per batch, or one per game if the migration is risky. Keep every migration idempotent.

```sql
do $$
declare
  target_course_id uuid;
  next_position integer;
begin
  select id
  into target_course_id
  from public.courses
  where title = 'KS2 Technology'
     or (key_stage = 'ks2' and subject_category = 'Technology')
  order by created_at
  limit 1;

  if target_course_id is null then
    return;
  end if;

  if exists (
    select 1
    from public.lessons
    where game_path = '/games/ks2-lab/example-slug/index.html'
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
    'KS2 Lab: Example Title',
    null,
    null,
    next_position,
    600,
    'game',
    null,
    '/games/ks2-lab/example-slug/index.html',
    1
  );
end $$;
```

## Completion Event Audit

Before bulk migration, scan each source HTML for completion events:

```powershell
$files = Invoke-RestMethod 'https://api.github.com/repos/hadefuwa/ks2-lab/contents/public/html-games?ref=main'
foreach ($file in $files) {
  $content = (Invoke-WebRequest -UseBasicParsing $file.download_url).Content
  $matches = [regex]::Matches($content, 'postMessage\([^\n]+')
  "$($file.name): $($matches.Value -join ' | ')"
}
```

If a game has no completion event, add one at the win condition.

## Important Checks

- Do not migrate the React/Electron shell itself into Talab.
- Do not import Zustand, Electron, or app-wide KS2 Lab state management.
- Keep every standalone game self-contained under `public/games/ks2-lab/<slug>/`.
- Test inside Talab's iframe, not only by opening the HTML directly.
- Watch for games that require large desktop layouts. If needed, extend `GameLesson.tsx` wide-frame detection for `/ks2-lab/`.
- Watch for Three.js games that import models from `public/models`.
- Watch for Blockly games that rely on `public/blockly-games` or CDN Blockly.
- Avoid placing Technology games in Maths just because they contain numbers.

## Verification Commands

```bash
npm run build
npx supabase db push --linked
```

Optional row check:

```bash
npx supabase db query --linked "select l.title, l.game_path, c.title as course_title from public.lessons l join public.courses c on c.id = l.course_id where l.game_path like '/games/ks2-lab/%' order by c.title, l.position;"
```
