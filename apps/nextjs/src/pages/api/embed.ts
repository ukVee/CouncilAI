 import type { NextApiRequest, NextApiResponse } from 'next';
 import { getOllamaEmbedding } from '../../services/ollama';
 import { upsertVector } from '../../services/qdrant';

 export default async function handler(req: NextApiRequest, res: NextApiResponse) {
   if (req.method !== 'POST') {
     return res.status(405).json({ error: 'Method not allowed' });
   }
   try {
     const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
     const { text } = body;
     if (!text || typeof text !== 'string') {
       return res.status(400).json({ error: 'Invalid input' });
     }
     const vector = await getOllamaEmbedding(text);
     const id = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
     await upsertVector('council-memory', id, vector, { text });
     return res.status(200).json({ id, vector, text });
   } catch (err: any) {
     console.error(err);
     return res.status(500).json({ error: err.message || 'Internal Server Error' });
   }
 }