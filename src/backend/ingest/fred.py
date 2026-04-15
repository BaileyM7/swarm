"""FRED (Federal Reserve Economic Data) macro data adapter — P1 scaffold.

Planned indicators: US interest rates (FEDFUNDS), CPI (CPIAUCSL),
trade deficit (BOPGSTB), and equivalent where available for slice countries.

Requires env var: FRED_API_KEY
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from datetime import datetime
from typing import ClassVar

from app.db.models import Event
from ingest.base import Source, RawRecord


class FREDSource(Source):
    """FRED macro data adapter (P1 — not yet implemented)."""

    name: ClassVar[str] = "fred"
    display_name: ClassVar[str] = "FRED Macro Data"

    async def fetch(
        self, since: datetime, until: datetime
    ) -> AsyncIterator[RawRecord]:
        """Fetch FRED time-series observations for configured series."""
        raise NotImplementedError("P1 — see plan.md")
        yield  # make this a valid async generator  # noqa: unreachable

    async def normalize(self, raw: RawRecord) -> Event:
        """Map a FRED observation to an Event."""
        raise NotImplementedError("P1 — see plan.md")
