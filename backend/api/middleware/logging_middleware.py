import time
import uuid
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from backend.core.logger import set_trace_id, logger

class LoggingAndTraceMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Generate a unique trace ID for this request
        trace_id = str(uuid.uuid4())
        set_trace_id(trace_id)
        
        # Attach trace_id to request state so routes can access it if needed
        request.state.trace_id = trace_id
        
        start_time = time.time()
        
        logger.info(
            "Incoming request", 
            extra={"extra_data": {"method": request.method, "url": str(request.url)}}
        )
        
        try:
            response = await call_next(request)
            
            process_time = (time.time() - start_time) * 1000
            
            logger.info(
                "Request completed", 
                extra={"extra_data": {"status_code": response.status_code, "processing_time_ms": process_time}}
            )
            
            # Add trace ID and processing time to response headers
            response.headers["X-Trace-ID"] = trace_id
            response.headers["X-Processing-Time"] = str(process_time)
            
            return response
            
        except Exception as e:
            process_time = (time.time() - start_time) * 1000
            logger.error(
                "Request failed with unhandled exception", 
                extra={"extra_data": {"error": str(e), "processing_time_ms": process_time}},
                exc_info=True
            )
            raise
