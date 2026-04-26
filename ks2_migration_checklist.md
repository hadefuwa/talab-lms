# KS2 Lab Migration Checklist

Source repo: https://github.com/hadefuwa/ks2-lab

Primary source folder for standalone game imports:
`public/html-games/`

Secondary source folder for older standalone files:
`html games/`

Status key:
- [x] Migrated into Talab
- [ ] Pending migration

Per-game checks before marking complete:
- Copy the source HTML into `public/games/ks2-lab/<slug>/index.html`.
- Copy or vendor any required assets, models, CSS, JS, or CDN dependencies.
- Verify the game loads inside Talab's `GameLesson` iframe.
- Verify the game sends a completion event Talab understands.
- Verify mobile/tablet responsiveness.
- Verify the correct Talab course: `KS2 Maths`, `KS2 English`, `KS2 History`, or `KS2 Technology`.
- Add an idempotent Supabase migration for the Talab lesson row.
- Run `npm run build`.
- Apply migrations with `npx supabase db push --linked`.

## Standalone HTML Games

- [ ] 001 - `3d-model-first-principle.html` -> `/games/ks2-lab/3d-model-first-principle/index.html` - suggested course: KS2 Technology
- [ ] 002 - `3d-model-step-10-capstone.html` -> `/games/ks2-lab/3d-model-step-10-capstone/index.html` - suggested course: KS2 Technology
- [ ] 003 - `3d-model-step-2-planes.html` -> `/games/ks2-lab/3d-model-step-2-planes/index.html` - suggested course: KS2 Technology
- [ ] 004 - `3d-model-step-3-extrude.html` -> `/games/ks2-lab/3d-model-step-3-extrude/index.html` - suggested course: KS2 Technology
- [ ] 005 - `3d-model-step-4-add-subtract.html` -> `/games/ks2-lab/3d-model-step-4-add-subtract/index.html` - suggested course: KS2 Technology
- [ ] 006 - `3d-model-step-5-transform.html` -> `/games/ks2-lab/3d-model-step-5-transform/index.html` - suggested course: KS2 Technology
- [ ] 007 - `3d-model-step-6-symmetry.html` -> `/games/ks2-lab/3d-model-step-6-symmetry/index.html` - suggested course: KS2 Technology
- [ ] 008 - `3d-model-step-7-edges.html` -> `/games/ks2-lab/3d-model-step-7-edges/index.html` - suggested course: KS2 Technology
- [ ] 009 - `3d-model-step-8-components.html` -> `/games/ks2-lab/3d-model-step-8-components/index.html` - suggested course: KS2 Technology
- [ ] 010 - `3d-model-step-9-dimensions.html` -> `/games/ks2-lab/3d-model-step-9-dimensions/index.html` - suggested course: KS2 Technology
- [ ] 011 - `ancient-china-great-wall.html` -> `/games/ks2-lab/ancient-china-great-wall/index.html` - suggested course: KS2 History
- [ ] 012 - `ancient-egypt-daily-life.html` -> `/games/ks2-lab/ancient-egypt-daily-life/index.html` - suggested course: KS2 History
- [ ] 013 - `ancient-egypt-pyramids-pharaohs.html` -> `/games/ks2-lab/ancient-egypt-pyramids-pharaohs/index.html` - suggested course: KS2 History
- [ ] 014 - `ancient-greece-daily-life.html` -> `/games/ks2-lab/ancient-greece-daily-life/index.html` - suggested course: KS2 History
- [ ] 015 - `ancient-mesopotamia.html` -> `/games/ks2-lab/ancient-mesopotamia/index.html` - suggested course: KS2 History
- [ ] 016 - `ancient-rome-daily-life.html` -> `/games/ks2-lab/ancient-rome-daily-life/index.html` - suggested course: KS2 History
- [ ] 017 - `ancient-stories.html` -> `/games/ks2-lab/ancient-stories/index.html` - suggested course: KS2 History
- [ ] 018 - `ancient-stories-full.html` -> `/games/ks2-lab/ancient-stories-full/index.html` - suggested course: KS2 History
- [ ] 019 - `ancient-stories-part1.html` -> `/games/ks2-lab/ancient-stories-part1/index.html` - suggested course: KS2 History
- [ ] 020 - `ancient-stories-part2.html` -> `/games/ks2-lab/ancient-stories-part2/index.html` - suggested course: KS2 History
- [ ] 021 - `ancient-stories-temp.html` -> `/games/ks2-lab/ancient-stories-temp/index.html` - suggested course: KS2 History
- [ ] 022 - `between-the-wars.html` -> `/games/ks2-lab/between-the-wars/index.html` - suggested course: KS2 History
- [ ] 023 - `blockly-lesson-1-hello-world.html` -> `/games/ks2-lab/blockly-lesson-1-hello-world/index.html` - suggested course: KS2 Technology
- [ ] 024 - `blockly-lesson-2-simple-math.html` -> `/games/ks2-lab/blockly-lesson-2-simple-math/index.html` - suggested course: KS2 Technology
- [ ] 025 - `blockly-lesson-3-sequences.html` -> `/games/ks2-lab/blockly-lesson-3-sequences/index.html` - suggested course: KS2 Technology
- [ ] 026 - `blockly-lesson-4-repeat-loops.html` -> `/games/ks2-lab/blockly-lesson-4-repeat-loops/index.html` - suggested course: KS2 Technology
- [ ] 027 - `blockly-lesson-5-variables.html` -> `/games/ks2-lab/blockly-lesson-5-variables/index.html` - suggested course: KS2 Technology
- [ ] 028 - `blockly-lesson-6-logic.html` -> `/games/ks2-lab/blockly-lesson-6-logic/index.html` - suggested course: KS2 Technology
- [ ] 029 - `blockly-lesson-7-counting-loops.html` -> `/games/ks2-lab/blockly-lesson-7-counting-loops/index.html` - suggested course: KS2 Technology
- [ ] 030 - `blockly-lesson-8-text-joining.html` -> `/games/ks2-lab/blockly-lesson-8-text-joining/index.html` - suggested course: KS2 Technology
- [ ] 031 - `blockly-lesson-9-functions.html` -> `/games/ks2-lab/blockly-lesson-9-functions/index.html` - suggested course: KS2 Technology
- [ ] 032 - `comparing-civilizations.html` -> `/games/ks2-lab/comparing-civilizations/index.html` - suggested course: KS2 History
- [ ] 033 - `current.html` -> `/games/ks2-lab/current/index.html` - suggested course: KS2 Technology
- [ ] 034 - `days.html` -> `/games/ks2-lab/days/index.html` - suggested course: KS2 Maths
- [ ] 035 - `dinosaur-sorting.html` -> `/games/ks2-lab/dinosaur-sorting/index.html` - suggested course: KS2 History
- [ ] 036 - `dinosaurs-when-they-lived.html` -> `/games/ks2-lab/dinosaurs-when-they-lived/index.html` - suggested course: KS2 History
- [ ] 037 - `fall-of-rome.html` -> `/games/ks2-lab/fall-of-rome/index.html` - suggested course: KS2 History
- [ ] 038 - `famous-people-from-history.html` -> `/games/ks2-lab/famous-people-from-history/index.html` - suggested course: KS2 History
- [ ] 039 - `fractions.html` -> `/games/ks2-lab/fractions/index.html` - suggested course: KS2 Maths
- [ ] 040 - `historical-sources-evidence.html` -> `/games/ks2-lab/historical-sources-evidence/index.html` - suggested course: KS2 History
- [ ] 041 - `jesus-and-early-christianity.html` -> `/games/ks2-lab/jesus-and-early-christianity/index.html` - suggested course: KS2 History
- [ ] 042 - `kings-and-prophets.html` -> `/games/ks2-lab/kings-and-prophets/index.html` - suggested course: KS2 History
- [ ] 043 - `length-height-measurement.html` -> `/games/ks2-lab/length-height-measurement/index.html` - suggested course: KS2 Maths
- [ ] 044 - `life-long-ago.html` -> `/games/ks2-lab/life-long-ago/index.html` - suggested course: KS2 History
- [ ] 045 - `life-long-ago-vs-life-now.html` -> `/games/ks2-lab/life-long-ago-vs-life-now/index.html` - suggested course: KS2 History
- [ ] 046 - `medieval-daily-life.html` -> `/games/ks2-lab/medieval-daily-life/index.html` - suggested course: KS2 History
- [ ] 047 - `modern-world-1960s-1990s.html` -> `/games/ks2-lab/modern-world-1960s-1990s/index.html` - suggested course: KS2 History
- [ ] 048 - `modern-world-2000s-today.html` -> `/games/ks2-lab/modern-world-2000s-today/index.html` - suggested course: KS2 History
- [ ] 049 - `noahs-ark.html` -> `/games/ks2-lab/noahs-ark/index.html` - suggested course: KS2 History
- [ ] 050 - `place_value_100.html` -> `/games/ks2-lab/place-value-100/index.html` - suggested course: KS2 Maths
- [ ] 051 - `prehistoric-times.html` -> `/games/ks2-lab/prehistoric-times/index.html` - suggested course: KS2 History
- [ ] 052 - `resistor.html` -> `/games/ks2-lab/resistor/index.html` - suggested course: KS2 Technology
- [ ] 053 - `the-crusades.html` -> `/games/ks2-lab/the-crusades/index.html` - suggested course: KS2 History
- [ ] 054 - `the-reformation.html` -> `/games/ks2-lab/the-reformation/index.html` - suggested course: KS2 History
- [ ] 055 - `voltage.html` -> `/games/ks2-lab/voltage/index.html` - suggested course: KS2 Technology
- [ ] 056 - `world-war-i.html` -> `/games/ks2-lab/world-war-i/index.html` - suggested course: KS2 History

## React/Data Lessons To Review Later

These are not direct static-game imports. Review separately if the goal expands beyond HTML games:

- [ ] `src/data/lessons/year3Lessons.js`
- [ ] `src/data/lessons/year4Lessons.js`
- [ ] `src/data/lessons/year5Lessons.js`
- [ ] `src/data/lessons/year6Lessons.js`
- [ ] `src/data/lessons/year7Lessons.js`
