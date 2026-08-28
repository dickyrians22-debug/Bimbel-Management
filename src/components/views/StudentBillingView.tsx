import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Search,
  Filter,
  Download,
  Send,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  DollarSign,
  Printer,
  ChevronRight,
  Eye,
  Sparkles,
  Phone,
  User,
  Users,
  Layers,
  ArrowUpRight,
  HelpCircle,
  BookOpen,
  Info,
  ExternalLink,
  RotateCcw,
  FileSpreadsheet,
  Image as ImageIcon,
} from 'lucide-react';
import {
  Student,
  AttendanceRecord,
  IncomeRecord,
  UserRole,
  BimbelSettings,
  ClassType,
  StudentLevel,
  StudentBillingItem,
} from '../../types';
import {
  formatRupiah,
  formatDateIndo,
  MONTH_NAMES_ID,
  getMonthNameIndo,
  isSystemIncomeCategory,
} from '../../utils/storage';
import {
  DEFAULT_WA_TEMPLATES,
  formatWhatsAppMessage,
  sendWhatsAppDirect,
} from '../../utils/whatsapp';
import { exportToExcel, exportElementToPng } from '../../utils/exportUtils';

interface StudentBillingViewProps {
  students: Student[];
  attendance: AttendanceRecord[];
  incomes: IncomeRecord[];
  userRole: UserRole;
  currentStudentCode?: string;
  settings?: BimbelSettings;
  onRecordPayment: (paymentData: {
    student: Student;
    month: number;
    year: number;
    amount: number;
    totalBill: number;
    remainingBill: number;
    sessionsCount: number;
    paymentMethod: string;
    datePaid: string;
    notes?: string;
    autoOpenReceipt?: boolean;
  }) => void;
  onViewReceipt: (income: IncomeRecord) => void;
}

