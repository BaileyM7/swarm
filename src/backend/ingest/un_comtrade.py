"""UN Comtrade bilateral trade flows adapter — P1 scaffold.

Pulls HS-level import/export data between the 10 slice country pairs.
API: https://comtradeapi.un.org/

Requires env var: COMTRADE_API_KEY
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from datetime import datetime
from typing import ClassVar

from app.db.models import Event
from ingest.base import Source, RawRecord


class UNComtradeSource(Source):
    """UN Comtrade bilateral trade flows adapter (P1 — not yet implemented)."""

    name: ClassVar[str] = "un_comtrade"
    display_name: ClassVar[str] = "UN Comtrade"

    async def fetch(
        self, since: datetime, until: datetime
    ) -> AsyncIterator[RawRecord]:
        """Fetch bilateral trade flow records."""
        raise NotImplementedError("P1 — see plan.md")
        yield  # noqa: unreachable

    async def normalize(self, raw: RawRecord) -> Event:
        """Map a Comtrade trade record to an Event."""
        raise NotImplementedError("P1 — see plan.md")
