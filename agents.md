# AI Agents & Features

Talab LMS has two AI-powered features built into the student experience: a lesson assistant chatbot and a text-to-speech reader. This document explains how each works, how to configure them, and how to extend them.

---

## 1. Lesson Assistant (Gemini)

A chat sidebar that appears on every lesson page. Students can ask questions about the lesson content and get AI-generated answers grounded in what they're currently studying.

### How it works

```
Student types question
  → GeminiSidebar.tsx (client)
    → POST /api/gemini
      → Google Gemini 2.0 Flash API
        → Response streamed back to sidebar
```

The API route (`src/app/api/gemini/route.ts`) builds a system prompt that includes:
- The lesson title
- The full lesson `content_body` as context (HTML stripped before display, passed raw to Gemini)

The model is instructed to keep answers to 2–4 paragraphs and stay relevant to the curriculum.

### Configuration

Set your Gemini API key in `.env.local`:
```
GEMINI_API_KEY=your-key-from-google-ai-studio
```

Get a key at [aistudio.google.com](https://aistudio.google.com). The free tier is sufficient for low-to-medium traffic.

### Changing the model

In `src/app/api/gemini/route.ts`, the model is set in the fetch URL:
```ts
`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-latest:generateContent?key=${apiKey}`
```

Swap `gemini-2.0-flash-latest` for another model (e.g. `gemini-1.5-pro`) if you need stronger reasoning.

### Changing the system prompt

Edit the `systemPrompt` string in `src/app/api/gemini/route.ts`. The current prompt:
- Identifies itself as a Talab LMS learning assistant
- Injects the lesson title and content for grounding
- Asks for concise, encouraging, curriculum-relevant answers

### Tuning generation

In the same route, adjust `generationConfig`:
```ts
generationConfig: {
  temperature: 0.7,      // 0 = deterministic, 1 = more creative
  maxOutputTokens: 1024, // max response length
}
```

### Context for interactive lessons

Interactive lessons (`lesson_type = "interactive"`) load content from a JSON file, not `content_body`. The lesson page currently passes `lesson.content_body` to `GeminiSidebar` as context. For interactive lessons this will be `null`, so the assistant won't have lesson context. To fix this, pass the fetched JSON as a string instead — see `src/app/lessons/[lessonId]/page.tsx` line 98.

### Security

The `/api/gemini` route checks `supabase.auth.getUser()` before calling the API — unauthenticated requests are rejected with 401. The API key is server-side only and never exposed to the browser.

---

## 2. Text-to-Speech (TTS)

A "Read to me" button that reads lesson content aloud using the browser's built-in speech synthesis engine. No external API, no cost, works offline.

### How it works

`src/components/TTSButton.tsx` uses the browser's `SpeechSynthesisUtterance` API directly. Text is split into sentence-sized chunks (max 220 characters) to avoid synthesis cut-offs on mobile browsers. Each chunk is queued as a separate utterance and played in sequence.

### Where it appears

- **Content/Video lessons:** A large `TTSButton` renders above the lesson HTML. The button strips HTML tags before passing text to the synthesiser.
- **Interactive lessons:** Not currently added — the block-based format reads naturally, and nursery children are guided by emoji + large tap targets.

### Adding TTS to a new component

```tsx
import TTSButton from "@/components/TTSButton";

// Small icon button (default)
<TTSButton text="The text to read aloud" />

// Large labelled button
<TTSButton text="The text to read aloud" size="lg" label="Listen" />
```

### Voice selection

The current implementation uses whatever default voice the browser/OS provides. To let users pick a voice, you can extend `TTSButton.tsx` using `window.speechSynthesis.getVoices()`.

### Known limitations

- **Android Chrome** can silently fail on the first speech request after page load. The component works around this by cancelling any stale synthesis before starting.
- **Voice quality** varies by device and OS — iOS voices are generally better than Android defaults.
- No server-side TTS (e.g. ElevenLabs, Google Cloud TTS) is currently integrated. If voice quality becomes a priority, replace the `play` function in `TTSButton.tsx` with a fetch to a TTS API and play the returned audio blob.

---

## Adding a new AI feature

If you want to add another AI capability (e.g. auto-generating quiz questions, personalised hints, progress summaries):

1. Create a new route in `src/app/api/` that calls your AI provider.
2. Always verify `supabase.auth.getUser()` at the top of the route.
3. Keep the API key server-side — never pass it to client components.
4. For Gemini specifically, reuse the same fetch pattern in `src/app/api/gemini/route.ts`.
5. For Claude/Anthropic, install `@anthropic-ai/sdk` and use the `claude-sonnet-4-6` model — it's what powers this project's development workflow.
