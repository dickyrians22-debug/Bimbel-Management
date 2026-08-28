import React, { useState, useRef } from 'react';
import { X, Printer, CheckCircle, GraduationCap, Download, Image as ImageIcon, Loader2 } from 'lucide-react';
import { IncomeRecord, Student, BimbelSettings } from '../../types';
import { formatRupiah, getMonthNameIndo, formatDateIndo } from '../../utils/storage';
import { exportElementToPng } from '../../utils/exportUtils';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose?: () => void;
  income: IncomeRecord;
  student?: Student;
  settings?: BimbelSettings;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  income,
  student,
  settings,
}) => {
  const [isExportingImage, setIsExportingImage] = useState(false);
  const receiptCardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const bimbelName = settings?.bimbelName || 'BIMBEL SIGMA';
  const bimbelTagline = settings?.tagline || 'Belajar Sampai Paham, Bukan Sekadar Hafal';
  const bimbelAddress = settings?.address || 'Karang Muso 06/02 Bicak, Todanan, Blora, Jawa Tengah';
  const bimbelPhone = settings?.phone || '0852-8232-4337';
  const ownerName = settings?.ownerName || 'Nanik Susilowati, M.Pd';

  const handleDownloadImage = async () => {
    if (!receiptCardRef.current) return;
    setIsExportingImage(true);
    try {
      const fileName = `Kwitansi_${income.receiptNumber || 'Bimbel_Sigma'}`;
      await exportElementToPng(receiptCardRef.current, fileName);
    } finally {
      setIsExportingImage(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div
        id="receipt-modal-container"
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8"
      >
        {/* Modal Topbar (Hidden when printing) */}
        <div className="no-print bg-slate-900 text-white p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm">Kwitansi Resmi {bimbelName}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="btn-download-receipt-png"
              onClick={handleDownloadImage}
              disabled={isExportingImage}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              title="Unduh gambar PNG untuk dikirim via WhatsApp"
            >
              {isExportingImage ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menyiapkan PNG...
                </>
              ) : (
                <>
                  <ImageIcon className="w-4 h-4" />
                  Unduh Gambar (PNG)
                </>
              )}
            </button>
            <button
              id="btn-print-receipt"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Cetak / PDF
            </button>
            <button
              onClick={() => onClose?.()}
              className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable & Exportable Kwitansi Content */}
        <div ref={receiptCardRef} id="receipt-printable-content" className="p-8 bg-white text-slate-800 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-indigo-900 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-900 text-white flex items-center justify-center font-black text-2xl font-heading shadow-md">
                Σ
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight text-indigo-950">{bimbelName}</h2>
                <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
                  {bimbelTagline}
                </p>
                <p className="text-[10px] text-slate-500">
                  {bimbelAddress} • Telp/WA: {bimbelPhone}
                </p>
              </div>
            </div>
            <div className="text-right">
              {income.remainingBill && income.remainingBill > 0 ? (
                <span className="inline-block px-3 py-1 bg-amber-100 text-amber-900 font-bold text-xs rounded-full uppercase tracking-wider border border-amber-300">
                  PEMBAYARAN SEBAGIAN (CICILAN)
                </span>
              ) : (
                <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full uppercase tracking-wider border border-emerald-300">
                  LUNAS
                </span>
              )}
              <p className="text-[11px] font-mono font-bold text-slate-600 mt-1">
                {income.receiptNumber}
              </p>
            </div>
          </div>

          <div className="text-center py-1">
            <h3 className="text-base font-extrabold uppercase tracking-widest text-slate-900 border-b border-dashed border-slate-300 pb-2">
              {income.remainingBill && income.remainingBill > 0
                ? 'KWITANSI PEMBAYARAN SEBAGIAN (CICILAN IURAN LES)'
                : income.incomeCategory === 'session_pack'
                ? 'KWITANSI PEMBELIAN PAKET SESI LES'
                : income.incomeCategory === 'registration'
                ? 'KWITANSI BIAYA PENDAFTARAN SISWA'
                : income.incomeCategory === 'general'
                ? 'BUKTI PENERIMAAN KAS MASUK'
                : 'KWITANSI PEMBAYARAN IURAN LES (LUNAS)'}
            </h3>
          </div>

          {/* Details Table */}
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 w-44">Telah Diterima Dari:</span>
              <span className="font-bold text-slate-900 text-right flex-1">
                {income.studentName ? `${income.studentName} (${income.studentCode || '-'})` : (income.sourceName || 'Pembayar')}
              </span>
            </div>
            {student && (
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 w-44">Tingkat / Paket Siswa:</span>
                <span className="font-medium text-slate-800 text-right flex-1">
                  {student.gradeDetail} ({student.classType}) • {student.packageType === 'session_pack' ? 'Paket Sesi' : 'SPP Bulanan'}
                </span>
              </div>
            )}
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 w-44">Untuk Pembayaran:</span>
              <span className="font-bold text-indigo-900 text-right flex-1">
                {income.incomeCategory === 'session_pack'
                  ? `Pembelian Kuota ${income.sessionsCount || 8} Sesi Les (Periode ${getMonthNameIndo(income.accrualMonth)} ${income.accrualYear})`
                  : income.incomeCategory === 'registration'
                  ? 'Biaya Registrasi / Pendaftaran Siswa Baru'
                  : income.incomeCategory === 'general'
                  ? `${income.category || 'Penerimaan Kas Umum'}`
                  : `SPP Les Periode Bulan ${getMonthNameIndo(income.accrualMonth)} ${income.accrualYear} (${income.sessionsCount || 8} Sesi)`}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 w-44">Tanggal Pembayaran:</span>
              <span className="font-medium text-slate-800 text-right flex-1">
                {formatDateIndo(income.datePaid)}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500 w-44">Metode Pembayaran:</span>
              <span className="font-medium text-slate-800 text-right flex-1">
                {income.paymentMethod}
              </span>
            </div>
            {income.remainingBill && income.remainingBill > 0 ? (
              <div className="flex justify-between py-1.5 border-b border-slate-100 text-amber-700 bg-amber-50/50 px-2 rounded-lg">
                <span className="font-semibold w-44">Status Pembayaran:</span>
                <span className="font-bold text-right flex-1">
                  Cicilan (Sisa Tagihan: {formatRupiah(income.remainingBill)} dari Total {formatRupiah(income.totalBill || income.amount)})
                </span>
              </div>
            ) : null}
            {income.notes && (
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 w-44">Keterangan:</span>
                <span className="text-slate-700 italic text-right flex-1 text-xs">
                  {income.notes}
                </span>
              </div>
            )}
          </div>

          {/* Amount Box */}
          {income.remainingBill && income.remainingBill > 0 ? (
            <div className="p-4 bg-amber-50/80 border-2 border-amber-400 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-700">
                <span className="font-semibold">Total Tagihan Periode Ini:</span>
                <span className="font-bold font-mono text-sm text-slate-900">
                  {formatRupiah(income.totalBill || (income.amount + income.remainingBill))}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-amber-200">
                <span className="text-xs uppercase tracking-wider font-extrabold text-emerald-800">
                  JUMLAH DITERIMA SAAT INI (CICILAN):
                </span>
                <span className="text-2xl font-black text-emerald-700 font-mono">
                  {formatRupiah(income.amount)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-amber-200 text-xs">
                <span className="font-bold text-amber-900">SISA KURANG BAYAR:</span>
                <span className="font-black text-sm text-amber-700 font-mono bg-white px-2 py-0.5 rounded border border-amber-300">
                  {formatRupiah(income.remainingBill)}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-emerald-50 border-2 border-emerald-500/40 rounded-2xl flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider font-extrabold text-emerald-800">
                JUMLAH DITERIMA (LUNAS):
              </span>
              <span className="text-2xl font-black text-emerald-700 font-mono">
                {formatRupiah(income.amount)}
              </span>
            </div>
          )}

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-4 text-xs">
            <div className="text-center">
              <p className="text-slate-500 mb-12">Orang Tua / Siswa,</p>
              <div className="border-t border-slate-400 pt-1 font-bold text-slate-800">
                ( ........................................ )
              </div>
            </div>
            <div className="text-center">
              <p className="text-slate-500 mb-12">Penerima (Kasir / Admin),</p>
              <div className="border-t border-slate-400 pt-1 font-bold text-slate-800">
                {income.receivedBy || 'Petugas Kasir'}
              </div>
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-400 border-t border-slate-100 pt-3">
            *Kwitansi ini adalah bukti pembayaran yang sah diterbitkan oleh Sistem Manajemen Operasional Bimbel Sigma.
          </div>
        </div>
      </div>
    </div>
  );
};
