"""GLEIF (Global LEI Foundation) legal entity identifier adapter — P1 scaffold.

Pulls LEI records and relationship data (parent-child corporate hierarchy) for
entities in slice countries.  Useful for mapping financial exposure.
API: https://api.gleif.org/api/v1/
(no key required)
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from datetime import datetime
from typing import ClassVar

from app.db.models import Event
from ingest.base import Source, RawRecord


class GLEIFSource(Source):
    """GLEIF legal entity identifier adapter (P1 — not yet implemented)."""

    name: ClassVar[str] = "gleif"
    display_name: ClassVar[str] = "GLEIF LEI Registry"

    async def fetch(
        self, since: datetime, until: datetime
    ) -> AsyncIterator[RawRecord]:
        """Fetch recently updated LEI records for slice-country entities."""
        raise NotImplementedError("P1 — see plan.md")
        yield  # noqa: unreachable

    async def normalize(self, raw: RawRecord) -> Event:
        """Map a LEI record change to an Event."""
        raise NotImplementedError("P1 — see plan.md")
