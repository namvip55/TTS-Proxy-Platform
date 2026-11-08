# TTS PROXY PLATFORM (VIENEU-TTS ENGINE) 🎙️⚡

Nền tảng Text-to-Speech (TTS) phân tán quy mô vừa tận dụng core engine **VieNeu-TTS v3 Turbo**.

---

## 🏗️ Kiến Trúc Hệ Thống (Architecture)

```text
[ CLIENT APPS / USERS ]
       │
       ├──► Web Client (React App trên Vercel) --------┐ (Supabase JWT Token)
       │                                               │
       └──► Third-Party Apps (App ngoài) --------------┼──► [ API GATEWAY (FastAPI) ]
                                 (API Key: sk_live_...)│           │
                                                                   │ WebSocket (Reverse Connection)
                                                                   ▼
                                                       [ GPU WORKER (Colab T4) ]
                                                       - Mount Drive Cache Model
                                                       - VieNeu-TTS v3 Engine VRAM
                                                                   │
                                                                   │ Direct Upload Audio
                                                                   ▼
[ SUPABASE PLATFORM ] ◄────────────────────────────────────────────┘
- Auth: Whitelist (Tắt Public Signup)
- Database: Users, API Keys, Job History
- Storage: Public Bucket `tts-audios` (.mp3/.wav)
```

---

## 📁 Cấu Trúc Thư Mục Dự Án (Project Structure)

```text
tts-proxy-platform/
├── backend/                         # Backend FastAPI Proxy Gateway
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py            # Cấu hình biến môi trường
│   │   │   ├── security.py          # Băm/Tạo API Key sk_live_... & JWT
│   │   │   └── supabase.py          # Khởi tạo Supabase Admin Client
│   │   ├── middlewares/
│   │   │   └── auth.py              # Auth Middleware (API Key & Supabase JWT)
│   │   ├── routers/
│   │   │   ├── speech.py            # API POST /v1/audio/speech
│   │   │   ├── keys.py              # API GET/POST/DELETE /v1/keys
│   │   │   ├── history.py           # API GET/DELETE /v1/history
│   │   │   └── voices.py            # API GET /v1/voices (28+ Giọng)
│   │   ├── services/
│   │   │   ├── websocket_manager.py # Quản lý kết nối WebSocket tới Colab
│   │   │   └── job_queue.py         # Quản lý hàng đợi tác vụ GPU
│   │   └── models/
│   │       └── schemas.py           # Pydantic Schemas API
│   ├── main.py                      # FastAPI App, CORS, WebSocket /ws/worker
│   ├── .env.example
│   └── requirements.txt
│
├── colab-worker/                    # Script chạy trên Google Colab T4
│   ├── engine.py                    # Mount Drive Cache & Load VieNeu-TTS v3 Engine
│   ├── storage.py                   # Supabase Storage Client upload audio trực tiếp
│   ├── worker.py                    # WebSocket Listener nhận Job & xử lý
│   ├── VieNeu_TTS_Colab_Worker.ipynb# Notebook 1-Click trên Google Colab
│   ├── .env.example
│   └── requirements.txt
│
├── frontend/                        # Web UI Studio (React + Vite + Tailwind v4)
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/AppLayout.tsx # Sidebar, Brand & GPU Status Live
│   │   │   ├── ui/                  # Button, Card, Badge, Input
│   │   │   ├── AudioPlayer.tsx      # Trình phát nhạc chuyên nghiệp
│   │   │   └── VoiceSelector.tsx    # Bộ chọn 28+ giọng 3 miền
│   │   ├── contexts/AuthContext.tsx # Context quản lý phiên đăng nhập
│   │   ├── lib/api.ts               # Axios Client gọi Gateway
│   │   ├── lib/supabase.ts          # Supabase Client SDK
│   │   ├── pages/
│   │   │   ├── Login.tsx            # Đăng nhập Whitelist
│   │   │   ├── Studio.tsx           # TTS Studio sinh âm thanh
│   │   │   ├── History.tsx          # Quản lý & tải lịch sử phát âm
│   │   │   └── Dashboard.tsx        # Quản lý API Key & Tài liệu API
│   │   ├── types/index.ts           # Typescript Interfaces
│   │   ├── App.tsx                  # App Routes
│   │   └── main.tsx
│   ├── .env.example
│   ├── package.json
│   └── vite.config.ts
│
└── supabase/
    └── schema.sql                   # SQL Script tạo bảng, RLS & Storage policies
```

