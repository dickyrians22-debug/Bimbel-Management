import React, { useState } from 'react';
import {
  TrendingDown,
  PlusCircle,
  Search,
  Filter,
  Download,
  FileEdit,
  Trash2,
  Calendar,
  Layers,
  ArrowDownRight,
  FileSpreadsheet,
} from 'lucide-react';
import { ExpenseRecord, ExpenseCategory, UserRole } from '../../types';
import { formatRupiah, formatDateIndo, MONTH_NAMES_ID } from '../../utils/storage';
import { exportToExcel } from '../../utils/exportUtils';

interface ExpenseViewProps {
  expenses: ExpenseRecord[];
  userRole: UserRole;
  onOpenExpenseModal: (editExpense?: ExpenseRecord) => void;
  onDeleteExpense: (id: string, label: string) => void;
}

export const ExpenseView: React.FC<ExpenseViewProps> = ({
  expenses,
  userRole,
  onOpenExpenseModal,
  onDeleteExpense,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterMonth, setFilterMonth] = useState<string>('All');

  const canEdit = userRole === 'owner';

  // Filtered Expenses
  const filteredExpenses = expenses
    .filter((e) => {
      const expTitle = e.description || e.title || '';
      const expRecipient = e.recipient || e.paidTo || '';
      const expNotes = e.notes || '';
      const term = (searchTerm || '').toLowerCase();

      const matchSearch =
        !term ||
        expTitle.toLowerCase().includes(term) ||
        (e.category || '').toLowerCase().includes(term) ||
        expNotes.toLowerCase().includes(term) ||
        expRecipient.toLowerCase().includes(term);

      const matchCategory = filterCategory === 'All' || e.category === filterCategory;
      const matchMonth =
        filterMonth === 'All' ||
        (e.date && e.date.startsWith(`${new Date().getFullYear()}-${filterMonth.padStart(2, '0')}`));

      return matchSearch && matchCategory && matchMonth;
    })
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const totalFilteredAmount = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const handleExportExcel = () => {
    const dataForExcel = filteredExpenses.map((e, idx) => ({
      'No': idx + 1,
      'Tanggal': e.date,
      'Kategori Pengeluaran': e.category,
      'Keperluan / Judul': e.description || e.title || '-',
      'Nominal Beban (Rp)': e.amount,
      'Penerima / Vendor / Tutor': e.recipient || e.paidTo || '-',
      'Metode Pembayaran': e.paymentMethod || '-',
      'Disetujui Oleh': e.approvedBy || '-',
      'Catatan': e.notes || '-',
    }));

    exportToExcel(
      dataForExcel,
      `Pengeluaran_Bimbel_Sigma_${new Date().toISOString().split('T')[0]}`,
      'Beban Pengeluaran'
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-heading">
                Biaya & Beban Pengeluaran Operasional
              </h2>
              <p className="text-xs text-slate-500">
                Pencatatan beban gaji tutor, sewa gedung, listrik & internet, pembelian modul, dan ATK bimbel
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="btn-export-expense-excel"
            onClick={handleExportExcel}
            className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            title="Unduh seluruh data pengeluaran operasional ke format Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Download Excel (.xlsx)
          </button>

          {canEdit && (
            <button
              id="add-expense-btn"
              onClick={() => onOpenExpenseModal()}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/25 flex items-center gap-1.5 transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              + Catat Pengeluaran Baru
            </button>
          )}
        </div>
      </div>

      {/* Summary Box & Filter */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-rose-600 to-rose-900 text-white p-5 rounded-3xl shadow-lg flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-200">
              Total Beban (Tersaring)
            </span>
            <h3 className="text-2xl font-black font-mono mt-1">
              {formatRupiah(totalFilteredAmount)}
            </h3>
          </div>
          <p className="text-[11px] text-rose-100 mt-3 font-medium">
            {filteredExpenses.length} transaksi beban operasional
          </p>
        </div>

        {/* Filters */}
        <div className="lg:col-span-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari pengeluaran, vendor..."
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 transition"
            />
          </div>

          {/* Filter Kategori */}
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-rose-500"
            >
              <option value="All">Semua Kategori Beban</option>
              <option value="Gaji Tutor / Pengajar">Gaji Tutor / Pengajar</option>
              <option value="Sewa Tempat / Gedung">Sewa Tempat / Gedung</option>
              <option value="Listrik, Internet & Air">Listrik, Internet & Air</option>
              <option value="Modul, ATK & Cetak">Modul, ATK & Cetak</option>
              <option value="Marketing / Iklan">Marketing / Iklan</option>
              <option value="Snack & Konsumsi Siswa">Snack & Konsumsi Siswa</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          {/* Filter Bulan */}
          <div>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-rose-500"
            >
              <option value="All">Semua Bulan</option>
              {MONTH_NAMES_ID.map((name, idx) => (
                <option key={idx + 1} value={String(idx + 1)}>
                  Bulan {name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-600">
            Daftar Beban Pengeluaran ({filteredExpenses.length} data)
          </span>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="text-center py-16 px-4">
            <TrendingDown className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-bold text-slate-700">Belum ada data pengeluaran</p>
            <p className="text-xs text-slate-500 mt-1">
              Klik tombol "+ Catat Pengeluaran Baru" untuk menambahkan pos biaya operasional.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100/70 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Tanggal</th>
                  <th className="py-3.5 px-4">Kategori Beban</th>
                  <th className="py-3.5 px-4">Keperluan / Keterangan</th>
                  <th className="py-3.5 px-4">Nominal</th>
                  <th className="py-3.5 px-4">Penerima / Vendor</th>
                  {canEdit && <th className="py-3.5 px-4 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition">
                    {/* Tanggal */}
                    <td className="py-3 px-4 font-medium text-slate-800 text-xs">
                      {formatDateIndo(exp.date)}
                    </td>

                    {/* Kategori */}
                    <td className="py-3 px-4">
                      <span className="inline-block px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-50 text-rose-800 border border-rose-200">
                        {exp.category}
                      </span>
                    </td>

                    {/* Keperluan */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">
                        {exp.description || exp.title || 'Pengeluaran Bimbel'}
                      </div>
                      {exp.notes && (
                        <p className="text-xs text-slate-400 italic mt-0.5">{exp.notes}</p>
                      )}
                    </td>

                    {/* Nominal */}
                    <td className="py-3 px-4 font-mono font-black text-rose-600 text-sm">
                      {formatRupiah(exp.amount)}
                    </td>

                    {/* Penerima */}
                    <td className="py-3 px-4 text-xs font-medium text-slate-700">
                      {exp.recipient || exp.paidTo || '-'}
                    </td>

                    {/* Aksi */}
                    {canEdit && (
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenExpenseModal(exp)}
                            title="Edit Pengeluaran"
                            className="p-1.5 bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-700 rounded-lg transition cursor-pointer"
                          >
                            <FileEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              onDeleteExpense(
                                exp.id,
                                `${exp.description || exp.title || 'Pengeluaran'} (${formatRupiah(exp.amount)})`
                              )
                            }
                            title="Hapus Pengeluaran"
                            className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
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
