# 🧠 CouncilAI · ForgeAthena

A **hybrid local-first AI stack** that fuses on-device reasoning with cloud-scale cognition.  
Built around **Next.js**, **Ollama**, **Qdrant**, and **Redis**, coordinated through the **Athena Meta-Router**.

---

## 🚀 Architecture Overview

CouncilAI is composed of modular layers:

| Layer | Description |
|-------|--------------|
| **Next.js (Frontend + API)** | UI and orchestration layer handling routing and agent coordination |
| **Athena Meta-Router** | Cognitive router that decides whether to execute locally or offload to cloud models |
| **Ollama** | Local model execution and embedding generation |
| **Qdrant** | Vector memory for semantic recall |
| **Redis** | Short-term cache, task queue, and working memory |
| **Cloud Models** | Optional high-reasoning modules (OpenAI, Anthropic, Gemini) |

---

## 🧩 Quickstart

### Requirements

- Node.js 20+
- Docker & Docker Compose
- Ollama installed locally
- GPU (recommended but optional)

### Run Locally

```bash
cd infra
docker compose up --build

Access the app at:
👉 http://localhost:3000
📂 Project Structure

apps/nextjs       # Frontend + API layer
infra/            # Docker + environment configuration
services/         # Local volumes for Ollama, Qdrant, and Redis
docs/             # Architecture and technical documentation

🧭 Current Development Stage
Stage Status Description
Frontend setup ✅ Complete Next.js containerized and booting properly
Infrastructure ✅ Complete Docker Compose with Qdrant, Redis, Ollama
Meta-Router backend ⚙️ In progress Backend routes being designed
Memory systems 🧠 Pending Redis + Qdrant integration for embeddings
Testing/CI ⏳ Planned Unit tests and CI workflow to follow

🌌 Vision

ForgeAthena is designed for hybrid cognition —
an architecture where local intelligence comes first,
and cloud AI serves only as an amplifier.

The goal: build systems that think with you, not for you.
