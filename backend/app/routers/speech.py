import uuid
import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from app.models.schemas import TTSRequest, TTSResponse, ErrorResponse
from app.middlewares.auth import get_current_auth
from app.services.websocket_manager import ws_manager, WorkerOfflineException, WorkerTimeoutException
from app.services.job_queue import job_queue
from app.core.supabase import get_supabase_admin

logger = logging.getLogger("uvicorn.error")

router = APIRouter(prefix="/v1/audio", tags=["Speech"])


@router.post(
    "/speech",
    response_model=TTSResponse,
    responses={
        503: {"model": ErrorResponse, "description": "Worker Colab Offline"},
        401: {"model": ErrorResponse, "description": "Xác thực không hợp lệ"},
        400: {"model": ErrorResponse, "description": "Dữ liệu yêu cầu không hợp lệ"}
    }
)
async def create_speech(
    payload: TTSRequest,
    auth_ctx: dict = Depends(get_current_auth)
):
    """
    Sinh âm thanh từ văn bản bằng core engine VieNeu-TTS v3 Turbo trên Colab T4.
    Yêu cầu Header Authorization: Bearer <API_KEY hoặc JWT>.
    """
    # 1. Kiểm tra trạng thái kết nối của Worker GPU
    if not ws_manager.is_connected:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "error": {
                    "code": "GPU_WORKER_OFFLINE",
                    "message": "Colab GPU chưa kết nối."
                }
            }
        )

    user_id = auth_ctx.get("user_id")
    job_uuid = str(uuid.uuid4())
    job_id = f"job_{job_uuid}"
    created_at = datetime.utcnow().isoformat() + "Z"

    # 2. Tạo bản ghi ban đầu trong Supabase DB
    supabase = get_supabase_admin()
    try:
        supabase.table("tts_jobs").insert({
            "id": job_uuid,
            "user_id": user_id,
            "input_text": payload.input,
            "voice_id": payload.voice,
            "speed": payload.speed,
            "status": "PENDING",
            "created_at": created_at
        }).execute()
    except Exception as db_err:
        logger.warning(f"Không thể ghi job ban đầu vào DB: {db_err}")

    # 3. Gửi job sang Colab Worker thông qua Job Queue & WebSocket
    try:
        worker_job_payload = {
            "job_id": job_id,
            "text": payload.input,
            "voice": payload.voice,
            "speed": payload.speed,
            "response_format": payload.response_format,
            "model": payload.model
        }

        # Đợi kết quả từ GPU Worker (mặc định timeout 90s)
        result = await job_queue.execute_job(worker_job_payload, timeout_seconds=90.0)

        audio_url = result.get("audio_url", "")
        execution_time_ms = result.get("execution_time_ms", 0)

        # 4. Cập nhật trạng thái thành công trong Database
        try:
            supabase.table("tts_jobs").update({
                "status": "COMPLETED",
                "audio_url": audio_url,
                "execution_time_ms": execution_time_ms
            }).eq("id", job_uuid).execute()
        except Exception as update_err:
            logger.warning(f"Không thể cập nhật job hoàn tất trong DB: {update_err}")

        return TTSResponse(
            job_id=job_id,
            status="COMPLETED",
            audio_url=audio_url,
            execution_time_ms=execution_time_ms,
            created_at=created_at
        )

    except WorkerOfflineException:
        # Cập nhật DB trạng thái thất bại
        try:
            supabase.table("tts_jobs").update({"status": "FAILED"}).eq("id", job_uuid).execute()
        except Exception:
            pass

        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "error": {
                    "code": "GPU_WORKER_OFFLINE",
                    "message": "Colab GPU chưa kết nối."
                }
            }
        )

    except WorkerTimeoutException:
        try:
            supabase.table("tts_jobs").update({"status": "TIMEOUT"}).eq("id", job_uuid).execute()
        except Exception:
            pass

        return JSONResponse(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            content={
                "error": {
                    "code": "WORKER_TIMEOUT",
                    "message": "Hệ thống GPU xử lý quá thời gian quy định."
                }
            }
        )

    except Exception as e:
        logger.error(f"Lỗi không xác định khi xử lý TTS Job: {e}")
        try:
            supabase.table("tts_jobs").update({"status": "FAILED"}).eq("id", job_uuid).execute()
        except Exception:
            pass

        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": {
                    "code": "SYNTHESIS_ERROR",
                    "message": f"Quá trình sinh âm thanh gặp lỗi: {str(e)}"
                }
            }
        )
