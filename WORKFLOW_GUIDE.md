# 📖 QUY TRÌNH KHỞI ĐỘNG HỆ THỐNG (DAILY WORKFLOW GUIDE)
> **Tài liệu hướng dẫn cá nhân dành riêng cho Nam:** Các bước thực hiện mỗi khi bạn muốn bật hệ thống VieNeu-TTS để sử dụng hoặc làm việc.

---

## 🎯 Tổng Quan Hệ Thống Của Bạn
* **Frontend Web Studio (Vercel):** Đã chạy 24/7 trên mạng tại `https://tts-proxy-platform.vercel.app` (Không cần bật gì ở máy).
* **Supabase (Cơ sở dữ liệu & Storage):** Đã chạy 24/7 trên Cloud (Không cần bật gì ở máy).
* **Mỗi lần muốn tạo âm thanh AI, bạn CHỈ CẦN BẬT 2 THÀNH PHẦN:**
  1. Máy tính của bạn: Bật **Cloudflare Tunnel** & **FastAPI Backend**.
  2. Google Colab: Bật **Colab T4 Worker**.

---

## ⚡ CÁC BƯỚC KHỞI ĐỘNG (Chỉ mất 1 - 2 phút)

### BƯỚC 1: Bật Cloudflare Tunnel (Cửa sổ Terminal 1 trên máy)
Colab cần 1 đường dẫn công khai để kết nối về máy bạn:
1. Mở cửa sổ **Terminal / PowerShell (Cửa sổ 1)**.
2. Gõ lệnh:
   ```bash
   npx cloudflared tunnel --url http://localhost:8000
   ```
3. Màn hình sẽ xuất hiện 1 dòng link kết thúc bằng `.trycloudflare.com`, ví dụ:
   ```text
   https://wish-morgan-dimensions-shaft.trycloudflare.com
   ```
   👉 **Copy lại đường link này và GIỮ NGUYÊN terminal này không tắt.**

---

### BƯỚC 2: Bật Backend API Gateway (Cửa sổ Terminal 2 trên máy)
1. Mở thêm một cửa sổ **Terminal / PowerShell (Cửa sổ 2)** tại thư mục dự án `tts-proxy-platform`.
2. Gõ lệnh:
   ```bash
   cd backend
   python -m uvicorn main:app --reload --port 8000
   ```
3. Màn hình báo `Application startup complete` là Backend đã sẵn sàng!

---

### BƯỚC 3: Khởi Động Colab T4 GPU Worker
1. Mở tệp notebook `colab-worker/VieNeu_TTS_Colab_Worker.ipynb` (trong VSCode hoặc trên Google Colab Web).
2. Kiểm tra Kernel đã chọn **Google Colab (GPU T4)**.
3. Cuộn đến **BƯỚC 4**:
   - Nếu đường link Cloudflare ở Bước 1 thay đổi, hãy dán link mới vào:
   ```python
   # Đổi https:// thành wss://
   os.environ['GATEWAY_URL'] = 'wss://<link-cloudflare-o-buoc-1>.trycloudflare.com'
   os.environ['WORKER_SECRET_KEY'] = 'vieneu_worker_secret_2026'
   os.environ['SUPABASE_URL'] = 'https://pkxvjllzkbblfnkswjth.supabase.co'
   os.environ['SUPABASE_KEY'] = 'sb_secret_YOUR_SUPABASE_SERVICE_ROLE_KEY'
   os.environ['SUPABASE_BUCKET'] = 'tts-audios'
   ```
4. Bấm nút **Run All** (hoặc bấm Play lần lượt từ Bước 1 đến Bước 5).
   - Nhờ lưu trữ trên SSD cục bộ của Colab, quá trình tải và nạp model vào VRAM GPU chỉ mất **3–5 giây**.
   - Tại ô Bước 5 xuất hiện dòng:
     ```text
     >>> KẾT NỐI TỚI GATEWAY THÀNH CÔNG! ĐANG LẮNG NGHE JOB... <<<
     ```
   - Cùng lúc đó, tại Terminal Backend ở máy bạn sẽ báo:
     ```text
     INFO: >>> Colab GPU Worker ĐÃ KẾT NỐI THÀNH CÔNG! <<<
     ```

---

### BƯỚC 4: Sử Dụng Trên Web Studio
1. Mở trình duyệt vào link:
   👉 **[https://tts-proxy-platform.vercel.app](https://tts-proxy-platform.vercel.app)**
2. Nhìn góc trên bên trái: Đèn **`Colab T4 GPU`** đã báo màu **Xanh (ONLINE)** 🟢!
3. Nhập văn bản tiếng Việt -> Chọn 1 trong 28 giọng đọc yêu thích -> Bấm **"Tạo âm thanh ngay"**!
4. Nghe thử trên thanh phát nhạc hoặc bấm nút **Tải xuống (.mp3/.wav)**.

---

## 🛑 KHI DÙNG XONG (Cách tắt an toàn)
1. **Ở máy tính:** Bấm `Ctrl + C` ở 2 cửa sổ Terminal (Cloudflare và Backend) để tắt.
2. **Ở Colab:** Bấm nút **Dừng (■)** ở ô Bước 5, hoặc chọn menu **Runtime -> Disconnect and delete runtime** để giải phóng GPU miễn phí cho lần sau.

---

## 🛠️ XỬ LÝ NHANH KHI GẶP LỖI THƯỜNG GẶP

| Hiện tượng | Nguyên nhân | Cách khắc phục |
| :--- | :--- | :--- |
| **Đèn GPU báo OFFLINE** | Colab chưa chạy ô Bước 5 hoặc mạng rớt | Mở Colab bấm chạy lại ô Bước 5 (`await worker_loop()`). |
| **Báo lỗi 503 khi bấm tạo audio** | Gateway chưa thấy Worker kết nối | Kiểm tra xem link Cloudflare ở Bước 4 trên Colab đã đúng với link đang chạy ở máy chưa. |
| **Không nghe được tiếng** | Chưa bật loa hoặc tệp tải chưa xong | Kiểm tra âm lượng trên AudioPlayer của Web Studio. |
