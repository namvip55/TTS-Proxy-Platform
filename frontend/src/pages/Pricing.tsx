import React, { useState, useEffect } from 'react';
import { Check, Sparkles, Zap, Shield, HelpCircle, ArrowRight, History, CreditCard, ChevronRight } from 'lucide-react';
import { useCredit } from '../contexts/CreditContext';
import { api } from '../lib/api';
import { PaymentOrder, CreditTransaction, CreditTier } from '../types';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

interface PlanDetail {
  id: CreditTier;
  name: string;
  price: number;
  credits: number;
  words: number;
  badge?: string;
  popular?: boolean;
  description: string;
  features: string[];
}

const PLANS: PlanDetail[] = [
  {
    id: 'normal',
    name: 'Normal (Miễn Phí)',
    price: 0,
    credits: 1000,
    words: 5000,
    badge: 'Khởi tạo',
    description: 'Trải nghiệm chất lượng âm thanh AI tiếng Việt chân thực không mất phí.',
    features: [
      '1.000 Credit tặng sẵn khi đăng ký',
      'Đọc tương đương ~5.000 từ',
      'Toàn bộ giọng đọc Bắc - Trung - Nam',
      'Tải định dạng chuẩn MP3 & WAV',
      'Tốc độ xử lý tiêu chuẩn'
    ]
  },
  {
    id: 'plus',
    name: 'Gói Plus',
    price: 20000,
    credits: 20000,
    words: 100000,
    badge: '20.000đ',
    description: 'Hoàn hảo cho người làm podcast ngắn, đọc truyện và thuyết minh video.',
    features: [
      '20.000 Credit (~100.000 từ)',
      'Chi phí siêu tiết kiệm: 1đ / 1 credit',
      'Không giới hạn số lượt phát âm',
      'Tốc độ xử lý ưu tiên nhẹ',
      'Hỗ trợ tích hợp qua API'
    ]
  },
  {
    id: 'pro',
    name: 'Gói Pro',
    price: 80000,
    credits: 100000,
    words: 500000,
    badge: 'Phổ biến nhất',
    popular: true,
    description: 'Lựa chọn hàng đầu cho các nhà sáng tạo nội dung YouTube, TikTok chuyên nghiệp.',
    features: [
      '100.000 Credit (~500.000 từ)',
      'Tiết kiệm 20% so với gói Plus',
      'Hàng đợi xử lý ưu tiên cao',
      'Tạo không giới hạn API Keys',
      'Băng thông tải audio không giới hạn',
      'Lưu trữ lịch sử dài hạn'
    ]
  },
  {
    id: 'ultra',
    name: 'Gói Ultra',
    price: 150000,
    credits: 300000,
    words: 1500000,
    badge: 'Tiết kiệm 50%',
    description: 'Dành cho studio sản xuất sách nói, doanh nghiệp và agency truyền thông.',
    features: [
      '300.000 Credit (~1.500.000 từ)',
      'Giá rẻ kỷ lục chỉ 0.5đ / 1 credit',
      'Ưu tiên tối cao trên dàn GPU Colab T4',
      'Tốc độ sinh âm thanh tức thì',
      'Hỗ trợ kỹ thuật 24/7 trực tiếp',
      'Tùy biến tinh chỉnh tốc độ chuyên sâu'
    ]
  }
];

