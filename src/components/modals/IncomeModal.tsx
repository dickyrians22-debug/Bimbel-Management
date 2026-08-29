import React, { useState, useEffect } from 'react';
import {
  X,
  DollarSign,
  Calendar,
  User,
  FileText,
  Save,
  Tag,
  Sparkles,
  Info,
  TrendingUp,
  GraduationCap,
  Receipt,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { IncomeRecord, Student, BimbelSettings, AttendanceRecord } from '../../types';
import {
  getTodayDateString,
  MONTH_NAMES_ID,
  formatRupiah,
  generateIncomeReceiptNumber,
  isSystemIncomeCategory,
  getMonthNameIndo,
  DEFAULT_SYSTEM_INCOME_CATEGORY,
} from '../../utils/storage';

interface IncomeModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSave: (record: Omit<IncomeRecord, 'id' | 'createdAt'> & { id?: string }) => void;
  students: Student[];
  attendances?: AttendanceRecord[];
  initialData?: IncomeRecord | null;
  currentUserName: string;
  totalExistingIncomes?: number;
  existingIncomes?: IncomeRecord[];
  paymentMethods?: string[];
  categories?: string[];
  settings?: BimbelSettings | null;
}

const DEFAULT_INCOME_CATEGORIES: string[] = [
  DEFAULT_SYSTEM_INCOME_CATEGORY,
  'Biaya Pendaftaran / Registrasi',
  'Modul & Buku Paket',
  'Try Out & Ujian Simulasi',
  'Event / Workshop Bimbel',
  'Lain-lain',
];

/**
 * Helper untuk menghitung total tagihan, jumlah terbayar, dan sisa kekurangan biaya les siswa
 */
export function calculateStudentUnpaidBill(
  std: Student | undefined,
  month: number,
  year: number,
  attendancesList: AttendanceRecord[] = [],
  incomesList: IncomeRecord[] = [],
  bimbelSettings?: BimbelSettings | null,
  excludeIncomeId?: string
): { totalBill: number; paidAmount: number; remainingBill: number; attendedCount: number; rate?: number } {
  if (!std) return { totalBill: 0, paidAmount: 0, remainingBill: 0, attendedCount: 0, rate: 0 };

  // Hitung kehadiran bulan & tahun tersebut
  const attendedRecords = attendancesList.filter((a) => {
    if (!a.date) return false;
    const [yStr, mStr] = a.date.split('-');
    const y = parseInt(yStr, 10);
    const m = parseInt(mStr, 10);
    const isMatchDate = y === year && m === month;
    const isMatchStudent =
      (a.studentId && a.studentId === std.id) ||
      (a.studentCode && a.studentCode === std.code) ||
      (a.studentName && a.studentName.toLowerCase() === std.name.toLowerCase());
    const isPresent = a.status === 'Hadir';
    return isMatchDate && isMatchStudent && isPresent;
  });

  const attendedCount = attendedRecords.length;
  const rate =
    std.pricePerSession > 0
      ? std.pricePerSession
      : std.monthlyFee
      ? Math.round(std.monthlyFee / 8)
      : std.level === 'SMP'
      ? 60000
      : 50000;

  // Tagihan murni dari jumlah kehadiran riil (Status: Hadir) dikali tarif per sesi
  const totalBill = attendedCount * rate;

  // Hitung yang sudah dibayar untuk periode tersebut
  const studentIncomes = incomesList.filter((inc) => {
    if (excludeIncomeId && inc.id === excludeIncomeId) return false;
    const isMatchStudent =
      (inc.studentId && inc.studentId === std.id) ||
      (inc.studentCode && inc.studentCode === std.code) ||
      (inc.studentName && inc.studentName.toLowerCase() === std.name.toLowerCase());
    const isMatchPeriod = inc.accrualMonth === month && inc.accrualYear === year;
    const isSppCategory = isSystemIncomeCategory(inc.category || '', bimbelSettings);
    return isMatchStudent && isMatchPeriod && isSppCategory;
  });

  const paidAmount = studentIncomes.reduce((sum, inc) => sum + (inc.amount || 0), 0);
  const remainingBill = Math.max(0, totalBill - paidAmount);

  return { totalBill, paidAmount, remainingBill, attendedCount, rate };
}

