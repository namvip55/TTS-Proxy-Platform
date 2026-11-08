import logging
from typing import Optional
from urllib.parse import urlparse
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.models.schemas import HistoryListResponse, HistoryItem
from app.middlewares.auth import get_current_auth
from app.core.supabase import get_supabase_admin

logger = logging.getLogger("uvicorn.error")

router = APIRouter(prefix="/v1/history", tags=["History"])


@router.get("", response_model=HistoryListResponse)
async def get_history(
    page: int = Query(default=1, ge=1, description="Số trang hiện tại"),
    limit: int = Query(default=10, ge=1, le=100, description="Số lượng bản ghi mỗi trang"),
    auth_ctx: dict = Depends(get_current_auth)
):
    """Lấy danh sách các file audio đã sinh ra của người dùng hiện tại (hỗ trợ phân trang)."""
    user_id = auth_ctx.get("user_id")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Chưa xác định danh tính người dùng.")

    offset = (page - 1) * limit
    supabase = get_supabase_admin()

    try:
        # Lấy dữ liệu kèm count
        response = supabase.table("tts_jobs") \
            .select("*", count="exact") \
            .eq("user_id", user_id) \
            .order("created_at", desc=True) \
            .range(offset, offset + limit - 1) \
            .execute()

        total = response.count if response.count is not None else len(response.data or [])
        items = [
            HistoryItem(
                id=str(row["id"]),
                user_id=str(row.get("user_id")),
                input_text=row.get("input_text", ""),
                voice_id=row.get("voice_id", ""),
                speed=float(row.get("speed", 1.0)),
                status=row.get("status", "COMPLETED"),
                audio_url=row.get("audio_url"),
                execution_time_ms=row.get("execution_time_ms"),
                created_at=row.get("created_at") or ""
            )
            for row in (response.data or [])
        ]

        return HistoryListResponse(
            total=total,
            page=page,
            limit=limit,
            items=items
        )
    except Exception as e:
        logger.error(f"Lỗi khi lấy lịch sử TTS: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Không thể tải lịch sử TTS từ cơ sở dữ liệu."
        )


@router.delete("/{job_id}")
async def delete_history_item(job_id: str, auth_ctx: dict = Depends(get_current_auth)):
    """Xóa bản ghi lịch sử và tự động xóa file âm thanh tương ứng trên Supabase Storage."""
    user_id = auth_ctx.get("user_id")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Chưa xác định danh tính người dùng.")

    # Chuẩn hóa job_id nếu người dùng truyền dạng job_<uuid>
    clean_id = job_id.replace("job_", "") if job_id.startswith("job_") else job_id

    supabase = get_supabase_admin()
    try:
        # 1. Tìm bản ghi để lấy audio_url
        query_res = supabase.table("tts_jobs") \
            .select("id, audio_url") \
            .eq("id", clean_id) \
            .eq("user_id", user_id) \
            .limit(1) \
            .execute()

        if not query_res.data or len(query_res.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy bản ghi lịch sử này."
            )

        job_record = query_res.data[0]
        audio_url = job_record.get("audio_url")

        # 2. Xóa file trên Supabase Storage nếu tồn tại
        if audio_url:
            try:
                # Trích xuất filename từ URL dạng: .../storage/v1/object/public/tts-audios/<file_name>
                parsed_url = urlparse(audio_url)
                path_parts = parsed_url.path.split("/")
                if "tts-audios" in path_parts:
                    idx = path_parts.index("tts-audios")
                    file_path = "/".join(path_parts[idx + 1:])
                    if file_path:
                        supabase.storage.from_("tts-audios").remove([file_path])
                        logger.info(f"Đã xóa file audio trên storage: {file_path}")
            except Exception as storage_err:
                logger.warning(f"Không thể xóa file audio trên storage: {storage_err}")

        # 3. Xóa bản ghi trong Database
        supabase.table("tts_jobs").delete().eq("id", clean_id).eq("user_id", user_id).execute()

        return {"success": True, "message": f"Bản ghi {job_id} đã được xóa thành công."}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Lỗi khi xóa bản ghi lịch sử {job_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Không thể xóa bản ghi lịch sử."
        )
