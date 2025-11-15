// apps/nextjs/src/lib/ollama.ts

export interface OllamaTag {
  name: string;
  modified_at?: string;
  size?: number;
}

export async function listOllamaModels(): Promise<string[]> {
  try {
    const resp = await fetch("http://councilai-ollama:11434/api/tags");
    if (!resp.ok) return [];
    const data = await resp.json();
    return data?.models?.map((m: OllamaTag) => m.name) ?? [];
  } catch (err) {
    console.error("Ollama model list error:", err);
    return [];
  }
}
