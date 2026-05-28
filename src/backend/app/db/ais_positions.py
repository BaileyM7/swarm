"""Helpers for the live AIS position buffer."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import AISPosition

DEFAULT_RETENTION_DAYS = 30


async def bulk_insert_positions(session: AsyncSession, positions: list[dict[str, Any]]) -> int:
    """Insert a batch of raw position dicts; returns the count inserted."""
    if not positions:
        return 0
    valid: list[dict[str, Any]] = []
    for pos in positions:
        mmsi = pos.get("mmsi")
        lat = pos.get("latitude")
        lon = pos.get("longitude")
        ts = pos.get("timestamp")
        if not mmsi or lat is None or lon is None or ts is None:
            continue
        valid.append(
            {
                "mmsi": str(mmsi),
                "latitude": float(lat),
                "longitude": float(lon),
                "speed": pos.get("speed"),
                "course": pos.get("course"),
                "timestamp": ts,
            }
        )
    if not valid:
        return 0
    await session.execute(AISPosition.__table__.insert(), valid)
    return len(valid)


async def read_positions_for_mmsi(
    session: AsyncSession,
    mmsi: str,
    since: datetime,
) -> list[dict[str, Any]]:
    """Return position points for *mmsi* with timestamp >= *since*."""
    stmt = (
        select(AISPosition)
        .where(AISPosition.mmsi == str(mmsi), AISPosition.timestamp >= since)
        .order_by(AISPosition.timestamp.asc())
    )
    rows = (await session.execute(stmt)).scalars().all()
    return [
        {
            "latitude": row.latitude,
            "longitude": row.longitude,
            "speed": row.speed or 0.0,
            "course": row.course or 0,
            "timestamp": int(row.timestamp.timestamp()),
        }
        for row in rows
    ]


async def prune_positions_older_than(
    session: AsyncSession,
    cutoff: datetime,
) -> int:
    """Delete buffered positions older than *cutoff*; returns rowcount."""
    result = await session.execute(delete(AISPosition).where(AISPosition.timestamp < cutoff))
    return result.rowcount or 0


def default_prune_cutoff(now: datetime | None = None) -> datetime:
    return (now or datetime.now(UTC)) - timedelta(days=DEFAULT_RETENTION_DAYS)
