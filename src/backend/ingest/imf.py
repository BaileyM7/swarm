"""IMF World Economic Outlook adapter — P1 scaffold.

Pulls WEO indicators: current account balance, forex reserves, inflation.
API: https://www.imf.org/en/Publications/WEO/weo-database/2024/October/download-entire-database
(no key required; bulk download)
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from datetime import datetime
from typing import ClassVar

from app.db.models import Event
from ingest.base import Source, RawRecord


class IMFSource(Source):
    """IMF World Economic Outlook adapter (P1 — not yet implemented)."""

    name: ClassVar[str] = "imf"
    display_name: ClassVar[str] = "IMF World Economic Outlook"

    async def fetch(
        self, since: datetime, until: datetime
    ) -> AsyncIterator[RawRecord]:
        """Fetch IMF WEO indicators for slice countries."""
        raise NotImplementedError("P1 — see plan.md")
        yield  # noqa: unreachable

    async def normalize(self, raw: RawRecord) -> Event:
        """Map an IMF observation to an Event."""
        raise NotImplementedError("P1 — see plan.md")
