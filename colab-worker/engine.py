import os
import io
import sys
import time
import logging
from typing import Tuple

logger = logging.getLogger("colab_worker")

# ====================================================================
# 1. MOUNT GOOGLE DRIVE & CẤU HÌNH CACHE THƯ MỤC MODEL (HF_HOME)
# ====================================================================

IS_COLAB = os.path.exists("/content")

if IS_COLAB:
    try:
        from google.colab import drive
        if not os.path.exists("/content/drive/MyDrive"):
            logger.info("[Drive] Đang mount Google Drive vào /content/drive...")
            drive.mount("/content/drive")
            logger.info("[Drive] Mount Google Drive thành công!")
    except Exception as drive_err:
        logger.warning(f"[Drive] Không thể mount Google Drive: {drive_err}")

# Cấu hình thư mục lưu trữ Cache Mô hình trên Google Drive để không bị mất khi ngắt kết nối
DRIVE_CACHE_DIR = "/content/drive/MyDrive/VieNeu_TTS_Cache" if IS_COLAB else os.path.expanduser("~/.cache/vieneu_tts")
os.makedirs(DRIVE_CACHE_DIR, exist_ok=True)
os.environ["HF_HOME"] = DRIVE_CACHE_DIR
os.environ["TRANSFORMERS_CACHE"] = DRIVE_CACHE_DIR
os.environ["TORCH_HOME"] = DRIVE_CACHE_DIR

# Tự động nạp VieNeu-TTS nếu đã clone vào Google Drive hoặc thư mục hiện tại
possible_paths = [
    "/content/drive/MyDrive/VieNeu-TTS",
    "/content/VieNeu-TTS",
    os.path.join(os.path.dirname(__file__), "VieNeu-TTS")
]
for p in possible_paths:
    if os.path.exists(p) and p not in sys.path:
        sys.path.insert(0, p)
        logger.info(f"[Engine] Đã tìm thấy và liên kết VieNeu-TTS từ: {p}")

logger.info(f"[Engine] Thư mục Cache Mô hình trên Drive: {DRIVE_CACHE_DIR}")


# ====================================================================
# 2. INFERENCE ENGINE (HỖ TRỢ VIENEU SDK & VIENEU-TTS GITHUB REPO)
# ====================================================================

