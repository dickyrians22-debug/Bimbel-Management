import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle,
  MinusCircle,
  Search,
  Filter,
  Download,
  Printer,
  FileEdit,
  Trash2,
  Calendar,
  Wallet,
  DollarSign,
  TrendingDown,
  Scale,
  Receipt,
  Eye,
  CreditCard,
  Building2,
  FileSpreadsheet,
  Image as ImageIcon,
} from 'lucide-react';
import { IncomeRecord, ExpenseRecord, UserRole, BimbelSettings } from '../../types';
import {
  formatRupiah,
  formatDateIndo,
  MONTH_NAMES_ID,
  getMonthNameIndo,
  normalizeExpenseCategory,
  normalizeIncomeCategory,
  getSystemSalaryCategory,
  getSystemSppCategory,
  normalizeExpenseRefNumber,
  normalizeIncomeReceiptNumber,
} from '../../utils/storage';
import { exportToExcel, exportElementToPng } from '../../utils/exportUtils';

interface CashBookViewProps {
  incomes: IncomeRecord[];
  expenses: ExpenseRecord[];
  userRole: UserRole;
  settings?: BimbelSettings;
  onOpenIncomeModal: (editIncome?: IncomeRecord) => void;
  onOpenExpenseModal: (editExpense?: ExpenseRecord) => void;
  onDeleteIncome: (id: string, label: string) => void;
  onDeleteExpense: (id: string, label: string) => void;
  onViewReceipt: (income: IncomeRecord) => void;
}

export interface UnifiedTransaction {
  id: string;
  originalId: string;
  type: 'in' | 'out';
  date: string;
  refNumber: string;
  title: string;
  category: string;
  contactName: string;
  paymentMethod: string;
  amountIn: number;
  amountOut: number;
  notes?: string;
  rawIncome?: IncomeRecord;
  rawExpense?: ExpenseRecord;
}

