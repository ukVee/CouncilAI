import { formatLatency } from "@/lib/utils";

const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";

export interface OllamaGenerateOptions {
  model?: string;
  stream?: boolean;
  options?: Record<string, unknown>;
}

export interface OllamaGenerateResponse {
  model: string;
  output: string;
  latency: number;
}

export async function generateWithOllama(
  prompt: string,
  options: OllamaGenerateOptions = {}
): Promise<OllamaGenerateResponse> {
  const start = Date.now();
  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: options.model ?? "llama3",
      prompt,
      stream: false,
      options: options.options
    })
  });

  if (!response.ok) {
    const error = await safeJson(response);
    throw new Error(
      `Ollama generate failed (${response.status}): ${JSON.stringify(error)}`
    );
  }

  const payload = await response.json();
  const latency = Date.now() - start;
  return {
    model: payload.model,
    output: payload.response ?? payload.output ?? "",
    latency
  };
}

export interface OllamaEmbeddingResponse {
  embedding: number[];
  model: string;
  latency: number;
}

export async function createEmbedding(
  input: string,
  model = "nomic-embed-text"
): Promise<OllamaEmbeddingResponse> {
  const start = Date.now();
  const response = await fetch(`${OLLAMA_URL}/api/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      prompt: input
    })
  });

  if (!response.ok) {
    const error = await safeJson(response);
    throw new Error(
      `Ollama embedding failed (${response.status}): ${JSON.stringify(error)}`
    );
  }

  const payload = await response.json();
  const latency = Date.now() - start;
  return {
    embedding: payload.embedding,
    model: payload.model ?? model,
    latency
  };
}

export async function checkOllamaHealth() {
  const start = Date.now();
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`, {
      method: "GET"
    });
    if (!response.ok) {
      return {
        status: "offline" as const,
        latency: null,
        error: `status ${response.status}`
      };
    }
    await response.json();
    return {
      status: "online" as const,
      latency: Date.now() - start,
      formattedLatency: formatLatency(Date.now() - start)
    };
  } catch (error) {
    return {
      status: "offline" as const,
      latency: null,
      error: (error as Error).message
    };
  }
}

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch (error) {
    return { message: (error as Error).message };
  }
}
