# KS2 Lab Migration Checklist

Source repo: https://github.com/hadefuwa/ks2-lab

Primary source folder: `public/html-games/`
Secondary source folder: `html games/` (older duplicates)

Status key:
- [x] Migrated into Talab
- [ ] Pending migration

Migration order: **Maths → History → Technology (Low → Medium → High)**

Per-game checks before marking complete:
- Copy the source HTML into `public/games/ks2-lab/<slug>/index.html`
- Fix `min-height: 100vh` → `height: 100vh` on body
- Patch completion `postMessage` to `{ type: 'GAME_OVER', score: N }`
- Add idempotent Supabase migration, run build, push migration

---

## KS2 Maths

- [x] `fractions.html` -> `/games/ks2-lab/fractions/index.html`
- [x] `days.html` -> `/games/ks2-lab/days/index.html`
- [x] `length-height-measurement.html` -> `/games/ks2-lab/length-height-measurement/index.html`
- [x] `place_value_100.html` -> `/games/ks2-lab/place-value-100/index.html`

---

## KS2 History

- [x] `ancient-china-great-wall.html` -> `/games/ks2-lab/ancient-china-great-wall/index.html`
- [ ] `ancient-egypt-daily-life.html` -> `/games/ks2-lab/ancient-egypt-daily-life/index.html`
- [ ] `ancient-egypt-pyramids-pharaohs.html` -> `/games/ks2-lab/ancient-egypt-pyramids-pharaohs/index.html`
- [ ] `ancient-greece-daily-life.html` -> `/games/ks2-lab/ancient-greece-daily-life/index.html`
- [ ] `ancient-mesopotamia.html` -> `/games/ks2-lab/ancient-mesopotamia/index.html`
- [ ] `ancient-rome-daily-life.html` -> `/games/ks2-lab/ancient-rome-daily-life/index.html`
- [ ] `ancient-stories*.html` (**audit duplicates first** — pick best of `ancient-stories.html`, `-full`, `-part1`, `-part2`, `-temp`; migrate one, skip rest)
- [ ] `between-the-wars.html` -> `/games/ks2-lab/between-the-wars/index.html`
- [ ] `comparing-civilizations.html` -> `/games/ks2-lab/comparing-civilizations/index.html`
- [ ] `dinosaur-sorting.html` -> `/games/ks2-lab/dinosaur-sorting/index.html`
- [ ] `dinosaurs-when-they-lived.html` -> `/games/ks2-lab/dinosaurs-when-they-lived/index.html`
- [ ] `fall-of-rome.html` -> `/games/ks2-lab/fall-of-rome/index.html`
- [ ] `famous-people-from-history.html` -> `/games/ks2-lab/famous-people-from-history/index.html`
- [ ] `historical-sources-evidence.html` -> `/games/ks2-lab/historical-sources-evidence/index.html`
- [ ] `jesus-and-early-christianity.html` -> `/games/ks2-lab/jesus-and-early-christianity/index.html`
- [ ] `kings-and-prophets.html` -> `/games/ks2-lab/kings-and-prophets/index.html`
- [ ] `life-long-ago.html` -> `/games/ks2-lab/life-long-ago/index.html`
- [ ] `life-long-ago-vs-life-now.html` -> `/games/ks2-lab/life-long-ago-vs-life-now/index.html`
- [ ] `medieval-daily-life.html` -> `/games/ks2-lab/medieval-daily-life/index.html`
- [ ] `modern-world-1960s-1990s.html` -> `/games/ks2-lab/modern-world-1960s-1990s/index.html`
- [ ] `modern-world-2000s-today.html` -> `/games/ks2-lab/modern-world-2000s-today/index.html`
- [ ] `noahs-ark.html` -> `/games/ks2-lab/noahs-ark/index.html`
- [ ] `prehistoric-times.html` -> `/games/ks2-lab/prehistoric-times/index.html`
- [ ] `the-crusades.html` -> `/games/ks2-lab/the-crusades/index.html`
- [ ] `the-reformation.html` -> `/games/ks2-lab/the-reformation/index.html`
- [ ] `world-war-i.html` -> `/games/ks2-lab/world-war-i/index.html`

---

## KS2 Technology — Low Tier (self-contained)

- [ ] `current.html` -> `/games/ks2-lab/current/index.html`
- [ ] `resistor.html` -> `/games/ks2-lab/resistor/index.html`
- [ ] `voltage.html` -> `/games/ks2-lab/voltage/index.html`

---

## KS2 Technology — Medium Tier (CDN Blockly — test reliability first)

- [ ] `blockly-lesson-1-hello-world.html` -> `/games/ks2-lab/blockly-lesson-1-hello-world/index.html`
- [ ] `blockly-lesson-2-simple-math.html` -> `/games/ks2-lab/blockly-lesson-2-simple-math/index.html`
- [ ] `blockly-lesson-3-sequences.html` -> `/games/ks2-lab/blockly-lesson-3-sequences/index.html`
- [ ] `blockly-lesson-4-repeat-loops.html` -> `/games/ks2-lab/blockly-lesson-4-repeat-loops/index.html`
- [ ] `blockly-lesson-5-variables.html` -> `/games/ks2-lab/blockly-lesson-5-variables/index.html`
- [ ] `blockly-lesson-6-logic.html` -> `/games/ks2-lab/blockly-lesson-6-logic/index.html`
- [ ] `blockly-lesson-7-counting-loops.html` -> `/games/ks2-lab/blockly-lesson-7-counting-loops/index.html`
- [ ] `blockly-lesson-8-text-joining.html` -> `/games/ks2-lab/blockly-lesson-8-text-joining/index.html`
- [ ] `blockly-lesson-9-functions.html` -> `/games/ks2-lab/blockly-lesson-9-functions/index.html`

---

## KS2 Technology — High Tier (3D model — check Three.js/model asset deps before starting)

- [ ] `3d-model-first-principle.html` -> `/games/ks2-lab/3d-model-first-principle/index.html`
- [ ] `3d-model-step-2-planes.html` -> `/games/ks2-lab/3d-model-step-2-planes/index.html`
- [ ] `3d-model-step-3-extrude.html` -> `/games/ks2-lab/3d-model-step-3-extrude/index.html`
- [ ] `3d-model-step-4-add-subtract.html` -> `/games/ks2-lab/3d-model-step-4-add-subtract/index.html`
- [ ] `3d-model-step-5-transform.html` -> `/games/ks2-lab/3d-model-step-5-transform/index.html`
- [ ] `3d-model-step-6-symmetry.html` -> `/games/ks2-lab/3d-model-step-6-symmetry/index.html`
- [ ] `3d-model-step-7-edges.html` -> `/games/ks2-lab/3d-model-step-7-edges/index.html`
- [ ] `3d-model-step-8-components.html` -> `/games/ks2-lab/3d-model-step-8-components/index.html`
- [ ] `3d-model-step-9-dimensions.html` -> `/games/ks2-lab/3d-model-step-9-dimensions/index.html`
- [ ] `3d-model-step-10-capstone.html` -> `/games/ks2-lab/3d-model-step-10-capstone/index.html`

---

## React/Data Lessons — Review Later

Not HTML games — skip until scope expands:

- [ ] `src/data/lessons/year3Lessons.js`
- [ ] `src/data/lessons/year4Lessons.js`
- [ ] `src/data/lessons/year5Lessons.js`
- [ ] `src/data/lessons/year6Lessons.js`
- [ ] `src/data/lessons/year7Lessons.js`
