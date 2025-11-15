import type { NextApiRequest, NextApiResponse } from "next";

export const config = {
  api: {
    bodyParser: false, // required for streaming
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  let body = "";
  req.on("data", (chunk) => (body += chunk));
  await new Promise((resolve) => req.on("end", resolve));

  const { prompt } = JSON.parse(body);

  // temp: direct → Ollama streaming
  const upstream = await fetch("http://councilai-ollama:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "deepseek-r1:7b", prompt, stream: true }),
  });

  if (!upstream.body) {
    res.status(500).end("no stream lol");
    return;
  }

  // required for SSE / chunk streaming
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");

  const reader = upstream.body.getReader();

  async function pump() {
    const { done, value } = await reader.read();
    if (done) {
      res.end();
      return;
    }
    res.write(value);
    pump();
  }

  pump();
}
