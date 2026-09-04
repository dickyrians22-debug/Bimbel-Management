import React from 'react';
import {
  Sparkles,
  CheckCircle2,
  Calendar,
  Clock,
  BookOpen,
  Users,
  Printer,
  ChevronRight,
  ShieldAlert,
  GraduationCap,
  Award,
  KeyRound,
  QrCode,
} from 'lucide-react';
import { Student, AttendanceRecord, UserSession, ActiveTab, BimbelSettings } from '../../types';
import {
  formatDateIndo,
  getTodayDateString,
  calculateStudentMonthlySummary,
  formatRupiah,
  MONTH_NAMES_ID,
} from '../../utils/storage';

interface DashboardSiswaProps {
  currentUser: UserSession;
  student: Student;
  attendance: AttendanceRecord[];
  allStudents: Student[];
  settings?: BimbelSettings;
  onOpenSelfAttendanceModal: () => void;
  onNavigate: (tab: ActiveTab) => void;
  onOpenChangePasswordModal?: () => void;
  onOpenQRCard?: (student: Student) => void;
}

export const DashboardSiswa: React.FC<DashboardSiswaProps> = ({
  currentUser,
  student,
  attendance,
  allStudents,
  settings,
  onOpenSelfAttendanceModal,
  onNavigate,
  onOpenChangePasswordModal,
  onOpenQRCard,
}) => {
  const safeStudent: Student = student || {
    id: currentUser?.id || 'std-fallback',
    code: currentUser?.code || 'SGM-001',
    name: currentUser?.name || 'Siswa Bimbel',
    level: 'SMP',
    gradeDetail: 'Kelas 9 SMP',
    classType: 'Privat',
    pricePerSession: 60000,
    parentName: 'Orang Tua Siswa',
    parentPhone: '081234567890',
    status: 'Aktif',
    joinDate: getTodayDateString(),
  };

  const today = getTodayDateString();
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const brandTitle = settings?.sidebarFooterTitle || 'Bimbel Sigma';
  const brandTagline = (settings?.sidebarFooterTagline || '“Belajar Sampai Paham”').replace(/[“”"]/g, '');

  const studentBadge = settings?.studentDashboardBadge || `Portal Siswa & Orang Tua ${brandTitle}`;
  const studentTitle = settings?.studentDashboardTitle || `Selamat Belajar, ${safeStudent.name}!`;
  const studentMessage = settings?.studentDashboardMessage || `“${brandTagline}”. Catat kehadiran mandiri, pantau materi tiap sesi pembelajaran, dan evaluasi hasil belajar.`;

  // Check if this student has already checked in today
  const myTodayRecord = attendance.find((a) => a.studentId === safeStudent.id && a.date === today);

  // All students who attended today (Live Attendance Today)
  const todayAttendees = attendance.filter((a) => a.date === today && a.status === 'Hadir');

  // My full personal attendance records (sorted newest first)
  const myAttendanceRecords = attendance
    .filter((a) => a.studentId === safeStudent.id)
    .sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.time || '').localeCompare(a.time || ''));

  // Monthly summary for this student
  const monthSummary = calculateStudentMonthlySummary(
    safeStudent,
    currentMonth,
    currentYear,
    attendance,
    []
  );

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
      {/* Student Top Header & Action */}
      <div className="bg-white rounded-2xl p-4 sm:p-7 border border-slate-200/90 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-50 border border-amber-200/70 text-amber-800 text-[11px] sm:text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                {studentBadge}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {formatDateIndo(today)}
              </span>
            </div>
            <h2 className="text-xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {studentTitle}
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm max-w-2xl font-normal leading-relaxed">
              {studentMessage}
            </p>
          </div>

          {/* Big Self-Attendance & Password Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1 lg:pt-0">
            {myTodayRecord ? (
              <div className="px-3.5 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="text-left">
                  <p className="text-xs font-semibold text-emerald-900">
                    Kamu Sudah Hadir Hari Ini
                  </p>
                  <p className="text-[11px] text-emerald-700">
                    {myTodayRecord.time} WIB • {myTodayRecord.topic}
                  </p>
                </div>
              </div>
            ) : (
              <button
                id="self-attendance-trigger-btn"
                onClick={onOpenSelfAttendanceModal}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl shadow-2xs flex items-center justify-center gap-2 transition cursor-pointer text-xs"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                Absen Masuk Mandiri
              </button>
            )}

            {onOpenQRCard && (
              <button
                id="student-view-qr-card-btn"
                onClick={() => onOpenQRCard(safeStudent)}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-2xs flex items-center justify-center gap-1.5 transition cursor-pointer text-xs"
                title="Tampilkan Kartu QR Code Pelajar"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Kartu QR Presensi</span>
              </button>
            )}

            {onOpenChangePasswordModal && (
              <button
                onClick={onOpenChangePasswordModal}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                title="Ganti Kata Sandi Akun Siswa"
              >
                <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                Password
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Student Profile & Progress Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-indigo-700 font-semibold text-xs">
              <GraduationCap className="w-4 h-4" /> Profil Belajar Saya
            </div>
            {onOpenChangePasswordModal && (
              <button
                onClick={onOpenChangePasswordModal}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <KeyRound className="w-3 h-3" />
                Ganti Sandi
              </button>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">{safeStudent.code}</span>
              <h3 className="text-base font-bold text-slate-900">{safeStudent.name}</h3>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              <span className="text-slate-400 font-normal">Tingkat:</span> {safeStudent.gradeDetail} •{' '}
              <span className="font-semibold text-indigo-700">{safeStudent.classType}</span>
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              <span className="text-slate-400 font-normal">Tutor:</span> {safeStudent.tutorName || 'Kak Sarah Amalia, S.Si.'}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <span>Kehadiran {MONTH_NAMES_ID[currentMonth - 1]}</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold tracking-tight text-slate-900">
              {monthSummary.presentCount}
            </h3>
            <span className="text-xs text-slate-400">Sesi Hadir</span>
          </div>
          <p className="text-xs text-slate-500">
            {monthSummary.permissionCount > 0 && `${monthSummary.permissionCount} Izin • `}
            {monthSummary.sickCount > 0 && `${monthSummary.sickCount} Sakit • `}
            Total {monthSummary.totalSessions} sesi
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <span>Estimasi Tagihan Les Bulan Ini</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                {formatRupiah(safeStudent.pricePerSession)} / sesi
              </span>
            </div>
            <h3 className="text-2xl font-black text-slate-900 font-mono mt-2">
              {formatRupiah(monthSummary.totalBilled)}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              *Otomatis: {monthSummary.presentCount} Sesi Hadir × Tarif Sesi.
            </p>
          </div>
          <button
            onClick={() => onNavigate('student-billing')}
            className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center justify-between py-1.5 px-2.5 bg-indigo-50/70 hover:bg-indigo-100 rounded-lg transition cursor-pointer"
          >
            <span>Rincian Tagihan & Pembayaran</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2 Columns: Live Teman Berangkat Hari Ini & Riwayat Belajar Pribadi */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Live Attendance Today (Daftar Teman Berangkat Hari Ini) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-heading">
                  Teman Berangkat Hari Ini
                </h3>
                <p className="text-xs text-slate-500">
                  {todayAttendees.length} teman bimbel hadir ({formatDateIndo(today)})
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> LIVE
            </span>
          </div>

          {todayAttendees.length === 0 ? (
            <div className="text-center py-8 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-600">Belum ada siswa yang absen masuk hari ini</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {todayAttendees.map((att) => (
                <div
                  key={att.id}
                  className={`p-3 rounded-2xl border transition flex items-center justify-between ${
                    att.studentId === student.id
                      ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-300'
                      : 'bg-slate-50/60 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center font-mono">
                      {att.time}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {att.studentName}{' '}
                        {att.studentId === student.id && (
                          <span className="text-[10px] text-amber-700 font-extrabold">(Kamu)</span>
                        )}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">{att.topic}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                    Hadir
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 2 Columns: Riwayat Presensi & Materi Belajar Pribadi */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-heading">
                  Riwayat Kehadiran & Catatan Materi Saya
                </h3>
                <p className="text-xs text-slate-500">
                  Daftar seluruh topik pelajaran dan evaluasi belajar dari tutor
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('print-cards')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
            >
              Lihat Format Kartu (1/4 A4) →
            </button>
          </div>

          {myAttendanceRecords.length === 0 ? (
            <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">Belum ada riwayat presensi</p>
              <p className="text-xs text-slate-500 mt-1">
                Lakukan absen masuk mandiri atau tunggu tutor mencatat sesi belajarmu.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {myAttendanceRecords.map((rec) => (
                <div key={rec.id} className="py-3 px-2 hover:bg-slate-50/80 rounded-xl transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-bold text-slate-800">
                        {formatDateIndo(rec.date)}
                      </span>
                      <span className="text-xs font-mono text-slate-400">{rec.time} WIB</span>
                      {rec.sessionNumber && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          Sesi Ke-{rec.sessionNumber}
                        </span>
                      )}
                    </div>
                    <span
                      className={`px-2.5 py-0.5 text-xs font-bold rounded-lg ${
                        rec.status === 'Hadir'
                          ? 'bg-emerald-100 text-emerald-800'
                          : rec.status === 'Izin'
                          ? 'bg-amber-100 text-amber-800'
                          : rec.status === 'Sakit'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {rec.status}
                    </span>
                  </div>

                  <div className="mt-1.5 pl-0.5">
                    <p className="text-xs font-bold text-indigo-950">
                      📖 {rec.topic}
                    </p>
                    {rec.tutorNotes && (
                      <p className="text-[11px] text-slate-500 italic mt-0.5">
                        💬 Catatan Tutor ({rec.tutorName}): "{rec.tutorNotes}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