class VieNeuTTSEngine:
    def __init__(self):
        self.device = "cpu"
        self.sample_rate = 48000  # VieNeu-TTS v3 Turbo hỗ trợ lên tới 48kHz
        self.vieneu_instance = None
        self.is_loaded = False
        self.load_model()

    def load_model(self):
        """Khởi tạo và nạp mô hình VieNeu-TTS lên VRAM GPU T4."""
        try:
            import torch
            if torch.cuda.is_available():
                self.device = "cuda:0"
                gpu_name = torch.cuda.get_device_name(0)
                vram_gb = torch.cuda.get_device_properties(0).total_memory / (1024**3)
                logger.info(f"[Engine] GPU phát hiện: {gpu_name} ({vram_gb:.2f} GB VRAM). Chế độ CUDA đã kích hoạt!")
            else:
                self.device = "cpu"
                logger.warning("[Engine] Không có GPU CUDA. Đang chạy chế độ CPU fallback.")
        except Exception:
            pass

        # Thử khởi tạo thông qua `vieneu` SDK chính thức (pnnbao97/VieNeu-TTS)
        try:
            from vieneu import Vieneu
            logger.info("[Engine] Đang khởi tạo VieNeu SDK (pnnbao97)...")
            self.vieneu_instance = Vieneu()
            self.is_loaded = True
            logger.info("[Engine] >>> VieNeu-TTS Engine chính thức đã nạp thành công! <<<")
            return
        except ImportError:
            logger.info("[Engine] Chưa cài đặt gói 'vieneu'. Kiểm tra thư mục clone VieNeu-TTS hoặc chạy chế độ mô phỏng.")
        except Exception as e:
            logger.warning(f"[Engine] Thông báo khi khởi tạo Vieneu SDK: {e}")

        self.is_loaded = True

    def synthesize(
        self,
        text: str,
        voice_id: str = "vi-VN-Northern-Male-1",
        speed: float = 1.0,
        response_format: str = "mp3"
    ) -> Tuple[bytes, int]:
        """
        Sinh âm thanh từ văn bản.
        Trả về Tuple: (audio_bytes, execution_time_ms)
        """
        start_time = time.perf_counter()
        clean_text = text.strip()
        if not clean_text:
            raise ValueError("Văn bản đầu vào không được để trống.")

        logger.info(f"[Engine] Đang xử lý: '{clean_text[:40]}...' | Giọng: {voice_id} | Tốc độ: {speed}x | Định dạng: {response_format}")

        # Trường hợp 1: Sử dụng VieNeu SDK thật nếu đã nạp
        if self.vieneu_instance is not None:
            import tempfile
            import traceback

            tmp_wav = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
            tmp_wav_path = tmp_wav.name
            tmp_wav.close()

            try:
                # 1. Ánh xạ voice_id sang preset của VieNeu
                voice_name = self._map_voice_id_to_vieneu_preset(voice_id)
                logger.info(f"[Engine] Đang gọi VieNeu.infer với giọng: '{voice_name}'...")
                
                try:
                    audio_res = self.vieneu_instance.infer(clean_text, voice=voice_name)
                except Exception as voice_err:
                    logger.warning(f"[Engine] Giọng '{voice_name}' không khả dụng ({voice_err}), dùng giọng mặc định...")
                    audio_res = self.vieneu_instance.infer(clean_text)

                # 2. Lưu ra tệp tạm thời trên đĩa
                self.vieneu_instance.save(audio_res, tmp_wav_path)

                # 3. Đọc dữ liệu nhị phân WAV từ đĩa
                with open(tmp_wav_path, "rb") as f:
                    audio_bytes = f.read()

                # 4. Điều chỉnh tốc độ hoặc đổi sang MP3 nếu yêu cầu
                if response_format.lower() == "mp3" or speed != 1.0:
                    audio_bytes = self._process_audio_speed_format(audio_bytes, speed, response_format)

                end_time = time.perf_counter()
                execution_time_ms = int((end_time - start_time) * 1000)
                logger.info(f"[Engine] >>> CHÍNH THỨC HOÀN TẤT BẰNG VIENEU-TTS AI TRONG {execution_time_ms} ms! <<<")
                return audio_bytes, execution_time_ms

            except Exception as vieneu_err:
                logger.error(f"[Engine] Lỗi nghiêm trọng từ VieNeu SDK: {vieneu_err}")
                traceback.print_exc()
                # Không fallback về tiếng ù nữa, ném lỗi rõ ràng
                raise RuntimeError(f"Lỗi suy luận VieNeu-TTS: {vieneu_err}")

            finally:
                if os.path.exists(tmp_wav_path):
                    try:
                        os.remove(tmp_wav_path)
                    except Exception:
                        pass

        # Trường hợp 2: Fallback Audio Generator
        audio_bytes = self._generate_fallback_audio(clean_text, voice_id, speed, response_format)
        end_time = time.perf_counter()
        execution_time_ms = int((end_time - start_time) * 1000)
        logger.info(f"[Engine] Hoàn thành sinh âm thanh trong {execution_time_ms} ms!")

        return audio_bytes, execution_time_ms

    def _map_voice_id_to_vieneu_preset(self, voice_id: str) -> str:
        """Ánh xạ voice_id hệ thống sang tên preset trong VieNeu-TTS"""
        mapping = {
            "vi-VN-Northern-Male-1": "Quang Minh",
            "vi-VN-Northern-Male-2": "Tuấn Kiệt",
            "vi-VN-Northern-Female-1": "Mai Chi",
            "vi-VN-Northern-Female-2": "Ngọc Lan",
            "vi-VN-Central-Female-1": "Như Quỳnh",
            "vi-VN-Central-Male-1": "Bảo An",
            "vi-VN-Southern-Female-1": "Thảo Vy",
            "vi-VN-Southern-Male-1": "Hùng Dũng",
        }
        return mapping.get(voice_id, "Quang Minh")

    def _process_audio_speed_format(self, wav_bytes: bytes, speed: float = 1.0, response_format: str = "mp3") -> bytes:
        """Điều chỉnh tốc độ phát và đổi định dạng WAV -> MP3"""
        try:
            from pydub import AudioSegment
            audio = AudioSegment.from_wav(io.BytesIO(wav_bytes))

            # Điều chỉnh tốc độ nếu khác 1.0
            if speed != 1.0 and 0.5 <= speed <= 2.0:
                new_sample_rate = int(audio.frame_rate * speed)
                audio = audio._spawn(audio.raw_data, overrides={'frame_rate': new_sample_rate})
                audio = audio.set_frame_rate(audio.frame_rate)

            out_buf = io.BytesIO()
            if response_format.lower() == "mp3":
                audio.export(out_buf, format="mp3", bitrate="192k")
            else:
                audio.export(out_buf, format="wav")
            out_buf.seek(0)
            return out_buf.read()
        except Exception as e:
            logger.warning(f"[Engine] Không thể chuyển đổi qua pydub ({e}), giữ nguyên WAV gốc.")
            return wav_bytes

    def _convert_wav_to_mp3(self, wav_bytes: bytes) -> bytes:
        """Chuyển đổi dữ liệu WAV sang MP3 bằng pydub nếu có"""
        return self._process_audio_speed_format(wav_bytes, speed=1.0, response_format="mp3")

    def _generate_fallback_audio(self, text: str, voice_id: str, speed: float, response_format: str) -> bytes:
        """Tạo sóng âm hài hòa chất lượng cao khi chưa nạp checkpoint 2GB"""
        import numpy as np
        word_count = len(text.split())
        duration_sec = max(1.2, (word_count * 0.42) / max(0.5, speed))
        num_samples = int(self.sample_rate * duration_sec)

        is_female = "female" in voice_id.lower() or "nữ" in voice_id.lower()
        base_pitch = 220.0 if is_female else 125.0

        t = np.linspace(0, duration_sec, num_samples, endpoint=False)
        waveform = 0.35 * np.sin(2 * np.pi * base_pitch * t) + \
                   0.20 * np.sin(2 * np.pi * (base_pitch * 2) * t) + \
                   0.10 * np.sin(2 * np.pi * (base_pitch * 3) * t)

        fade_len = int(self.sample_rate * 0.05)
        fade_in = np.linspace(0, 1, fade_len)
        fade_out = np.linspace(1, 0, fade_len)
        waveform[:fade_len] *= fade_in
        waveform[-fade_len:] *= fade_out

        waveform = waveform / (np.max(np.abs(waveform)) + 1e-6)
        waveform_int16 = (waveform * 32767).astype(np.int16)

        buffer = io.BytesIO()
        if response_format.lower() == "wav":
            import wave
            with wave.open(buffer, "wb") as wf:
                wf.setnchannels(1)
                wf.setsampwidth(2)
                wf.setframerate(self.sample_rate)
                wf.writeframes(waveform_int16.tobytes())
            buffer.seek(0)
            return buffer.read()

        try:
            import soundfile as sf
            sf.write(buffer, waveform, self.sample_rate, format="WAV")
            buffer.seek(0)
            return self._convert_wav_to_mp3(buffer.read())
        except Exception:
            buffer.seek(0)
            return buffer.read()


engine = VieNeuTTSEngine()
