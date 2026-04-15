"""Sayari Graph (corporate intelligence) adapter — P1 scaffold.

Sayari provides entity resolution and supply-chain risk intelligence.
Used to trace beneficial ownership and hidden connections between slice-country
entities.
API: https://docs.sayari.com/
Requires env vars:
  SAYARI_API_KEY        — client_id equivalent for OAuth2 client_credentials
  SAYARI_CLIENT_SECRET  — client secret for OAuth2 client_credentials

Auth flow (for the eventual implementation)
-------------------------------------------
POST https://api.sayari.com/oauth/token
  grant_type=client_credentials
  client_id=<SAYARI_API_KEY>
  client_secret=<SAYARI_CLIENT_SECRET>
→ bearer token → ``Authorization: Bearer <token>`` on subsequent calls.
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from datetime import datetime
from typing import ClassVar

from app.db.models import Event
from ingest.base import Source, RawRecord


class SayariSource(Source):
    """Sayari Graph corporate intelligence adapter (P1 — not yet implemented)."""

    name: ClassVar[str] = "sayari"
    display_name: ClassVar[str] = "Sayari Graph"

    async def fetch(
        self, since: datetime, until: datetime
    ) -> AsyncIterator[RawRecord]:
        """Fetch corporate relationship and ownership records."""
        raise NotImplementedError("P1 — see plan.md")
        yield  # noqa: unreachable

    async def normalize(self, raw: RawRecord) -> Event:
        """Map a corporate relationship record to an Event."""
        raise NotImplementedError("P1 — see plan.md")
