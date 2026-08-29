import React, { useState, useMemo } from 'react';
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
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
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

  // Pagination & Display Limit States
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const canEdit = userRole === 'owner' || userRole === 'tutor';

  // Filtered records sorted by date descending then time descending
  const filteredAttendance = useMemo(() => {
    return attendance
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
  }, [attendance, students, users, searchTerm, filterDate, filterStudentId, filterStatus, filterClassType]);

  // Reset current page to 1 when any filter or page size changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterDate, filterStudentId, filterStatus, filterClassType, pageSize]);

  const totalItems = filteredAttendance.length;
  const isShowAll = pageSize >= 999999;
  const totalPages = isShowAll ? 1 : Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const startIndex = isShowAll ? 0 : (safeCurrentPage - 1) * pageSize;
  const endIndex = isShowAll ? totalItems : Math.min(startIndex + pageSize, totalItems);
  const currentRecords = filteredAttendance.slice(startIndex, endIndex);

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

  // Expand / Collapse Handlers
  const handleShowMore = () => {
    if (pageSize < 25) {
      setPageSize(25);
    } else if (pageSize < 50) {
      setPageSize(50);
    } else if (pageSize < 100) {
      setPageSize(100);
    } else {
      setPageSize(999999); // Show all
    }
  };

  const handleShowLess = () => {
    if (pageSize > 50) {
      setPageSize(50);
    } else if (pageSize > 25) {
      setPageSize(25);
    } else {
      setPageSize(10);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CalendarCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-xl font-bold text-slate-900 font-heading">
                  Presensi & Log Materi Pembelajaran
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-extrabold bg-emerald-100 text-emerald-800">
                  {todayCount} Hadir Hari Ini
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                Log kehadiran digital siswa, rekaman jam masuk, materi harian, dan evaluasi hasil belajar
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          <button
            id="btn-export-attendance-excel"
            onClick={handleExportExcel}
            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            title="Unduh rekap presensi ke format Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Excel (.xlsx)</span>
          </button>

          {canEdit && (
            <>
              <button
                onClick={onOpenBatchAttendanceModal}
                className="px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <CheckSquare className="w-4 h-4 text-teal-700 shrink-0" />
                <span>+ Absen Batch</span>
              </button>
              <button
                id="add-attendance-btn"
                onClick={() => onOpenAttendanceModal()}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/25 flex items-center gap-1.5 transition cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 shrink-0" />
                <span>+ Catat Absensi</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3">
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

      {/* Attendance Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Top Bar */}
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">
              Total {totalItems} Catatan Presensi
            </span>
            {totalItems > 0 && (
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-md">
                Menampilkan {startIndex + 1} - {endIndex}
              </span>
            )}
          </div>

          {/* Quick Page Size Selector & Date Filter Badge */}
          <div className="flex items-center gap-3">
            {filterDate && (
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                Filter: {formatDateIndo(filterDate)}
              </span>
            )}

            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
              <span>Baris per halaman:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500"
              >
                <option value={10}>10 data</option>
                <option value={25}>25 data</option>
                <option value={50}>50 data</option>
                <option value={100}>100 data</option>
                <option value={999999}>Tampilkan Semua</option>
              </select>
            </div>
          </div>
        </div>

        {totalItems === 0 ? (
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
                {currentRecords.map((rec) => {
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

        {/* Bottom Pagination & Show More/Less Controls */}
        {totalItems > 0 && (
          <div className="p-4 bg-slate-50/90 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Quick Action: Tampilkan Lebih Banyak / Lebih Sedikit */}
            <div className="flex items-center gap-2">
              {totalItems > 10 && (
                <>
                  {!isShowAll && endIndex < totalItems && (
                    <button
                      onClick={handleShowMore}
                      className="px-3 py-1.5 bg-white border border-slate-300 hover:border-emerald-400 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                    >
                      <ChevronDown className="w-3.5 h-3.5 text-emerald-600" />
                      Tampilkan Lebih Banyak ({pageSize === 10 ? '25' : pageSize === 25 ? '50' : 'Semua'})
                    </button>
                  )}

                  {pageSize > 10 && (
                    <button
                      onClick={handleShowLess}
                      className="px-3 py-1.5 bg-white border border-slate-300 hover:border-amber-400 hover:bg-amber-50 text-slate-700 hover:text-amber-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                    >
                      <ChevronUp className="w-3.5 h-3.5 text-amber-600" />
                      Tampilkan Lebih Sedikit (Kembali ke {pageSize > 25 ? '25' : '10'})
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Pagination Controls */}
            {!isShowAll && totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={safeCurrentPage === 1}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Sebelumnya
                </button>

                {/* Page Number Indicators */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => {
                      // Always show first, last, and pages near current page
                      return p === 1 || p === totalPages || Math.abs(p - safeCurrentPage) <= 1;
                    })
                    .map((p, idx, arr) => {
                      const prevPage = arr[idx - 1];
                      const isGap = prevPage && p - prevPage > 1;

                      return (
                        <React.Fragment key={p}>
                          {isGap && <span className="px-1 text-slate-400 text-xs font-bold">...</span>}
                          <button
                            onClick={() => setCurrentPage(p)}
                            className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                              safeCurrentPage === p
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {p}
                          </button>
                        </React.Fragment>
                      );
                    })}
                </div>

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={safeCurrentPage === totalPages}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
                >
                  Selanjutnya
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