export const CashBookView: React.FC<CashBookViewProps> = ({
  incomes,
  expenses,
  userRole,
  settings,
  onOpenIncomeModal,
  onOpenExpenseModal,
  onDeleteIncome,
  onDeleteExpense,
  onViewReceipt,
}) => {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'in' | 'out'>('all');
  const [filterMonth, setFilterMonth] = useState<string>('All');
  const [filterYear, setFilterYear] = useState<number>(currentYear);
  const [filterMethod, setFilterMethod] = useState<string>('All');
  const [filterCategory, setFilterCategory] = useState<string>('All');

  const canEdit = userRole === 'owner';

  // 1. Combine Incomes and Expenses into a unified list sorted chronologically
  const allTransactions = useMemo<UnifiedTransaction[]>(() => {
    const list: UnifiedTransaction[] = [];

    // Map Incomes
    incomes.forEach((inc, idx) => {
      let desc = inc.notes || '';
      if (inc.incomeCategory === 'session_pack') {
        desc = `Paket ${inc.sessionsCount || 8} Sesi - ${inc.studentName || ''}`;
      } else if (inc.incomeCategory === 'registration') {
        desc = `Pendaftaran Siswa Baru - ${inc.studentName || ''}`;
      } else if (inc.studentName) {
        desc = `Iuran Les ${getMonthNameIndo(inc.accrualMonth)} ${inc.accrualYear} (${inc.sessionsCount || 8} Sesi) - ${inc.studentName}`;
      } else {
        desc = inc.category || 'Penerimaan Kas Masuk';
      }

      const resolvedIncomeCategory = normalizeIncomeCategory(
        inc.category || (inc.incomeCategory === 'registration' ? 'Biaya Pendaftaran / Registrasi' : getSystemSppCategory(settings)),
        settings
      );

      const resolvedRefNumber = normalizeIncomeReceiptNumber(
        inc.receiptNumber,
        inc.datePaid,
        idx + 1
      );

      list.push({
        id: `inc-${inc.id}`,
        originalId: inc.id,
        type: 'in',
        date: inc.datePaid || new Date().toISOString().split('T')[0],
        refNumber: resolvedRefNumber,
        title: desc,
        category: resolvedIncomeCategory,
        contactName: inc.studentName ? `${inc.studentName} (${inc.studentCode || ''})` : (inc.sourceName || 'Penyetor'),
        paymentMethod: inc.paymentMethod || 'Tunai',
        amountIn: inc.amount || 0,
        amountOut: 0,
        notes: inc.notes,
        rawIncome: inc,
      });
    });

    // Map Expenses
    expenses.forEach((exp, idx) => {
      const resolvedExpenseCategory = normalizeExpenseCategory(
        exp.category || getSystemSalaryCategory(settings),
        settings
      );

      const resolvedRefNumber = normalizeExpenseRefNumber(
        exp.receiptRef,
        exp.date,
        idx + 1
      );

      list.push({
        id: `exp-${exp.id}`,
        originalId: exp.id,
        type: 'out',
        date: exp.date || new Date().toISOString().split('T')[0],
        refNumber: resolvedRefNumber,
        title: exp.description || exp.title || 'Pengeluaran Operasional',
        category: resolvedExpenseCategory,
        contactName: exp.recipient || exp.paidTo || 'Penerima / Vendor',
        paymentMethod: exp.paymentMethod || 'Tunai',
        amountIn: 0,
        amountOut: exp.amount || 0,
        notes: exp.notes,
        rawExpense: exp,
      });
    });

    // Sort ascending by date to compute running balance correctly
    list.sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    return list;
  }, [incomes, expenses, settings]);

  // Compute lifetime running balance
  const transactionsWithBalance = useMemo(() => {
    let running = 0;
    return allTransactions.map((tx) => {
      if (tx.type === 'in') {
        running += tx.amountIn;
      } else {
        running -= tx.amountOut;
      }
      return {
        ...tx,
        runningBalance: running,
      };
    });
  }, [allTransactions]);

  // Filtered transactions for display (reversed descending so newest is on top)
  const displayTransactions = useMemo(() => {
    const filtered = transactionsWithBalance.filter((tx) => {
      const term = searchTerm.toLowerCase();
      const matchSearch =
        !term ||
        tx.title.toLowerCase().includes(term) ||
        tx.contactName.toLowerCase().includes(term) ||
        tx.refNumber.toLowerCase().includes(term) ||
        tx.category.toLowerCase().includes(term) ||
        (tx.notes && tx.notes.toLowerCase().includes(term));

      const matchType =
        filterType === 'all' ||
        (filterType === 'in' && tx.type === 'in') ||
        (filterType === 'out' && tx.type === 'out');

      // Date filtering
      const txDate = new Date(tx.date);
      const txMonth = txDate.getMonth() + 1;
      const txYear = txDate.getFullYear();

      const matchMonth = filterMonth === 'All' || txMonth === Number(filterMonth);
      const matchYear = filterYear === 0 || txYear === filterYear;

      const matchMethod = filterMethod === 'All' || tx.paymentMethod === filterMethod;
      const matchCategory = filterCategory === 'All' || tx.category === filterCategory;

      return matchSearch && matchType && matchMonth && matchYear && matchMethod && matchCategory;
    });

    // Show newest first
    return filtered.reverse();
  }, [transactionsWithBalance, searchTerm, filterType, filterMonth, filterYear, filterMethod, filterCategory]);

  // Summary Metrics for current filtered view
  const summary = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;

    displayTransactions.forEach((tx) => {
      totalIn += tx.amountIn;
      totalOut += tx.amountOut;
    });

    const netFlow = totalIn - totalOut;
    const latestBalance = transactionsWithBalance.length > 0 
      ? transactionsWithBalance[transactionsWithBalance.length - 1].runningBalance 
      : 0;

    return {
      totalIn,
      totalOut,
      netFlow,
      latestBalance,
    };
  }, [displayTransactions, transactionsWithBalance]);

  // Unique Categories & Payment Methods
  const allCategories = useMemo(() => {
    const set = new Set<string>();
    (settings?.incomeCategories || []).forEach((c) => {
      if (c && c.trim()) set.add(c.trim());
    });
    (settings?.expenseCategories || []).forEach((c) => {
      if (c && c.trim()) set.add(c.trim());
    });
    allTransactions.forEach((t) => {
      if (t.category && t.category.trim()) set.add(t.category.trim());
    });
    return Array.from(set);
  }, [allTransactions, settings]);

  const allMethods = useMemo(() => {
    const set = new Set<string>();
    allTransactions.forEach((t) => {
      if (t.paymentMethod) set.add(t.paymentMethod);
    });
    return Array.from(set);
  }, [allTransactions]);

  const [isExportingPng, setIsExportingPng] = useState<boolean>(false);

  const handleExportPng = async () => {
    setIsExportingPng(true);
    try {
      const fileName = `Buku_Kas_Bimbel_Sigma_${filterMonth !== 'All' ? `Bulan_${filterMonth}_` : ''}${filterYear}`;
      await exportElementToPng('printable-cashbook-table', fileName);
    } catch (err) {
      console.error('Gagal unduh gambar buku kas:', err);
    } finally {
      setIsExportingPng(false);
    }
  };

  const handleExportExcel = () => {
    const dataForExcel = displayTransactions.map((tx, idx) => ({
      'No': idx + 1,
      'Tanggal': tx.date,
      'Jenis Mutasi': tx.type === 'in' ? 'KAS MASUK' : 'KAS KELUAR',
      'No. Bukti / Ref': tx.refNumber,
      'Uraian Transaksi': tx.title,
      'Kategori': tx.category,
      'Penyetor / Penerima': tx.contactName,
      'Metode / Akun': tx.paymentMethod,
      'Kas Masuk (Debit Rp)': tx.amountIn,
      'Kas Keluar (Kredit Rp)': tx.amountOut,
      'Saldo Berjalan (Rp)': tx.runningBalance,
      'Catatan': tx.notes || '-',
    }));

    exportToExcel(
      dataForExcel,
      `Buku_Kas_Bimbel_Sigma_${filterMonth !== 'All' ? `Bulan_${filterMonth}_` : ''}${filterYear}`,
      'Buku Kas'
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shadow-inner">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-heading">
                Buku Kas Utama & Arus Kas
              </h2>
              <p className="text-xs text-slate-500">
                Pencatatan mutasi kas terpadu (Kas Masuk & Kas Keluar) dengan saldo berjalan otomatis
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {canEdit && (
            <>
              <button
                onClick={() => onOpenIncomeModal()}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                + Catat Kas Masuk
              </button>
              <button
                onClick={() => onOpenExpenseModal()}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              >
                <MinusCircle className="w-4 h-4" />
                - Catat Kas Keluar
              </button>
            </>
          )}

          <button
            id="btn-export-cashbook-excel"
            onClick={handleExportExcel}
            className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            title="Unduh seluruh mutasi buku kas ke format Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Download Excel (.xlsx)
          </button>

          <button
            id="btn-export-cashbook-png"
            onClick={handleExportPng}
            disabled={isExportingPng}
            className="px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-50"
            title="Unduh visual buku kas sebagai gambar PNG"
          >
            <ImageIcon className="w-4 h-4 text-amber-700" />
            <span>{isExportingPng ? 'Menyimpan...' : 'Unduh Gambar (PNG)'}</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Kas Masuk */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Kas Masuk (Debit)
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-emerald-700 font-mono">
              {formatRupiah(summary.totalIn)}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Penerimaan SPP & pemasukan periode terpilih
            </p>
          </div>
        </div>

        {/* Card 2: Total Kas Keluar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Kas Keluar (Kredit)
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-rose-700 font-mono">
              {formatRupiah(summary.totalOut)}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Honor tutor, operasional, & beban usaha
            </p>
          </div>
        </div>

        {/* Card 3: Arus Kas Bersih */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Arus Kas Bersih (Net)
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${summary.netFlow >= 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'}`}>
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className={`text-2xl font-black font-mono ${summary.netFlow >= 0 ? 'text-indigo-700' : 'text-amber-700'}`}>
              {formatRupiah(summary.netFlow)}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Selisih Kas Masuk dikurangi Kas Keluar
            </p>
          </div>
        </div>

        {/* Card 4: Saldo Kas Berjalan */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
              Saldo Akhir Kas & Bank
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/15 text-indigo-200 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-emerald-300 font-mono">
              {formatRupiah(summary.latestBalance)}
            </h3>
            <p className="text-[11px] text-indigo-200 mt-1">
              Posisi saldo riil kas bimbel saat ini
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari transaksi, no bukti, siswa, vendor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-hidden transition"
            />
          </div>

          {/* Filter Type (Semua / Masuk / Keluar) */}
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500 outline-hidden transition"
            >
              <option value="all">Semua Mutasi</option>
              <option value="in">🟢 Kas Masuk Saja</option>
              <option value="out">🔴 Kas Keluar Saja</option>
            </select>
          </div>

          {/* Filter Bulan */}
          <div>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500 outline-hidden transition"
            >
              <option value="All">Semua Bulan</option>
              {MONTH_NAMES_ID.map((m, idx) => (
                <option key={idx} value={String(idx + 1)}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Kategori */}
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500 outline-hidden transition"
            >
              <option value="All">Semua Kategori</option>
              {allCategories.map((cat, idx) => (
                <option key={idx} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Metode / Akun */}
          <div>
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500 outline-hidden transition"
            >
              <option value="All">Semua Akun/Metode</option>
              {allMethods.map((met, idx) => (
                <option key={idx} value={met}>
                  {met}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab Pills for Fast Switch */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                filterType === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua ({transactionsWithBalance.length})
            </button>
            <button
              onClick={() => setFilterType('in')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                filterType === 'in'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              Kas Masuk ({incomes.length})
            </button>
            <button
              onClick={() => setFilterType('out')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                filterType === 'out'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              <ArrowDownRight className="w-3.5 h-3.5" />
              Kas Keluar ({expenses.length})
            </button>
          </div>

          <div className="text-slate-500 text-[11px]">
            Menampilkan <span className="font-bold text-slate-800">{displayTransactions.length}</span> transaksi
          </div>
        </div>
      </div>

      {/* Main Ledger Table */}
      <div id="printable-cashbook-table" className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4 text-center w-12">No</th>
                <th className="py-3.5 px-4">Tanggal & Bukti</th>
                <th className="py-3.5 px-4">Uraian Transaksi & Kontak</th>
                <th className="py-3.5 px-4">Kategori & Akun</th>
                <th className="py-3.5 px-4 text-right">Kas Masuk (Debit)</th>
                <th className="py-3.5 px-4 text-right">Kas Keluar (Kredit)</th>
                <th className="py-3.5 px-4 text-right">Saldo Berjalan</th>
                <th className="py-3.5 px-4 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {displayTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <BookOpen className="w-8 h-8 text-slate-300" />
                      <p className="font-medium">Tidak ada data transaksi kas yang sesuai dengan filter.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                displayTransactions.map((tx, index) => {
                  const isIncome = tx.type === 'in';
                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50/80 transition group"
                    >
                      {/* 1. No */}
                      <td className="py-3.5 px-4 text-center text-slate-400 font-mono text-[11px]">
                        {index + 1}
                      </td>

                      {/* 2. Tanggal & Ref */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">
                          {formatDateIndo(tx.date)}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                              isIncome
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {tx.refNumber}
                          </span>
                        </div>
                      </td>

                      {/* 3. Uraian Transaksi */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-bold text-slate-900 leading-snug">
                          {tx.title}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                          <span className="font-medium text-slate-700">{tx.contactName}</span>
                          {tx.notes && <span className="italic text-slate-400">• {tx.notes}</span>}
                        </div>
                      </td>

                      {/* 4. Kategori & Metode */}
                      <td className="py-3.5 px-4">
                        <div>
                          <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-semibold">
                            {tx.category}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium mt-1 flex items-center gap-1">
                          <CreditCard className="w-3 h-3 text-slate-400" />
                          {tx.paymentMethod}
                        </div>
                      </td>

                      {/* 5. Kas Masuk (Debit) */}
                      <td className="py-3.5 px-4 text-right font-mono">
                        {isIncome ? (
                          <span className="font-black text-emerald-700 text-sm">
                            +{formatRupiah(tx.amountIn)}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* 6. Kas Keluar (Kredit) */}
                      <td className="py-3.5 px-4 text-right font-mono">
                        {!isIncome ? (
                          <span className="font-black text-rose-600 text-sm">
                            -{formatRupiah(tx.amountOut)}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* 7. Saldo Berjalan */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800 text-xs">
                        {formatRupiah(tx.runningBalance)}
                      </td>

                      {/* 8. Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {isIncome && tx.rawIncome && (
                            <button
                              onClick={() => onViewReceipt(tx.rawIncome!)}
                              title="Cetak Kwitansi"
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          )}

                          {canEdit && (
                            <>
                              <button
                                onClick={() => {
                                  if (isIncome && tx.rawIncome) {
                                    onOpenIncomeModal(tx.rawIncome);
                                  } else if (!isIncome && tx.rawExpense) {
                                    onOpenExpenseModal(tx.rawExpense);
                                  }
                                }}
                                title="Edit Transaksi"
                                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                              >
                                <FileEdit className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => {
                                  if (isIncome) {
                                    onDeleteIncome(tx.originalId, tx.title);
                                  } else {
                                    onDeleteExpense(tx.originalId, tx.title);
                                  }
                                }}
                                title="Hapus Transaksi"
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
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
    </div>
  );
};
