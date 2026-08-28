import React, { useState } from 'react';
import {
  CalendarCheck2,
  PlusCircle,
  CheckSquare,
  Search,
  Filter,
  Download,
  FileEdit,
  Trash2,
  Clock,
  BookOpen,
  Calendar,
  User,
  Sparkles,
  FileSpreadsheet,
} from 'lucide-react';
import { AttendanceRecord, Student, UserRole, AttendanceStatus, UserAccount } from '../../types';
import { formatDateIndo, getTodayDateString, resolveTutorName } from '../../utils/storage';
import { exportToExcel, formatAttendanceForExcel } from '../../utils/exportUtils';

interface AttendanceViewProps {
  attendance: AttendanceRecord[];
  students: Student[];
  users?: UserAccount[];
  userRole: UserRole;
  currentUserName: string;
  onOpenAttendanceModal: (editRecord?: AttendanceRecord) => void;
  onOpenBatchAttendanceModal: () => void;
  onDeleteAttendance: (id: string, name: string) => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  attendance,
  students,
  users = [],
  userRole,
  currentUserName,
  onOpenAttendanceModal,
  onOpenBatchAttendanceModal,
  onDeleteAttendance,
}) => {
  const today = getTodayDateString();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStudentId, setFilterStudentId] = useState('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterClassType, setFilterClassType] = useState<string>('All');

  const canEdit = userRole === 'owner' || userRole === 'tutor';

  // Filtered records sorted by date descending then time descending
  const filteredAttendance = attendance
    .filter((a) => {
      const student = students.find((s) => s.id === a.studentId);
      const studentName = student?.name || a.studentName || '';
      const studentCode = student?.code || a.studentCode || '';
      const classType = student?.classType || a.classType || '';
      const tutorDisplay = resolveTutorName(a.tutorName, users);

      const term = (searchTerm || '').toLowerCase();
      const matchSearch =
        !term ||
        studentName.toLowerCase().includes(term) ||
        studentCode.toLowerCase().includes(term) ||
        (a.topic || '').toLowerCase().includes(term) ||
        tutorDisplay.toLowerCase().includes(term) ||
        (a.tutorName || '').toLowerCase().includes(term);

      const matchDate = !filterDate || a.date === filterDate;
      const matchStudent = filterStudentId === 'All' || a.studentId === filterStudentId;
      const matchStatus = filterStatus === 'All' || a.status === filterStatus;
      const matchClass = filterClassType === 'All' || classType === filterClassType;

      return matchSearch && matchDate && matchStudent && matchStatus && matchClass;
    })
    .sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.time || '').localeCompare(a.time || ''));

  const todayCount = attendance.filter((a) => a.date === today && a.status === 'Hadir').length;

  const handleExportExcel = () => {
    const enrichedAttendance = filteredAttendance.map((rec) => {
      const student = students.find((s) => s.id === rec.studentId);
      return {
        ...rec,
        studentName: student?.name || rec.studentName,
        studentCode: student?.code || rec.studentCode,
        classType: student?.classType || rec.classType,
        tutorName: resolveTutorName(rec.tutorName, users),
      };
    });
    const formattedData = formatAttendanceForExcel(enrichedAttendance);
    const fileName = filterDate ? `Rekap_Presensi_Bimbel_Sigma_${filterDate}` : 'Rekap_Presensi_Bimbel_Sigma_Lengkap';
    exportToExcel(formattedData, fileName, 'Presensi');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CalendarCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 font-heading">
                  Presensi & Log Materi Pembelajaran
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800">
                  {todayCount} Hadir Hari Ini
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Log kehadiran digital siswa, rekaman jam masuk, materi harian, dan evaluasi hasil belajar
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            id="btn-export-attendance-excel"
            onClick={handleExportExcel}
            className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            title="Unduh rekap presensi ke format Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Download Excel (.xlsx)
          </button>

          {canEdit && (
            <>
              <button
                onClick={onOpenBatchAttendanceModal}
                className="px-3.5 py-2.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <CheckSquare className="w-4 h-4 text-teal-700" />
                + Absen Sekaligus (Batch)
              </button>
              <button
                id="add-attendance-btn"
                onClick={() => onOpenAttendanceModal()}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/25 flex items-center gap-1.5 transition cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                + Catat Absensi
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari materi / siswa..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition"
          />
        </div>

        {/* Filter Tanggal */}
        <div className="relative">
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-emerald-500"
          />
          {filterDate && (
            <button
              onClick={() => setFilterDate('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Siswa */}
        <div>
          <select
            value={filterStudentId}
            onChange={(e) => setFilterStudentId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-emerald-500"
          >
            <option value="All">Semua Siswa</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} - {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Status */}
        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-emerald-500"
          >
            <option value="All">Semua Status (Hadir/Izin/Sakit/Alpha)</option>
            <option value="Hadir">🟢 Hadir</option>
            <option value="Izin">🟡 Izin</option>
            <option value="Sakit">🔵 Sakit</option>
            <option value="Alpha">🔴 Alpha</option>
          </select>
        </div>

        {/* Filter Jenis Kelas */}
        <div>
          <select
            value={filterClassType}
            onChange={(e) => setFilterClassType(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-emerald-500"
          >
            <option value="All">Semua Kelas (Privat & Grup)</option>
            <option value="Privat">Khusus Privat</option>
            <option value="Grup">Khusus Grup</option>
          </select>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-600">
            Ditemukan {filteredAttendance.length} Catatan Presensi
          </span>
          {filterDate && (
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              Filter Tanggal: {formatDateIndo(filterDate)}
            </span>
          )}
        </div>

        {filteredAttendance.length === 0 ? (
          <div className="text-center py-16 px-4">
            <CalendarCheck2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-bold text-slate-700">Tidak ada data presensi yang sesuai</p>
            <p className="text-xs text-slate-500 mt-1">Coba bersihkan filter tanggal atau pencarian materi.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100/70 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Tanggal & Jam</th>
                  <th className="py-3.5 px-4">Siswa</th>
                  <th className="py-3.5 px-4">Jenis</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Materi Pembelajaran</th>
                  <th className="py-3.5 px-4">Catatan Perkembangan</th>
                  <th className="py-3.5 px-4">Tutor</th>
                  {canEdit && <th className="py-3.5 px-4 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAttendance.map((rec) => {
                  const student = students.find((s) => s.id === rec.studentId);
                  const displayStudentName = student?.name || rec.studentName;
                  const displayStudentCode = student?.code || rec.studentCode;
                  const displayClassType = student?.classType || rec.classType;

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition">
                      {/* Tanggal & Jam */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-xs">{formatDateIndo(rec.date)}</div>
                        <div className="flex items-center gap-1 font-mono text-[11px] text-slate-500 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {rec.time} WIB
                          {rec.sessionNumber && (
                            <span className="ml-1 text-[9px] font-bold px-1.5 py-0.2 bg-slate-100 rounded text-slate-600">
                              Sesi #{rec.sessionNumber}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Siswa */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{displayStudentName}</div>
                        <span className="text-[10px] font-mono font-bold text-slate-400">{displayStudentCode}</span>
                      </td>

                      {/* Jenis Kelas */}
                      <td className="py-3 px-4">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            displayClassType === 'Privat'
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {displayClassType}
                        </span>
                      </td>

                    {/* Status */}
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

                    {/* Topik / Materi */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900 max-w-xs">{rec.topic}</div>
                    </td>

                    {/* Catatan Tutor */}
                    <td className="py-3 px-4 text-xs text-slate-500 italic max-w-xs truncate">
                      {rec.tutorNotes || '-'}
                    </td>

                    {/* Tutor */}
                    <td className="py-3 px-4 text-xs font-medium text-slate-700">
                      {resolveTutorName(rec.tutorName, users)}
                    </td>

                    {/* Aksi (Edit & Hapus) */}
                    {canEdit && (
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenAttendanceModal(rec)}
                            title="Edit Data Presensi"
                            className="p-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 rounded-lg transition cursor-pointer"
                          >
                            <FileEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              onDeleteAttendance(
                                rec.id,
                                `${rec.studentName} - ${formatDateIndo(rec.date)} (${rec.time})`
                              )
                            }
                            title="Hapus Presensi"
                            className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
