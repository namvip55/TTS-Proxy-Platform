import asyncio
import json
import logging
from typing import Dict, Optional
from datetime import datetime
from fastapi import WebSocket, status

logger = logging.getLogger("uvicorn.error")


class WorkerOfflineException(Exception):
    """Ngoại lệ khi không có Colab Worker nào đang kết nối."""
    pass


class WorkerTimeoutException(Exception):
    """Ngoại lệ khi Worker quá thời gian phản hồi công việc."""
    pass


class WebSocketManager:
    def __init__(self):
        # Lưu kết nối WebSocket của worker (hỗ trợ 1 worker chính hoặc worker pool)
        self.active_worker: Optional[WebSocket] = None
        # Quản lý các job đang chờ kết quả: job_id -> asyncio.Future
        self.pending_jobs: Dict[str, asyncio.Future] = {}
        # Khóa an toàn bất đồng bộ
        self._lock = asyncio.Lock()
        self.last_seen: Optional[datetime] = None

    @property
    def is_connected(self) -> bool:
        """Kiểm tra xem Worker có đang online không."""
        return self.active_worker is not None

    async def connect_worker(self, websocket: WebSocket) -> bool:
        """Đăng ký kết nối WebSocket từ Colab Worker."""
        await websocket.accept()
        async with self._lock:
            if self.active_worker is not None:
                logger.warning("Đã có Worker kết nối trước đó. Thay thế bằng kết nối mới...")
                try:
                    await self.active_worker.close(code=status.WS_1000_NORMAL_CLOSURE)
                except Exception:
                    pass
            self.active_worker = websocket
            self.last_seen = datetime.utcnow()
            logger.info(">>> Colab GPU Worker ĐÃ KẾT NỐI THÀNH CÔNG! <<<")
        return True

    async def disconnect_worker(self, websocket: WebSocket):
        """Xử lý khi Worker ngắt kết nối."""
        async with self._lock:
            if self.active_worker == websocket:
                self.active_worker = None
                self.last_seen = None
                logger.warning(">>> Colab GPU Worker ĐÃ NGẮT KẾT NỐI! <<<")
                
                # Báo lỗi cho toàn bộ các job đang đợi Worker này
                for job_id, future in list(self.pending_jobs.items()):
                    if not future.done():
                        future.set_exception(WorkerOfflineException("Worker ngắt kết nối bất ngờ trong khi đang xử lý."))
                self.pending_jobs.clear()

    async def handle_worker_message(self, message_text: str):
        """Xử lý gói tin nhận được từ Colab Worker."""
        try:
            data = json.loads(message_text)
            msg_type = data.get("type")
            self.last_seen = datetime.utcnow()

            if msg_type == "PING":
                if self.active_worker:
                    await self.active_worker.send_text(json.dumps({"type": "PONG", "timestamp": self.last_seen.isoformat()}))
                return

            if msg_type == "JOB_RESULT":
                job_id = data.get("job_id")
                if job_id and job_id in self.pending_jobs:
                    future = self.pending_jobs.pop(job_id)
                    if not future.done():
                        if data.get("status") == "COMPLETED":
                            future.set_result(data)
                        else:
                            error_msg = data.get("error", "Unknown worker error")
                            future.set_exception(Exception(f"Worker synthesis failed: {error_msg}"))
                    return

            logger.info(f"Nhận tin nhắn không xác định từ Worker: {msg_type}")
        except Exception as e:
            logger.error(f"Lỗi khi parse tin nhắn từ Worker: {e}")

    async def send_job_and_wait_result(self, job_data: dict, timeout_seconds: float = 90.0) -> dict:
        """
        Gửi yêu cầu sinh audio tới Colab Worker và chờ kết quả trả về thông qua asyncio.Future.
        Nếu Worker không online -> Bắn lỗi WorkerOfflineException.
        Nếu quá thời gian quy định -> Bắn lỗi WorkerTimeoutException.
        """
        if not self.is_connected or not self.active_worker:
            raise WorkerOfflineException("Colab GPU chưa kết nối.")

        job_id = job_data.get("job_id")
        loop = asyncio.get_running_loop()
        future = loop.create_future()
        self.pending_jobs[job_id] = future

        # Định dạng gói tin gửi tới Worker
        payload = {
            "type": "JOB_REQUEST",
            "job_id": job_id,
            "text": job_data.get("text"),
            "voice": job_data.get("voice"),
            "speed": job_data.get("speed", 1.0),
            "response_format": job_data.get("response_format", "mp3")
        }

        try:
            await self.active_worker.send_text(json.dumps(payload))
            logger.info(f"Đã gửi Job {job_id} tới Colab Worker, đang đợi kết quả...")
            # Chờ kết quả bất đồng bộ từ Worker
            result = await asyncio.wait_for(future, timeout=timeout_seconds)
            return result
        except asyncio.TimeoutError:
            self.pending_jobs.pop(job_id, None)
            logger.error(f"Job {job_id} bị timeout sau {timeout_seconds} giây.")
            raise WorkerTimeoutException(f"Worker quá thời gian xử lý ({timeout_seconds}s).")
        except Exception as e:
            self.pending_jobs.pop(job_id, None)
            raise e


# Singleton instance toàn cục
ws_manager = WebSocketManager()
