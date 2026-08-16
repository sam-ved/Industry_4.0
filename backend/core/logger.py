import logging
import json
import sys
from datetime import datetime
from contextvars import ContextVar
import uuid

# Context variable to hold the trace ID for the current request
_trace_id_ctx_var: ContextVar[str] = ContextVar("trace_id", default="")

def get_trace_id() -> str:
    return _trace_id_ctx_var.get()

def set_trace_id(trace_id: str) -> None:
    _trace_id_ctx_var.set(trace_id)


class JSONFormatter(logging.Formatter):
    """Formatter that outputs JSON strings for structured logging."""
    
    def format(self, record: logging.LogRecord) -> str:
        log_obj = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "trace_id": get_trace_id()
        }
        
        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)
            
        # Add any extra attributes passed via the 'extra' kwarg
        if hasattr(record, "extra_data"):
            log_obj.update(record.extra_data)

        return json.dumps(log_obj)


def setup_logger(name: str = "industry_4.0") -> logging.Logger:
    logger = logging.getLogger(name)
    
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(JSONFormatter())
        logger.addHandler(handler)
        
    return logger

# Create a default logger instance for easy import
logger = setup_logger()
