# Interactive Lessons Plan

## Problem

Current lessons store raw HTML in `content_body` and render it with `dangerouslySetInnerHTML`. This produces plain reading content with no interactivity, no feedback loops, and no engagement. Students read text and click "Mark as Complete" — nothing more.

## Goal

Khan Academy / eSingaporeMaths style interactive lessons: visual explanations, worked examples with step reveals, instant-feedback exercises, and a celebration screen. Reusable across all subjects.

---

## Architecture: JSON Block System

Lesson content moves from raw HTML to a **JSON array of blocks**. Each block is a self-contained unit rendered by a dedicated React component. A central `InteractiveLessonPlayer` reads the block list and steps through them one at a time.

```
lesson.content_body (when lesson_type = 'interactive')
  └── JSON: { version, xp_reward, blocks: Block[] }
        ├── ExplanationBlock    — rich text + emoji
        ├── WorkedExampleBlock  — step-by-step reveal
        ├── MultipleChoiceBlock — 4 options, instant feedback
        ├── FillBlankBlock      — type answer, fuzzy match
        ├── DragSortBlock       — order items correctly
        ├── TapSelectBlock      — multi-select from a group
        ├── MatchPairsBlock     — match left to right
        ├── NumberLineBlock     — interactive SVG placement
        └── CelebrationBlock    — final screen + XP award
```

---

## Block JSON Schema

```json
{
  "version": 1,
  "xp_reward": 50,
  "blocks": [
    {
      "type": "explanation",
      "emoji": "🍕",
      "title": "Adding Fractions",
      "body": "When fractions share the same denominator, add the numerators and keep the denominator."
    },
    {
      "type": "worked_example",
      "title": "Let's work through 2/5 + 1/5",
      "steps": [
        "Both fractions have the same denominator: 5 ✓",
        "Add the numerators: 2 + 1 = 3",
        "Keep the denominator the same: 5",
        "Answer: 2/5 + 1/5 = 3/5 🎉"
      ]
    },
    {
      "type": "multiple_choice",
      "question": "What is 1/4 + 2/4?",
      "options": ["2/4", "3/4", "3/8", "1/2"],
      "correct": 1,
      "hint": "Add the top numbers and keep the bottom number the same."
    },
    {
      "type": "fill_blank",
      "question": "Complete the calculation:",
      "template": "3/7 + 2/7 = ___/7",
      "answer": "5",
      "hint": "Add 3 + 2 to get the numerator."
    },
    {
      "type": "celebration",
      "message": "Amazing work! You can add fractions with the same denominator!"
    }
  ]
}
```

---

## Database

### Migration (006_interactive_lessons.sql)

```sql
ALTER TABLE lessons DROP CONSTRAINT lessons_lesson_type_check;
ALTER TABLE lessons ADD CONSTRAINT lessons_lesson_type_check
  CHECK (lesson_type IN ('content', 'video', 'game', 'interactive'));
```

No new columns needed — `content_body` stores the JSON, `game_pass_score` doubles as the XP pass threshold.

### Type Update (src/lib/types.ts)

```ts
lesson_type: "content" | "video" | "game" | "interactive";
```

---

## Components

All live in `src/components/lesson-blocks/`.

| File | Block Type | Behaviour |
|---|---|---|
| `ExplanationBlock.tsx` | `explanation` | Large emoji, title, body. "Continue" button to proceed. |
| `WorkedExampleBlock.tsx` | `worked_example` | Steps hidden; "Reveal Next Step" button; "Continue" after all revealed. |
| `MultipleChoiceBlock.tsx` | `multiple_choice` | 4 tappable options. Green on correct, red shake on wrong. Hint after 1 fail, reveal after 3. |
| `FillBlankBlock.tsx` | `fill_blank` | Inline blank input. Numeric or text match. Hint after 1 fail. |
| `DragSortBlock.tsx` | `drag_sort` | Drag items into correct order. (Phase 2) |
| `TapSelectBlock.tsx` | `tap_select` | Tap all correct items from a group. (Phase 2) |
| `MatchPairsBlock.tsx` | `match_pairs` | Tap left item, tap right match. (Phase 2) |
| `NumberLineBlock.tsx` | `number_line` | SVG number line, drag/tap to place value. (Phase 2) |
| `CelebrationBlock.tsx` | `celebration` | Stars, XP count, message. Posts `/api/progress` on mount. |

---

## InteractiveLessonPlayer (src/components/InteractiveLessonPlayer.tsx)

Central orchestrator:

- Parses `lesson.content_body` as JSON
- Renders one block at a time with an animated transition
- Tracks: current block index, per-block answer state, total score
- Shows segmented progress bar at top (one segment per block)
- "Continue" button advances to next block
- On `CelebrationBlock`: submits completion to `/api/progress`

### Scoring

- Correct first attempt → full XP for that question
- Correct after hint → half XP
- Revealed / gave up → 0 XP
- Stars: 3 = all correct first try, 2 = some hints, 1 = completed

---

## Build Order (Recommended)

### Phase 1 — Core (1.5 days) ✅ In progress
- [ ] `006_interactive_lessons.sql` migration
- [ ] Update `Lesson` type
- [ ] `InteractiveLessonPlayer.tsx` shell + progress bar
- [ ] `ExplanationBlock`, `WorkedExampleBlock`, `MultipleChoiceBlock`, `FillBlankBlock`, `CelebrationBlock`
- [ ] Wire into `lessons/[lessonId]/page.tsx`
- [ ] One real example lesson (Adding Fractions)

### Phase 2 — More Block Types (2 days)
- [ ] `DragSortBlock` — ordering exercises
- [ ] `TapSelectBlock` — multi-select grouping
- [ ] `MatchPairsBlock` — paired matching
- [ ] `NumberLineBlock` — visual number sense

### Phase 3 — Admin Builder (2 days)
- [ ] Visual block editor in `LessonForm.tsx` for `interactive` type
- [ ] Per-block forms (add, edit, delete, reorder)
- [ ] Live preview panel
- [ ] JSON import/export for power users

### Phase 4 — Gamification (1 day)
- [ ] XP stored on `progress_logs` (new column or `game_score` reuse)
- [ ] Star badges on lesson list cards
- [ ] Streak tracking
- [ ] Leaderboard (optional)

---

## Lesson Page Integration

In `src/app/lessons/[lessonId]/page.tsx`, add a third branch alongside the existing `game` and `content/video` branches:

```tsx
{lesson.lesson_type === "interactive" && lesson.content_body ? (
  <InteractiveLessonPlayer
    lesson={lesson}
    orgId={profile?.org_id ?? ""}
    existingProgress={progress}
  />
) : lesson.lesson_type === "game" && lesson.game_path ? (
  <GameLesson ... />
) : (
  // existing content/video rendering
)}
```

---

## Example Lessons to Build

| Title | Subject | Key Stage | Blocks |
|---|---|---|---|
| Adding Fractions (same denominator) | Maths | KS2 | explanation, worked_example, ×2 multiple_choice, ×2 fill_blank, celebration |
| Place Value: Hundreds, Tens, Ones | Maths | KS1 | explanation, ×3 multiple_choice, drag_sort, celebration |
| Punctuation: Capital Letters | English | KS1 | explanation, tap_select, fill_blank, celebration |
| The Water Cycle | Science | KS2 | explanation, worked_example, match_pairs, celebration |
| Times Tables: 6× | Maths | KS2 | explanation, ×6 fill_blank (speed round), celebration |
