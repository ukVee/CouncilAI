// apps/nextjs/src/lib/athena.ts

import { listOllamaModels } from "./ollama";
import { listGeminiModels } from "./gemini";

export type AthenaRoute = "local" | "cloud" | "embed";

export interface AthenaDecision {
  route: AthenaRoute;
  model: string;
  reason: string;
  temperature?: number;
  maxTokens?: number;
}

export async function decideRoute(prompt: string): Promise<AthenaDecision> {
  // Pull environment state
  const ollamaModels = await listOllamaModels();
  const geminiModels = await listGeminiModels();

  console.log("Athena sees local models:", ollamaModels);
  console.log("Athena sees cloud models:", geminiModels);

  // --------------------------------------------
  // Basic keyword-based embedding routing
  // --------------------------------------------
  const lower = prompt.toLowerCase();
  if (
    lower.includes("embed") ||
    lower.includes("embedding") ||
    lower.includes("vector search") ||
    lower.includes("store this") ||
    lower.includes("index this") ||
    lower.includes("qdrant")
  ) {
    if (ollamaModels.includes("bge-m3:latest")) {
      return {
        route: "embed",
        model: "bge-m3:latest",
        reason: "Embedding-related request detected; using embedding model.",
        temperature: 0,
        maxTokens: 0
      };
    }
  }

  // --------------------------------------------
  // Basic length heuristic for complexity
  // --------------------------------------------
  const maxLocalChars =
    process.env.LOCAL_MAX_CHARS ?
    parseInt(process.env.LOCAL_MAX_CHARS, 10) : 2000;

  const isLong = prompt.length > maxLocalChars;

  // --------------------------------------------
  // Prefer local unless:
  //  - prompt is long
  //  - credits are available
  //  - cloud model exists
  // --------------------------------------------
  const cloudAvailable = geminiModels.includes("gemini-1.5-flash");



  if (cloudAvailable && isLong) {
    return {
      route: "cloud",
      model: "gemini-1.5-flash",
      reason: `Long prompt (${prompt.length} chars) and cloud credits available.`,
      temperature: 0.4,
      maxTokens: 2048
    };
  }

  // --------------------------------------------
  // Local routing (default, safe, cheap)
  // --------------------------------------------
  const localModel = ollamaModels.includes("deepseek-r1:7b")
    ? "deepseek-r1:7b"
    : ollamaModels[0] ?? "deepseek-r1:7b";

  return {
    route: "local",
    model: localModel,
    reason: "Defaulting to local model based on prompt size and credits.",
    temperature: 0.3,
    maxTokens: 2048
  };
}
