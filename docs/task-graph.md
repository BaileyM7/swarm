# Task Graph — Swarm

Generated from `docs/plan.md` + approved build plan. Dependency-ordered; parallelizable branches noted.

```
                            ┌──────────────────┐
                            │ Phase 0          │
                            │ Scaffolding      │
                            │ (manual)         │
                            └────────┬─────────┘
                                     │
                            ┌────────▼─────────┐
                            │ Phase 1          │
                            │ Architecture +   │
                            │ Data Model       │
                            │ api-designer     │
                            │ database-admin   │
                            │ ai-engineer      │
                            └────────┬─────────┘
                                     │
                 ┌───────────────────┼───────────────────┐
                 │                   │                   │
        ┌────────▼────────┐ ┌────────▼────────┐ ┌────────▼────────┐
        │ Phase 2         │ │ Phase 3         │ │ Phase 4         │
        │ Stitch Brief    │ │ Backend + Data  │ │ Agent Sim       │
        │ ui-designer     │ │ Lake            │ │ ai-engineer     │
        │ (STOP for       │ │ backend-dev     │ │ llm-architect   │
        │  Stitch handoff)│ │ python-pro      │ │                 │
        └────────┬────────┘ └────────┬────────┘ └────────┬────────┘
                 │                   │                   │
                 │                   └─────────┬─────────┘
                 │                             │
                 │                    ┌────────▼────────┐
                 └───────────────────►│ Phase 5         │
                                      │ Frontend Int.   │
                                      │ fullstack-dev   │
                                      │ react-specialist│
                                      └────────┬────────┘
                                               │
                                      ┌────────▼────────┐
                                      │ Phase 6         │
                                      │ Quality Gate    │
                                      │ qa-expert       │
                                      │ code-reviewer   │
                                      │ security-auditor│
                                      └────────┬────────┘
                                               │
                                      ┌────────▼────────┐
                                      │ Phase 7         │
                                      │ Deployment      │
                                      │ deployment-eng  │
                                      │ docker-expert   │
                                      └─────────────────┘
```

## Phase 0 — Scaffolding (half day)
- [x] Create dir layout: `src/{frontend,backend,ai,shared}`, `docker/`, `tests/`, `docs/`
- [x] Root `.gitignore`, `.env.example`
- [x] `docker-compose.yml` — Postgres 16 + pgvector, Redis 7, adminer
- [x] Python workspace via `uv` (`pyproject.toml` per package)
- [x] Node workspace via `pnpm` (only one app for now: frontend)
- [x] `README.md` stub

## Phase 1 — Architecture & Data Model (1 day)
- [ ] `docs/architecture.md` — ER diagram, OpenAPI spec, sim flow diagram
- [ ] `src/backend/app/db/models.py` — SQLAlchemy models
- [ ] `src/backend/alembic.ini` + `alembic/env.py` + `alembic/versions/0001_initial.py`
- [ ] `src/shared/schemas/` — Pydantic/TypeScript shared types (SimEvent, Action, CountryState)

## Phase 2 — Stitch Brief (0.5 day, parallel)
- [ ] `docs/stitch-brief.md` — complete per CLAUDE.md Phase 2 template
- [ ] **STOP** and notify human operator

## Phase 3 — Backend + Data Lake (3–4 days, parallel with Phase 4)

### 3a. API layer
- [ ] `src/backend/app/main.py` — FastAPI app bootstrap
- [ ] `src/backend/app/config.py` — pydantic-settings
- [ ] `src/backend/app/api/countries.py`
- [ ] `src/backend/app/api/scenarios.py`
- [ ] `src/backend/app/api/simulations.py`
- [ ] `src/backend/app/ws/simulations.py` — WebSocket stream handler
- [ ] `src/backend/app/deps.py` — DB session, Redis client
- [ ] Tests: `tests/backend/test_*.py`

### 3b. Data lake adapters (all inherit `ingest.base.Source`)
- [ ] `src/backend/ingest/base.py` — `Source` ABC + retry/backoff
- [ ] `src/backend/ingest/gdelt.py`  ← P0 for slice
- [ ] `src/backend/ingest/acled.py`  ← P0 for slice
- [ ] `src/backend/ingest/worldbank.py`  ← P0 for slice
- [ ] `src/backend/ingest/fred.py`
- [ ] `src/backend/ingest/un_comtrade.py`
- [ ] `src/backend/ingest/imf.py`
- [ ] `src/backend/ingest/ofac_sdn.py`
- [ ] `src/backend/ingest/open_sanctions.py`
- [ ] `src/backend/ingest/sec_edgar.py`
- [ ] `src/backend/ingest/gleif.py`
- [ ] `src/backend/ingest/open_corporates.py`
- [ ] `src/backend/ingest/marine_ais.py`

### 3c. Seeds
- [ ] `src/shared/seeds/countries.yaml` — 10 vertical-slice countries w/ doctrine + red-lines
  - [ ] **TODO(user):** CHN, USA profiles

## Phase 4 — Agent Sim Engine (3–4 days, parallel with Phase 3)
- [ ] `src/ai/agents/country_agent.py` — LangGraph node for a country agent
- [ ] `src/ai/agents/prompts/country_agent.md` — system prompt template
  - [ ] **TODO(user):** core agent mindset paragraph
- [ ] `src/ai/agents/arbiter.py` — Opus-powered action adjudicator
- [ ] `src/ai/sim/world.py` — world state, relationships, posture
- [ ] `src/ai/sim/loop.py` — turn loop, Redis PubSub emission
- [ ] `src/ai/sim/escalation_ladder.py` — rung classification
  - [ ] **TODO(user):** `classify_action()` mapping logic
- [ ] `src/ai/memory/store.py` — pgvector-backed agent memory
- [ ] `src/ai/tests/test_taiwan_scenario.py` — structural eval harness

## Phase 5 — Frontend Integration (3 days, after Stitch export)
- [ ] `src/frontend/package.json`, `next.config.mjs`, `tailwind.config.ts`
- [ ] `src/frontend/app/layout.tsx`, `app/(globe)/page.tsx`
- [ ] `src/frontend/components/Globe.tsx` — Deck.gl GlobeView
- [ ] `src/frontend/components/ScenarioComposer.tsx`
- [ ] `src/frontend/components/AgentDrawer.tsx`
- [ ] `src/frontend/components/EventTimeline.tsx`
- [ ] `src/frontend/hooks/useSimStream.ts` — WS client
- [ ] `src/frontend/lib/deck/pulseArcExtension.ts` — custom shader extension
- [ ] `src/frontend/lib/api/client.ts` — typed REST client

## Phase 6 — Quality Gate
- [ ] Full test suite green (pytest + vitest)
- [ ] Playwright E2E: `tests/e2e/full-scenario.spec.ts`
- [ ] Security review (prompt injection, input validation, rate limits, secrets)
- [ ] Perf budget verification
- [ ] `docs/quality-report.md`

## Phase 7 — Deployment
- [ ] `docker/backend.Dockerfile` — multi-stage, Python 3.12-slim
- [ ] `docker/frontend.Dockerfile` — multi-stage, node:20-alpine build → distroless runtime
- [ ] `docker-compose.prod.yml`
- [ ] `fly.toml` for backend
- [ ] `vercel.json` for frontend
- [ ] `README.md` — full setup guide
