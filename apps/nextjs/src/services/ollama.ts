 const OLLAMA_API = process.env.OLLAMA_API || 'http://localhost:11434';

 /**
  * Request an embedding from Ollama.
  * Returns the first embedding vector from the response.
  */
 export async function getOllamaEmbedding(text: string): Promise<number[]> {
   const model = process.env.EMBEDDING_MODEL || 'all-minilm';
   const response = await fetch(`${OLLAMA_API}/api/embed`, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ model, input: text })
   });
   if (!response.ok) {
     const error = await response.text();
     throw new Error(`Ollama embed error: ${response.status} ${error}`);
   }
   const data = await response.json();
   if (data.embeddings && Array.isArray(data.embeddings) && data.embeddings.length > 0) {
     return data.embeddings[0] as number[];
   }
   if (data.embedding && Array.isArray(data.embedding)) {
     return data.embedding as number[];
   }
   throw new Error('No embedding in response');
 }

 /**
  * Generate a completion using Ollama.
  * If `stream` is false, returns the full response as a string.
  * If `stream` is true, returns the ReadableStream for caller to handle.
  */
 export async function generateCompletion(prompt: string, stream = false, options?: { model?: string }): Promise<any> {
   const model = options?.model || process.env.LOCAL_MODEL || 'mistral';
   const response = await fetch(`${OLLAMA_API}/api/generate`, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ model, prompt, stream })
   });
   if (!stream) {
     if (!response.ok) {
       const text = await response.text();
       throw new Error(`Ollama generate error: ${response.status} ${text}`);
     }
     const data = await response.json();
     return data.response || '';
   }
   return response.body;
 }