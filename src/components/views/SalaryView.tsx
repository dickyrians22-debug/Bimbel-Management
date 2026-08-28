import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Wallet,
  Calculator,
  Calendar,
  DollarSign,
  TrendingDown,
  CheckCircle2,
  Clock,
  Printer,
  Eye,
  CreditCard,
  User,
  Search,
  Filter,
  FileText,
  Sparkles,
  Info,
  Check,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  AlertCircle,
  PlusCircle,
  HelpCircle,
  Award,
  BookOpen,
  Download,
  Image as ImageIcon,
  FileSpreadsheet,
  X,
} from 'lucide-react';
import {
  TutorSalaryRecord,
  TutorSessionDetail,
  Student,
  AttendanceRecord,
  ExpenseRecord,
  UserSession,
  UserAccount,
  BimbelSettings,
  ClassType,
} from '../../types';
import {
  formatRupiah,
  formatDateIndo,
  getMonthNameIndo,
  MONTH_NAMES_ID,
  getTodayDateString,
  getSystemSalaryCategory,
  isSystemExpenseCategory,
  generateExpenseRefNumber,
  resolveTutorName,
} from '../../utils/storage';
import { UserAvatar } from '../common/UserAvatar';
import { exportToExcel, exportElementToPng } from '../../utils/exportUtils';

interface SalaryViewProps {
  currentUser: UserSession;
  tutors: UserAccount[];
  users?: UserAccount[];
  students: Student[];
  attendances: AttendanceRecord[];
  expenses: ExpenseRecord[];
  settings: BimbelSettings;
  onAddExpense: (expense: Omit<ExpenseRecord, 'id' | 'createdAt'>) => void;
  onNavigateToSettings?: () => void;
}

