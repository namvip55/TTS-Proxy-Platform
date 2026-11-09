import axios from 'axios';
import { supabase } from './supabase';
import {
  TTSRequestPayload,
  TTSResponsePayload,
  Voice,
  ApiKeyItem,
  HistoryItem,
  WorkerStatusInfo,
  UserCreditInfo,
  CreditPackage,
  CreateOrderResponse,
  PaymentOrder,
  CreditTransaction
} from '../types';

const rawUrl =
  import.meta.env.VITE_API_GATEWAY_URL ||
  import.meta.env.VITE_GATEWAY_URL ||
  'http://localhost:8000';
const API_BASE_URL = rawUrl.replace(/\/+$/, '');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Gắn JWT token của Supabase Auth vào tất cả các request gửi tới FastAPI Gateway
apiClient.interceptors.request.use(async (config) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch (err) {
    console.error('Không thể lấy session Supabase:', err);
  }
  return config;
});

const PACKAGES_MAP: Record<string, CreditPackage> = {
  normal: {
    id: 'normal',
    name: 'Gói Miễn Phí',
    credits: 1000,
    price_vnd: 0,
    words_equivalent: 5000,
    badge: 'Miễn phí',
    description: 'Dành cho người mới trải nghiệm chất lượng giọng đọc AI.',
  },
  plus: {
    id: 'plus',
    name: 'Gói Plus',
    credits: 20000,
    price_vnd: 20000,
    words_equivalent: 100000,
    badge: 'Khởi đầu tốt',
    description: 'Phù hợp làm video ngắn, podcast và đọc tin tức hàng ngày.',
  },
  pro: {
    id: 'pro',
    name: 'Gói Pro',
    credits: 100000,
    price_vnd: 80000,
    words_equivalent: 500000,
    badge: 'Phổ biến nhất',
    is_popular: true,
    description: 'Lựa chọn hàng đầu cho các nhà sáng tạo nội dung YouTube/TikTok chuyên nghiệp.',
  },
  ultra: {
    id: 'ultra',
    name: 'Gói Ultra',
    credits: 300000,
    price_vnd: 150000,
    words_equivalent: 1500000,
    badge: 'Tiết kiệm 50%',
    description: 'Dành cho studio sản xuất sách nói, doanh nghiệp và agency nội dung số.',
  },
};

const BANK_INFO = {
  bin: '970436',
  bank_name: 'Vietcombank',
  account_number: '1071895625',
  account_name: 'VIENEU TTS',
};

