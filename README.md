# Zip Forecast

Rails JSON API plus a React (Vite) frontend: accept a **location string** (address, city, ZIP/postal code, coordinates, etc.—anything [World Weather Online’s `q` parameter](https://www.worldweatheronline.com/weather-api/api/docs/local-city-town-weather-api.aspx) supports), return forecast data, cache results for **30 minutes** per query, and show whether the response came from cache.

**Location input:** The take-home asks for an “address”; we pass the user’s text straight to WWO as `q` (same as their API). That covers street-style queries where the provider resolves them, plus ZIP/postcode, city names, and `lat,lng` from the map.

This README is written for **code review / evaluation**: what was chosen, why, and how to run it locally.

**Live demo:** [https://zip-forecast-web.vercel.app/](https://zip-forecast-web.vercel.app/)
We use a free tier on render, so the API service could be slow or down, after the first request wait some seconds so the API could start again.

---

## Design decisions (rationale)

### Rails API-only (no server-rendered UI)

The backend exposes JSON only (`GET /forecast?q=…`, with `zip=` kept as a **deprecated alias** for the same value). That keeps HTTP concerns, validation, and serialization in one place, lets the SPA own presentation, and makes contract testing straightforward with request specs. It also mirrors common production splits (API + separate static host).

### Service objects for weather and caching

- **`WorldWeatherOnline::ForecastService`** — Encapsulates HTTP to WWO, response parsing, and error types (`ApiError`, `RequestError`, `ConfigurationError`). The controller does not know URL shapes or query params, which keeps responsibilities clear and makes the integration easy to stub in tests.
- **`Forecasts::FetchWithCache`** — Implements read-through cache: `Rails.cache.read` → on miss, call the forecast service → `Rails.cache.write` with a fixed TTL. Controllers stay thin (resolve `q` / `zip`, call one collaborator, render JSON).

Together, this follows **single responsibility** and **testability**: units are small, names describe behavior, and failures map to explicit rescues in `ForecastsController`.

### React with Vite (TypeScript)

The UI needs a search flow, a data-heavy table, map interaction (Leaflet), and cache indicators. React gives a **component model**, predictable state, and a large ecosystem (e.g. `react-leaflet`, Tailwind). Vite keeps **local feedback loops fast** compared to heavier bundlers. TypeScript adds safety on the client without changing the API contract.

### Redis for caching (with explicit TTL)

`Forecasts::FetchWithCache` uses **`Rails.cache`** with `expires_in: 30.minutes` and a versioned key prefix (`forecast`, `v1`, normalized location string). In **development** and **production**, when `REDIS_URL` is set, the app uses **`redis_cache_store`**, so:

- TTL is **centralized** in one constant (`TTL`), not scattered in callers.
- Cache is **shared** across processes/instances (important if you scale the API horizontally).
- Entries **expire in Redis**, which matches the assessment requirement better than ad hoc in-memory hashes.

Docker Compose runs Redis alongside Postgres so local behavior matches production-style caching.

### Docker Compose for local full stack

Compose wires **Postgres 16**, **Redis 7**, the **Rails API**, and the **Vite dev server** with consistent env vars (`DATABASE_URL`, `REDIS_URL`, `VITE_API_URL`, `FRONTEND_ORIGIN`). Published ports **5433** and **6380** avoid clashing with a Postgres/Redis already on the host (`docker-compose.yml` documents that).

### Leaflet / react-leaflet for the map

The brief asked for a **free map library** and map-click-to-search. Leaflet is open, widely used, and works well with React via `react-leaflet` without tying the project to a paid tiles provider beyond free OSM-style tiles.

### Tests

**RSpec** covers the forecast endpoint and the WWO service with **WebMock**, so external HTTP is deterministic and CI-friendly.

---

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) with Compose v2
- A **World Weather Online** API key (see below)

---

## World Weather Online API key

1. Open the signup page: **[Get your free API key](https://www.worldweatheronline.com/weather-api/signup.aspx)**.
2. Create an account (the free tier includes a limited number of requests per day; see [pricing](https://www.worldweatheronline.com/weather-api/api/pricing2.aspx) for current limits).
3. After login, open your **developer / API dashboard** and copy the **API key** string.
4. Expose it to the API as **`WORLD_WEATHER_ONLINE_API_KEY`** (see next section).

API reference: [Local weather API docs](https://www.worldweatheronline.com/weather-api/api/docs/local-city-town-weather-api.aspx).

---

## Run locally (Docker Compose)

From the **repository root**:

1. Set the key (pick one approach):

   - **Option A — `.env` at repo root** (Compose loads it automatically):

     ```bash
     echo 'WORLD_WEATHER_ONLINE_API_KEY=your_key_here' >> .env
     ```

   - **Option B — export in your shell**:

     ```bash
     export WORLD_WEATHER_ONLINE_API_KEY=your_key_here
     ```

2. Start everything:

   ```bash
   docker compose up --build
   ```

3. Wait until the API and DB healthchecks are green, then open:

   - **Frontend:** [http://localhost:5173](http://localhost:5173)
   - **API health:** [http://localhost:3000/up](http://localhost:3000/up)
   - **Example forecast:** [http://localhost:3000/forecast?q=90210](http://localhost:3000/forecast?q=90210) (same value as `zip=90210` if you still use the old query name)

The first successful request for a location fetches WWO; repeat requests within **30 minutes** should return the same payload with **`from_cache: true`** in JSON and the red cache indicator in the UI.

**Errors & cold starts:** Validation, missing API key, provider, and network failures show **inline under the search form**. On deploy, the SPA also **GETs `/up`** once when `VITE_API_URL` is set so a sleeping Render instance can wake before you search.

### Ports note

- Postgres from the host: **localhost:5433** (mapped from container `5432`).
- Redis from the host: **localhost:6380** (mapped from container `6379`).

---

## Run API tests

With the stack running:

```bash
docker compose exec api bundle exec rspec
```

The Compose `api` service sets `RAILS_ENV=development` for the server; `spec/rails_helper.rb` **forces `RAILS_ENV=test`** when specs load so request specs do not inherit development middleware (e.g. `HostAuthorization` rejecting Rack::Test’s default host and returning **403** with an HTML error page).

Or from `api/` on the host (with Postgres/Redis available and env vars aligned), run the same command after `bundle install` and `bin/rails db:prepare`.

---

## Continuous integration

GitHub Actions runs on every push and pull request to `main` (see [`.github/workflows/ci.yml`](.github/workflows/ci.yml)):

- **API:** RuboCop, Brakeman, `bin/rails db:test:prepare`, and `bundle exec rspec` against Postgres 16.
- **Frontend:** `npm run lint` and `npm run build`.

---

## Configuration reference

| Variable | Purpose |
|----------|---------|
| `WORLD_WEATHER_ONLINE_API_KEY` | Required for live WWO calls |
| `DATABASE_URL` | Postgres connection (Compose sets this for `api`) |
| `REDIS_URL` | Redis for `Rails.cache` when using `redis_cache_store` |
| `FRONTEND_ORIGIN` | CORS allowlist for the browser origin (e.g. `http://localhost:5173`) |
| `VITE_API_URL` | Frontend-only: base URL of the API (Compose: `http://localhost:3000`) |

See `api/.env.example` for the API-oriented list.

---

## Repository layout

| Path | Role |
|------|------|
| `api/` | Rails 7 API, Dockerfile, RSpec |
| `frontend/` | Vite + React + Tailwind |
| `docker-compose.yml` | Local `db`, `redis`, `api`, `frontend` |
| `render.yaml` | Example Render **web** service (Docker) for the API |
| `docs/specs.md` | Original task breakdown and definitions of done |

---

## Production-oriented notes (short)

- The API image is built from `api/Dockerfile`; ensure **`RAILS_MASTER_KEY`** and **`DATABASE_URL`** (e.g. Neon) and **`REDIS_URL`** (e.g. Upstash) are set on the host.
- Point the SPA’s **`VITE_API_URL`** at the public API base URL and align **`FRONTEND_ORIGIN`** on the API with the deployed frontend origin for CORS.
