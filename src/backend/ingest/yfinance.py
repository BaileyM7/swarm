"""yfinance market data adapter — P1 scaffold.

Pulls equity indices, currency pairs, and defense-sector stocks for the slice
countries.  Market data can serve as a real-time proxy for geopolitical risk
perception (e.g., TAIEX selloff = Taiwan risk elevated).
Library: yfinance (no API key required; Yahoo Finance scrape)
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from datetime import datetime
from typing import ClassVar

from app.db.models import Event
from ingest.base import Source, RawRecord


# Tickers of interest for the 10 slice countries
SLICE_TICKERS: dict[str, list[str]] = {
    "CHN": ["000001.SS", "KWEB"],           # Shanghai Composite, KraneShares CSI Internet
    "TWN": ["^TWII", "TSM"],               # TAIEX, TSMC
    "USA": ["^GSPC", "LMT", "RTX"],        # S&P 500, Lockheed, Raytheon
    "JPN": ["^N225", "DFEN"],              # Nikkei
    "KOR": ["^KS11"],                      # KOSPI
    "IND": ["^BSESN"],                     # SENSEX
    "AUS": ["^AXJO"],                      # ASX 200
    "RUS": ["IMOEX.ME"],                   # Moscow Exchange (may be suspended)
    "PRK": [],                             # No public market
    "PHL": ["PSEi.PS"],                    # Philippine Stock Exchange
}

CURRENCY_PAIRS: list[str] = [
    "USDCNY=X", "USDTWD=X", "USDJPY=X", "USDKRW=X",
    "USDINR=X", "USDPHP=X", "USDAUD=X",
]


class YFinanceSource(Source):
    """yfinance market data adapter (P1 — not yet implemented)."""

    name: ClassVar[str] = "yfinance"
    display_name: ClassVar[str] = "Yahoo Finance (yfinance)"

    async def fetch(
        self, since: datetime, until: datetime
    ) -> AsyncIterator[RawRecord]:
        """Fetch OHLCV data for slice tickers and currency pairs."""
        raise NotImplementedError("P1 — see plan.md")
        yield  # noqa: unreachable

    async def normalize(self, raw: RawRecord) -> Event:
        """Map a market data bar to an Event."""
        raise NotImplementedError("P1 — see plan.md")
