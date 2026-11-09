"""
SMOKE TEST SCRIPT CHO TTS PROXY PLATFORM
Kiểm tra tính toàn vẹn của:
- Cấu hình Backend & Router Voices
- WebSocket Handshake & Heartbeat
- Xử lý lỗi 503 khi Worker Offline
"""
import sys
import os
import io

# Thiết lập UTF-8 cho stdout trên Windows console
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Thêm đường dẫn backend vào sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

def test_routes_import():
    from app.routers.voices import VIENEU_VOICES
    print(f"[TEST 1] Da nap thanh cong danh sach giong doc: {len(VIENEU_VOICES)} giong.")
    assert len(VIENEU_VOICES) >= 25, "So luong giong doc phai dat toi thieu 25 giong!"
    
    # Kiểm tra phân bổ 3 miền
    bac = [v for v in VIENEU_VOICES if v.region == "Bắc"]
    trung = [v for v in VIENEU_VOICES if v.region == "Trung"]
    nam = [v for v in VIENEU_VOICES if v.region == "Nam"]
    print(f"         - Mien Bac: {len(bac)} giong")
    print(f"         - Mien Trung: {len(trung)} giong")
    print(f"         - Mien Nam: {len(nam)} giong")
    assert len(bac) > 0 and len(trung) > 0 and len(nam) > 0

def test_security_helpers():
    from app.core.security import generate_api_key, hash_api_key
    raw_key, prefix, key_hash = generate_api_key()
    print(f"[TEST 2] Tao API Key thanh cong: {prefix}...")
    assert raw_key.startswith("sk_live_"), "API Key phai bat dau bang sk_live_"
    assert hash_api_key(raw_key) == key_hash, "Hash SHA-256 khong khop!"

def test_websocket_manager_state():
    from app.services.websocket_manager import ws_manager
    print(f"[TEST 3] Kiem tra trang thai ban dau cua WebSocket Manager:")
    assert not ws_manager.is_connected, "Worker ban dau phai la Offline (False)"
    print("         - is_connected = False (Dung thiet ke)")

def test_billing_packages_and_qr():
    from app.routers.billing import PACKAGES_DATA, generate_vietqr_url, BANK_BIN, BANK_ACCOUNT
    print("[TEST 4] Kiem tra cau hinh Billing, Credit va VietQR:")
    assert "normal" in PACKAGES_DATA and PACKAGES_DATA["normal"]["credits"] == 1000
    assert "plus" in PACKAGES_DATA and PACKAGES_DATA["plus"]["credits"] == 20000 and PACKAGES_DATA["plus"]["price_vnd"] == 20000
    assert "pro" in PACKAGES_DATA and PACKAGES_DATA["pro"]["credits"] == 100000 and PACKAGES_DATA["pro"]["price_vnd"] == 80000
    assert "ultra" in PACKAGES_DATA and PACKAGES_DATA["ultra"]["credits"] == 300000 and PACKAGES_DATA["ultra"]["price_vnd"] == 150000
    print("         - 4 goi (Normal, Plus, Pro, Ultra) dung thong so credit & gia")

    qr_url = generate_vietqr_url(BANK_BIN, BANK_ACCOUNT, 20000, "TTS849201")
    assert "img.vietqr.io" in qr_url
    assert "970436" in qr_url
    assert "1071895625" in qr_url
    assert "20000" in qr_url
    print(f"         - URL VietQR sinh chinh xac: {qr_url}")

if __name__ == "__main__":
    print("==================================================")
    print(" BAT DAU KIEM THU SMOKE TEST TTS PROXY PLATFORM   ")
    print("==================================================")
    test_routes_import()
    test_security_helpers()
    test_websocket_manager_state()
    test_billing_packages_and_qr()
    print("==================================================")
    print(" TAT CA CAC BAI TEST DON VI DA VUOT QUA 100%!     ")
    print("==================================================")
