"""EIA (US Energy Information Administration) adapter — P1 scaffold.

Pulls petroleum supply, LNG trade flows, and strategic reserve data.
Energy is a key leverage vector in the Taiwan scenario (China imports ~75% of
its oil through the Malacca Strait).
API: https://api.eia.gov/v2/
Requires env var: EIA_API_KEY
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from datetime import datetime
from typing import ClassVar

from app.db.models import Event
from ingest.base import Source, RawRecord


class EIASource(Source):
    """EIA energy data adapter (P1 — not yet implemented)."""

    name: ClassVar[str] = "eia"
    display_name: ClassVar[str] = "EIA Energy Data"

    async def fetch(
        self, since: datetime, until: datetime
    ) -> AsyncIterator[RawRecord]:
        """Fetch EIA energy supply and trade flow data for slice countries."""
        raise NotImplementedError("P1 — see plan.md")
        yield  # noqa: unreachable

    async def normalize(self, raw: RawRecord) -> Event:
        """Map an EIA observation to an Event."""
        raise NotImplementedError("P1 — see plan.md")
