import hashlib
import secrets
from typing import Tuple, Optional
import jwt
from app.core.config import settings


def generate_api_key() -> Tuple[str, str, str]:
    """
    Tạo API Key chuẩn dạng sk_live_<32_hex_chars>.
    Trả về tuple:
    - raw_key: Key đầy đủ hiển thị cho người dùng 1 lần duy nhất (VD: sk_live_abc123...)
    - key_prefix: Phần đầu để hiển thị nhận diện (VD: sk_live_abc...)
    - key_hash: Mã băm SHA-256 lưu an toàn trong cơ sở dữ liệu
    """
    random_part = secrets.token_hex(24)
    raw_key = f"sk_live_{random_part}"
    key_prefix = raw_key[:15]
    key_hash = hash_api_key(raw_key)
    return raw_key, key_prefix, key_hash


def hash_api_key(raw_key: str) -> str:
    """Băm API Key bằng thuật toán SHA-256."""
    return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()


def decode_jwt_token(token: str) -> Optional[dict]:
    """
    Giải mã JWT Token nếu có cấu hình SUPABASE_JWT_SECRET.
    Nếu không cấu hình secret, hàm trả về payload không verify chữ ký (dùng để trích xuất uid)
    hoặc ủy quyền cho Supabase API client xác thực.
    """
    try:
        if settings.SUPABASE_JWT_SECRET:
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False}
            )
            return payload
        else:
            # Fallback decode không verify chữ ký để lấy user ID nếu Supabase client verify sau đó
            payload = jwt.decode(
                token,
                options={"verify_signature": False}
            )
            return payload
    except Exception:
        return None