export const IncomeModal: React.FC<IncomeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  students,
  attendances = [],
  currentUserName,
  totalExistingIncomes = 0,
  existingIncomes = [],
  paymentMethods = [
    'Tunai',
    'Transfer BCA',
    'Transfer Mandiri',
    'Transfer BRI',
    'Transfer BNI',
    'QRIS',
    'GoPay / OVO / Dana',
    'Lainnya',
  ],
  categories = DEFAULT_INCOME_CATEGORIES,
  settings,
}) => {
  const activeCategories =
    categories && categories.length > 0 ? categories : DEFAULT_INCOME_CATEGORIES;

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [isInstallment, setIsInstallment] = useState(false);

  const [formData, setFormData] = useState({
    datePaid: getTodayDateString(),
    receiptNumber: '',
    category: activeCategories[0] || DEFAULT_SYSTEM_INCOME_CATEGORY,
    studentId: '',
    studentName: '',
    sourceName: '',
    description: '',
    accrualMonth: currentMonth,
    accrualYear: currentYear,
    amount: 0,
    totalBill: 0,
    remainingBill: 0,
    paymentMethod: paymentMethods[0] || 'Transfer BCA',
    receivedBy: currentUserName || 'Admin Bimbel',
  });

  const isSppCategory = isSystemIncomeCategory(formData.category, settings);

  // Perhitungan sisa tagihan untuk siswa yang sedang dipilih
  const selectedStudent = students.find((s) => s.id === formData.studentId);
  const currentBillInfo = isSppCategory && selectedStudent
    ? calculateStudentUnpaidBill(
        selectedStudent,
        formData.accrualMonth,
        formData.accrualYear,
        attendances,
        existingIncomes,
        settings,
        initialData?.id
      )
    : { totalBill: 0, paidAmount: 0, remainingBill: 0, attendedCount: 0 };

  useEffect(() => {
    if (initialData) {
      const isInitialInstallment =
        (initialData.remainingBill || 0) > 0 || initialData.paymentStatus === 'Cicilan';
      setIsInstallment(isInitialInstallment);

      setFormData({
        datePaid: initialData.datePaid || getTodayDateString(),
        receiptNumber: initialData.receiptNumber || '',
        category: initialData.category || activeCategories[0] || DEFAULT_SYSTEM_INCOME_CATEGORY,
        studentId: initialData.studentId || '',
        studentName: initialData.studentName || '',
        sourceName: initialData.sourceName || initialData.studentName || '',
        description: initialData.notes || '',
        accrualMonth: initialData.accrualMonth || currentMonth,
        accrualYear: initialData.accrualYear || currentYear,
        amount: initialData.amount || 0,
        totalBill: initialData.totalBill || initialData.amount || 0,
        remainingBill: initialData.remainingBill || 0,
        paymentMethod: initialData.paymentMethod || paymentMethods[0] || 'Transfer BCA',
        receivedBy: initialData.receivedBy || currentUserName || 'Admin Bimbel',
      });
    } else {
      const todayStr = getTodayDateString();
      const autoReceiptNum = generateIncomeReceiptNumber(existingIncomes, todayStr);
      const defaultCategory = activeCategories[0] || DEFAULT_SYSTEM_INCOME_CATEGORY;
      const isDefaultSpp = isSystemIncomeCategory(defaultCategory, settings);

      const firstActiveStudent = students.find((s) => s.status === 'Aktif') || students[0];
      const defaultStdId = isDefaultSpp && firstActiveStudent ? firstActiveStudent.id : '';
      const defaultStdName = isDefaultSpp && firstActiveStudent ? firstActiveStudent.name : '';

      let defaultAmount = 0;
      if (isDefaultSpp && firstActiveStudent) {
        const billInfo = calculateStudentUnpaidBill(
          firstActiveStudent,
          currentMonth,
          currentYear,
          attendances,
          existingIncomes,
          settings
        );
        defaultAmount = billInfo.remainingBill;
      }

      const monthName = getMonthNameIndo(currentMonth);
      const defaultDesc = isDefaultSpp && firstActiveStudent
        ? `Pembayaran SPP Periode ${monthName} ${currentYear} - ${firstActiveStudent.name}`
        : `Penerimaan ${defaultCategory}`;

      setIsInstallment(false);
      setFormData({
        datePaid: todayStr,
        receiptNumber: autoReceiptNum,
        category: defaultCategory,
        studentId: defaultStdId,
        studentName: defaultStdName,
        sourceName: defaultStdName || '',
        description: defaultDesc,
        accrualMonth: currentMonth,
        accrualYear: currentYear,
        amount: defaultAmount,
        totalBill: defaultAmount,
        remainingBill: 0,
        paymentMethod: paymentMethods[0] || 'Transfer BCA',
        receivedBy: currentUserName || 'Admin Bimbel',
      });
    }
  }, [initialData, isOpen, currentUserName, totalExistingIncomes, existingIncomes, attendances]);

  // Close modal on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Handle Category Change
  const handleCategoryChange = (newCat: string) => {
    const isNowSpp = isSystemIncomeCategory(newCat, settings);
    const selectedStd = students.find((s) => s.id === formData.studentId) || students[0];

    if (isNowSpp) {
      const std = selectedStd;
      const monthName = getMonthNameIndo(formData.accrualMonth);
      const billInfo = calculateStudentUnpaidBill(
        std,
        formData.accrualMonth,
        formData.accrualYear,
        attendances,
        existingIncomes,
        settings,
        initialData?.id
      );
      const autoAmount = billInfo.remainingBill;
      const autoDesc = std
        ? `Pembayaran SPP Periode ${monthName} ${formData.accrualYear} - ${std.name}`
        : `Pembayaran SPP Periode ${monthName} ${formData.accrualYear}`;

      setFormData((prev) => ({
        ...prev,
        category: newCat,
        studentId: std ? std.id : '',
        studentName: std ? std.name : '',
        sourceName: std ? std.name : prev.sourceName,
        description: autoDesc,
        amount: autoAmount,
        totalBill: autoAmount,
      }));
    } else {
      // Non-SPP (Registration fee, modul, try out, event, etc) -> nominal starts at 0 to prevent distraction
      setFormData((prev) => ({
        ...prev,
        category: newCat,
        studentId: '',
        studentName: '',
        description: `Penerimaan ${newCat}`,
        amount: 0,
        totalBill: 0,
      }));
    }
  };

  // Handle Student Change
  const handleSelectStudent = (selectedStudentId: string) => {
    const selected = students.find((s) => s.id === selectedStudentId);
    if (selected) {
      const monthName = getMonthNameIndo(formData.accrualMonth);
      const billInfo = calculateStudentUnpaidBill(
        selected,
        formData.accrualMonth,
        formData.accrualYear,
        attendances,
        existingIncomes,
        settings,
        initialData?.id
      );
      const autoAmount = billInfo.remainingBill;
      const autoDesc = `Pembayaran SPP Periode ${monthName} ${formData.accrualYear} - ${selected.name}`;

      setFormData((prev) => ({
        ...prev,
        studentId: selected.id,
        studentName: selected.name,
        sourceName: selected.name,
        description: autoDesc,
        amount: autoAmount,
        totalBill: autoAmount,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        studentId: '',
        studentName: '',
        amount: 0,
        totalBill: 0,
      }));
    }
  };

  // Handle Accrual Period Change
  const handlePeriodChange = (newMonth: number, newYear: number) => {
    const monthName = getMonthNameIndo(newMonth);
    const selectedStd = students.find((s) => s.id === formData.studentId);
    const studentPart = selectedStd?.name || formData.studentName || formData.sourceName || 'Siswa';
    const autoDesc = `Pembayaran SPP Periode ${monthName} ${newYear} - ${studentPart}`;

    let autoAmount = formData.amount;
    if (isSppCategory && selectedStd) {
      const billInfo = calculateStudentUnpaidBill(
        selectedStd,
        newMonth,
        newYear,
        attendances,
        existingIncomes,
        settings,
        initialData?.id
      );
      autoAmount = billInfo.remainingBill;
    }

    setFormData((prev) => ({
      ...prev,
      accrualMonth: newMonth,
      accrualYear: newYear,
      description: isSppCategory ? autoDesc : prev.description,
      amount: isSppCategory ? autoAmount : prev.amount,
      totalBill: isSppCategory ? autoAmount : prev.totalBill,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.description.trim() || formData.amount <= 0) {
      alert('Mohon lengkapi Keterangan dan Nominal Kas Masuk (harus > 0).');
      return;
    }

    const selectedStd = students.find((s) => s.id === formData.studentId);
    const effectiveTotalBill = isInstallment ? Number(formData.totalBill) : Number(formData.amount);
    const effectiveRemaining = isInstallment
      ? Math.max(0, effectiveTotalBill - Number(formData.amount))
      : 0;
    const paymentStatus: 'Lunas' | 'Cicilan' =
      isInstallment && effectiveRemaining > 0 ? 'Cicilan' : 'Lunas';

    onSave({
      ...(initialData ? { id: initialData.id } : {}),
      datePaid: formData.datePaid,
      receiptNumber: formData.receiptNumber.trim() || generateIncomeReceiptNumber(existingIncomes, formData.datePaid),
      category: formData.category,
      amount: Number(formData.amount),
      totalBill: effectiveTotalBill,
      remainingBill: effectiveRemaining,
      paymentStatus,
      paymentMethod: formData.paymentMethod,
      notes: formData.description.trim(),
      receivedBy: formData.receivedBy.trim() || currentUserName || 'Admin Bimbel',
      ...(isSppCategory
        ? {
            incomeCategory: 'spp_monthly',
            studentId: selectedStd ? selectedStd.id : formData.studentId || undefined,
            studentCode: selectedStd ? selectedStd.code : undefined,
            studentName: selectedStd ? selectedStd.name : formData.studentName.trim() || undefined,
            sourceName: selectedStd ? selectedStd.name : formData.sourceName.trim() || undefined,
            accrualMonth: formData.accrualMonth,
            accrualYear: formData.accrualYear,
            sessionsCount: currentBillInfo.attendedCount || 8,
          }
        : {
            incomeCategory:
              formData.category.toLowerCase().includes('daftar') ||
              formData.category.toLowerCase().includes('registrasi')
                ? 'registration'
                : 'general',
            studentId: undefined,
            studentCode: undefined,
            studentName: formData.sourceName.trim() || undefined,
            sourceName: formData.sourceName.trim() || 'Umum',
            accrualMonth: formData.accrualMonth || currentMonth,
            accrualYear: formData.accrualYear || currentYear,
            sessionsCount: undefined,
          }),
    });

    onClose?.();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-hidden animate-in fade-in cursor-pointer"
      onClick={() => onClose?.()}
    >
      <div
        id="income-form-modal"
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="shrink-0 bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-200 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">
                {initialData ? 'Edit Kas Masuk / Penerimaan' : 'Input Penerimaan Kas Masuk Baru'}
              </h3>
              <p className="text-xs text-emerald-100 line-clamp-1">
                Catat pembayaran SPP les, pendaftaran, modul, try out, dan penerimaan lainnya
              </p>
            </div>
          </div>
          <button
            onClick={() => onClose?.()}
            className="text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-xl transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form with Scrollable Body & Fixed Footer */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tanggal Penerimaan */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                Tanggal Penerimaan <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.datePaid}
                onChange={(e) => setFormData({ ...formData, datePaid: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-semibold focus:ring-2 focus:ring-emerald-500 focus:bg-white transition text-sm"
              />
            </div>

            {/* No. Bukti / Kwitansi */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                No. Kwitansi / Bukti Kas
              </label>
              <input
                type="text"
                value={formData.receiptNumber}
                onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
                placeholder="KW-YYYY-MM-XXX"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-mono text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Kategori Penerimaan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-emerald-600" />
              Kategori Penerimaan <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white transition text-sm cursor-pointer"
            >
              {activeCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Special Helper Card for SPP Siswa (Locked System Category) */}
          {isSppCategory && (
            <div className="p-4 bg-emerald-50/80 border border-emerald-200/90 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-900 flex items-center gap-1.5 uppercase tracking-wide">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Integrasi Otomatis Tagihan SPP Siswa
                </span>
                <span className="text-[11px] font-bold text-emerald-700 bg-white px-2.5 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
                  Sinkron ke Tagihan Siswa
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Pilih Siswa Pembayar */}
                <div>
                  <label className="block text-[11px] font-bold text-emerald-900 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                    Pilih Siswa Pembayar <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.studentId}
                    onChange={(e) => handleSelectStudent(e.target.value)}
                    required={isSppCategory}
                    className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-slate-800 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="">-- Pilih Siswa Terdaftar --</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        [{s.code || 'SISWA'}] {s.name} - {s.gradeDetail || s.level} ({s.classType})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Alokasi Periode SPP (Bulan & Tahun) */}
                <div>
                  <label className="block text-[11px] font-bold text-emerald-900 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    Untuk Periode SPP Bulan
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <select
                      value={formData.accrualMonth}
                      onChange={(e) => handlePeriodChange(Number(e.target.value), formData.accrualYear)}
                      className="w-full px-2.5 py-2 bg-white border border-emerald-300 rounded-xl text-slate-800 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    >
                      {MONTH_NAMES_ID.map((name, idx) => (
                        <option key={name} value={idx + 1}>
                          {name}
                        </option>
                      ))}
                    </select>

                    <select
                      value={formData.accrualYear}
                      onChange={(e) => handlePeriodChange(formData.accrualMonth, Number(e.target.value))}
                      className="w-full px-2.5 py-2 bg-white border border-emerald-300 rounded-xl text-slate-800 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    >
                      {[2025, 2026, 2027].map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Status Tagihan Siswa Terpilih */}
              {selectedStudent && (
                <div className="bg-white/90 p-2.5 rounded-xl border border-emerald-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    {currentBillInfo.remainingBill > 0 ? (
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                    <span className="text-slate-700 font-medium">
                      Kehadiran Bulan Ini: <strong className="text-slate-900">{currentBillInfo.attendedCount} sesi</strong> | Total Tagihan: <strong className="text-slate-900">{formatRupiah(currentBillInfo.totalBill)}</strong>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-500 block">Kekurangan Biaya Les:</span>
                    <span className={`font-black font-mono text-sm ${currentBillInfo.remainingBill > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {formatRupiah(currentBillInfo.remainingBill)}
                    </span>
                  </div>
                </div>
              )}

              <p className="text-[11px] text-emerald-800 bg-white/80 p-2.5 rounded-xl border border-emerald-200 flex items-start gap-1.5 leading-relaxed">
                <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Info Tagihan Siswa:</strong> Kas masuk ini akan <strong>otomatis melunasi tagihan</strong> siswa pada menu <strong>Tagihan Siswa</strong> untuk periode <strong>{getMonthNameIndo(formData.accrualMonth)} {formData.accrualYear}</strong>.
                </span>
              </p>
            </div>
          )}

          {/* Deskripsi & Nama Pembayar / Sumber */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                Keterangan / Uraian Kas Masuk <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Rincian / keperluan kas masuk"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                Diterima Dari (Nama Pembayar / Sumber)
              </label>
              <input
                type="text"
                value={formData.sourceName}
                onChange={(e) => setFormData({ ...formData, sourceName: e.target.value })}
                placeholder={isSppCategory ? 'Nama Siswa / Orang Tua' : 'Nama pihak pembayar / sumber'}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Nominal & Metode Bayar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  Nominal Kas Masuk (Rp) <span className="text-rose-500">*</span>
                </label>
                <span className="text-xs font-black text-emerald-700 font-mono">
                  {formatRupiah(formData.amount || 0)}
                </span>
              </div>
              <input
                type="number"
                min="0"
                step="any"
                required
                placeholder="0"
                value={formData.amount === 0 ? '' : formData.amount}
                onChange={(e) => {
                  const val = e.target.value === '' ? 0 : Number(e.target.value);
                  const num = isNaN(val) ? 0 : val;
                  setFormData({
                    ...formData,
                    amount: num,
                    totalBill: isInstallment ? formData.totalBill : num,
                  });
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-emerald-700 font-extrabold text-base focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              />
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[10px] font-bold text-slate-400">Tambah Cepat:</span>
                {[10000, 50000, 100000, 200000, 500000].map((delta) => (
                  <button
                    key={delta}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => {
                        const newAmt = (prev.amount || 0) + delta;
                        return {
                          ...prev,
                          amount: newAmt,
                          totalBill: isInstallment ? prev.totalBill : newAmt,
                        };
                      })
                    }
                    className="px-2 py-0.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 text-slate-600 rounded-md text-[10px] font-bold transition cursor-pointer"
                  >
                    +{delta >= 1000 ? `${delta / 1000}rb` : delta}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Metode Pembayaran
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white transition text-sm cursor-pointer"
              >
                {paymentMethods.map((pm) => (
                  <option key={pm} value={pm}>
                    {pm}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Opsi Cicilan / Pembayaran Sebagian */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isInstallment}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setIsInstallment(checked);
                  if (checked && formData.totalBill <= formData.amount) {
                    setFormData((prev) => ({ ...prev, totalBill: prev.amount * 2 }));
                  }
                }}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
              <span className="text-xs font-bold text-slate-700">
                Penerimaan Cicilan / Sebagian (Ada Sisa Tagihan)
              </span>
            </label>

            {isInstallment && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Total Tagihan Seharusnya (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.totalBill}
                    onChange={(e) =>
                      setFormData({ ...formData, totalBill: Number(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Sisa Tagihan Otomatis
                  </label>
                  <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs font-black text-amber-800">
                    {formatRupiah(Math.max(0, formData.totalBill - formData.amount))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Diterima / Dicatat Oleh */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Diterima / Dicatat Oleh
            </label>
            <input
              type="text"
              value={formData.receivedBy}
              onChange={(e) => setFormData({ ...formData, receivedBy: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-300 rounded-xl text-slate-700 text-sm"
            />
          </div>
        </div>

        {/* Tombol Aksi (Sticky Bottom Footer) */}
        <div className="shrink-0 p-4 sm:px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => onClose?.()}
            className="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-sm transition cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Simpan Penerimaan Kas
          </button>
        </div>
      </form>
    </div>
  </div>
);
};
