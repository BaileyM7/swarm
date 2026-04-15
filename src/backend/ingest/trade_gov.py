"""trade.gov / ITA (International Trade Administration) adapter — P1 scaffold.

Pulls export controls, trade advisories, and tariff actions from the US ITA.
API: https://api.trade.gov/
Requires env var: TRADE_GOV_API_KEY
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from datetime import datetime
from typing import ClassVar

from app.db.models import Event
from ingest.base import Source, RawRecord


class TradeGovSource(Source):
    """ITA trade.gov adapter (P1 — not yet implemented)."""

    name: ClassVar[str] = "trade_gov"
    display_name: ClassVar[str] = "trade.gov ITA"

    async def fetch(
        self, since: datetime, until: datetime
    ) -> AsyncIterator[RawRecord]:
        """Fetch export control and trade advisory records."""
        raise NotImplementedError("P1 — see plan.md")
        yield  # noqa: unreachable

    async def normalize(self, raw: RawRecord) -> Event:
        """Map a trade advisory to an Event."""
        raise NotImplementedError("P1 — see plan.md")
