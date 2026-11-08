# Krish Italiya — Personal AI Assistant & Interactive Portfolio

An interactive, real-time AI assistant representing **Krish Italiya** (Software Engineer at State Street Corporation). Built with **FastAPI**, **Groq (`llama-3.3-70b-versatile`)**, and **React 19 + TypeScript + Tailwind CSS v4**, this application streams conversational responses grounded in verified career history, technical projects, and engineering experience.

## Key Features

- **Real-Time Token Streaming:** Powered by `AsyncGroq` and FastAPI `StreamingResponse` for sub-second time-to-first-token and smooth streaming in the browser.
- **Grounded Persona Engine:** Automatically parses `assets/my_resume.pdf` at server startup via `pypdf` and enforces strict anti-hallucination, seniority calibration, and employer confidentiality guardrails.
- **Modern Chat Interface:** Built with React 19, Vite, TypeScript, Tailwind CSS v4, `react-markdown` (`remark-gfm`), and `lucide-react` icons.
- **Thoughtful UX Details:** Includes first-visit onboarding prompt cards, animated typing indicators, custom hover tooltips, one-click session reset (`New Chat`), and multiline input (`Shift + Enter` for newline, `Enter` to send).

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend API** | Python 3.12+, FastAPI, Uvicorn, Pydantic, `pypdf`, `python-dotenv` |
| **LLM Inference** | Groq Cloud API (`groq` Async SDK, `llama-3.3-70b-versatile`) |
| **Frontend UI** | React 19, TypeScript, Vite, Tailwind CSS v4, `react-markdown`, `remark-gfm`, `lucide-react` |
| **Package & Env Management** | `uv` (`pyproject.toml` & `uv.lock`), Node.js / `npm` |

## Project Structure

```text
my_ai/
├── assets/
│   ├── my_image.png          # Profile avatar & favicon
│   └── my_resume.pdf         # Grounding source document & downloadable PDF
├── src/
│   └── my_ai/
│       ├── __init__.py
│       ├── bot_engine.py     # PDF extraction, persona prompt & AsyncGroq streaming
│       └── main.py           # FastAPI endpoints, CORS & static asset/UI mounting
├── ui/                       # React 19 + TypeScript + Vite frontend
│   ├── src/
│   │   ├── App.tsx           # Main chat interface component
│   │   ├── index.css         # Tailwind CSS v4 entry
│   │   └── main.tsx          # React DOM root
│   ├── index.html            # App shell & favicon configuration
│   ├── package.json
│   └── vite.config.ts        # Dev proxy for /api and /assets
├── .env                      # Environment variables (excluded from Git)
├── .gitignore
├── .python-version
├── pyproject.toml            # Python dependencies & metadata
└── README.md
```

## Local Development Setup

### 1. Prerequisites

- **Python 3.11+** (and [`uv`](https://docs.astral.sh/uv/) or `pip`)
- **Node.js 18+** and `npm`
- A **Groq API Key** from [Groq Console](https://console.groq.com/)

### 2. Configure Environment Variables

Create a `.env` file in the root `my_ai/` directory:

```env
GROQ_API_KEY=gsk_your_groq_api_key_here
```

### 3. Install & Run the Backend (FastAPI)

From the root `my_ai/` directory:

```bash
# Install dependencies via uv
uv sync

# Start the FastAPI server on http://127.0.0.1:8000
uv run uvicorn my_ai.main:app --app-dir src --reload
```

### 4. Install & Run the Frontend (React + Vite)

Open a second terminal in the root `my_ai/` directory:

```bash
cd ui
npm install
npm run dev
```

Visit **`http://localhost:5173`** in your browser. Vite automatically proxies `/api` and `/assets` requests to FastAPI on port `8000`.

## Production Build & Single-Service Deployment

To serve both the compiled React frontend and the FastAPI backend from a single production server (ideal for Render, Railway, or Fly.io):

1. Build the static frontend bundle into `ui/dist`:
   ```bash
   cd ui && npm run build && cd ..
   ```
2. Start Uvicorn on your host port:
   ```bash
   uv run uvicorn my_ai.main:app --app-dir src --host 0.0.0.0 --port ${PORT:-8000}
   ```

## Author

**Krish Italiya**  
- **Role:** Software Engineer — Associate 2 @ State Street Corporation  
- **GitHub:** [github.com/krish-italiya](https://github.com/krish-italiya)  
- **LinkedIn:** [linkedin.com/in/krishitaliya](https://linkedin.com/in/krishitaliya)  
- **Email:** [krishitaliya11@gmail.com](mailto:krishitaliya11@gmail.com)
