"""SEC EDGAR filings adapter — P1 scaffold.

Monitors 8-K, 20-F, and SC 13G/13D filings from or mentioning slice-country
entities (e.g., Chinese ADRs, Taiwan Semiconductor filings).
API: https://efts.sec.gov/LATEST/search-index?q=...&dateRange=custom
(no key required; rate limit 10 req/s)
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from datetime import datetime
from typing import ClassVar

from app.db.models import Event
from ingest.base import Source, RawRecord


class SECEdgarSource(Source):
    """SEC EDGAR filings adapter (P1 — not yet implemented)."""

    name: ClassVar[str] = "sec_edgar"
    display_name: ClassVar[str] = "SEC EDGAR"

    async def fetch(
        self, since: datetime, until: datetime
    ) -> AsyncIterator[RawRecord]:
        """Fetch EDGAR full-text search results for slice-country keywords."""
        raise NotImplementedError("P1 — see plan.md")
        yield  # noqa: unreachable

    async def normalize(self, raw: RawRecord) -> Event:
        """Map an EDGAR filing to an Event."""
        raise NotImplementedError("P1 — see plan.md")
