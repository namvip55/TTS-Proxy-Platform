import React, { useState, useEffect } from 'react';
import { X, Copy, Check, QrCode, AlertCircle, ShieldCheck, Sparkles, ExternalLink, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { useCredit } from '../contexts/CreditContext';
import { CreateOrderResponse, CreditTier } from '../types';

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

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, initialPackageId }) => {
  const { refreshCredits } = useCredit();
  const [selectedPkg, setSelectedPkg] = useState<string>(
    initialPackageId && initialPackageId !== 'normal' ? initialPackageId : 'pro'
  );
  const [orderData, setOrderData] = useState<CreateOrderResponse | null>(null);
  const [loadingOrder, setLoadingOrder] = useState<boolean>(false);
  const [confirming, setConfirming] = useState<boolean>(false);
  const [successResult, setSuccessResult] = useState<{
    credits_added: number;
    new_balance: number;
    tier: string;
  } | null>(null);

  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const targetPkg = initialPackageId && initialPackageId !== 'normal' ? initialPackageId : 'pro';
      setSelectedPkg(targetPkg);
      setSuccessResult(null);
      generateOrder(targetPkg);
    }
  }, [isOpen, initialPackageId]);

  const generateOrder = async (pkgId: string) => {
    setLoadingOrder(true);
    setSuccessResult(null);
    try {
      const data = await api.createOrder(pkgId);
      setOrderData(data);
    } catch (err) {
      console.error('Không thể tạo đơn nạp:', err);
    } finally {
      setLoadingOrder(false);
    }
  };

  const handleSelectPackage = (pkgId: string) => {
    setSelectedPkg(pkgId);
    generateOrder(pkgId);
  };

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleConfirmPayment = async () => {
    if (!orderData) return;
    setConfirming(true);
    try {
      const res = await api.confirmOrder(orderData.order_code);
      setSuccessResult({
        credits_added: res.credits_added,
        new_balance: res.new_balance,
        tier: res.tier,
      });
      await refreshCredits();
    } catch (err) {
      console.error('Xác nhận nạp thất bại:', err);
      alert('Không thể xác nhận giao dịch. Vui lòng thử lại sau giây lát!');
    } finally {
      setConfirming(false);
    }
  };

  if (!isOpen) return null;

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
              <p className="text-xs text-slate-400">Quét mã VietQR chuyển khoản tự động tức thì</p>
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
          {successResult ? (
            /* Success State */
            <div className="py-8 text-center space-y-5 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-500/10">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-xl font-bold text-white">Thanh Toán & Nạp Credit Thành Công!</h4>
                <p className="text-sm text-slate-400">
                  Tài khoản của bạn đã được nâng cấp lên hạng{' '}
                  <span className="font-bold uppercase text-indigo-400">{successResult.tier}</span>
                </p>
              </div>

              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl inline-block text-left min-w-[280px]">
                <div className="flex justify-between text-sm py-1">
                  <span className="text-slate-400">Credit được cộng:</span>
                  <span className="font-semibold text-emerald-400">+{successResult.credits_added.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm py-1 border-t border-slate-800/80 mt-1 pt-1">
                  <span className="text-slate-400">Số dư hiện tại:</span>
                  <span className="font-bold text-white">{successResult.new_balance.toLocaleString()} Credit</span>
                </div>
                <div className="flex justify-between text-xs py-1 text-slate-400">
                  <span>Quy đổi chữ:</span>
                  <span className="text-indigo-400">~{(successResult.new_balance * 5).toLocaleString()} chữ</span>
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
          ) : (
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

                {loadingOrder ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                    <p className="text-sm text-slate-400">Đang khởi tạo mã QR thanh toán...</p>
                  </div>
                ) : orderData ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    {/* VietQR Image Card */}
                    <div className="flex flex-col items-center bg-white p-3.5 rounded-xl shadow-lg">
                      <div className="w-full flex items-center justify-between border-b pb-2 mb-2 text-slate-800">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Vietcombank</span>
                        <span className="text-[10px] text-slate-500 font-medium">VietQR 24/7</span>
                      </div>
                      <img
                        src={orderData.qr_code_url}
                        alt="Mã QR nạp tiền"
                        className="w-48 h-48 object-contain rounded"
                      />
                      <p className="text-[11px] text-slate-500 font-medium mt-2 text-center">
                        Quét bằng mọi ứng dụng Mobile Banking
                      </p>
                    </div>

                    {/* Details Table */}
                    <div className="space-y-3">
                      <div>
                        <span className="text-xs text-slate-400">Ngân hàng thụ hưởng:</span>
                        <div className="flex items-center justify-between font-medium text-sm text-white bg-slate-900 px-3 py-2 rounded-lg mt-0.5 border border-slate-800">
                          <span>Vietcombank (VCB)</span>
                          <span className="text-xs text-indigo-400 font-mono">BIN 970436</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-xs text-slate-400">Số tài khoản:</span>
                        <div className="flex items-center justify-between font-mono font-bold text-white bg-slate-900 px-3 py-2 rounded-lg mt-0.5 border border-slate-800">
                          <span className="text-amber-400">{orderData.bank_info.account_number}</span>
                          <button
                            onClick={() => handleCopy(orderData.bank_info.account_number, 'account')}
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
                          <span>{orderData.amount_vnd.toLocaleString()} VNĐ</span>
                          <button
                            onClick={() => handleCopy(orderData.amount_vnd.toString(), 'amount')}
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
                          <span className="tracking-wider">{orderData.order_code}</span>
                          <button
                            onClick={() => handleCopy(orderData.order_code, 'code')}
                            className="text-xs bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 px-2 py-1 rounded flex items-center gap-1 transition"
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
                ) : null}

                <div className="mt-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-start gap-2.5 text-xs text-indigo-300">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-indigo-400" />
                  <p>
                    Vui lòng <strong className="text-white">sao chép chính xác nội dung chuyển khoản</strong> để hệ thống tự động nhận diện và cộng credit ngay sau khi hoàn tất.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="text-xs text-slate-400">
                  Tỷ lệ quy đổi: <span className="text-slate-200 font-medium">1 Credit = 5 chữ</span>
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
                    disabled={confirming || !orderData}
                    onClick={handleConfirmPayment}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition disabled:opacity-50 w-full sm:w-auto"
                  >
                    {confirming ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Đang kiểm tra giao dịch...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        Tôi đã chuyển khoản thành công
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
