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
python -m uvicorn main:app --reload --port 8000
```

Set required provider variables in the terminal or IDE launch configuration
before starting the backend. The backend reads process environment variables
directly and does not load `.env` files.

The API and OpenAPI docs are available at `http://localhost:8000` and `http://localhost:8000/docs`.

The public homepage reads its aggregated live signal surface from
`GET /api/v1/home/live`. It displays separate global signal, cleanest-region,
provider-health, and generation-mix widgets. The client refreshes the shared
feed every 30 seconds. Each widget shows source provenance, measured request
latency, signal freshness, and a relative source-update time. Intensity changes
animate cleaner, dirtier, or stable updates (with reduced-motion support).

Signals are labeled `live` (<60 seconds old), `delayed` (60–300 seconds),
`stale` (>300 seconds), `forecast`, `fallback`, or `unavailable`. Fallback
estimates are clearly identified and excluded from the cleanest-region ranking;
the homepage does not substitute static estimates when live feeds fail. A
partial global snapshot reports the number of unique mapped grids that returned
readings, and the source diagnostics show feed availability and safe error
details. The 10-minute trend becomes available after the backend has collected
enough in-process readings; it is marked `unknown` while warming up and resets
when the backend process restarts.

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

Set `WATTTIME_USERNAME`, `WATTTIME_PASSWORD`, `ENTSOE_API_KEY`, `OWM_KEY`, `SUPABASE_URL`, and `SUPABASE_ANON_KEY` in Render environment variables as needed by the enabled providers. The backend reads configuration directly from the process environment and never loads `.env` files. `GET /debug/env` reports only whether the WattTime and ENTSO-E variables are set; it deliberately never returns their values. The homepage source diagnostics report missing variable names and safe provider errors. The Pro time-to-clean forecast endpoint verifies signed-in Supabase access tokens using the latter two settings. WattTime, UK grid, and ENTSO-E sources are used where configured; any unavailable provider signals are surfaced as unavailable rather than presented as live. The backend allows the production Vercel origin and local frontend origin through its CORS middleware.
