import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Mic, History, Key, LogOut, Radio, Cpu, Menu, X, CreditCard, Plus, Sparkles, Coins } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCredit } from '../../contexts/CreditContext';
import { api } from '../../lib/api';
import { Badge } from '../ui/Badge';
import { PaymentModal } from '../PaymentModal';

export const AppLayout: React.FC = () => {
  const { user, signOut } = useAuth();
  const { creditInfo, isTopupModalOpen, selectedPackageId, openTopupModal, closeTopupModal } = useCredit();
  const navigate = useNavigate();
  const [gpuOnline, setGpuOnline] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Thường xuyên thăm dò trạng thái kết nối của Worker GPU
  useEffect(() => {
    const checkWorker = async () => {
      try {
        const res = await api.getWorkerStatus();
        setGpuOnline(res.gpu_worker.connected);
      } catch (err) {
        setGpuOnline(false);
      }
    };

    checkWorker();
    const interval = setInterval(checkWorker, 10000); // Mỗi 10s
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { name: 'Studio TTS', path: '/', icon: Mic },
    { name: 'Gói cước & Nạp Credit', path: '/pricing', icon: CreditCard },
    { name: 'Lịch sử phát âm', path: '/history', icon: History },
    { name: 'Developer & Keys', path: '/dashboard', icon: Key },
  ];

  const getTierBadgeStyle = (tier?: string) => {
    switch (tier) {
      case 'ultra':
        return 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-extrabold';
      case 'pro':
        return 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold';
      case 'plus':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold';
      default:
        return 'bg-slate-800 text-slate-300 font-medium';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row text-slate-100">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/30">
            V
          </div>
          <span className="font-bold text-base tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            VieNeu-TTS
          </span>
        </div>

        <div className="flex items-center gap-2">
          {creditInfo && (
            <button
              onClick={() => openTopupModal()}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold"
            >
              <Coins className="w-3.5 h-3.5 text-indigo-400" />
              <span>{creditInfo.credit_balance.toLocaleString()} Cr</span>
            </button>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900/90 border-r border-slate-800/80 backdrop-blur-2xl flex flex-col justify-between transition-transform duration-300 md:static md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Logo Brand */}
          <div className="p-6 border-b border-slate-800/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-indigo-500/30">
                VN
              </div>
              <div>
                <h1 className="font-bold text-base leading-tight tracking-tight text-white">VieNeu Studio</h1>
                <p className="text-[11px] text-indigo-400 font-mono">v3 Turbo Engine</p>
              </div>
            </div>

            {/* GPU Worker Status Indicator */}
            <div className="mt-4 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-medium text-slate-300">Colab T4 GPU:</span>
              </div>
              <Badge variant={gpuOnline ? 'green' : 'red'} size="sm" pulse={gpuOnline}>
                {gpuOnline ? 'ONLINE' : 'OFFLINE'}
              </Badge>
            </div>

            {/* User Credit Balance Widget */}
            <div className="mt-3 p-3 rounded-xl bg-gradient-to-b from-indigo-950/30 to-slate-950/80 border border-indigo-500/30">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-indigo-400" /> Số dư Credit:
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider ${getTierBadgeStyle(creditInfo?.tier)}`}>
                  {creditInfo?.tier || 'normal'}
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-lg font-extrabold text-white font-mono">
                    {creditInfo ? creditInfo.credit_balance.toLocaleString() : '---'}
                  </span>
                  <span className="text-xs text-slate-400 ml-1">Cr</span>
                </div>
                <button
                  onClick={() => openTopupModal()}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1 shadow transition"
                  title="Nạp thêm credit"
                >
                  <Plus className="w-3 h-3" /> Nạp
                </button>
              </div>

              <p className="text-[10px] text-slate-400 mt-1">
                Tương đương: <strong className="text-slate-300">~{((creditInfo?.credit_balance || 0) * 5).toLocaleString()}</strong> chữ
              </p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Info & Logout Footer */}
        <div className="p-4 border-t border-slate-800/60">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/40">
            <div className="truncate pr-2">
              <p className="text-xs font-semibold text-slate-200 truncate">{user?.email || 'Người dùng'}</p>
              <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Đã kích hoạt
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-h-screen overflow-y-auto p-4 md:p-8">
        <Outlet />
      </main>

      {/* Global Payment QR Modal */}
      <PaymentModal
        isOpen={isTopupModalOpen}
        onClose={closeTopupModal}
        initialPackageId={selectedPackageId}
      />
    </div>
  );
};
