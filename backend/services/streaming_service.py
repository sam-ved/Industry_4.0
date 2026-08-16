import asyncio
from fastapi import WebSocket, WebSocketDisconnect
from typing import List, Dict, Any
from backend.core.logger import logger
from backend.services.universal_pipeline import universal_pipeline

class StreamingService:
    """
    Manages WebSocket connections and streams real-time inference results.
    """
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")

    async def broadcast(self, message: Dict[str, Any]):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting to client: {e}")
                self.disconnect(connection)

    async def process_video_stream(self, websocket: WebSocket):
        """
        Receives frames, runs them through the universal pipeline, 
        and streams back results in real-time.
        """
        await self.connect(websocket)
        try:
            while True:
                # Expecting image frame as bytes
                frame_bytes = await websocket.receive_bytes()
                
                # Non-blocking async wrapper around the pipeline could be added here
                # For now, we call the synchronous pipeline directly
                result = universal_pipeline.process_cv(frame_bytes, domain="video_stream")
                
                await websocket.send_json(result)
                
        except WebSocketDisconnect:
            self.disconnect(websocket)
        except Exception as e:
            logger.error(f"Error processing stream: {e}", exc_info=True)
            self.disconnect(websocket)

streaming_service = StreamingService()
