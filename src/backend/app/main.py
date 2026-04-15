"""FastAPI application bootstrap for the Swarm backend.

Startup sequence (lifespan):
  1. Configure structlog (JSON in production, pretty-print in dev).
  2. Open async SQLAlchemy engine (validates DB connectivity).
  3. Open Redis client (validates Redis connectivity).
  4. Build and attach the SimRunner to ``app.state``.

Shutdown sequence (lifespan exit):
  1. Dispose SQLAlchemy engine connection pool.
  2. Close Redis client.
"""

from __future__ import annotations

import uuid
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

import redis.asyncio as aioredis
import structlog
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from sqlalchemy import text

from app.api.countries import router as countries_router
from app.api.events import router as events_router
from app.api.scenarios import router as scenarios_router
from app.api.simulations import router as simulations_router
from app.config import get_settings
from app.db.session import engine
from app.logging import configure_logging, set_request_id
from app.rate_limit import limiter
from app.sim_runner import build_sim_runner
from app.ws.simulations import router as ws_router

log = structlog.get_logger(__name__)

settings = get_settings()


# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Open and close database + Redis connections around the app lifetime."""
    configure_logging(
        log_level=settings.log_level,
        environment=settings.environment,
    )
    log.info("Swarm backend starting", environment=settings.environment)

    # -- Database --
    # Validate connectivity at startup; fail fast rather than on first request
    async with engine.connect() as conn:
        await conn.execute(text("SELECT 1"))
    log.info("Database connection verified")

    # -- Redis --
    redis_client: aioredis.Redis = aioredis.from_url(  # type: ignore[type-arg]
        settings.redis_url,
        encoding="utf-8",
        decode_responses=True,
    )
    await redis_client.ping()
    log.info("Redis connection verified", url=settings.redis_url)

    # -- SimRunner --
    sim_runner = build_sim_runner(settings.agent_runner_impl, redis_client)
    log.info("SimRunner loaded", impl=settings.agent_runner_impl)

    # Attach to app state so dependencies can access them
    app.state.redis = redis_client
    app.state.sim_runner = sim_runner

    yield  # --- application runs here ---

    log.info("Swarm backend shutting down")
    await engine.dispose()
    await redis_client.aclose()
    log.info("Cleanup complete")


# ---------------------------------------------------------------------------
# Application factory
# ---------------------------------------------------------------------------


def create_app() -> FastAPI:
    """Create and configure the FastAPI application instance."""
    _settings = get_settings()

    app = FastAPI(
        title="Swarm API",
        version="0.1.0",
        description=(
            "REST + WebSocket API for the Swarm wargame simulator. "
            "Manages scenarios, simulation runs, and real-time event streaming."
        ),
        lifespan=lifespan,
    )

    # -- Rate limiting --
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.add_middleware(SlowAPIMiddleware)

    # -- CORS --
    cors_origins = _settings.cors_origins
    if "*" in cors_origins:
        raise ValueError(
            "CORS wildcard '*' combined with allow_credentials=True is forbidden. "
            "Set CORS_ORIGINS to explicit origins."
        )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type", "X-Request-ID", "Authorization"],
    )

    # -- Request-ID middleware --
    @app.middleware("http")
    async def request_id_middleware(request: Request, call_next):  # type: ignore[no-untyped-def]
        """Inject a request ID into the structlog context for every request."""
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        set_request_id(request_id)
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response

    # -- Structured-logging middleware --
    @app.middleware("http")
    async def access_log_middleware(request: Request, call_next):  # type: ignore[no-untyped-def]
        """Log every HTTP request with method, path, and status code."""
        response = await call_next(request)
        log.info(
            "HTTP request",
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
        )
        return response

    # -- Exception handlers --
    @app.exception_handler(ValidationError)
    async def validation_error_handler(request: Request, exc: ValidationError) -> JSONResponse:
        return JSONResponse(
            status_code=422,
            content={
                "data": None,
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Request validation failed.",
                    "details": exc.errors(),
                },
            },
        )

    @app.exception_handler(404)
    async def not_found_handler(request: Request, exc: Exception) -> JSONResponse:
        log.info("Not found", path=request.url.path, detail=str(exc))
        return JSONResponse(
            status_code=404,
            content={
                "data": None,
                "error": {
                    "code": "NOT_FOUND",
                    "message": "Not found.",
                    "details": [],
                },
            },
        )

    @app.exception_handler(Exception)
    async def generic_error_handler(request: Request, exc: Exception) -> JSONResponse:
        log.error("Unhandled exception", error=str(exc), exc_info=exc)
        return JSONResponse(
            status_code=500,
            content={
                "data": None,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "An unexpected error occurred.",
                    "details": [],
                },
            },
        )

    # -- Health endpoints --
    @app.get("/healthz", tags=["health"])
    async def healthz() -> dict:  # type: ignore[type-arg]
        """Liveness probe — returns 200 if the process is up."""
        return {"status": "ok"}

    @app.get("/readyz", tags=["health"])
    async def readyz(request: Request) -> JSONResponse:
        """Readiness probe — checks DB and Redis connectivity."""
        checks: dict[str, str] = {}
        ok = True

        # DB check
        try:
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
            checks["database"] = "ok"
        except Exception as exc:
            log.error("Readiness DB check failed", error=str(exc))
            checks["database"] = f"error: {exc}"
            ok = False

        # Redis check
        try:
            redis: aioredis.Redis = request.app.state.redis  # type: ignore[type-arg]
            await redis.ping()
            checks["redis"] = "ok"
        except Exception as exc:
            log.error("Readiness Redis check failed", error=str(exc))
            checks["redis"] = f"error: {exc}"
            ok = False

        status_code = 200 if ok else 503
        return JSONResponse(
            status_code=status_code,
            content={"status": "ready" if ok else "not_ready", "checks": checks},
        )

    # -- API routers --
    app.include_router(countries_router)
    app.include_router(scenarios_router)
    app.include_router(simulations_router)
    app.include_router(events_router)

    # -- WebSocket router --
    app.include_router(ws_router)

    return app


# Module-level app instance (used by uvicorn and tests)
app = create_app()
