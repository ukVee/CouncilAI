
# ForgeAthena Stack Details

This document breaks down the technology stack powering CouncilAI.

---

## 🧩 Application Layer

### **Next.js**
- TypeScript React frontend + API backend.
- Handles orchestration, user interactions, and communication with all subsystems.
- API routes: `/api/council`, `/api/embed`, `/api/memory`.

**Key Dependencies**
- `next`
- `react`
- `typescript`
- `eslint`
- `postcss`

---

## 🧠 Reasoning Layer

### **Ollama**
- Local inference engine for LLMs (supports GGUF models).
- Handles reasoning, summarization, and embedding generation.
- Runs via Docker at `http://ollama:11434`.

**Persistent storage:**  
`services/ollama:/root/.ollama/`

---

### **Qdrant**
- Vector memory database.
- Stores embeddings for retrieval and long-term recall.
- Communicates via REST and gRPC on port `6333`.

**Volume:**  
`services/qdrant/data:/qdrant/storage`

---

### **Redis**
- Handles temporary session storage and state caching.
- Manages task queues and short-term memory context.
- Lightweight and fast (port `6379`).

---

## ☁️ Cloud Integration Layer

### **Cloud APIs**
Optional cognitive extensions via:
- OpenAI (GPT series)
- Anthropic (Claude)
- Gemini (Google)

Used selectively by the **Athena Meta-Router** when:
- Local models lack capacity or reasoning context.
- A long-context or multimodal query requires scaling up.

---

## 🧭 Meta-Router (Athena)
- Core decision engine.
- Determines routing strategy based on:
  - Input complexity
  - Token length
  - Available compute
  - Latency & resource budget
- Will later integrate a small heuristic model to self-tune routing preferences.

---

## 🐳 Infrastructure

### Docker Compose
Located in `infra/docker-compose.yml`

**Services:**
| Name | Role | Ports |
|------|------|-------|
| `nextjs` | Frontend + API | 3000 |
| `ollama` | Local inference | 11434 |
| `qdrant` | Vector DB | 6333 |
| `redis` | Cache | 6379 |

**Env File (`.env`):**
```env
NODE_ENV=development
QDRANT_URL=http://localhost:6333
REDIS_URL=redis://localhost:6379
OLLAMA_API=http://localhost:11434
CLOUD_API_KEY=replace_with_your_key

🧩 Development Notes

    Current focus: backend routes + Meta-Router integration.

    Future: extend the stack with Codex-managed PR automation and local agent collaboration.

    Long-term: fine-tune Athena’s routing heuristics on real logs.
