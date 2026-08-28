import React from 'react';
import {
  GraduationCap,
  CalendarCheck,
  PlusCircle,
  CheckSquare,
  BookOpen,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileEdit,
  Trash2,
  KeyRound,
} from 'lucide-react';
import { Student, AttendanceRecord, UserSession, ActiveTab, BimbelSettings, UserAccount } from '../../types';
import { getTodayDateString, formatDateIndo, resolveTutorName } from '../../utils/storage';

interface DashboardTutorProps {
  currentUser: UserSession;
  students: Student[];
  attendance: AttendanceRecord[];
  users?: UserAccount[];
  settings?: BimbelSettings;
  onNavigate: (tab: ActiveTab) => void;
  onOpenAttendanceModal: (editRecord?: AttendanceRecord) => void;
  onOpenBatchAttendanceModal: () => void;
  onDeleteAttendance: (id: string, name: string) => void;
  onOpenChangePasswordModal?: () => void;
}

export const DashboardTutor: React.FC<DashboardTutorProps> = ({
  currentUser,
  students,
  attendance,
  users = [],
  settings,
  onNavigate,
  onOpenAttendanceModal,
  onOpenBatchAttendanceModal,
  onDeleteAttendance,
  onOpenChangePasswordModal,
}) => {
  const today = getTodayDateString();
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const currentMonthPrefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

  const tutorBadge = settings?.tutorDashboardBadge || 'Ruang Kerja Pengajar (Tutor Access)';
  const tutorTitle = settings?.tutorDashboardTitle || `Halo, ${currentUser?.name || 'Tutor'}!`;
  const tutorMessage = settings?.tutorDashboardMessage || 'Fokus pada kualitas pembelajaran: catat absensi harian siswa, topik materi, serta evaluasi pemahaman belajar.';

  // Today's attendances
  const todayAttendance = attendance.filter((a) => a.date === today);

  // Total teaching sessions conducted by this tutor this month
  const tutorFirstName = currentUser?.name ? currentUser.name.split(' ')[0]?.toLowerCase() || '' : '';
  const tutorLastName = currentUser?.name ? (currentUser.name.split(' ')[1] || '').toLowerCase() : '';
  const currTutorNameLower = (currentUser?.name || '').trim().toLowerCase();

  const myMonthSessions = attendance.filter((a) => {
    if (!a.date || !a.date.startsWith(currentMonthPrefix)) return false;
    const rawTutor = (a.tutorName || '').trim();
    if (!rawTutor) return false;
    const resolved = resolveTutorName(rawTutor, users).toLowerCase();
    if (resolved === currTutorNameLower) return true;
    if (rawTutor.toLowerCase() === currTutorNameLower) return true;
    if (tutorFirstName && rawTutor.toLowerCase().includes(tutorFirstName)) return true;
    if (tutorLastName && rawTutor.toLowerCase().includes(tutorLastName)) return true;
    return false;
  });

  const activeStudents = students.filter((s) => s.status === 'Aktif');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header & Actions */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-teal-50 border border-teal-100 text-teal-700 text-xs font-semibold">
                <GraduationCap className="w-3.5 h-3.5" />
                {tutorBadge}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {formatDateIndo(today)}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {tutorTitle}
            </h2>
            <p className="text-slate-500 text-sm max-w-2xl font-normal leading-relaxed">
              {tutorMessage}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0">
            {onOpenChangePasswordModal && (
              <button
                onClick={onOpenChangePasswordModal}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                title="Ganti Password Akun Tutor"
              >
                <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                Password
              </button>
            )}
            <button
              onClick={() => onOpenAttendanceModal()}
              className="px-3.5 py-2 bg-teal-50 hover:bg-teal-100/80 border border-teal-200 text-teal-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-teal-600" />
              + Input Absensi
            </button>
            <button
              onClick={onOpenBatchAttendanceModal}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
            >
              <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
              Absen Batch
            </button>
          </div>
        </div>
      </div>

      {/* Tutor Mini KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Siswa Hadir Hari Ini
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-2xl font-bold tracking-tight text-slate-900">
              {todayAttendance.filter((a) => a.status === 'Hadir').length}
            </h3>
            <span className="text-xs text-slate-400">Siswa hadir</span>
          </div>
          <p className="text-xs text-teal-700 font-medium mt-1">Tanggal {formatDateIndo(today)}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Sesi Mengajar Saya
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-2xl font-bold tracking-tight text-slate-900">
              {myMonthSessions.length}
            </h3>
            <span className="text-xs text-slate-400">Sesi bulan ini</span>
          </div>
          <p className="text-xs text-indigo-700 font-medium mt-1">Bulan {currentMonth} / {currentYear}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Total Siswa Terdaftar
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-2xl font-bold tracking-tight text-slate-900">
              {activeStudents.length}
            </h3>
            <span className="text-xs text-slate-400">Siswa aktif</span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">PAUD, SD, SMP, & SMA</p>
        </div>
      </div>

      {/* Live Today Attendance Table with Edit & Delete actions for Tutor */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Presensi & Materi Pembelajaran Hari Ini ({formatDateIndo(today)})
              </h3>
              <p className="text-xs text-slate-500">
                Tutor memiliki akses untuk menambah, mengubah (edit), dan menghapus log absensi hari ini.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('attendance')}
            className="text-xs text-teal-700 hover:text-teal-900 font-semibold"
          >
            Riwayat Lengkap →
          </button>
        </div>

        {todayAttendance.length === 0 ? (
          <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">Belum ada catatan presensi hari ini</p>
            <p className="text-xs text-slate-500 mt-1">
              Gunakan tombol "+ Input Absensi Siswa" untuk mencatat materi dan kehadiran siswa.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Jam</th>
                  <th className="py-3 px-4">Siswa</th>
                  <th className="py-3 px-4">Kelas / Jenis</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Materi / Topik Belajar</th>
                  <th className="py-3 px-4">Catatan Evaluasi</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {todayAttendance.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-700 text-xs">
                      {rec.time} WIB
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{rec.studentName}</div>
                      <span className="text-[10px] font-mono text-slate-400">{rec.studentCode}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          rec.classType === 'Privat'
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {rec.classType}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
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
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {rec.topic}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500 italic">
                      {rec.tutorNotes || '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onOpenAttendanceModal(rec)}
                          title="Edit Presensi & Materi"
                          className="p-1.5 bg-slate-100 hover:bg-teal-50 text-slate-600 hover:text-teal-700 rounded-lg transition cursor-pointer"
                        >
                          <FileEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteAttendance(rec.id, `${rec.studentName} (${rec.time})`)}
                          title="Hapus Absensi"
                          className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
