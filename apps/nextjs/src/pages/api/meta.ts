import type { NextApiRequest, NextApiResponse } from "next";
import { getServiceHealth } from "@/lib/metaRouter";

export interface MetaResponse {
  services: {
    ollama: ServiceStatus;
    qdrant: ServiceStatus;
    redis: ServiceStatus;
    cloud: {
      openai: boolean;
      anthropic: boolean;
      gemini: boolean;
    };
  };
  uptime: string;
  version: string;
  latencyHistory: Array<{ name: string; latency: number | null }>;
}

interface ServiceStatus {
  status: "online" | "offline";
  latency: number | null;
  formattedLatency: string | null;
  error: string | null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MetaResponse | { error: string }>
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const meta = await getServiceHealth();
    return res.status(200).json(meta);
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
}
