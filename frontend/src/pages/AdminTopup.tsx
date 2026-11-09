import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, CheckCircle2, XCircle, RefreshCw, AlertCircle, Clock, Check, User, ArrowUpRight } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { PaymentOrder } from '../types';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';

export const AdminTopup: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.email?.toLowerCase() === 'admin@gmail.com';

  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<string>('WAITING_APPROVAL');

  // Input duyệt nhanh bằng mã 6 số
  const [inputCode, setInputCode] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await api.adminGetOrders(filter === 'ALL' ? undefined : filter);
      setOrders(data.orders || []);
    } catch (err) {
      console.error('Không thể lấy danh sách đơn nạp:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchOrders();
    }
  }, [isAdmin, filter]);

  const handleQuickApprove = async (codeToApprove?: string) => {
    const code = (codeToApprove || inputCode).trim();
    if (!code) {
      setMessage({ text: 'Vui lòng nhập mã giao dịch 6 chữ số.', type: 'error' });
      return;
    }

    setActionLoading(true);
    setMessage(null);

    try {
      const res = await api.adminApproveOrder(code);
      setMessage({
        text: `Duyệt thành công đơn ${res.order_code}! Đã cộng +${res.credits_added.toLocaleString()} Credit cho tài khoản.`,
        type: 'success',
      });
      setInputCode('');
      await fetchOrders();
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Không thể duyệt đơn. Vui lòng kiểm tra lại mã.';
      setMessage({ text: errMsg, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (code: string) => {
    if (!confirm(`Bạn có chắc chắn muốn từ chối đơn ${code}?`)) return;

    try {
      await api.adminRejectOrder(code, 'Admin từ chối giao dịch');
      setMessage({ text: `Đã từ chối đơn ${code}.`, type: 'success' });
      await fetchOrders();
    } catch (err: any) {
      alert('Lỗi khi từ chối đơn: ' + (err.response?.data?.detail || ''));
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white">Truy cập bị từ chối</h2>
        <p className="text-slate-400 text-sm">
          Trang quản lý duyệt nạp credit chỉ dành riêng cho tài khoản quản trị viên{' '}
          <strong className="text-rose-400">admin@gmail.com</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" /> Quyền Quản Trị Hệ Thống
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white mt-1">
            Duyệt Nạp Tiền & Kích Hoạt Credit
          </h2>
          <p className="text-slate-400 text-xs md:text-sm mt-0.5">
            Đối soát giao dịch chuyển khoản Vietcombank và duyệt credit cho người dùng
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-2 border border-slate-700 transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Làm mới danh sách
        </button>
      </div>

      {/* Quick Approval Box */}
      <Card className="p-6 border-indigo-500/40 bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900">
        <h3 className="font-bold text-base text-white flex items-center gap-2 mb-2">
          <Search className="w-4 h-4 text-indigo-400" /> Duyệt Nhanh Theo Mã Đơn (6 Chữ Số)
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Nhập mã 6 chữ số từ sao kê ngân hàng (Ví dụ: <code className="text-indigo-300 font-mono">849201</code> hoặc <code className="text-indigo-300 font-mono">TTS849201</code>) để duyệt tức thì.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleQuickApprove();
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="Nhập mã 6 chữ số (VD: 849201)..."
              className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-3 text-white font-mono font-bold text-base placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 uppercase"
            />
          </div>

          <button
            type="submit"
            disabled={actionLoading || !inputCode.trim()}
            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            {actionLoading ? 'Đang duyệt...' : 'Duyệt nạp ngay (+Credit)'}
          </button>
        </form>

        {message && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
            }`}
          >
            {message.type === 'success' ? (
              <Check className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}
      </Card>

      {/* Orders Filter Tabs & Table */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            {[
              { id: 'WAITING_APPROVAL', label: 'Chờ duyệt' },
              { id: 'PENDING', label: 'Chưa chuyển khoản' },
              { id: 'COMPLETED', label: 'Đã hoàn tất' },
              { id: 'ALL', label: 'Tất cả đơn' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  filter === tab.id
                    ? 'bg-indigo-600 text-white shadow'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-400">
            Tổng cộng: <strong className="text-white">{orders.length}</strong> đơn nạp
          </span>
        </div>

        {/* Orders Table */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 overflow-x-auto">
          {loading ? (
            <p className="text-sm text-slate-400 py-8 text-center">Đang tải danh sách đơn nạp...</p>
          ) : orders.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <Clock className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm text-slate-400">Không có đơn nạp nào trong danh mục này.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-3">Mã Đơn / Nội dung</th>
                  <th className="py-3 px-3">Người Nạp (User)</th>
                  <th className="py-3 px-3">Gói</th>
                  <th className="py-3 px-3">Số Tiền (VNĐ)</th>
                  <th className="py-3 px-3">Credit Cấp</th>
                  <th className="py-3 px-3">Trạng Thái</th>
                  <th className="py-3 px-3">Thời Gian</th>
                  <th className="py-3 px-3 text-right">Hành Động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-white text-sm bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {ord.order_code}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span className="truncate max-w-[150px]">{ord.user_email || ord.user_id.slice(0, 8) + '...'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="uppercase text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                        {ord.package_id}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-emerald-400">
                      {ord.amount_vnd.toLocaleString()}đ
                    </td>
                    <td className="py-3 px-3 font-semibold text-white">
                      +{ord.credits_granted.toLocaleString()} Cr
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ord.status === 'COMPLETED'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : ord.status === 'WAITING_APPROVAL'
                            ? 'bg-amber-500/20 text-amber-400 animate-pulse'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {ord.status === 'COMPLETED'
                          ? 'Đã duyệt'
                          : ord.status === 'WAITING_APPROVAL'
                          ? 'Chờ duyệt'
                          : 'Chưa chuyển'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {new Date(ord.created_at).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {ord.status !== 'COMPLETED' && ord.status !== 'CANCELLED' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleQuickApprove(ord.order_code)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold transition flex items-center gap-1 shadow"
                            title="Duyệt đơn này"
                          >
                            <Check className="w-3 h-3" /> Duyệt
                          </button>
                          <button
                            onClick={() => handleReject(ord.order_code)}
                            className="px-2 py-1 bg-slate-800 hover:bg-rose-900/60 hover:text-rose-300 text-slate-400 rounded text-[11px] transition"
                            title="Hủy đơn"
                          >
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Đã xong</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
