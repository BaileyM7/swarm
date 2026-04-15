"""MarineCadastre AIS vessel tracking adapter — P1 scaffold.

MarineCadastre.gov publishes NOAA/USCG AIS data as hourly CSV files.
Covers US coastal waters; useful for detecting unusual naval movements near
US Pacific fleet bases (Pearl Harbor, Guam).
Source: https://marinecadastre.gov/ais/
(No key required; bulk download)
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from datetime import datetime
from typing import ClassVar

from app.db.models import Event
from ingest.base import Source, RawRecord


class MarineCadastreAISSource(Source):
    """MarineCadastre AIS vessel position adapter (P1 — not yet implemented)."""

    name: ClassVar[str] = "marinecadastre_ais"
    display_name: ClassVar[str] = "MarineCadastre AIS"

    async def fetch(
        self, since: datetime, until: datetime
    ) -> AsyncIterator[RawRecord]:
        """Fetch AIS position records from MarineCadastre hourly CSVs."""
        raise NotImplementedError("P1 — see plan.md")
        yield  # noqa: unreachable

    async def normalize(self, raw: RawRecord) -> Event:
        """Map an AIS position record to an Event."""
        raise NotImplementedError("P1 — see plan.md")
