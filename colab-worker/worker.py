import os
import json
import asyncio
import logging
from urllib.parse import quote
import websockets
from dotenv import load_dotenv

from engine import engine
from storage import storage_client

load_dotenv()

# Cấu hình logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [Worker %(levelname)s] %(message)s"
)
logger = logging.getLogger("colab_worker")

# Đọc cấu hình từ biến môi trường
GATEWAY_URL = os.getenv("GATEWAY_URL", "http://localhost:8000")
# Chuyển http(s) -> ws(s)
if GATEWAY_URL.startswith("https://"):
    WS_BASE_URL = GATEWAY_URL.replace("https://", "wss://")
elif GATEWAY_URL.startswith("http://"):
    WS_BASE_URL = GATEWAY_URL.replace("http://", "ws://")
elif GATEWAY_URL.startswith("ws://") or GATEWAY_URL.startswith("wss://"):
    WS_BASE_URL = GATEWAY_URL
else:
    WS_BASE_URL = f"ws://{GATEWAY_URL}"

WS_ENDPOINT = f"{WS_BASE_URL.rstrip('/')}/ws/worker"
WORKER_SECRET_KEY = os.getenv("WORKER_SECRET_KEY", "vieneu_worker_secret_2026")
RECONNECT_DELAY = 5  # Giây


async def send_heartbeat(ws):
    """Gửi ping định kỳ 20 giây một lần để giữ kết nối WebSocket không bị timeout/drop."""
    try:
        while True:
            await asyncio.sleep(20)
            if ws.open:
                await ws.send(json.dumps({"type": "PING"}))
    except asyncio.CancelledError:
        pass
    except Exception as e:
        logger.warning(f"Lỗi khi gửi Heartbeat: {e}")


async def handle_job(ws, job_payload: dict):
    """Xử lý yêu cầu tạo âm thanh từ Gateway."""
    job_id = job_payload.get("job_id", "unknown_job")
    text = job_payload.get("text", "")
    voice = job_payload.get("voice", "vi-VN-Northern-Male-1")
    speed = float(job_payload.get("speed", 1.0))
    response_format = job_payload.get("response_format", "mp3")

    logger.info(f">>> [Job {job_id}] Bắt đầu xử lý: '{text[:30]}...' | {voice} | {speed}x <<<")

    try:
        # 1. Sinh âm thanh bằng VieNeu-TTS v3 Turbo engine
        audio_bytes, execution_time_ms = engine.synthesize(
            text=text,
            voice_id=voice,
            speed=speed,
            response_format=response_format
        )

        # 2. Upload file trực tiếp lên Supabase Storage bucket tts-audios
        ext = "wav" if response_format.lower() == "wav" else "mp3"
        content_type = "audio/wav" if ext == "wav" else "audio/mpeg"
        file_name = f"{job_id}.{ext}"

        audio_url = storage_client.upload_audio(
            audio_bytes=audio_bytes,
            file_name=file_name,
            content_type=content_type
        )

        # 3. Gửi thông báo hoàn tất về Gateway
        result_payload = {
            "type": "JOB_RESULT",
            "job_id": job_id,
            "status": "COMPLETED",
            "audio_url": audio_url,
            "execution_time_ms": execution_time_ms
        }
        await ws.send(json.dumps(result_payload))
        logger.info(f">>> [Job {job_id}] HOÀN THÀNH VÀ ĐÃ GỬI PHẢN HỒI ({execution_time_ms}ms) <<<")

    except Exception as e:
        logger.error(f">>> [Job {job_id}] XỬ LÝ THẤT BẠI: {e} <<<")
        fail_payload = {
            "type": "JOB_RESULT",
            "job_id": job_id,
            "status": "FAILED",
            "error": str(e)
        }
        try:
            await ws.send(json.dumps(fail_payload))
        except Exception as send_err:
            logger.error(f"Không thể gửi thông báo lỗi về Gateway: {send_err}")


async def worker_loop():
    """Vòng lặp duy trì kết nối WebSocket liên tục (Auto-Reconnect)."""
    # Gắn token vào query string
    encoded_token = quote(WORKER_SECRET_KEY)
    full_ws_url = f"{WS_ENDPOINT}?token={encoded_token}"

    while True:
        logger.info(f"Đang kết nối tới TTS Gateway tại: {WS_ENDPOINT} ...")
        heartbeat_task = None
        try:
            async with websockets.connect(
                full_ws_url,
                ping_interval=None,  # Quản lý ping thủ công
                close_timeout=10,
                max_size=20 * 1024 * 1024  # Cho phép gói tin lớn nếu cần
            ) as ws:
                logger.info(">>> KẾT NỐI TỚI GATEWAY THÀNH CÔNG! ĐANG LẮNG NGHE JOB... <<<")
                heartbeat_task = asyncio.create_task(send_heartbeat(ws))

                async for message in ws:
                    try:
                        data = json.loads(message)
                        msg_type = data.get("type")

                        if msg_type == "WELCOME":
                            logger.info(f"Gateway chào mừng: {data.get('message')}")
                        elif msg_type == "PONG":
                            pass  # Keepalive thành công
                        elif msg_type == "JOB_REQUEST":
                            # Xử lý job bất đồng bộ
                            asyncio.create_task(handle_job(ws, data))
                        else:
                            logger.debug(f"Tin nhắn không xác định: {data}")
                    except json.JSONDecodeError:
                        logger.warning(f"Nhận tin nhắn không phải JSON: {message}")

        except websockets.exceptions.InvalidStatusCode as code_err:
            logger.error(f"Bị từ chối kết nối (Mã lỗi {code_err.status_code}). Kiểm tra WORKER_SECRET_KEY!")
        except (websockets.exceptions.ConnectionClosedError, websockets.exceptions.ConnectionClosedOK):
            logger.warning("Gateway đóng kết nối.")
        except Exception as e:
            logger.error(f"Mất kết nối hoặc không thể kết nối tới Gateway: {e}")
        finally:
            if heartbeat_task and not heartbeat_task.done():
                heartbeat_task.cancel()

        logger.info(f"Thử kết nối lại sau {RECONNECT_DELAY} giây...")
        await asyncio.sleep(RECONNECT_DELAY)


if __name__ == "__main__":
    logger.info("=====================================================")
    logger.info("  KHỞI ĐỘNG COLAB T4 GPU WORKER (VIENEU-TTS ENGINE)  ")
    logger.info("=====================================================")
    try:
        asyncio.run(worker_loop())
    except KeyboardInterrupt:
        logger.info("Worker dừng theo yêu cầu của người dùng.")
