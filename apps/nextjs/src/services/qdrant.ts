 const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';

 /**
  * Check if a collection exists in Qdrant.
  */
 async function collectionExists(name: string): Promise<boolean> {
   const res = await fetch(`${QDRANT_URL}/collections/${name}`);
   return res.ok;
 }

 /**
  * Create a new collection with the given vector size.
  */
 async function createCollection(name: string, vectorSize: number): Promise<void> {
   await fetch(`${QDRANT_URL}/collections/${name}`, {
     method: 'PUT',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       vectors: {
         size: vectorSize,
         distance: 'Cosine'
       }
     })
   });
 }

 /**
  * Upsert a single vector into a collection.
  */
 export async function upsertVector(collection: string, id: string | number, vector: number[], payload: any): Promise<void> {
   if (!(await collectionExists(collection))) {
     await createCollection(collection, vector.length);
   }
   const body = {
     points: [
       {
         id,
         vector,
         payload
       }
     ]
   };
   await fetch(`${QDRANT_URL}/collections/${collection}/points?wait=true`, {
     method: 'PUT',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify(body)
   });
 }

 /**
  * Perform a vector search in Qdrant.
  */
 export async function searchVector(collection: string, vector: number[], limit = 10) {
   const body = {
     vector,
     limit,
     with_payload: true,
     with_vectors: false
   };
   const res = await fetch(`${QDRANT_URL}/collections/${collection}/points/search`, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify(body)
   });
   if (!res.ok) {
     const text = await res.text();
     throw new Error(`Qdrant search error: ${res.status} ${text}`);
   }
   const data = await res.json();
   return data.result;
 }