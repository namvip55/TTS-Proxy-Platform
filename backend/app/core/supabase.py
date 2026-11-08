import logging
from typing import Optional
from supabase import create_client, Client
from app.core.config import settings

logger = logging.getLogger("uvicorn.error")

_supabase_client: Optional[Client] = None


def get_supabase_admin() -> Client:
    """
    Khởi tạo và trả về singleton instance của Supabase Admin Client.
    Sử dụng Service Role Key để có quyền quản trị cơ sở dữ liệu và xác thực.
    """
    global _supabase_client
    if _supabase_client is None:
        try:
            if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
                logger.warning("SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY chưa được cấu hình đầy đủ!")
            _supabase_client = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_SERVICE_ROLE_KEY
            )
            logger.info("Supabase Admin Client đã khởi tạo thành công.")
        except Exception as e:
            logger.error(f"Lỗi khởi tạo Supabase Client: {e}")
            raise e
    return _supabase_client
