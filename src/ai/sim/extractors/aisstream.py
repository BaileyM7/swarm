"""AISStream.io signal extractor.

Reads ``payload.ping_count_w_w_pct`` rows produced by the AISStream ingest
adapter and emits a per-country "week-over-week change in flagged AIS
position pings" signal when the magnitude crosses the 25% threshold.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from app.db.models import Event
from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from ai.sim.signals import Signal

# Minimum w/w% magnitude that surfaces a signal — below this we treat the
# week-over-week movement as noise and stay silent.
_NOISE_FLOOR_PCT = 25.0


class AISStreamExtractor:
    source = "AISStream"
    _SOURCE_KEY = "aisstream"

    async def extract(
        self,
        session: AsyncSession,
        iso3: str,
        *,
        window_hours: int = 24,
    ) -> Signal | None:
        since = datetime.now(UTC) - timedelta(hours=window_hours)
        stmt = (
            select(Event)
            .where(
                and_(
                    Event.source == self._SOURCE_KEY,
                    Event.ingested_at >= since,
                    or_(Event.actor_iso3 == iso3, Event.target_iso3 == iso3),
                )
            )
            .order_by(Event.occurred_at.desc())
            .limit(20)
        )
        rows = (await session.execute(stmt)).scalars().all()
        if not rows:
            return None

        best: tuple[float, Event] | None = None
        for row in rows:
            pct = (row.payload or {}).get("ping_count_w_w_pct")
            if not isinstance(pct, int | float):
                continue
            if best is None or abs(pct) > abs(best[0]):
                best = (float(pct), row)
        if best is None:
            return None
        pct, row = best
        if abs(pct) < _NOISE_FLOOR_PCT:
            return None

        flag = (row.payload or {}).get("flag_iso3", "?")
        zone = (row.payload or {}).get("zone", "watch zone")
        magnitude = round(min(1.0, abs(pct) / 200.0), 2)
        direction = "negative" if pct > 0 else "positive"
        headline = f"{flag}-flagged AIS position pings in {zone}: {pct:+.0f}% w/w"
        return Signal(
            source=self.source,
            headline=headline[:120],
            magnitude=magnitude,
            direction=direction,
            evidence_id=str(row.id),
        )
