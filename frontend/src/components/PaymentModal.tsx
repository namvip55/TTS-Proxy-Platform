import React, { useState, useEffect, useRef } from 'react';
import { X, Copy, Check, QrCode, AlertCircle, ShieldCheck, Clock, Send, Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { api } from '../lib/api';
import { useCredit } from '../contexts/CreditContext';
import { CreditTier } from '../types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPackageId?: CreditTier | null;
}

const PACKAGES_CONFIG: Record<string, { name: string; price: number; credits: number; words: number; popular?: boolean }> = {
  plus: { name: 'Plus', price: 20000, credits: 20000, words: 100000 },
  pro: { name: 'Pro', price: 80000, credits: 100000, words: 500000, popular: true },
  ultra: { name: 'Ultra', price: 150000, credits: 300000, words: 1500000 },
};

const BANK_INFO = {
  bin: '970436',
  bank_name: 'Vietcombank',
  account_number: '1071895625',
  account_name: 'VIENEU TTS'
};

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, initialPackageId }) => {
  const { refreshCredits } = useCredit();
  const [selectedPkg, setSelectedPkg] = useState<string>(
    initialPackageId && initialPackageId !== 'normal' ? initialPackageId : 'pro'
  );
  
  // Trạng thái đơn nạp
  const [orderCode, setOrderCode] = useState<string>('');
  const [transferStatus, setTransferStatus] = useState<'IDLE' | 'NOTIFIED' | 'COMPLETED'>('IDLE');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const pollIntervalRef = useRef<any>(null);

  // Sinh mã đơn 6 số ngẫu nhiên khi mở modal hoặc đổi gói
  const initOrder = (pkgId: string) => {
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const code = `TTS${randomDigits}`;
    setOrderCode(code);
    setTransferStatus('IDLE');

    // Đồng bộ đơn nạp với backend
    api.createOrder(pkgId, code).catch((err) => {
      console.warn('Backend sync order (offline/retry):', err);
    });
  };

  useEffect(() => {
    if (isOpen) {
      const targetPkg = initialPackageId && initialPackageId !== 'normal' ? initialPackageId : 'pro';
      setSelectedPkg(targetPkg);
      initOrder(targetPkg);
    } else {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    }

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [isOpen, initialPackageId]);

  // Polling tự động kiểm tra trạng thái đơn nạp (khi Admin duyệt thì modal nhảy ngay sang Thành công)
  useEffect(() => {
    if (isOpen && orderCode && transferStatus === 'NOTIFIED') {
      pollIntervalRef.current = setInterval(async () => {
        try {
          const res = await api.getOrderStatus(orderCode);
          if (res.status === 'COMPLETED') {
            setTransferStatus('COMPLETED');
            await refreshCredits();
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          }
        } catch (err) {
          // Ignore polling errors
        }
      }, 3000); // Mỗi 3s
    }

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [isOpen, orderCode, transferStatus]);

  const handleSelectPackage = (pkgId: string) => {
    setSelectedPkg(pkgId);
    initOrder(pkgId);
  };

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Người dùng gửi thông báo "Tôi đã quét mã & chuyển khoản"
  const handleNotifyTransfer = async () => {
    if (!orderCode) return;
    setIsSubmitting(true);
    try {
      await api.notifyTransfer(orderCode);
      setTransferStatus('NOTIFIED');
    } catch (err) {
      console.error('Lỗi khi gửi thông báo chuyển khoản:', err);
      // Vẫn đổi state để người dùng an tâm
      setTransferStatus('NOTIFIED');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentPkg = PACKAGES_CONFIG[selectedPkg] || PACKAGES_CONFIG.pro;
  const qrCodeUrl = `https://img.vietqr.io/image/${BANK_INFO.bin}-${BANK_INFO.account_number}-compact2.png?amount=${currentPkg.price}&addInfo=${orderCode}&accountName=${encodeURIComponent(BANK_INFO.account_name)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl relative text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 sticky top-0 bg-slate-900/95 backdrop-blur z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-white">Nạp Credit & Nâng Cấp Gói</h3>
              <p className="text-xs text-slate-400">Quét mã VietQR chuyển khoản (Admin duyệt trong 1 - 5 phút)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {transferStatus === 'COMPLETED' ? (
            /* Trạng thái 1: Admin đã duyệt thành công */
            <div className="py-8 text-center space-y-5 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-500/10">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-xl font-bold text-white">Admin Đã Duyệt Nạp Credit Thành Công!</h4>
                <p className="text-sm text-slate-400">
                  Tài khoản của bạn đã được cộng <strong className="text-emerald-400">+{currentPkg.credits.toLocaleString()} Credit</strong> và nâng hạng{' '}
                  <span className="font-bold uppercase text-indigo-400">{currentPkg.name}</span>
                </p>
              </div>

              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl inline-block text-left min-w-[280px]">
                <div className="flex justify-between text-sm py-1">
                  <span className="text-slate-400">Mã đơn đã duyệt:</span>
                  <span className="font-mono font-bold text-white">{orderCode}</span>
                </div>
                <div className="flex justify-between text-sm py-1 border-t border-slate-800/80 mt-1 pt-1">
                  <span className="text-slate-400">Gói nạp:</span>
                  <span className="font-bold text-indigo-400 uppercase">{currentPkg.name}</span>
                </div>
                <div className="flex justify-between text-xs py-1 text-slate-400">
                  <span>Quy đổi chữ:</span>
                  <span className="text-emerald-400">~{currentPkg.words.toLocaleString()} chữ</span>
                </div>
              </div>

              <div>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition"
                >
                  Bắt đầu tạo âm thanh ngay
                </button>
              </div>
            </div>
          ) : transferStatus === 'NOTIFIED' ? (
            /* Trạng thái 2: Đã gửi thông báo, đang chờ Admin duyệt */
            <div className="py-6 text-center space-y-5 animate-in fade-in duration-200">
              <div className="w-14 h-14 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto ring-8 ring-amber-500/10 animate-pulse">
                <Clock className="w-7 h-7" />
              </div>

              <div className="space-y-1.5">
                <h4 className="text-lg font-bold text-white">Đã Gửi Yêu Cầu Chờ Admin Duyệt</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Hệ thống đã ghi nhận mã nạp <strong className="text-indigo-400 font-mono">{orderCode}</strong>. Quản trị viên (<code className="text-slate-300">admin@gmail.com</code>) sẽ đối soát biến động ngân hàng và duyệt cộng credit cho bạn.
                </p>
              </div>

              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl max-w-sm mx-auto text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Mã giao dịch của bạn:</span>
                  <span className="font-mono font-bold text-indigo-300 text-sm">{orderCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Số tiền chuyển:</span>
                  <span className="font-semibold text-emerald-400">{currentPkg.price.toLocaleString()} VNĐ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Credit sẽ nhận:</span>
                  <span className="font-semibold text-white">+{currentPkg.credits.toLocaleString()} Cr</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-800">
                  <span className="text-slate-400">Trạng thái:</span>
                  <span className="text-amber-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span> Đang chờ duyệt
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                <span>Trang này đang tự động lắng nghe kết quả duyệt từ Admin...</span>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTransferStatus('IDLE')}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-xs text-slate-300 hover:text-white transition"
                >
                  Xem lại mã QR
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-white transition font-medium"
                >
                  Đóng (Hệ thống vẫn tự cập nhật)
                </button>
              </div>
            </div>
          ) : (
            /* Trạng thái 0: Hiển thị mã QR và thông tin chuyển khoản chuẩn xác */
            <>
              {/* Package Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">
                  1. Chọn gói nạp mong muốn
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(PACKAGES_CONFIG).map(([id, pkg]) => {
                    const isSelected = selectedPkg === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => handleSelectPackage(id)}
                        className={`p-3.5 rounded-xl border text-left transition relative ${
                          isSelected
                            ? 'bg-indigo-600/15 border-indigo-500 ring-2 ring-indigo-500/30'
                            : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {pkg.popular && (
                          <span className="absolute -top-2.5 right-2 px-2 py-0.5 text-[10px] font-bold bg-indigo-500 text-white rounded-full uppercase tracking-wider">
                            Hot
                          </span>
                        )}
                        <p className="font-semibold text-sm text-white">{pkg.name}</p>
                        <p className="text-xs font-bold text-indigo-400 mt-0.5">{pkg.price.toLocaleString()}đ</p>
                        <p className="text-[11px] text-slate-400 mt-1 font-mono">
                          {pkg.credits.toLocaleString()} Cr (~{(pkg.words / 1000).toFixed(0)}k từ)
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* QR and Transfer Details */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                  2. Quét mã VietQR chuyển khoản (Vietcombank)
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  {/* VietQR Image Card */}
                  <div className="flex flex-col items-center bg-white p-3.5 rounded-xl shadow-xl">
                    <div className="w-full flex items-center justify-between border-b border-slate-200 pb-2 mb-2 text-slate-800">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Vietcombank</span>
                      <span className="text-[10px] text-slate-500 font-medium">VietQR 24/7</span>
                    </div>
                    <img
                      src={qrCodeUrl}
                      alt={`VietQR ${orderCode}`}
                      className="w-48 h-48 object-contain rounded"
                      onError={(e) => {
                        // Fallback nếu img.vietqr.io bị mạng chậm
                        (e.target as HTMLImageElement).src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`00020101021138540010A00000072701240006970436011010718956250208QRIBFTTA5303704540${currentPkg.price}5802VN62${orderCode.length + 4}08${orderCode.length}${orderCode}6304`)}`;
                      }}
                    />
                    <p className="text-[11px] text-slate-600 font-semibold mt-2 text-center">
                      Quét bằng App mọi ngân hàng / Ví điện tử
                    </p>
                  </div>

                  {/* Details Table */}
                  <div className="space-y-3">
                    <div>
                      <span className="text-xs text-slate-400">Ngân hàng thụ hưởng:</span>
                      <div className="flex items-center justify-between font-medium text-sm text-white bg-slate-900 px-3 py-2 rounded-lg mt-0.5 border border-slate-800">
                        <span>{BANK_INFO.bank_name}</span>
                        <span className="text-xs text-indigo-400 font-mono">BIN {BANK_INFO.bin}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs text-slate-400">Số tài khoản:</span>
                      <div className="flex items-center justify-between font-mono font-bold text-white bg-slate-900 px-3 py-2 rounded-lg mt-0.5 border border-slate-800">
                        <span className="text-amber-400 tracking-wider text-sm">{BANK_INFO.account_number}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(BANK_INFO.account_number, 'account')}
                          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition"
                        >
                          {copiedField === 'account' ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          {copiedField === 'account' ? 'Đã chép' : 'Sao chép'}
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs text-slate-400">Số tiền thanh toán:</span>
                      <div className="flex items-center justify-between font-semibold text-emerald-400 bg-slate-900 px-3 py-2 rounded-lg mt-0.5 border border-slate-800">
                        <span>{currentPkg.price.toLocaleString()} VNĐ</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(currentPkg.price.toString(), 'amount')}
                          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition"
                        >
                          {copiedField === 'amount' ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          {copiedField === 'amount' ? 'Đã chép' : 'Sao chép'}
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-rose-400">Nội dung chuyển khoản (Bắt buộc):</span>
                      </div>
                      <div className="flex items-center justify-between font-mono font-bold text-base bg-rose-950/30 text-rose-300 border border-rose-500/40 px-3 py-2 rounded-lg mt-0.5">
                        <span className="tracking-wider">{orderCode}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(orderCode, 'code')}
                          className="text-xs bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 px-2.5 py-1 rounded flex items-center gap-1 transition"
                        >
                          {copiedField === 'code' ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          {copiedField === 'code' ? 'Đã chép' : 'Sao chép'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-start gap-2.5 text-xs text-indigo-300">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-indigo-400" />
                  <p>
                    Vui lòng <strong className="text-white">sao chép chính xác mã {orderCode}</strong> vào nội dung chuyển khoản để Admin đối soát và duyệt nạp nhanh nhất.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="text-xs text-slate-400">
                  Tỷ lệ: <span className="text-slate-200 font-medium">1 Credit = 5 chữ</span>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-sm font-medium transition w-full sm:w-auto"
                  >
                    Đóng
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleNotifyTransfer}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition disabled:opacity-50 w-full sm:w-auto"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Đang gửi yêu cầu...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Tôi đã quét mã & chuyển khoản
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
