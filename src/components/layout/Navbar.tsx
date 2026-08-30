import React from 'react';
import {
  ShieldCheck,
  GraduationCap,
  Users,
  LogOut,
  Clock,
  Menu,
  KeyRound,
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
}) => {
  const [timeStr, setTimeStr] = React.useState('');

  const bimbelName = settings?.sidebarFooterTitle || 'BIMBEL SIGMA';
  const tagline = (settings?.sidebarFooterTagline || '“Belajar Sampai Paham”').replace(/[“”"]/g, '');
  const logoSymbol = settings?.logoSymbol || 'Σ';
  const appVersionBadge = settings?.appVersionBadge || 'v2.6 PRO';

  React.useEffect(() => {
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

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'owner':
        return {
          label: 'OWNER (SUPER ADMIN)',
          shortLabel: 'OWNER',
          bg: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-amber-500/20',
          icon: <ShieldCheck className="w-3.5 h-3.5 shrink-0" />,
        };
      case 'tutor':
        return {
          label: 'TUTOR / PENGAJAR',
          shortLabel: 'TUTOR',
          bg: 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-teal-500/20',
          icon: <GraduationCap className="w-3.5 h-3.5 shrink-0" />,
        };
      case 'siswa':
        return {
          label: 'SISWA / ORANG TUA',
          shortLabel: 'SISWA',
          bg: 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-indigo-500/20',
          icon: <Users className="w-3.5 h-3.5 shrink-0" />,
        };
    }
  };

  const badge = getRoleBadge(currentUser.role);

  return (
    <header className="no-print sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-xl shrink-0">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-1 sm:gap-4">
          {/* Left: Mobile Toggle & Brand */}
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
            <button
              onClick={onToggleMobileSidebar}
              className="lg:hidden p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none transition cursor-pointer shrink-0"
              title="Buka Menu"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-amber-500 flex items-center justify-center font-black text-lg sm:text-2xl text-white shadow-lg shadow-indigo-500/30 shrink-0">
                {logoSymbol}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h1 className="text-xs sm:text-lg font-black tracking-tight font-heading text-white truncate max-w-[110px] xs:max-w-[160px] sm:max-w-xs md:max-w-md">
                    {bimbelName}
                  </h1>
                  {appVersionBadge && (
                    <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-800/80 shrink-0">
                      {appVersionBadge}
                    </span>
                  )}
                </div>
                {tagline && (
                  <p className="text-[11px] font-medium text-amber-300/90 tracking-wide hidden md:block truncate max-w-md">
                    “{tagline}”
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right: Role Switcher, Clock, Cloud Status, Demo Reset, User Profile */}
          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            {/* Cloud Realtime Status */}
            <div
              title={isCloudConnected ? 'Cloud Firebase Firestore Terhubung Realtime' : 'Mode Offline / Local Storage'}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-[11px] font-medium text-slate-300"
            >
              <span className={`w-2 h-2 rounded-full ${isCloudConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-slate-300 font-medium">{isCloudConnected ? 'Cloud Sync' : 'Local Mode'}</span>
            </div>

            {/* Live Clock */}
            <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs font-mono text-slate-300">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{timeStr}</span>
            </div>

            {/* User Profile & Role Indicator Badge (Strict Access - No Quick Switch) */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-xs">
              <UserAvatar
                avatar={currentUser.avatar}
                name={currentUser.name}
                role={currentUser.role}
                size="sm"
                rounded="rounded-xl"
              />
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-slate-100 truncate max-w-[130px] leading-tight">
                  {currentUser.name}
                </p>
                <p className="text-[10px] font-medium text-slate-400 font-mono leading-none mt-0.5">
                  @{currentUser.username || currentUser.code}
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-extrabold px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-lg sm:rounded-xl shadow-xs ${badge.bg}`}
              >
                {badge.icon}
                <span className="sm:hidden tracking-wider">{badge.shortLabel}</span>
                <span className="hidden sm:inline tracking-wider">{badge.label}</span>
              </span>
            </div>

            {/* Change Password Button */}
            {onOpenChangePasswordModal && (
              <button
                onClick={onOpenChangePasswordModal}
                title={`Ganti Kata Sandi (${currentUser?.name || 'Pengguna'})`}
                className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
              </button>
            )}

            {/* Logout Button (The only way to leave current role/dashboard) */}
            <button
              onClick={onLogout}
              title="Keluar dari Akun (Logout)"
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 hover:border-rose-700 text-xs font-bold transition cursor-pointer active:scale-95 shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
