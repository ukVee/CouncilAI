 import type { NextApiRequest, NextApiResponse } from 'next';

 /**
  * Health check for the Ollama service.
  * Attempts to list running models via /api/ps.
  */
 export default async function handler(req: NextApiRequest, res: NextApiResponse) {
   const base = process.env.OLLAMA_API || 'http://localhost:11434';
   try {
     const response = await fetch(`${base}/api/ps`);
     if (response.ok) {
       return res.status(200).json({ status: 'ok' });
     }
     return res.status(500).json({ status: 'error', details: await response.text() });
   } catch (err: any) {
     return res.status(500).json({ status: 'error', details: err.message });
   }
 }