# GreenNeural

GreenNeural is a monorepo with a Next.js frontend and a FastAPI backend.

## Structure

```text
frontend/   Next.js app deployed to Vercel
backend/    FastAPI app and live signal services
```

```text
backend/app/
├── main.py                         FastAPI app, route registration, lifespan
├── api/v1/
│   ├── home.py                     /home and /home/live
│   ├── diagnostics.py              /diagnostics and region coverage
│   ├── home_forecast.py            authenticated Time-to-Clean endpoint
│   ├── carbon/routes.py            carbon-intensity endpoints
│   └── providers/
│       ├── live_home.py            aggregation, freshness, provider health
│       ├── watttime.py             WattTime client
│       ├── entsoe.py               ENTSO-E client and generation parser
│       └── uk_grid.py              UK Carbon Intensity client
├── config/
│   ├── regions.py                  cloud-region inventory
│   ├── grid_resolver.py            shared source resolvers
│   ├── entsoe_regions.py           provider-specific EU mappings
│   └── watttime_regions.py         provider-specific US mappings
└── services/
    └── live_signal_scheduler.py    five-minute refresh task
```

`regions.py` is GreenNeural's configured cloud-region inventory; regions without
a provider-backed grid mapping are explicitly diagnosed as unsupported.

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
`GET /api/v1/home/live`. `GET /api/v1/diagnostics` reports provider health,
source errors, scheduler status, and mapping/availability details for every
region in `app/config/regions.py`. The API includes region-level signals as
well as global and provider aggregates.

An application-lifespan task refreshes the shared live snapshot every five
minutes, and the API cache uses the same interval. The client may poll every 30
seconds but receives the cached snapshot between scheduled refreshes. The
scheduler is process-local: deploy one backend worker per service instance to
avoid duplicate upstream polling. A refresh updates the retrieval timestamp,
not the source timestamp; if a provider has not published a newer reading, the
signal remains delayed or stale. Each widget shows provenance, measured request
latency, source freshness, and relative source-update time. Intensity changes
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

`backend/app/config/grid_resolver.py` provides the shared provider/region
resolvers for the provider-specific maps in `entsoe_regions.py` and
`watttime_regions.py`. ENTSO-E maps European regions and WattTime maps supported
US balancing authorities. Live signals try WattTime, then ENTSO-E, then the UK
Carbon Intensity API for configured GB regions. Regions without a matching
source remain unavailable; unsupported regions and aliases are not assigned
another region's grid.

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
NEXT_PUBLIC_API_URL=https://greenneuralbackend.up.railway.app
```

### Railway

Create a Railway service with its root directory set to `backend`.

```text
Build Command: pip install -r requirements.txt
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
```

Set `WATTTIME_USERNAME`, `WATTTIME_PASSWORD`, `ENTSOE_SECURITY_TOKEN`, `OWM_KEY`, `SUPABASE_URL`, and `SUPABASE_ANON_KEY` in Railway variables as needed by the enabled providers. The backend reads configuration directly from the process environment and never loads `.env` files. `GET /debug/env` reports only whether the WattTime and ENTSO-E variables are set; it deliberately never returns their values. The homepage source diagnostics report missing variable names and safe provider errors. The Pro time-to-clean forecast endpoint verifies signed-in Supabase access tokens using the latter two settings. WattTime, UK grid, and ENTSO-E sources are used where configured; any unavailable provider signals are surfaced as unavailable rather than presented as live. The backend allows the production Vercel origin and local frontend origin through its CORS middleware.
