import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "node:crypto";
import {
  callCloudModel,
  callLocalModel,
  CouncilRequestBody,
  decideRoute
} from "@/lib/metaRouter";
import { addCouncilLogEntry, getCouncilLog } from "@/lib/requestLog";

interface CouncilResponse {
  route: "local" | "cloud";
  modelUsed: string;
  output: string;
  latency: number;
  reason: string;
}

interface CouncilLogResponse {
  entries: ReturnType<typeof getCouncilLog>;
}

function extractPrompt(messages: CouncilRequestBody["messages"]) {
  return messages
    .map((message) => `${message.role}: ${message.content}`)
    .join("\n");
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CouncilResponse | CouncilLogResponse | { error: string }>
) {
  if (req.method === "GET") {
    return res.status(200).json({ entries: getCouncilLog() });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body as CouncilRequestBody;
  if (!body?.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    return res
      .status(400)
      .json({ error: "`messages` array with at least one entry is required" });
  }

  try {
    const decision = decideRoute(body);
    const prompt = extractPrompt(body.messages);
    const result =
      decision.route === "local"
        ? await callLocalModel(prompt, decision.model)
        : await callCloudModel(prompt, decision.model);

    const payload: CouncilResponse = {
      route: decision.route,
      modelUsed: result.model,
      output: result.output,
      latency: result.latency,
      reason: decision.reason
    };

    addCouncilLogEntry({
      id: crypto.randomUUID(),
      promptPreview: body.messages.at(-1)?.content.slice(0, 120) ?? "",
      route: payload.route,
      model: payload.modelUsed,
      latency: payload.latency,
      timestamp: new Date().toISOString()
    });

    return res.status(200).json(payload);
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
}