export const StudentBillingView: React.FC<StudentBillingViewProps> = ({
  students,
  attendance,
  incomes,
  userRole,
  currentStudentCode,
  settings,
  onRecordPayment,
  onViewReceipt,
}) => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterLevel, setFilterLevel] = useState<string>('All');
  const [filterClassType, setFilterClassType] = useState<string>('All');

  // Fast Payment Modal State
  const [paymentModalStudent, setPaymentModalStudent] = useState<StudentBillingItem | null>(null);
  const [payAmountType, setPayAmountType] = useState<'full' | 'partial'>('full');
  const [customPayAmount, setCustomPayAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Transfer BCA');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [autoOpenReceipt, setAutoOpenReceipt] = useState<boolean>(true);

  // Session Detail Modal State
  const [detailModalStudent, setDetailModalStudent] = useState<{
    item: StudentBillingItem;
    sessions: AttendanceRecord[];
  } | null>(null);

  const canEdit = userRole === 'owner';
  const isSiswaRole = userRole === 'siswa';

  // 1. Calculate Monthly Billing for All Students based on actual attendance
  const billingItems = useMemo<StudentBillingItem[]>(() => {
    return students.map((std) => {
      // Find all attendances for this student in the selected month & year
      const attendedRecords = attendance.filter((a) => {
        if (!a.date) return false;
        const [yStr, mStr] = a.date.split('-');
        const y = parseInt(yStr, 10);
        const m = parseInt(mStr, 10);

        const isMatchDate = y === selectedYear && m === selectedMonth;
        const isMatchStudent =
          (a.studentId && a.studentId === std.id) ||
          (a.studentCode && a.studentCode === std.code) ||
          (a.studentName && a.studentName.toLowerCase() === std.name.toLowerCase());
        const isPresent = a.status === 'Hadir';

        return isMatchDate && isMatchStudent && isPresent;
      }).sort((a, b) => (a.date || '').localeCompare(b.date || ''));

      const attendedCount = attendedRecords.length;
      const attendanceDates = attendedRecords.map((r) => r.date);
      const sessionTopics = attendedRecords.map((r) => r.topic || 'Materi Sesi');

      // Price per session
      const rate = std.pricePerSession > 0 ? std.pricePerSession : (std.level === 'SMP' ? 60000 : 50000);
      const totalBill = attendedCount * rate;

      // Find incomes/payments already recorded for this student for this accrual month & year
      // CRITICAL: Hanya kategori SPP/Iuran Siswa (locked system category) yang dihitung ke tagihan les bulanan siswa
      const studentIncomes = incomes.filter((inc) => {
        const isMatchStudent =
          (inc.studentId && inc.studentId === std.id) ||
          (inc.studentCode && inc.studentCode === std.code) ||
          (inc.studentName && inc.studentName.toLowerCase() === std.name.toLowerCase());
        const isMatchPeriod =
          inc.accrualMonth === selectedMonth && inc.accrualYear === selectedYear;
        const isSppCategory = isSystemIncomeCategory(inc.category || '', settings);

        return isMatchStudent && isMatchPeriod && isSppCategory;
      });

      const paidAmount = studentIncomes.reduce((sum, inc) => sum + (inc.amount || 0), 0);
      const remainingAmount = Math.max(0, totalBill - paidAmount);

      let status: 'Belum Bayar' | 'Sebagian' | 'Lunas' | 'Tanpa Tagihan' = 'Belum Bayar';
      if (totalBill === 0) {
        status = 'Tanpa Tagihan';
      } else if (paidAmount >= totalBill) {
        status = 'Lunas';
      } else if (paidAmount > 0) {
        status = 'Sebagian';
      } else {
        status = 'Belum Bayar';
      }

      return {
        id: `bill-${std.id}-${selectedYear}-${selectedMonth}`,
        studentId: std.id,
        studentCode: std.code,
        studentName: std.name,
        parentName: std.parentName || 'Orang Tua Siswa',
        parentPhone: std.parentPhone || '',
        gradeDetail: std.gradeDetail || `${std.level}`,
        classType: std.classType,
        level: std.level,
        month: selectedMonth,
        year: selectedYear,
        pricePerSession: rate,
        attendedSessionsCount: attendedCount,
        totalSessionsInMonth: attendedCount,
        attendanceDates,
        sessionTopics,
        totalBill,
        paidAmount,
        remainingAmount,
        status,
        incomesList: studentIncomes,
      };
    });
  }, [students, attendance, incomes, selectedMonth, selectedYear]);

  // Filter for Student Role
  const relevantBillingItems = useMemo(() => {
    if (isSiswaRole && currentStudentCode) {
      return billingItems.filter(
        (b) => b.studentCode.toLowerCase() === currentStudentCode.toLowerCase()
      );
    }
    return billingItems;
  }, [billingItems, isSiswaRole, currentStudentCode]);

  // Filtered Billing Items
  const filteredBillingItems = useMemo(() => {
    return relevantBillingItems.filter((item) => {
      const term = searchTerm.toLowerCase();
      const matchSearch =
        !term ||
        item.studentName.toLowerCase().includes(term) ||
        item.studentCode.toLowerCase().includes(term) ||
        item.parentName.toLowerCase().includes(term) ||
        item.parentPhone.includes(term);

      const matchStatus =
        filterStatus === 'All' || item.status === filterStatus;
      const matchLevel =
        filterLevel === 'All' || item.level === filterLevel;
      const matchClass =
        filterClassType === 'All' || item.classType === filterClassType;

      return matchSearch && matchStatus && matchLevel && matchClass;
    });
  }, [relevantBillingItems, searchTerm, filterStatus, filterLevel, filterClassType]);

  // Summary Metrics
  const summary = useMemo(() => {
    let grandTotalBill = 0;
    let grandTotalPaid = 0;
    let grandTotalRemaining = 0;
    let countLunas = 0;
    let countSebagian = 0;
    let countBelumBayar = 0;
    let countNoBill = 0;

    relevantBillingItems.forEach((item) => {
      grandTotalBill += item.totalBill;
      grandTotalPaid += item.paidAmount;
      grandTotalRemaining += item.remainingAmount;

      if (item.status === 'Lunas') countLunas++;
      else if (item.status === 'Sebagian') countSebagian++;
      else if (item.status === 'Belum Bayar') countBelumBayar++;
      else countNoBill++;
    });

    return {
      grandTotalBill,
      grandTotalPaid,
      grandTotalRemaining,
      countLunas,
      countSebagian,
      countBelumBayar,
      countNoBill,
      totalActiveStudents: relevantBillingItems.length,
    };
  }, [relevantBillingItems]);

  // Handle WhatsApp Message Sending
  const handleSendWhatsApp = (item: StudentBillingItem) => {
    const monthName = getMonthNameIndo(item.month);
    const bankInfo = settings?.bankInfo || 'BCA: 8830-1234-56 a.n Bimbel Sigma Mandiri';
    const bimbelName = settings?.bimbelName || 'BIMBEL SIGMA';
    const bimbelTagline = settings?.tagline || 'Belajar Sampai Paham, Bukan Sekadar Hafal';
    const bimbelPhone = settings?.phone || '0812-3456-7890';
    const bimbelAddress = settings?.address || '';

    // Format dates string (misal: 04/08, 07/08)
    const formattedDates = item.attendanceDates
      .map((d) => {
        const parts = d.split('-');
        return `${parts[2]}/${parts[1]}`;
      })
      .join(', ');

    // Find student tutor name if available
    const matchedStudent = students.find((s) => s.id === item.studentId);
    const tutorName = matchedStudent?.tutorName || 'Tutor Bimbel';

    const templateData = {
      nama_siswa: item.studentName,
      nis: item.studentCode,
      kode_siswa: item.studentCode,
      nama_ortu: item.parentName,
      nomor_ortu: item.parentPhone,
      kelas: item.gradeDetail,
      tipe_kelas: item.classType,
      jenjang: item.level,
      bulan: monthName,
      tahun: item.year,
      jumlah_sesi: item.attendedSessionsCount,
      tarif_per_sesi: formatRupiah(item.pricePerSession),
      daftar_tanggal: formattedDates || '-',
      total_tagihan: formatRupiah(item.totalBill),
      sudah_dibayar: formatRupiah(item.paidAmount),
      sisa_tagihan: formatRupiah(item.remainingAmount),
      status_bayar: item.status,
      rekening_bimbel: bankInfo,
      nama_bimbel: bimbelName,
      tagline_bimbel: bimbelTagline,
      telepon_bimbel: bimbelPhone,
      alamat_bimbel: bimbelAddress,
      nama_tutor: tutorName,
    };

    let templateString = '';
    const customTemplates = settings?.whatsappTemplates;

    if (item.status === 'Lunas') {
      templateString = customTemplates?.paidBilling || DEFAULT_WA_TEMPLATES.paidBilling;
    } else if (item.status === 'Sebagian') {
      templateString = customTemplates?.partialBilling || DEFAULT_WA_TEMPLATES.partialBilling;
    } else {
      templateString = customTemplates?.unpaidBilling || DEFAULT_WA_TEMPLATES.unpaidBilling;
    }

    const message = formatWhatsAppMessage(templateString, templateData);
    sendWhatsAppDirect(item.parentPhone, message);
  };

  // Open Payment Modal
  const handleOpenPaymentModal = (item: StudentBillingItem) => {
    setPaymentModalStudent(item);
    setPayAmountType('full');
    setCustomPayAmount(String(item.remainingAmount));
    setPaymentMethod('Transfer BCA');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentNotes('');
    setAutoOpenReceipt(true);
  };

  // Submit Payment
  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalStudent) return;

    const studentObj = students.find((s) => s.id === paymentModalStudent.studentId);
    if (!studentObj) return;

    const payAmount = payAmountType === 'full' 
      ? paymentModalStudent.remainingAmount 
      : parseInt(customPayAmount.replace(/[^0-9]/g, '') || '0', 10);

    if (payAmount <= 0) {
      alert('Mohon masukkan nominal pembayaran yang valid.');
      return;
    }

    const newRemaining = Math.max(0, paymentModalStudent.remainingAmount - payAmount);

    onRecordPayment({
      student: studentObj,
      month: paymentModalStudent.month,
      year: paymentModalStudent.year,
      amount: payAmount,
      totalBill: paymentModalStudent.totalBill,
      remainingBill: newRemaining,
      sessionsCount: paymentModalStudent.attendedSessionsCount,
      paymentMethod,
      datePaid: paymentDate,
      notes: paymentNotes || (payAmountType === 'partial' ? `Cicilan SPP (${formatRupiah(payAmount)})` : `Pelunasan SPP ${getMonthNameIndo(paymentModalStudent.month)} ${paymentModalStudent.year}`),
      autoOpenReceipt,
    });

    setPaymentModalStudent(null);
  };

  const [isExportingPng, setIsExportingPng] = useState<boolean>(false);

  const handleExportPng = async () => {
    setIsExportingPng(true);
    try {
      const monthName = getMonthNameIndo(selectedMonth);
      const fileName = `Rekap_Tagihan_Siswa_${monthName}_${selectedYear}`;
      await exportElementToPng('printable-billing-table', fileName);
    } catch (err) {
      console.error('Gagal unduh gambar tagihan siswa:', err);
    } finally {
      setIsExportingPng(false);
    }
  };

  // Export Excel
  const handleExportExcel = () => {
    const monthName = getMonthNameIndo(selectedMonth);
    const dataForExcel = filteredBillingItems.map((item, idx) => ({
      'No': idx + 1,
      'Periode Bulan': `${monthName} ${selectedYear}`,
      'Kode Siswa': item.studentCode || '-',
      'Nama Siswa': item.studentName,
      'Tingkat / Kelas': item.gradeDetail,
      'Tipe Kelas': item.classType,
      'Tarif / Sesi (Rp)': item.pricePerSession,
      'Total Sesi Hadir': item.attendedSessionsCount,
      'Total Tagihan (Rp)': item.totalBill,
      'Sudah Dibayar (Rp)': item.paidAmount,
      'Sisa Piutang / Kurang Bayar (Rp)': item.remainingAmount,
      'Status Tagihan': item.status,
      'Nama Orang Tua': item.parentName || '-',
      'No WA Ortu': item.parentPhone || '-',
    }));

    exportToExcel(
      dataForExcel,
      `Rekap_Tagihan_Siswa_${monthName}_${selectedYear}`,
      'Tagihan Siswa'
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-inner">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-heading">
                Tagihan Siswa (Skema Belajar Dulu Baru Bayar)
              </h2>
              <p className="text-xs text-slate-500">
                Otomatis dihitung dari jumlah kehadiran hadir riil siswa × tarif per sesi periode {getMonthNameIndo(selectedMonth)} {selectedYear}
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Period Pickers */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Month Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
            <Calendar className="w-4 h-4 text-slate-500 ml-1.5" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-slate-800 pr-2 py-1 outline-hidden cursor-pointer"
            >
              {MONTH_NAMES_ID.map((m, idx) => (
                <option key={idx} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-slate-800 pr-2 py-1 outline-hidden cursor-pointer border-l border-slate-200 pl-2"
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
          </div>

          <button
            id="btn-export-billing-excel"
            onClick={handleExportExcel}
            className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            title="Unduh rekap tagihan siswa ke format Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Download Excel (.xlsx)
          </button>

          <button
            id="btn-export-billing-png"
            onClick={handleExportPng}
            disabled={isExportingPng}
            className="px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-50"
            title="Unduh format tabel rekap tagihan siswa sebagai gambar PNG"
          >
            <ImageIcon className="w-4 h-4 text-amber-700" />
            <span>{isExportingPng ? 'Menyimpan...' : 'Unduh Gambar (PNG)'}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Tagihan Periode Ini */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Tagihan ({getMonthNameIndo(selectedMonth)})
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-indigo-900 font-mono">
              {formatRupiah(summary.grandTotalBill)}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Dari {summary.totalActiveStudents} siswa terdaftar
            </p>
          </div>
        </div>

        {/* Card 2: Sudah Diterima / Dibayar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Sudah Diterima (Kas Masuk)
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-emerald-700 font-mono">
              {formatRupiah(summary.grandTotalPaid)}
            </h3>
            <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <span>{summary.countLunas} Siswa Lunas</span>
              {summary.countSebagian > 0 && <span>• {summary.countSebagian} Cicilan</span>}
            </p>
          </div>
        </div>

        {/* Card 3: Piutang / Belum Bayar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Sisa Piutang (Belum Bayar)
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-amber-600 font-mono">
              {formatRupiah(summary.grandTotalRemaining)}
            </h3>
            <p className="text-[11px] text-amber-700 font-medium mt-1">
              {summary.countBelumBayar} Siswa belum melakukan pembayaran
            </p>
          </div>
        </div>

        {/* Card 4: Status Progress Tagihan */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
              Rasio Pelunasan Periode Ini
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/10 text-emerald-300 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline justify-between">
              <h3 className="text-2xl font-black text-white font-mono">
                {summary.grandTotalBill > 0
                  ? `${Math.round((summary.grandTotalPaid / summary.grandTotalBill) * 100)}%`
                  : '100%'}
              </h3>
              <span className="text-xs text-indigo-200">
                {summary.countLunas} / {summary.totalActiveStudents - summary.countNoBill} Selesai
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full h-2 bg-white/20 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                style={{
                  width: `${
                    summary.grandTotalBill > 0
                      ? Math.min(100, Math.round((summary.grandTotalPaid / summary.grandTotalBill) * 100))
                      : 100
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama siswa, kode, orang tua, no HP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-hidden transition"
            />
          </div>

          {/* Filter Status */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:ring-2 focus:ring-emerald-500 outline-hidden transition"
            >
              <option value="All">Semua Status</option>
              <option value="Belum Bayar">🔴 Belum Bayar</option>
              <option value="Sebagian">🟡 Sebagian / Cicilan</option>
              <option value="Lunas">🟢 Lunas</option>
              <option value="Tanpa Tagihan">⚪ Tanpa Tagihan (0 Sesi)</option>
            </select>
          </div>

          {/* Filter Jenjang */}
          <div>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:ring-2 focus:ring-emerald-500 outline-hidden transition"
            >
              <option value="All">Semua Jenjang</option>
              <option value="PAUD">PAUD / Calistung</option>
              <option value="SD">SD</option>
              <option value="SMP">SMP</option>
              <option value="SMA">SMA</option>
            </select>
          </div>

          {/* Filter Tipe Kelas */}
          <div>
            <select
              value={filterClassType}
              onChange={(e) => setFilterClassType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:ring-2 focus:ring-emerald-500 outline-hidden transition"
            >
              <option value="All">Semua Tipe Kelas</option>
              <option value="Grup">Grup</option>
              <option value="Privat">Privat</option>
            </select>
          </div>
        </div>

        {/* Fast Filter Status Pills */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setFilterStatus('All')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                filterStatus === 'All'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua ({relevantBillingItems.length})
            </button>
            <button
              onClick={() => setFilterStatus('Belum Bayar')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                filterStatus === 'Belum Bayar'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Belum Bayar ({summary.countBelumBayar})
            </button>
            <button
              onClick={() => setFilterStatus('Sebagian')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                filterStatus === 'Sebagian'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              Cicilan / Sebagian ({summary.countSebagian})
            </button>
            <button
              onClick={() => setFilterStatus('Lunas')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                filterStatus === 'Lunas'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Lunas ({summary.countLunas})
            </button>
          </div>

          <div className="text-slate-500 text-[11px]">
            Menampilkan <span className="font-bold text-slate-800">{filteredBillingItems.length}</span> siswa
          </div>
        </div>
      </div>

      {/* Main Billing Table */}
      <div id="printable-billing-table" className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4 text-center w-12">No</th>
                <th className="py-3.5 px-4">Nama Siswa & Kelas</th>
                <th className="py-3.5 px-4 text-center">Kehadiran (Presensi)</th>
                <th className="py-3.5 px-4 text-right">Tarif / Sesi</th>
                <th className="py-3.5 px-4 text-right">Total Tagihan</th>
                <th className="py-3.5 px-4 text-right">Sudah Dibayar</th>
                <th className="py-3.5 px-4 text-right">Sisa Kurang Bayar</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center w-48">Aksi Pembayaran & WA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredBillingItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Receipt className="w-8 h-8 text-slate-300" />
                      <p className="font-medium">Tidak ada data tagihan siswa yang sesuai dengan filter.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBillingItems.map((item, index) => {
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 transition group"
                    >
                      {/* 1. No */}
                      <td className="py-3.5 px-4 text-center text-slate-400 font-mono text-[11px]">
                        {index + 1}
                      </td>

                      {/* 2. Nama Siswa & Kelas */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{item.studentName}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-normal">
                            {item.studentCode}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                          <span className="font-medium text-slate-700">{item.gradeDetail}</span>
                          <span className="text-slate-300">•</span>
                          <span>{item.classType}</span>
                          {item.parentPhone && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="text-slate-500 font-mono text-[10px]">{item.parentPhone}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* 3. Kehadiran Presensi */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => {
                            const matchingAttendances = attendance.filter((a) => {
                              if (!a.date) return false;
                              const [yStr, mStr] = a.date.split('-');
                              const y = parseInt(yStr, 10);
                              const m = parseInt(mStr, 10);
                              return (
                                y === selectedYear &&
                                m === selectedMonth &&
                                ((a.studentId && a.studentId === item.studentId) ||
                                  (a.studentCode && a.studentCode === item.studentCode)) &&
                                a.status === 'Hadir'
                              );
                            });
                            setDetailModalStudent({ item, sessions: matchingAttendances });
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold text-xs transition cursor-pointer border border-indigo-200"
                          title="Klik untuk melihat tanggal & materi ajar siswa"
                        >
                          <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{item.attendedSessionsCount} Sesi Hadir</span>
                          <Eye className="w-3 h-3 opacity-60 ml-0.5" />
                        </button>
                      </td>

                      {/* 4. Tarif / Sesi */}
                      <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                        {formatRupiah(item.pricePerSession)}
                      </td>

                      {/* 5. Total Tagihan */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                        {formatRupiah(item.totalBill)}
                      </td>

                      {/* 6. Sudah Dibayar */}
                      <td className="py-3.5 px-4 text-right font-mono text-emerald-700 font-semibold">
                        {item.paidAmount > 0 ? formatRupiah(item.paidAmount) : <span className="text-slate-300">Rp 0</span>}
                      </td>

                      {/* 7. Sisa Kurang Bayar */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold">
                        {item.remainingAmount > 0 ? (
                          <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            {formatRupiah(item.remainingAmount)}
                          </span>
                        ) : (
                          <span className="text-emerald-700">Rp 0</span>
                        )}
                      </td>

                      {/* 8. Status */}
                      <td className="py-3.5 px-4 text-center">
                        {item.status === 'Lunas' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3" />
                            Lunas
                          </span>
                        )}
                        {item.status === 'Sebagian' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-800 text-[11px] font-bold rounded-full border border-blue-300">
                            <AlertCircle className="w-3 h-3" />
                            Sebagian
                          </span>
                        )}
                        {item.status === 'Belum Bayar' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-800 text-[11px] font-bold rounded-full border border-amber-300">
                            <Clock className="w-3 h-3" />
                            Belum Bayar
                          </span>
                        )}
                        {item.status === 'Tanpa Tagihan' && (
                          <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-semibold rounded">
                            0 Sesi Hadir
                          </span>
                        )}
                      </td>

                      {/* 9. Aksi Pembayaran & WhatsApp */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* WhatsApp Notification Button (Owner/Tutor only) */}
                          {!isSiswaRole && (
                            <button
                              onClick={() => handleSendWhatsApp(item)}
                              title="Kirim Rincian Tagihan & Rekening ke WhatsApp Ortu"
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Kirim WA</span>
                            </button>
                          )}

                          {/* Record Payment Button (for owner) */}
                          {canEdit && item.totalBill > 0 && item.remainingAmount > 0 && (
                            <button
                              onClick={() => handleOpenPaymentModal(item)}
                              title="Terima Pembayaran / Lunasi Tagihan Ini"
                              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition shadow-xs cursor-pointer"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Bayar</span>
                            </button>
                          )}

                          {/* Print Receipt Button if paid */}
                          {item.incomesList.length > 0 && (
                            <button
                              onClick={() => onViewReceipt(item.incomesList[item.incomesList.length - 1])}
                              title="Lihat / Cetak Kwitansi Resmi"
                              className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: FORM PEMBAYARAN TAGIHAN CEPAT (FAST PAYMENT MODAL) */}
      {paymentModalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Terima Pembayaran Les</h3>
                  <p className="text-xs text-slate-400">
                    {paymentModalStudent.studentName} ({paymentModalStudent.gradeDetail})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPaymentModalStudent(null)}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Billing Summary Box inside Modal */}
            <form onSubmit={handleSubmitPayment} className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Periode Pembelajaran:</span>
                  <span className="font-bold text-slate-900">
                    {getMonthNameIndo(paymentModalStudent.month)} {paymentModalStudent.year}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Kehadiran Siswa:</span>
                  <span className="font-bold text-indigo-700">
                    {paymentModalStudent.attendedSessionsCount} Sesi Hadir × {formatRupiah(paymentModalStudent.pricePerSession)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Total Tagihan Asli:</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {formatRupiah(paymentModalStudent.totalBill)}
                  </span>
                </div>
                {paymentModalStudent.paidAmount > 0 && (
                  <div className="flex justify-between items-center text-emerald-700">
                    <span>Sudah Dibayar Sebelumnya:</span>
                    <span className="font-bold font-mono">
                      -{formatRupiah(paymentModalStudent.paidAmount)}
                    </span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-amber-800">
                  <span className="font-bold">Sisa Piutang Saat Ini:</span>
                  <span className="font-black text-base font-mono">
                    {formatRupiah(paymentModalStudent.remainingAmount)}
                  </span>
                </div>
              </div>

              {/* Payment Type Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Pilihan Pembayaran:
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setPayAmountType('full');
                      setCustomPayAmount(String(paymentModalStudent.remainingAmount));
                    }}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      payAmountType === 'full'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>Bayar Lunas Penuh</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-sm font-black font-mono mt-1 text-emerald-700">
                      {formatRupiah(paymentModalStudent.remainingAmount)}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPayAmountType('partial');
                      setCustomPayAmount('');
                    }}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      payAmountType === 'partial'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>Bayar Sebagian / Cicil</span>
                      <AlertCircle className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Ketik nominal yang dibayar
                    </div>
                  </button>
                </div>
              </div>

              {/* Custom Partial Amount Input */}
              {payAmountType === 'partial' && (
                <div className="space-y-1 bg-blue-50/60 p-3.5 rounded-2xl border border-blue-200 animate-in fade-in">
                  <label className="block font-bold text-blue-950">
                    Nominal yang Dibayarkan Sekarang (Rp):
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">Rp</span>
                    <input
                      type="number"
                      required
                      min={1000}
                      max={paymentModalStudent.remainingAmount}
                      value={customPayAmount}
                      onChange={(e) => setCustomPayAmount(e.target.value)}
                      placeholder="Contoh: 50000"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-blue-300 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-hidden font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-blue-700 mt-1">
                    Sisa yang belum terbayar akan otomatis tercatat sebagai sisa tagihan.
                  </p>
                </div>
              )}

              {/* Date & Payment Method */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tanggal Bayar:
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Metode Pembayaran:
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
                  >
                    <option value="Transfer BCA">Transfer BCA</option>
                    <option value="Tunai">Tunai / Cash</option>
                    <option value="Transfer Mandiri">Transfer Mandiri</option>
                    <option value="Transfer BRI">Transfer BRI</option>
                    <option value="QRIS">QRIS</option>
                    <option value="GoPay / OVO / Dana">GoPay / OVO / Dana</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan Tambahan (Opsional):
                </label>
                <input
                  type="text"
                  placeholder="Misal: Dititipkan siswa / Transfer via rekening Ayah"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              {/* Auto Open Receipt Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="autoReceipt"
                  checked={autoOpenReceipt}
                  onChange={(e) => setAutoOpenReceipt(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="autoReceipt" className="text-slate-700 text-xs font-medium cursor-pointer">
                  Langsung tampilkan & siap cetak Kwitansi Resmi setelah simpan
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPaymentModalStudent(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Simpan & Masukkan ke Buku Kas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RINCIAN SESI KEHADIRAN SISWA */}
      {detailModalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in zoom-in-95 duration-200">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Rincian Presensi Pembelajaran</h3>
                  <p className="text-xs text-slate-400">
                    {detailModalStudent.item.studentName} • Periode {getMonthNameIndo(detailModalStudent.item.month)} {detailModalStudent.item.year}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDetailModalStudent(null)}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase text-indigo-600 tracking-wider">
                    Total Kehadiran Hadir:
                  </span>
                  <p className="text-xl font-black text-indigo-950 mt-0.5">
                    {detailModalStudent.sessions.length} Sesi
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold uppercase text-indigo-600 tracking-wider">
                    Total Nilai Tagihan:
                  </span>
                  <p className="text-xl font-black text-emerald-700 font-mono mt-0.5">
                    {formatRupiah(detailModalStudent.item.totalBill)}
                  </p>
                </div>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {detailModalStudent.sessions.length === 0 ? (
                  <p className="text-center py-6 text-slate-400 italic">
                    Belum ada presensi hadir pada periode ini.
                  </p>
                ) : (
                  detailModalStudent.sessions.map((rec, idx) => (
                    <div
                      key={rec.id}
                      className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 transition flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[11px] font-mono shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            <span>{formatDateIndo(rec.date)}</span>
                            {rec.time && <span className="text-[10px] text-slate-500 font-mono">({rec.time})</span>}
                          </div>
                          <p className="text-slate-700 font-medium mt-0.5">
                            📚 {rec.topic || 'Materi Belajar'}
                          </p>
                          {rec.tutorNotes && (
                            <p className="text-slate-500 italic text-[11px] mt-0.5">
                              💬 Catatan Tutor: {rec.tutorNotes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">
                          Hadir
                        </span>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Tutor: {rec.tutorName || 'Tutor Bimbel'}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex items-center justify-end pt-3 border-t border-slate-100">
                <button
                  onClick={() => setDetailModalStudent(null)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
