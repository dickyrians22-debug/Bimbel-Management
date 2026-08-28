import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  PlusCircle,
  Search,
  Filter,
  Download,
  FileEdit,
  Trash2,
  Printer,
  Calendar,
  CreditCard,
  Sparkles,
  ArrowUpRight,
  Receipt,
  User,
  FileSpreadsheet,
  Tag,
} from 'lucide-react';
import { IncomeRecord, Student, UserRole, BimbelSettings } from '../../types';
import {
  formatRupiah,
  formatDateIndo,
  MONTH_NAMES_ID,
  getMonthNameIndo,
} from '../../utils/storage';
import { exportToExcel } from '../../utils/exportUtils';

interface IncomeViewProps {
  incomes: IncomeRecord[];
  students: Student[];
  userRole: UserRole;
  settings?: BimbelSettings | null;
  onOpenIncomeModal: (editIncome?: IncomeRecord) => void;
  onDeleteIncome: (id: string, label: string) => void;
  onViewReceipt: (income: IncomeRecord) => void;
}

export const IncomeView: React.FC<IncomeViewProps> = ({
  incomes,
  students,
  userRole,
  settings,
  onOpenIncomeModal,
  onDeleteIncome,
  onViewReceipt,
}) => {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterAccrualMonth, setFilterAccrualMonth] = useState<string>('All');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>('All');
  const [filterStudentId, setFilterStudentId] = useState<string>('All');
  const [filterCategory, setFilterCategory] = useState<string>('All');

  const canEdit = userRole === 'owner';

  // Available Categories from Settings + Incomes
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    if (settings?.incomeCategories) {
      settings.incomeCategories.forEach((c) => set.add(c));
    }
    incomes.forEach((i) => {
      if (i.category) set.add(i.category);
    });
    return Array.from(set);
  }, [settings?.incomeCategories, incomes]);

  // Filtered Incomes
  const filteredIncomes = incomes
    .filter((i) => {
      const student = students.find((s) => s.id === i.studentId);
      const studentName = student?.name || i.studentName || '';
      const studentCode = student?.code || i.studentCode || '';

      const term = (searchTerm || '').toLowerCase();
      const matchSearch =
        !term ||
        studentName.toLowerCase().includes(term) ||
        studentCode.toLowerCase().includes(term) ||
        (i.sourceName && i.sourceName.toLowerCase().includes(term)) ||
        (i.receiptNumber || '').toLowerCase().includes(term) ||
        (i.category && i.category.toLowerCase().includes(term)) ||
        (i.notes && (i.notes || '').toLowerCase().includes(term));

      const matchMonth =
        filterAccrualMonth === 'All' || String(i.accrualMonth) === filterAccrualMonth;
      const matchMethod =
        filterPaymentMethod === 'All' || i.paymentMethod === filterPaymentMethod;
      const matchStudent =
        filterStudentId === 'All' || i.studentId === filterStudentId;
      const matchCategory =
        filterCategory === 'All' || (i.category || 'Pembayaran SPP Siswa') === filterCategory;

      return matchSearch && matchMonth && matchMethod && matchStudent && matchCategory;
    })
    .sort((a, b) => (b.datePaid || '').localeCompare(a.datePaid || ''));

  const totalFilteredAmount = filteredIncomes.reduce((sum, i) => sum + (i.amount || 0), 0);

  const handleExportExcel = () => {
    const dataForExcel = filteredIncomes.map((i, idx) => {
      const student = students.find((s) => s.id === i.studentId);
      const studentName = student?.name || i.studentName || i.sourceName || '-';
      const studentCode = student?.code || i.studentCode || '-';

      return {
        'No': idx + 1,
        'No. Kwitansi / Ref': i.receiptNumber || '-',
        'Tanggal Bayar': i.datePaid,
        'Kategori': i.category || 'Pembayaran SPP Siswa',
        'Kode Siswa': studentCode,
        'Nama Siswa / Pembayar': studentName,
        'Bulan Layanan (Accrual)': getMonthNameIndo(i.accrualMonth),
        'Tahun Layanan (Accrual)': i.accrualYear,
        'Jumlah Sesi': i.sessionsCount || 0,
        'Nominal (Rp)': i.amount,
        'Metode Pembayaran': i.paymentMethod,
        'Diterima Oleh': i.receivedBy || '-',
        'Keterangan': i.notes || '-',
      };
    });

    exportToExcel(
      dataForExcel,
      `Kas_Masuk_Bimbel_Sigma_${new Date().toISOString().split('T')[0]}`,
      'Kas Masuk'
    );
  };


  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 font-heading">
                  Kas Masuk & Iuran SPP Siswa
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-100 text-indigo-800">
                  Accrual Basis Accounting
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Pencatatan pendapatan les dialokasikan ke bulan layanan belajar berlangsung
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="btn-export-income-excel"
            onClick={handleExportExcel}
            className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            title="Unduh seluruh data kas masuk SPP ke format Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Download Excel (.xlsx)
          </button>

          {canEdit && (
            <button
              id="add-income-btn"
              onClick={() => onOpenIncomeModal()}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/25 flex items-center gap-1.5 transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              + Catat Kas Masuk (SPP)
            </button>
          )}
        </div>
      </div>

      {/* Summary Box & Filter */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-600 to-teal-800 text-white p-5 rounded-3xl shadow-lg flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
              Total Pemasukan (Tersaring)
            </span>
            <h3 className="text-2xl font-black font-mono mt-1">
              {formatRupiah(totalFilteredAmount)}
            </h3>
          </div>
          <p className="text-[11px] text-emerald-100 mt-3 font-medium">
            {filteredIncomes.length} transaksi penerimaan tercatat
          </p>
        </div>

        {/* Filters */}
        <div className="lg:col-span-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari kwitansi / siswa..."
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition"
            />
          </div>

          {/* Filter Kategori */}
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-emerald-500 cursor-pointer truncate"
            >
              <option value="All">Semua Kategori Kas</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Bulan Accrual */}
          <div>
            <select
              value={filterAccrualMonth}
              onChange={(e) => setFilterAccrualMonth(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="All">Semua Bulan Accrual</option>
              {MONTH_NAMES_ID.map((name, idx) => (
                <option key={idx + 1} value={String(idx + 1)}>
                  Bulan {name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Metode Bayar */}
          <div>
            <select
              value={filterPaymentMethod}
              onChange={(e) => setFilterPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="All">Semua Metode Bayar</option>
              <option value="Tunai">Tunai</option>
              <option value="Transfer BCA">Transfer BCA</option>
              <option value="Transfer Mandiri">Transfer Mandiri</option>
              <option value="Transfer BRI">Transfer BRI</option>
              <option value="Transfer BNI">Transfer BNI</option>
              <option value="QRIS">QRIS</option>
              <option value="GoPay / OVO / Dana">GoPay / OVO / Dana</option>
            </select>
          </div>
        </div>
      </div>

      {/* Incomes Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-600">
            Daftar Kas Masuk ({filteredIncomes.length} data)
          </span>
          <span className="text-[11px] text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-bold">
            Accrual Month: Periode Layanan
          </span>
        </div>

        {filteredIncomes.length === 0 ? (
          <div className="text-center py-16 px-4">
            <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-bold text-slate-700">Belum ada data kas masuk</p>
            <p className="text-xs text-slate-500 mt-1">
              Gunakan tombol "+ Catat Kas Masuk (SPP)" untuk menambahkan pembayaran siswa.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100/70 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">No. Kwitansi & Tgl Bayar</th>
                  <th className="py-3.5 px-4">Nama Siswa / Pembayar</th>
                  <th className="py-3.5 px-4">Periode Les (Accrual)</th>
                  <th className="py-3.5 px-4">Nominal</th>
                  <th className="py-3.5 px-4">Metode Bayar</th>
                  <th className="py-3.5 px-4">Penerima</th>
                  <th className="py-3.5 px-4 text-right">Kwitansi & Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredIncomes.map((inc) => {
                  const student = students.find((s) => s.id === inc.studentId);
                  const displayStudentName = student?.name || inc.studentName || inc.sourceName || 'Pemasukan Kas';
                  const displayStudentCode = student?.code || inc.studentCode;

                  return (
                    <tr key={inc.id} className="hover:bg-slate-50/80 transition">
                      {/* No Kwitansi & Tgl */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-indigo-700 text-xs">
                          {inc.receiptNumber}
                        </div>
                        <span className="text-[11px] text-slate-500">{formatDateIndo(inc.datePaid)}</span>
                      </td>

                      {/* Siswa / Sumber Kas */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">
                          {displayStudentName}
                        </div>
                        {displayStudentCode && (
                          <span className="text-[10px] font-mono font-bold text-slate-400 block">
                            {displayStudentCode}
                          </span>
                        )}
                        <span className={`inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          inc.category?.toLowerCase().includes('daftar') || inc.category?.toLowerCase().includes('registrasi')
                            ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                            : inc.category?.toLowerCase().includes('modul') || inc.category?.toLowerCase().includes('buku')
                            ? 'bg-teal-50 text-teal-800 border border-teal-200'
                            : inc.category?.toLowerCase().includes('try out') || inc.category?.toLowerCase().includes('ujian')
                            ? 'bg-purple-50 text-purple-800 border border-purple-200'
                            : inc.category?.toLowerCase().includes('event') || inc.category?.toLowerCase().includes('workshop')
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}>
                          {inc.category || 'Pembayaran SPP Siswa'}
                        </span>
                      </td>

                    {/* Periode Accrual */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 font-bold text-indigo-900 text-xs px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200">
                        Bulan {getMonthNameIndo(inc.accrualMonth)} {inc.accrualYear}
                      </span>
                      {inc.sessionsCount ? (
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {inc.sessionsCount} Sesi Les
                        </div>
                      ) : null}
                    </td>

                    {/* Nominal & Status Tagihan */}
                    <td className="py-3 px-4">
                      <div className="font-mono font-black text-emerald-700 text-sm">
                        {formatRupiah(inc.amount)}
                      </div>
                      {inc.remainingBill && inc.remainingBill > 0 ? (
                        <div className="mt-0.5 text-[10px] font-bold text-amber-600">
                          Cicilan (Sisa: {formatRupiah(inc.remainingBill)})
                        </div>
                      ) : (
                        <div className="mt-0.5 text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                          ✓ Lunas
                        </div>
                      )}
                    </td>

                    {/* Metode Bayar */}
                    <td className="py-3 px-4">
                      <span className="text-xs font-semibold text-slate-800">
                        {inc.paymentMethod}
                      </span>
                      {inc.notes && (
                        <p className="text-[10px] text-slate-400 italic truncate max-w-xs">{inc.notes}</p>
                      )}
                    </td>

                    {/* Penerima */}
                    <td className="py-3 px-4 text-xs text-slate-600">
                      {inc.receivedBy || 'Bimbel Sigma'}
                    </td>

                    {/* Aksi & Kwitansi */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onViewReceipt(inc)}
                          title="Lihat & Cetak Kwitansi"
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg flex items-center gap-1 transition cursor-pointer"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          Kwitansi
                        </button>

                        {canEdit && (
                          <>
                            <button
                              onClick={() => onOpenIncomeModal(inc)}
                              title="Edit Kas Masuk"
                              className="p-1.5 bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-700 rounded-lg transition cursor-pointer"
                            >
                              <FileEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                onDeleteIncome(
                                  inc.id,
                                  `${inc.receiptNumber} (${inc.studentName} - ${formatRupiah(inc.amount)})`
                                )
                              }
                              title="Hapus Kas Masuk"
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
      </div>
    </div>
  );
};
