# GreenNeural

GreenNeural is a monorepo with a Next.js frontend and a FastAPI backend.

## Structure

```text
frontend/   Next.js app deployed to Vercel
backend/    FastAPI app deployed to Render
```

## Local development

### Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
python -m uvicorn main:app --reload --port 8000
```

The API and OpenAPI docs are available at `http://localhost:8000` and `http://localhost:8000/docs`.

### Frontend

```powershell
cd frontend
Copy-Item .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`. The frontend reads the backend URL from `NEXT_PUBLIC_API_URL`.

## Deployment

### Vercel

Create a Vercel project from this repository with **Root Directory** set to `frontend`.
Vercel will use `npm install` and `npm run build` from that directory. Set:

```text
NEXT_PUBLIC_API_URL=https://<your-render-service>.onrender.com
```

### Render

Create a Render Web Service with **Root Directory** set to `backend`.

```text
Build Command: pip install -r requirements.txt
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
```

Set `WATTTIME_USERNAME`, `WATTTIME_PASSWORD`, `ENTSOE_API_KEY`, `OWM_KEY`, `SUPABASE_URL`, and `SUPABASE_ANON_KEY` in Render environment variables as needed by the enabled providers. The Pro time-to-clean forecast endpoint verifies signed-in Supabase access tokens using the latter two settings. WattTime and UK forecast data are supported; EU forecast cards remain unavailable until a validated full-grid carbon-intensity forecast source is configured. The backend allows the production Vercel origin and local frontend origin through its CORS middleware.
