 # CouncilAI · ForgeAthena Architecture

 CouncilAI is a **modular hybrid AI framework** built for performance, privacy, and autonomy.  
 It allows local LLMs (via Ollama) to reason, store context, and optionally invoke cloud AIs when necessary.

 ---

 ## 🧩 System Overview

 ┌────────────────────────────────────────────────────────────┐
 │ Next.js (UI + API) │
 │ │
 │ ┌──────────────┐ ┌─────────────┐ ┌───────────┐ │
 │ │ React Front │ →→→ │ /api/council│ →→→ │ MetaRouter│ │
 │ │ Interface │ │ /api/embed │ │ (Athena) │ │
 │ └──────────────┘ └─────────────┘ └───────────┘ │
 │ ↓ ↓ ↓ │
 │ Local API calls → Ollama → Qdrant → Redis ↕ │
 │ ↕ │
 │ Cloud APIs (OpenAI, Gemini, etc.) │
 └────────────────────────────────────────────────────────────┘

 ---

 ## 🧠 Data Flow

 1. **User Input → Next.js**  
    - Requests hit `/api/council`, `/api/embed`, or `/api/memory`.

 2. **Athena Meta-Router**  
    - Determines if reasoning happens locally or in the cloud.
    - Uses heuristics (context length, token cost, complexity).

 3. **Local Reasoning Path**
    - **Ollama** handles inference and embeddings.
    - **Qdrant** stores vectors and context associations.
    - **Redis** keeps transient data for conversational continuity.

 4. **Cloud Reasoning Path**
    - Offloads complex reasoning to OpenAI, Anthropic, or Gemini endpoints.
    - Returns enhanced responses back into the local memory system.

 ---

 ## 🧩 Infrastructure Overview

 | Component | Role | Port |
 |------------|------|------|
 | `nextjs` | UI + API orchestrator | `3000` |
 | `ollama` | Local model inference | `11434` |
 | `qdrant` | Vector memory | `6333` |
 | `redis` | Cache + working memory | `6379` |

 ---

 ## 🧠 Future Modules
 - **/api/embed** — for embedding and vector memory ops.  
 - **/api/council** — unified orchestration endpoint.  
 - **/api/memory** — conversation recall + Redis integration.  
 - **Athena Router Model** — decision-making heuristic trained from logs.

 ---

 ## 🧭 Development Roadmap
 1. Implement Meta-Router routes in Next.js  
 2. Integrate Redis + Qdrant connectors  
 3. Add health check + metrics routes  
 4. Implement testing suite and CI/CD  
 5. Add cloud model routing + API key management