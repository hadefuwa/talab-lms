# Nursery Lab Migration Checklist

Source repo: https://github.com/hadefuwa/nursery-lab

Live app: https://hadefuwa.github.io/nursery-lab/#/

Architecture reviewed:
- React + Vite PWA
- HashRouter routes in `src/App.jsx`
- Game metadata in `src/config/games.js`
- Game components in `src/components/games/`
- Progress stored locally through `src/context/ProgressContext.jsx`
- One standalone static file at `numbers.html`

Status key:
- [x] Migrated into Talab
- [ ] Pending migration

Per-activity checks before marking complete:
- Decide whether to migrate as Talab `interactive` JSON or Talab `game`.
- Prefer `interactive` for simple toddler tap/listen flows.
- Use `game` only when the React component is too complex to recreate quickly.
- Remove dependency on Nursery Lab `localStorage` progress.
- Make TTS autoplay or repeat where useful for 3-year-olds.
- Use large tap targets and avoid required reading.
- Do not use `fill_blank` for nursery.
- Avoid physical keyboard input unless it is explicitly the purpose of the activity.
- Verify completion saves Talab progress.
- Run `npm run build`.
- Apply any DB migrations with `npx supabase db push --linked`.

## Standalone HTML

- [ ] 001 - `numbers.html` - Synced Mega Count - suggested Talab type: `interactive` or `game` - suggested course: Nursery Maths

## Core Number And Maths Activities

- [ ] 002 - `count-aloud` / `CountAloud.jsx` - Count Aloud - route `/lesson/count-aloud` - suggested type: `interactive` - course: Nursery Maths
- [ ] 003 - `object-count` / `ObjectCount.jsx` - Count Objects - route `/lesson/count-objects` - suggested type: `interactive` - course: Nursery Maths
- [ ] 004 - `math-game` / `MathGame.jsx` - Add & Sub - route `/lesson/math` - suggested type: `interactive` - course: Nursery Maths
- [ ] 005 - `symbol-recog` / `SymbolRecognition.jsx` - Number Hunt - route `/lesson/symbols` - suggested type: `interactive` - course: Nursery Maths
- [ ] 006 - `number-hard` / `NumberHard.jsx` - Number Pro - route `/lesson/number-hard` - suggested type: `interactive` or `game` - course: Nursery Maths
- [ ] 007 - `pacman-number` / `PacmanNumber.jsx` - Pacman Numbers - route `/lesson/pacman-number` - suggested type: `game` - course: Nursery Maths

## Fine Motor And Creative Activities

- [ ] 008 - `clicking-game` / `ClickingGame.jsx` - Clicking - route `/lesson/clicking` - suggested type: `game` - course: Nursery Technology
- [ ] 009 - `bubble-pop` / `BubblePop.jsx` - Bubble Pop - route `/lesson/bubble-pop` - suggested type: `game` - course: Nursery Technology
- [ ] 010 - `drawing-game` / `DrawingGame.jsx` - Drawing - route `/lesson/drawing` - suggested type: `game` or custom Talab component - course: Nursery Technology

## Sorting, Shapes, Colors, Logic

- [ ] 011 - `sorting-game` / `SortingGame.jsx` - Sorting - route `/lesson/sorting` - suggested type: `interactive` - course: Nursery Maths
- [ ] 012 - `shape-hunt` / `ShapeHunt.jsx` - Shape Hunt - route `/lesson/shape-hunt` - suggested type: `interactive` - course: Nursery Maths
- [ ] 013 - `color-hunt` / `ColorHunt.jsx` - Color Hunt - route `/lesson/color-hunt` - suggested type: `interactive` - course: Nursery Maths
- [ ] 014 - `pattern-repeat` / `PatternRepeat.jsx` - Pattern Repeat - route `/lesson/pattern-repeat` - suggested type: `interactive` - course: Nursery Maths
- [ ] 015 - `size-sorting` / `SizeSorting.jsx` - Size Sorting - route `/lesson/size-sorting` - suggested type: `interactive` - course: Nursery Maths
- [ ] 016 - `memory-match` / `MemoryMatch.jsx` - Memory Match - route `/lesson/memory-match` - suggested type: `game` - course: Nursery Maths

## Alphabet, Phonics, Early English

- [ ] 017 - `alphabet-game` / `AlphabetGame.jsx` - Alphabet - route `/lesson/alphabet` - suggested type: `interactive` - course: Nursery English
- [ ] 018 - `alphabet-hard` / `AlphabetHard.jsx` - Lowercase Challenge - route `/lesson/alphabet-hard` - suggested type: `interactive` - course: Nursery English
- [ ] 019 - `alphabet-abcdef` / `AlphabetABCDEF.jsx` - A-F Words - route `/lesson/alphabet-abcdef` - suggested type: `interactive` - course: Nursery English
- [ ] 020 - `alphabet-ghijkl` / `AlphabetGHijkl.jsx` - G-L Words - route `/lesson/alphabet-ghijkl` - suggested type: `interactive` - course: Nursery English
- [ ] 021 - `alphabet-mnopqr` / `AlphabetMNOPQR.jsx` - M-R Words - route `/lesson/alphabet-mnopqr` - suggested type: `interactive` - course: Nursery English
- [ ] 022 - `alphabet-stuvwxyz` / `AlphabetSTUVWXYZ.jsx` - S-Z Words - route `/lesson/alphabet-stuvwxyz` - suggested type: `interactive` - course: Nursery English
- [ ] 023 - `letter-match` / `LetterMatch.jsx` - Letter Match - route `/lesson/letter-match` - suggested type: `interactive` - course: Nursery English
- [ ] 024 - `word-start` / `WordStart.jsx` - Word Start - route `/lesson/word-start` - suggested type: `interactive` - course: Nursery English
- [ ] 025 - `letter-order` / `LetterOrder.jsx` - Letter Order - route `/lesson/letter-order` - suggested type: `interactive` - course: Nursery English
- [ ] 026 - `missing-letter` / `MissingLetter.jsx` - Missing Letter - route `/lesson/missing-letter` - suggested type: `interactive` - course: Nursery English
- [ ] 027 - `falling-letters` / `FallingLetters.jsx` - Falling Letters - route `/lesson/falling-letters` - suggested type: `game` - course: Nursery English
- [ ] 028 - `pacman-letter` / `PacmanLetter.jsx` - Pacman Letters - route `/lesson/pacman-letter` - suggested type: `game` - course: Nursery English
- [ ] 029 - `phonics` / `PhonicsGame.jsx` - Phonics Fun - route `/lesson/phonics` - suggested type: `interactive` - course: Nursery English

## Sound, Rhythm, Animals

- [ ] 030 - `animal-sounds` / `AnimalSounds.jsx` - Animal Sounds - route `/lesson/animal-sounds` - suggested type: `interactive` - course: Nursery English
- [ ] 031 - `rhythm-maker` / `RhythmMaker.jsx` - Rhythm Maker - route `/lesson/rhythm-maker` - suggested type: `game` - course: Nursery Technology

## Category Pages To Ignore Or Rebuild As Course Navigation

These are app navigation pages, not lesson content:

- [ ] Review only - `alphabet-category` / `AlphabetCategory.jsx`
- [ ] Review only - `shapes-category` / `ShapesCategory.jsx`
- [ ] Review only - `memory-category` / `MemoryCategory.jsx`
- [ ] Review only - `Home.jsx`
- [ ] Review only - `Progress.jsx`
