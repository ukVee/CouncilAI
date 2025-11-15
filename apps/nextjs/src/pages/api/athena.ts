 import type { NextApiRequest, NextApiResponse } from 'next';
 import { decideRoute } from '../../lib/athena';
 import { generateCompletion } from '../../services/ollama';

 // Cloud model invocation helper
 async function callCloudModel(prompt: string): Promise<string> {
   const apiKey = process.env.CLOUD_API_KEY;
   const apiUrl = process.env.CLOUD_API_BASE || 'https://api.openai.com/v1/chat/completions';
   const model = process.env.CLOUD_MODEL || 'gpt-3.5-turbo';
   if (!apiKey) {
     throw new Error('No cloud API key configured');
   }
   const response = await fetch(apiUrl, {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': `Bearer ${apiKey}`
     },
     body: JSON.stringify({
       model,
       messages: [{ role: 'user', content: prompt }],
       stream: false
     })
   });
   if (!response.ok) {
     const text = await response.text();
     throw new Error(`Cloud API error: ${response.status} ${text}`);
   }
   const data = await response.json();
   const content = data.choices?.[0]?.message?.content || '';
   return content;
 }

 export default async function handler(req: NextApiRequest, res: NextApiResponse) {
   if (req.method !== 'POST') {
     return res.status(405).json({ error: 'Method not allowed' });
   }
   try {
     const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
     const { prompt } = body;
     if (!prompt || typeof prompt !== 'string') {
       return res.status(400).json({ error: 'Invalid prompt' });
     }
     const route = await decideRoute(prompt);
     let responseContent: string;
     if (route === 'local') {
       responseContent = await generateCompletion(prompt, false);
     } else {
       responseContent = await callCloudModel(prompt);
     }
     return res.status(200).json({ response: responseContent, route });
   } catch (err: any) {
     console.error(err);
     return res.status(500).json({ error: err.message || 'Internal Server Error' });
   }
 }