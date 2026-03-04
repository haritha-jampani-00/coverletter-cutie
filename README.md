# CoverLetter Cutie

AI-powered cover letter generator that matches your resume to any job description.

Upload your resume, paste a job description, and get a tailored cover letter in seconds.

## How It Works

1. Upload your resume (PDF)
2. Enter the company name and role
3. Paste the job description or provide a link
4. Choose tone and length
5. Click Generate

The backend extracts skills from the JD, maps them to your resume, and generates a targeted cover letter using Together AI (Llama 3.1).

## Tech Stack

| Layer    | Tech                          |
|----------|-------------------------------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4 |
| Backend  | FastAPI, LangChain, pypdf     |
| LLM      | Together AI (Llama 3.1 8B)    |
| Deploy   | Vercel (frontend) + Render (backend) |

## Quick Start

### Prerequisites

- [Docker](https://www.docker.com/products/docker-desktop/) installed
- [Together AI API key](https://api.together.xyz/settings/api-keys) (free tier available)

### Run Locally

```bash
# 1. Clone the repo
git clone https://github.com/haritha-jampani-00/coverletter-cutie.git
cd coverletter-cutie

# 2. Set up environment
cp .env.example .env
# Edit .env and add your TOGETHER_API_KEY

# 3. Start the app
docker compose up
```

- **Frontend** — http://localhost:3001
- **Backend** — http://localhost:8001
- **Health check** — http://localhost:8001/health

### Run Without Docker

**Backend:**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export TOGETHER_API_KEY=your_key_here
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Deploy to Production

**Backend → Render:**
1. Connect your GitHub repo on [Render](https://render.com)
2. It auto-detects `render.yaml`
3. Set `TOGETHER_API_KEY` in the Render dashboard

**Frontend → Vercel:**
1. Import the repo on [Vercel](https://vercel.com)
2. Set root directory to `frontend`
3. Add env variable: `NEXT_PUBLIC_API_BASE_URL` = your Render backend URL

## Project Structure

```
coverletter-cutie/
├── backend/
│   ├── main.py              # FastAPI app + LLM pipeline
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── app/
│   │   ├── page.tsx          # Main UI
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── render.yaml
└── .env.example
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TOGETHER_API_KEY` | Yes | Together AI API key |
| `TOGETHER_MODEL` | No | LLM model (default: Llama 3.1 8B Instruct Turbo) |
| `NEXT_PUBLIC_API_BASE_URL` | No | Backend URL (default: http://localhost:8000) |

## License

MIT
