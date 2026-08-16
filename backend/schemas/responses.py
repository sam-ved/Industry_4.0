from typing import Any, Optional, Dict, List
from pydantic import BaseModel, Field
from datetime import datetime
import uuid


class StandardResponse(BaseModel):
    status: str = Field(..., description="Response status ('success', 'error', 'pending')")
    message: str = Field(..., description="Human-readable message")
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    processing_time: float = Field(0.0, description="Time taken to process the request in milliseconds")
    trace_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    data: Optional[Any] = Field(None, description="The main payload of the response")
    warnings: List[str] = Field(default_factory=list, description="Any warnings generated during processing")
    recommendations: List[str] = Field(default_factory=list, description="Actionable recommendations")


class ErrorResponse(StandardResponse):
    status: str = "error"
    error_code: Optional[str] = Field(None, description="Specific error code if applicable")
    details: Optional[Dict[str, Any]] = Field(None, description="Detailed error information")
