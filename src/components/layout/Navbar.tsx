import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldCheck,
  GraduationCap,
  Users,
  LogOut,
  Clock,
  Menu,
  KeyRound,
  Globe,
  ChevronDown,
  Cloud,
  CheckCircle2,
} from 'lucide-react';
import { UserSession, UserRole, UserAccount, BimbelSettings } from '../../types';
import { UserAvatar } from '../common/UserAvatar';

interface NavbarProps {
  currentUser: UserSession;
  users?: UserAccount[];
  settings?: BimbelSettings;
  isCloudConnected?: boolean;
  onSwitchUser?: (user: UserSession) => void;
  onLogout: () => void;
  onResetData?: () => void;
  onToggleMobileSidebar: () => void;
  onOpenChangePasswordModal?: () => void;
  onOpenPublicPortal?: () => void;
  todayAttendanceCount?: number;
  totalStudentsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  settings,
  isCloudConnected = true,
  onLogout,
  onToggleMobileSidebar,
  onOpenChangePasswordModal,
  onOpenPublicPortal,
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const bimbelName = settings?.sidebarFooterTitle || 'BIMBEL SIGMA';
  const tagline = (settings?.sidebarFooterTagline || '“Belajar Sampai Paham”').replace(/[“”"]/g, '');
  const logoSymbol = settings?.logoSymbol || 'Σ';
  const appVersionBadge = settings?.appVersionBadge || 'v2.6 PRO';

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setTimeStr(
        d.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' WIB'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'owner':
        return {
          label: 'OWNER (SUPER ADMIN)',
          shortLabel: 'OWNER',
          bg: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-amber-500/20',
          dotColor: 'bg-amber-400',
          icon: <ShieldCheck className="w-3.5 h-3.5 shrink-0" />,
        };
      case 'tutor':
        return {
          label: 'TUTOR / PENGAJAR',
          shortLabel: 'TUTOR',
          bg: 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-teal-500/20',
          dotColor: 'bg-teal-400',
          icon: <GraduationCap className="w-3.5 h-3.5 shrink-0" />,
        };
      case 'siswa':
        return {
          label: 'SISWA / ORANG TUA',
          shortLabel: 'SISWA',
          bg: 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-indigo-500/20',
          dotColor: 'bg-indigo-400',
          icon: <Users className="w-3.5 h-3.5 shrink-0" />,
        };
    }
  };

  const badge = getRoleBadge(currentUser.role);

  return (
    <header className="no-print sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-xl shrink-0 w-full">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          {/* Left: Mobile Toggle & Brand */}
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1">
            <button
              onClick={onToggleMobileSidebar}
              className="lg:hidden p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none transition cursor-pointer shrink-0 active:scale-95"
              title="Buka Menu Navigasi"
              aria-label="Buka Menu"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-amber-500 flex items-center justify-center font-black text-sm sm:text-2xl text-white shadow-lg shadow-indigo-500/30 shrink-0 select-none">
                {logoSymbol}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h1 className="text-xs sm:text-base md:text-lg font-black tracking-tight font-heading text-white truncate max-w-[105px] xs:max-w-[150px] sm:max-w-xs md:max-w-md">
                    {bimbelName}
                  </h1>
                  {appVersionBadge && (
                    <span className="hidden md:inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-800/80 shrink-0">
                      {appVersionBadge}
                    </span>
                  )}
                </div>
                {tagline && (
                  <p className="text-[11px] font-medium text-amber-300/90 tracking-wide hidden lg:block truncate max-w-md">
                    “{tagline}”
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right: Actions, Live Clock, User Profile, & Logout */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Cloud Realtime Status (Hidden on Mobile) */}
            <div
              title={isCloudConnected ? 'Cloud Firebase Firestore Terhubung Realtime' : 'Mode Offline / Local Storage'}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-[11px] font-medium text-slate-300"
            >
              <span className={`w-2 h-2 rounded-full ${isCloudConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-slate-300 font-medium">{isCloudConnected ? 'Cloud Sync' : 'Local Mode'}</span>
            </div>

            {/* Live Clock (Hidden on Mobile/Tablet) */}
            <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs font-mono text-slate-300">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{timeStr}</span>
            </div>

            {/* Portal Publik Button (Desktop only in topbar) */}
            {onOpenPublicPortal && (
              <button
                onClick={onOpenPublicPortal}
                title="Buka Halaman Portal Publik (PPDB & Cek Mandiri)"
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-900/40 hover:bg-indigo-800/70 text-indigo-300 border border-indigo-700/50 hover:border-indigo-600 text-xs font-bold transition cursor-pointer active:scale-95 shrink-0"
              >
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                <span>Portal Publik</span>
              </button>
            )}

            {/* Change Password Button (Desktop/Tablet) */}
            {onOpenChangePasswordModal && (
              <button
                onClick={onOpenChangePasswordModal}
                title={`Ganti Kata Sandi (${currentUser?.name || 'Pengguna'})`}
                className="hidden sm:flex p-2 rounded-xl text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition cursor-pointer shrink-0"
              >
                <KeyRound className="w-4 h-4" />
              </button>
            )}

            {/* User Profile Card & Interactive Mobile Dropdown */}
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-1.5 sm:gap-2.5 p-1 sm:px-3 sm:py-1.5 rounded-xl sm:rounded-2xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 shadow-xs cursor-pointer transition active:scale-95"
                title={`Profil: ${currentUser.name} (${badge.label})`}
              >
                <div className="relative">
                  <UserAvatar
                    avatar={currentUser.avatar}
                    name={currentUser.name}
                    role={currentUser.role}
                    size="sm"
                    rounded="rounded-lg sm:rounded-xl"
                  />
                  {/* Small role dot indicator on mobile */}
                  <span className={`sm:hidden absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${badge.dotColor}`} />
                </div>

                <div className="hidden md:block text-left">
                  <p className="text-xs font-bold text-slate-100 truncate max-w-[120px] leading-tight">
                    {currentUser.name}
                  </p>
                  <p className="text-[10px] font-medium text-slate-400 font-mono leading-none mt-0.5">
                    @{currentUser.username || currentUser.code}
                  </p>
                </div>

                {/* Role badge pill on sm: and up */}
                <span
                  className={`hidden sm:inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 sm:py-1 rounded-lg sm:rounded-xl shadow-xs ${badge.bg}`}
                >
                  {badge.icon}
                  <span className="tracking-wider">{badge.shortLabel}</span>
                </span>

                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-2.5 space-y-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* User Information Header */}
                  <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-700/60 space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <UserAvatar
                        avatar={currentUser.avatar}
                        name={currentUser.name}
                        role={currentUser.role}
                        size="md"
                        rounded="rounded-xl"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate">
                          {currentUser.name}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          @{currentUser.username || currentUser.code}
                        </p>
                      </div>
                    </div>

                    <div className="pt-1 flex items-center justify-between border-t border-slate-800">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md ${badge.bg}`}>
                        {badge.icon}
                        <span>{badge.label}</span>
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${isCloudConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                        {isCloudConnected ? 'Online Sync' : 'Local'}
                      </span>
                    </div>
                  </div>

                  {/* Actions inside Dropdown */}
                  <div className="space-y-1">
                    {onOpenChangePasswordModal && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onOpenChangePasswordModal();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-700/70 rounded-xl transition cursor-pointer text-left"
                      >
                        <KeyRound className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Ganti Kata Sandi</span>
                      </button>
                    )}

                    {onOpenPublicPortal && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onOpenPublicPortal();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-indigo-300 hover:text-white hover:bg-indigo-900/50 rounded-xl transition cursor-pointer text-left"
                      >
                        <Globe className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span>Buka Portal Publik PPDB</span>
                      </button>
                    )}

                    <div className="pt-1 border-t border-slate-700/60">
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-300 hover:text-white hover:bg-rose-900/60 rounded-xl transition cursor-pointer text-left"
                      >
                        <LogOut className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>Keluar dari Akun (Logout)</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Logout Button (Always Accessible with Zero Clipping) */}
            <button
              onClick={onLogout}
              title="Keluar dari Akun (Logout)"
              className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 hover:border-rose-700 text-xs font-bold transition cursor-pointer active:scale-95 shrink-0"
              aria-label="Keluar dari Akun"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
