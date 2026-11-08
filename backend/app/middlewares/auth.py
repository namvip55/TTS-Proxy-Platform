import logging
from typing import Dict, Any, Optional
from datetime import datetime
from fastapi import Request, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.security import hash_api_key
from app.core.supabase import get_supabase_admin

logger = logging.getLogger("uvicorn.error")
security_scheme = HTTPBearer(auto_error=False)


async def get_current_auth(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)
) -> Dict[str, Any]:
    """
    Xác thực kép: Hỗ trợ cả API Key (sk_live_...) và JWT Token từ Supabase Auth.
    Trả về dict chứa thông tin người dùng:
    - user_id: ID định danh trong Supabase
    - auth_type: 'api_key' hoặc 'jwt'
    - extra metadata...
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "MISSING_CREDENTIALS",
                "message": "Thiếu header Authorization: Bearer <API_KEY_HOAC_JWT>"
            }
        )

    token = credentials.credentials.strip()

    # TRƯỜNG HỢP 1: API KEY (sk_live_...)
    if token.startswith("sk_live_"):
        key_hash = hash_api_key(token)
        try:
            supabase = get_supabase_admin()
            response = supabase.table("api_keys") \
                .select("id, user_id, name, is_active") \
                .eq("key_hash", key_hash) \
                .limit(1) \
                .execute()

            if not response.data or len(response.data) == 0:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail={
                        "code": "INVALID_API_KEY",
                        "message": "API Key không hợp lệ hoặc không tồn tại."
                    }
                )

            key_record = response.data[0]
            if not key_record.get("is_active", True):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail={
                        "code": "API_KEY_REVOKED",
                        "message": "API Key đã bị vô hiệu hóa hoặc thu hồi."
                    }
                )

            # Cập nhật thời gian last_used_at không chặn request
            try:
                supabase.table("api_keys").update({
                    "last_used_at": datetime.utcnow().isoformat()
                }).eq("id", key_record["id"]).execute()
            except Exception as update_err:
                logger.warning(f"Không thể cập nhật last_used_at cho key {key_record['id']}: {update_err}")

            return {
                "user_id": key_record.get("user_id"),
                "auth_type": "api_key",
                "key_id": key_record.get("id"),
                "key_name": key_record.get("name")
            }
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Lỗi kiểm tra API Key với Supabase: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={"code": "DATABASE_ERROR", "message": "Lỗi hệ thống khi xác thực API Key."}
            )

    # TRƯỜNG HỢP 2: SUPABASE JWT TOKEN (Đăng nhập Web Client)
    else:
        try:
            supabase = get_supabase_admin()
            user_response = supabase.auth.get_user(token)
            if not user_response or not user_response.user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail={
                        "code": "INVALID_JWT",
                        "message": "Phiên đăng nhập JWT không hợp lệ hoặc đã hết hạn."
                    }
                )
            
            user = user_response.user
            return {
                "user_id": user.id,
                "email": user.email,
                "auth_type": "jwt"
            }
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Lỗi xác thực JWT với Supabase: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "code": "UNAUTHORIZED",
                    "message": "Xác thực phiên đăng nhập thất bại."
                }
            )


async def require_jwt_auth(
    auth_ctx: Dict[str, Any] = Depends(get_current_auth)
) -> Dict[str, Any]:
    """Chỉ cho phép người dùng đăng nhập qua JWT (dành riêng cho giao diện quản trị Web Studio)."""
    if auth_ctx.get("auth_type") != "jwt":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "JWT_REQUIRED",
                "message": "Chức năng này yêu cầu đăng nhập trực tiếp từ Web Studio."
            }
        )
    return auth_ctx
