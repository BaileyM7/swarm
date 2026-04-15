"""OpenSanctions entity-level sanctions adapter — P1 scaffold.

OpenSanctions aggregates 200+ sanctions lists into a unified dataset.
API: https://www.opensanctions.org/docs/api/
Requires env var: OPENSANCTIONS_API_KEY
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from datetime import datetime
from typing import ClassVar

from app.db.models import Event
from ingest.base import Source, RawRecord


class OpenSanctionsSource(Source):
    """OpenSanctions entity-level sanctions adapter (P1 — not yet implemented)."""

    name: ClassVar[str] = "open_sanctions"
    display_name: ClassVar[str] = "OpenSanctions"

    async def fetch(
        self, since: datetime, until: datetime
    ) -> AsyncIterator[RawRecord]:
        """Fetch recently added/modified sanction entities."""
        raise NotImplementedError("P1 — see plan.md")
        yield  # noqa: unreachable

    async def normalize(self, raw: RawRecord) -> Event:
        """Map a sanction entity record to an Event."""
        raise NotImplementedError("P1 — see plan.md")
