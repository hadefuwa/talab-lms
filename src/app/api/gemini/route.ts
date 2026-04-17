import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { message, lessonContext, lessonTitle } = await request.json();

  if (!message) {
    return NextResponse.json({ error: "Missing message" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Gemini API not configured" }, { status: 503 });
  }

  const systemPrompt = `You are a helpful learning assistant for the Talab LMS platform.
The student is currently studying: "${lessonTitle}".
Here is the lesson content for context:
---
${lessonContext || "No lesson content provided."}
---
Answer questions clearly and helpfully, keeping answers relevant to the curriculum.
Be encouraging and educational. Keep responses concise (2-4 paragraphs max).`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemPrompt}\n\nStudent question: ${message}` }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    return NextResponse.json({ error: `Gemini error: ${err}` }, { status: 502 });
  }

  const result = await response.json();
  const text =
    result.candidates?.[0]?.content?.parts?.[0]?.text ?? "No response from AI.";

  return NextResponse.json({ reply: text });
}
