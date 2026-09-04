import React, { useRef } from 'react';
import {
  X,
  Printer,
  Download,
  Share2,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  QrCode,
  ShieldCheck,
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { Student, BimbelSettings } from '../../types';
import { UserAvatar } from '../common/UserAvatar';

interface StudentQRCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  settings?: BimbelSettings;
}

export const StudentQRCardModal: React.FC<StudentQRCardModalProps> = ({
  isOpen,
  onClose,
  student,
  settings,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !student) return null;

  const brandTitle = settings?.sidebarFooterTitle || 'BIMBEL SIGMA';
  const brandTagline = (settings?.sidebarFooterTagline || 'Belajar Sampai Paham').replace(/[“”"]/g, '');
  const ownerName = settings?.ownerName || 'Nanik Susilowati, M.Pd';

  // QR Code payload - includes student code and prefix
  const qrPayload = `SIGMA:STUDENT:${student.code}`;

  // Print single card
  const handlePrintCard = () => {
    window.print();
  };

  // Download QR as PNG image
  const handleDownloadPNG = () => {
    const canvas = document.getElementById(`qr-canvas-${student.id}`) as HTMLCanvasElement;
    if (!canvas) return;

    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `Kartu_QR_${student.name.replace(/\s+/g, '_')}_${student.code}.png`;
    link.href = url;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-900 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base font-heading">
                Kartu QR Pelajar Siswa
              </h3>
              <p className="text-[11px] text-indigo-200">
                Gunakan untuk absensi kehadiran instan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: The Physical ID Card Card Layout */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          {/* Printable ID Card */}
          <div
            ref={cardRef}
            id="printable-student-qr-card"
            className="relative bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-indigo-500/30 overflow-hidden flex flex-col items-center text-center space-y-4"
          >
            {/* Background pattern accents */}
            <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-36 h-36 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none" />

            {/* Top Brand Kop */}
            <div className="w-full flex items-center justify-between pb-3 border-b border-white/15">
              <div className="flex items-center gap-2 text-left">
                <div className="w-8 h-8 rounded-xl bg-white text-indigo-900 flex items-center justify-center font-black text-sm shadow-md">
                  Σ
                </div>
                <div>
                  <h4 className="font-extrabold text-xs tracking-wider uppercase">
                    {brandTitle}
                  </h4>
                  <p className="text-[9px] text-indigo-300 font-medium">
                    {brandTagline}
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 uppercase tracking-widest">
                ID CARD
              </span>
            </div>

            {/* Student Avatar & Basic Info */}
            <div className="space-y-1">
              <div className="inline-block p-1 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 shadow-md">
                <UserAvatar name={student.name} role="siswa" size="lg" rounded="rounded-xl" />
              </div>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white font-heading pt-1">
                {student.name}
              </h3>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 bg-emerald-400/20 border border-emerald-400/30 text-emerald-300 rounded-md text-[10px] font-bold">
                  {student.gradeDetail}
                </span>
                <span className="px-2 py-0.5 bg-white/10 text-slate-200 rounded-md text-[10px] font-medium">
                  {student.classType}
                </span>
              </div>
            </div>

            {/* Crisp QR Code Container */}
            <div className="p-3 bg-white rounded-2xl shadow-xl flex flex-col items-center justify-center">
              <QRCodeCanvas
                id={`qr-canvas-${student.id}`}
                value={qrPayload}
                size={160}
                level="H"
                includeMargin={false}
                bgColor="#FFFFFF"
                fgColor="#0F172A"
              />
              <p className="text-[10px] font-mono font-black text-slate-900 tracking-widest mt-2">
                {student.code}
              </p>
            </div>

            {/* Card Footer & Security Note */}
            <div className="w-full pt-1 text-[10px] text-indigo-200/80 flex items-center justify-center gap-1.5 border-t border-white/10">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Kartu Resmi Presensi Digital Bimbel Sigma</span>
            </div>
          </div>

          {/* Quick instructions for parents / tutors */}
          <div className="p-3.5 bg-indigo-50/80 border border-indigo-200/70 rounded-2xl text-xs text-indigo-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-indigo-950">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Cara Penggunaan Kartu:
            </p>
            <ul className="text-[11px] text-indigo-800 space-y-1 pl-4 list-disc">
              <li>Cetak kartu ini atau simpan gambarnya di HP.</li>
              <li>Tunjukkan QR Code ke kamera HP Tutor saat tiba di tempat les.</li>
              <li>Absensi kehadiran akan otomatis tercatat dalam 1 detik.</li>
            </ul>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
          <button
            onClick={handleDownloadPNG}
            className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
            title="Unduh QR Code sebagai gambar PNG"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Unduh QR</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintCard}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-indigo-600/20"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Kartu</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
