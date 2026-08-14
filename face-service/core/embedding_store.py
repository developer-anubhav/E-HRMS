"""
Embedding Store
===============
Persists face embeddings as a JSON file at face-service/data/embeddings.json.

Structure:
{
  "<employee_mongo_id>": {
    "employee_id_str": "EMP102",
    "embeddings": [[...512 floats...], ...],
    "model_version": "vggface2",
    "created_at": "2026-08-14T16:00:00Z",
    "updated_at": "2026-08-14T16:00:00Z"
  },
  ...
}

This flat JSON approach is intentional for Phase 2 (MVP).
It keeps the face-service dependency-free (no extra DB needed)
and is easy to inspect and debug.

Phase 3 (recognition) will introduce an in-memory numpy cache on startup
so similarity searches remain fast even with many employees.
"""

import json
import logging
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
import threading

logger = logging.getLogger("face-service.store")

# ---------------------------------------------------------------------------
# Store path — relative to face-service root
# ---------------------------------------------------------------------------
_STORE_DIR = Path(__file__).resolve().parent.parent / "data"
_STORE_PATH = _STORE_DIR / "embeddings.json"

# Thread lock for safe concurrent writes (FastAPI can run concurrent requests)
_lock = threading.Lock()


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _ensure_store_exists() -> None:
    """Create the data directory and empty store file if they don't exist."""
    _STORE_DIR.mkdir(parents=True, exist_ok=True)
    if not _STORE_PATH.exists():
        _STORE_PATH.write_text("{}", encoding="utf-8")


def _load_store() -> Dict[str, Any]:
    _ensure_store_exists()
    try:
        with open(_STORE_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError) as e:
        logger.error(f"Failed to read embedding store: {e}")
        return {}


def _save_store(data: Dict[str, Any]) -> None:
    _ensure_store_exists()
    with open(_STORE_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def save_profile(
    employee_id: str,
    employee_id_str: str,
    embeddings: List[List[float]],
    model_version: str = "vggface2",
) -> None:
    """
    Save (or replace) the face profile for the given employee.
    employee_id      : MongoDB _id string (used as key)
    employee_id_str  : Human-readable ID like "EMP102" (stored as metadata)
    embeddings       : List of 512-dim float lists
    """
    with _lock:
        store = _load_store()
        now = _now_iso()

        existing = store.get(employee_id)
        created_at = existing["created_at"] if existing else now

        store[employee_id] = {
            "employee_id_str": employee_id_str,
            "embeddings": embeddings,
            "model_version": model_version,
            "created_at": created_at,
            "updated_at": now,
        }

        _save_store(store)

    logger.info(
        f"Saved {len(embeddings)} embedding(s) for employee {employee_id} ({employee_id_str})"
    )


def load_profile(employee_id: str) -> Optional[Dict[str, Any]]:
    """Return the full profile dict for the given employee, or None if not found."""
    store = _load_store()
    return store.get(employee_id)


def profile_exists(employee_id: str) -> bool:
    """Return True if a face profile exists for the given employee."""
    store = _load_store()
    return employee_id in store


def delete_profile(employee_id: str) -> bool:
    """
    Delete the face profile for the given employee.
    Returns True if deleted, False if it did not exist.
    """
    with _lock:
        store = _load_store()
        if employee_id not in store:
            return False
        del store[employee_id]
        _save_store(store)

    logger.info(f"Deleted face profile for employee {employee_id}")
    return True


def load_all_profiles() -> Dict[str, Any]:
    """Return the full embedding store (used for batch recognition in Phase 3)."""
    return _load_store()
