// import type { NextApiRequest, NextApiResponse } from "next";
// import { callGemini } from "../../lib/gemini";

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method !== "POST") {
//     return res.status(200).send("Gemini test endpoint: send POST { prompt }");
//   }

//   try {
//     const { prompt } = JSON.parse(req.body || "{}");

//     if (!prompt) return res.status(400).json({ error: "Missing prompt" });

//     const output = await callGemini({ prompt });

//     res.status(200).json({ output });
//   } catch (err: any) {
//     res.status(500).json({ error: err.message });
//   }
// }

import type { NextApiRequest, NextApiResponse } from "next";
import { callGemini } from "../../lib/gemini";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(200).send("Gemini test endpoint: send POST { prompt }");
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { prompt } = body || {};

    if (!prompt) {
      return res.status(400).json({ error: "Missing prompt" });
    }

    const output = await callGemini({ prompt });

    res.status(200).json({ output });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

