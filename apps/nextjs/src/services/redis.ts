 import { createClient, RedisClientType } from 'redis';

 const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

 let client: RedisClientType | null = null;

 /**
  * Lazily create and return a Redis client.
  */
 export async function getClient(): Promise<RedisClientType> {
   if (!client) {
     client = createClient({ url: REDIS_URL });
     client.on('error', (err) => console.error('Redis Client Error', err));
     await client.connect();
   }
   return client;
 }

 /**
  * Set a key in Redis with a JSON-encoded value.
  */
 export async function setKey(key: string, value: any): Promise<void> {
   const c = await getClient();
   await c.set(key, JSON.stringify(value));
 }

 /**
  * Retrieve a key from Redis and parse JSON.
  */
 export async function getKey<T = any>(key: string): Promise<T | null> {
   const c = await getClient();
   const raw = await c.get(key);
   return raw ? (JSON.parse(raw) as T) : null;
 }

 /**
  * Delete a key from Redis.
  */
 export async function delKey(key: string): Promise<void> {
   const c = await getClient();
   await c.del(key);
 }