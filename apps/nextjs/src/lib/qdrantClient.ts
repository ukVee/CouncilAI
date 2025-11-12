const QDRANT_URL = process.env.QDRANT_URL ?? "http://localhost:6333";
const COLLECTION_NAME = process.env.QDRANT_COLLECTION ?? "athena-memory";

interface QdrantVectorPayload {
  id: string;
  vector: number[];
  metadata?: Record<string, unknown>;
}

export interface QdrantPoint {
  id: string;
  payload?: Record<string, unknown>;
  vector?: number[];
  score?: number;
}

export async function ensureCollection() {
  const response = await fetch(`${QDRANT_URL}/collections/${COLLECTION_NAME}`);
  if (response.status === 404) {
    const createResponse = await fetch(`${QDRANT_URL}/collections/${COLLECTION_NAME}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        vectors: {
          size: 1536,
          distance: "Cosine"
        }
      })
    });
    if (!createResponse.ok) {
      const error = await safeJson(createResponse);
      throw new Error(
        `Failed to create Qdrant collection: ${createResponse.status} ${JSON.stringify(error)}`
      );
    }
  }
}

export async function upsertVector(point: QdrantVectorPayload) {
  await ensureCollection();
  const response = await fetch(
    `${QDRANT_URL}/collections/${COLLECTION_NAME}/points?wait=true`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        points: [
          {
            id: point.id,
            vector: point.vector,
            payload: point.metadata ?? {}
          }
        ]
      })
    }
  );

  if (!response.ok) {
    const error = await safeJson(response);
    throw new Error(
      `Failed to upsert vector: ${response.status} ${JSON.stringify(error)}`
    );
  }

  return {
    id: point.id,
    metadata: point.metadata ?? {}
  };
}

export async function queryVector(
  vector: number[],
  limit = 5
): Promise<QdrantPoint[]> {
  await ensureCollection();
  const response = await fetch(
    `${QDRANT_URL}/collections/${COLLECTION_NAME}/points/search`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        vector,
        limit,
        with_payload: true
      })
    }
  );

  if (!response.ok) {
    const error = await safeJson(response);
    throw new Error(
      `Failed to query vector: ${response.status} ${JSON.stringify(error)}`
    );
  }

  const payload = await response.json();
  return payload.result ?? [];
}

export async function checkQdrantHealth() {
  const start = Date.now();
  try {
    const response = await fetch(`${QDRANT_URL}/healthz`);
    if (!response.ok) {
      return {
        status: "offline" as const,
        latency: null,
        error: `status ${response.status}`
      };
    }
    await response.json();
    return {
      status: "online" as const,
      latency: Date.now() - start
    };
  } catch (error) {
    return {
      status: "offline" as const,
      latency: null,
      error: (error as Error).message
    };
  }
}

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch (error) {
    return { message: (error as Error).message };
  }
}