export const Pricing: React.FC = () => {
  const { creditInfo, openTopupModal } = useCredit();
  const [activeTab, setActiveTab] = useState<'plans' | 'history'>('plans');
  const [calcWords, setCalcWords] = useState<number>(25000);
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await api.getBillingHistory();
      setOrders(data.orders);
      setTransactions(data.transactions);
    } catch (err) {
      console.error('Không thể lấy lịch sử nạp tiền:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const calculatedCredits = Math.ceil(calcWords / 5);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" /> Bảng Giá & Nạp Credit Minh Bạch
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          Chọn Gói Credit Phù Hợp Với Bạn
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto text-sm md:text-base">
          Tỷ lệ quy đổi tiêu chuẩn: <strong className="text-indigo-400">1 Credit = 5 Chữ</strong>. Nạp tiền quét mã VietQR tự động, credit cộng ngay tức thì.
        </p>

        {/* Current status bar */}
        {creditInfo && (
          <div className="inline-flex flex-wrap items-center justify-center gap-4 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-sm mt-2">
            <span className="text-slate-400">Gói hiện tại của bạn:</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-600 text-white">
              {creditInfo.tier}
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">Số dư khả dụng:</span>
            <span className="font-bold text-emerald-400">
              {creditInfo.credit_balance.toLocaleString()} Credit
            </span>
            <span className="text-xs text-slate-400">
              (~{(creditInfo.credit_balance * 5).toLocaleString()} chữ)
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex justify-center border-b border-slate-800">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('plans')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'plans'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4" /> Bảng Gói Cước
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'history'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" /> Lịch Sử Nạp & Biến Động
          </button>
        </div>
      </div>

      {activeTab === 'plans' ? (
        <>
          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLANS.map((plan) => {
              const isCurrent = creditInfo?.tier === plan.id;
              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl border p-6 flex flex-col justify-between transition duration-200 ${
                    plan.popular
                      ? 'bg-gradient-to-b from-slate-900 via-indigo-950/20 to-slate-900 border-indigo-500/60 shadow-xl shadow-indigo-500/10 ring-1 ring-indigo-500/40'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[11px] font-bold rounded-full uppercase tracking-wider shadow">
                      Phổ biến nhất
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg text-white">{plan.name}</h3>
                      {plan.badge && !plan.popular && (
                        <span className="text-[11px] font-semibold text-slate-400 px-2 py-0.5 rounded-full bg-slate-800">
                          {plan.badge}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 mt-2 min-h-[36px]">{plan.description}</p>

                    <div className="mt-5 pb-5 border-b border-slate-800">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-white">
                          {plan.price === 0 ? '0đ' : `${plan.price.toLocaleString()}đ`}
                        </span>
                        {plan.price > 0 && <span className="text-xs text-slate-400">/ nạp</span>}
                      </div>
                      <div className="mt-2 text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        {plan.credits.toLocaleString()} Credit (~{plan.words.toLocaleString()} từ)
                      </div>
                    </div>

                    {/* Features list */}
                    <ul className="mt-5 space-y-2.5 text-xs text-slate-300">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6 pt-4">
                    {plan.id === 'normal' ? (
                      <button
                        disabled
                        className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-800 text-slate-400 cursor-default"
                      >
                        {isCurrent ? 'Đang kích hoạt' : 'Gói mặc định'}
                      </button>
                    ) : (
                      <button
                        onClick={() => openTopupModal(plan.id)}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-lg ${
                          plan.popular
                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                            : 'bg-slate-800 hover:bg-slate-700 text-white hover:border-slate-600 border border-slate-700'
                        }`}
                      >
                        <span>Nạp ngay {plan.price.toLocaleString()}đ</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Calculator */}
          <div className="p-6 md:p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-lg text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-indigo-400" /> Công Cụ Ước Tính Lượng Credit & Số Từ
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Kéo thanh trượt để tính toán số credit tương đương với nhu cầu sản xuất nội dung của bạn
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">Quy đổi tiêu chuẩn:</span>
                <p className="text-sm font-bold text-indigo-400">1 Credit = 5 Chữ</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-300">Số chữ dự kiến phát âm:</span>
                <span className="text-lg font-bold text-white font-mono">{calcWords.toLocaleString()} chữ</span>
              </div>
              <input
                type="range"
                min="1000"
                max="300000"
                step="1000"
                value={calcWords}
                onChange={(e) => setCalcWords(parseInt(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                <span>1.000 chữ</span>
                <span>100.000 chữ</span>
                <span>200.000 chữ</span>
                <span>300.000 chữ</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800/80">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-center">
                <span className="text-xs text-slate-400">Lượng Credit Cần:</span>
                <p className="text-xl font-bold text-indigo-400 font-mono mt-0.5">
                  {calculatedCredits.toLocaleString()} Credit
                </p>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-center">
                <span className="text-xs text-slate-400">Gói Nạp Gợi Ý:</span>
                <p className="text-xl font-bold text-white uppercase mt-0.5">
                  {calcWords <= 5000 ? 'Normal' : calcWords <= 100000 ? 'Plus' : calcWords <= 500000 ? 'Pro' : 'Ultra'}
                </p>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-center">
                <button
                  onClick={() => openTopupModal(calcWords <= 100000 ? 'plus' : calcWords <= 500000 ? 'pro' : 'ultra')}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition"
                >
                  Nạp gói tương ứng ngay
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* History Tab */
        <div className="space-y-6">
          {/* Orders Table */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="font-bold text-base text-white">Đơn Nạp Tiền Gần Đây</h3>

            {loadingHistory ? (
              <p className="text-sm text-slate-400 py-4 text-center">Đang tải lịch sử...</p>
            ) : orders.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">Chưa có giao dịch nạp tiền nào.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Mã Đơn / Nội Dung</th>
                      <th className="py-2.5 px-3">Gói</th>
                      <th className="py-2.5 px-3">Số Tiền</th>
                      <th className="py-2.5 px-3">Credit Nhận</th>
                      <th className="py-2.5 px-3">Trạng Thái</th>
                      <th className="py-2.5 px-3">Thời Gian</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {orders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-3 font-mono font-bold text-white">{ord.order_code}</td>
                        <td className="py-3 px-3 uppercase text-indigo-400 font-semibold">{ord.package_id}</td>
                        <td className="py-3 px-3">{ord.amount_vnd.toLocaleString()}đ</td>
                        <td className="py-3 px-3 font-semibold text-emerald-400">+{ord.credits_granted.toLocaleString()}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              ord.status === 'COMPLETED'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-amber-500/20 text-amber-400'
                            }`}
                          >
                            {ord.status === 'COMPLETED' ? 'Thành công' : 'Đang xử lý'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-400">
                          {new Date(ord.created_at).toLocaleString('vi-VN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Transactions Table */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="font-bold text-base text-white">Nhật Ký Biến Động Số Dư Credit</h3>

            {loadingHistory ? (
              <p className="text-sm text-slate-400 py-4 text-center">Đang tải...</p>
            ) : transactions.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">Chưa có biến động credit nào.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Biến Động</th>
                      <th className="py-2.5 px-3">Số Dư Sau</th>
                      <th className="py-2.5 px-3">Loại</th>
                      <th className="py-2.5 px-3">Nội Dung</th>
                      <th className="py-2.5 px-3">Thời Gian</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-800/40">
                        <td className={`py-3 px-3 font-bold font-mono ${tx.amount > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {tx.amount > 0 ? `+${tx.amount.toLocaleString()}` : tx.amount.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 font-mono text-white">{tx.balance_after.toLocaleString()}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-medium">
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-300">{tx.description || '-'}</td>
                        <td className="py-3 px-3 text-slate-400">
                          {new Date(tx.created_at).toLocaleString('vi-VN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
