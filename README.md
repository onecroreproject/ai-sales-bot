# 🤖 AI Sales Bot — Autonomous RAG Sales Agent & Lead Generation Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.0+-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16_pgvector-4169E1.svg?logo=postgresql&logoColor=white)](https://github.com/pgvector/pgvector)
[![OpenAI](https://img.shields.io/badge/OpenAI-gpt--4o--mini-412991.svg?logo=openai&logoColor=white)](https://openai.com)

**AI Sales Bot** is an enterprise-grade, multi-tenant autonomous AI sales and customer engagement platform. It turns casual website visitors into qualified pipeline leads 24/7 using contextual Retrieval-Augmented Generation (RAG), autonomous tool calling, recursive domain crawling, and a zero-friction embeddable widget.

---

## 📑 Table of Contents

- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Technology Stack](#-technology-stack)
- [Quick Start Guide](#-quick-start-guide)
  - [Prerequisites](#prerequisites)
  - [Option A: Docker Compose (Recommended)](#option-a-docker-compose-recommended)
  - [Option B: Local Development Setup](#option-b-local-development-setup)
- [Configuration & Environment Variables](#-configuration--environment-variables)
- [Website Embed Integration](#-website-embed-integration)
- [Platform Modules & Dashboards](#-platform-modules--dashboards)
- [API Overview](#-api-overview)
- [Project Directory Structure](#-project-directory-structure)
- [Contributing & License](#-license)

---

## 🚀 Key Features

### 1. 🕸️ Recursive Deep Domain Crawler & Vector RAG
- **Deep Web Crawling**: Crawls whole websites recursively with internal link discovery, sitemap XML parsing, and configurable page limits.
- **Multi-Format Knowledge Ingestion**: Upload and index `.pdf`, `.docx`, `.xlsx`, and `.txt` documents.
- **pgvector Semantic Search**: Real-time cosine similarity search over chunked knowledge base vectors.

### 2. 🎯 Autonomous Lead Qualification & Tool Calling
- **Native Function Calling**: The AI extracts buyer intent, budget, timeline, name, email, and phone automatically during conversation.
- **Zero Hallucination Guardrails**: Custom corporate rules, tone configuration, competitor evasion policies, and out-of-scope boundaries.
- **Real-time SMTP Alerts**: Instant email notifications dispatched to your sales team the moment high-intent leads are captured.

### 3. 📊 Interactive Executive Analytics & Lead CRM
- **Interactive Overview Dashboard**: Dynamic time-range bar charts (7d, 14d, 30d), traffic-to-lead velocity trends, and a 4-stage qualification funnel.
- **Usage & AI Quotas Command Center**: Interactive token consumption timeline (Prompt vs Completion tokens), latency metrics (TTFT < 400ms), and direct BYOK wholesale savings calculator.
- **1-Click Leads Export**: Export leads directly to Excel/CSV with UTF-8 BOM encoding for seamless CRM import.

### 4. 🎨 Embeddable AI Chat Widget Studio
- **Drop-in JavaScript Widget**: A single `<script>` tag embeds the responsive chat bot onto any website or CMS (WordPress, Shopify, Webflow, custom HTML).
- **Live Appearance Customizer**: Tune primary brand colors, positioning, avatar, bot title, welcome messages, and quick suggestion chips.
- **Authorized Domain Protection**: Enforce domain security to ensure only your authorized URLs can render the widget.

### 5. 🔑 Bring Your Own Key (BYOK) Multi-Provider Support
- Use direct provider credentials (**OpenAI**, **Anthropic**, **DeepSeek**, **Groq**, **OpenRouter**) with zero artificial platform markups.

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    subgraph Client["Client Tier"]
        W[Embeddable Widget / Website Visitors]
        SPA[React Admin Workspace Dashboard]
    end

    subgraph API["Backend API (FastAPI)"]
        GW[CORS & Security Rate Limiter]
        CS[Chat & SSE Stream Service]
        CW[Recursive Web Crawler]
        LS[Lead & Pipeline Service]
        RAG[pgvector Semantic Search]
        ES[SMTP Notification Service]
    end

    subgraph Data["Database & Models"]
        PG[(PostgreSQL 16 + pgvector)]
        LLM[OpenAI / LLM Provider via BYOK]
    end

    W -->|SSE / REST| GW
    SPA -->|JWT Auth / REST| GW
    GW --> CS
    GW --> CW
    GW --> LS
    CS --> RAG
    CS -->|Function Calling| LLM
    CW -->|Vector Embeddings| PG
    RAG -->|Similarity Search| PG
    LS -->|Save Lead| PG
    LS -->|Trigger Notification| ES
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 5, Lucide React, Modern CSS System (Light/Dark themes) |
| **Backend** | Python 3.11+, FastAPI, Pydantic v2, SlowAPI (Rate Limiting), SQLAlchemy 2.0 Async |
| **Database** | PostgreSQL 16 with `pgvector` extension |
| **AI / NLP** | OpenAI Function Calling (`gpt-4o-mini`), Text Embeddings (`text-embedding-3-small`), BYOK endpoints |
| **Parsing & Crawling** | BeautifulSoup4, PyPDF, python-docx, openpyxl, HTTPX |
| **DevOps & Containers**| Docker, Docker Compose, Uvicorn, Nginx |

---

## ⚡ Quick Start Guide

### Prerequisites
- [Git](https://git-scm.com/)
- [Docker & Docker Compose](https://www.docker.com/) (for Containerized Setup)
- *OR* [Python 3.11+](https://www.python.org/) and [Node.js 18+](https://nodejs.org/) (for Local Setup)

---

### Option A: Docker Compose (Recommended)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/onecroreproject/ai-sales-bot.git
   cd ai-sales-bot
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Open `.env` and configure your `OPENAI_API_KEY` and `JWT_SECRET_KEY`.

3. **Launch all services:**
   ```bash
   docker-compose up -d --build
   ```

4. **Access the application:**
   - **Admin Workspace:** [http://localhost:8105](http://localhost:8105)
   - **Backend API & Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Option B: Local Development Setup

#### 1. Backend Setup

```bash
cd backend

# Create and activate Python virtual environment
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp ../.env.example .env

# Run database migrations / startup
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
The frontend will be available at [http://localhost:5173](http://localhost:5173).

---

## ⚙️ Configuration & Environment Variables

Create a `.env` file in the project root with the following parameters:

```env
# Database connection string (PostgreSQL with pgvector)
DATABASE_URL=postgresql+asyncpg://postgres:postgrespassword@127.0.0.1:5432/ai_sales_bot

# OpenAI / LLM Configuration
OPENAI_API_KEY=sk-proj-your-openai-api-key-here
OPENAI_MODEL=gpt-4o-mini
OPENAI_TEMPERATURE=0.2

# JWT Authentication
JWT_SECRET_KEY=generate_a_secure_random_32_byte_secret_key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Optional SMTP Email Alerting (For Real-time Lead Dispatch)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-sales-alerts@gmail.com
SMTP_PASSWORD=your-app-password
EMAILS_FROM_NAME="AI Sales Bot Alerts"
```

---

## 🌐 Website Embed Integration

To deploy your AI Sales Bot on any website, navigate to the **Widget Studio** tab in your dashboard, copy your unique snippet, and paste it into your HTML `<head>` or before `</body>`:

```html
<!-- AI Sales Bot Embed Snippet -->
<script 
  src="http://your-domain.com/api/static/widget.js" 
  data-company-id="YOUR_COMPANY_ID_HERE"
  data-api-url="http://your-domain.com"
  defer>
</script>
```

### Supported Platforms:
* **WordPress**: Add via *Header and Footer Scripts* or your child theme's `header.php`.
* **Shopify**: Paste into `theme.liquid` before `</body>`.
* **Webflow / Framer**: Add into Custom Code section.
* **React / Next.js / Vue**: Mount script dynamically in `useEffect` or layout template.

---

## 🖥️ Platform Modules & Dashboards

| Tab / Module | Description |
|---|---|
| 📈 **Overview Dashboard** | Real-time traffic, conversion rates, visitor chart with 7d/14d/30d filter, and lead qualification funnel. |
| 👥 **Leads Pipeline** | CRM view with status stages, contact information, AI conversation transcripts, and 1-click CSV/Excel export. |
| 📚 **Knowledge Base** | Recursive domain crawler (single-page or deep crawl), file uploads (.pdf, .docx, .xlsx), and vector status. |
| 🛍️ **Products & Offers** | Catalog management for recommended services, pricing, and dynamic call-to-actions. |
| 🛡️ **Guardrails** | System instructions, brand voice, forbidden topics, and autonomous qualification guidelines. |
| 🎨 **Widget Studio** | Live widget customizer, color picker, welcome greetings, and embed code generator. |
| ⚡ **Usage & Quotas** | Interactive token velocity timeline, latency analysis, and direct BYOK wholesale savings calculation. |
| ⚙️ **Settings** | Company profile, authorized embed domains, AI provider keys, and custom endpoints. |

---

## 📡 API Overview

The backend exposes a full RESTful API with automated Swagger UI documentation available at `/docs`:

- `POST /api/auth/register` — Register new workspace tenant
- `POST /api/auth/login` — Authenticate and receive JWT token
- `POST /api/chat/stream` — Real-time Server-Sent Events (SSE) AI sales conversation
- `POST /api/knowledge/crawl` — Trigger recursive domain crawler or single page crawl
- `POST /api/knowledge/upload` — Parse and index document files into pgvector
- `GET  /api/leads` — Query captured leads with filters
- `GET  /api/dashboard/stats` — Retrieve interactive metrics, chart time-series, and funnel analytics
- `GET  /api/widget/config/{id}` — Fetch public widget styling configuration

---

## 📂 Project Directory Structure

```text
ai-sales-bot/
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI endpoint routers (auth, chat, leads, knowledge, etc.)
│   │   ├── core/            # Security, JWT, middleware, rate limiting
│   │   ├── database/        # Database models, schemas, and async connections
│   │   ├── services/        # Business logic (crawler, chat, RAG, leads, email, usage)
│   │   ├── static/          # Embeddable widget.js and client bundles
│   │   └── main.py          # FastAPI application entry point
│   ├── Dockerfile           # Backend container build specification
│   └── requirements.txt     # Python package dependencies
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios API client bindings
│   │   ├── components/      # UI Dashboard components (Overview, Leads, Usage, etc.)
│   │   ├── App.jsx          # Main application container
│   │   └── index.css        # Responsive design system & themes
│   ├── Dockerfile           # Frontend container build specification
│   └── package.json         # React & Vite dependencies
├── docker-compose.yml       # Multi-container orchestration (DB, API, Frontend)
├── .env.example             # Template environment configuration
└── README.md                # Project documentation
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE). Built for high-conversion autonomous sales automation.
