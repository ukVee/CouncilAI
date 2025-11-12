import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "node:crypto";
import { createEmbedding } from "@/lib/ollamaClient";
import { queryVector, upsertVector } from "@/lib/qdrantClient";

interface EmbedRequest {
  text: string;
  metadata?: Record<string, unknown>;
  upsert?: boolean;
}

interface EmbedResponse {
  vectorId: string;
  metadata: Record<string, unknown>;
  timestamp: string;
  neighbors?: unknown;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<EmbedResponse | { error: string }>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body as EmbedRequest;
  if (!body?.text) {
    return res.status(400).json({ error: "`text` is required" });
  }

  try {
    const { embedding } = await createEmbedding(body.text);
    const vectorId = crypto
      .createHash("sha1")
      .update(body.text)
      .digest("hex");

    if (body.upsert ?? true) {
      await upsertVector({
        id: vectorId,
        vector: embedding,
        metadata: body.metadata
      });
    }

    const neighbors = await queryVector(embedding, 3);

    const payload = {
      vectorId,
      metadata: body.metadata ?? {},
      timestamp: new Date().toISOString(),
      neighbors
    } satisfies EmbedResponse;

    return res.status(200).json(payload);
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
}
