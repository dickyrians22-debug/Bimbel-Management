import React from 'react';
import {
  LayoutDashboard,
  Users,
  CalendarCheck2,
  Printer,
  DollarSign,
  TrendingDown,
  BarChart3,
  Sparkles,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Settings,
  Wallet,
  Receipt,
} from 'lucide-react';
import { ActiveTab, UserSession, BimbelSettings } from '../../types';
import { UserAvatar } from '../common/UserAvatar';

interface SidebarProps {
  currentTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  currentUser: UserSession;
  isOpenMobile: boolean;
  onCloseMobile?: () => void;
  todayAttendanceCount: number;
  totalStudentsCount: number;
  settings?: BimbelSettings;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  isOpenMobile,
  onCloseMobile,
  todayAttendanceCount,
  totalStudentsCount,
  settings,
}) => {
  const role = currentUser.role;

  const footerTitle = settings?.sidebarFooterTitle || 'BIMBEL SIGMA';
  const footerTagline = settings?.sidebarFooterTagline || '“Belajar Sampai Paham”';
  const footerNote = settings?.sidebarFooterNote || 'Data tersimpan aman di LocalStorage browser';

  interface NavItem {
    id: ActiveTab;
    label: string;
    icon: React.ReactNode;
    badge?: string | number;
    badgeColor?: string;
    description?: string;
  }

  const getNavItems = (): NavItem[] => {
    if (role === 'owner') {
      return [
        {
          id: 'dashboard',
          label: 'Dashboard KPI',
          icon: <LayoutDashboard className="w-4 h-4" />,
          description: 'Ringkasan performa & keuangan',
        },
        {
          id: 'students',
          label: 'Database Siswa',
          icon: <Users className="w-4 h-4" />,
          badge: totalStudentsCount,
          badgeColor: 'bg-indigo-100 text-indigo-700',
          description: 'Kelola data & tarif les siswa',
        },
        {
          id: 'attendance',
          label: 'Presensi & Sesi',
          icon: <CalendarCheck2 className="w-4 h-4" />,
          badge: todayAttendanceCount > 0 ? `${todayAttendanceCount} Hari Ini` : undefined,
          badgeColor: 'bg-emerald-100 text-emerald-700',
          description: 'Log harian & absensi digital',
        },
        {
          id: 'student-billing',
          label: 'Tagihan Siswa',
          icon: <Receipt className="w-4 h-4 text-emerald-600" />,
          badge: 'Otomatis',
          badgeColor: 'bg-emerald-100 text-emerald-800',
          description: 'Belajar dulu baru bayar (Presensi × Tarif)',
        },
        {
          id: 'cash-book',
          label: 'Buku Kas (Arus Kas)',
          icon: <BookOpen className="w-4 h-4 text-indigo-600" />,
          description: 'Kas masuk, kas keluar, & saldo berjalan',
        },
        {
          id: 'salary',
          label: 'Honor & Gaji Tutor',
          icon: <Wallet className="w-4 h-4 text-amber-600" />,
          description: 'Kalkulator & rekap gaji pengajar',
        },
        {
          id: 'profit-loss',
          label: 'Laba Rugi (P&L)',
          icon: <BarChart3 className="w-4 h-4 text-indigo-600" />,
          description: 'Laporan bulanan detail & tahunan',
        },
        {
          id: 'print-cards',
          label: 'Rekap & Cetak Presensi',
          icon: <Printer className="w-4 h-4" />,
          description: 'Laporan 1 siswa & presensi kelas kelompok',
        },
        {
          id: 'settings',
          label: 'Pengaturan & Akun',
          icon: <Settings className="w-4 h-4 text-slate-700" />,
          description: 'Kelola akun tutor, siswa, & sistem',
        },
      ];
    } else if (role === 'tutor') {
      return [
        {
          id: 'dashboard',
          label: 'Dashboard Tutor',
          icon: <LayoutDashboard className="w-4 h-4" />,
          description: 'Jadwal & siswa hari ini',
        },
        {
          id: 'attendance',
          label: 'Presensi & Materi Ajar',
          icon: <CalendarCheck2 className="w-4 h-4" />,
          badge: `${todayAttendanceCount} Hari Ini`,
          badgeColor: 'bg-teal-100 text-teal-700',
          description: 'Input topik & catatan siswa',
        },
        {
          id: 'students',
          label: 'Daftar Siswa Binaan',
          icon: <Users className="w-4 h-4" />,
          badge: totalStudentsCount,
          badgeColor: 'bg-slate-100 text-slate-700',
          description: 'Profil kelas & kontak ortu',
        },
        {
          id: 'print-cards',
          label: 'Rekap & Kartu Cetak',
          icon: <Printer className="w-4 h-4" />,
          description: 'Kartu presensi 1/4 A4',
        },
        {
          id: 'salary',
          label: 'Honor & Slip Mengajar',
          icon: <Wallet className="w-4 h-4 text-amber-600" />,
          description: 'Rincian sesi & estimasi honor',
        },
      ];
    } else {
      // Role SISWA / ORTU
      return [
        {
          id: 'student-portal',
          label: 'Portal Siswa & Absen',
          icon: <Sparkles className="w-4 h-4 text-amber-500" />,
          description: 'Absen mandiri & status belajar',
        },
        {
          id: 'attendance',
          label: 'Riwayat Presensi Saya',
          icon: <CalendarCheck2 className="w-4 h-4" />,
          description: 'Daftar materi yang dipelajari',
        },
        {
          id: 'student-billing',
          label: 'Tagihan & Iuran Saya',
          icon: <Receipt className="w-4 h-4 text-emerald-600" />,
          description: 'Rincian sesi & status pembayaran',
        },
        {
          id: 'print-cards',
          label: 'Kartu Presensi Saya',
          icon: <Printer className="w-4 h-4" />,
          description: 'Preview & unduh kartu bulanan',
        },
      ];
    }
  };

  const navItems = getNavItems();

  const handleNavClick = (tab: ActiveTab) => {
    onSelectTab(tab);
    onCloseMobile?.();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden no-print"
          onClick={() => onCloseMobile?.()}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`no-print fixed lg:static inset-y-0 left-0 z-40 w-72 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 h-full shrink-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* User Card Header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <UserAvatar
              avatar={currentUser.avatar}
              name={currentUser.name}
              role={currentUser.role}
              size="md"
              rounded="rounded-2xl"
              className="border-2 border-indigo-600/30 shadow-sm"
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</h4>
              <p className="text-[11px] text-slate-500 truncate">{currentUser.specialty || currentUser.code}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span
                  className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                    role === 'owner'
                      ? 'bg-amber-100 text-amber-900'
                      : role === 'tutor'
                      ? 'bg-teal-100 text-teal-900'
                      : 'bg-indigo-100 text-indigo-900'
                  }`}
                >
                  {role === 'owner' ? '★ Owner' : role === 'tutor' ? '✦ Tutor' : '● Siswa/Wali'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          <div className="px-3 py-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
            Menu Utama
          </div>

          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition cursor-pointer group ${
                  isActive
                    ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/25'
                    : 'text-slate-700 hover:bg-slate-100/80 font-medium'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-2 rounded-xl transition ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600 group-hover:text-indigo-600'
                    }`}
                  >
                    {item.icon}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold leading-tight">{item.label}</p>
                    <p
                      className={`text-[10px] truncate ${
                        isActive ? 'text-indigo-100' : 'text-slate-400 group-hover:text-slate-500'
                      }`}
                    >
                      {item.description}
                    </p>
                  </div>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      isActive ? 'bg-white text-indigo-700 font-extrabold' : item.badgeColor || 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer Info Box */}
        <div className="p-4 border-t border-slate-100 bg-slate-50">
          <div className="p-3 bg-white border border-slate-200/80 rounded-xl text-center shadow-xs">
            <p className="text-[11px] font-extrabold text-indigo-950 font-heading">
              {footerTitle}
            </p>
            <p className="text-[10px] text-amber-700 font-semibold italic mt-0.5">
              {footerTagline}
            </p>
            {footerNote && (
              <p className="text-[9px] text-slate-400 mt-1">
                {footerNote}
              </p>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
