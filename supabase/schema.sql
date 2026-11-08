-- ====================================================================
-- SUPABASE SCHEMA SETUP FOR TTS PROXY PLATFORM (VIENEU-TTS ENGINE)
-- ====================================================================

-- 1. Bảng lưu API Keys của Developer
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    key_hash TEXT NOT NULL UNIQUE,
    key_prefix VARCHAR(15) NOT NULL,
    name VARCHAR(100) DEFAULT 'Default Key',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    last_used_at TIMESTAMP WITH TIME ZONE
);

-- Index cho tra cứu nhanh API key hash
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON public.api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);

-- 2. Bảng lưu Lịch sử Công việc Sinh Audio (TTS Jobs)
CREATE TABLE IF NOT EXISTS public.tts_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    input_text TEXT NOT NULL,
    voice_id VARCHAR(50) NOT NULL,
    speed FLOAT DEFAULT 1.0,
    status VARCHAR(20) DEFAULT 'PENDING',
    audio_url TEXT,
    execution_time_ms INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Index cho tra cứu lịch sử theo user và thời gian
CREATE INDEX IF NOT EXISTS idx_tts_jobs_user_id ON public.tts_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_tts_jobs_created_at ON public.tts_jobs(created_at DESC);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- Kích hoạt RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tts_jobs ENABLE ROW LEVEL SECURITY;

-- Policy cho bảng api_keys: Người dùng chỉ xem/quản lý key của chính mình
CREATE POLICY "Users can manage their own api_keys"
    ON public.api_keys
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy cho bảng tts_jobs: Người dùng chỉ xem/xóa lịch sử của chính mình
CREATE POLICY "Users can view their own tts_jobs"
    ON public.tts_jobs
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tts_jobs"
    ON public.tts_jobs
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Service Role (Backend Server) có quyền truy cập toàn quyền (bỏ qua RLS theo mặc định của Supabase)

-- ====================================================================
-- STORAGE BUCKET CONFIGURATION INSTRUCTIONS:
-- 1. Vào Supabase Dashboard -> Storage -> New Bucket
-- 2. Tên bucket: 'tts-audios'
-- 3. Đánh dấu 'Public bucket' (cho phép nghe và tải trực tiếp file mp3/wav)
-- ====================================================================
