import React, { useState, useMemo } from 'react';
import {
  Printer,
  Calendar,
  User,
  Users,
  CheckCircle2,
  FileSpreadsheet,
  Download,
  Sparkles,
  Grid,
  Layers,
  CheckSquare,
  Square,
  Search,
  BookOpen,
  Filter,
  GraduationCap,
  Clock,
  FileText,
  BadgeCheck,
  MessageCircle,
  Image as ImageIcon,
  Pencil,
  RotateCcw,
  Check,
  X,
} from 'lucide-react';
import {
  Student,
  AttendanceRecord,
  IncomeRecord,
  UserRole,
  BimbelSettings,
} from '../../types';
import {
  formatRupiah,
  MONTH_NAMES_ID,
  formatDateIndo,
  calculateStudentMonthlySummary,
  StudentMonthlyAttendanceSummary,
  resolveTutorName,
} from '../../utils/storage';
import { UserAccount } from '../../types';
import {
  DEFAULT_WA_TEMPLATES,
  formatWhatsAppMessage,
  sendWhatsAppDirect,
} from '../../utils/whatsapp';
import {
  exportToExcel,
  exportElementToPng,
  formatAttendanceMatrixForExcel,
} from '../../utils/exportUtils';

interface PrintCardsViewProps {
  students: Student[];
  attendance: AttendanceRecord[];
  incomes: IncomeRecord[];
  users?: UserAccount[];
  userRole: UserRole;
  currentStudentCode?: string;
  settings?: BimbelSettings;
}

