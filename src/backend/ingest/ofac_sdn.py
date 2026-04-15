"""OFAC SDN (Specially Designated Nationals) list adapter — P1 scaffold.

Downloads the OFAC SDN XML/CSV feed and emits Events for newly added or
removed designations affecting the 10 slice countries.
Feed: https://www.treasury.gov/ofac/downloads/sdn.xml (no key required)
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from datetime import datetime
from typing import ClassVar

from app.db.models import Event
from ingest.base import Source, RawRecord


class OFACSDNSource(Source):
    """OFAC SDN list change adapter (P1 — not yet implemented)."""

    name: ClassVar[str] = "ofac_sdn"
    display_name: ClassVar[str] = "OFAC SDN List"

    async def fetch(
        self, since: datetime, until: datetime
    ) -> AsyncIterator[RawRecord]:
        """Fetch OFAC SDN XML and yield designation events."""
        raise NotImplementedError("P1 — see plan.md")
        yield  # noqa: unreachable

    async def normalize(self, raw: RawRecord) -> Event:
        """Map an SDN designation to an Event."""
        raise NotImplementedError("P1 — see plan.md")