export const api = {
  // TTS API
  async generateSpeech(payload: TTSRequestPayload): Promise<TTSResponsePayload> {
    const response = await apiClient.post<TTSResponsePayload>('/v1/audio/speech', payload);
    return response.data;
  },

  // Danh sách giọng đọc
  async getVoices(): Promise<{ total: number; voices: Voice[] }> {
    try {
      const response = await apiClient.get<{ total: number; voices: Voice[] }>('/v1/voices');
      if (response.data?.voices && response.data.voices.length > 0) {
        return response.data;
      }
      throw new Error('Dữ liệu rỗng');
    } catch {
      // Fallback đầy đủ 28 giọng đọc chuẩn VieNeu-TTS v3 Turbo 3 miền
      const defaultVoices: Voice[] = [
        { id: "vi-VN-Northern-Male-1", name: "Quang Minh (Bắc)", region: "Bắc", gender: "Nam", description: "Giọng đọc nam Hà Nội chuẩn, phong thái đĩnh đạc, phù hợp tin tức, phóng sự và tài liệu." },
        { id: "vi-VN-Northern-Male-2", name: "Tuấn Kiệt (Bắc)", region: "Bắc", gender: "Nam", description: "Giọng nam trầm ấm, truyền cảm, thích hợp đọc sách nói, tản văn và podcast." },
        { id: "vi-VN-Northern-Male-3", name: "Đức Duy (Bắc)", region: "Bắc", gender: "Nam", description: "Giọng nam trẻ trung, năng động, phong cách review công nghệ và video ngắn TikTok/YouTube." },
        { id: "vi-VN-Northern-Male-4", name: "Việt Hùng (Bắc)", region: "Bắc", gender: "Nam", description: "Giọng nam trung niên đằm thắm, uy nghiêm, dành cho phim tài liệu lịch sử." },
        { id: "vi-VN-Northern-Male-5", name: "Hải Đăng (Bắc)", region: "Bắc", gender: "Nam", description: "Giọng nam tươi vui, tự nhiên, thích hợp sách thiếu nhi và hoạt hình." },
        { id: "vi-VN-Northern-Female-1", name: "Mai Chi (Bắc)", region: "Bắc", gender: "Nữ", description: "Giọng nữ phát thanh viên chuẩn đài quốc gia, trong trẻo, lưu loát." },
        { id: "vi-VN-Northern-Female-2", name: "Ngọc Lan (Bắc)", region: "Bắc", gender: "Nữ", description: "Giọng nữ dịu dàng, êm ái, lý tưởng cho sách nói ngôn tình và thiền định." },
        { id: "vi-VN-Northern-Female-3", name: "Hà My (Bắc)", region: "Bắc", gender: "Nữ", description: "Giọng nữ MC trẻ, hiện đại, thuyết minh bài giảng và e-learning." },
        { id: "vi-VN-Northern-Female-4", name: "Thục Quyên (Bắc)", region: "Bắc", gender: "Nữ", description: "Giọng nữ Hà Nội thanh lịch, biểu cảm phong phú dành cho kịch truyền thanh." },
        { id: "vi-VN-Northern-Female-5", name: "Bảo Trâm (Bắc)", region: "Bắc", gender: "Nữ", description: "Giọng nữ chuyên nghiệp, tự tin, thích hợp quảng cáo TVC và giới thiệu sản phẩm." },
        { id: "vi-VN-Central-Male-1", name: "Bảo An (Huế)", region: "Trung", gender: "Nam", description: "Giọng nam Huế nhẹ nhàng, văn vẻ, sâu lắng, đậm chất thơ." },
        { id: "vi-VN-Central-Male-2", name: "Trung Nghĩa (Đà Nẵng)", region: "Trung", gender: "Nam", description: "Giọng nam Đà Nẵng rõ ràng, truyền cảm, phong cách du lịch và ẩm thực." },
        { id: "vi-VN-Central-Male-3", name: "Văn Hiệp (Quảng Nam)", region: "Trung", gender: "Nam", description: "Giọng nam Quảng Nam mộc mạc, gần gũi, dành cho truyện dân gian." },
        { id: "vi-VN-Central-Male-4", name: "Thành Vinh (Nghệ An)", region: "Trung", gender: "Nam", description: "Giọng nam xứ Nghệ khỏe khoắn, chân tình, thích hợp bình luận thể thao và văn hóa." },
        { id: "vi-VN-Central-Female-1", name: "Như Quỳnh (Huế)", region: "Trung", gender: "Nữ", description: "Giọng nữ Huế ngọt ngào, đằm thắm, mang âm hưởng cố đô cổ kính." },
        { id: "vi-VN-Central-Female-2", name: "Diệu Thảo (Huế)", region: "Trung", gender: "Nữ", description: "Giọng nữ Huế trong trẻo, du dương, lý tưởng cho đọc thơ và truyện tình ca." },
        { id: "vi-VN-Central-Female-3", name: "Thu Trang (Đà Nẵng)", region: "Trung", gender: "Nữ", description: "Giọng nữ Đà Nẵng ấm áp, dễ nghe, phù hợp tư vấn khách hàng tự động." },
        { id: "vi-VN-Central-Female-4", name: "Cẩm Tú (Khánh Hòa)", region: "Trung", gender: "Nữ", description: "Giọng nữ Nam Trung Bộ tươi sáng, rạng rỡ, thích hợp du lịch và giới thiệu trải nghiệm." },
        { id: "vi-VN-Southern-Male-1", name: "Hùng Dũng (Sài Gòn)", region: "Nam", gender: "Nam", description: "Giọng nam Sài Gòn sang trọng, lôi cuốn, giọng TVC quảng cáo hàng đầu." },
        { id: "vi-VN-Southern-Male-2", name: "Minh Trí (Sài Gòn)", region: "Nam", gender: "Nam", description: "Giọng nam trẻ Sài Gòn tự nhiên, hài hước, phong cách sáng tạo nội dung vlog." },
        { id: "vi-VN-Southern-Male-3", name: "Quốc Hưng (Miền Tây)", region: "Nam", gender: "Nam", description: "Giọng nam miền Tây chân chất, hào sảng, thích hợp truyện kể miệt vườn." },
        { id: "vi-VN-Southern-Male-4", name: "Tấn Tài (Nam Bộ)", region: "Nam", gender: "Nam", description: "Giọng nam trung niên đĩnh đạc, phù hợp bản tin tài chính và kinh tế." },
        { id: "vi-VN-Southern-Male-5", name: "Chí Thiện (Sài Gòn)", region: "Nam", gender: "Nam", description: "Giọng nam ấm áp, kể chuyện đêm khuya, podcast chữa lành." },
        { id: "vi-VN-Southern-Female-1", name: "Thảo Vy (Sài Gòn)", region: "Nam", gender: "Nữ", description: "Giọng nữ Sài Gòn thời thượng, thanh thoát, chuyên nghiệp cho giới thiệu thương hiệu." },
        { id: "vi-VN-Southern-Female-2", name: "Yến Nhi (Sài Gòn)", region: "Nam", gender: "Nữ", description: "Giọng nữ trẻ năng động, vui tươi, thích hợp video TikTok, Reels và review ẩm thực." },
        { id: "vi-VN-Southern-Female-3", name: "Mỹ Linh (Miền Tây)", region: "Nam", gender: "Nữ", description: "Giọng nữ miền Tây sông nước ngọt lịm, ấm áp, giàu tình cảm." },
        { id: "vi-VN-Southern-Female-4", name: "Thanh Trúc (Sài Gòn)", region: "Nam", gender: "Nữ", description: "Giọng nữ MC hội nghị truyền hình, rõ ràng, rành mạch và cuốn hút." },
        { id: "vi-VN-Southern-Female-5", name: "Bích Vân (Sài Gòn)", region: "Nam", gender: "Nữ", description: "Giọng nữ phát thanh truyện ma, kịch bản ly kỳ hoặc tài liệu xã hội." }
      ];
      return { total: defaultVoices.length, voices: defaultVoices };
    }
  },

  // Quản lý API Keys
  async getKeys(): Promise<ApiKeyItem[]> {
    try {
      const response = await apiClient.get<ApiKeyItem[]>('/v1/keys');
      return response.data;
    } catch {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase.from('api_keys').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      return data || [];
    }
  },

  async createKey(name: string): Promise<ApiKeyItem> {
    const response = await apiClient.post<ApiKeyItem>('/v1/keys', { name });
    return response.data;
  },

  async deleteKey(keyId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.delete(`/v1/keys/${keyId}`);
      return response.data;
    } catch {
      await supabase.from('api_keys').delete().eq('id', keyId);
      return { success: true, message: 'Đã xóa key' };
    }
  },

  // Lịch sử TTS
  async getHistory(page = 1, limit = 10): Promise<{ total: number; page: number; limit: number; items: HistoryItem[] }> {
    try {
      const response = await apiClient.get('/v1/history', { params: { page, limit } });
      return response.data;
    } catch {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { total: 0, page: 1, limit, items: [] };
      const { data, count } = await supabase
        .from('tts_jobs')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);
      return { total: count || (data?.length ?? 0), page, limit, items: (data as HistoryItem[]) || [] };
    }
  },

  async deleteHistory(jobId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.delete(`/v1/history/${jobId}`);
      return response.data;
    } catch {
      await supabase.from('tts_jobs').delete().eq('id', jobId);
      return { success: true, message: 'Đã xóa lịch sử' };
    }
  },

  // ==========================================
  // TRẠNG THÁI GPU WORKER (ĐỒNG BỘ TRÊN MỌI MÁY)
  // ==========================================
  async getWorkerStatus(): Promise<{ status: string; gpu_worker: WorkerStatusInfo }> {
    // 1. Thử gọi Gateway cục bộ nếu có
    try {
      const response = await apiClient.get('/v1/status');
      if (response.data?.gpu_worker?.connected) {
        // Cập nhật trạng thái lên Supabase Cloud để các máy khác cùng thấy Online
        supabase.from('system_status').upsert({
          id: 'gpu_worker',
          is_online: true,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }).then(() => {});
        return response.data;
      }
    } catch {
      // Gateway local không chạy (trên máy khác / điện thoại) -> Chuyển sang đọc Supabase Cloud
    }

    // 2. Đọc trạng thái từ Supabase Cloud Table system_status
    try {
      const { data } = await supabase
        .from('system_status')
        .select('*')
        .eq('id', 'gpu_worker')
        .maybeSingle();

      if (data) {
        const lastSeenTime = data.last_seen ? new Date(data.last_seen).getTime() : 0;
        const diffSeconds = (Date.now() - lastSeenTime) / 1000;
        // Nếu worker có tương tác trong vòng 120s hoặc được đánh dấu online
        const isConnected = Boolean(data.is_online && diffSeconds < 180);
        return {
          status: isConnected ? 'healthy' : 'degraded',
          gpu_worker: {
            connected: isConnected,
            last_seen: data.last_seen,
            active_jobs: data.details?.active_jobs || 0
          }
        };
      }
    } catch (e) {
      console.warn('Lỗi đọc system_status từ Supabase:', e);
    }

    return {
      status: 'offline',
      gpu_worker: { connected: false, last_seen: null, active_jobs: 0 }
    };
  },

  // ==========================================
  // BILLING & CREDITS (TRUY VẤN SUPABASE CLOUD TRỰC TIẾP)
  // ==========================================
  async getBillingBalance(): Promise<UserCreditInfo> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        user_id: '',
        tier: 'normal',
        credit_balance: 1000,
        words_remaining: 5000,
        total_used_credits: 0,
        rate_words_per_credit: 5,
      };
    }

    try {
      // 1. Đọc trực tiếp từ bảng user_credits trên Supabase Cloud
      const { data, error } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        const balance = Number(data.credit_balance ?? 1000);
        return {
          user_id: user.id,
          tier: data.tier || 'normal',
          credit_balance: balance,
          words_remaining: balance * 5,
          total_used_credits: Number(data.total_used_credits ?? 0),
          rate_words_per_credit: 5,
        };
      }

      // Nếu chưa có record, tự tạo với 1000 credit ban đầu
      await supabase.from('user_credits').insert({
        user_id: user.id,
        tier: 'normal',
        credit_balance: 1000,
        total_used_credits: 0,
      });

      return {
        user_id: user.id,
        tier: 'normal',
        credit_balance: 1000,
        words_remaining: 5000,
        total_used_credits: 0,
        rate_words_per_credit: 5,
      };
    } catch (err) {
      console.error('Lỗi lấy user_credits Supabase:', err);
      return {
        user_id: user.id,
        tier: 'normal',
        credit_balance: 1000,
        words_remaining: 5000,
        total_used_credits: 0,
        rate_words_per_credit: 5,
      };
    }
  },

  async getPackages(): Promise<{ packages: CreditPackage[] }> {
    try {
      const { data } = await supabase.from('credit_packages').select('*').order('sort_order');
      if (data && data.length > 0) return { packages: data as CreditPackage[] };
    } catch {
      // Fallback
    }
    return { packages: Object.values(PACKAGES_MAP) };
  },

  // Tạo đơn nạp tiền (Ghi trực tiếp vào Supabase Cloud)
  async createOrder(packageId: string, preferredCode?: string): Promise<CreateOrderResponse> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Vui lòng đăng nhập trước khi nạp credit.');

    const pkg = PACKAGES_MAP[packageId.toLowerCase()] || PACKAGES_MAP.pro;
    const orderCode = preferredCode ? preferredCode.toUpperCase() : `TTS${Math.floor(100000 + Math.random() * 900000)}`;
    const qrUrl = `https://img.vietqr.io/image/${BANK_INFO.bin}-${BANK_INFO.account_number}-compact2.png?amount=${pkg.price_vnd}&addInfo=${orderCode}&accountName=${encodeURIComponent(BANK_INFO.account_name)}`;

    // Ghi vào Supabase Cloud table payment_orders
    try {
      await supabase.from('payment_orders').upsert({
        order_code: orderCode,
        user_id: user.id,
        user_email: user.email,
        package_id: pkg.id,
        amount_vnd: pkg.price_vnd,
        credits_granted: pkg.credits,
        target_tier: pkg.id,
        bank_bin: BANK_INFO.bin,
        bank_name: BANK_INFO.bank_name,
        bank_account: BANK_INFO.account_number,
        transfer_content: orderCode,
        qr_data_url: qrUrl,
        status: 'PENDING',
        created_at: new Date().toISOString(),
      }, { onConflict: 'order_code' });
    } catch (dbErr) {
      console.warn('Lỗi lưu payment_orders vào Supabase:', dbErr);
    }

    // Đồng thời thử báo backend nếu backend online
    apiClient.post('/v1/billing/create-order', { package_id: packageId, preferred_code: orderCode }).catch(() => {});

    return {
      success: true,
      order_code: orderCode,
      package: pkg,
      amount_vnd: pkg.price_vnd,
      credits_granted: pkg.credits,
      bank_info: {
        ...BANK_INFO,
        transfer_content: orderCode,
        amount: pkg.price_vnd,
      },
      qr_code_url: qrUrl,
      status: 'PENDING',
      instructions: [
        '1. Mở ứng dụng ngân hàng bất kỳ (Vietcombank, MB, Techcombank...)',
        '2. Quét mã VietQR trên màn hình',
        `3. Giữ nguyên số tiền ${pkg.price_vnd.toLocaleString()}đ và nội dung chuyển khoản là '${orderCode}'`,
        '4. Bấm "Tôi đã quét mã & chuyển khoản" để gửi cho Admin duyệt.',
      ],
    };
  },

  // Người dùng báo đã chuyển khoản -> Chuyển status thành WAITING_APPROVAL
  async notifyTransfer(orderCode: string): Promise<{ success: boolean; status: string; message: string }> {
    const code = orderCode.toUpperCase();
    try {
      // Cập nhật trực tiếp lên Supabase Cloud
      const { error } = await supabase
        .from('payment_orders')
        .update({ status: 'WAITING_APPROVAL' })
        .eq('order_code', code);

      if (error) console.error('Lỗi Supabase notifyTransfer:', error);
    } catch (e) {
      console.warn('Supabase update notify error:', e);
    }

    // Báo backend nếu có
    apiClient.post('/v1/billing/notify-transfer', { order_code: code }).catch(() => {});

    return {
      success: true,
      status: 'WAITING_APPROVAL',
      message: 'Đã gửi thông báo cho Admin duyệt.',
    };
  },

  // Kiểm tra trạng thái đơn nạp theo thời gian thực (Polling)
  async getOrderStatus(orderCode: string): Promise<{
    order_code: string;
    status: string;
    amount_vnd: number;
    credits_granted: number;
    target_tier: string;
  }> {
    const code = orderCode.toUpperCase();
    const { data } = await supabase
      .from('payment_orders')
      .select('*')
      .eq('order_code', code)
      .maybeSingle();

    if (data) {
      return {
        order_code: data.order_code,
        status: data.status,
        amount_vnd: data.amount_vnd,
        credits_granted: data.credits_granted,
        target_tier: data.target_tier,
      };
    }

    // Fallback qua backend
    const response = await apiClient.get(`/v1/billing/orders/${code}`);
    return response.data;
  },

  // ==========================================
  // ADMIN APIS (CHỈ DÀNH CHO admin@gmail.com)
  // ==========================================
  async adminGetOrders(statusFilter?: string): Promise<{ orders: PaymentOrder[] }> {
    try {
      let query = supabase.from('payment_orders').select('*').order('created_at', { ascending: false });
      if (statusFilter && statusFilter !== 'ALL') {
        query = query.eq('status', statusFilter);
      }
      const { data, error } = await query.limit(100);
      if (!error && data) {
        return { orders: data as PaymentOrder[] };
      }
    } catch (e) {
      console.warn('Lỗi đọc đơn admin từ Supabase:', e);
    }

    // Fallback gọi qua backend gateway nếu có
    const response = await apiClient.get<{ orders: PaymentOrder[] }>('/v1/billing/admin/orders', {
      params: statusFilter ? { status_filter: statusFilter } : {},
    });
    return response.data;
  },

  async adminApproveOrder(orderCode: string): Promise<{
    success: boolean;
    order_code: string;
    credits_added: number;
    new_balance: number;
    tier: string;
  }> {
    let cleanCode = orderCode.trim().toUpperCase();
    if (cleanCode.length === 6 && !cleanCode.startsWith('TTS')) {
      cleanCode = `TTS${cleanCode}`;
    }

    // 1. Đọc thông tin đơn nạp trên Supabase Cloud
    const { data: order, error: orderErr } = await supabase
      .from('payment_orders')
      .select('*')
      .eq('order_code', cleanCode)
      .single();

    if (orderErr || !order) {
      throw new Error(`Không tìm thấy đơn nạp với mã ${cleanCode}`);
    }

    const userId = order.user_id;
    const creditsGranted = Number(order.credits_granted);
    const targetTier = order.target_tier;

    // 2. Cập nhật trạng thái đơn thành COMPLETED
    await supabase
      .from('payment_orders')
      .update({
        status: 'COMPLETED',
        completed_at: new Date().toISOString(),
      })
      .eq('id', order.id);

    // 3. Lấy và cập nhật ví user_credits của người nạp
    const { data: currentCredit } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    const currentBal = Number(currentCredit?.credit_balance ?? 0);
    const newBal = currentBal + creditsGranted;

    // Nâng hạng tài khoản (ultra > pro > plus > normal)
    let currentTier = currentCredit?.tier || 'normal';
    if (targetTier === 'ultra' || (targetTier === 'pro' && currentTier !== 'ultra') || (targetTier === 'plus' && currentTier === 'normal')) {
      currentTier = targetTier;
    }

    await supabase.from('user_credits').upsert({
      user_id: userId,
      credit_balance: newBal,
      tier: currentTier,
      updated_at: new Date().toISOString(),
    });

    // 4. Ghi lịch sử biến động credit_transactions
    await supabase.from('credit_transactions').insert({
      user_id: userId,
      amount: creditsGranted,
      balance_after: newBal,
      type: 'TOPUP',
      order_id: order.id,
      description: `Admin duyệt nạp thành công đơn ${cleanCode} (+${creditsGranted.toLocaleString()} Credit)`,
    });

    // Báo backend nếu có
    apiClient.post('/v1/billing/admin/approve-order', { order_code: cleanCode }).catch(() => {});

    return {
      success: true,
      order_code: cleanCode,
      credits_added: creditsGranted,
      new_balance: newBal,
      tier: currentTier,
    };
  },

  async adminRejectOrder(orderCode: string, reason?: string): Promise<{ success: boolean; order_code: string }> {
    let cleanCode = orderCode.trim().toUpperCase();
    if (cleanCode.length === 6 && !cleanCode.startsWith('TTS')) {
      cleanCode = `TTS${cleanCode}`;
    }

    await supabase
      .from('payment_orders')
      .update({ status: 'CANCELLED' })
      .eq('order_code', cleanCode);

    apiClient.post('/v1/billing/admin/reject-order', { order_code: cleanCode, reason }).catch(() => {});

    return { success: true, order_code: cleanCode };
  },

  async getBillingHistory(): Promise<{
    orders: PaymentOrder[];
    transactions: CreditTransaction[];
  }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { orders: [], transactions: [] };

    const [ordersRes, txRes] = await Promise.all([
      supabase.from('payment_orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
      supabase.from('credit_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30),
    ]);

    return {
      orders: (ordersRes.data as PaymentOrder[]) || [],
      transactions: (txRes.data as CreditTransaction[]) || [],
    };
  },
};
