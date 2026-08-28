import React, { useState, useEffect } from 'react';
import { X, TrendingDown, Calendar, Tag, User, DollarSign, FileText, Save, Info, Sparkles, CheckCircle2 } from 'lucide-react';
import { ExpenseRecord, ExpenseCategory, UserAccount } from '../../types';
import {
  getTodayDateString,
  formatRupiah,
  MONTH_NAMES_ID,
  getMonthNameIndo,
  formatDateIndo,
  DEFAULT_SYSTEM_EXPENSE_CATEGORY,
  isSystemExpenseCategory,
  generateExpenseRefNumber,
} from '../../utils/storage';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSave: (record: Omit<ExpenseRecord, 'id' | 'createdAt'> & { id?: string }) => void;
  initialData?: ExpenseRecord | null;
  currentUserName: string;
  categories?: string[];
  paymentMethods?: string[];
  tutors?: UserAccount[];
  existingExpenses?: ExpenseRecord[];
}

const DEFAULT_CATEGORIES: ExpenseCategory[] = [
  DEFAULT_SYSTEM_EXPENSE_CATEGORY,
  'Sewa Tempat / Gedung',
  'Listrik, Internet & Air',
  'Modul, ATK & Cetak',
  'Marketing / Iklan',
  'Snack & Konsumsi Siswa',
  'Kebersihan & Operasional',
  'Lain-lain',
];

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  currentUserName,
  categories = DEFAULT_CATEGORIES,
  paymentMethods = ['Tunai', 'Transfer Bank', 'QRIS / E-Wallet'],
  tutors = [],
  existingExpenses = [],
}) => {
  const activeCategories = categories.length > 0 ? categories : DEFAULT_CATEGORIES;

  const now = new Date();
  // Default to previous month if today is early in the month (e.g. 1st-10th), otherwise current month
  const defaultPeriodMonth = now.getDate() <= 10 ? (now.getMonth() === 0 ? 12 : now.getMonth()) : now.getMonth() + 1;
  const defaultPeriodYear = now.getDate() <= 10 && now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

  const [formData, setFormData] = useState({
    date: getTodayDateString(),
    category: activeCategories[0] || 'Modul, ATK & Cetak',
    recipient: '',
    description: '',
    amount: 150000,
    paymentMethod: paymentMethods[0] || 'Transfer Bank',
    receiptRef: '',
    approvedBy: currentUserName || 'Budi Santoso, S.Pd.',
    periodMonth: defaultPeriodMonth,
    periodYear: defaultPeriodYear,
    tutorId: '',
    tutorName: '',
  });

  const isSalaryCategory = isSystemExpenseCategory(formData.category);

  useEffect(() => {
    if (initialData) {
      setFormData({
        date: initialData.date || getTodayDateString(),
        category: initialData.category || activeCategories[0],
        recipient: initialData.paidTo || initialData.recipient || '',
        description: initialData.title || initialData.description || '',
        amount: initialData.amount || 0,
        paymentMethod: initialData.paymentMethod || paymentMethods[0] || 'Transfer Bank',
        receiptRef: initialData.receiptRef || '',
        approvedBy: initialData.approvedBy || currentUserName,
        periodMonth: initialData.periodMonth || defaultPeriodMonth,
        periodYear: initialData.periodYear || defaultPeriodYear,
        tutorId: initialData.tutorId || '',
        tutorName: initialData.tutorName || '',
      });
    } else {
      const todayStr = getTodayDateString();
      const autoRef = generateExpenseRefNumber(existingExpenses, todayStr);

      setFormData({
        date: todayStr,
        category: activeCategories[0] || 'Modul, ATK & Cetak',
        recipient: '',
        description: '',
        amount: 150000,
        paymentMethod: paymentMethods[0] || 'Transfer Bank',
        receiptRef: autoRef,
        approvedBy: currentUserName || 'Budi Santoso, S.Pd.',
        periodMonth: defaultPeriodMonth,
        periodYear: defaultPeriodYear,
        tutorId: '',
        tutorName: '',
      });
    }
  }, [initialData, isOpen, currentUserName, existingExpenses]);

  if (!isOpen) return null;

  // Tutor selection helper
  const handleSelectTutor = (selectedTutorId: string) => {
    const selected = tutors.find((t) => t.id === selectedTutorId);
    if (selected) {
      const monthName = getMonthNameIndo(formData.periodMonth);
      const autoDesc = `Pembayaran Honor Gaji Tutor Periode ${monthName} ${formData.periodYear} - ${selected.name}`;
      setFormData((prev) => ({
        ...prev,
        tutorId: selected.id,
        tutorName: selected.name,
        recipient: selected.name,
        description: autoDesc,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        tutorId: '',
        tutorName: '',
      }));
    }
  };

  // Salary Period change helper
  const handlePeriodChange = (newMonth: number, newYear: number) => {
    const monthName = getMonthNameIndo(newMonth);
    const tutorPart = formData.tutorName || formData.recipient || 'Tutor';
    const autoDesc = `Pembayaran Honor Gaji Tutor Periode ${monthName} ${newYear} - ${tutorPart}`;
    setFormData((prev) => ({
      ...prev,
      periodMonth: newMonth,
      periodYear: newYear,
      description: isSalaryCategory ? autoDesc : prev.description,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description.trim() || formData.amount <= 0) {
      alert('Mohon lengkapi Deskripsi dan Nominal Pengeluaran (harus > 0).');
      return;
    }

    onSave({
      ...(initialData ? { id: initialData.id } : {}),
      date: formData.date,
      category: formData.category,
      paidTo: formData.recipient.trim() || 'Pihak Terkait',
      recipient: formData.recipient.trim() || 'Pihak Terkait',
      title: formData.description.trim(),
      description: formData.description.trim(),
      amount: Number(formData.amount),
      paymentMethod: formData.paymentMethod,
      receiptRef: formData.receiptRef,
      approvedBy: formData.approvedBy,
      ...(isSalaryCategory
        ? {
            periodMonth: formData.periodMonth,
            periodYear: formData.periodYear,
            tutorId: formData.tutorId || undefined,
            tutorName: formData.tutorName || formData.recipient.trim() || undefined,
          }
        : {}),
    });
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div
        id="expense-form-modal"
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8"
      >
        <div className="bg-gradient-to-r from-rose-600 to-amber-700 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-rose-200">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {initialData ? 'Edit Biaya Pengeluaran' : 'Input Biaya Pengeluaran Baru'}
              </h3>
              <p className="text-xs text-rose-100">
                Catat beban operasional, gaji tutor, utilitas, dan perlengkapan
              </p>
            </div>
          </div>
          <button
            onClick={() => onClose?.()}
            className="text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tanggal */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-rose-600" />
                Tanggal Pengeluaran <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-semibold focus:ring-2 focus:ring-rose-500 focus:bg-white transition text-sm"
              />
            </div>

            {/* No. Bukti / Nota */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                No. Bukti / Referensi Nota
              </label>
              <input
                type="text"
                value={formData.receiptRef}
                onChange={(e) => setFormData({ ...formData, receiptRef: e.target.value })}
                placeholder="Nomor bukti / referensi nota"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-mono text-sm focus:ring-2 focus:ring-rose-500 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Kategori Pengeluaran */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-rose-600" />
              Kategori Pengeluaran <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-medium focus:ring-2 focus:ring-rose-500 focus:bg-white transition text-sm cursor-pointer"
            >
              {activeCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Special Helper Card for Gaji Tutor / Pengajar */}
          {isSalaryCategory && (
            <div className="p-4 bg-indigo-50/80 border border-indigo-200/80 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-indigo-900 flex items-center gap-1.5 uppercase tracking-wide">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  Integrasi Otomatis Rekap Gaji Tutor
                </span>
                <span className="text-[11px] font-bold text-indigo-600 bg-white px-2 py-0.5 rounded-full border border-indigo-200">
                  Sinkron ke Rekap Gaji
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Pilih Tutor */}
                <div>
                  <label className="block text-[11px] font-bold text-indigo-900 uppercase tracking-wider mb-1">
                    Pilih Tutor Penerima
                  </label>
                  <select
                    value={formData.tutorId}
                    onChange={(e) => handleSelectTutor(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-xl text-slate-800 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="">-- Pilih Akun Tutor --</option>
                    {tutors.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} (Tutor)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Periode Gaji yang Dibayarkan (Bulan & Tahun) */}
                <div>
                  <label className="block text-[11px] font-bold text-indigo-900 uppercase tracking-wider mb-1">
                    Untuk Periode Gaji Bulan
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <select
                      value={formData.periodMonth}
                      onChange={(e) => handlePeriodChange(Number(e.target.value), formData.periodYear)}
                      className="w-full px-2.5 py-2 bg-white border border-indigo-300 rounded-xl text-slate-800 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      {MONTH_NAMES_ID.map((name, idx) => (
                        <option key={name} value={idx + 1}>
                          {name}
                        </option>
                      ))}
                    </select>

                    <select
                      value={formData.periodYear}
                      onChange={(e) => handlePeriodChange(formData.periodMonth, Number(e.target.value))}
                      className="w-full px-2.5 py-2 bg-white border border-indigo-300 rounded-xl text-slate-800 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 cursor-pointer"
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

              <p className="text-[11px] text-indigo-700 bg-white/70 p-2 rounded-xl border border-indigo-100 flex items-start gap-1.5 leading-relaxed">
                <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Info Pembayaran Lintas Bulan:</strong> Kas keluar riil dicatat pada tanggal pembayaran (misal:{' '}
                  <strong>{formatDateIndo(formData.date)}</strong>), dan sistem akan <strong>otomatis melunasi</strong> status di menu Rekap Gaji periode{' '}
                  <strong>{getMonthNameIndo(formData.periodMonth)} {formData.periodYear}</strong>.
                </span>
              </p>
            </div>
          )}

          {/* Deskripsi & Penerima Dana */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-rose-600" />
                Keterangan / Item Pengeluaran <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Rincian / keperluan pengeluaran"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-sm focus:ring-2 focus:ring-rose-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-rose-600" />
                Dibayarkan Kepada (Penerima)
              </label>
              <input
                type="text"
                value={formData.recipient}
                onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                placeholder="Nama pihak / vendor penerima dana"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-sm focus:ring-2 focus:ring-rose-500 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Nominal & Metode Bayar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-rose-600" />
                  Nominal Biaya (Rp) <span className="text-rose-500">*</span>
                </label>
                <span className="text-xs font-black text-rose-700 font-mono">
                  {formatRupiah(formData.amount || 0)}
                </span>
              </div>
              <input
                type="number"
                min="0"
                step="any"
                required
                placeholder="Masukkan nominal pengeluaran (bebas ganjil/genap)..."
                value={formData.amount === 0 ? '' : formData.amount}
                onChange={(e) => {
                  const val = e.target.value === '' ? 0 : Number(e.target.value);
                  setFormData({ ...formData, amount: isNaN(val) ? 0 : val });
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-rose-700 font-extrabold text-base focus:ring-2 focus:ring-rose-500 focus:bg-white transition"
              />
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[10px] font-bold text-slate-400">Tambah Cepat:</span>
                {[1000, 5000, 10000, 50000, 100000].map((delta) => (
                  <button
                    key={delta}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, amount: (prev.amount || 0) + delta }))}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 border border-slate-200 text-slate-600 rounded-md text-[10px] font-bold transition cursor-pointer"
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
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-medium focus:ring-2 focus:ring-rose-500 focus:bg-white transition text-sm cursor-pointer"
              >
                {paymentMethods.map((pm) => (
                  <option key={pm} value={pm}>
                    {pm}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Disetujui Oleh */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Disetujui / Dicatat Oleh
            </label>
            <input
              type="text"
              value={formData.approvedBy}
              onChange={(e) => setFormData({ ...formData, approvedBy: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-300 rounded-xl text-slate-700 text-sm"
            />
          </div>

          {/* Tombol Aksi */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => onClose?.()}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold rounded-xl text-sm shadow-lg shadow-rose-600/30 flex items-center gap-2 transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {initialData ? 'Perbarui Pengeluaran' : 'Simpan Pengeluaran'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