export const SalaryView: React.FC<SalaryViewProps> = ({
  currentUser,
  tutors,
  users = [],
  students,
  attendances,
  expenses,
  settings,
  onAddExpense,
  onNavigateToSettings,
}) => {
  const isOwner = currentUser.role === 'owner';
  const isTutor = currentUser.role === 'tutor';

  // Date selection state (default to current month & year)
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [activeSessionModalTutor, setActiveSessionModalTutor] = useState<TutorSalaryRecord | null>(null);
  const [activeSlipModalTutor, setActiveSlipModalTutor] = useState<TutorSalaryRecord | null>(null);
  const [payModalTutor, setPayModalTutor] = useState<TutorSalaryRecord | null>(null);
  const [isExportingSlipPng, setIsExportingSlipPng] = useState<boolean>(false);
  const slipPrintRef = useRef<HTMLDivElement>(null);

  // Payment form state
  const [paymentType, setPaymentType] = useState<'full' | 'partial'>('full');
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payPaymentMethod, setPayPaymentMethod] = useState<string>(
    settings.paymentMethods?.[0] || 'Transfer BCA'
  );
  const [payNotes, setPayNotes] = useState<string>('');
  const [customBonus, setCustomBonus] = useState<number>(0);
  const [customDeduction, setCustomDeduction] = useState<number>(0);

  // Success toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Keyboard shortcut: ESC to close any open modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveSessionModalTutor(null);
        setActiveSlipModalTutor(null);
        setPayModalTutor(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Export Excel Summary Handler
  const handleExportSalarySummaryExcel = () => {
    const monthName = getMonthNameIndo(selectedMonth);
    const dataForExcel = filteredTutorRecords.map((r, idx) => ({
      'No': idx + 1,
      'Periode Bulan': `${monthName} ${selectedYear}`,
      'Nama Tutor': r.tutorName,
      'Sesi Privat': r.privatSessionsCount,
      'Sesi Grup': r.groupSessionsCount,
      'Total Sesi': r.totalSessionsCount,
      'Hari Mengajar': r.uniqueTeachingDays,
      'Honor Privat (Rp)': r.privatGrossHonor,
      'Honor Grup (Rp)': r.groupGrossHonor,
      'Uang Transport (Rp)': r.transportAllowance,
      'Bonus Kinerja (Rp)': r.bonus,
      'Total Hak Honor (Rp)': r.netTotalSalary,
      'Sudah Dibayar (Rp)': r.paidAmount || 0,
      'Sisa Belum Bayar (Rp)': r.remainingAmount !== undefined ? r.remainingAmount : (r.status === 'Lunas' ? 0 : r.netTotalSalary),
      'Status Pembayaran': r.status,
      'Metode Pencairan Terakhir': r.paymentMethod || '-',
    }));

    exportToExcel(
      dataForExcel,
      `Rekap_Honor_Gaji_Tutor_${monthName}_${selectedYear}`,
      'Rekap Gaji Tutor'
    );
  };

  // Export Session Details to Excel
  const handleExportTutorSessionsExcel = (record: TutorSalaryRecord) => {
    const monthName = getMonthNameIndo(selectedMonth);
    const dataForExcel = (record.sessionDetails || []).map((s, idx) => ({
      'No': idx + 1,
      'Tanggal': s.date,
      'Jam': `${s.time} WIB`,
      'Nama Tutor': record.tutorName,
      'Nama Siswa': s.studentName,
      'Kode Siswa': s.studentCode,
      'Kelas / Tingkat': s.gradeDetail,
      'Tipe Kelas': s.classType,
      'Materi / Topik': s.topic,
      'Tarif SPP Siswa (Rp)': s.studentPricePerSession,
      'Skema Honor': s.calculationType === 'percentage' ? `${s.percentageApplied}% SPP` : 'Tarif Flat',
      'Honor Diterima (Rp)': s.calculatedHonor,
      'Catatan': s.tutorNotes || '-',
    }));

    exportToExcel(
      dataForExcel,
      `Rincian_Sesi_Mengajar_${record.tutorName.replace(/\s+/g, '_')}_${monthName}_${selectedYear}`,
      'Rincian Sesi'
    );
  };

  // Export Slip to PNG Image
  const handleExportSlipPng = async () => {
    if (!slipPrintRef.current || !activeSlipModalTutor) return;
    setIsExportingSlipPng(true);
    try {
      const monthName = getMonthNameIndo(selectedMonth);
      const filename = `Slip_Honor_${activeSlipModalTutor.tutorName.replace(/\s+/g, '_')}_${monthName}_${selectedYear}`;
      const success = await exportElementToPng(slipPrintRef.current, filename);
      if (success) {
        showToast('✅ Slip honorarium berhasil diunduh dalam format gambar (PNG)!');
      } else {
        alert('Gagal mengunduh gambar slip. Silakan gunakan tombol Cetak / Simpan PDF.');
      }
    } finally {
      setIsExportingSlipPng(false);
    }
  };

  const handleOpenPayModal = (record: TutorSalaryRecord) => {
    setPayModalTutor(record);
    const rem = record.remainingAmount !== undefined ? record.remainingAmount : record.netTotalSalary;
    const initialPay = rem > 0 ? rem : record.netTotalSalary;
    setPayAmount(initialPay);
    setPaymentType('full');
    setCustomBonus(0);
    setCustomDeduction(0);
    setPayNotes(rem < record.netTotalSalary ? `Pelunasan Sisa Honor` : `Pembayaran Honor`);
  };

  // Salary Formula & Percentages from settings
  const calcMode = settings.salaryCalculationMode || 'percentage';
  const privatPct = settings.privatSalaryPercentage ?? 60;
  const groupPct = settings.groupSalaryPercentage ?? 40;
  const minPrivatRate = settings.minPrivatSessionRate ?? 50000;
  const minGroupRate = settings.minGroupSessionRate ?? 60000;
  const flatPrivatRate = settings.flatPrivatSessionRate ?? 65000;
  const flatGroupRate = settings.flatGroupSessionRate ?? 80000;
  const transportPerDay = settings.transportAllowancePerDay ?? 15000;
  const evalBonusPerSession = settings.evaluationBonusPerSession ?? 0;

  // Filter attendances for selected month & year
  const monthStr = String(selectedMonth).padStart(2, '0');
  const yearMonthPrefix = `${selectedYear}-${monthStr}`;

  const monthlyAttendances = useMemo(() => {
    return attendances.filter((att) => {
      if (att.status !== 'Hadir') return false;
      return (att.date || '').startsWith(yearMonthPrefix);
    });
  }, [attendances, yearMonthPrefix]);

  // Combine all accounts for robust resolution (Tutors, Owners who teach, and custom accounts)
  const allAccounts = useMemo(() => {
    return users && users.length > 0 ? users : tutors;
  }, [users, tutors]);

  // Extract unique tutors list strictly from registered user accounts + attendance presence
  const activeTutorsList = useMemo(() => {
    const list: { id: string; name: string; username: string; specialty?: string; avatar?: string }[] = [];
    const seen = new Set<string>();

    // STRICT FILTER: Hanya akun pengguna yang memiliki role === 'tutor' dan aktif
    const tutorAccounts = (users && users.length > 0 ? users : tutors).filter(
      (t) => t.role === 'tutor' && t.isActive !== false
    );

    tutorAccounts.forEach((t) => {
      const key = t.name.trim().toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        list.push({
          id: t.id,
          name: t.name.trim(),
          username: t.username,
          specialty: t.specialty || 'Tutor Pengajar',
          avatar: t.avatar,
        });
      }
    });

    if (list.length === 0 && currentUser?.role === 'tutor') {
      list.push({
        id: currentUser.id || 'usr-tutor-1',
        name: currentUser.name,
        username: currentUser.username,
        specialty: currentUser.specialty || 'Tutor Pengajar',
        avatar: currentUser.avatar,
      });
    }

    // If logged in as Tutor, only keep current tutor
    if (isTutor) {
      return list.filter((t) => {
        const currName = currentUser.name.trim().toLowerCase();
        const currUser = currentUser.username.trim().toLowerCase();
        const tName = t.name.trim().toLowerCase();
        const tUser = t.username.trim().toLowerCase();
        return (
          tName === currName ||
          tUser === currUser ||
          tName.includes(currName) ||
          currName.includes(tName) ||
          resolveTutorName(t.name, allAccounts).toLowerCase() === currName
        );
      });
    }

    return list;
  }, [allAccounts, attendances, isTutor, currentUser]);

  // Compute detailed salary for each tutor
  const tutorSalaryRecords: TutorSalaryRecord[] = useMemo(() => {
    return activeTutorsList.map((tutor) => {
      // Find all attended sessions by this tutor in this month using intelligent name resolution
      const tutorSessions = monthlyAttendances.filter((att) => {
        const rawTutor = (att.tutorName || '').trim();
        if (!rawTutor) return false;
        const resolved = resolveTutorName(rawTutor, allAccounts);
        const tutorNameLower = tutor.name.trim().toLowerCase();
        const rawLower = rawTutor.toLowerCase();
        const resolvedLower = resolved.toLowerCase();

        if (resolvedLower === tutorNameLower) return true;
        if (rawLower === tutorNameLower) return true;
        if (tutor.username && rawLower === tutor.username.toLowerCase()) return true;
        if (tutorNameLower.startsWith(rawLower) || rawLower.startsWith(tutorNameLower)) return true;
        if (tutorNameLower.includes(rawLower) || rawLower.includes(tutorNameLower)) return true;
        return false;
      });

      const sessionDetails: TutorSessionDetail[] = [];
      const uniqueDaysSet = new Set<string>();
      let privatCount = 0;
      let groupCount = 0;
      let privatGross = 0;
      let groupGross = 0;
      let totalEvalBonus = 0;

      tutorSessions.forEach((session) => {
        if (session.date) uniqueDaysSet.add(session.date);

        // Find student to get pricePerSession and classType
        const student = students.find(
          (s) =>
            s.id === session.studentId ||
            s.code.toLowerCase() === session.studentCode.toLowerCase() ||
            s.name.toLowerCase() === session.studentName.toLowerCase()
        );

        const classType: ClassType = session.classType || student?.classType || 'Privat';
        const studentPrice = student?.pricePerSession || (classType === 'Privat' ? 100000 : 50000);

        let calculatedHonor = 0;
        let percentageApplied = 0;

        if (calcMode === 'percentage') {
          if (classType === 'Privat') {
            percentageApplied = privatPct;
            const pctHonor = Math.round((studentPrice * privatPct) / 100);
            calculatedHonor = Math.max(pctHonor, minPrivatRate);
            privatGross += calculatedHonor;
            privatCount++;
          } else {
            percentageApplied = groupPct;
            const pctHonor = Math.round((studentPrice * groupPct) / 100);
            calculatedHonor = Math.max(pctHonor, minGroupRate);
            groupGross += calculatedHonor;
            groupCount++;
          }
        } else {
          // Flat rate calculation
          if (classType === 'Privat') {
            calculatedHonor = flatPrivatRate;
            privatGross += calculatedHonor;
            privatCount++;
          } else {
            calculatedHonor = flatGroupRate;
            groupGross += calculatedHonor;
            groupCount++;
          }
        }

        // Check if evaluation bonus applies (has filled topic)
        if (evalBonusPerSession > 0 && session.topic && session.topic.trim().length > 3) {
          totalEvalBonus += evalBonusPerSession;
        }

        sessionDetails.push({
          attendanceId: session.id,
          date: session.date,
          time: session.time,
          studentId: session.studentId,
          studentName: session.studentName,
          studentCode: session.studentCode,
          gradeDetail: student?.gradeDetail || 'Siswa Bimbel',
          classType,
          studentPricePerSession: studentPrice,
          calculationType: calcMode === 'percentage' ? 'percentage' : 'flat',
          percentageApplied,
          calculatedHonor,
          topic: session.topic || 'Materi Sesi Belajar',
          tutorNotes: session.tutorNotes,
        });
      });

      const uniqueDays = uniqueDaysSet.size;
      const transportAllowance = uniqueDays * transportPerDay;
      const baseGrossHonor = privatGross + groupGross;
      const bonus = totalEvalBonus;
      const deductions = 0;
      const netTotalSalary = baseGrossHonor + transportAllowance + bonus - deductions;

      // Find all matching expense records created for this tutor salary in this month/period
      const matchingExpenses = expenses.filter((exp) => {
        const isSalaryCategory = isSystemExpenseCategory(exp.category, settings);
        if (!isSalaryCategory) return false;

        const textToSearch = `${exp.paidTo || ''} ${exp.recipient || ''} ${exp.title || ''} ${exp.description || ''} ${exp.notes || ''}`.toLowerCase();
        const matchesTutor =
          (exp.tutorId && exp.tutorId === tutor.id) ||
          (exp.tutorName && exp.tutorName.toLowerCase() === tutor.name.toLowerCase()) ||
          textToSearch.includes(tutor.name.toLowerCase()) ||
          (tutor.username && textToSearch.includes(tutor.username.toLowerCase()));
        if (!matchesTutor) return false;

        const monthName = getMonthNameIndo(selectedMonth).toLowerCase();
        const monthNumPadded = String(selectedMonth).padStart(2, '0');
        const yearStr = String(selectedYear);

        // 1. Explicit period month & year recorded in expense
        if (exp.periodMonth && exp.periodYear) {
          return exp.periodMonth === selectedMonth && exp.periodYear === selectedYear;
        }

        // 2. Text or date matching
        const matchesPeriod =
          textToSearch.includes(monthName) ||
          (exp.date && exp.date.startsWith(`${yearStr}-${monthNumPadded}`)) ||
          (textToSearch.includes(yearStr) && (textToSearch.includes(monthName) || textToSearch.includes(`bulan ${selectedMonth}`)));

        return matchesPeriod;
      });

      const paidAmount = matchingExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
      const remainingAmount = Math.max(0, netTotalSalary - paidAmount);

      let status: 'Draft' | 'Menunggu Pembayaran' | 'Dibayar Sebagian' | 'Lunas' = 'Draft';
      if (tutorSessions.length > 0 || paidAmount > 0) {
        if (paidAmount >= netTotalSalary && netTotalSalary > 0) {
          status = 'Lunas';
        } else if (paidAmount > 0) {
          status = 'Dibayar Sebagian';
        } else {
          status = 'Menunggu Pembayaran';
        }
      }

      const latestExpense = matchingExpenses[matchingExpenses.length - 1];

      return {
        id: `sal-${tutor.id}-${selectedYear}-${selectedMonth}`,
        month: selectedMonth,
        year: selectedYear,
        tutorId: tutor.id,
        tutorName: tutor.name,
        privatSessionsCount: privatCount,
        groupSessionsCount: groupCount,
        totalSessionsCount: tutorSessions.length,
        uniqueTeachingDays: uniqueDays,
        privatGrossHonor: privatGross,
        groupGrossHonor: groupGross,
        baseGrossHonor,
        transportAllowance,
        bonus,
        deductions,
        netTotalSalary,
        paidAmount,
        remainingAmount,
        status,
        paidAt: latestExpense?.date,
        paidBy: latestExpense?.approvedBy || settings.ownerName,
        paymentMethod: latestExpense?.paymentMethod,
        expenseId: latestExpense?.id,
        paymentHistory: matchingExpenses,
        sessionDetails,
      };
    });
  }, [
    activeTutorsList,
    monthlyAttendances,
    students,
    calcMode,
    privatPct,
    groupPct,
    minPrivatRate,
    minGroupRate,
    flatPrivatRate,
    flatGroupRate,
    transportPerDay,
    evalBonusPerSession,
    expenses,
    selectedMonth,
    selectedYear,
    settings.ownerName,
  ]);

  // Filtered by search
  const filteredTutorRecords = useMemo(() => {
    if (!searchQuery) return tutorSalaryRecords;
    const q = searchQuery.toLowerCase();
    return tutorSalaryRecords.filter(
      (r) =>
        r.tutorName.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q)
    );
  }, [tutorSalaryRecords, searchQuery]);

  // Aggregate KPI metrics
  const totalTutorsActive = tutorSalaryRecords.filter((r) => r.totalSessionsCount > 0).length;
  const totalPrivatSessions = tutorSalaryRecords.reduce((acc, r) => acc + r.privatSessionsCount, 0);
  const totalGroupSessions = tutorSalaryRecords.reduce((acc, r) => acc + r.groupSessionsCount, 0);
  const totalPayrollBudget = tutorSalaryRecords.reduce((acc, r) => acc + r.netTotalSalary, 0);
  const totalPaid = tutorSalaryRecords.reduce((acc, r) => acc + (r.paidAmount || 0), 0);
  const totalPending = tutorSalaryRecords.reduce(
    (acc, r) => acc + (r.remainingAmount !== undefined ? r.remainingAmount : (r.status === 'Lunas' ? 0 : r.netTotalSalary)),
    0
  );

  // Handle Pay and Record to Expenses
  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payModalTutor) return;

    const baseRemaining = payModalTutor.remainingAmount !== undefined ? payModalTutor.remainingAmount : payModalTutor.netTotalSalary;
    const currentAdjustedNet = payModalTutor.netTotalSalary + (customBonus || 0) - (customDeduction || 0);
    const adjustedRemaining = Math.max(0, currentAdjustedNet - (payModalTutor.paidAmount || 0));

    const finalAmountToPay = paymentType === 'full' ? adjustedRemaining : Math.min(payAmount, adjustedRemaining > 0 ? adjustedRemaining : payAmount);

    if (finalAmountToPay <= 0) {
      alert('Nominal pembayaran harus lebih dari Rp 0.');
      return;
    }

    const previousPaymentsCount = payModalTutor.paymentHistory?.length || 0;
    const isFullSettlement = (payModalTutor.paidAmount || 0) + finalAmountToPay >= currentAdjustedNet;
    const installmentNumber = previousPaymentsCount + 1;

    const installmentTag = isFullSettlement
      ? previousPaymentsCount > 0
        ? `Pelunasan (Tahap ${installmentNumber})`
        : 'Lunas Penuh'
      : `Cicilan Tahap ${installmentNumber}`;

    const activeSalaryCategory = getSystemSalaryCategory(settings);
    const generatedRef = generateExpenseRefNumber(expenses, getTodayDateString());

    const newExpense: Omit<ExpenseRecord, 'id' | 'createdAt'> = {
      date: getTodayDateString(),
      category: activeSalaryCategory as any,
      receiptRef: generatedRef,
      title: `Honor Mengajar ${payModalTutor.tutorName} - ${getMonthNameIndo(selectedMonth)} ${selectedYear} [${installmentTag}]`,
      description: `Pembayaran Honor & Gaji Tutor: ${payModalTutor.tutorName} (${installmentTag}). Dibayarkan: ${formatRupiah(finalAmountToPay)} dari Total Hak: ${formatRupiah(currentAdjustedNet)}. Periode ${getMonthNameIndo(selectedMonth)} ${selectedYear}. Catatan: ${payNotes || installmentTag}`,
      amount: finalAmountToPay,
      paidTo: payModalTutor.tutorName,
      recipient: payModalTutor.tutorName,
      periodMonth: selectedMonth,
      periodYear: selectedYear,
      tutorId: payModalTutor.tutorId,
      tutorName: payModalTutor.tutorName,
      paymentMethod: payPaymentMethod,
      approvedBy: settings.ownerName || 'Pimpinan Bimbel',
      notes: payNotes,
    };

    onAddExpense(newExpense);
    setPayModalTutor(null);
    setPayNotes('');
    setCustomBonus(0);
    setCustomDeduction(0);
    showToast(
      `✅ Pembayaran honor [${installmentTag}] sebesar ${formatRupiah(finalAmountToPay)} untuk ${payModalTutor.tutorName} berhasil dicatat ke Buku Kas Pengeluaran!`
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-indigo-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-amber-400/20 text-amber-300 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider border border-amber-400/30 flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5" />
              {isOwner ? 'Manajemen Penggajian & Honor Pengajar' : 'Portal Honor & Slip Gaji Pengajar'}
            </span>
            <span className="bg-indigo-400/20 text-indigo-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-indigo-400/30">
              {calcMode === 'percentage'
                ? `Bagi Hasil SPP (Privat: ${privatPct}% | Grup: ${groupPct}%)`
                : 'Tarif Flat per Sesi'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-heading tracking-tight">
            {isOwner ? 'Rekapitulasi Honor & Gaji Tutor' : `Honorarium & Slip Mengajar: ${currentUser.name}`}
          </h2>
          <p className="text-xs sm:text-sm text-indigo-200 mt-1 max-w-2xl">
            {isOwner
              ? 'Perhitungan otomatis berdasarkan log presensi harian siswa (Privat vs Grup), uang transport kehadiran, serta integrasi langsung ke Buku Kas Pengeluaran.'
              : 'Pantau akumulasi sesi mengajar kelas privat & grup, rincian siswa yang diajar, dan unduh slip gaji bulanan Anda.'}
          </p>
        </div>

        {/* Month & Year Filter Selector */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 bg-white/10 p-2 rounded-2xl backdrop-blur-md border border-white/10">
          <div className="flex items-center gap-1.5 text-xs text-indigo-200 font-bold px-2">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>Periode:</span>
          </div>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="bg-slate-900/90 text-white text-xs font-bold px-3 py-2 rounded-xl border border-indigo-500/40 focus:ring-2 focus:ring-amber-400 cursor-pointer"
          >
            {MONTH_NAMES_ID.map((name, idx) => (
              <option key={name} value={idx + 1} className="bg-slate-900 text-white">
                {name}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-slate-900/90 text-white text-xs font-bold px-3 py-2 rounded-xl border border-indigo-500/40 focus:ring-2 focus:ring-amber-400 cursor-pointer"
          >
            {[2025, 2026, 2027].map((y) => (
              <option key={y} value={y} className="bg-slate-900 text-white">
                {y}
              </option>
            ))}
          </select>

          {isOwner && onNavigateToSettings && (
            <button
              onClick={onNavigateToSettings}
              title="Ubah Rumus & Persentase Gaji di Pengaturan"
              className="p-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1 shadow-md"
            >
              <Calculator className="w-4 h-4" />
              <span className="hidden sm:inline">Atur Rumus</span>
            </button>
          )}

          <button
            id="btn-export-salary-top-excel"
            onClick={handleExportSalarySummaryExcel}
            className="p-2 sm:px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md"
            title="Unduh Rekap Honor & Gaji Semua Pengajar ke format Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden sm:inline">Download Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 text-xs font-bold shadow-lg animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
            <span>Tutor Aktif Bulan Ini</span>
            <User className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-heading">
            {totalTutorsActive} <span className="text-xs font-medium text-slate-400">Pengajar</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Periode {getMonthNameIndo(selectedMonth)} {selectedYear}
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
            <span>Total Sesi Belajar</span>
            <BookOpen className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-heading">
            {totalPrivatSessions + totalGroupSessions}{' '}
            <span className="text-xs font-medium text-slate-400">Sesi</span>
          </p>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
            <span className="text-indigo-600 font-bold">{totalPrivatSessions} Privat</span>
            <span>•</span>
            <span className="text-emerald-600 font-bold">{totalGroupSessions} Grup</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
            <span>Total Anggaran Honor</span>
            <DollarSign className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-amber-700 font-heading">
            {formatRupiah(totalPayrollBudget)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Termasuk transport Rp {transportPerDay.toLocaleString('id-ID')}/hari
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
            <span>Status Pembayaran</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-black text-emerald-700">{formatRupiah(totalPaid)}</span>
            <span className="text-[11px] text-slate-400 font-medium">Lunas</span>
          </div>
          {totalPending > 0 ? (
            <p className="text-[11px] text-amber-600 font-bold mt-1">
              ⏳ Belum dibayar: {formatRupiah(totalPending)}
            </p>
          ) : (
            <p className="text-[11px] text-emerald-600 font-bold mt-1">
              ✓ Semua honor bulan ini telah lunas
            </p>
          )}
        </div>
      </div>

      {/* Info Card: Formula Transparency */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-start gap-2.5">
          <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold text-slate-900">
              Rumus Perhitungan Aktif:{' '}
              {calcMode === 'percentage'
                ? `Bagi Hasil Persentase SPP (Privat: ${privatPct}%, Grup: ${groupPct}%)`
                : `Tarif Tetap (Privat: ${formatRupiah(flatPrivatRate)}, Grup: ${formatRupiah(flatGroupRate)})`}
            </p>
            <p className="text-slate-500 leading-relaxed">
              • Honor Sesi Privat = {calcMode === 'percentage' ? `${privatPct}% × SPP Siswa (min. ${formatRupiah(minPrivatRate)})` : formatRupiah(flatPrivatRate)} | 
              • Honor Sesi Grup = {calcMode === 'percentage' ? `${groupPct}% × SPP Siswa (min. ${formatRupiah(minGroupRate)})` : formatRupiah(flatGroupRate)} | 
              • Transport = {formatRupiah(transportPerDay)}/hari kehadiran.
            </p>
          </div>
        </div>

        {isOwner && onNavigateToSettings && (
          <button
            onClick={onNavigateToSettings}
            className="text-indigo-700 hover:text-indigo-900 font-bold shrink-0 flex items-center gap-1 hover:underline cursor-pointer"
          >
            <span>Ubah Persentase</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Header & Search */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">
              {isOwner ? 'Daftar Rekapitulasi Gaji Tutor' : 'Rincian Honor Mengajar Anda'}
            </h3>
            <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">
              {filteredTutorRecords.length} Data
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama tutor..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>
            <button
              id="btn-export-salary-table-excel"
              onClick={handleExportSalarySummaryExcel}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs whitespace-nowrap"
              title="Unduh rekapitulasi gaji tutor ke format Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Unduh Excel</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Tutor / Pengajar</th>
                <th className="py-3.5 px-3 text-center">Sesi Privat</th>
                <th className="py-3.5 px-3 text-center">Sesi Grup</th>
                <th className="py-3.5 px-3 text-center">Hari Hadir</th>
                <th className="py-3.5 px-3 text-right">Honor Sesi</th>
                <th className="py-3.5 px-3 text-right">Transport</th>
                <th className="py-3.5 px-3 text-right font-extrabold text-slate-900">Total Hak Gaji</th>
                <th className="py-3.5 px-3 text-right font-bold text-emerald-700">Sudah Dibayar</th>
                <th className="py-3.5 px-3 text-right font-bold text-amber-700">Sisa Belum Bayar</th>
                <th className="py-3.5 px-3 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTutorRecords.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-10 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-600">Belum ada data mengajar di periode ini</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Pastikan presensi kehadiran siswa dengan status &quot;Hadir&quot; sudah dicatat oleh tutor di menu Presensi.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTutorRecords.map((record) => {
                  const paid = record.paidAmount || 0;
                  const remaining = record.remainingAmount !== undefined ? record.remainingAmount : (record.status === 'Lunas' ? 0 : record.netTotalSalary);

                  return (
                    <tr key={record.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <UserAvatar
                            avatar={tutors.find((t) => t.id === record.tutorId || t.name === record.tutorName)?.avatar}
                            name={record.tutorName}
                            role="tutor"
                            size="sm"
                            rounded="rounded-xl"
                          />
                          <div>
                            <p className="font-bold text-slate-900">{record.tutorName}</p>
                            <p className="text-[10px] text-slate-400">
                              Total {record.totalSessionsCount} Pertemuan
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md font-bold text-[11px]">
                          {record.privatSessionsCount} Sesi
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {formatRupiah(record.privatGrossHonor)}
                        </p>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span className="inline-block px-2 py-0.5 bg-teal-50 text-teal-700 rounded-md font-bold text-[11px]">
                          {record.groupSessionsCount} Sesi
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {formatRupiah(record.groupGrossHonor)}
                        </p>
                      </td>

                      <td className="py-3.5 px-3 text-center font-medium">
                        <span className="font-bold text-slate-800">{record.uniqueTeachingDays}</span> Hari
                      </td>

                      <td className="py-3.5 px-3 text-right font-bold text-slate-800">
                        {formatRupiah(record.baseGrossHonor)}
                      </td>

                      <td className="py-3.5 px-3 text-right font-medium text-slate-600">
                        {formatRupiah(record.transportAllowance)}
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <span className="text-sm font-black text-indigo-950 block">
                          {formatRupiah(record.netTotalSalary)}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-right font-bold text-emerald-700 font-mono">
                        {formatRupiah(paid)}
                      </td>

                      <td className="py-3.5 px-3 text-right font-bold font-mono">
                        <span className={remaining > 0 ? 'text-amber-700' : 'text-slate-400'}>
                          {formatRupiah(remaining)}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        {record.status === 'Lunas' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            LUNAS
                          </span>
                        ) : record.status === 'Dibayar Sebagian' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                            <Clock className="w-3 h-3 text-amber-700" />
                            SEBAGIAN ({record.paymentHistory?.length || 1}x)
                          </span>
                        ) : record.totalSessionsCount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                            <Clock className="w-3 h-3 text-rose-600" />
                            BELUM BAYAR
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                            DRAFT
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Detail Sesi Button */}
                          <button
                            onClick={() => setActiveSessionModalTutor(record)}
                            title="Lihat Rincian Log Sesi & Siswa"
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded-lg transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Cetak Slip Gaji Button */}
                          <button
                            onClick={() => setActiveSlipModalTutor(record)}
                            title="Cetak Slip Gaji Resmi"
                            className="p-1.5 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg transition cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Pay / Settle Button (Owner Only) */}
                          {isOwner && (
                            record.status === 'Lunas' ? (
                              <button
                                onClick={() => handleOpenPayModal(record)}
                                title="Lihat riwayat pencairan atau tambah penyesuaian"
                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1"
                              >
                                <span>✓ Lunas</span>
                              </button>
                            ) : record.status === 'Dibayar Sebagian' ? (
                              <button
                                onClick={() => handleOpenPayModal(record)}
                                className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-[10px] shadow-xs flex items-center gap-1 transition cursor-pointer"
                              >
                                <CreditCard className="w-3 h-3" />
                                <span>Bayar Sisa</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleOpenPayModal(record)}
                                disabled={record.totalSessionsCount === 0}
                                className={`px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] shadow-sm flex items-center gap-1 transition cursor-pointer ${
                                  record.totalSessionsCount === 0 ? 'opacity-40 cursor-not-allowed' : ''
                                }`}
                              >
                                <CreditCard className="w-3 h-3" />
                                <span>Bayar</span>
                              </button>
                            )
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

      {/* ========================================================================= */}
      {/* MODAL 1: RINCIAN SESI MENGAJAR & KALKULASI DETAIL                          */}
      {/* ========================================================================= */}
      {activeSessionModalTutor && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs p-3 sm:p-6 flex justify-center items-start animate-in fade-in duration-150"
          onClick={() => setActiveSessionModalTutor(null)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 my-2 sm:my-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div>
                <p className="text-xs text-indigo-300 font-bold uppercase tracking-wider">
                  Log Rincian Sesi Mengajar
                </p>
                <h3 className="text-lg font-black font-heading">
                  {activeSessionModalTutor.tutorName}
                </h3>
                <p className="text-xs text-slate-300">
                  Periode {getMonthNameIndo(selectedMonth)} {selectedYear} • {activeSessionModalTutor.totalSessionsCount} Sesi Terlaksana
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveSessionModalTutor(null)}
                className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition cursor-pointer"
                title="Tutup (ESC)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Sesi Privat</p>
                  <p className="text-sm font-black text-indigo-700">
                    {activeSessionModalTutor.privatSessionsCount} Sesi ({formatRupiah(activeSessionModalTutor.privatGrossHonor)})
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Sesi Grup</p>
                  <p className="text-sm font-black text-teal-700">
                    {activeSessionModalTutor.groupSessionsCount} Sesi ({formatRupiah(activeSessionModalTutor.groupGrossHonor)})
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Uang Transport</p>
                  <p className="text-sm font-black text-amber-700">
                    {formatRupiah(activeSessionModalTutor.transportAllowance)} ({activeSessionModalTutor.uniqueTeachingDays} Hari)
                  </p>
                </div>
              </div>

              {/* Table Container with Horizontal Scroll Support */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700">Daftar Log Kehadiran & Sesi Mengajar:</span>
                  <span className="text-[10px] text-slate-400">↔ Geser tabel ke samping jika kolom terpotong</span>
                </div>
                <div className="border border-slate-200 rounded-2xl overflow-x-auto shadow-inner bg-white">
                  <table className="w-full min-w-[720px] text-left border-collapse">
                    <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 whitespace-nowrap min-w-[130px]">Tanggal / Jam</th>
                        <th className="py-2.5 px-3 min-w-[150px]">Siswa</th>
                        <th className="py-2.5 px-2 text-center w-20 whitespace-nowrap">Kelas</th>
                        <th className="py-2.5 px-3 min-w-[200px]">Materi / Topik</th>
                        <th className="py-2.5 px-3 text-right whitespace-nowrap min-w-[100px]">SPP Siswa</th>
                        <th className="py-2.5 px-3 text-right font-bold text-slate-900 whitespace-nowrap min-w-[120px]">Honor Tutor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeSessionModalTutor.sessionDetails?.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-slate-400">
                            Tidak ada rincian sesi tercatat.
                          </td>
                        </tr>
                      ) : (
                        activeSessionModalTutor.sessionDetails?.map((s, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <p className="font-bold text-slate-800">{formatDateIndo(s.date)}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{s.time} WIB</p>
                            </td>
                            <td className="py-2.5 px-3">
                              <p className="font-bold text-slate-900">{s.studentName}</p>
                              <p className="text-[10px] text-slate-500 font-mono">{s.gradeDetail} ({s.studentCode})</p>
                            </td>
                            <td className="py-2.5 px-2 text-center whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  s.classType === 'Privat'
                                    ? 'bg-indigo-100 text-indigo-800'
                                    : 'bg-teal-100 text-teal-800'
                                }`}
                              >
                                {s.classType}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <p className="text-slate-800 font-medium text-[11px]">{s.topic}</p>
                              {s.tutorNotes && (
                                <p className="text-[10px] text-slate-400 italic mt-0.5">{s.tutorNotes}</p>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-600 whitespace-nowrap">
                              {formatRupiah(s.studentPricePerSession)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-indigo-950 font-mono whitespace-nowrap">
                              {formatRupiah(s.calculatedHonor)}
                              <span className="block text-[9px] font-normal text-slate-400">
                                ({s.calculationType === 'percentage' ? `${s.percentageApplied}% SPP` : 'Flat'})
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveSessionModalTutor(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Tutup</span>
                </button>
                <span className="text-xs font-bold text-slate-600 hidden sm:inline">
                  Total Estimasi: {formatRupiah(activeSessionModalTutor.netTotalSalary)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  id="btn-export-sessions-excel"
                  onClick={() => handleExportTutorSessionsExcel(activeSessionModalTutor)}
                  className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                  title="Unduh log rincian sesi mengajar ini ke Excel (.xlsx)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Unduh Excel Rincian</span>
                </button>
                <button
                  onClick={() => {
                    const target = activeSessionModalTutor;
                    setActiveSessionModalTutor(null);
                    setActiveSlipModalTutor(target);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Lihat Format Slip Gaji</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: SLIP GAJI RESMI SIAP CETAK (PDF / PRINT)                          */}
      {/* ========================================================================= */}
      {activeSlipModalTutor && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-xs p-2 sm:p-6 flex justify-center items-start animate-in fade-in duration-150"
          onClick={() => setActiveSlipModalTutor(null)}
        >
          {/* Floating Close Button at top right (always clickable) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveSlipModalTutor(null);
            }}
            className="fixed top-4 right-4 z-50 px-3 py-2 bg-slate-900/90 hover:bg-rose-600 text-white rounded-full shadow-2xl border border-slate-700 hover:border-rose-500 flex items-center gap-1.5 text-xs font-bold transition cursor-pointer hover:scale-105"
            title="Tutup Slip (atau tekan ESC)"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Tutup Slip (ESC)</span>
          </button>

          <div 
            className="bg-white rounded-3xl shadow-2xl border border-slate-300 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-150 my-2 sm:my-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Controls (Sticky Top Toolbar - Not printed) */}
            <div className="no-print sticky top-0 z-30 p-3 sm:p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-2 shadow-md">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold">Pratinjau Slip Gaji Resmi</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <button
                  id="btn-export-slip-png"
                  onClick={handleExportSlipPng}
                  disabled={isExportingSlipPng}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
                  title="Unduh slip honorarium sebagai file gambar PNG (bagus dikirim via WhatsApp)"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>{isExportingSlipPng ? 'Menyimpan...' : 'Unduh PNG'}</span>
                </button>
                <button
                  id="btn-export-slip-sessions-excel"
                  onClick={() => handleExportTutorSessionsExcel(activeSlipModalTutor)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                  title="Unduh rincian sesi mengajar ke Excel"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Unduh Excel</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSlipModalTutor(null)}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 transition cursor-pointer shadow-md"
                  title="Tutup slip gaji"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Tutup</span>
                </button>
              </div>
            </div>

            {/* Printable Slip Gaji Document Area */}
            <div ref={slipPrintRef} className="p-6 sm:p-8 space-y-6 text-slate-800 bg-white">
              {/* Slip Kop Header */}
              <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-black font-heading text-slate-950 tracking-tight">
                    {settings.bimbelName || 'BIMBEL SIGMA'}
                  </h1>
                  <p className="text-xs text-slate-600 font-medium italic">
                    {settings.tagline || 'Belajar Sampai Paham, Bukan Sekadar Hafal'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {settings.address || 'Blora, Jawa Tengah'} • Telp: {settings.phone || '0852-8232-4337'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="inline-block px-3 py-1 bg-slate-100 border border-slate-300 rounded-lg text-xs font-black text-slate-900 tracking-wider uppercase">
                    SLIP HONORARIUM
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 font-mono">
                    No: SLIP/{selectedYear}/{String(selectedMonth).padStart(2, '0')}/{activeSlipModalTutor.tutorId.slice(-4).toUpperCase()}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Dicetak: {formatDateIndo(getTodayDateString())}
                  </p>
                </div>
              </div>

              {/* Tutor & Period Info */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 uppercase font-bold text-[10px] block">Nama Penerima:</span>
                  <span className="font-extrabold text-slate-900 text-sm block">
                    {activeSlipModalTutor.tutorName}
                  </span>
                  <span className="text-slate-500 text-[11px]">Tutor / Tenaga Pendidik</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 uppercase font-bold text-[10px] block">Periode Penggajian:</span>
                  <span className="font-extrabold text-slate-900 text-sm block">
                    {getMonthNameIndo(selectedMonth)} {selectedYear}
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-[11px] mt-0.5">
                    {activeSlipModalTutor.status === 'Lunas' ? (
                      <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-extrabold">
                        Status: LUNAS (TERBAYAR PENUH)
                      </span>
                    ) : activeSlipModalTutor.status === 'Dibayar Sebagian' ? (
                      <span className="text-amber-800 bg-amber-100 px-2 py-0.5 rounded font-extrabold">
                        Status: DIBAYAR SEBAGIAN
                      </span>
                    ) : (
                      <span className="text-rose-700 bg-rose-100 px-2 py-0.5 rounded font-extrabold">
                        Status: BELUM DIBAYARKAN
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Breakdown Table */}
              <div className="border border-slate-300 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3">Komponen Honorarium</th>
                      <th className="py-2.5 px-3 text-center">Volume / Sesi</th>
                      <th className="py-2.5 px-3 text-right">Tarif Dasar / Rumus</th>
                      <th className="py-2.5 px-3 text-right">Jumlah (IDR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        Honor Mengajar Kelas Privat
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {activeSlipModalTutor.privatSessionsCount} Sesi
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-500 font-mono">
                        {calcMode === 'percentage' ? `${privatPct}% SPP Siswa` : formatRupiah(flatPrivatRate)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(activeSlipModalTutor.privatGrossHonor)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        Honor Mengajar Kelas Grup / Reguler
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {activeSlipModalTutor.groupSessionsCount} Sesi
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-500 font-mono">
                        {calcMode === 'percentage' ? `${groupPct}% SPP Siswa` : formatRupiah(flatGroupRate)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(activeSlipModalTutor.groupGrossHonor)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        Uang Transport Kehadiran
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {activeSlipModalTutor.uniqueTeachingDays} Hari
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-500 font-mono">
                        {formatRupiah(transportPerDay)} / Hari
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(activeSlipModalTutor.transportAllowance)}
                      </td>
                    </tr>
                    {activeSlipModalTutor.bonus > 0 && (
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-emerald-700">
                          Bonus Evaluasi & Kinerja
                        </td>
                        <td className="py-2.5 px-3 text-center">-</td>
                        <td className="py-2.5 px-3 text-right text-slate-500 font-mono">-</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                          +{formatRupiah(activeSlipModalTutor.bonus)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-slate-50 font-black text-slate-950 border-t-2 border-slate-300">
                    <tr>
                      <td colSpan={3} className="py-3 px-3 text-right uppercase text-xs">
                        TOTAL HAK HONORARIUM (BRUTO):
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-sm text-indigo-950">
                        {formatRupiah(activeSlipModalTutor.netTotalSalary)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Payment History & Installments Section */}
              {activeSlipModalTutor.paymentHistory && activeSlipModalTutor.paymentHistory.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">
                    Riwayat Pencairan Dana & Kas Keluar:
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 text-[10px] uppercase">
                        <tr>
                          <th className="py-2 px-3">No</th>
                          <th className="py-2 px-3">Tanggal Pencairan</th>
                          <th className="py-2 px-3">Metode & Keterangan</th>
                          <th className="py-2 px-3 text-right">Nominal (IDR)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {activeSlipModalTutor.paymentHistory.map((ph, idx) => (
                          <tr key={ph.id || idx} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-bold text-slate-500">#{idx + 1}</td>
                            <td className="py-2 px-3 font-medium text-slate-800">
                              {formatDateIndo(ph.date)}
                            </td>
                            <td className="py-2 px-3 text-slate-600">
                              <span className="font-semibold text-slate-800">{ph.paymentMethod || 'Transfer'}</span>
                              {ph.notes && <span className="block text-[10px] text-slate-400">{ph.notes}</span>}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                              {formatRupiah(ph.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50 font-bold text-slate-900 border-t border-slate-200">
                        <tr>
                          <td colSpan={3} className="py-2 px-3 text-right uppercase text-[11px]">
                            Total Dana Telah Diterima:
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                            {formatRupiah(activeSlipModalTutor.paidAmount || 0)}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={3} className="py-2 px-3 text-right uppercase text-[11px] text-slate-600">
                            Sisa Kurang Bayar (Belum Dicairkan):
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-extrabold text-amber-700">
                            {formatRupiah(activeSlipModalTutor.remainingAmount || 0)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* Signatures Area */}
              <div className="grid grid-cols-2 gap-8 pt-4 text-xs text-center">
                <div>
                  <p className="text-slate-500 text-[11px] mb-12">Penerima Honor,</p>
                  <p className="font-bold text-slate-900 underline">{activeSlipModalTutor.tutorName}</p>
                  <p className="text-[10px] text-slate-400">Tutor Pengajar</p>
                </div>
                <div>
                  <p className="text-slate-500 text-[11px] mb-12">
                    {settings.city || (settings.address?.toLowerCase().includes('blora') ? 'Blora' : 'Blora')}, {formatDateIndo(getTodayDateString())} <br />
                    Bendahara / Pimpinan Bimbel,
                  </p>
                  <p className="font-bold text-slate-900 underline">
                    {settings.ownerName || 'Pimpinan Bimbel'}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {settings.ownerTitle || 'Direktur Lembaga'}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 text-center">
                <p className="text-[10px] text-slate-400 italic">
                  * Dokumen ini merupakan bukti sah pembayaran honorarium pengajar pada {settings.bimbelName || 'Bimbel Sigma'}.
                </p>
              </div>
            </div>

            {/* Bottom Non-Printed Action Bar with Close Button */}
            <div className="no-print p-4 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[11px] text-slate-500">
                Tekan tombol <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px] text-slate-700 font-bold">ESC</kbd> atau klik di luar kotak untuk menutup slip.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSlipModalTutor(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                >
                  <X className="w-4 h-4" />
                  <span>Tutup Pratinjau</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: PEMBAYARAN GAJI (LUNAS / CICILAN) & INTEGRASI BUKU KAS (OWNER)    */}
      {/* ========================================================================= */}
      {payModalTutor && (() => {
        const alreadyPaid = payModalTutor.paidAmount || 0;
        const currentAdjustedNet = payModalTutor.netTotalSalary + (customBonus || 0) - (customDeduction || 0);
        const currentRemaining = Math.max(0, currentAdjustedNet - alreadyPaid);
        const effectivePayAmount = paymentType === 'full' ? currentRemaining : Math.min(payAmount, currentRemaining > 0 ? currentRemaining : payAmount);
        const remainingAfterPay = Math.max(0, currentRemaining - effectivePayAmount);
        const willBeLunas = alreadyPaid + effectivePayAmount >= currentAdjustedNet;

        return (
          <div 
            className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs p-3 sm:p-6 flex justify-center items-start animate-in fade-in duration-150"
            onClick={() => setPayModalTutor(null)}
          >
            <div 
              className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150 my-2 sm:my-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-emerald-200 font-bold uppercase tracking-wider">
                    Pencairan Honorarium & Buku Kas
                  </p>
                  <h3 className="text-base font-black font-heading">
                    Bayar Honor: {payModalTutor.tutorName}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setPayModalTutor(null)}
                  className="p-1.5 text-emerald-200 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleConfirmPayment} className="p-5 space-y-4 text-xs">
                {/* Summary Info Card */}
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1.5">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Periode Penggajian:</span>
                    <span className="font-bold text-slate-900">
                      {getMonthNameIndo(selectedMonth)} {selectedYear}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Aktivitas Mengajar:</span>
                    <span className="font-bold text-slate-900">
                      {payModalTutor.totalSessionsCount} Sesi ({payModalTutor.privatSessionsCount} Privat, {payModalTutor.groupSessionsCount} Grup) • {payModalTutor.uniqueTeachingDays} Hari
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Total Hak Honor Periode:</span>
                    <span className="font-bold text-indigo-950 font-mono">
                      {formatRupiah(currentAdjustedNet)}
                    </span>
                  </div>
                  {alreadyPaid > 0 && (
                    <div className="flex items-center justify-between text-emerald-800">
                      <span>Sudah Dibayar Sebelumnya:</span>
                      <span className="font-bold font-mono">
                        {formatRupiah(alreadyPaid)} ({payModalTutor.paymentHistory?.length || 1}x pencairan)
                      </span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-emerald-200 flex items-center justify-between">
                    <span className="font-bold text-slate-800">Sisa Tagihan Saat Ini:</span>
                    <span className="text-base font-black text-amber-700 font-mono">
                      {formatRupiah(currentRemaining)}
                    </span>
                  </div>
                </div>

                {/* Option: Bayar Penuh vs Bayar Cicil / Sebagian */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">
                    Pilihan Skema Pembayaran:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentType('full');
                        setPayAmount(currentRemaining);
                      }}
                      className={`p-2.5 rounded-xl border text-center font-bold transition cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                        paymentType === 'full'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-xs">⚡ Bayar Lunas Penuh</span>
                      <span className="text-[10px] opacity-80 font-mono font-normal">
                        {formatRupiah(currentRemaining)}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentType('partial');
                        if (payAmount >= currentRemaining || payAmount === 0) {
                          setPayAmount(Math.round(currentRemaining / 2));
                        }
                      }}
                      className={`p-2.5 rounded-xl border text-center font-bold transition cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                        paymentType === 'partial'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-xs">📝 Bayar Sebagian (Cicil)</span>
                      <span className="text-[10px] opacity-80 font-mono font-normal">
                        Nominal Bebas / Fleksibel
                      </span>
                    </button>
                  </div>
                </div>

                {/* Custom Amount Input for Partial */}
                {paymentType === 'partial' && (
                  <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
                    <label className="block text-amber-950 font-bold">
                      Nominal Pembayaran Tahap Ini (Rp):
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                        Rp
                      </span>
                      <input
                        type="number"
                        min="1000"
                        max={currentRemaining}
                        step="any"
                        value={payAmount === 0 ? '' : payAmount}
                        onChange={(e) => {
                          const val = e.target.value === '' ? 0 : Number(e.target.value);
                          setPayAmount(isNaN(val) ? 0 : val);
                        }}
                        placeholder="Masukkan nominal cicilan..."
                        className="w-full pl-10 pr-3 py-2 bg-white border border-amber-300 rounded-xl font-mono font-bold text-sm text-slate-900 focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    {/* Quick percentage chips */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-slate-500">Pintasan:</span>
                      <button
                        type="button"
                        onClick={() => setPayAmount(Math.round(currentRemaining * 0.25))}
                        className="px-2 py-0.5 bg-white border border-amber-300 text-amber-800 text-[10px] font-bold rounded hover:bg-amber-100 cursor-pointer"
                      >
                        25%
                      </button>
                      <button
                        type="button"
                        onClick={() => setPayAmount(Math.round(currentRemaining * 0.5))}
                        className="px-2 py-0.5 bg-white border border-amber-300 text-amber-800 text-[10px] font-bold rounded hover:bg-amber-100 cursor-pointer"
                      >
                        50%
                      </button>
                      <button
                        type="button"
                        onClick={() => setPayAmount(Math.round(currentRemaining * 0.75))}
                        className="px-2 py-0.5 bg-white border border-amber-300 text-amber-800 text-[10px] font-bold rounded hover:bg-amber-100 cursor-pointer"
                      >
                        75%
                      </button>
                      <button
                        type="button"
                        onClick={() => setPayAmount(currentRemaining)}
                        className="px-2 py-0.5 bg-white border border-amber-300 text-amber-800 text-[10px] font-bold rounded hover:bg-amber-100 cursor-pointer"
                      >
                        Sisa Penuh
                      </button>
                    </div>
                  </div>
                )}

                {/* Calculation simulation summary */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-[11px]">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Nominal Dibayar Sekarang:</span>
                    <span className="font-bold text-emerald-700 font-mono">
                      {formatRupiah(effectivePayAmount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Sisa Belum Lunas Setelah Ini:</span>
                    <span className={`font-bold font-mono ${remainingAfterPay > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
                      {formatRupiah(remainingAfterPay)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                    <span className="font-bold text-slate-700">Status Setelah Transaksi:</span>
                    <span className={`font-extrabold px-2 py-0.5 rounded text-[10px] ${
                      willBeLunas ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                    }`}>
                      {willBeLunas ? 'LUNAS PENUH' : 'DIBAYAR SEBAGIAN'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Metode Pembayaran
                    </label>
                    <select
                      value={payPaymentMethod}
                      onChange={(e) => setPayPaymentMethod(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500"
                    >
                      {(settings.paymentMethods || ['Transfer BCA', 'Tunai', 'QRIS']).map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Penyesuaian Bonus / Tambahan (Rp)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={customBonus === 0 ? '' : customBonus}
                      onChange={(e) => {
                        const val = e.target.value === '' ? 0 : Number(e.target.value);
                        setCustomBonus(isNaN(val) ? 0 : val);
                      }}
                      placeholder="0"
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Catatan / Keterangan Pembayaran Kas
                  </label>
                  <input
                    type="text"
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    placeholder="Contoh: Ditransfer via BCA / Pembayaran honor tahap 1"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Previous payment history list inside pay modal if any */}
                {payModalTutor.paymentHistory && payModalTutor.paymentHistory.length > 0 && (
                  <div className="p-3 bg-slate-100/80 rounded-xl border border-slate-200 space-y-1.5">
                    <p className="font-bold text-slate-700 text-[11px]">
                      Riwayat Pencairan Sebelumnya ({payModalTutor.paymentHistory.length}x):
                    </p>
                    <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                      {payModalTutor.paymentHistory.map((ph, i) => (
                        <div key={ph.id || i} className="flex items-center justify-between text-[10px] bg-white p-1.5 rounded-lg border border-slate-200">
                          <span className="text-slate-600">
                            #{i + 1} {formatDateIndo(ph.date)} ({ph.paymentMethod})
                          </span>
                          <span className="font-bold font-mono text-emerald-700">
                            {formatRupiah(ph.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-[11px] text-amber-800">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Transaksi pembayaran ini akan <strong>otomatis dicatat ke Buku Kas Pengeluaran</strong> (kategori &quot;Gaji Tutor / Pengajar&quot;) secara real-time.
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setPayModalTutor(null)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Konfirmasi & Catat ke Kas</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
