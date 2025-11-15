import type { NextApiRequest, NextApiResponse } from "next";
import { decideRoute } from "../../lib/athena";
import { listOllamaModels } from "../../lib/ollama";
import { listGeminiModels } from "../../lib/gemini";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const prompt = body?.prompt ?? "";

    if (!prompt.trim()) {
      return res.status(400).json({ error: "Missing prompt" });
    }

    // test model discovery
    const ollama = await listOllamaModels();
    const gemini = await listGeminiModels();

    // run current heuristic router
    const decision = await decideRoute(prompt);

    return res.status(200).json({
      ok: true,
      availableLocalModels: ollama,
      availableCloudModels: gemini,
      decision
    });
  } catch (err: any) {
    console.error("athena-test error", err);
    return res.status(500).json({ error: err.message });
  }
}