---

## 🚀 Hướng Dẫn Triển Khai Theo 5 Phase

### PHASE 1: Khởi Tạo Hạ Tầng Supabase
1. Đăng nhập [Supabase Dashboard](https://supabase.com).
2. Tạo Project mới, sao chép:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Cấu hình **Auth Whitelist**:
   - Vào **Authentication** -> **Providers** -> **Email**: **Tắt** `Enable Email Signup`.
   - Vào **Authentication** -> **Users** -> **Add User**: Tạo các email/password nội bộ được phép truy cập.
4. Cấu hình **Storage**:
   - Vào **Storage** -> **Create bucket**: Đặt tên `tts-audios`.
   - Bật tùy chọn **Public bucket** (để người dùng nghe/tải file âm thanh qua URL trực tiếp).
5. Khởi tạo Database Schema:
   - Mở **SQL Editor**, dán toàn bộ nội dung file `supabase/schema.sql` và bấm **Run**.

---

### PHASE 2: Triển Khai Colab T4 GPU Worker
1. Mở file `colab-worker/VieNeu_TTS_Colab_Worker.ipynb` trên Google Colab (chọn Runtime: **T4 GPU**).
2. Thiết lập các biến môi trường:
   ```python
   os.environ['GATEWAY_URL'] = 'wss://your-backend-gateway.com'
   os.environ['WORKER_SECRET_KEY'] = 'vieneu_worker_secret_2026'
   os.environ['SUPABASE_URL'] = 'https://your-project.supabase.co'
   os.environ['SUPABASE_KEY'] = 'your-supabase-service-role-or-anon-key'
   ```
3. Bấm **Run All**.
   - Model ~350MB tự động được tải từ HuggingFace Hub và lưu trên SSD cục bộ của Colab (`/content/hf_cache`). Tải chỉ mất 2-3 giây.
   - Worker tự động mở Reverse WebSocket tới Gateway và lắng nghe Job.

---

### PHASE 3: Khởi Động Backend FastAPI Gateway
1. Di chuyển vào thư mục backend:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Hoặc venv\Scripts\activate trên Windows
   pip install -r requirements.txt
   ```
2. Tạo file `.env` từ `.env.example`:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=ey...
   WORKER_SECRET_KEY=vieneu_worker_secret_2026
   PORT=8000
   ```
3. Khởi chạy Gateway:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```
   Xem Swagger UI tại: `http://localhost:8000/docs`.

---

### PHASE 4: Triển Khai Frontend Web App
1. Di chuyển vào thư mục frontend:
   ```bash
   cd frontend
   npm install
   ```
2. Tạo file `.env` từ `.env.example`:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=ey...
   VITE_API_GATEWAY_URL=http://localhost:8000
   ```
3. Chạy môi trường phát triển:
   ```bash
   npm run dev
   ```
   Truy cập Web Studio tại `http://localhost:5173`.
4. Deploy lên Vercel:
   - Đẩy code lên GitHub.
   - Import thư mục `frontend` vào Vercel.
   - Thêm các biến môi trường (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_GATEWAY_URL`).

---

### PHASE 5: Kiểm Thử Toàn Diện (End-to-End Testing)

#### 1. Kiểm tra API Sinh Âm Thanh (cURL)
```bash
curl -X POST "http://localhost:8000/v1/audio/speech" \
  -H "Authorization: Bearer sk_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "vieneu-v3-turbo",
    "input": "Xin chào, đây là hệ thống chuyển đổi văn bản thành giọng nói VieNeu.",
    "voice": "vi-VN-Northern-Male-1",
    "speed": 1.0,
    "response_format": "mp3"
  }'
```

#### 2. Kịch Bản Colab Disconnect (Failover)
Khi GPU Colab tắt hoặc mất mạng, Backend ngay lập tức phản hồi mã lỗi `503 Service Unavailable`:
```json
{
  "error": {
    "code": "GPU_WORKER_OFFLINE",
    "message": "Colab GPU chưa kết nối."
  }
}
```
Giao diện Web tự động hiển thị thanh cảnh báo trực quan cho người dùng.
