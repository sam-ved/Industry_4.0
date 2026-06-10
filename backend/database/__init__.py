# backend/database/__init__.py
from .db import (
    init_db,
    add_analysis_record,
    get_analysis_history,
    get_analytics_stats,
    get_cache,
    set_cache,
    clear_old_cache,
    log_ai_insight,
    get_ai_insights,
)

__all__ = [
    "init_db",
    "add_analysis_record",
    "get_analysis_history",
    "get_analytics_stats",
    "get_cache",
    "set_cache",
    "clear_old_cache",
    "log_ai_insight",
    "get_ai_insights",
]
