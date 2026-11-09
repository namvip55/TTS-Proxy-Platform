import uuid
import math
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
        402: {"description": "Không đủ credit để thực hiện yêu cầu"},
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
    Quy đổi: 1 Credit = 5 chữ (Words).
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

    # 2. Tính số từ và lượng credit tiêu hao (1 credit = 5 chữ)
    input_text = payload.input.strip()
    words = input_text.split()
    word_count = len(words)
    # Tối thiểu 1 credit
    credit_cost = max(1, math.ceil(word_count / 5))

    supabase = get_supabase_admin()

    # 3. Kiểm tra số dư credit của người dùng
    user_balance = 0
    if user_id:
        try:
            res = supabase.table("user_credits").select("credit_balance").eq("user_id", user_id).limit(1).execute()
            if res.data and len(res.data) > 0:
                user_balance = res.data[0].get("credit_balance", 0)
            else:
                # Nếu tài khoản mới chưa có record trong user_credits, khởi tạo với 1000 credit
                supabase.table("user_credits").insert({
                    "user_id": user_id,
                    "tier": "normal",
                    "credit_balance": 1000,
                    "total_used_credits": 0
                }).execute()
                user_balance = 1000

            if user_balance < credit_cost:
                return JSONResponse(
                    status_code=status.HTTP_402_PAYMENT_REQUIRED,
                    content={
                        "error": {
                            "code": "INSUFFICIENT_CREDITS",
                            "message": f"Tài khoản của bạn không đủ credit. Yêu cầu {credit_cost} credit ({word_count} chữ), nhưng số dư hiện tại chỉ còn {user_balance} credit. Vui lòng nạp thêm gói cước để tiếp tục.",
                            "required_credits": credit_cost,
                            "current_balance": user_balance,
                            "word_count": word_count
                        }
                    }
                )
        except Exception as check_err:
            logger.warning(f"Lỗi kiểm tra credit của user {user_id}: {check_err}")

    job_uuid = str(uuid.uuid4())
    job_id = f"job_{job_uuid}"
    created_at = datetime.utcnow().isoformat() + "Z"

    # 4. Tạo bản ghi ban đầu trong Supabase DB
    try:
        supabase.table("tts_jobs").insert({
            "id": job_uuid,
            "user_id": user_id,
            "input_text": payload.input,
            "voice_id": payload.voice,
            "speed": payload.speed,
            "status": "PENDING",
            "word_count": word_count,
            "credit_cost": credit_cost,
            "created_at": created_at
        }).execute()
    except Exception as db_err:
        logger.warning(f"Không thể ghi job ban đầu vào DB: {db_err}")

    # 5. Gửi job sang Colab Worker thông qua Job Queue & WebSocket
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

        # 6. Cập nhật trạng thái thành công trong Database
        try:
            supabase.table("tts_jobs").update({
                "status": "COMPLETED",
                "audio_url": audio_url,
                "execution_time_ms": execution_time_ms
            }).eq("id", job_uuid).execute()
        except Exception as update_err:
            logger.warning(f"Không thể cập nhật job hoàn tất trong DB: {update_err}")

        # 7. Trừ credit của người dùng sau khi sinh thành công
        if user_id:
            try:
                # Ưu tiên gọi function rpc deduct_user_credits
                rpc_res = supabase.rpc("deduct_user_credits", {
                    "p_user_id": user_id,
                    "p_credits": credit_cost,
                    "p_job_id": job_uuid,
                    "p_description": f"Sinh giọng nói ({word_count} chữ, {credit_cost} Credit)"
                }).execute()
                logger.info(f"Đã trừ {credit_cost} credit của user {user_id}: {rpc_res.data}")
            except Exception as deduct_err:
                logger.warning(f"RPC deduct_user_credits thất bại: {deduct_err}, fallback trừ trực tiếp.")
                try:
                    new_bal = max(0, user_balance - credit_cost)
                    supabase.table("user_credits").update({
                        "credit_balance": new_bal
                    }).eq("user_id", user_id).execute()
                    supabase.table("credit_transactions").insert({
                        "user_id": user_id,
                        "amount": -credit_cost,
                        "balance_after": new_bal,
                        "type": "USAGE_TTS",
                        "job_id": job_uuid,
                        "description": f"Sinh giọng nói ({word_count} từ, {credit_cost} Credit)"
                    }).execute()
                except Exception as fb_err:
                    logger.error(f"Fallback trừ credit thất bại: {fb_err}")

        return TTSResponse(
            job_id=job_id,
            status="COMPLETED",
            audio_url=audio_url,
            execution_time_ms=execution_time_ms,
            created_at=created_at
        )

    except WorkerOfflineException:
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
