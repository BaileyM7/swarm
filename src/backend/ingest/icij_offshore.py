"""ICIJ Offshore Leaks database adapter — P1 scaffold.

The ICIJ Offshore Leaks database includes Panama Papers, Pandora Papers, and
others.  We use the public CSV/API to find entities linked to slice countries.
API: https://offshoreleaks.icij.org/
(No key required; bulk CSV download)
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from datetime import datetime
from typing import ClassVar

from app.db.models import Event
from ingest.base import Source, RawRecord


class ICIJOffshoreSource(Source):
    """ICIJ Offshore Leaks adapter (P1 — not yet implemented)."""

    name: ClassVar[str] = "icij_offshore"
    display_name: ClassVar[str] = "ICIJ Offshore Leaks"

    async def fetch(
        self, since: datetime, until: datetime
    ) -> AsyncIterator[RawRecord]:
        """Fetch ICIJ entity records linked to slice-country jurisdictions."""
        raise NotImplementedError("P1 — see plan.md")
        yield  # noqa: unreachable

    async def normalize(self, raw: RawRecord) -> Event:
        """Map an offshore entity record to an Event."""
        raise NotImplementedError("P1 — see plan.md")
