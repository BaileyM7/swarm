"""Datalastic vessel tracking adapter — P1 scaffold.

Datalastic provides AIS (Automatic Identification System) vessel positions and
port calls.  For Swarm we track military-adjacent vessels (tankers, cargo ships,
naval auxiliaries) in the South China Sea / Taiwan Strait AOI.
API: https://datalastic.com/api-reference/
Requires env var: DATALASTIC_API_KEY
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from datetime import datetime
from typing import ClassVar

from app.db.models import Event
from ingest.base import Source, RawRecord


class DatalasticSource(Source):
    """Datalastic vessel tracking adapter (P1 — not yet implemented)."""

    name: ClassVar[str] = "datalastic"
    display_name: ClassVar[str] = "Datalastic AIS"

    async def fetch(
        self, since: datetime, until: datetime
    ) -> AsyncIterator[RawRecord]:
        """Fetch vessel position / port call events in the AOI."""
        raise NotImplementedError("P1 — see plan.md")
        yield  # noqa: unreachable

    async def normalize(self, raw: RawRecord) -> Event:
        """Map a vessel position record to an Event."""
        raise NotImplementedError("P1 — see plan.md")
