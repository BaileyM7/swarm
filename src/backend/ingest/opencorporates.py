"""OpenCorporates corporate registry adapter — P1 scaffold.

Pulls company filings and ownership data for entities linked to the slice
countries.  Useful for identifying state-owned enterprise activity.
API: https://api.opencorporates.com/
Requires env var: OPENCORPORATES_API_KEY
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from datetime import datetime
from typing import ClassVar

from app.db.models import Event
from ingest.base import Source, RawRecord


class OpenCorporatesSource(Source):
    """OpenCorporates corporate registry adapter (P1 — not yet implemented)."""

    name: ClassVar[str] = "opencorporates"
    display_name: ClassVar[str] = "OpenCorporates"

    async def fetch(
        self, since: datetime, until: datetime
    ) -> AsyncIterator[RawRecord]:
        """Fetch recent corporate filings for slice-country entities."""
        raise NotImplementedError("P1 — see plan.md")
        yield  # noqa: unreachable

    async def normalize(self, raw: RawRecord) -> Event:
        """Map a corporate filing to an Event."""
        raise NotImplementedError("P1 — see plan.md")
