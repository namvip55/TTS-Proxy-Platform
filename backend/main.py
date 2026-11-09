import json
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.services.websocket_manager import ws_manager
from app.services.job_queue import job_queue
from app.routers import speech, keys, history, voices, billing

# Cấu hình logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("backend")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Khởi động {settings.PROJECT_NAME} v{settings.VERSION}")
    logger.info(f"Môi trường: {settings.ENVIRONMENT}")
    yield
    logger.info("Đang tắt hệ thống TTS Proxy Gateway...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Cổng API Gateway & Proxy phân tán cho mô hình VieNeu-TTS v3 Turbo kết nối GPU Colab T4.",
    lifespan=lifespan
)

# Cấu hình CORS linh hoạt hỗ trợ mọi domain Vercel và Localhost
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Đăng ký các Router API
app.include_router(speech.router)
app.include_router(voices.router)
app.include_router(keys.router)
app.include_router(history.router)
app.include_router(billing.router)


@app.get("/", tags=["Health"])
async def root():
    return {
        "platform": "TTS Proxy Platform (VieNeu-TTS Engine)",
        "version": settings.VERSION,
        "docs_url": "/docs",
        "gpu_worker_connected": ws_manager.is_connected
    }


@app.get("/health", tags=["Health"])
@app.get("/v1/status", tags=["Health"])
async def health_check():
    """Kiểm tra trạng thái sức khỏe của Gateway và tình trạng kết nối Colab Worker GPU."""
    return {
        "status": "healthy",
        "gpu_worker": {
            "connected": ws_manager.is_connected,
            "last_seen": ws_manager.last_seen.isoformat() if ws_manager.last_seen else None,
            "active_jobs": job_queue.active_count
        }
    }


# ====================================================================
# WEBSOCKET ENDPOINT DÀNH CHO COLAB T4 GPU WORKER (REVERSE CONNECTION)
# ====================================================================

@app.websocket("/ws/worker")
async def websocket_worker_endpoint(
    websocket: WebSocket,
    token: str = Query(default="", description="Worker authentication secret token")
):
    """
    Kênh WebSocket kết nối 2 chiều giữa Gateway và Colab T4 Worker.
    Yêu cầu tham số token khớp với WORKER_SECRET_KEY đã cấu hình.
    """
    if token != settings.WORKER_SECRET_KEY:
        logger.warning(f"Từ chối kết nối WebSocket từ Worker do token không hợp lệ: {token}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid Worker Secret Token")
        return

    # Kết nối thành công
    await ws_manager.connect_worker(websocket)
    try:
        # Gửi thông điệp chào mừng và yêu cầu xác thực sẵn sàng
        await websocket.send_text(json.dumps({
            "type": "WELCOME",
            "message": "Connected to TTS Gateway successfully.",
            "server_time": ws_manager.last_seen.isoformat() if ws_manager.last_seen else None
        }))

        while True:
            data = await websocket.receive_text()
            await ws_manager.handle_worker_message(data)
    except WebSocketDisconnect:
        logger.info("Worker WebSocket bị ngắt kết nối bởi client.")
        await ws_manager.disconnect_worker(websocket)
    except Exception as e:
        logger.error(f"Lỗi trong phiên WebSocket Worker: {e}")
        await ws_manager.disconnect_worker(websocket)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
