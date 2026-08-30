import React, { useState, useEffect } from 'react';
import { AlertOctagon, X, ArrowRight, ArrowLeft, Trash2, CheckCircle2, ShieldAlert, Check } from 'lucide-react';

interface ResetFactoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ResetFactoryModal: React.FC<ResetFactoryModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [isAgreementChecked, setIsAgreementChecked] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const REQUIRED_KEYWORD = 'RESET PABRIK';

  // Reset state on open/close
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setIsAgreementChecked(false);
      setConfirmationInput('');
      setIsProcessing(false);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isProcessing) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isProcessing, onClose]);

  if (!isOpen) return null;

  const isKeywordValid = confirmationInput.trim().toUpperCase() === REQUIRED_KEYWORD;

  const handleFinalExecute = async () => {
    if (!isKeywordValid || isProcessing) return;
    setIsProcessing(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      id="reset-factory-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={isProcessing ? undefined : onClose}
    >
      <div
        id="reset-factory-modal-card"
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-rose-200 overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-rose-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-800 border border-rose-700 flex items-center justify-center text-rose-300">
              <ShieldAlert className="w-6 h-6 text-rose-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-800/80 text-rose-200 border border-rose-700">
                  Verifikasi 2 Langkah
                </span>
                <span className="text-xs font-mono text-rose-300">
                  Langkah {step} dari 2
                </span>
              </div>
              <h2 className="text-base font-bold text-white mt-0.5">
                Reset ke Data Default Pabrik
              </h2>
            </div>
          </div>
          <button
            id="close-reset-modal-btn"
            disabled={isProcessing}
            onClick={onClose}
            className="p-1.5 rounded-lg text-rose-300 hover:text-white hover:bg-rose-800 transition cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="grid grid-cols-2 h-1.5 bg-slate-100">
          <div className="bg-rose-600 transition-all duration-300"></div>
          <div className={`${step === 2 ? 'bg-rose-600' : 'bg-slate-200'} transition-all duration-300`}></div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {step === 1 ? (
            /* STEP 1: IMPACT WARNING & ACKNOWLEDGEMENT */
            <div className="space-y-4">
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-rose-900">
                      Peringatan Penghapusan Total Database
                    </h3>
                    <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                      Tindakan ini akan mengosongkan seluruh data operasional agar Anda dapat mengisi data lembaga bimbel secara bersih dari awal.
                    </p>
                  </div>
                </div>
              </div>

              {/* Scope Checklist */}
              <div className="space-y-2 text-xs">
                <p className="font-bold text-slate-700">Daftar data yang akan dihapus permanen:</p>
                <ul className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <li className="flex items-center gap-2 text-slate-700">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                    <span><strong>Seluruh Data Siswa</strong> & identitas pendaftaran kelas</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-700">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                    <span><strong>Riwayat Presensi & Absensi</strong> harian serta jurnal tutor</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-700">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                    <span><strong>Buku Kas & Transaksi</strong> (SPP siswa, honor pengajar, pengeluaran)</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                    <span>Akun login disederhanakan kembali ke 3 akun standar: <em>Owner Bimbel</em>, <em>Tutor Bimbel</em>, dan <em>Siswa Bimbel</em></span>
                  </li>
                </ul>
              </div>

              {/* Agreement Checkbox */}
              <label className="flex items-start gap-3 p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl cursor-pointer hover:bg-amber-50 transition">
                <input
                  id="reset-agreement-checkbox"
                  type="checkbox"
                  checked={isAgreementChecked}
                  onChange={(e) => setIsAgreementChecked(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 cursor-pointer"
                />
                <span className="text-xs text-amber-950 font-medium leading-relaxed">
                  Saya mengerti sepenuhnya bahwa seluruh data yang terhapus <strong>tidak dapat dikembalikan lagi</strong> dan ingin melanjutkan ke langkah verifikasi kode.
                </span>
              </label>
            </div>
          ) : (
            /* STEP 2: TYPING CONFIRMATION */
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 mb-1">
                  Langkah Keamanan Akhir
                </h3>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Untuk mengonfirmasi bahwa Anda benar-benar berniat mengosongkan database dan bukan karena ketidaksengajaan, silakan ketik kata kunci konfirmasi di bawah ini:
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Ketik persis teks berikut:</span>
                  <span className="px-2 py-0.5 bg-slate-900 text-rose-300 font-mono font-bold rounded tracking-wider text-xs select-all">
                    {REQUIRED_KEYWORD}
                  </span>
                </div>

                <div className="relative">
                  <input
                    id="reset-confirmation-input"
                    type="text"
                    autoFocus
                    value={confirmationInput}
                    onChange={(e) => setConfirmationInput(e.target.value)}
                    placeholder="Ketik RESET PABRIK di sini..."
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm font-bold font-mono tracking-wider transition outline-none ${
                      isKeywordValid
                        ? 'border-emerald-500 bg-emerald-50/30 text-emerald-900 focus:ring-2 focus:ring-emerald-500/20'
                        : confirmationInput.length > 0
                        ? 'border-rose-400 bg-rose-50/20 text-rose-900 focus:ring-2 focus:ring-rose-500/20'
                        : 'border-slate-300 bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                    }`}
                  />
                  {isKeywordValid && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-emerald-600 text-xs font-bold">
                      <Check className="w-4 h-4" />
                      <span>Sesuai</span>
                    </div>
                  )}
                </div>

                {confirmationInput.length > 0 && !isKeywordValid && (
                  <p className="text-[11px] text-rose-600 font-medium">
                    Kata kunci belum sesuai. Pastikan mengetik <strong>{REQUIRED_KEYWORD}</strong> (huruf kapital).
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          {step === 1 ? (
            <>
              <button
                id="cancel-reset-step1-btn"
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                id="next-reset-step2-btn"
                type="button"
                disabled={!isAgreementChecked}
                onClick={() => setStep(2)}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center gap-2 shadow-sm transition cursor-pointer"
              >
                <span>Lanjut ke Verifikasi (Langkah 2)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                id="back-reset-step1-btn"
                type="button"
                disabled={isProcessing}
                onClick={() => setStep(1)}
                className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  id="cancel-reset-step2-btn"
                  type="button"
                  disabled={isProcessing}
                  onClick={onClose}
                  className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  id="execute-factory-reset-btn"
                  type="button"
                  disabled={!isKeywordValid || isProcessing}
                  onClick={handleFinalExecute}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center gap-2 shadow-md shadow-rose-700/20 transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isProcessing ? 'Mengosongkan Database...' : 'KOSONGKAN & RESET SEKARANG'}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
