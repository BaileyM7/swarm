# Swarm — Agent-Based Wargame Simulator

> Ask a "what-if" — watch countries act, react, and escalate on a live 3D globe.

![status: prototype](https://img.shields.io/badge/status-prototype-orange)
![Python 3.12](https://img.shields.io/badge/python-3.12-blue)
![Next.js 14](https://img.shields.io/badge/next.js-14-black)

## What is This

Swarm simulates how countries respond to a scenario prompt. Each country is an LLM agent with a doctrine, red-lines, and a live view of trade, conflict, and sanctions data. The engine runs a turn loop — perceive → decide → act — and streams every action (diplomatic, economic, cyber, kinetic) to the browser, where it renders as a traveling pulse on a Deck.gl globe.

Built for decision-makers who need a fast, grounded, explainable "first-look" at possible escalation paths.

### The Vertical Slice

The current prototype ships the **China–Taiwan 2027 contingency** scenario with 10 country agents (CHN, TWN, USA, JPN, KOR, PHL, AUS, PRK, RUS, IND). More scenarios and broader country coverage come after the slice.

---

## Prerequisites

Before running Swarm, ensure you have:

- **Docker & Docker Compose** (v20+)
- **Node.js 20+** and **pnpm 9.12+**
- **Python 3.12+** (for local backend development; bundled in Docker)
- **uv** package manager for Python (optional for local dev; install via `curl -LsSf https://astral.sh/uv/install.sh`)
- **Anthropic API Key** (https://console.anthropic.com)
- **Mapbox Public Token** (https://account.mapbox.com/tokens; no authentication required, just the public token)

---

## Local Development: 60-Second Start

```bash
# 1. Clone and navigate to project
cd /path/to/swarm

# 2. Copy environment template and fill in your keys
cp .env.example .env
# Then edit .env:
#   ANTHROPIC_API_KEY=sk-ant-...
#   MAPBOX_TOKEN=pk.eyJ...

# 3. Start all services (Postgres, Redis, Backend, Frontend)
docker compose up --build

# 4. In another terminal, initialize the database
docker compose exec backend alembic upgrade head

# 5. Seed the data lake with live events (GDELT, ACLED, World Bank)
docker compose exec backend python -m src.backend.ingest.runner --sources=gdelt,acled,worldbank

# 6. Open the app in your browser
open http://localhost:3000
```

You should see the globe load with the Taiwan scenario. Click "Simulate" to launch the agents.

---

## Architecture

### System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js 14)                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Deck.gl Globe        │ Scenario Composer   │ Agent Drawer │   │
│  │ (PulseArcLayer)      │ (Taiwan preset)     │ (Decision UI) │   │
│  └──────────────────────────────────────────────────────────┘   │
│               WebSocket (real-time sim events)                   │
└──────────────────────┬──────────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
┌───────▼────────────────────┐   ┌────▼──────────────────────────┐
│   Backend (FastAPI)        │   │  Data Lake (PostgreSQL+Redis)  │
│ ┌────────────────────────┐ │   │ ┌──────────────────────────┐   │
│ │ /api/scenarios         │ │   │ │ Countries + Relationships│   │
│ │ /api/simulations       │ │   │ │ Events (GDELT, ACLED)    │   │
│ │ /api/events            │ │   │ │ Agent Memory (pgvector)  │   │
│ │ /ws/simulations/{id}   │ │   │ │ Live world_state (Redis) │   │
│ └────────────────────────┘ │   │ └──────────────────────────┘   │
│         │                  │   │          ▲                     │
│         └──────────────┬───┘   └──────────┘                     │
│                        │                                         │
│        ┌───────────────▼──────────────┐                         │
│        │  AI Sim Engine (LangGraph)   │                         │
│        │ ┌────────────────────────┐   │                         │
│        │ │ Country Agents ×10     │   │  ← Claude Sonnet        │
│        │ │ Arbiter (conflict res) │   │  ← Claude Opus          │
│        │ │ Memory Store (RAG)     │   │  ← Voyage embeddings    │
│        │ └────────────────────────┘   │                         │
│        └────────────────────────────────┘                        │
└────────────────────────────────────────────────────────────────┘
```

### Key Layers

1. **Frontend** (`src/frontend/`): Next.js 14 App Router, React 18, Deck.gl globe, Zustand store, Tailwind CSS.
2. **Backend** (`src/backend/`): FastAPI + Uvicorn, async PostgreSQL/Redis drivers, Alembic migrations.
3. **AI Pipeline** (`src/ai/`): LangGraph agent orchestration, country decision-making, conflict adjudication, memory RAG.
4. **Data Layer** (`src/shared/`, `docker/postgres/init.sql`): Shared schemas, seed data, pgvector + pg_trgm extensions.

### Turn-by-Turn Loop

Each turn:

1. **Perceive**: Country agent reads current world state, queries memory (pgvector semantic search), fetches recent events from data lake.
2. **Decide**: Agent calls Claude Sonnet with tool-use schema, outputs structured decision (target country, action domain, escalation rung).
3. **Act**: Sim engine writes event to Postgres, publishes to Redis PubSub.
4. **Emit**: FastAPI WS handler forwards to all connected browser clients; frontend renders arc on globe.

Simultaneous country actions are resolved by an **Arbiter** (Claude Opus), which computes relationship deltas and applies them to `world_state`.

---

## File Structure

```
swarm/
├── CLAUDE.md                   # Phase orchestration guide
├── README.md                   # This file
├── pyproject.toml              # Python dependencies + build config
├── docker-compose.yml          # Local dev compose (bind mounts, hot reload)
├── docker-compose.prod.yml     # Production overlay (named volumes, prod targets)
├── fly.toml                    # Fly.io backend config
├── .env.example                # Template for secrets
│
├── docs/
│   ├── plan.md                 # Original brief
│   ├── architecture.md         # Full API, schema, design decisions
│   ├── task-graph.md           # Phase 0: task decomposition
│   ├── stitch-brief.md         # Phase 2: UI design brief (→ Stitch)
│   └── quality-report.md       # Phase 6: test coverage, code review
│
├── src/
│   ├── backend/
│   │   ├── app/
│   │   │   ├── main.py         # FastAPI app entry
│   │   │   ├── db/             # ORM models, repos
│   │   │   ├── api/            # Routes: /scenarios, /simulations, /events, /ws
│   │   │   └── ingest/         # Data pipeline runners
│   │   └── tests/              # Backend unit + integration tests
│   │
│   ├── ai/
│   │   ├── sim/
│   │   │   ├── world.py        # World state, Relationship, SimEvent models
│   │   │   ├── loop.py         # Main turn loop + pubsub orchestration
│   │   │   ├── runner.py       # LangGraphSimRunner protocol
│   │   │   └── escalation_ladder.py  # Action → rung classification
│   │   │
│   │   ├── agents/
│   │   │   ├── country_agent.py    # Country decision LLM
│   │   │   └── arbiter.py          # Conflict resolution (Opus)
│   │   │
│   │   ├── memory/
│   │   │   └── store.py         # pgvector RAG + Voyage embeddings
│   │   │
│   │   └── tests/               # AI pipeline integration tests
│   │
│   ├── frontend/
│   │   ├── app/
│   │   │   ├── page.tsx         # Home: globe + scenario composer
│   │   │   ├── layout.tsx
│   │   │   └── globals.css
│   │   │
│   │   ├── lib/
│   │   │   ├── api.ts           # Fetch + WS client
│   │   │   ├── store/           # Zustand (sim state, globe data)
│   │   │   └── types/           # TypeScript schema mirrors
│   │   │
│   │   ├── components/
│   │   │   ├── Globe.tsx
│   │   │   ├── ScenarioComposer.tsx
│   │   │   ├── AgentDrawer.tsx
│   │   │   └── [other UI]
│   │   │
│   │   ├── public/              # Assets (country flags, icons)
│   │   ├── package.json
│   │   ├── vercel.json          # Vercel deploy config
│   │   └── tests/               # Frontend unit + E2E tests
│   │
│   └── shared/
│       ├── schemas/             # Pydantic models + TypeScript mirrors
│       └── seeds/               # Country doctrine YAML, initial conditions
│
├── docker/
│   ├── backend.Dockerfile       # Multi-stage Python 3.12
│   ├── frontend.Dockerfile      # Multi-stage Node.js 20
│   └── postgres/
│       └── init.sql             # pgvector + pg_trgm bootstrap
│
└── tests/
    ├── e2e/                     # Playwright end-to-end tests
    └── integration/             # Cross-layer tests
```

---

## Testing

### Backend (Python)

```bash
# Unit + integration tests (uses pytest-asyncio + fakeredis + in-memory SQLite)
docker compose exec backend uv run pytest -v

# With coverage
docker compose exec backend uv run pytest --cov=src --cov-report=html

# Local (if you have uv + Python 3.12)
cd /path/to/swarm
uv run pytest -v
```

### Frontend (Next.js)

```bash
# Unit tests (Vitest)
docker compose exec frontend pnpm test

# E2E tests (Playwright; requires app running)
docker compose exec frontend pnpm test:e2e

# Local
cd src/frontend
pnpm test
pnpm test:e2e
```

---

## Known Compromises

See [`docs/architecture.md § 9`](docs/architecture.md#9-known-compromises) for design tradeoffs made in the prototype. Highlights:

1. **Layer violation (AI imports from app):** `src/ai/` imports ORM classes from `src/backend/app/db/models`. Long-term fix: extract to `src/shared/` repository interfaces.
2. **Redis-based world state (not DB):** World state lives in Redis for speed; not persisted on commit. Long-term: write to DB at turn end.
3. **No historical sim replay:** Sim loop is forward-only; no "rewind to turn 5" in the UI yet.

---

## Deployment

### Fly.io (Backend)

```bash
# Requires flyctl installed: https://fly.io/docs/hands-on/install-flyctl/

# First deploy
fly apps create swarm-backend 2>/dev/null || true
fly deploy --config fly.toml

# The fly.toml includes:
#   - release_command: alembic upgrade head (runs on every deploy)
#   - shared-cpu-2x, 1GB RAM
#   - HTTP healthcheck on /healthz
#   - Primary region: iad
```

### Vercel (Frontend)

```bash
# Requires vercel CLI installed: npm i -g vercel

cd src/frontend
vercel deploy --prod

# Set environment variables in Vercel UI:
#   NEXT_PUBLIC_API_URL = https://<backend-domain>
#   NEXT_PUBLIC_WS_URL = wss://<backend-domain>
#   NEXT_PUBLIC_MAPBOX_TOKEN = pk.eyJ...
```

### Docker Compose (Production)

For self-hosted deployments, use the production overlay:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Migrations
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec backend alembic upgrade head

# Seed data
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec backend python -m src.backend.ingest.runner
```

All services use `restart: always` and include healthchecks.

---

## Learning Mode: How to Contribute

Swarm is designed for **learning-by-contributing**. There are three key extension points where you can shape the demo:

### 1. Add a Country (`src/shared/seeds/countries.yaml`)

To add China (CHN) or USA (USA) agents beyond the default Taiwan scenario:

```yaml
- iso3: "CHN"
  name: "China"
  profile:
    description: "People's Republic of China"
    gdp_usd: 17900000000000
  doctrine:
    core_interest: "Territorial integrity"
    red_lines:
      - "Taiwan independence declaration"
  military_assets:
    - naval_fleet: 350
    - aircraft: 3300
```

Then register in the Taiwan scenario (`src/backend/app/seeds/scenarios.yaml`). The country agent will automatically inherit the doctrine.

### 2. Refine Agent Mindset (`src/ai/agents/country_agent.py`)

The agent's personality comes from the system prompt. Edit the `_build_system_prompt()` method to adjust:

- Risk aversion (how quickly to escalate)
- Alliance loyalty (weight of allied countries in decisions)
- Historical memory bias (weight of past similar events)

Example:

```python
def _build_system_prompt(self) -> str:
    return f"""
    You are the National Security Council of {self.country_name}.
    ...
    Your risk tolerance for kinetic action is: MODERATE
    ...
    """
```

Watch how the globe evolves after edits.

### 3. Add an Action Type (`src/ai/sim/escalation_ladder.py`)

New action domains (currently: diplomatic, economic, cyber, kinetic) are classified by `classify_action()`. Add support for, say, `"information_warfare"`:

```python
def classify_action(self, action: dict) -> int:
    if action.get("domain") == "information_warfare":
        if action.get("severity") == "high":
            return 2  # escalation rung
    # ... rest of logic
```

Then test by authoring a scenario where a country uses that action.

---

## Cost Estimate (Demo Session)

For a single **20-turn simulation with 10 agents**:

- **Claude Sonnet 4.6** (agent decisions): ~100 calls × 4K in / 800 out ≈ **$0.15**
- **Claude Opus 4.6** (arbiter): ~5 calls × 2K in / 500 out ≈ **$0.10**
- **Voyage-3** (memory embeddings): ~50 calls × 256 tokens ≈ **$0.02**
- **Total per sim**: **~$0.27**

For a 30-minute demo with 5 simulations (each 20 turns): **~$1.35 in API costs**.

---

## Troubleshooting

### Backend won't start — "Database connection failed"

```bash
# Check Postgres is healthy
docker compose ps postgres
# If unhealthy, wait 10s for init.sql to complete

# Force rebuild
docker compose down -v
docker compose up --build
```

### Frontend shows blank canvas

```bash
# Check environment variables are set
docker compose logs frontend | grep NEXT_PUBLIC

# Verify backend is reachable
curl http://localhost:8000/healthz
```

### WebSocket disconnects mid-sim

```bash
# Increase the backpressure buffer in loop.py:158
# (Known compromise: unbounded async queue can OOM on very long sims)
```

See [`docs/quality-report.md`](docs/quality-report.md) for detailed test coverage and known test flakiness.

---

## Documentation

- **[docs/plan.md](docs/plan.md)** — Original vision and scope
- **[docs/architecture.md](docs/architecture.md)** — Full system design, API spec, ER diagram, tech stack
- **[docs/task-graph.md](docs/task-graph.md)** — Phase 0 task decomposition and dependency order
- **[docs/stitch-brief.md](docs/stitch-brief.md)** — UI design brief (exported to Stitch design tool)
- **[docs/quality-report.md](docs/quality-report.md)** — Test coverage gaps, code review findings, flakiness risks

---

## License

Prototype — not yet licensed for distribution.

---

## Questions?

- **Backend / AI**: See [`src/backend/app/README.md`](src/backend/app/README.md) and [`src/ai/README.md`](src/ai/README.md)
- **Frontend**: See [`src/frontend/README.md`](src/frontend/README.md)
- **Deployment**: See [`fly.toml`](fly.toml) and [`docker-compose.prod.yml`](docker-compose.prod.yml)
- **Phase orchestration**: See [`CLAUDE.md`](CLAUDE.md) — describes how this prototype was built in 7 phases
