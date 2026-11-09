import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Sparkles,
  BookOpen,
  Volume2,
  Mic2,
  CreditCard,
  History,
  Key,
  ShieldCheck,
  Coins,
  Cpu,
  Menu,
  X,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCredit } from '../../contexts/CreditContext';
import { api } from '../../lib/api';
import { PaymentModal } from '../PaymentModal';

export const AppLayout: React.FC = () => {
  const { user, signOut } = useAuth();
  const { creditInfo, isTopupModalOpen, selectedPackageId, openTopupModal, closeTopupModal } = useCredit();
  const navigate = useNavigate();
  const location = useLocation();

  const [gpuOnline, setGpuOnline] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState<boolean>(false);

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
    const interval = setInterval(checkWorker, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const isAdmin = user?.email?.toLowerCase() === 'admin@gmail.com';

  const navLinks = [
    { name: 'Đọc văn bản', path: '/', icon: Sparkles },
    { name: 'Đọc truyện dài', path: '/story', icon: BookOpen },
    { name: 'Thư viện giọng', path: '/voices', icon: Volume2 },
    { name: 'Nhân bản giọng', path: '/clone', icon: Mic2, badge: 'AI' },
    { name: 'Gói cước', path: '/pricing', icon: CreditCard },
    { name: 'Lịch sử', path: '/history', icon: History },
    { name: 'API Keys', path: '/dashboard', icon: Key },
    ...(isAdmin ? [{ name: 'Duyệt nạp', path: '/admin/topup', icon: ShieldCheck, badge: 'Admin' }] : []),
  ];

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* LucyLab Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#0d121f]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            
            {/* Left: Brand Logo (LucyLab / Vivibe Style) */}
            <div className="flex items-center gap-6">
              <NavLink to="/" className="flex items-center gap-3 group">
                <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 transition-transform duration-300 group-hover:scale-105">
                  <div className="flex items-center gap-0.5">
                    <span className="w-1 h-3.5 bg-white rounded-full animate-pulse" />
                    <span className="w-1 h-5 bg-white rounded-full animate-pulse delay-75" />
                    <span className="w-1 h-3 bg-white rounded-full animate-pulse delay-150" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg font-bold tracking-tight text-white group-hover:text-indigo-300 transition">
                      Vivibe
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                      v3 Turbo
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium -mt-0.5">LucyLab AI Studio</p>
                </div>
              </NavLink>

              {/* Desktop Nav Items */}
              <nav className="hidden xl:flex items-center gap-1 ml-4">
                {navLinks.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                        isActive
                          ? 'bg-slate-800 text-white shadow-sm border border-slate-700/60'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                      <span>{item.name}</span>
                      {item.badge && (
                        <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-pink-500/20 text-pink-400 border border-pink-500/30">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            {/* Right: GPU Status + Credit Pill + User Menu */}
            <div className="flex items-center gap-3">
              {/* GPU Badge */}
              <div
                className={`hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-full border text-xs font-medium transition ${
                  gpuOnline
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
                title={gpuOnline ? 'GPU Tesla T4 Colab đang hoạt động' : 'GPU Worker đang offline'}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    gpuOnline ? 'bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400' : 'bg-rose-400'
                  }`}
                />
                <span className="text-[11px] font-semibold">{gpuOnline ? 'GPU T4 Online' : 'GPU Offline'}</span>
              </div>

              {/* Credit Balance Button */}
              {creditInfo && (
                <button
                  type="button"
                  onClick={() => openTopupModal()}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-indigo-500/50 transition group"
                >
                  <div className="w-5 h-5 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                    <Coins className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs font-bold font-mono text-white group-hover:text-indigo-300 transition">
                      {creditInfo.credit_balance.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Cr</span>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 group-hover:bg-indigo-500 transition ml-0.5">
                    + Nạp
                  </span>
                </button>
              )}

              {/* User Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1 pl-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-left transition"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center text-xs font-bold uppercase shadow-sm">
                    {user?.email?.[0] || 'U'}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                </button>

                {userDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserDropdownOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#111726] border border-slate-800 shadow-2xl p-2 z-50 text-xs">
                      <div className="p-2.5 border-b border-slate-800/80 mb-1">
                        <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Tài khoản</p>
                        <p className="font-semibold text-slate-200 truncate mt-0.5">{user?.email}</p>
                        <div className="flex items-center justify-between mt-2 pt-1">
                          <span className="text-slate-400">Gói hiện tại:</span>
                          <span className="font-bold uppercase text-indigo-400 px-1.5 py-0.5 rounded bg-indigo-500/10">
                            {creditInfo?.tier || 'Normal'}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          openTopupModal();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/70 transition"
                      >
                        <Coins className="w-4 h-4 text-amber-400" />
                        <span>Nạp thêm Credit</span>
                      </button>

                      <NavLink
                        to="/pricing"
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/70 transition"
                      >
                        <CreditCard className="w-4 h-4 text-indigo-400" />
                        <span>Xem bảng giá gói cước</span>
                      </NavLink>

                      <NavLink
                        to="/dashboard"
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/70 transition"
                      >
                        <Key className="w-4 h-4 text-purple-400" />
                        <span>Quản lý API Key</span>
                      </NavLink>

                      <div className="border-t border-slate-800/80 my-1" />

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Mobile Menu Trigger */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="xl:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Navigation Row for Quick Switching */}
        <div className="hidden md:flex border-t border-slate-800/40 bg-[#0a0e18]/60 px-4 sm:px-6 lg:px-8 py-1.5 overflow-x-auto scrollbar-none">
          <div className="max-w-7xl mx-auto w-full flex items-center gap-2 text-xs">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium whitespace-nowrap transition ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="xl:hidden border-t border-slate-800 bg-[#0d121f] p-4 space-y-2">
            <div className="mb-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${gpuOnline ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                <span className="text-xs font-semibold text-slate-300">
                  {gpuOnline ? 'GPU Tesla T4 Online' : 'GPU Worker Offline'}
                </span>
              </div>
              {creditInfo && (
                <span className="text-xs font-mono font-bold text-amber-400">
                  {creditInfo.credit_balance.toLocaleString()} Cr
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-slate-900/60 border border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Main Workspace Canvas */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      {/* LucyLab Studio Footer */}
      <footer className="border-t border-slate-800/60 bg-[#0a0e18] py-6 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">Vivibe AI Studio</span>
            <span>•</span>
            <span>Hệ thống chuyển văn bản thành giọng nói tiếng Việt chất lượng cao</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Được hỗ trợ bởi VieNeu-TTS v3 Turbo</span>
            <span>•</span>
            <span className="text-emerald-400 font-mono">Realtime 48kHz HD</span>
          </div>
        </div>
      </footer>

      {/* Global Topup Modal */}
      <PaymentModal
        isOpen={isTopupModalOpen}
        onClose={closeTopupModal}
        initialPackageId={selectedPackageId}
      />
    </div>
  );
};
