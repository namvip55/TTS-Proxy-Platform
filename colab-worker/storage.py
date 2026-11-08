import os
import io
import logging
from typing import Optional
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

logger = logging.getLogger("colab_worker")

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
BUCKET_NAME = os.getenv("SUPABASE_BUCKET", "tts-audios")


class StorageClient:
    def __init__(self):
        self.client: Optional[Client] = None
        self.init_client()

    def init_client(self):
        if not SUPABASE_URL or not SUPABASE_KEY:
            logger.warning("[Storage] SUPABASE_URL hoặc SUPABASE_KEY chưa được thiết lập!")
            return
        try:
            self.client = create_client(SUPABASE_URL, SUPABASE_KEY)
            logger.info(f"[Storage] Đã kết nối Supabase Storage Bucket: {BUCKET_NAME}")
        except Exception as e:
            logger.error(f"[Storage] Khởi tạo Supabase Client thất bại: {e}")

    def upload_audio(self, audio_bytes: bytes, file_name: str, content_type: str = "audio/mpeg") -> str:
        """
        Upload dữ liệu âm thanh trực tiếp từ bộ nhớ RAM lên Supabase Storage Bucket.
        Trả về URL công khai (Public URL).
        """
        if not self.client:
            raise RuntimeError("Supabase client chưa được khởi tạo. Vui lòng kiểm tra biến môi trường.")

        try:
            # Upload file bytes
            res = self.client.storage.from_(BUCKET_NAME).upload(
                path=file_name,
                file=audio_bytes,
                file_options={"content-type": content_type, "upsert": "true"}
            )

            # Lấy URL Public của file vừa upload
            public_url_res = self.client.storage.from_(BUCKET_NAME).get_public_url(file_name)
            public_url = public_url_res if isinstance(public_url_res, str) else public_url_res.get("publicURL", "")
            
            # Fallback nếu sdk trả dạng link trực tiếp
            if not public_url:
                clean_url = SUPABASE_URL.rstrip("/")
                public_url = f"{clean_url}/storage/v1/object/public/{BUCKET_NAME}/{file_name}"

            logger.info(f"[Storage] Upload thành công: {file_name} -> {public_url}")
            return public_url
        except Exception as e:
            logger.error(f"[Storage] Lỗi khi upload file {file_name}: {e}")
            raise e


storage_client = StorageClient()
