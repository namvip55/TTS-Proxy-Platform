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
    word_count INT DEFAULT 0,
    credit_cost INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_tts_jobs_user_id ON public.tts_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_tts_jobs_created_at ON public.tts_jobs(created_at DESC);

-- ====================================================================
-- 3. HỆ THỐNG GÓI CƯỚC, CREDIT & NẠP TIỀN (VIETQR)
-- ====================================================================

-- 3.1. Bảng định nghĩa các gói cước (Packages)
-- Quy đổi: 1 Credit = 5 chữ (Words)
-- Normal (Miễn phí): 1,000 credit (~5,000 chữ) - 0đ
-- Plus: 20,000 credit (~100,000 chữ) - 20,000đ
-- Pro: 100,000 credit (~500,000 chữ) - 80,000đ
-- Ultra: 300,000 credit (~1,500,000 chữ) - 150,000đ
CREATE TABLE IF NOT EXISTS public.credit_packages (
    id VARCHAR(20) PRIMARY KEY, -- 'normal', 'plus', 'pro', 'ultra'
    name VARCHAR(50) NOT NULL,
    credits BIGINT NOT NULL,
    price_vnd INT NOT NULL,
    words_equivalent BIGINT NOT NULL,
    badge VARCHAR(50),
    description TEXT,
    is_popular BOOLEAN DEFAULT false,
    features JSONB DEFAULT '[]'::jsonb,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Khởi tạo dữ liệu 4 gói chuẩn
INSERT INTO public.credit_packages (id, name, credits, price_vnd, words_equivalent, badge, description, is_popular, sort_order, features)
VALUES
    ('normal', 'Gói Miễn Phí', 1000, 0, 5000, 'Miễn phí', 'Dành cho người mới trải nghiệm chất lượng giọng đọc AI.', false, 1, 
     '["1.000 Credit khởi tạo (~5.000 từ)", "Toàn bộ giọng đọc Bắc - Trung - Nam", "Độ trễ tiêu chuẩn", "Xuất file MP3 & WAV"]'::jsonb),
    
    ('plus', 'Gói Plus', 20000, 20000, 100000, 'Khởi đầu tốt', 'Phù hợp làm video ngắn, podcast và đọc tin tức hàng ngày.', false, 2,
     '["20.000 Credit (~100.000 từ)", "Chỉ 1đ / 1 credit", "Không giới hạn số lần tạo", "Tốc độ xử lý ưu tiên nhẹ", "Hỗ trợ xuất API"]'::jsonb),
    
    ('pro', 'Gói Pro', 100000, 80000, 500000, 'Phổ biến nhất', 'Lựa chọn hàng đầu cho các nhà sáng tạo nội dung YouTube/TikTok chuyên nghiệp.', true, 3,
     '["100.000 Credit (~500.000 từ)", "Tiết kiệm 20% chi phí", "Ưu tiên hàng đợi cao cấp", "Tạo nhiều API Keys cho dự án", "Băng thông tải không giới hạn"]'::jsonb),
    
    ('ultra', 'Gói Ultra', 300000, 150000, 1500000, 'Tiết kiệm 50%', 'Dành cho studio sản xuất sách nói, doanh nghiệp và agency nội dung số.', false, 4,
     '["300.000 Credit (~1.500.000 từ)", "Giá tốt nhất chỉ 0.5đ / credit", "Tốc độ phản hồi tức thì", "Hàng đợi ưu tiên VIP cao nhất", "Hỗ trợ kỹ thuật 24/7"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    credits = EXCLUDED.credits,
    price_vnd = EXCLUDED.price_vnd,
    words_equivalent = EXCLUDED.words_equivalent,
    badge = EXCLUDED.badge,
    description = EXCLUDED.description,
    is_popular = EXCLUDED.is_popular,
    sort_order = EXCLUDED.sort_order,
    features = EXCLUDED.features;

-- 3.2. Bảng quản lý ví Credit & Hạng tài khoản người dùng
CREATE TABLE IF NOT EXISTS public.user_credits (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tier VARCHAR(20) NOT NULL DEFAULT 'normal', -- 'normal', 'plus', 'pro', 'ultra'
    credit_balance BIGINT NOT NULL DEFAULT 1000, -- Mặc định tặng 1000 credit
    total_used_credits BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_user_credits_tier ON public.user_credits(tier);

-- 3.3. Bảng quản lý Đơn nạp tiền qua Mã QR (VietQR - Vietcombank)
CREATE TABLE IF NOT EXISTS public.payment_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_code VARCHAR(32) NOT NULL UNIQUE, -- Nội dung chuyển khoản duy nhất (VD: TTS849201)
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email VARCHAR(255),
    package_id VARCHAR(20) NOT NULL REFERENCES public.credit_packages(id),
    amount_vnd INT NOT NULL,
    credits_granted BIGINT NOT NULL,
    target_tier VARCHAR(20) NOT NULL,
    bank_bin VARCHAR(20) NOT NULL DEFAULT '970436', -- Vietcombank BIN
    bank_name VARCHAR(50) NOT NULL DEFAULT 'Vietcombank',
    bank_account VARCHAR(50) NOT NULL DEFAULT '1071895625',
    transfer_content VARCHAR(50) NOT NULL, -- Nội dung giao dịch để sinh QR (trùng với order_code)
    qr_data_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'WAITING_APPROVAL', 'COMPLETED', 'CANCELLED', 'EXPIRED'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_payment_orders_user_id ON public.payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_code ON public.payment_orders(order_code);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON public.payment_orders(status);

-- 3.4. Bảng Lịch sử Biến động Credit (Ledger)
CREATE TABLE IF NOT EXISTS public.credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount BIGINT NOT NULL, -- Dương (+) nếu nạp, Âm (-) nếu trừ do dùng TTS
    balance_after BIGINT NOT NULL,
    type VARCHAR(30) NOT NULL, -- 'INITIAL_FREE', 'TOPUP', 'USAGE_TTS', 'REFUND'
    order_id UUID REFERENCES public.payment_orders(id) ON DELETE SET NULL,
    job_id UUID REFERENCES public.tts_jobs(id) ON DELETE SET NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_credit_tx_user_id ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_tx_created_at ON public.credit_transactions(created_at DESC);

-- ====================================================================
-- 4. DATABASE FUNCTIONS & TRIGGERS
-- ====================================================================

-- 4.1. Tự động cấp 1.000 Credit và gói Normal khi User mới tạo tài khoản
CREATE OR REPLACE FUNCTION public.handle_new_user_credits()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_credits (user_id, tier, credit_balance, total_used_credits)
    VALUES (NEW.id, 'normal', 1000, 0)
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public.credit_transactions (user_id, amount, balance_after, type, description)
    VALUES (NEW.id, 1000, 1000, 'INITIAL_FREE', 'Tặng 1.000 Credit miễn phí khi kích hoạt tài khoản');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Đăng ký trigger trên auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_credits();

-- 4.2. Stored Function: Trừ credit an toàn (Atomic deduction)
CREATE OR REPLACE FUNCTION public.deduct_user_credits(
    p_user_id UUID,
    p_credits BIGINT,
    p_job_id UUID DEFAULT NULL,
    p_description TEXT DEFAULT 'Sử dụng dịch vụ sinh giọng nói TTS'
)
RETURNS JSONB AS $$
DECLARE
    v_current_balance BIGINT;
    v_new_balance BIGINT;
BEGIN
    -- Khóa bản ghi để tránh Race Condition
    SELECT credit_balance INTO v_current_balance
    FROM public.user_credits
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        -- Nếu chưa có bản ghi, tạo mới với 1000 credit khởi tạo
        INSERT INTO public.user_credits (user_id, tier, credit_balance, total_used_credits)
        VALUES (p_user_id, 'normal', 1000, 0);
        v_current_balance := 1000;
    END IF;

    IF v_current_balance < p_credits THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'INSUFFICIENT_CREDITS',
            'current_balance', v_current_balance,
            'required_credits', p_credits
        );
    END IF;

    v_new_balance := v_current_balance - p_credits;

    UPDATE public.user_credits
    SET 
        credit_balance = v_new_balance,
        total_used_credits = total_used_credits + p_credits,
        updated_at = timezone('utc'::text, now())
    WHERE user_id = p_user_id;

    -- Ghi nhật ký biến động
    INSERT INTO public.credit_transactions (
        user_id,
        amount,
        balance_after,
        type,
        job_id,
        description
    ) VALUES (
        p_user_id,
        -p_credits,
        v_new_balance,
        'USAGE_TTS',
        p_job_id,
        p_description
    );

    RETURN jsonb_build_object(
        'success', true,
        'deducted', p_credits,
        'new_balance', v_new_balance
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4.3. Stored Function: Hoàn tất đơn nạp tiền (Cộng credit + Nâng tier)
CREATE OR REPLACE FUNCTION public.complete_payment_order(
    p_order_code TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_order RECORD;
    v_new_balance BIGINT;
    v_tier_order INT;
    v_current_tier VARCHAR(20);
BEGIN
    SELECT * INTO v_order
    FROM public.payment_orders
    WHERE order_code = p_order_code
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'ORDER_NOT_FOUND');
    END IF;

    IF v_order.status = 'COMPLETED' THEN
        RETURN jsonb_build_object('success', true, 'already_completed', true, 'order', row_to_json(v_order));
    END IF;

    -- Cập nhật trạng thái đơn thành COMPLETED
    UPDATE public.payment_orders
    SET 
        status = 'COMPLETED',
        completed_at = timezone('utc'::text, now())
    WHERE id = v_order.id;

    -- Lấy thông tin user credits hiện tại
    SELECT tier, credit_balance INTO v_current_tier, v_new_balance
    FROM public.user_credits
    WHERE user_id = v_order.user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        v_current_tier := 'normal';
        v_new_balance := 0;
        INSERT INTO public.user_credits (user_id, tier, credit_balance)
        VALUES (v_order.user_id, 'normal', 0);
    END IF;

    v_new_balance := v_new_balance + v_order.credits_granted;

    -- Nâng tier nếu gói nạp có cấp độ cao hơn
    -- Hierarchy: ultra > pro > plus > normal
    IF v_order.target_tier = 'ultra' OR 
       (v_order.target_tier = 'pro' AND v_current_tier != 'ultra') OR
       (v_order.target_tier = 'plus' AND v_current_tier NOT IN ('pro', 'ultra')) THEN
        v_current_tier := v_order.target_tier;
    END IF;

    UPDATE public.user_credits
    SET 
        credit_balance = v_new_balance,
        tier = v_current_tier,
        updated_at = timezone('utc'::text, now())
    WHERE user_id = v_order.user_id;

    -- Ghi nhật ký cộng credit
    INSERT INTO public.credit_transactions (
        user_id,
        amount,
        balance_after,
        type,
        order_id,
        description
    ) VALUES (
        v_order.user_id,
        v_order.credits_granted,
        v_new_balance,
        'TOPUP',
        v_order.id,
        'Nạp thành công đơn ' || v_order.order_code || ' (' || v_order.credits_granted || ' Credit)'
    );

    RETURN jsonb_build_object(
        'success', true,
        'order_code', v_order.order_code,
        'credits_added', v_order.credits_granted,
        'new_balance', v_new_balance,
        'tier', v_current_tier
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tts_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Policy API Keys
CREATE POLICY "Users can manage their own api_keys"
    ON public.api_keys FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy TTS Jobs
CREATE POLICY "Users can view their own tts_jobs"
    ON public.tts_jobs FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tts_jobs"
    ON public.tts_jobs FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- Policy Credit Packages (Mọi người kể cả unauthenticated đều được xem bảng giá)
CREATE POLICY "Anyone can view active credit packages"
    ON public.credit_packages FOR SELECT
    TO anon, authenticated
    USING (true);

-- Policy User Credits (Người dùng chỉ xem số dư của mình)
CREATE POLICY "Users can view their own credit balance"
    ON public.user_credits FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

-- Policy Payment Orders (Người dùng chỉ xem và tạo đơn của mình)
CREATE POLICY "Users can view their own payment orders"
    ON public.payment_orders FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payment orders"
    ON public.payment_orders FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Policy Credit Transactions (Người dùng chỉ xem lịch sử credit của mình)
CREATE POLICY "Users can view their own credit transactions"
    ON public.credit_transactions FOR SELECT TO authenticated
    USING (auth.uid() = user_id);
