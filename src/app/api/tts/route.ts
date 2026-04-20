import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const SAMPLE_RATE = 24000;
const CHANNELS = 1;
const BITS_PER_SAMPLE = 16;
const MAX_TEXT_LENGTH = 1200;

function wavFromPcm(pcm: Buffer) {
  const header = Buffer.alloc(44);
  const byteRate = SAMPLE_RATE * CHANNELS * (BITS_PER_SAMPLE / 8);
  const blockAlign = CHANNELS * (BITS_PER_SAMPLE / 8);

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(CHANNELS, 22);
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(BITS_PER_SAMPLE, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);

  return Buffer.concat([header, pcm]);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { text } = await request.json().catch(() => ({ text: "" }));
  const cleanText = typeof text === "string" ? text.replace(/\s+/g, " ").trim() : "";

  if (!cleanText) {
    return NextResponse.json({ error: "Missing text" }, { status: 400 });
  }

  if (cleanText.length > MAX_TEXT_LENGTH) {
    return NextResponse.json({ error: `Text is too long. Max ${MAX_TEXT_LENGTH} characters.` }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Gemini API not configured" }, { status: 503 });
  }

  const model = process.env.GEMINI_TTS_MODEL ?? "gemini-3.1-flash-tts-preview";
  const voiceName = process.env.GEMINI_TTS_VOICE ?? "Kore";

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: `Read this clearly at a calm teaching pace:\n\n${cleanText}` }],
          },
        ],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            languageCode: "en-US",
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    return NextResponse.json({ error: `Gemini TTS error: ${err}` }, { status: 502 });
  }

  const result = await response.json();
  const inlineData = result.candidates?.[0]?.content?.parts?.find(
    (part: { inlineData?: { data?: string } }) => part.inlineData?.data
  )?.inlineData;

  if (!inlineData?.data) {
    return NextResponse.json({ error: "No audio returned from Gemini TTS" }, { status: 502 });
  }

  const pcm = Buffer.from(inlineData.data, "base64");
  const wav = wavFromPcm(pcm);

  return new Response(wav, {
    headers: {
      "Content-Type": "audio/wav",
      "Cache-Control": "private, max-age=86400",
    },
  });
}
