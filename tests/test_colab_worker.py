import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "colab-worker")))

def test_engine_synthesis():
    from engine import engine
    print("[TEST COLAB 1] Engine VieNeu-TTS v3 Turbo da khoi tao.")
    audio_bytes, exec_ms = engine.synthesize("Xin chào Việt Nam", voice_id="vi-VN-Northern-Male-1", speed=1.0, response_format="wav")
    print(f"[TEST COLAB 2] Sinh am thanh thanh cong ({len(audio_bytes)} bytes trong {exec_ms} ms).")
    assert len(audio_bytes) > 0, "Audio bytes phai lon hon 0"
    assert exec_ms >= 0

if __name__ == "__main__":
    test_engine_synthesis()
    print("Colab worker test OK!")
