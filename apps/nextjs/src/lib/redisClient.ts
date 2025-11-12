import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

let client: Redis | null = null;

function getClient(): Redis {
  if (!client) {
    client = new Redis(REDIS_URL, {
      lazyConnect: true,
      connectTimeout: 500,
      maxRetriesPerRequest: 0
    });
  }
  return client;
}

export async function pingRedis() {
  const redis = getClient();
  const start = Date.now();
  try {
    await redis.connect();
  } catch (error) {
    return {
      status: "offline" as const,
      latency: null,
      error: (error as Error).message
    };
  }

  try {
    const pong = await redis.ping();
    const latency = Date.now() - start;
    return {
      status: pong === "PONG" ? ("online" as const) : ("offline" as const),
      latency
    };
  } catch (error) {
    return {
      status: "offline" as const,
      latency: null,
      error: (error as Error).message
    };
  }
}

export async function getCache(key: string) {
  const redis = getClient();
  await redis.connect();
  return redis.get(key);
}

export async function setCache(key: string, value: string, ttlSeconds = 300) {
  const redis = getClient();
  await redis.connect();
  await redis.set(key, value, "EX", ttlSeconds);
}
