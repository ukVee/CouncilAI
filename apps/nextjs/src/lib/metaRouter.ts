import { checkOllamaHealth, generateWithOllama } from "@/lib/ollamaClient";
import { checkQdrantHealth } from "@/lib/qdrantClient";
import { pingRedis } from "@/lib/redisClient";
import { formatLatency } from "@/lib/utils";

export interface CouncilMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CouncilRequestBody {
  messages: CouncilMessage[];
  context?: string;
}

export interface RoutingDecision {
  route: "local" | "cloud";
  model: string;
  reason: string;
}

const DEFAULT_LOCAL_MODEL = process.env.OLLAMA_MODEL ?? "llama3";
const DEFAULT_CLOUD_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

const COMPLEXITY_KEYWORDS = [
  "strategy",
  "analysis",
  "research",
  "code",
  "deploy",
  "diagram",
  "threat",
  "architecture"
];

export function decideRoute(body: CouncilRequestBody): RoutingDecision {
  const text = [
    body.context ?? "",
    ...body.messages.map((message) => message.content.toLowerCase())
  ].join(" ");

  const containsComplexity = COMPLEXITY_KEYWORDS.some((keyword) =>
    text.includes(keyword)
  );

  if (containsComplexity && process.env.OPENAI_API_KEY) {
    return {
      route: "cloud",
      model: DEFAULT_CLOUD_MODEL,
      reason: "Context indicates complex reasoning; cloud model selected"
    };
  }

  return {
    route: "local",
    model: DEFAULT_LOCAL_MODEL,
    reason: "Defaulting to local inference"
  };
}

export async function callLocalModel(prompt: string, model?: string) {
  return generateWithOllama(prompt, { model });
}

export async function callCloudModel(
  prompt: string,
  model = DEFAULT_CLOUD_MODEL
) {
  const start = Date.now();
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: "You are Athena, a precise system router." },
        { role: "user", content: prompt }
      ]
    })
  });

  if (!response.ok) {
    const error = await safeJson(response);
    throw new Error(`OpenAI call failed: ${response.status} ${JSON.stringify(error)}`);
  }

  const payload = await response.json();
  const choice = payload.choices?.[0]?.message?.content ?? "";
  const latency = Date.now() - start;
  return {
    model,
    output: choice,
    latency
  };
}

export async function getServiceHealth() {
  const [ollama, qdrant, redis] = await Promise.all([
    checkOllamaHealth(),
    checkQdrantHealth(),
    pingRedis()
  ]);

  const cloud = {
    openai: Boolean(process.env.OPENAI_API_KEY),
    anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
    gemini: Boolean(process.env.GEMINI_API_KEY)
  };

  const serviceLatencyHistory = [
    {
      name: "ollama",
      latency: ollama.latency ?? null
    },
    {
      name: "qdrant",
      latency: qdrant.latency ?? null
    },
    {
      name: "redis",
      latency: redis.latency ?? null
    }
  ];

  const uptimeSeconds = process.uptime();
  const uptime = formatDuration(uptimeSeconds);

  return {
    services: {
      ollama: normalizeStatus(ollama),
      qdrant: normalizeStatus(qdrant),
      redis: normalizeStatus(redis),
      cloud
    },
    uptime,
    version: process.env.APP_VERSION ?? "v1.0.0",
    latencyHistory: serviceLatencyHistory
  };
}

function normalizeStatus(status: {
  status: "online" | "offline";
  latency: number | null | undefined;
  error?: string;
}) {
  return {
    status: status.status,
    latency: status.latency ?? null,
    formattedLatency: status.latency ? formatLatency(status.latency) : null,
    error: status.error ?? null
  };
}

function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const parts = [] as string[];
  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }
  parts.push(`${seconds}s`);
  return parts.join(" ");
}

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch (error) {
    return { message: (error as Error).message };
  }
}
