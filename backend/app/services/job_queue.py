import asyncio
import logging
from typing import Dict, Any
from app.services.websocket_manager import ws_manager

logger = logging.getLogger("uvicorn.error")


class JobQueueManager:
    """
    Quản lý hàng đợi tác vụ xử lý TTS.
    Sử dụng Semaphore để giới hạn số lượng tác vụ GPU đồng thời (tránh tràn VRAM T4).
    """
    def __init__(self, max_concurrent_jobs: int = 2):
        self.semaphore = asyncio.Semaphore(max_concurrent_jobs)
        self.active_count = 0
        self._lock = asyncio.Lock()

    async def execute_job(self, job_data: Dict[str, Any], timeout_seconds: float = 90.0) -> Dict[str, Any]:
        """Đưa job vào hàng đợi và đợi Semaphore cấp phát tài nguyên GPU."""
        async with self.semaphore:
            async with self._lock:
                self.active_count += 1
            try:
                result = await ws_manager.send_job_and_wait_result(job_data, timeout_seconds=timeout_seconds)
                return result
            finally:
                async with self._lock:
                    self.active_count = max(0, self.active_count - 1)


job_queue = JobQueueManager(max_concurrent_jobs=2)
