 import type { NextApiRequest, NextApiResponse } from 'next';

 /**
  * Health check for the Qdrant service.
  * Tries to fetch the collections list.
  */
 export default async function handler(req: NextApiRequest, res: NextApiResponse) {
   const base = process.env.QDRANT_URL || 'http://localhost:6333';
   try {
     const response = await fetch(`${base}/collections`);
     if (response.ok) {
       return res.status(200).json({ status: 'ok' });
     }
     return res.status(500).json({ status: 'error', details: await response.text() });
   } catch (err: any) {
     return res.status(500).json({ status: 'error', details: err.message });
   }
 }