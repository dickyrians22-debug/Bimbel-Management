import React from 'react';
import {
  Users,
  DollarSign,
  TrendingDown,
  Wallet,
  CalendarCheck,
  ArrowUpRight,
  ArrowDownRight,
  UserPlus,
  PlusCircle,
  Printer,
  Sparkles,
  CheckCircle2,
  Clock,
  BookOpen,
  ChevronRight,
  TrendingUp,
  KeyRound,
  FileEdit,
  Trash2,
  Receipt,
} from 'lucide-react';
import { Student, AttendanceRecord, IncomeRecord, ExpenseRecord, ActiveTab, BimbelSettings, UserSession } from '../../types';
import {
  formatRupiah,
  getTodayDateString,
  MONTH_NAMES_ID,
  formatDateIndo,
  calculateAnnualPL,
  isSystemIncomeCategory,
} from '../../utils/storage';

interface DashboardOwnerProps {
  students: Student[];
  attendance: AttendanceRecord[];
  incomes: IncomeRecord[];
  expenses: ExpenseRecord[];
  settings?: BimbelSettings;
  currentUser?: UserSession;
  onNavigate: (tab: ActiveTab) => void;
  onOpenStudentModal: () => void;
  onOpenAttendanceModal: (editRecord?: AttendanceRecord) => void;
  onOpenIncomeModal: () => void;
  onOpenExpenseModal: () => void;
  onOpenChangePasswordModal?: () => void;
  onDeleteAttendance?: (id: string, name: string) => void;
}

