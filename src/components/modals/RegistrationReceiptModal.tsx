import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Printer,
  CheckCircle,
  Download,
  Image as ImageIcon,
  Loader2,
  Phone,
  User,
  BookOpen,
  MapPin,
  Calendar,
  Sparkles,
  MessageCircle,
  FileText,
  Building,
  ShieldCheck,
  School,
  Clock,
} from 'lucide-react';
import { ProspectiveStudent, BimbelSettings } from '../../types';
import { formatDateIndo } from '../../utils/storage';
import { exportElementToPng } from '../../utils/exportUtils';
import { sendWhatsAppDirect } from '../../utils/whatsapp';

interface RegistrationReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  prospectiveStudent: ProspectiveStudent | null;
  settings?: BimbelSettings;
}

export const RegistrationReceiptModal: React.FC<RegistrationReceiptModalProps> = ({
  isOpen,
  onClose,
  prospectiveStudent,
  settings,
}) => {
  const [isExportingImage, setIsExportingImage] = useState(false);
  const receiptContainerRef = useRef<HTMLDivElement>(null);

  // Close modal on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !prospectiveStudent) return null;

  const handlePrint = () => {
    window.print();
  };

  const bimbelName = settings?.bimbelName || 'BIMBEL SIGMA';
  const bimbelTagline = settings?.tagline || 'Belajar Sampai Paham, Bukan Sekadar Hafal';
  const bimbelAddress = settings?.address || 'Karang Muso 06/02 Bicak, Todanan, Blora, Jawa Tengah';
  const bimbelPhone = settings?.phone || '0852-8232-4337';
  const ownerName = settings?.ownerName || 'Nanik Susilowati, M.Pd';
  const effectiveCity = settings?.city || (bimbelAddress.toLowerCase().includes('blora') ? 'Blora' : 'Blora');

  // PPDB Subtitle & Terms (Customizable by Owner, no trial default)
  const ppdbDocSubtitle =
    settings?.ppdbDocSubtitle ||
    'Penerimaan Peserta Didik Baru & Registrasi Program Bimbingan Belajar';

  const ppdbTermsTitle =
    settings?.ppdbTermsTitle || 'KETENTUAN & PETUNJUK PENDAFTARAN:';

  const ppdbTerms =
    settings?.ppdbTerms && settings.ppdbTerms.length > 0
      ? settings.ppdbTerms
      : [
          'Lembar ini merupakan bukti sah pendaftaran calon peserta didik baru di Bimbel.',
          'Admin Bimbel akan segera menghubungi orang tua / wali murid melalui WhatsApp untuk konfirmasi pemilihan jadwal dan mata pelajaran.',
          'Penyelesaian administrasi pendaftaran & SPP dilakukan sebelum sesi pembelajaran pertama dimulai.',
          'Siswa yang telah terdaftar resmi akan mendapatkan akses mandiri ke Portal Siswa untuk memantau absensi dan materi belajar.',
        ];

  // Registration Date
  const regDateFormatted = prospectiveStudent.registrationDate
    ? formatDateIndo(prospectiveStudent.registrationDate)
    : formatDateIndo(new Date().toISOString().slice(0, 10));

  const todayFormatted = formatDateIndo(new Date().toISOString().slice(0, 10));

  const handleDownloadImage = async () => {
    if (!receiptContainerRef.current) return;
    setIsExportingImage(true);
    try {
      const studentNameClean = prospectiveStudent.studentName.replace(/\s+/g, '_');
      const regNumClean = prospectiveStudent.registrationNumber.replace(/\s+/g, '_');
      const fileName = `Bukti_Pendaftaran_${regNumClean}_${studentNameClean}`;
      await exportElementToPng(receiptContainerRef.current, fileName);
    } finally {
      setIsExportingImage(false);
    }
  };

  const handleSendWhatsAppConfirmation = () => {
    const adminPhone = bimbelPhone.replace(/\D/g, '');
    const message =
      `*KONFIRMASI PENDAFTARAN SISWA BARU*\n` +
      `Halo Admin *${bimbelName}*,\n\n` +
      `Saya telah melakukan pendaftaran online dengan rincian data:\n` +
      `• *No. Registrasi:* ${prospectiveStudent.registrationNumber}\n` +
      `• *Nama Calon Siswa:* ${prospectiveStudent.studentName} ${
        prospectiveStudent.nickname ? `(${prospectiveStudent.nickname})` : ''
      }\n` +
      `• *Jenjang & Kelas:* ${prospectiveStudent.gradeDetail || prospectiveStudent.level} (${
        prospectiveStudent.classType
      })\n` +
      `• *Mata Pelajaran:* ${(prospectiveStudent.interestedSubjects || []).join(', ') || 'Semua Pokok'}\n` +
      `• *Orang Tua / No. WA:* ${prospectiveStudent.parentName} (${prospectiveStudent.parentPhone})\n\n` +
      `Mohon informasi lebih lanjut mengenai jadwal belajar dan administrasi pendaftaran. Terima kasih! 🙏`;

    sendWhatsAppDirect(adminPhone || prospectiveStudent.parentPhone, message);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="registration-receipt-modal-card"
        className="w-full max-w-3xl bg-slate-900 rounded-3xl shadow-2xl border border-slate-700/80 overflow-hidden my-4 cursor-default relative flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar (Hidden When Printing) */}
        <div className="no-print bg-slate-900 text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight text-white">
                Bukti Registrasi Pendaftaran Siswa Baru
              </h3>
              <p className="text-[11px] text-slate-400">
                Format Resmi Siap Cetak (A4) / Simpan Gambar PNG
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadImage}
              disabled={isExportingImage}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 active:scale-95 disabled:opacity-50 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              title="Unduh bukti pendaftaran sebagai gambar PNG resolusi tinggi"
            >
              {isExportingImage ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyiapkan PNG...</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Unduh PNG</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              title="Cetak atau Simpan PDF (A4)"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer ml-1"
              title="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Preview Container */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-200/90 flex justify-center items-start">
          <div
            id="printable-registration-receipt"
            ref={receiptContainerRef}
            className="w-full max-w-[660px] bg-white rounded-xl shadow-lg border border-slate-300 p-6 sm:p-8 text-slate-900 space-y-4 print:shadow-none print:border-none print:p-0 print:m-0 print:rounded-none"
          >
            {/* 1. KOP SURAT RESMI */}
            <div className="border-b-2 border-slate-900 pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-950 text-white flex items-center justify-center font-black text-xl tracking-tight shadow-sm shrink-0">
                    {bimbelName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-950 uppercase tracking-tight font-heading leading-none">
                      {bimbelName}
                    </h1>
                    <p className="text-xs font-bold text-amber-700 italic mt-0.5">
                      "{bimbelTagline}"
                    </p>
                    <p className="text-[11px] text-slate-600 leading-tight mt-1">
                      {bimbelAddress} • Telp/WA: <span className="font-semibold text-slate-800">{bimbelPhone}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="inline-block px-2.5 py-1 bg-indigo-100 border border-indigo-200 text-indigo-950 text-[10px] font-black uppercase tracking-wider rounded-md">
                    PPDB 2026/2027
                  </span>
                  <p className="text-[10px] text-slate-400 font-mono mt-1">
                    Ref: {prospectiveStudent.id.slice(0, 8)}
                  </p>
                </div>
              </div>
              <div className="mt-2.5 border-t border-slate-400" />
            </div>

            {/* 2. DOKUMEN TITLE & SUBTITLE */}
            <div className="text-center pt-1 pb-0.5">
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-wide uppercase font-heading">
                BUKTI PENDAFTARAN PESERTA DIDIK BARU
              </h2>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                {ppdbDocSubtitle}
              </p>
            </div>

            {/* 3. REGISTRATION CALLOUT CARD */}
            <div className="p-3.5 sm:p-4 bg-slate-900 text-white rounded-xl shadow-xs flex flex-wrap items-center justify-between gap-3 border border-slate-800">
              <div className="space-y-0.5">
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                  Nomor Registrasi Calon Siswa
                </p>
                <p className="text-xl sm:text-2xl font-black tracking-wider text-amber-400 font-mono">
                  {prospectiveStudent.registrationNumber}
                </p>
                <p className="text-[11px] text-slate-300">
                  Tanggal Registrasi: <span className="text-white font-semibold">{regDateFormatted}</span>
                </p>
              </div>

              <div className="text-right space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Status: {prospectiveStudent.status || 'Terdaftar'}</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Program: <span className="font-bold text-white">Kelas {prospectiveStudent.classType}</span>
                </p>
              </div>
            </div>

            {/* 4. BIODATA & RINCIAN PENDAFTARAN */}
            <div className="border border-slate-300 rounded-xl overflow-hidden">
              <div className="bg-slate-100 px-3.5 py-1.5 border-b border-slate-300 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-700" />
                  <span>Rincian Data Calon Siswa &amp; Orang Tua</span>
                </span>
                <span className="text-[11px] font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  Jenjang: {prospectiveStudent.level}
                </span>
              </div>

              <div className="p-3.5 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-2.5 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Nama Lengkap Siswa:</span>
                  <span className="font-bold text-slate-900 text-sm">{prospectiveStudent.studentName}</span>
                  {prospectiveStudent.nickname && (
                    <span className="text-slate-500 text-xs ml-1">({prospectiveStudent.nickname})</span>
                  )}
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px]">Jenis Kelamin:</span>
                  <span className="font-semibold text-slate-800">
                    {prospectiveStudent.gender === 'L' ? 'Laki-laki (L)' : prospectiveStudent.gender === 'P' ? 'Perempuan (P)' : '-'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px]">Jenjang &amp; Kelas:</span>
                  <span className="font-bold text-slate-900">
                    {prospectiveStudent.gradeDetail || `Jenjang ${prospectiveStudent.level}`}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px]">Asal Sekolah:</span>
                  <span className="font-semibold text-slate-800">
                    {prospectiveStudent.schoolOrigin || '-'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px]">Nama Orang Tua / Wali:</span>
                  <span className="font-bold text-slate-900">{prospectiveStudent.parentName}</span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px]">No. WhatsApp / Telepon:</span>
                  <span className="font-bold text-emerald-700 font-mono">
                    {prospectiveStudent.parentPhone}
                  </span>
                </div>

                <div className="sm:col-span-2">
                  <span className="text-slate-500 block text-[11px]">Mata Pelajaran Diminati:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {(prospectiveStudent.interestedSubjects || []).length > 0 ? (
                      prospectiveStudent.interestedSubjects.map((sub, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-slate-100 text-slate-800 border border-slate-300 text-[11px] font-bold rounded-md"
                        >
                          ✓ {sub}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-600 font-medium">Semua Mata Pelajaran Pokok</span>
                    )}
                  </div>
                </div>

                {prospectiveStudent.preferredSchedule && (
                  <div className="sm:col-span-2">
                    <span className="text-slate-500 block text-[11px]">Preferensi Jadwal Belajar:</span>
                    <span className="font-medium text-slate-800 bg-amber-50/80 text-amber-950 border border-amber-200 px-2 py-0.5 rounded inline-block mt-0.5">
                      📅 {prospectiveStudent.preferredSchedule}
                    </span>
                  </div>
                )}

                {prospectiveStudent.address && (
                  <div className="sm:col-span-2">
                    <span className="text-slate-500 block text-[11px]">Alamat Domisili:</span>
                    <span className="text-slate-700 font-medium">{prospectiveStudent.address}</span>
                  </div>
                )}

                {prospectiveStudent.notes && (
                  <div className="sm:col-span-2">
                    <span className="text-slate-500 block text-[11px]">Catatan Khusus / Target Belajar:</span>
                    <span className="text-slate-700 italic font-medium">"{prospectiveStudent.notes}"</span>
                  </div>
                )}
              </div>
            </div>

            {/* 5. KETENTUAN & PETUNJUK PENDAFTARAN (Disediakan dari Pengaturan Owner) */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-300 space-y-1.5 text-xs">
              <p className="font-bold text-slate-900 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>{ppdbTermsTitle}</span>
              </p>
              <ol className="list-decimal list-inside space-y-1 text-slate-700 text-[11px] leading-relaxed">
                {ppdbTerms.map((term, index) => (
                  <li key={index} className="pl-0.5">
                    {term}
                  </li>
                ))}
              </ol>
            </div>

            {/* 6. TANDA TANGAN & PENGESAHAN */}
            <div className="grid grid-cols-2 gap-6 pt-3 text-xs">
              <div className="text-center flex flex-col justify-between items-center min-h-[90px]">
                <p className="text-slate-600 font-semibold">
                  Orang Tua / Wali Siswa,
                </p>
                <div className="border-t border-slate-900 pt-1 font-bold text-slate-900 min-w-[150px]">
                  ( {prospectiveStudent.parentName || '...........................................'} )
                </div>
              </div>

              <div className="text-center flex flex-col justify-between items-center min-h-[90px]">
                <div>
                  <p className="text-slate-500 text-[10px]">{effectiveCity}, {todayFormatted}</p>
                  <p className="text-slate-800 font-semibold">
                    Administrasi &amp; PPDB {bimbelName},
                  </p>
                </div>
                <div className="border-t border-slate-900 pt-1 font-bold text-slate-900 min-w-[150px]">
                  ( {ownerName} )
                </div>
              </div>
            </div>

            {/* Document Footer */}
            <div className="text-center text-[10px] text-slate-400 border-t border-slate-200 pt-2">
              *Lembar bukti registrasi ini sah diterbitkan secara digital oleh Sistem Manajemen &amp; PPDB {bimbelName}.
            </div>
          </div>
        </div>

        {/* Bottom Actions Bar (Hidden When Printing) */}
        <div className="no-print bg-slate-900 px-5 py-3.5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleSendWhatsAppConfirmation}
            className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition cursor-pointer shadow-sm"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Kirim Bukti ke WhatsApp Admin</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadImage}
              disabled={isExportingImage}
              className="py-2.5 px-4 bg-amber-500 hover:bg-amber-400 active:scale-95 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 transition cursor-pointer shadow-sm"
            >
              <ImageIcon className="w-4 h-4" />
              <span>Simpan Gambar (PNG)</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition cursor-pointer shadow-md shadow-indigo-600/30"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF (A4)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
