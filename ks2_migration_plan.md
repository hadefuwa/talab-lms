# KS2 Lab Migration Plan

This plan is for AI agents migrating games from the KS2 Lab repo into Talab LMS.

Source repo: https://github.com/hadefuwa/ks2-lab

Progress checklist: `ks2_migration_checklist.md`

---

## Goal

Copy standalone KS2 Lab HTML games into:

```
public/games/ks2-lab/<slug>/index.html
```

Insert an idempotent Supabase lesson row pointing to:

```
/games/ks2-lab/<slug>/index.html
```

---

## Source Structure

Use this priority order when locating the source file:

1. `public/html-games/<name>.html` — primary source, always prefer this
2. `html games/<name>.html` — older duplicates, use only if absent from `public/html-games/`
3. `src/data/lessons/year*.js` — React lesson data, not HTML games, skip for now

---

## Game Risk Tiers

Before starting a game, identify its tier. Higher-risk games need more prep.

| Tier | Games | Risk |
|---|---|---|
| **Low** | History quiz games, maths games (fractions, days, place value, measurement) | Self-contained HTML/JS, no heavy deps |
| **Medium** | Blockly lessons (023–031) | Load Blockly from CDN — test CDN reliability |
| **High** | 3D model lessons (001–010), resistor, voltage, current | Likely use Three.js and may reference `public/models/` assets from the KS2 Lab repo |

Start with Low tier. Do not migrate High tier games until you have verified their asset dependencies.

---

## Duplicates to Audit First

The following are likely duplicate or draft variants of the same game. Inspect them before migrating — only migrate the best version:

- `ancient-stories.html`, `ancient-stories-full.html`, `ancient-stories-part1.html`, `ancient-stories-part2.html`, `ancient-stories-temp.html` (items 017–021) — pick the most complete one, skip the rest

---

## postMessage Contract

Talab's `GameLesson.tsx` listens for:

```js
window.parent.postMessage({ type: 'GAME_OVER', score: N }, '*');
```

KS2 source games use a different event:

```js
window.parent.postMessage({ type: 'html-game-complete', game: '...', score: N }, '*');
```

**Always replace** the completion `postMessage` call in the copied HTML with the `GAME_OVER` contract. Wrap it in `try/catch` so it never throws:

```js
try {
  window.parent.postMessage({ type: 'GAME_OVER', game: '<slug>', score: score }, '*');
} catch (_) {}
```

If the game has no completion event, add one at the win condition with `score: 1`.

---

## Responsiveness

Source games often have fixed pixel widths (e.g. `width: 500px`). Always apply these CSS fixes when copying:

1. Add `<meta name="viewport" content="width=device-width, initial-scale=1">` if missing.
2. Replace fixed widths like `width: 500px` with `width: min(500px, 100%)`.
3. Replace fixed image/SVG sizes with `min()` equivalents or `max-width: 100%`.
4. Add `padding: 12px; box-sizing: border-box;` to the body so content doesn't touch screen edges.
5. Use `clamp()` for font sizes where practical.

All KS2 games render in the wide iframe layout (`max-w-5xl`, 16:10 aspect ratio) — `GameLesson.tsx` already handles this for any path containing `/ks2-lab/`.

---

## Migration Steps Per Game

1. Open `ks2_migration_checklist.md` and pick the next unchecked **Low tier** game.

2. Fetch the source HTML from the repo:
   ```bash
   gh api repos/hadefuwa/ks2-lab/contents/public/html-games/<name>.html --jq '.content' | base64 -d
   ```

3. Inspect for:
   - `postMessage` calls — note the event type and score variable name
   - External dependencies: CDN URLs, `fetch(...)`, ES module imports, local asset paths
   - Fixed pixel widths that need responsive fixes

4. Create the destination folder:
   ```
   public/games/ks2-lab/<slug>/
   ```

5. Write the HTML to `public/games/ks2-lab/<slug>/index.html` with these changes applied:
   - Add viewport meta tag
   - Responsive CSS fixes
   - Replace completion event with `GAME_OVER`

6. Vendor any local assets (images, audio, JS) into the same folder when practical. Keep CDN imports only if the CDN is reliable (cdnjs, unpkg, jsdelivr are fine; avoid obscure or self-hosted URLs).

7. Create the migration file at `supabase/migrations/<NNN>_ks2_lab_<slug>.sql` using the idempotent pattern below.

8. Choose the correct Talab course by title:
   - Technology, circuits, 3D modelling, Blockly → `KS2 Technology`
   - Fractions, place value, measurement, days/time → `KS2 Maths`
   - Ancient history, dinosaurs, medieval, modern history, world wars → `KS2 History`
   - Reading, writing, language games → `KS2 English`

9. Set `game_pass_score`:
   - Completion-only (no score): `1`
   - Star/score out of 100: `60` (silver)
   - Quiz-style with a clear pass mark baked in: use that mark
   - Blockly/code challenges: `1` (just complete it)

10. Run the build:
    ```bash
    npm run build
    ```

11. Apply the migration:
    ```bash
    npx supabase db push --linked
    ```

12. Verify the row:
    ```bash
    npx supabase db query --linked "select l.title, l.game_path, c.title as course from public.lessons l join public.courses c on c.id = l.course_id where l.game_path like '/games/ks2-lab/%' order by c.title, l.position;"
    ```

13. Mark the checklist item complete, commit, and push.

---

## SQL Migration Pattern

One migration file per game. Always idempotent — safe to re-run.

```sql
do $$
declare
  target_course_id uuid;
  next_position integer;
begin
  select id
  into target_course_id
  from public.courses
  where title = 'KS2 Maths'   -- change to correct course title
  limit 1;

  if target_course_id is null then
    return;
  end if;

  if exists (
    select 1 from public.lessons
    where game_path = '/games/ks2-lab/<slug>/index.html'
  ) then
    return;
  end if;

  select coalesce(max(position), 0) + 1
  into next_position
  from public.lessons
  where course_id = target_course_id;

  insert into public.lessons (
    course_id, title, r2_key, content_body, position, duration_seconds,
    lesson_type, content_path, game_path, game_pass_score
  )
  values (
    target_course_id,
    'KS2 Lab: <Game Title>',
    null, null,
    next_position,
    600,
    'game',
    null,
    '/games/ks2-lab/<slug>/index.html',
    1    -- adjust pass score
  );
end $$;
```

Available course titles (confirmed in DB):
- `KS2 Maths`
- `KS2 English`
- `KS2 History`
- `KS2 Technology`

---

## What NOT to Migrate

- The React/Electron app shell itself
- Zustand state, Electron IPC, or app-wide KS2 Lab state management
- `src/data/lessons/year*.js` React lesson data (different migration path, not HTML games)
- Duplicate draft variants (e.g. ancient-stories-temp.html)

---

## Verification Commands

```bash
npm run build
npx supabase db push --linked

# Check all migrated KS2 rows
npx supabase db query --linked "select l.title, l.game_path, c.title as course from public.lessons l join public.courses c on c.id = l.course_id where l.game_path like '/games/ks2-lab/%' order by c.title, l.position;"
```
