"""Root conftest.py — ensures src/ is on sys.path for all test modules.

This allows both ``from app...`` (backend) and ``from shared...`` (shared)
imports to resolve correctly when running pytest from the project root,
regardless of whether the packages are installed via ``uv sync``.
"""

import sys
from pathlib import Path

# Add src/ to sys.path so `app`, `shared`, and `ai` are importable
_src = Path(__file__).parent / "src"
if str(_src) not in sys.path:
    sys.path.insert(0, str(_src))

# Also add src/backend so `app` resolves without the `backend.` prefix
_backend_src = _src / "backend"
if str(_backend_src) not in sys.path:
    sys.path.insert(0, str(_backend_src))
