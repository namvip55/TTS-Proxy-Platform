import logging
from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from app.models.schemas import ApiKeyCreate, ApiKeyResponse, ApiKeyCreatedResponse
from app.middlewares.auth import get_current_auth
from app.core.security import generate_api_key
from app.core.supabase import get_supabase_admin

logger = logging.getLogger("uvicorn.error")

router = APIRouter(prefix="/v1/keys", tags=["API Keys"])


@router.get("", response_model=List[ApiKeyResponse])
async def list_keys(auth_ctx: dict = Depends(get_current_auth)):
    """Lấy danh sách các API Key của người dùng hiện tại."""
    user_id = auth_ctx.get("user_id")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Chưa xác định danh tính người dùng.")

    supabase = get_supabase_admin()
    try:
        response = supabase.table("api_keys") \
            .select("id, user_id, name, key_prefix, is_active, created_at, last_used_at") \
            .eq("user_id", user_id) \
            .order("created_at", desc=True) \
            .execute()

        keys_data = response.data or []
        return [
            ApiKeyResponse(
                id=str(k["id"]),
                user_id=str(k.get("user_id")),
                name=k.get("name", "Default Key"),
                key_prefix=k.get("key_prefix", "sk_live_..."),
                is_active=k.get("is_active", True),
                created_at=k.get("created_at"),
                last_used_at=k.get("last_used_at")
            )
            for k in keys_data
        ]
    except Exception as e:
        logger.error(f"Lỗi khi lấy danh sách API Keys: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Không thể tải danh sách API Keys từ cơ sở dữ liệu."
        )


@router.post("", response_model=ApiKeyCreatedResponse)
async def create_key(
    payload: ApiKeyCreate,
    auth_ctx: dict = Depends(get_current_auth)
):
    """
    Tạo API Key mới (sk_live_...).
    CẢNH BÁO: Chuỗi raw_key đầy đủ chỉ được trả về DUY NHẤT một lần trong phản hồi này.
    """
    user_id = auth_ctx.get("user_id")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Chưa xác định danh tính người dùng.")

    raw_key, key_prefix, key_hash = generate_api_key()
    name = (payload.name or "Default Key").strip()
    created_at = datetime.utcnow().isoformat() + "Z"

    supabase = get_supabase_admin()
    try:
        insert_res = supabase.table("api_keys").insert({
            "user_id": user_id,
            "name": name,
            "key_prefix": key_prefix,
            "key_hash": key_hash,
            "is_active": True,
            "created_at": created_at
        }).execute()

        if not insert_res.data or len(insert_res.data) == 0:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Lưu API Key thất bại.")

        record = insert_res.data[0]
        return ApiKeyCreatedResponse(
            id=str(record["id"]),
            user_id=str(user_id),
            name=name,
            key_prefix=key_prefix,
            raw_key=raw_key,
            is_active=True,
            created_at=record.get("created_at", created_at),
            last_used_at=None
        )
    except Exception as e:
        logger.error(f"Lỗi tạo API Key: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi tạo API Key: {str(e)}"
        )


@router.delete("/{key_id}")
async def delete_key(key_id: str, auth_ctx: dict = Depends(get_current_auth)):
    """Thu hồi / Xóa bỏ vĩnh viễn một API Key."""
    user_id = auth_ctx.get("user_id")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Chưa xác định danh tính người dùng.")

    supabase = get_supabase_admin()
    try:
        # Kiểm tra quyền sở hữu
        res = supabase.table("api_keys") \
            .delete() \
            .eq("id", key_id) \
            .eq("user_id", user_id) \
            .execute()

        return {"success": True, "message": f"API Key {key_id} đã được thu hồi thành công."}
    except Exception as e:
        logger.error(f"Lỗi khi xóa API Key {key_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Không thể thu hồi API Key."
        )