export const DashboardOwner: React.FC<DashboardOwnerProps> = ({
  students,
  attendance,
  incomes,
  expenses,
  settings,
  currentUser,
  onNavigate,
  onOpenStudentModal,
  onOpenAttendanceModal,
  onOpenIncomeModal,
  onOpenExpenseModal,
  onOpenChangePasswordModal,
  onDeleteAttendance,
}) => {
  const today = getTodayDateString();
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const currentMonthPrefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

  const bimbelName = settings?.bimbelName || 'BIMBEL SIGMA';
  const tagline = settings?.tagline || 'Belajar Sampai Paham, Bukan Sekadar Hafal';
  const ownerDisplayName = currentUser?.name || settings?.ownerName || 'Budi Santoso, S.Pd.';

  const ownerBadge = settings?.ownerDashboardBadge || 'Executive Dashboard (Owner Access)';
  const ownerTitle = settings?.ownerDashboardTitle || `${bimbelName} • ${ownerDisplayName}`;
  const ownerMessage = settings?.ownerDashboardMessage || `“${tagline}”. Selamat datang, ${ownerDisplayName}! Pantau metrik finansial, absensi digital real-time, dan pembukuan tahunan dalam satu pintu.`;

  // KPI Calculations
  const activeStudents = students.filter((s) => s.status === 'Aktif');
  const totalStudents = students.length;

  // Monthly Cash In
  const monthIncomes = incomes.filter((i) => i.datePaid && i.datePaid.startsWith(currentMonthPrefix));
  const totalMonthIncome = monthIncomes.reduce((sum, i) => sum + (i.amount || 0), 0);

  // Monthly Expenses
  const monthExpenses = expenses.filter((e) => e.date && e.date.startsWith(currentMonthPrefix));
  const totalMonthExpense = monthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  // Net Cash Flow this month
  const netCashFlow = totalMonthIncome - totalMonthExpense;

  // Today Attendance
  const todayAttendance = attendance.filter((a) => a.date === today);
  const todayPresent = todayAttendance.filter((a) => a.status === 'Hadir').length;

  // Monthly Lessons
  const monthAttendance = attendance.filter((a) => a.date && a.date.startsWith(currentMonthPrefix));
  const monthSessions = monthAttendance.filter((a) => a.status === 'Hadir').length;

  // Estimated uncollected tuition (Total billable for active students this month minus paid accrual)
  const totalBillableThisMonth = activeStudents.reduce((sum, std) => {
    const stdMonthSessions = monthAttendance.filter((a) => a.studentId === std.id && a.status === 'Hadir').length;
    return sum + stdMonthSessions * std.pricePerSession;
  }, 0);

  const accrualPaidThisMonth = incomes
    .filter(
      (i) =>
        i.accrualMonth === currentMonth &&
        i.accrualYear === currentYear &&
        isSystemIncomeCategory(i.category, settings)
    )
    .reduce((sum, i) => sum + (i.amount || 0), 0);

  const estimatedUncollected = Math.max(0, totalBillableThisMonth - accrualPaidThisMonth);

  // 12-Month P&L Overview
  const plData = calculateAnnualPL(currentYear, attendance, incomes, expenses);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Minimalist Header & Quick Actions */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                {ownerBadge}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {formatDateIndo(today)}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {ownerTitle}
            </h2>
            <p className="text-slate-500 text-sm max-w-2xl font-normal leading-relaxed">
              {ownerMessage}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0">
            {onOpenChangePasswordModal && (
              <button
                onClick={onOpenChangePasswordModal}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                title="Ganti Password Akun Owner"
              >
                <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                Password
              </button>
            )}
            <button
              onClick={() => onNavigate('student-billing')}
              className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200 text-indigo-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Receipt className="w-3.5 h-3.5 text-indigo-600" />
              Tagihan Siswa
            </button>
            <button
              onClick={() => onNavigate('cash-book')}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
              Buku Kas
            </button>
            <button
              onClick={onOpenStudentModal}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
            >
              <UserPlus className="w-3.5 h-3.5 text-indigo-600" />
              + Siswa Baru
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pemasukan Kas Bulan Ini */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Pemasukan ({MONTH_NAMES_ID[currentMonth - 1]})
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/80">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold tracking-tight text-slate-900">
              {formatRupiah(totalMonthIncome)}
            </h3>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                <ArrowUpRight className="w-3 h-3" />
                {monthIncomes.length} Transaksi
              </span>
              <span className="text-xs text-slate-400">bulan ini</span>
            </div>
          </div>
        </div>

        {/* Card 2: Pengeluaran Kas Bulan Ini */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Pengeluaran ({MONTH_NAMES_ID[currentMonth - 1]})
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100/80">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold tracking-tight text-slate-900">
              {formatRupiah(totalMonthExpense)}
            </h3>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                <ArrowDownRight className="w-3 h-3" />
                {monthExpenses.length} Beban
              </span>
              <span className="text-xs text-slate-400">operasional</span>
            </div>
          </div>
        </div>

        {/* Card 3: Sisa Kas Bersih (Net Cashflow) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Sisa Kas Bersih
            </span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
              netCashFlow >= 0 
                ? 'bg-indigo-50 text-indigo-600 border-indigo-100/80' 
                : 'bg-rose-50 text-rose-600 border-rose-100/80'
            }`}>
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className={`text-2xl font-bold tracking-tight ${
              netCashFlow >= 0 ? 'text-indigo-900' : 'text-rose-600'
            }`}>
              {formatRupiah(netCashFlow)}
            </h3>
            <div className="flex items-center gap-1.5 mt-2">
              <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-md border ${
                netCashFlow >= 0 
                  ? 'text-indigo-700 bg-indigo-50 border-indigo-100' 
                  : 'text-rose-700 bg-rose-50 border-rose-100'
              }`}>
                {netCashFlow >= 0 ? 'Surplus' : 'Defisit'}
              </span>
              <span className="text-xs text-slate-400">arus kas riil</span>
            </div>
          </div>
        </div>

        {/* Card 4: Siswa Aktif & Hadir Hari Ini */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Siswa & Presensi
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold tracking-tight text-slate-900">
                {activeStudents.length}
              </h3>
              <span className="text-xs text-slate-400 font-medium">Siswa Aktif</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                <CheckCircle2 className="w-3 h-3" />
                {todayPresent} Hadir Hari Ini
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Live Today Attendance & Mini P&L Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Attendance Today & Recent Sessions */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center">
                <CalendarCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Daftar Siswa Berangkat Hari Ini ({formatDateIndo(today)})
                </h3>
                <p className="text-xs text-slate-500">
                  {todayAttendance.length} siswa tercatat di daftar kehadiran hari ini
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAttendanceModal?.()}
                className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/70 rounded-lg transition cursor-pointer"
              >
                + Input Absen
              </button>
              <button
                onClick={() => onNavigate('attendance')}
                className="text-xs text-slate-500 hover:text-indigo-600 font-semibold flex items-center gap-0.5 transition cursor-pointer"
              >
                Lihat Semua <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {todayAttendance.length === 0 ? (
            <div className="text-center py-12 px-4 bg-slate-50/70 rounded-xl border border-dashed border-slate-200">
              <Clock className="w-9 h-9 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">Belum ada siswa yang absen hari ini</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Klik tombol "+ Input Absen" atau siswa dapat melakukan absen mandiri melalui portal.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-84 overflow-y-auto">
              {todayAttendance.map((rec) => (
                <div
                  key={rec.id}
                  className="py-2.5 px-2 flex items-center justify-between hover:bg-slate-50/80 rounded-xl transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200/80 text-slate-700 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      {rec.time}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900 text-sm">{rec.studentName}</span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {rec.studentCode}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                            rec.classType === 'Privat'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          }`}
                        >
                          {rec.classType}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <BookOpen className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate max-w-xs">{rec.topic}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="text-right">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-md border ${
                          rec.status === 'Hadir'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : rec.status === 'Izin'
                            ? 'bg-amber-50 text-amber-700 border-amber-100'
                            : rec.status === 'Sakit'
                            ? 'bg-blue-50 text-blue-700 border-blue-100'
                            : 'bg-rose-50 text-rose-700 border-rose-100'
                        }`}
                      >
                        {rec.status}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">{rec.tutorName}</p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onOpenAttendanceModal(rec)}
                        title="Edit Presensi"
                        className="p-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg border border-slate-200/80 transition cursor-pointer"
                      >
                        <FileEdit className="w-3.5 h-3.5" />
                      </button>
                      {onDeleteAttendance && (
                        <button
                          onClick={() => onDeleteAttendance(rec.id, `${rec.studentName} (${rec.time})`)}
                          title="Hapus Presensi"
                          className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg border border-slate-200/80 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Quick P&L Summary & Actions */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Laba Rugi {currentYear}
                  </h3>
                  <p className="text-[11px] text-slate-400">Ringkasan akrual bulanan</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('profit-loss')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                Detail →
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {plData.slice(0, 6).map((item) => (
                <div key={item.month} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600 font-medium">{item.monthName}</span>
                    <span
                      className={`font-semibold ${item.accrualNetProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}
                    >
                      {formatRupiah(item.accrualNetProfit)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex">
                    <div
                      style={{
                        width: `${Math.min(
                          100,
                          (item.accrualIncome / (item.accrualIncome + item.totalExpenses || 1)) * 100
                        )}%`,
                      }}
                      className="bg-emerald-500 h-full"
                    />
                    <div
                      style={{
                        width: `${Math.min(
                          100,
                          (item.totalExpenses / (item.accrualIncome + item.totalExpenses || 1)) * 100
                        )}%`,
                      }}
                      className="bg-rose-500 h-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-900">Kartu Presensi</p>
                <p className="text-[11px] text-slate-500">Format 1/4 lembar kertas A4</p>
              </div>
              <button
                onClick={() => onNavigate('print-cards')}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