export const PrintCardsView: React.FC<PrintCardsViewProps> = ({
  students,
  attendance,
  incomes,
  users = [],
  userRole,
  currentStudentCode,
  settings,
}) => {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Mode Tab: 'mode-a' (Laporan Siswa) vs 'mode-b' (Rekap Presensi Bulanan)
  const [activeMode, setActiveMode] = useState<'mode-a' | 'mode-b'>('mode-a');

  // Common filters
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [filterAllMonths, setFilterAllMonths] = useState(false);

  // --- MODE A (LAPORAN SISWA) STATES ---
  const [selectedStudentId, setSelectedStudentId] = useState<string>(() => {
    if (userRole === 'siswa' && currentStudentCode) {
      const match = students.find((s) => s.code === currentStudentCode);
      return match ? match.id : students[0]?.id || '';
    }
    return students[0]?.id || '';
  });

  // Mode A format style: full A4 page (recommended) or 1/4 A4 pocket card
  const [modeALayout, setModeALayout] = useState<'full-a4' | 'pocket-card'>('full-a4');

  // --- MODE B (REKAP PRESENSI BULANAN) STATES & FILTERS ---
  const [matrixFilterLevel, setMatrixFilterLevel] = useState<string>('Semua');
  const [matrixFilterClassType, setMatrixFilterClassType] = useState<string>('Semua');
  const [matrixFilterTutor, setMatrixFilterTutor] = useState<string>('Semua');
  const [matrixFilterStatus, setMatrixFilterStatus] = useState<'Aktif' | 'Semua'>('Aktif');
  const [matrixSearchTerm, setMatrixSearchTerm] = useState<string>('');

  // --- CUSTOM EVALUATION / REKOMENDASI PENGAJAR (OWNER & TUTOR ONLY) ---
  const [customEvaluations, setCustomEvaluations] = useState<Record<string, string>>(() => {
    try {
      const raw = localStorage.getItem('sigma_monthly_evaluations');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  const [isEditingEvaluation, setIsEditingEvaluation] = useState(false);
  const [evalDraftText, setEvalDraftText] = useState('');
  const [evalSaveToast, setEvalSaveToast] = useState(false);

  // Print trigger
  const handlePrint = () => {
    window.print();
  };

  // --- MODE A CALCULATIONS ---
  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId) || students[0],
    [students, selectedStudentId]
  );

  // Calculate summary for selected student
  const studentMonthlySummary = useMemo(() => {
    if (!selectedStudent) return null;
    return calculateStudentMonthlySummary(
      selectedStudent,
      selectedMonth,
      selectedYear,
      attendance,
      incomes
    );
  }, [selectedStudent, selectedMonth, selectedYear, attendance, incomes]);

  // All or monthly attendance records for selected student
  const studentRecords = useMemo(() => {
    if (!selectedStudent) return [];
    const prefix = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
    return attendance
      .filter((a) => {
        if (a.studentId !== selectedStudent.id) return false;
        if (filterAllMonths) return true;
        return a.date && a.date.startsWith(prefix);
      })
      .sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.time || '').localeCompare(b.time || ''));
  }, [selectedStudent, attendance, selectedYear, selectedMonth, filterAllMonths]);

  // --- MODE B (REKAP PRESENSI MATRIKS KALENDER TGL 1-30/31) CALCULATIONS ---
  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth, 0).getDate();
  }, [selectedYear, selectedMonth]);

  const daysArray = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }, [daysInMonth]);

  const tutorList = useMemo(() => {
    const set = new Set<string>();
    // From active tutor accounts
    users.forEach((u) => {
      if (u.role === 'tutor' && u.isActive !== false) {
        set.add(u.name.trim());
      }
    });
    // From students
    students.forEach((s) => {
      if (s.tutorName) {
        set.add(resolveTutorName(s.tutorName, users));
      }
    });
    return Array.from(set).sort();
  }, [students, users]);

  // Filtered student list for matrix
  const filteredMatrixStudents = useMemo(() => {
    return students
      .filter((s) => {
        if (matrixFilterStatus === 'Aktif' && s.status !== 'Aktif') return false;
        if (matrixFilterLevel !== 'Semua' && s.level !== matrixFilterLevel) return false;
        if (matrixFilterClassType !== 'Semua' && s.classType !== matrixFilterClassType) return false;
        const resolvedStdTutor = resolveTutorName(s.tutorName, users);
        if (matrixFilterTutor !== 'Semua' && resolvedStdTutor !== matrixFilterTutor && s.tutorName !== matrixFilterTutor) return false;
        if (matrixSearchTerm.trim()) {
          const q = matrixSearchTerm.trim().toLowerCase();
          const match = s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q);
          if (!match) return false;
        }
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [students, matrixFilterStatus, matrixFilterLevel, matrixFilterClassType, matrixFilterTutor, matrixSearchTerm, users]);

  // Build matrix lookup data: studentId -> { days: { [day]: { status, record } }, hadirCount, izinCount, sakitCount, alphaCount, totalCount, percentage }
  const attendanceMatrixData = useMemo(() => {
    const prefix = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
    const studentMap: Record<
      string,
      {
        student: Student;
        days: Record<number, { status: string; record?: AttendanceRecord }>;
        hadirCount: number;
        izinCount: number;
        sakitCount: number;
        alphaCount: number;
        totalCount: number;
        percentage: number;
      }
    > = {};

    filteredMatrixStudents.forEach((student) => {
      studentMap[student.id] = {
        student,
        days: {},
        hadirCount: 0,
        izinCount: 0,
        sakitCount: 0,
        alphaCount: 0,
        totalCount: 0,
        percentage: 0,
      };
    });

    attendance.forEach((rec) => {
      if (!rec.date || !rec.date.startsWith(prefix)) return;
      if (!studentMap[rec.studentId]) return;

      const parts = rec.date.split('-');
      const dayNum = parseInt(parts[2], 10);
      if (dayNum >= 1 && dayNum <= daysInMonth) {
        studentMap[rec.studentId].days[dayNum] = {
          status: rec.status,
          record: rec,
        };

        if (rec.status === 'Hadir') studentMap[rec.studentId].hadirCount += 1;
        else if (rec.status === 'Izin') studentMap[rec.studentId].izinCount += 1;
        else if (rec.status === 'Sakit') studentMap[rec.studentId].sakitCount += 1;
        else if (rec.status === 'Alpha') studentMap[rec.studentId].alphaCount += 1;
      }
    });

    Object.values(studentMap).forEach((item) => {
      item.totalCount = item.hadirCount + item.izinCount + item.sakitCount + item.alphaCount;
      item.percentage = item.totalCount > 0 ? Math.round((item.hadirCount / item.totalCount) * 100) : 0;
    });

    return studentMap;
  }, [filteredMatrixStudents, attendance, selectedYear, selectedMonth, daysInMonth]);

  // Totals for each day column (count of Hadir)
  const dayTotals = useMemo(() => {
    const totals: Record<number, { hadir: number; total: number }> = {};
    daysArray.forEach((d) => {
      totals[d] = { hadir: 0, total: 0 };
    });

    Object.values(attendanceMatrixData).forEach((row) => {
      daysArray.forEach((d) => {
        if (row.days[d]) {
          totals[d].total += 1;
          if (row.days[d].status === 'Hadir') {
            totals[d].hadir += 1;
          }
        }
      });
    });

    return totals;
  }, [attendanceMatrixData, daysArray]);

  // Grand totals across all students in the matrix
  const grandTotals = useMemo(() => {
    let hadir = 0;
    let izin = 0;
    let sakit = 0;
    let alpha = 0;
    let totalSessions = 0;

    Object.values(attendanceMatrixData).forEach((row) => {
      hadir += row.hadirCount;
      izin += row.izinCount;
      sakit += row.sakitCount;
      alpha += row.alphaCount;
      totalSessions += row.totalCount;
    });

    const avgPercentage = totalSessions > 0 ? Math.round((hadir / totalSessions) * 100) : 0;

    return { hadir, izin, sakit, alpha, totalSessions, avgPercentage };
  }, [attendanceMatrixData]);

  const [isExportingPng, setIsExportingPng] = useState<boolean>(false);

  // Export Matrix to Excel (.xlsx)
  const handleExportMatrixExcel = () => {
    const monthName = MONTH_NAMES_ID[selectedMonth - 1] || 'Bulan';
    const matrixRows = formatAttendanceMatrixForExcel(
      filteredMatrixStudents,
      attendanceMatrixData,
      daysArray
    );

    exportToExcel(
      matrixRows,
      `Rekap_Presensi_Matriks_${monthName}_${selectedYear}_${bimbelName.replace(/\s+/g, '_')}`,
      `Presensi ${monthName} ${selectedYear}`
    );
  };

  // Export Active Card / Report to High-Res PNG Image
  const handleExportCardPng = async () => {
    setIsExportingPng(true);
    try {
      const monthName = MONTH_NAMES_ID[selectedMonth - 1] || 'Bulan';
      if (activeMode === 'mode-a') {
        const targetId = modeALayout === 'full-a4' ? 'printable-report-mode-a' : 'printable-pocket-cards';
        const studentName = selectedStudent?.name?.replace(/\s+/g, '_') || 'Siswa';
        const fileName = `Kartu_Presensi_${studentName}_${monthName}_${selectedYear}`;
        await exportElementToPng(targetId, fileName);
      } else {
        const fileName = `Rekap_Presensi_Matriks_${monthName}_${selectedYear}_${bimbelName.replace(/\s+/g, '_')}`;
        await exportElementToPng('printable-group-sheet', fileName);
      }
    } catch (err) {
      console.error('Error exporting PNG:', err);
    } finally {
      setIsExportingPng(false);
    }
  };

  const bimbelName = settings?.bimbelName || 'RUMAH BELAJAR';
  const bimbelTagline = settings?.tagline || 'Belajar Sampai Paham, Bukan Sekadar Hafal';
  const bimbelAddress = settings?.address || 'Blora, Jawa Tengah';
  const bimbelPhone = settings?.phone || '-';
  const effectiveCity = settings?.city || (settings?.address?.toLowerCase().includes('blora') ? 'Blora' : 'Blora');

  // --- ACCURATE ROLE, NAME & POSITION RESOLUTION ---
  const ownerAccount = users.find((u) => u.role === 'owner');
  const effectiveOwnerName =
    settings?.ownerName && settings.ownerName !== 'Owner Bimbel'
      ? settings.ownerName
      : ownerAccount?.name || 'Nanik Susilowati, M.Pd';

  const effectiveOwnerTitle =
    settings?.ownerTitle && settings.ownerTitle !== 'Pemilik & Direktur Lembaga'
      ? settings.ownerTitle
      : 'Pemilik & Kepala Lembaga';

  const assignedTutorName = selectedStudent?.tutorName || '';
  const matchingTutorAccount = users.find(
    (u) => (assignedTutorName && u.name === assignedTutorName) || (u.role === 'tutor' && u.name)
  );

  const effectiveTutorName =
    assignedTutorName ||
    matchingTutorAccount?.name ||
    (userRole === 'tutor' ? ownerAccount?.name : 'Nanik Susilowati, M.Pd');

  const effectiveTutorTitle =
    matchingTutorAccount?.specialty || 'Tutor Pembimbing / Pengajar';

  const effectiveParentName =
    selectedStudent?.parentName && selectedStudent.parentName.trim()
      ? selectedStudent.parentName
      : selectedStudent
      ? `Wali dari ${selectedStudent.name}`
      : 'Orang Tua / Wali Siswa';

  const reportDateFormatted = `${effectiveCity}, ${new Date(selectedYear, selectedMonth, 0).getDate()} ${MONTH_NAMES_ID[selectedMonth - 1] || 'Agustus'} ${selectedYear}`;

  // --- EVALUATION COMPUTATION & HANDLERS ---
  const currentEvalKey = selectedStudent ? `${selectedStudent.id}_${selectedYear}_${selectedMonth}` : '';

  const defaultAutoEvaluation = useMemo(() => {
    if (!studentMonthlySummary || studentRecords.length === 0) {
      return 'Belum ada catatan presensi belajar untuk siswa ini pada bulan berjalan.';
    }
    if (studentMonthlySummary.presentCount >= 8) {
      return 'Siswa menunjukkan disiplin belajar dan kehadiran yang sangat baik. Pemahaman konsep dasar materi telah tercapai secara optimal dan siap melanjutkan ke materi tingkat berikutnya.';
    }
    if (studentMonthlySummary.presentCount >= 4) {
      return 'Siswa aktif mengikuti proses bimbingan belajar dengan baik. Disarankan untuk terus mempertahankan konsistensi jadwal les dan rutin mengulang latihan soal mandiri di rumah.';
    }
    if (studentMonthlySummary.presentCount > 0) {
      return 'Disarankan untuk terus meningkatkan konsistensi kehadiran agar materi kurikulum pembelajaran dapat diselesaikan secara berkesinambungan.';
    }
    return 'Disarankan untuk terus mempertahankan konsistensi jadwal les dan rutin mengulang latihan soal mandiri di rumah.';
  }, [studentMonthlySummary, studentRecords]);

  const activeEvaluationText = (currentEvalKey && customEvaluations[currentEvalKey]) || defaultAutoEvaluation;
  const isUsingCustomEvaluation = Boolean(currentEvalKey && customEvaluations[currentEvalKey] && customEvaluations[currentEvalKey].trim());
  const canEditEvaluation = userRole === 'owner' || userRole === 'tutor';

  const handleStartEditEvaluation = () => {
    setEvalDraftText(activeEvaluationText);
    setIsEditingEvaluation(true);
    setEvalSaveToast(false);
  };

  const handleSaveEvaluation = () => {
    if (!currentEvalKey) return;
    const trimmed = evalDraftText.trim();
    const updated = {
      ...customEvaluations,
      [currentEvalKey]: trimmed,
    };
    setCustomEvaluations(updated);
    try {
      localStorage.setItem('sigma_monthly_evaluations', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save evaluation', e);
    }
    setIsEditingEvaluation(false);
    setEvalSaveToast(true);
    setTimeout(() => setEvalSaveToast(false), 3000);
  };

  const handleResetEvaluation = () => {
    if (!currentEvalKey) return;
    const updated = { ...customEvaluations };
    delete updated[currentEvalKey];
    setCustomEvaluations(updated);
    try {
      localStorage.setItem('sigma_monthly_evaluations', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to reset evaluation', e);
    }
    setIsEditingEvaluation(false);
    setEvalSaveToast(true);
    setTimeout(() => setEvalSaveToast(false), 3000);
  };

  const quickEvaluationPresets = [
    'Siswa sangat fokus, aktif, dan cepat memahami materi baru.',
    'Pemahaman konsep dasar sudah baik, perlu latihan mandiri di rumah.',
    'Disiplin kehadiran sangat baik. Siap melangkah ke materi tingkat lanjutan.',
    'Perlu penguatan pada ketelitian mengerjakan soal latihan bertahap.',
  ];

  // Handle Send Student Report via WhatsApp
  const handleSendStudentReportWhatsApp = () => {
    if (!selectedStudent) return;
    const monthName = MONTH_NAMES_ID[selectedMonth - 1] || 'Agustus';
    const customTemplates = settings?.whatsappTemplates;
    const templateString = customTemplates?.studentReport || DEFAULT_WA_TEMPLATES.studentReport;

    const templateData = {
      nama_siswa: selectedStudent.name,
      nis: selectedStudent.code,
      kode_siswa: selectedStudent.code,
      nama_ortu: selectedStudent.parentName,
      nomor_ortu: selectedStudent.parentPhone,
      kelas: selectedStudent.gradeDetail,
      tipe_kelas: selectedStudent.classType,
      jenjang: selectedStudent.level,
      bulan: monthName,
      tahun: selectedYear,
      jumlah_sesi: studentRecords.length,
      nama_bimbel: bimbelName,
      tagline_bimbel: bimbelTagline,
      telepon_bimbel: bimbelPhone,
      alamat_bimbel: bimbelAddress,
      nama_tutor: selectedStudent.tutorName || 'Tutor Bimbel',
    };

    const message = formatWhatsAppMessage(templateString, templateData);
    sendWhatsAppDirect(selectedStudent.parentPhone, message);
  };

  return (
    <div className="space-y-6">
      {/* Control Panel (Hidden When Printing) */}
      <div className="no-print bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
        {/* Top Title & Print Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-heading">
                Rekap Presensi & Format Cetak Laporan
              </h2>
              <p className="text-xs text-slate-500">
                Pilih mode cetak presensi: Laporan lengkap perorangan siswa atau lembar presensi kelas kelompok.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {activeMode === 'mode-a' && selectedStudent && userRole !== 'siswa' && (
              <button
                type="button"
                onClick={handleSendStudentReportWhatsApp}
                className="px-4 py-2.5 sm:py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition cursor-pointer text-xs active:scale-95"
                title="Kirim pengantar ringkasan laporan via WhatsApp ke nomor orang tua siswa"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Kirim WA ke Wali Murid</span>
              </button>
            )}

            {activeMode === 'mode-b' && (
              <button
                type="button"
                id="btn-export-matrix-excel"
                onClick={handleExportMatrixExcel}
                className="px-4 py-2.5 sm:py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition cursor-pointer text-xs active:scale-95"
                title="Download rekap presensi matriks bulanan format Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
                <span>Download Excel (.xlsx)</span>
              </button>
            )}

            <button
              type="button"
              id="btn-export-card-png"
              onClick={handleExportCardPng}
              disabled={isExportingPng}
              className="px-4 py-2.5 sm:py-3 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300/80 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
              title="Unduh tampilan laporan atau kartu presensi sebagai gambar PNG"
            >
              <ImageIcon className="w-4 h-4 text-amber-700" />
              <span>{isExportingPng ? 'Menyimpan...' : 'Unduh Gambar (PNG)'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-5 py-2.5 sm:py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-black rounded-2xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition cursor-pointer text-xs sm:text-sm active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF (A4)</span>
            </button>
          </div>
        </div>

        {/* MODE TABS SELECTION (Only visible for admin/owner/tutor - hidden for student) */}
        {userRole !== 'siswa' ? (
          <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl max-w-xl">
            <button
              onClick={() => setActiveMode('mode-a')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                activeMode === 'mode-a'
                  ? 'bg-white text-indigo-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4 text-indigo-600" />
              <span>Laporan Siswa</span>
            </button>
            <button
              onClick={() => setActiveMode('mode-b')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                activeMode === 'mode-b'
                  ? 'bg-white text-indigo-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid className="w-4 h-4 text-emerald-600" />
              <span>Rekap Presensi</span>
            </button>
          </div>
        ) : (
          <div className="p-3 bg-indigo-50/80 border border-indigo-100 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-indigo-950">Kartu Kontrol & Rekap Presensi Pribadi</p>
              <p className="text-[11px] text-indigo-700">
                Memuat catatan kehadiran resmi, materi yang dipelajari, dan rincian SPP Anda.
              </p>
            </div>
          </div>
        )}

        {/* FILTER CONTROLS FOR MODE A */}
        {activeMode === 'mode-a' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
            {/* Filter Bulan */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Bulan Pembelajaran:
              </label>
              <select
                disabled={filterAllMonths}
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {MONTH_NAMES_ID.map((name, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    Bulan {name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Tahun */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Tahun:
              </label>
              <input
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Pilih Siswa (jika bukan siswa login) */}
            {userRole !== 'siswa' ? (
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Pilih Siswa:
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.name} ({s.gradeDetail} • {s.classType})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Siswa:
                </label>
                <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 truncate">
                  {selectedStudent?.name} ({selectedStudent?.code})
                </div>
              </div>
            )}

            {/* Format Layout Mode A */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Format Tampilan:
              </label>
              <select
                value={modeALayout}
                onChange={(e) => setModeALayout(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="full-a4">📄 Lembar Laporan Lengkap (A4 Full)</option>
                <option value="pocket-card">🗂️ Kartu Saku Presensi (1/4 Kertas A4)</option>
              </select>
            </div>
          </div>
        )}

        {/* FILTER CONTROLS FOR REKAP PRESENSI (MODE B) */}
        {activeMode === 'mode-b' && (
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Filter Bulan */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Bulan:
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                >
                  {MONTH_NAMES_ID.map((name, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Tahun */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Tahun:
                </label>
                <input
                  type="number"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Filter Jenjang */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Jenjang:
                </label>
                <select
                  value={matrixFilterLevel}
                  onChange={(e) => setMatrixFilterLevel(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Semua">Semua Jenjang</option>
                  <option value="SD">SD</option>
                  <option value="SMP">SMP</option>
                  <option value="SMA">SMA</option>
                </select>
              </div>

              {/* Filter Tipe Kelas */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Tipe Kelas:
                </label>
                <select
                  value={matrixFilterClassType}
                  onChange={(e) => setMatrixFilterClassType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Semua">Semua Tipe</option>
                  <option value="Privat">Privat</option>
                  <option value="Grup">Grup / Kelompok</option>
                </select>
              </div>

              {/* Filter Tutor */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Tutor:
                </label>
                <select
                  value={matrixFilterTutor}
                  onChange={(e) => setMatrixFilterTutor(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Semua">Semua Tutor</option>
                  {tutorList.map((tut) => (
                    <option key={tut} value={tut}>
                      {tut}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Status Siswa */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Status Siswa:
                </label>
                <select
                  value={matrixFilterStatus}
                  onChange={(e) => setMatrixFilterStatus(e.target.value as 'Aktif' | 'Semua')}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Aktif">Hanya Siswa Aktif</option>
                  <option value="Semua">Semua (Termasuk Alumni)</option>
                </select>
              </div>
            </div>

            {/* Search Bar */}
            <div className="pt-2">
              <div className="relative w-full max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={matrixSearchTerm}
                  onChange={(e) => setMatrixSearchTerm(e.target.value)}
                  placeholder="Cari nama / NIS siswa..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Status Notification */}
        <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex items-center justify-between text-xs text-indigo-900">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              {activeMode === 'mode-a' ? (
                <span>
                  <strong>Laporan Siswa:</strong> Menampilkan seluruh sesi presensi & materi belajar untuk{' '}
                  <strong>{selectedStudent?.name}</strong> pada bulan{' '}
                  {MONTH_NAMES_ID[selectedMonth - 1]} {selectedYear} ({studentRecords.length} Sesi Terdata).
                </span>
              ) : (
                <span>
                  <strong>Rekap Presensi:</strong> Matriks kehadiran bulanan (Tgl 1 s.d. {daysInMonth}) untuk{' '}
                  <strong>{filteredMatrixStudents.length} Siswa</strong>.
                </span>
              )}
            </span>
          </div>
          <span className="font-mono font-bold text-indigo-700 whitespace-nowrap ml-2">
            Periode: {MONTH_NAMES_ID[selectedMonth - 1]} {selectedYear}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PRINTABLE CONTAINER (Rendered according to activeMode & modeALayout)       */}
      {/* ========================================================================= */}
      <div className="bg-slate-200 p-3 sm:p-8 rounded-3xl flex justify-center shadow-inner overflow-x-auto print:bg-white print:p-0 print:shadow-none">
        {/* ========================================================================= */}
        {/* MODE A: FULL A4 COMPLETE STUDENT REPORT (NO 6 ROWS LIMIT)                 */}
        {/* ========================================================================= */}
        {activeMode === 'mode-a' && modeALayout === 'full-a4' && selectedStudent && (
          <div
            id="printable-report-mode-a"
            className="bg-white shadow-2xl print:shadow-none w-full max-w-[210mm] min-h-[297mm] p-4 sm:p-8 md:p-10 text-slate-800 flex flex-col justify-between border border-slate-300 print:border-none font-sans text-xs leading-relaxed"
          >
            <div>
              {/* Kop Surat Resmi Bimbel */}
              <div className="border-b-2 border-slate-800 pb-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-950 text-white font-black text-2xl flex items-center justify-center font-heading shrink-0">
                    Σ
                  </div>
                  <div>
                    <h1 className="text-xl font-extrabold text-indigo-950 font-heading tracking-tight">
                      {bimbelName}
                    </h1>
                    <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">
                      {bimbelTagline}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {bimbelAddress} • Telp/WA: {bimbelPhone}
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <span className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg text-xs font-extrabold uppercase tracking-wider inline-block">
                    LAPORAN PRESENSI & JURNAL BELAJAR
                  </span>
                  <p className="text-xs font-bold text-slate-700 mt-1">
                    Periode: {MONTH_NAMES_ID[selectedMonth - 1]} {selectedYear}
                  </p>
                </div>
              </div>

              {/* Identitas Siswa & Informasi Pembimbing */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-300 text-xs mb-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Nama Siswa</span>
                  <p className="font-bold text-slate-900 text-sm">{selectedStudent.name}</p>
                  <p className="text-[10px] font-mono text-slate-500 font-semibold">NIS: {selectedStudent.code}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Program / Jenjang</span>
                  <p className="font-bold text-indigo-900">{selectedStudent.gradeDetail}</p>
                  <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-100 text-indigo-800">
                    Kelas {selectedStudent.classType}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Tutor Pembimbing</span>
                  <p className="font-bold text-slate-800">{effectiveTutorName}</p>
                  <p className="text-[10px] text-slate-500">{effectiveTutorTitle}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Orang Tua / Kontak</span>
                  <p className="font-bold text-slate-800">{effectiveParentName}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{selectedStudent.parentPhone || '-'}</p>
                </div>
              </div>

              {/* Ringkasan Kehadiran & Tagihan */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase">Total Kehadiran</span>
                  <p className="text-lg font-black text-emerald-800">
                    {studentMonthlySummary?.presentCount || 0} Sesi Hadir
                  </p>
                  <p className="text-[9px] text-emerald-600">
                    Izin: {studentMonthlySummary?.permissionCount || 0} • Sakit: {studentMonthlySummary?.sickCount || 0} • Alpha: {studentMonthlySummary?.alphaCount || 0}
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-lg">
                  <span className="text-[10px] font-bold text-blue-700 uppercase">Tarif Per Sesi</span>
                  <p className="text-lg font-black text-blue-900 font-mono">
                    {formatRupiah(selectedStudent.pricePerSession)}
                  </p>
                  <p className="text-[9px] text-blue-600">Skema Les Pasca-Bayar</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-lg">
                  <span className="text-[10px] font-bold text-amber-800 uppercase">Total Tagihan Les</span>
                  <p className="text-lg font-black text-amber-900 font-mono">
                    {formatRupiah(studentMonthlySummary?.totalBilled || 0)}
                  </p>
                  <p className="text-[9px] text-amber-700">
                    ({studentMonthlySummary?.presentCount || 0} Sesi × {formatRupiah(selectedStudent.pricePerSession)})
                  </p>
                </div>
                <div className="bg-slate-100 border border-slate-300 p-2.5 rounded-lg">
                  <span className="text-[10px] font-bold text-slate-600 uppercase">Status SPP</span>
                  <p className="text-base font-extrabold text-slate-800 mt-0.5">
                    {studentMonthlySummary?.paymentStatus === 'Lunas' ? (
                      <span className="text-emerald-700 font-black">✓ LUNAS</span>
                    ) : (
                      <span className="text-rose-700 font-black">
                        {studentMonthlySummary?.paymentStatus || 'Belum Bayar'}
                      </span>
                    )}
                  </p>
                  <p className="text-[9px] text-slate-500 font-mono">
                    Terbayar: {formatRupiah(studentMonthlySummary?.totalPaid || 0)}
                  </p>
                </div>
              </div>

              {/* TABEL LENGKAP SEMUA SESI BELAJAR (SEMUA BARIS TERTAMPILKAN) */}
              <div className="mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
                    <span>Daftar Pertemuan & Jurnal Materi Pembelajaran</span>
                  </h3>
                  <span className="text-[10px] sm:text-[11px] font-bold text-indigo-900 font-mono bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200 self-start sm:self-auto whitespace-nowrap">
                    Total {studentRecords.length} Pertemuan Tercatat
                  </span>
                </div>

                <div className="w-full overflow-x-auto rounded-xl border border-slate-300 bg-white shadow-sm print:overflow-visible print:border-none print:shadow-none">
                  <table className="w-full min-w-[620px] sm:min-w-full border-collapse text-xs print:min-w-0">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold text-[11px]">
                        <th className="py-2 px-2 border-r border-slate-300 w-8 text-center">No</th>
                        <th className="py-2 px-2.5 border-r border-slate-300 w-28 text-left">Hari, Tgl & Jam</th>
                        <th className="py-2 px-2.5 border-r border-slate-300 w-20 text-center">Status</th>
                        <th className="py-2 px-2.5 border-r border-slate-300 text-left">Materi / Topik Pelajaran</th>
                        <th className="py-2 px-2.5 border-r border-slate-300 w-32 text-left">Tutor Pengajar</th>
                        <th className="py-2 px-2 border-r border-slate-300 w-44 text-left">Catatan & Evaluasi</th>
                        <th className="py-2 px-2 w-14 text-center">Paraf</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {studentRecords.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-6 text-slate-400 italic">
                            Belum ada log presensi belajar untuk siswa ini pada bulan {MONTH_NAMES_ID[selectedMonth - 1]} {selectedYear}.
                          </td>
                        </tr>
                      ) : (
                        studentRecords.map((record, index) => (
                          <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2 px-2 border-r border-slate-200 text-center font-mono font-bold text-slate-600 text-[11px]">
                              {index + 1}
                            </td>
                            <td className="py-2 px-2.5 border-r border-slate-200 text-[11px]">
                              <div className="font-bold text-slate-800 whitespace-nowrap">{formatDateIndo(record.date)}</div>
                              <div className="text-[10px] text-slate-500 font-mono">{record.time} WIB</div>
                            </td>
                            <td className="py-2 px-2.5 border-r border-slate-200 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block whitespace-nowrap ${
                                  record.status === 'Hadir'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : record.status === 'Izin'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : 'bg-rose-100 text-rose-800 border border-rose-200'
                                }`}
                              >
                                {record.status}
                              </span>
                            </td>
                            <td className="py-2 px-2.5 border-r border-slate-200 text-slate-900 font-medium text-[11px] break-words">
                              {record.topic}
                            </td>
                            <td className="py-2 px-2.5 border-r border-slate-200 text-slate-700 text-[11px] whitespace-nowrap">
                              {record.tutorName || selectedStudent.tutorName || 'Tutor Bimbel'}
                            </td>
                            <td className="py-2 px-2 border-r border-slate-200 text-slate-600 text-[10px] italic break-words">
                              {record.tutorNotes || 'Mengikuti bimbingan belajar dengan baik.'}
                            </td>
                            <td className="py-2 px-2 text-center font-mono text-[9px] text-slate-400">
                              <span className="inline-block w-8 h-4 border-b border-dashed border-slate-400"></span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Catatan Evaluasi Akhir Bulan (Dapat Diedit Manual oleh Owner & Tutor) */}
              <div className="bg-slate-50/90 p-3.5 rounded-xl border border-slate-300 text-xs mb-4 relative transition-all">
                {/* Header Bagian Evaluasi */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wide flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
                      Catatan Evaluasi / Rekomendasi Pengajar:
                    </span>
                    {canEditEvaluation && (
                      <span
                        className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border print:hidden ${
                          isUsingCustomEvaluation
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        }`}
                      >
                        {isUsingCustomEvaluation ? '✏️ Catatan Kustom Pengajar' : '✨ Rekomendasi Otomatis'}
                      </span>
                    )}
                  </div>

                  {/* Tombol Aksi untuk Owner & Tutor (Disembunyikan saat dicetak) */}
                  {canEditEvaluation && !isEditingEvaluation && (
                    <div className="flex items-center gap-1.5 print:hidden">
                      {isUsingCustomEvaluation && (
                        <button
                          type="button"
                          onClick={handleResetEvaluation}
                          title="Kembalikan ke teks rekomendasi otomatis sistem"
                          className="px-2 py-1 text-[10px] font-medium text-slate-600 hover:text-rose-700 bg-white hover:bg-rose-50 border border-slate-300 hover:border-rose-200 rounded-lg flex items-center gap-1 transition-colors shadow-xs"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span className="hidden sm:inline">Reset Default</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleStartEditEvaluation}
                        className="px-2.5 py-1 text-[10px] font-bold text-indigo-700 hover:text-indigo-900 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-lg flex items-center gap-1 transition-colors shadow-xs"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Edit Catatan</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Notifikasi Simpan Berhasil */}
                {evalSaveToast && (
                  <div className="mb-2 p-1.5 px-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-[10px] font-bold rounded-lg flex items-center gap-1.5 animate-fadeIn print:hidden">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Catatan evaluasi belajar berhasil diperbarui dan tersimpan!</span>
                  </div>
                )}

                {/* Mode Edit Form (Hanya saat Owner/Tutor klik Edit) */}
                {canEditEvaluation && isEditingEvaluation ? (
                  <div className="space-y-2 mt-1 print:hidden">
                    <textarea
                      value={evalDraftText}
                      onChange={(e) => setEvalDraftText(e.target.value)}
                      rows={3}
                      placeholder="Tuliskan catatan evaluasi perkembangan belajar siswa, pemahaman materi, atau saran untuk orang tua..."
                      className="w-full p-2.5 bg-white border-2 border-indigo-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 rounded-lg text-xs text-slate-800 leading-relaxed outline-hidden transition-all shadow-inner"
                      autoFocus
                    />

                    {/* Template Cepat / Quick Presets */}
                    <div className="flex items-center gap-1 flex-wrap pt-0.5">
                      <span className="text-[10px] font-bold text-slate-500 mr-1">Rekomendasi Cepat:</span>
                      {quickEvaluationPresets.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setEvalDraftText(preset);
                          }}
                          className="text-[9px] px-2 py-0.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-800 rounded-md transition-colors"
                        >
                          + {preset.slice(0, 30)}...
                        </button>
                      ))}
                    </div>

                    {/* Tombol Simpan & Batal */}
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsEditingEvaluation(false)}
                        className="px-3 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-200 border border-slate-300 rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveEvaluation}
                        className="px-3.5 py-1 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg flex items-center gap-1.5 shadow-sm shadow-indigo-600/30 transition-all"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Simpan Evaluasi
                      </button>
                    </div>

                    {/* Teks tampilan khusus mode Print saat sedang diedit */}
                    <p className="hidden print:block text-slate-700 text-xs mt-1 leading-relaxed">
                      {activeEvaluationText}
                    </p>
                  </div>
                ) : (
                  /* Teks Evaluasi Bersih (Tampilan Normal & Hasil Print) */
                  <p className="text-slate-700 text-xs mt-1 leading-relaxed font-normal">
                    {activeEvaluationText}
                  </p>
                )}
              </div>
            </div>

            {/* Tanda Tangan Resmi Footer */}
            <div className="grid grid-cols-3 gap-6 text-center text-xs pt-4 border-t border-slate-300">
              <div>
                <p className="text-slate-600 font-semibold mb-14">Orang Tua / Wali Siswa,</p>
                <p className="font-bold text-slate-900 border-t border-slate-400 pt-1">
                  ( {effectiveParentName} )
                </p>
              </div>
              <div>
                <p className="text-slate-600 font-semibold mb-14">Tutor Pembimbing,</p>
                <p className="font-bold text-slate-900 border-t border-slate-400 pt-1">
                  ( {effectiveTutorName} )
                </p>
              </div>
              <div>
                <p className="text-slate-600 font-semibold mb-14">
                  {effectiveOwnerTitle || `Kepala ${bimbelName}`},
                </p>
                <p className="font-bold text-slate-900 border-t border-slate-400 pt-1">
                  ( {effectiveOwnerName} )
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODE A: POCKET CARD LAYOUT (1 LEMBAR TUNGGAL 1/4 A4 / A6: 105mm x 148mm)  */}
        {/* ========================================================================= */}
        {activeMode === 'mode-a' && modeALayout === 'pocket-card' && studentMonthlySummary && (
          <div
            id="printable-pocket-cards"
            className="w-full flex justify-center py-4 print:py-0 print:m-0"
          >
            <div
              className="quarter-single-card bg-white border-2 border-dashed border-slate-400 p-3.5 rounded-xl flex flex-col justify-between text-slate-800 text-[10px] leading-tight shadow-xl print:shadow-none print:border-slate-800 w-full max-w-[105mm] min-h-[148mm] box-border"
            >
              {/* Bagian Atas: Header, Biodata, Rekap Kotak Kuning, dan Tabel Rekapan Siswa */}
              <div className="space-y-2 flex-1">
                {/* Header Kartu */}
                <div className="border-b border-slate-300 pb-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-7 h-7 rounded bg-indigo-950 text-white font-black text-xs flex items-center justify-center font-heading shrink-0">
                      Σ
                    </div>
                    <div>
                      <h4 className="font-extrabold text-indigo-950 text-xs tracking-tight">{bimbelName}</h4>
                      <p className="text-[8px] font-bold text-amber-700 uppercase">
                        {bimbelTagline}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-900">
                      KARTU KONTROL (1/4 A4)
                    </span>
                    <p className="text-[9px] font-bold text-slate-700 mt-0.5">
                      {MONTH_NAMES_ID[selectedMonth - 1]} {selectedYear}
                    </p>
                  </div>
                </div>

                {/* 1. Biodata Siswa */}
                <div className="grid grid-cols-2 gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-200 text-[10px]">
                  <div>
                    <span className="text-slate-500 font-medium">Nama Siswa:</span>
                    <p className="font-bold text-slate-900 truncate">{selectedStudent.name}</p>
                    <p className="text-[9px] font-mono text-slate-500 font-semibold">NIS: {selectedStudent.code}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Program / Kelas:</span>
                    <p className="font-bold text-indigo-800 truncate">{selectedStudent.gradeDetail}</p>
                    <p className="text-[9px] text-slate-600 font-semibold">Kelas {selectedStudent.classType}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Tutor Pembimbing:</span>
                    <p className="font-semibold text-slate-700 truncate">{effectiveTutorName}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Tarif Sesi:</span>
                    <p className="font-bold text-emerald-700">{formatRupiah(selectedStudent.pricePerSession)}</p>
                  </div>
                </div>

                {/* 2. Isi Rekapan Siswa (Tabel Presensi & Jurnal Belajar) */}
                <div className="border border-slate-200 rounded-lg overflow-hidden my-1 bg-white">
                  <table className="w-full text-left text-[9px] border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                        <th className="py-1 px-1.5 w-6 text-center">#</th>
                        <th className="py-1 px-1.5 w-20">Tgl & Jam</th>
                        <th className="py-1 px-1 text-center w-12">Status</th>
                        <th className="py-1 px-1.5">Materi Pokok</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {studentRecords.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-6 text-slate-400 italic text-[9px]">
                            Belum ada catatan presensi di bulan ini
                          </td>
                        </tr>
                      ) : (
                        studentRecords.map((rec, idx) => (
                          <tr key={rec.id} className="text-[9px] hover:bg-slate-50">
                            <td className="py-0.5 px-1.5 text-center font-mono font-bold text-slate-500">{idx + 1}</td>
                            <td className="py-0.5 px-1.5 font-mono text-[8px] whitespace-nowrap">
                              {rec.date.slice(5)} {rec.time}
                            </td>
                            <td className="py-0.5 px-1 text-center font-bold">
                              <span
                                className={
                                  rec.status === 'Hadir'
                                    ? 'text-emerald-700'
                                    : rec.status === 'Izin'
                                    ? 'text-amber-700'
                                    : 'text-rose-700'
                                }
                              >
                                {rec.status}
                              </span>
                            </td>
                            <td className="py-0.5 px-1.5 text-slate-700 break-words leading-tight">
                              {rec.topic}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 3. Box Rekap Kehadiran & Tagihan SPP (Kotak Kuning di Bawah Rekapan Presensi) */}
                <div className="bg-amber-50/90 border border-amber-300 rounded-lg p-2 text-[9.5px]">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-slate-800">
                      Kehadiran: <strong className="text-emerald-800">{studentMonthlySummary.presentCount} Hadir</strong>{' '}
                      <span className="text-slate-500 font-normal">
                        ({studentMonthlySummary.permissionCount + studentMonthlySummary.sickCount + studentMonthlySummary.alphaCount} Tidak Hadir)
                      </span>
                    </span>
                    <span className="text-emerald-900 font-mono text-[10.5px] font-extrabold">
                      Total: {formatRupiah(studentMonthlySummary.totalBilled)}
                    </span>
                  </div>
                  <div className="text-[8.5px] text-slate-600 flex justify-between items-center mt-1 pt-1 border-t border-amber-200/80">
                    <span>
                      {studentMonthlySummary.presentCount} Sesi × {formatRupiah(selectedStudent.pricePerSession)}
                    </span>
                    <span className="font-bold">
                      Status:{' '}
                      <span
                        className={
                          studentMonthlySummary.paymentStatus === 'Lunas'
                            ? 'text-emerald-700 font-extrabold'
                            : 'text-rose-700 font-extrabold'
                        }
                      >
                        {studentMonthlySummary.paymentStatus}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Bagian Bawah: Tanda Tangan Pocket Card */}
              <div className="grid grid-cols-2 gap-4 text-center text-[8.5px] pt-2 border-t border-slate-200 mt-2">
                <div>
                  <p className="text-slate-600 font-semibold mb-6">Orang Tua / Wali,</p>
                  <p className="font-bold text-slate-900 border-t border-slate-300 pt-0.5">
                    ( {effectiveParentName} )
                  </p>
                </div>
                <div>
                  <p className="text-slate-600 font-semibold mb-6">{effectiveOwnerTitle || 'Tutor / Pengajar'},</p>
                  <p className="font-bold text-slate-900 border-t border-slate-300 pt-0.5">
                    ( {effectiveTutorName || effectiveOwnerName} )
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODE B: REKAP PRESENSI MATRIKS BULANAN (TANGGAL 1 - 30/31)                 */}
        {/* ========================================================================= */}
        {activeMode === 'mode-b' && (
          <div
            id="printable-group-sheet"
            className="bg-white shadow-2xl print:shadow-none w-full max-w-[297mm] min-h-[210mm] p-6 sm:p-8 text-slate-800 flex flex-col justify-between border border-slate-300 print:border-none font-sans text-xs leading-relaxed"
          >
            <div>
              {/* Kop Surat Resmi Bimbel */}
              <div className="border-b-2 border-slate-800 pb-3 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-950 text-white font-black text-2xl flex items-center justify-center font-heading">
                    Σ
                  </div>
                  <div>
                    <h1 className="text-xl font-extrabold text-indigo-950 font-heading tracking-tight">
                      {bimbelName}
                    </h1>
                    <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">
                      {bimbelTagline}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {bimbelAddress} • Telp/WA: {bimbelPhone}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-extrabold uppercase tracking-wider inline-block shadow-sm">
                    REKAPITULASI PRESENSI SISWA (BULANAN)
                  </span>
                  <p className="text-xs font-bold text-slate-800 mt-1">
                    Periode: {MONTH_NAMES_ID[selectedMonth - 1]} {selectedYear}
                  </p>
                </div>
              </div>

              {/* Info Kriteria Filter */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-300 text-xs mb-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Tingkat / Jenjang</span>
                  <p className="font-bold text-slate-900 text-xs">{matrixFilterLevel === 'Semua' ? 'Semua Jenjang (SD/SMP/SMA)' : matrixFilterLevel}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Tipe Bimbingan</span>
                  <p className="font-bold text-slate-900 text-xs">{matrixFilterClassType === 'Semua' ? 'Semua (Privat & Grup)' : matrixFilterClassType}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Tutor Pembimbing</span>
                  <p className="font-bold text-slate-900 text-xs truncate">{matrixFilterTutor === 'Semua' ? 'Semua Tutor' : matrixFilterTutor}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Jumlah Siswa Terdata</span>
                  <p className="font-bold text-emerald-800 text-xs">{filteredMatrixStudents.length} Siswa Terdaftar</p>
                </div>
              </div>

              {/* TABEL MATRIKS PRESENSI TGL 1-30/31 */}
              <div className="mb-4 overflow-x-auto">
                <table className="w-full border-collapse border border-slate-400 text-[10px]">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-400 text-slate-700 font-bold">
                      <th className="py-1.5 px-1 border-r border-slate-300 w-7 text-center" rowSpan={2}>No</th>
                      <th className="py-1.5 px-1.5 border-r border-slate-300 w-16 text-left" rowSpan={2}>NIS</th>
                      <th className="py-1.5 px-2 border-r border-slate-300 min-w-[140px] text-left" rowSpan={2}>Nama Siswa</th>
                      <th className="py-1.5 px-1.5 border-r border-slate-300 w-16 text-center" rowSpan={2}>Kelas</th>
                      <th className="py-1.5 px-1.5 border-r border-slate-300 w-14 text-center" rowSpan={2}>Tipe</th>
                      
                      {/* Tanggal 1 s.d. 30/31 Header */}
                      <th className="py-1 px-1 border-r border-slate-300 text-center bg-indigo-50/70" colSpan={daysInMonth}>
                        Tanggal Pembelajaran (Bulan {MONTH_NAMES_ID[selectedMonth - 1]} {selectedYear})
                      </th>

                      {/* Rekapitulasi Kolom */}
                      <th className="py-1 px-1 border-r border-slate-300 w-7 text-center bg-emerald-50 text-emerald-900" title="Hadir" rowSpan={2}>H</th>
                      <th className="py-1 px-1 border-r border-slate-300 w-7 text-center bg-amber-50 text-amber-900" title="Izin" rowSpan={2}>I</th>
                      <th className="py-1 px-1 border-r border-slate-300 w-7 text-center bg-blue-50 text-blue-900" title="Sakit" rowSpan={2}>S</th>
                      <th className="py-1 px-1 border-r border-slate-300 w-7 text-center bg-rose-50 text-rose-900" title="Alpha" rowSpan={2}>A</th>
                      <th className="py-1 px-1 border-r border-slate-300 w-8 text-center bg-slate-200" title="Total Pertemuan" rowSpan={2}>Tot</th>
                      <th className="py-1 px-1 w-9 text-center bg-indigo-100 text-indigo-950" title="Persentase Kehadiran" rowSpan={2}>%</th>
                    </tr>
                    <tr className="bg-slate-50 border-b border-slate-400 text-[9px] font-bold">
                      {daysArray.map((day) => {
                        const dayOfWeek = new Date(selectedYear, selectedMonth - 1, day).getDay();
                        const isSunday = dayOfWeek === 0;
                        const dayInitials = ['M', 'S', 'S', 'R', 'K', 'J', 'S'][dayOfWeek];
                        return (
                          <th
                            key={`header-day-${day}`}
                            className={`p-0.5 border-r border-slate-300 text-center min-w-[20px] ${
                              isSunday ? 'bg-rose-50 text-rose-700 font-extrabold' : 'text-slate-700'
                            }`}
                            title={`Tanggal ${day} (${dayInitials})`}
                          >
                            <div>{day}</div>
                            <div className="text-[7px] text-slate-400 font-normal leading-none">{dayInitials}</div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {filteredMatrixStudents.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5 + daysInMonth + 6}
                          className="text-center py-8 text-slate-400 italic text-xs"
                        >
                          Tidak ada data siswa yang cocok dengan filter yang dipilih.
                        </td>
                      </tr>
                    ) : (
                      filteredMatrixStudents.map((student, idx) => {
                        const data = attendanceMatrixData[student.id];
                        return (
                          <tr key={`matrix-row-${student.id}`} className="hover:bg-slate-50/80">
                            <td className="py-1 px-1 border-r border-slate-300 text-center font-mono font-bold text-slate-600 text-[9px]">
                              {idx + 1}
                            </td>
                            <td className="py-1 px-1.5 border-r border-slate-300 font-mono text-[9px] text-slate-500">
                              {student.code}
                            </td>
                            <td className="py-1 px-2 border-r border-slate-300 font-bold text-slate-900 truncate max-w-[150px]">
                              {student.name}
                            </td>
                            <td className="py-1 px-1.5 border-r border-slate-300 text-center text-slate-600 text-[9px]">
                              {student.gradeDetail}
                            </td>
                            <td className="py-1 px-1.5 border-r border-slate-300 text-center text-[9px]">
                              <span className={`px-1 py-0.2 rounded font-medium ${
                                student.classType === 'Privat' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
                              }`}>
                                {student.classType}
                              </span>
                            </td>

                            {/* Attendance Days (1-31) Checkmark / Status Cells */}
                            {daysArray.map((day) => {
                              const dayData = data?.days[day];
                              const status = dayData?.status;
                              const isSunday = new Date(selectedYear, selectedMonth - 1, day).getDay() === 0;

                              return (
                                <td
                                  key={`day-cell-${student.id}-${day}`}
                                  className={`py-1 px-0.5 border-r border-slate-300 text-center ${
                                    isSunday ? 'bg-rose-50/30' : ''
                                  }`}
                                >
                                  {status === 'Hadir' ? (
                                    <span
                                      className="inline-flex items-center justify-center w-4 h-4 rounded text-[10px] font-black text-emerald-700 bg-emerald-100/90"
                                      title={`Hadir: ${dayData.record?.topic || 'Sesi Pembelajaran'}`}
                                    >
                                      ✓
                                    </span>
                                  ) : status === 'Izin' ? (
                                    <span
                                      className="inline-flex items-center justify-center w-4 h-4 rounded text-[9px] font-bold text-amber-800 bg-amber-100"
                                      title="Izin"
                                    >
                                      I
                                    </span>
                                  ) : status === 'Sakit' ? (
                                    <span
                                      className="inline-flex items-center justify-center w-4 h-4 rounded text-[9px] font-bold text-blue-800 bg-blue-100"
                                      title="Sakit"
                                    >
                                      S
                                    </span>
                                  ) : status === 'Alpha' ? (
                                    <span
                                      className="inline-flex items-center justify-center w-4 h-4 rounded text-[9px] font-extrabold text-rose-800 bg-rose-100"
                                      title="Alpha (Tanpa Keterangan)"
                                    >
                                      A
                                    </span>
                                  ) : (
                                    <span className="text-slate-300 text-[8px] font-mono">-</span>
                                  )}
                                </td>
                              );
                            })}

                            {/* Summary Columns */}
                            <td className="py-1 px-1 border-r border-slate-300 text-center font-bold text-emerald-800 bg-emerald-50/40">
                              {data?.hadirCount || 0}
                            </td>
                            <td className="py-1 px-1 border-r border-slate-300 text-center text-amber-800 bg-amber-50/40">
                              {data?.izinCount || 0}
                            </td>
                            <td className="py-1 px-1 border-r border-slate-300 text-center text-blue-800 bg-blue-50/40">
                              {data?.sakitCount || 0}
                            </td>
                            <td className="py-1 px-1 border-r border-slate-300 text-center font-bold text-rose-800 bg-rose-50/40">
                              {data?.alphaCount || 0}
                            </td>
                            <td className="py-1 px-1 border-r border-slate-300 text-center font-mono font-bold text-slate-800 bg-slate-100">
                              {data?.totalCount || 0}
                            </td>
                            <td className="py-1 px-1 text-center font-bold text-indigo-900 bg-indigo-50/60">
                              {data?.percentage || 0}%
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {/* FOOTER TOTALS ROW */}
                  {filteredMatrixStudents.length > 0 && (
                    <tfoot>
                      <tr className="bg-slate-200 border-t-2 border-slate-400 font-bold text-slate-800 text-[9px]">
                        <td colSpan={5} className="py-1.5 px-2 text-right uppercase border-r border-slate-300">
                          Total Kehadiran Siswa Per Tanggal:
                        </td>
                        {daysArray.map((day) => {
                          const count = dayTotals[day]?.hadir || 0;
                          return (
                            <td
                              key={`footer-total-${day}`}
                              className="py-1 px-0.5 border-r border-slate-300 text-center font-mono"
                            >
                              {count > 0 ? (
                                <span className="font-bold text-emerald-900">{count}</span>
                              ) : (
                                <span className="text-slate-400 font-normal">-</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="py-1 px-1 border-r border-slate-300 text-center font-bold text-emerald-900 bg-emerald-100">
                          {grandTotals.hadir}
                        </td>
                        <td className="py-1 px-1 border-r border-slate-300 text-center font-bold text-amber-900 bg-amber-100">
                          {grandTotals.izin}
                        </td>
                        <td className="py-1 px-1 border-r border-slate-300 text-center font-bold text-blue-900 bg-blue-100">
                          {grandTotals.sakit}
                        </td>
                        <td className="py-1 px-1 border-r border-slate-300 text-center font-bold text-rose-900 bg-rose-100">
                          {grandTotals.alpha}
                        </td>
                        <td className="py-1 px-1 border-r border-slate-300 text-center font-mono font-bold text-slate-900 bg-slate-300">
                          {grandTotals.totalSessions}
                        </td>
                        <td className="py-1 px-1 text-center font-bold text-indigo-950 bg-indigo-200">
                          {grandTotals.avgPercentage}%
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {/* KETERANGAN SIMBOL / LEGENDA */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-[10px] text-slate-700 mb-4">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="font-bold uppercase text-slate-900">Keterangan:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded text-[10px] font-black text-emerald-700 bg-emerald-100 flex items-center justify-center">✓</span>
                    <span>Hadir (H)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded text-[9px] font-bold text-amber-800 bg-amber-100 flex items-center justify-center">I</span>
                    <span>Izin (I)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded text-[9px] font-bold text-blue-800 bg-blue-100 flex items-center justify-center">S</span>
                    <span>Sakit (S)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded text-[9px] font-bold text-rose-800 bg-rose-100 flex items-center justify-center">A</span>
                    <span>Alpha / Tanpa Keterangan (A)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-slate-400 font-bold">[-]</span>
                    <span>Tidak Ada Jadwal Belajar</span>
                  </div>
                </div>
                <div className="font-mono text-[9px] text-slate-500">
                  Dicetak pada: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
            </div>

            {/* Tanda Tangan Footer */}
            <div className="grid grid-cols-2 gap-8 text-center text-xs pt-4 border-t border-slate-300 mt-2">
              <div>
                <p className="text-slate-600 font-semibold mb-14">Tutor Pengajar / Wali Kelas,</p>
                <p className="font-bold text-slate-900 border-t border-slate-400 pt-1 inline-block min-w-[220px]">
                  ( {matrixFilterTutor !== 'Semua' ? matrixFilterTutor : effectiveTutorName} )
                </p>
              </div>
              <div>
                <p className="text-slate-600 font-semibold mb-14">
                  {effectiveOwnerTitle || `Kepala ${bimbelName}`},
                </p>
                <p className="font-bold text-slate-900 border-t border-slate-400 pt-1 inline-block min-w-[220px]">
                  ( {effectiveOwnerName} )
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
