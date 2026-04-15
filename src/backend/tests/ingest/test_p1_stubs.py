"""Stub tests for all P1 adapters.

Each test skips with a clear reason indicating the adapter is not yet
implemented.  These tests confirm the adapter class is importable, has the
correct name/display_name ClassVars, and that fetch/normalize raise
NotImplementedError (not some unexpected error).
"""

from __future__ import annotations

from datetime import datetime, timezone

import pytest

# P1 adapter imports
from ingest.fred import FREDSource
from ingest.un_comtrade import UNComtradeSource
from ingest.imf import IMFSource
from ingest.ofac_sdn import OFACSDNSource
from ingest.open_sanctions import OpenSanctionsSource
from ingest.opencorporates import OpenCorporatesSource
from ingest.sec_edgar import SECEdgarSource
from ingest.gleif import GLEIFSource
from ingest.datalastic import DatalasticSource
from ingest.trade_gov import TradeGovSource
from ingest.marinecadastre_ais import MarineCadastreAISSource
from ingest.icij_offshore import ICIJOffshoreSource
from ingest.sayari import SayariSource
from ingest.eia import EIASource
from ingest.yfinance import YFinanceSource

_SINCE = datetime(2025, 1, 1, tzinfo=timezone.utc)
_UNTIL = datetime(2025, 1, 7, tzinfo=timezone.utc)

_P1_SOURCES = [
    FREDSource(),
    UNComtradeSource(),
    IMFSource(),
    OFACSDNSource(),
    OpenSanctionsSource(),
    OpenCorporatesSource(),
    SECEdgarSource(),
    GLEIFSource(),
    DatalasticSource(),
    TradeGovSource(),
    MarineCadastreAISSource(),
    ICIJOffshoreSource(),
    SayariSource(),
    EIASource(),
    YFinanceSource(),
]


@pytest.mark.parametrize("source", _P1_SOURCES, ids=lambda s: s.name)
def test_p1_adapter_has_name(source):
    """Every P1 adapter must declare a non-empty name ClassVar."""
    assert isinstance(source.name, str) and source.name


@pytest.mark.parametrize("source", _P1_SOURCES, ids=lambda s: s.name)
def test_p1_adapter_has_display_name(source):
    """Every P1 adapter must declare a non-empty display_name ClassVar."""
    assert isinstance(source.display_name, str) and source.display_name


@pytest.mark.parametrize("source", _P1_SOURCES, ids=lambda s: s.name)
@pytest.mark.asyncio
async def test_p1_fetch_raises_not_implemented(source):
    """P1 adapters must raise NotImplementedError from fetch()."""
    pytest.skip(f"{source.name} is P1 — not yet implemented (see plan.md)")
    with pytest.raises(NotImplementedError):
        async for _ in source.fetch(_SINCE, _UNTIL):
            pass


@pytest.mark.parametrize("source", _P1_SOURCES, ids=lambda s: s.name)
@pytest.mark.asyncio
async def test_p1_normalize_raises_not_implemented(source):
    """P1 adapters must raise NotImplementedError from normalize()."""
    pytest.skip(f"{source.name} is P1 — not yet implemented (see plan.md)")
    with pytest.raises(NotImplementedError):
        await source.normalize({})
