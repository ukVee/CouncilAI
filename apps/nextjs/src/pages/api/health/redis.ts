 import type { NextApiRequest, NextApiResponse } from 'next';
 import { getClient } from '../../../services/redis';

 /**
  * Health check for the Redis service.
  * Uses ping to verify connectivity.
  */
 export default async function handler(req: NextApiRequest, res: NextApiResponse) {
   try {
     const client = await getClient();
     const pong = await client.ping();
     if (pong) {
       return res.status(200).json({ status: 'ok' });
     }
     return res.status(500).json({ status: 'error', details: 'No PONG' });
   } catch (err: any) {
     return res.status(500).json({ status: 'error', details: err.message });
   }
 }