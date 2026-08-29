import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Phone,
  FileEdit,
  Trash2,
  DollarSign,
  Download,
  BookOpen,
  MessageCircle,
  Eye,
  CheckCircle2,
  XCircle,
  RotateCcw,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Student, StudentLevel, ClassType, StudentStatus, UserRole, UserAccount } from '../../types';
import { formatRupiah, formatDateIndo, resolveTutorName } from '../../utils/storage';
import { exportToExcel, formatStudentsForExcel } from '../../utils/exportUtils';
import { UserAvatar } from '../common/UserAvatar';

interface StudentDatabaseViewProps {
  students: Student[];
  users?: UserAccount[];
  userRole: UserRole;
  onOpenStudentModal: (editStudent?: Student) => void;
  onDeleteStudent: (id: string, name: string) => void;
  onResetStudents?: () => void;
}

export const StudentDatabaseView: React.FC<StudentDatabaseViewProps> = ({
  students,
  users = [],
  userRole,
  onOpenStudentModal,
  onDeleteStudent,
  onResetStudents,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('All');
  const [filterType, setFilterType] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<Student | null>(null);

  // Pagination & Display Limit States
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const canEdit = userRole === 'owner';

  // Filtering
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const term = (searchTerm || '').toLowerCase();
      const matchSearch =
        !term ||
        (s.name || '').toLowerCase().includes(term) ||
        (s.code || '').toLowerCase().includes(term) ||
        (s.parentName || '').toLowerCase().includes(term) ||
        (s.parentPhone || '').includes(searchTerm);

      const matchLevel = filterLevel === 'All' || s.level === filterLevel;
      const matchType = filterType === 'All' || s.classType === filterType;
      const matchStatus = filterStatus === 'All' || s.status === filterStatus;

      return matchSearch && matchLevel && matchType && matchStatus;
    });
  }, [students, searchTerm, filterLevel, filterType, filterStatus]);

  // Reset page when filter or page size changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterLevel, filterType, filterStatus, pageSize]);

  const totalItems = filteredStudents.length;
  const isShowAll = pageSize >= 999999;
  const totalPages = isShowAll ? 1 : Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const startIndex = isShowAll ? 0 : (safeCurrentPage - 1) * pageSize;
  const endIndex = isShowAll ? totalItems : Math.min(startIndex + pageSize, totalItems);
  const currentRecords = filteredStudents.slice(startIndex, endIndex);

  // Expand / Collapse Handlers
  const handleShowMore = () => {
    if (pageSize < 25) {
      setPageSize(25);
    } else if (pageSize < 50) {
      setPageSize(50);
    } else if (pageSize < 100) {
      setPageSize(100);
    } else {
      setPageSize(999999);
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

  const handleExportExcel = () => {
    const formattedData = formatStudentsForExcel(filteredStudents);
    exportToExcel(formattedData, 'Master_Data_Siswa_Bimbel_Sigma', 'Data Siswa');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-heading">Database Siswa Bimbel</h2>
              <p className="text-xs text-slate-500">
                Kelola data lengkap peserta didik, tingkat kelas, tarif per sesi, dan kontak orang tua
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {canEdit && onResetStudents && (
            <button
              onClick={onResetStudents}
              title="Perbarui / Muat ulang 25 data siswa lengkap sesuai daftar bimbel"
              className="px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
              Sinkronkan 25 Siswa Baru
            </button>
          )}

          <button
            id="btn-export-students-excel"
            onClick={handleExportExcel}
            className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            title="Unduh seluruh data siswa ke format Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Download Excel (.xlsx)
          </button>

          {canEdit && (
            <button
              id="add-student-btn"
              onClick={() => onOpenStudentModal()}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/25 flex items-center gap-1.5 transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              + Tambah Siswa Baru
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama, kode, no hp..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>

        {/* Filter Level */}
        <div>
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">Semua Tingkat (PAUD, SD, SMP, SMA, UTBK)</option>
            <option value="PAUD">PAUD / TK</option>
            <option value="SD">SD (Sekolah Dasar)</option>
            <option value="SMP">SMP</option>
            <option value="SMA">SMA / SMK</option>
            <option value="UTBK">UTBK / SNBT / Kedinasan</option>
          </select>
        </div>

        {/* Filter Jenis Kelas */}
        <div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">Semua Jenis Kelas (Privat & Grup)</option>
            <option value="Privat">Privat (1 on 1)</option>
            <option value="Grup">Grup / Reguler</option>
          </select>
        </div>

        {/* Filter Skema Paket */}
        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">Semua Status (Aktif & Cuti)</option>
            <option value="Aktif">🟢 Aktif Saja</option>
            <option value="Non-Aktif">⚪ Non-Aktif / Cuti</option>
          </select>
        </div>
      </div>

      {/* Table of Students */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Top Bar */}
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">
              Total {totalItems} Siswa Terdaftar
            </span>
            {totalItems > 0 && (
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-md">
                Menampilkan {startIndex + 1} - {endIndex}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {!canEdit && (
              <span className="text-[11px] text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 font-medium">
                Mode Akses Pengajar: Read-Only
              </span>
            )}

            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
              <span>Baris per halaman:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
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
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-bold text-slate-700">Tidak ada siswa yang sesuai filter</p>
            <p className="text-xs text-slate-500 mt-1">Coba sesuaikan kata kunci pencarian atau filter diatas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100/70 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Kode</th>
                  <th className="py-3.5 px-4">Nama Siswa</th>
                  <th className="py-3.5 px-4">Tingkat & Kelas</th>
                  <th className="py-3.5 px-4">Jenis Kelas</th>
                  <th className="py-3.5 px-4">Tarif Per Sesi</th>
                  <th className="py-3.5 px-4">Orang Tua / No WA</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentRecords.map((std) => {
                  const cleanPhone = (std.parentPhone || '').replace(/[^0-9]/g, '');
                  const waUrl = `https://wa.me/62${cleanPhone.startsWith('0') ? cleanPhone.slice(1) : cleanPhone}?text=Halo%20Bapak%2FIbu%20${encodeURIComponent(std.parentName || std.name)},%20kami%20dari%20Bimbel%20Sigma...`;

                  return (
                    <tr key={std.id} className="hover:bg-slate-50/80 transition">
                      {/* Kode */}
                      <td className="py-3 px-4 font-mono font-bold text-xs text-indigo-700">
                        {std.code}
                      </td>

                      {/* Nama */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <UserAvatar
                            name={std.name}
                            role="siswa"
                            size="sm"
                            rounded="rounded-xl"
                          />
                          <div>
                            <div className="font-bold text-slate-900">{std.name}</div>
                            <span className="text-[10px] text-slate-400">
                              Tutor: {std.tutorName ? resolveTutorName(std.tutorName, users) : '-'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Tingkat & Kelas */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800 text-xs">{std.gradeDetail}</span>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">{std.level}</div>
                      </td>

                      {/* Jenis Kelas */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-lg ${
                            std.classType === 'Privat'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {std.classType}
                        </span>
                      </td>

                      {/* Tarif Per Sesi */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-900 text-xs">
                          {formatRupiah(std.pricePerSession)}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          per pertemuan
                        </span>
                      </td>

                      {/* Orang Tua & WA */}
                      <td className="py-3 px-4">
                        <div className="text-xs font-semibold text-slate-800">
                          {std.parentName || '-'}
                        </div>
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-800 font-bold mt-0.5"
                        >
                          <MessageCircle className="w-3 h-3 text-emerald-600" />
                          {std.parentPhone}
                        </a>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            std.status === 'Aktif'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {std.status === 'Aktif' ? '🟢 Aktif' : '⚪ Cuti'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedStudentDetail(std)}
                            title="Lihat Detail Profil"
                            className="p-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 rounded-lg transition cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {canEdit && (
                            <>
                              <button
                                onClick={() => onOpenStudentModal(std)}
                                title="Edit Data Siswa"
                                className="p-1.5 bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-700 rounded-lg transition cursor-pointer"
                              >
                                <FileEdit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onDeleteStudent(std.id, `${std.name} (${std.code})`)}
                                title="Hapus Siswa"
                                className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-lg transition cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
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
                      className="px-3 py-1.5 bg-white border border-slate-300 hover:border-indigo-400 hover:bg-indigo-50 text-slate-700 hover:text-indigo-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                    >
                      <ChevronDown className="w-3.5 h-3.5 text-indigo-600" />
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
                                ? 'bg-indigo-600 text-white shadow-xs'
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

      {/* Detail Modal Popup */}
      {selectedStudentDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-indigo-300">
                  {selectedStudentDetail.code}
                </span>
                <h3 className="text-lg font-bold">{selectedStudentDetail.name}</h3>
              </div>
              <button
                onClick={() => setSelectedStudentDetail(null)}
                className="text-white/70 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl">
                <div>
                  <span className="text-xs text-slate-500">Tingkat / Kelas:</span>
                  <p className="font-bold text-slate-900">{selectedStudentDetail.gradeDetail}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Jenis Kelas:</span>
                  <p className="font-bold text-indigo-700">{selectedStudentDetail.classType}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Tarif Per Sesi:</span>
                  <p className="font-bold text-emerald-700">{formatRupiah(selectedStudentDetail.pricePerSession)} / sesi</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Status Siswa:</span>
                  <p className="font-bold text-slate-900">{selectedStudentDetail.status}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Tutor Pembimbing:</span>
                  <p className="font-bold text-slate-900">
                    {selectedStudentDetail.tutorName ? resolveTutorName(selectedStudentDetail.tutorName, users) : '-'}
                  </p>
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-500">Orang Tua / Wali:</span>
                <p className="font-bold text-slate-800">{selectedStudentDetail.parentName} ({selectedStudentDetail.parentPhone})</p>
              </div>

              {selectedStudentDetail.address && (
                <div>
                  <span className="text-xs text-slate-500">Alamat:</span>
                  <p className="text-slate-700 text-xs">{selectedStudentDetail.address}</p>
                </div>
              )}

              {selectedStudentDetail.notes && (
                <div>
                  <span className="text-xs text-slate-500">Target & Catatan Khusus:</span>
                  <p className="text-slate-700 text-xs italic bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                    "{selectedStudentDetail.notes}"
                  </p>
                </div>
              )}
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-right">
              <button
                onClick={() => setSelectedStudentDetail(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 font-bold text-xs rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
