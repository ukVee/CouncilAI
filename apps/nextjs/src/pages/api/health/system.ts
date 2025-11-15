 import type { NextApiRequest, NextApiResponse } from 'next';

 /**
  * Aggregated system health check.
  * Returns the status of Ollama, Qdrant, and Redis in one call.
  */
 export default async function handler(req: NextApiRequest, res: NextApiResponse) {
   const baseOllama = process.env.OLLAMA_API || 'http://localhost:11434';
   const baseQdrant = process.env.QDRANT_URL || 'http://localhost:6333';

   async function checkOllama() {
     try {
       const response = await fetch(`${baseOllama}/api/ps`);
       return response.ok;
     } catch {
       return false;
     }
   }
   async function checkQdrant() {
     try {
       const response = await fetch(`${baseQdrant}/collections`);
       return response.ok;
     } catch {
       return false;
     }
   }
   async function checkRedis() {
     try {
       const { getClient } = await import('../../../services/redis');
       const client = await getClient();
       const pong = await client.ping();
       return Boolean(pong);
     } catch {
       return false;
     }
   }
   const [ollamaOk, qdrantOk, redisOk] = await Promise.all([
     checkOllama(),
     checkQdrant(),
     checkRedis()
   ]);
   return res.status(200).json({
     ollama: ollamaOk ? 'ok' : 'error',
     qdrant: qdrantOk ? 'ok' : 'error',
     redis: redisOk ? 'ok' : 'error'
   });
 }