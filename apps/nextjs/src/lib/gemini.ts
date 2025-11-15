// apps/nextjs/src/lib/gemini.ts

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn("⚠️ GEMINI_API_KEY not set");
}

interface GeminiCallOptions {
  prompt: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export async function callGemini(opts: GeminiCallOptions): Promise<string> {
  const { prompt, temperature = 0.7, maxOutputTokens = 2048 } = opts;

  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" +
    GEMINI_API_KEY;

  const payload = {
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature,
      maxOutputTokens
    }
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const raw = await resp.text();

  if (!resp.ok) {
    throw new Error(`Gemini API error: ${resp.status} — ${raw}`);
  }

  const data = JSON.parse(raw);

  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "[No content]";
}

// ⭐ List cloud models available for routing
export async function listGeminiModels(): Promise<string[]> {
  try {
    const resp = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models?key=" + GEMINI_API_KEY
    );
    if (!resp.ok) return [];

    const data = await resp.json();
    return data?.models?.map((m: any) =>
      m.name.replace("models/", "")
    ) ?? [];
  } catch (err) {
    console.error("Gemini model list error:", err);
    return [];
  }
}
