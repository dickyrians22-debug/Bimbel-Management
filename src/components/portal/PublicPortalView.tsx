import React, { useState } from 'react';
import {
  Sparkles,
  UserPlus,
  Search,
  BookOpen,
  CalendarCheck2,
  Receipt,
  Phone,
  MapPin,
  Building2,
  CheckCircle2,
  Clock,
  Send,
  Printer,
  ChevronRight,
  ShieldCheck,
  GraduationCap,
  Users,
  Copy,
  Check,
  AlertCircle,
  FileText,
  CreditCard,
  School,
  Calendar,
  MessageCircle,
  ArrowRight,
  LogIn,
  HeartHandshake,
  Star,
  Info,
} from 'lucide-react';
import {
  Student,
  AttendanceRecord,
  IncomeRecord,
  BimbelSettings,
  ProspectiveStudent,
  StudentLevel,
  ClassType,
  UserAccount,
} from '../../types';
import {
  formatRupiah,
  formatDateIndo,
  calculateStudentMonthlySummary,
  generateRegistrationNumber,
  getMonthNameIndo,
  getTodayDateString,
} from '../../utils/storage';
import { sendWhatsAppDirect } from '../../utils/whatsapp';
import { RegistrationReceiptModal } from '../modals/RegistrationReceiptModal';

interface PublicPortalViewProps {
  students: Student[];
  attendance: AttendanceRecord[];
  incomes: IncomeRecord[];
  prospectiveStudents: ProspectiveStudent[];
  settings: BimbelSettings;
  users?: UserAccount[];
  onRegisterProspectiveStudent: (data: ProspectiveStudent) => void;
  onOpenLogin: () => void;
}

export const PublicPortalView: React.FC<PublicPortalViewProps> = ({
  students,
  attendance,
  incomes,
  prospectiveStudents,
  settings,
  users = [],
  onRegisterProspectiveStudent,
  onOpenLogin,
}) => {
  // Navigation tabs in Portal
  const [activeTab, setActiveTab] = useState<'ppdb' | 'cek-mandiri' | 'info'>('ppdb');

  // --- PPDB FORM STATE ---
  const [formData, setFormData] = useState({
    studentName: '',
    nickname: '',
    gender: 'L' as 'L' | 'P',
    birthDate: '',
    schoolOrigin: '',
    level: 'SD' as StudentLevel,
    gradeDetail: 'Kelas 4 SD',
    classType: 'Grup' as ClassType,
    interestedSubjects: [] as string[],
    preferredSchedule: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    address: '',
    notes: '',
  });
  const [selectedSubjectInput, setSelectedSubjectInput] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredResult, setRegisteredResult] = useState<ProspectiveStudent | null>(null);
  const [copiedBank, setCopiedBank] = useState<string | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptModalProspective, setReceiptModalProspective] = useState<ProspectiveStudent | null>(null);

  // --- CEK MANDIRI STATE ---
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [matchedStudent, setMatchedStudent] = useState<Student | null>(null);
  const [matchedProspective, setMatchedProspective] = useState<ProspectiveStudent | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const bimbelName = settings?.bimbelName || 'BIMBEL SIGMA';
  const tagline = settings?.tagline || 'Belajar Sampai Paham, Bukan Sekadar Hafal';
  const logoSymbol = settings?.logoSymbol || 'Σ';
  const contactPhone = settings?.phone || '0812-3456-7890';
  const address = settings?.address || 'Blora, Jawa Tengah';
  const bankInfo = settings?.bankInfo || 'BCA: 8830-1234-56 a.n Bimbel';

  // Common subjects list
  const AVAILABLE_SUBJECTS = [
    'Matematika',
    'IPA',
    'Bahasa Inggris',
    'Bahasa Indonesia',
    'IPS / PKn',
    'Calistung (Baca, Tulis, Hitung)',
    'Persiapan Ujian Sekolah',
    'Persiapan SNBT / UTBK',
    'Semua Mapel (All-in-One)',
  ];

  // Preferred Schedule Options
  const AVAILABLE_DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
  const DAY_PRESETS = [
    { label: 'Senin & Rabu', days: ['Senin', 'Rabu'] },
    { label: 'Selasa & Kamis', days: ['Selasa', 'Kamis'] },
    { label: 'Senin, Rabu, Jumat', days: ['Senin', 'Rabu', 'Jumat'] },
    { label: 'Selasa, Kamis, Sabtu', days: ['Selasa', 'Kamis', 'Sabtu'] },
    { label: 'Weekend (Sabtu-Minggu)', days: ['Sabtu', 'Minggu'] },
  ];
  const TIME_SLOTS = [
    { id: 'pagi', label: 'Pagi (08:00 - 10:00 WIB)', icon: '☀️' },
    { id: 'siang', label: 'Siang (13:00 - 15:00 WIB)', icon: '🌤️' },
    { id: 'sore1', label: 'Sore 1 (15:30 - 17:00 WIB)', icon: '🌅' },
    { id: 'sore2', label: 'Sore 2 (16:00 - 17:30 WIB)', icon: '🌆' },
    { id: 'malam', label: 'Malam (18:30 - 20:00 WIB)', icon: '🌙' },
    { id: 'fleksibel', label: 'Fleksibel / Menyesuaikan', icon: '🕒' },
  ];

  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [scheduleCustomNote, setScheduleCustomNote] = useState<string>('');

  const toggleDay = (day: string) => {
    const updated = selectedDays.includes(day)
      ? selectedDays.filter((d) => d !== day)
      : [...selectedDays, day];
    setSelectedDays(updated);
    updateFormattedSchedule(updated, selectedTimeSlot, scheduleCustomNote);
  };

  const applyDayPreset = (days: string[]) => {
    setSelectedDays(days);
    updateFormattedSchedule(days, selectedTimeSlot, scheduleCustomNote);
  };

  const selectTimeSlot = (slotLabel: string) => {
    const updatedSlot = selectedTimeSlot === slotLabel ? '' : slotLabel;
    setSelectedTimeSlot(updatedSlot);
    updateFormattedSchedule(selectedDays, updatedSlot, scheduleCustomNote);
  };

  const handleCustomNoteChange = (note: string) => {
    setScheduleCustomNote(note);
    updateFormattedSchedule(selectedDays, selectedTimeSlot, note);
  };

  const updateFormattedSchedule = (days: string[], timeSlot: string, customNote: string) => {
    const parts: string[] = [];
    if (days.length > 0) {
      parts.push(`Hari: ${days.join(', ')}`);
    }
    if (timeSlot) {
      parts.push(`Waktu: ${timeSlot}`);
    }
    if (customNote.trim()) {
      parts.push(`(${customNote.trim()})`);
    }
    const combined = parts.join(' | ');
    setFormData((prev) => ({ ...prev, preferredSchedule: combined }));
  };

  const handleSubjectToggle = (subject: string) => {
    setFormData((prev) => {
      const exists = prev.interestedSubjects.includes(subject);
      if (exists) {
        return { ...prev, interestedSubjects: prev.interestedSubjects.filter((s) => s !== subject) };
      } else {
        return { ...prev, interestedSubjects: [...prev.interestedSubjects, subject] };
      }
    });
  };

  const handleAddCustomSubject = () => {
    if (customSubject.trim() && !formData.interestedSubjects.includes(customSubject.trim())) {
      setFormData((prev) => ({
        ...prev,
        interestedSubjects: [...prev.interestedSubjects, customSubject.trim()],
      }));
      setCustomSubject('');
    }
  };

  // Submit PPDB Form
  const handleSubmitPPDB = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentName.trim()) {
      alert('Mohon isi nama lengkap calon siswa.');
      return;
    }
    if (!formData.parentPhone.trim()) {
      alert('Mohon isi nomor WhatsApp aktif orang tua.');
      return;
    }

    setIsSubmitting(true);

    const regNumber = generateRegistrationNumber(prospectiveStudents);
    const newProspective: ProspectiveStudent = {
      id: `ppdb-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      registrationNumber: regNumber,
      studentName: formData.studentName.trim(),
      nickname: formData.nickname.trim() || undefined,
      gender: formData.gender,
      birthDate: formData.birthDate || undefined,
      schoolOrigin: formData.schoolOrigin.trim() || undefined,
      level: formData.level,
      gradeDetail: formData.gradeDetail.trim(),
      classType: formData.classType,
      interestedSubjects: formData.interestedSubjects.length > 0 ? formData.interestedSubjects : ['Semua Mapel'],
      preferredSchedule: formData.preferredSchedule.trim() || undefined,
      parentName: formData.parentName.trim() || 'Orang Tua / Wali',
      parentPhone: formData.parentPhone.trim(),
      parentEmail: formData.parentEmail.trim() || undefined,
      address: formData.address.trim() || undefined,
      notes: formData.notes.trim() || undefined,
      status: 'Baru',
      registrationDate: getTodayDateString(),
      createdAt: new Date().toISOString(),
    };

    setTimeout(() => {
      onRegisterProspectiveStudent(newProspective);
      setRegisteredResult(newProspective);
      setIsSubmitting(false);
    }, 400);
  };

  // Send WhatsApp confirmation for PPDB
  const handleSendWAConfirmation = (student: ProspectiveStudent) => {
    const message = `Halo Admin *${bimbelName}*,

Saya telah mengisi formulir pendaftaran siswa baru secara online melalui Portal:
• *No. Registrasi:* ${student.registrationNumber}
• *Nama Siswa:* ${student.studentName} ${student.nickname ? `(${student.nickname})` : ''}
• *Kelas / Jenjang:* ${student.gradeDetail} (${student.level})
• *Tipe Kelas:* ${student.classType}
• *Mapel Minat:* ${student.interestedSubjects.join(', ')}
• *Nama Ortu:* ${student.parentName}
• *No. WhatsApp:* ${student.parentPhone}
${student.preferredSchedule ? `• *Jadwal Diinginkan:* ${student.preferredSchedule}` : ''}
${student.notes ? `• *Catatan:* ${student.notes}` : ''}

Mohon konfirmasi ketersediaan jadwal & informasi pendaftaran belajar. Terima kasih! 🙏✨`;

    sendWhatsAppDirect(contactPhone, message);
  };

  // Search Cek Mandiri
  const handleSearchMandiri = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    if (!query) return;

    setHasSearched(true);

    // 1. Check in official students database
    const foundStd = students.find((s) => {
      const codeMatch = (s.code || '').toLowerCase() === query;
      const nameMatch = (s.name || '').toLowerCase().includes(query);
      const phoneMatch = (s.parentPhone || '').replace(/[^0-9]/g, '').includes(query.replace(/[^0-9]/g, ''));
      return codeMatch || nameMatch || (query.length >= 4 && phoneMatch);
    });

    // 2. Check in prospective students database
    const foundProsp = prospectiveStudents.find((p) => {
      const regMatch = (p.registrationNumber || '').toLowerCase() === query;
      const nameMatch = (p.studentName || '').toLowerCase().includes(query);
      const phoneMatch = (p.parentPhone || '').replace(/[^0-9]/g, '').includes(query.replace(/[^0-9]/g, ''));
      return regMatch || nameMatch || (query.length >= 4 && phoneMatch);
    });

    setMatchedStudent(foundStd || null);
    setMatchedProspective(foundProsp || null);
  };

  const handleCopyBank = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBank(text);
    setTimeout(() => setCopiedBank(null), 2000);
  };

  // Calculate monthly summary for matched student
  const studentSummary = matchedStudent
    ? calculateStudentMonthlySummary(matchedStudent, selectedMonth, selectedYear, attendance, incomes)
    : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* --- TOP BRAND BAR & PORTAL HEADER --- */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo & Brand */}
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center font-black text-2xl text-white shadow-md shadow-indigo-600/30">
                {logoSymbol}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-indigo-950 tracking-tight font-heading">
                    {bimbelName}
                  </h1>
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-800 uppercase tracking-wide">
                    Portal Publik
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium truncate max-w-xs sm:max-w-md">
                  {tagline}
                </p>
              </div>
            </div>

            {/* Top Right Action: Staff Login Button */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onOpenLogin}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 shadow-xs transition cursor-pointer"
                title="Akses masuk untuk Owner, Tutor & Pengajar"
              >
                <LogIn className="w-4 h-4 text-indigo-600" />
                <span className="hidden sm:inline">Masuk Login Internal</span>
                <span className="sm:hidden">Login</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-t border-slate-100 py-2.5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('ppdb')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === 'ppdb'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Pendaftaran Siswa Baru (PPDB)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('cek-mandiri')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === 'cek-mandiri'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Cek Mandiri Siswa &amp; SPP</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('info')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === 'info'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Info Program &amp; Rekening Resmi</span>
            </button>
          </div>
        </div>
      </header>

      {/* --- HERO BANNER (SUBTLE & INFORMATIVE) --- */}
      <section className="bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-900 text-white py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Pusat Layanan Terpadu Siswa &amp; Calon Siswa Bimbel</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight font-heading leading-tight">
              Selamat Datang di Portal Resmi {bimbelName}
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-300 leading-relaxed">
              Daftarkan ananda secara online, pantau presensi dan materi belajar harian, serta cek status iuran les secara transparan kapan saja.
            </p>
          </div>
        </div>
      </section>

      {/* --- MAIN PORTAL CONTENT --- */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ========================================================================= */}
        {/* TAB 1: PPDB / PENDAFTARAN SISWA BARU ONLINE */}
        {/* ========================================================================= */}
        {activeTab === 'ppdb' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* If successfully registered, show digital proof of registration */}
            {registeredResult ? (
              <div className="bg-white rounded-3xl border border-emerald-200 shadow-xl overflow-hidden p-6 sm:p-10 max-w-3xl mx-auto space-y-6">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 font-heading">
                    Pendaftaran Berhasil Terkirim!
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                    Terima kasih telah mendaftar di <strong>{bimbelName}</strong>. Data calon siswa telah masuk ke sistem kami.
                  </p>
                </div>

                {/* Digital Card Proof */}
                <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-indigo-700/50 space-y-4">
                  <div className="flex items-center justify-between border-b border-indigo-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 font-black flex items-center justify-center text-sm font-heading">
                        {logoSymbol}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-amber-300 uppercase tracking-wider font-heading">
                          BUKTI PENDAFTARAN SISWA BARU
                        </p>
                        <p className="text-[10px] text-slate-300">{bimbelName}</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-amber-400/20 border border-amber-300/30 text-amber-300 font-extrabold rounded-lg text-xs">
                      {registeredResult.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[11px] text-indigo-300 block">Nomor Registrasi (Simpan ini):</span>
                      <span className="text-lg font-black font-mono text-amber-300">
                        {registeredResult.registrationNumber}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] text-indigo-300 block">Nama Calon Siswa:</span>
                      <span className="text-sm font-bold text-white">
                        {registeredResult.studentName} {registeredResult.nickname ? `(${registeredResult.nickname})` : ''}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] text-indigo-300 block">Jenjang &amp; Kelas:</span>
                      <span className="font-semibold text-slate-200">
                        {registeredResult.gradeDetail} • Tipe {registeredResult.classType}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] text-indigo-300 block">Orang Tua / No. WA:</span>
                      <span className="font-semibold text-slate-200">
                        {registeredResult.parentName} ({registeredResult.parentPhone})
                      </span>
                    </div>

                    <div className="sm:col-span-2">
                      <span className="text-[11px] text-indigo-300 block">Pilihan Mata Pelajaran:</span>
                      <span className="font-semibold text-amber-200">
                        {registeredResult.interestedSubjects.join(', ')}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 text-[11px] text-indigo-200 border-t border-indigo-800/80 italic flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    <span>Admin kami akan segera menghubungi Anda untuk konfirmasi jadwal belajar dan informasi administrasi.</span>
                  </div>
                </div>

                {/* Next Action Buttons */}
                <div className="space-y-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleSendWAConfirmation(registeredResult)}
                    className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition cursor-pointer text-sm"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>Konfirmasi Pendaftaran ke WhatsApp Admin</span>
                  </button>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      id="btn-print-ppdb-receipt"
                      onClick={() => {
                        setReceiptModalProspective(registeredResult);
                        setIsReceiptModalOpen(true);
                      }}
                      className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                      title="Buka pratinjau bukti registrasi resmi & cetak / simpan PDF"
                    >
                      <Printer className="w-4 h-4 text-indigo-600" />
                      <span>Cetak Bukti Registrasi</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setRegisteredResult(null);
                        setFormData({
                          studentName: '',
                          nickname: '',
                          gender: 'L',
                          birthDate: '',
                          schoolOrigin: '',
                          level: 'SD',
                          gradeDetail: 'Kelas 4 SD',
                          classType: 'Grup',
                          interestedSubjects: [],
                          preferredSchedule: '',
                          parentName: '',
                          parentPhone: '',
                          parentEmail: '',
                          address: '',
                          notes: '',
                        });
                      }}
                      className="flex-1 py-2.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4 text-indigo-600" />
                      <span>Daftar Siswa Lain</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Column: Form PPDB */}
                <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
                      <UserPlus className="w-4 h-4" />
                      <span>Formulir PPDB Online 2026</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
                      Pendaftaran Siswa Baru {bimbelName}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Silakan lengkapi formulir di bawah ini. Tim kami akan segera menghubungi untuk konsultasi program &amp; jadwal belajar.
                    </p>
                  </div>

                  <form onSubmit={handleSubmitPPDB} className="space-y-6">
                    {/* SECTION 1: DATA CALON SISWA */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-100">
                        <GraduationCap className="w-4 h-4 text-indigo-600" />
                        <span>1. Data Calon Siswa</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Nama Lengkap Siswa <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.studentName}
                            onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                            placeholder="Contoh: Muhammad Rizky Pratama"
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Nama Panggilan
                          </label>
                          <input
                            type="text"
                            value={formData.nickname}
                            onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                            placeholder="Contoh: Rizky"
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Jenis Kelamin
                          </label>
                          <select
                            value={formData.gender}
                            onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'L' | 'P' })}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                          >
                            <option value="L">Laki-laki</option>
                            <option value="P">Perempuan</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Asal Sekolah
                          </label>
                          <input
                            type="text"
                            value={formData.schoolOrigin}
                            onChange={(e) => setFormData({ ...formData, schoolOrigin: e.target.value })}
                            placeholder="Contoh: SDN 1 Blora"
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Jenjang Pendidikan <span className="text-rose-500">*</span>
                          </label>
                          <select
                            value={formData.level}
                            onChange={(e) => {
                              const lvl = e.target.value as StudentLevel;
                              let defGrade = 'Kelas 4 SD';
                              if (lvl === 'PAUD') defGrade = 'PAUD / TK';
                              if (lvl === 'SD') defGrade = 'Kelas 4 SD';
                              if (lvl === 'SMP') defGrade = 'Kelas 8 SMP';
                              if (lvl === 'SMA') defGrade = 'Kelas 11 SMA';
                              if (lvl === 'UTBK') defGrade = 'Persiapan UTBK/SNBT';
                              setFormData({ ...formData, level: lvl, gradeDetail: defGrade });
                            }}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                          >
                            <option value="PAUD">PAUD / TK</option>
                            <option value="SD">Sekolah Dasar (SD)</option>
                            <option value="SMP">Sekolah Menengah Pertama (SMP)</option>
                            <option value="SMA">Sekolah Menengah Atas (SMA/SMK)</option>
                            <option value="UTBK">Alumni / Persiapan UTBK SNBT</option>
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Kelas Saat Ini <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.gradeDetail}
                            onChange={(e) => setFormData({ ...formData, gradeDetail: e.target.value })}
                            placeholder="Contoh: Kelas 4 SD, Kelas 8 SMP, Kelas 12 IPA"
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* SECTION 2: PILIHAN PROGRAM & MAPEL */}
                    <div className="space-y-4 pt-2">
                      <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-100">
                        <BookOpen className="w-4 h-4 text-indigo-600" />
                        <span>2. Pilihan Program &amp; Mata Pelajaran</span>
                      </h4>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2">
                          Tipe Kelas Belajar <span className="text-rose-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <label
                            className={`p-3.5 rounded-2xl border flex items-center gap-3 cursor-pointer transition ${
                              formData.classType === 'Privat'
                                ? 'bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-500/20'
                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <input
                              type="radio"
                              name="classType"
                              value="Privat"
                              checked={formData.classType === 'Privat'}
                              onChange={() => setFormData({ ...formData, classType: 'Privat' })}
                              className="text-indigo-600 focus:ring-indigo-500"
                            />
                            <div>
                              <p className="text-xs font-bold text-slate-900">Kelas Privat (1-on-1)</p>
                              <p className="text-[11px] text-slate-500">1 Siswa 1 Tutor, waktu fleksibel</p>
                            </div>
                          </label>

                          <label
                            className={`p-3.5 rounded-2xl border flex items-center gap-3 cursor-pointer transition ${
                              formData.classType === 'Grup'
                                ? 'bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-500/20'
                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <input
                              type="radio"
                              name="classType"
                              value="Grup"
                              checked={formData.classType === 'Grup'}
                              onChange={() => setFormData({ ...formData, classType: 'Grup' })}
                              className="text-indigo-600 focus:ring-indigo-500"
                            />
                            <div>
                              <p className="text-xs font-bold text-slate-900">Kelas Kelompok (Grup)</p>
                              <p className="text-[11px] text-slate-500">3-6 Siswa sekelas, hemat &amp; seru</p>
                            </div>
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Mata Pelajaran yang Diminati (Pilih Satu atau Lebih):
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {AVAILABLE_SUBJECTS.map((subject) => {
                            const isChecked = formData.interestedSubjects.includes(subject);
                            return (
                              <button
                                key={subject}
                                type="button"
                                onClick={() => handleSubjectToggle(subject)}
                                className={`px-3 py-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between border transition cursor-pointer ${
                                  isChecked
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                <span>{subject}</span>
                                {isChecked && <Check className="w-3.5 h-3.5 shrink-0" />}
                              </button>
                            );
                          })}
                        </div>

                        {/* Custom subject adder */}
                        <div className="flex gap-2 mt-2">
                          <input
                            type="text"
                            value={customSubject}
                            onChange={(e) => setCustomSubject(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddCustomSubject();
                              }
                            }}
                            placeholder="Ketik mapel lain jika tidak ada di atas..."
                            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={handleAddCustomSubject}
                            className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer"
                          >
                            + Tambah
                          </button>
                        </div>
                      </div>

                      {/* PREFERENSI HARI & WAKTU BELAJAR DENGAN PILIHAN OPSI INTERAKTIF */}
                      <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3.5">
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Preferensi Hari Belajar</span>
                            </label>
                            <span className="text-[11px] text-slate-500">Pilih satu atau beberapa hari</span>
                          </div>

                          {/* Quick Day Presets */}
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            <span className="text-[10px] font-bold text-slate-400 self-center mr-1">Paket Cepat:</span>
                            {DAY_PRESETS.map((preset) => {
                              const isActive =
                                preset.days.length === selectedDays.length &&
                                preset.days.every((d) => selectedDays.includes(d));
                              return (
                                <button
                                  key={preset.label}
                                  type="button"
                                  onClick={() => applyDayPreset(preset.days)}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
                                    isActive
                                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                  }`}
                                >
                                  {preset.label}
                                </button>
                              );
                            })}
                          </div>

                          {/* Individual Day Buttons */}
                          <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                            {AVAILABLE_DAYS.map((day) => {
                              const isChecked = selectedDays.includes(day);
                              return (
                                <button
                                  key={day}
                                  type="button"
                                  onClick={() => toggleDay(day)}
                                  className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition cursor-pointer ${
                                    isChecked
                                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-500/20'
                                      : 'bg-white text-slate-700 border-slate-200 hover:bg-indigo-50/50'
                                  }`}
                                >
                                  {day}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Time Slots */}
                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Pilihan Jam / Sesi Belajar</span>
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {TIME_SLOTS.map((slot) => {
                              const isSelected = selectedTimeSlot === slot.label;
                              return (
                                <button
                                  key={slot.id}
                                  type="button"
                                  onClick={() => selectTimeSlot(slot.label)}
                                  className={`px-3 py-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between border transition cursor-pointer ${
                                    isSelected
                                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                  }`}
                                >
                                  <span className="flex items-center gap-1.5">
                                    <span>{slot.icon}</span>
                                    <span>{slot.label}</span>
                                  </span>
                                  {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Custom Detail / Catatan Jam */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Catatan Khusus / Ringkasan Jadwal yang Terpilih:
                          </label>
                          <input
                            type="text"
                            value={formData.preferredSchedule}
                            onChange={(e) => setFormData({ ...formData, preferredSchedule: e.target.value })}
                            placeholder="Contoh: Hari: Senin, Rabu | Waktu: Sore 1 (15:30 - 17:00 WIB) atau teks bebas"
                            className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-indigo-950 focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      {/* INFO TRIAL BERBAYAR & BEBAS BIAYA PENDAFTARAN AWAL */}
                      <div className="p-4 bg-amber-50/90 rounded-2xl border border-amber-200/90 text-xs text-amber-950 space-y-1.5">
                        <div className="flex items-center gap-2 font-bold text-amber-900">
                          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Ketentuan Sesi Trial &amp; Pendaftaran Bimbel</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-amber-900/90">
                          • <strong>Sesi Trial Belajar:</strong> Ananda dapat mencoba 1 sesi trial belajar terlebih dahulu (hanya membayar biaya per sesi trial tersebut, <strong>tanpa biaya pendaftaran di awal</strong>).
                        </p>
                        <p className="text-[11px] leading-relaxed text-amber-900/90">
                          • <strong>Pendaftaran Resmi:</strong> Setelah sesi trial selesai dan ananda merasa cocok dengan metode belajar, barulah orang tua melakukan proses pendaftaran resmi &amp; administrasi paket belajar.
                        </p>
                      </div>
                    </div>

                    {/* SECTION 3: DATA ORANG TUA / WALI */}
                    <div className="space-y-4 pt-2">
                      <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-100">
                        <Users className="w-4 h-4 text-indigo-600" />
                        <span>3. Data Orang Tua / Wali Siswa</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Nama Orang Tua / Wali <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.parentName}
                            onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                            placeholder="Contoh: Bapak Hendra Pratama"
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Nomor WhatsApp Aktif <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="tel"
                            value={formData.parentPhone}
                            onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                            placeholder="Contoh: 081234567890"
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                            required
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Alamat Rumah / Domisili
                          </label>
                          <input
                            type="text"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="Contoh: Jl. Pemuda No. 12, Blora"
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Catatan Khusus / Target Belajar Anak (Opsional)
                          </label>
                          <textarea
                            rows={2}
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Contoh: Ingin fokus penguasaan berhitung cepat dan persiapan ujian tengah semester..."
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-extrabold rounded-2xl shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition cursor-pointer text-sm sm:text-base ${
                        isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Memproses Pendaftaran...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          <span>Kirim Formulir Pendaftaran Siswa Baru</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Right Column: Keunggulan & Layanan Bimbel */}
                <div className="lg:col-span-4 space-y-6">
                  {/* Card 1: Visi & Keunggulan */}
                  <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl p-6 shadow-md border border-indigo-800 space-y-4">
                    <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span>Mengapa Memilih {bimbelName}?</span>
                    </div>

                    <h4 className="text-lg font-black font-heading leading-snug">
                      Pendekatan Personal &amp; Tuntas Sampai Paham
                    </h4>

                    <div className="space-y-3 text-xs text-slate-200">
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-white">Skema Pasca-Bayar Transparan:</strong>
                          <p className="text-slate-300 text-[11px]">Hanya membayar sesi yang benar-benar dihadiri (Presensi × Tarif).</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-white">Jurnal Presensi Digital:</strong>
                          <p className="text-slate-300 text-[11px]">Orang tua dapat memantau materi dan catatan tutor setiap pertemuan secara real-time.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-white">Tutor Berpengalaman:</strong>
                          <p className="text-slate-300 text-[11px]">Didampingi pengajar kompeten dengan metode interaktif yang ramah anak.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Butuh Bantuan / WhatsApp Admin */}
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <Phone className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold uppercase text-slate-500">Konsultasi Langsung</h4>
                        <p className="text-sm font-bold text-slate-900">{contactPhone}</p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      Punya pertanyaan seputar tarif, jadwal les, atau ingin konsultasi materi yang cocok untuk ananda?
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        sendWhatsAppDirect(
                          contactPhone,
                          `Halo Admin ${bimbelName}, saya ingin bertanya mengenai program bimbingan belajar...`
                        )
                      }
                      className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl text-xs flex items-center justify-center gap-2 border border-emerald-200 transition cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Chat WhatsApp Layanan Bimbel</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: CEK MANDIRI SISWA, PRESENSI & SPP */}
        {/* ========================================================================= */}
        {activeTab === 'cek-mandiri' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Search Box */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 max-w-3xl mx-auto space-y-4">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-2">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
                  Cek Mandiri Siswa &amp; Rekap SPP
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Ketik <strong>Kode Siswa (NIS)</strong>, <strong>Nama Siswa</strong>, <strong>No. WhatsApp</strong>, atau <strong>Nomor Registrasi PPDB</strong> untuk mengecek data presensi &amp; iuran.
                </p>
              </div>

              <form onSubmit={handleSearchMandiri} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Contoh: N0, K4, Naureen, 081234567890, atau REG-2026-001"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>Cari Data</span>
                </button>
              </form>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px] text-slate-500">
                <span className="font-semibold text-slate-400">Contoh kode siswa demo:</span>
                {students.slice(0, 5).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSearchQuery(s.code);
                      setHasSearched(true);
                      setMatchedStudent(s);
                      setMatchedProspective(null);
                    }}
                    className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-indigo-100 hover:text-indigo-700 text-slate-700 font-mono font-bold transition cursor-pointer"
                  >
                    {s.code} ({s.name.split(' ')[0]})
                  </button>
                ))}
              </div>
            </div>

            {/* SEARCH RESULTS */}
            {hasSearched && (
              <div className="max-w-4xl mx-auto space-y-6">
                {/* 1. If MATCHED OFFICIAL STUDENT */}
                {matchedStudent && studentSummary && (
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-6 p-6 sm:p-8">
                    {/* Student Identity Card */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                      <div className="flex items-center gap-3.5">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white font-black text-xl flex items-center justify-center font-heading shadow-md">
                          {matchedStudent.code}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-lg font-black text-slate-900 font-heading">
                              {matchedStudent.name}
                            </h4>
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-full">
                              Siswa Aktif
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {matchedStudent.gradeDetail} • Kelas {matchedStudent.classType} • Wali: {matchedStudent.parentName}
                          </p>
                        </div>
                      </div>

                      {/* Month Filter Selector */}
                      <div className="flex items-center gap-2">
                        <select
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(Number(e.target.value))}
                          className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700"
                        >
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                            <option key={m} value={m}>
                              {getMonthNameIndo(m)}
                            </option>
                          ))}
                        </select>
                        <select
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(Number(e.target.value))}
                          className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700"
                        >
                          <option value={2026}>2026</option>
                          <option value={2025}>2025</option>
                        </select>
                      </div>
                    </div>

                    {/* Metric Stats Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl">
                        <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
                          Kehadiran Masuk
                        </span>
                        <p className="text-2xl font-black text-indigo-950 font-heading mt-1">
                          {studentSummary.presentCount} <span className="text-xs font-medium text-indigo-700">Sesi</span>
                        </p>
                      </div>

                      <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl">
                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                          Tarif per Sesi
                        </span>
                        <p className="text-lg font-black text-emerald-950 font-heading mt-1">
                          {formatRupiah(studentSummary.pricePerSession)}
                        </p>
                      </div>

                      <div className="p-4 bg-amber-50/70 border border-amber-100 rounded-2xl">
                        <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                          Total Tagihan Les
                        </span>
                        <p className="text-lg font-black text-amber-950 font-heading mt-1">
                          {formatRupiah(studentSummary.totalBilled)}
                        </p>
                      </div>

                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                          Status Pembayaran
                        </span>
                        <span
                          className={`inline-block mt-1 px-2.5 py-1 rounded-lg text-xs font-extrabold ${
                            studentSummary.paymentStatus === 'Lunas'
                              ? 'bg-emerald-100 text-emerald-800'
                              : studentSummary.paymentStatus === 'Lebih Bayar'
                              ? 'bg-purple-100 text-purple-800'
                              : studentSummary.paymentStatus === 'Kurang Bayar'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {studentSummary.paymentStatus}
                        </span>
                      </div>
                    </div>

                    {/* SECTION: JURNAL PRESENSI & MATERI */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                          <CalendarCheck2 className="w-4 h-4 text-indigo-600" />
                          <span>Riwayat Presensi &amp; Materi Pembelajaran ({getMonthNameIndo(selectedMonth)} {selectedYear})</span>
                        </h5>
                        <span className="text-[11px] text-slate-500 font-semibold">
                          Total {studentSummary.records.length} Pertemuan Tercatat
                        </span>
                      </div>

                      {studentSummary.records.length === 0 ? (
                        <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xs text-slate-500">
                          Belum ada sesi pembelajaran yang tercatat pada bulan {getMonthNameIndo(selectedMonth)} {selectedYear}.
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                          {studentSummary.records.map((rec, idx) => (
                            <div key={rec.id || idx} className="p-3.5 bg-white hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                              <div className="flex items-start gap-3">
                                <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                                  {idx + 1}
                                </span>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900">
                                      {formatDateIndo(rec.date)}
                                    </span>
                                    <span className="text-slate-400">•</span>
                                    <span className="text-slate-600 font-medium">{rec.time || '15:30'} WIB</span>
                                    <span
                                      className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                                        rec.status === 'Hadir'
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : rec.status === 'Izin'
                                          ? 'bg-amber-100 text-amber-800'
                                          : rec.status === 'Sakit'
                                          ? 'bg-blue-100 text-blue-800'
                                          : 'bg-rose-100 text-rose-800'
                                      }`}
                                    >
                                      {rec.status}
                                    </span>
                                  </div>
                                  <p className="text-slate-800 font-semibold mt-1">
                                    Materi: {rec.topic || 'Pendalaman Materi & Latihan Soal'}
                                  </p>
                                  {rec.tutorNotes && (
                                    <p className="text-slate-500 text-[11px] mt-0.5 italic">
                                      Catatan Tutor: “{rec.tutorNotes}”
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="text-left sm:text-right shrink-0">
                                <span className="text-[10px] text-slate-400 block">Tutor Pembimbing</span>
                                <span className="font-bold text-slate-700 text-xs">{rec.tutorName}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* SECTION: PEMBAYARAN & REKENING RESMI */}
                    {studentSummary.balanceRemaining > 0 && (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
                        <div className="flex items-start gap-2 text-xs text-amber-900">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold">Informasi Pembayaran Iuran Les</p>
                            <p className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
                              Sisa tagihan yang belum dibayarkan sebesar <strong>{formatRupiah(studentSummary.balanceRemaining)}</strong>. Pembayaran dapat ditransfer ke rekening resmi bimbel di bawah ini:
                            </p>
                          </div>
                        </div>

                        <div className="p-3 bg-white border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-xs">
                          <div className="font-mono font-bold text-slate-800">
                            {bankInfo}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyBank(bankInfo)}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs flex items-center gap-1 transition cursor-pointer"
                          >
                            {copiedBank === bankInfo ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-600">Disalin</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-slate-500" />
                                <span>Salin</span>
                              </>
                            )}
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const msg = `Halo Admin *${bimbelName}*, saya ingin konfirmasi pembayaran iuran les atas nama siswa *${matchedStudent.name}* (${matchedStudent.code}) untuk periode *${getMonthNameIndo(selectedMonth)} ${selectedYear}* dengan nominal *${formatRupiah(studentSummary.balanceRemaining)}*.`;
                            sendWhatsAppDirect(contactPhone, msg);
                          }}
                          className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Konfirmasi Pembayaran via WhatsApp</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. If MATCHED PROSPECTIVE STUDENT */}
                {matchedProspective && (
                  <div className="bg-white rounded-3xl border border-indigo-200 shadow-sm p-6 sm:p-8 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 font-bold flex items-center justify-center">
                          <UserPlus className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-base font-black text-slate-900 font-heading">
                            {matchedProspective.studentName}
                          </h4>
                          <p className="text-xs text-slate-500 font-mono">
                            No. Registrasi: {matchedProspective.registrationNumber}
                          </p>
                        </div>
                      </div>

                      <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-extrabold rounded-full">
                        Status: {matchedProspective.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-[11px] text-slate-400 block">Jenjang / Kelas:</span>
                        <span className="font-bold text-slate-800">
                          {matchedProspective.gradeDetail} • Tipe {matchedProspective.classType}
                        </span>
                      </div>

                      <div>
                        <span className="text-[11px] text-slate-400 block">Tanggal Mendaftar:</span>
                        <span className="font-bold text-slate-800">
                          {formatDateIndo(matchedProspective.registrationDate)}
                        </span>
                      </div>

                      <div className="sm:col-span-2">
                        <span className="text-[11px] text-slate-400 block">Mata Pelajaran yang Diminati:</span>
                        <span className="font-bold text-indigo-700">
                          {matchedProspective.interestedSubjects.join(', ')}
                        </span>
                      </div>

                      {matchedProspective.trialDate && (
                        <div className="sm:col-span-2 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                          <span className="text-[11px] text-indigo-800 font-bold block">
                            📅 Jadwal Sesi Trial Belajar:
                          </span>
                          <span className="text-xs font-black text-indigo-950">
                            {formatDateIndo(matchedProspective.trialDate)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setReceiptModalProspective(matchedProspective);
                          setIsReceiptModalOpen(true);
                        }}
                        className="flex-1 py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 active:scale-95 text-indigo-800 font-bold rounded-xl text-xs flex items-center justify-center gap-2 border border-indigo-200 transition cursor-pointer"
                      >
                        <Printer className="w-4 h-4 text-indigo-600" />
                        <span>Cetak Bukti Pendaftaran</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSendWAConfirmation(matchedProspective)}
                        className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Hubungi Admin via WA</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. If NOT FOUND */}
                {!matchedStudent && !matchedProspective && (
                  <div className="p-8 bg-white border border-rose-200 rounded-3xl text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <h4 className="text-base font-bold text-slate-900">
                      Data Tidak Ditemukan
                    </h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Pencarian dengan kata kunci “<strong>{searchQuery}</strong>” tidak ditemukan di database siswa aktif maupun pendaftaran PPDB.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('ppdb')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Daftar Siswa Baru Sekarang</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: INFO PROGRAM, KEUNGGULAN & REKENING RESMI */}
        {/* ========================================================================= */}
        {activeTab === 'info' && (
          <div className="space-y-8 animate-in fade-in duration-300 max-w-5xl mx-auto">
            {/* Profile Overview */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-16 h-16 rounded-3xl bg-indigo-600 text-white flex items-center justify-center font-black text-3xl font-heading shadow-md shrink-0">
                  {logoSymbol}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 font-heading">
                    {bimbelName}
                  </h3>
                  <p className="text-sm font-bold text-amber-700">
                    “{tagline}”
                  </p>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{address}</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-2">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                    <School className="w-4 h-4" />
                  </div>
                  <h5 className="font-bold text-slate-900 text-sm">Jenjang Terpadu</h5>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Melayani bimbingan belajar tingkat PAUD/TK, SD, SMP, SMA/SMK, hingga persiapan UTBK SNBT &amp; Ujian Kedinasan.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <HeartHandshake className="w-4 h-4" />
                  </div>
                  <h5 className="font-bold text-slate-900 text-sm">Metode Pasca-Bayar</h5>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Belajar dulu baru bayar sesuai jumlah kehadiran riil (Presensi × Tarif per sesi). Adil dan transparan.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h5 className="font-bold text-slate-900 text-sm">Presensi Realtime</h5>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Jurnal belajar digital mencatat topik materi dan catatan perkembangan anak yang bisa dipantau langsung orang tua.
                  </p>
                </div>
              </div>
            </div>

            {/* Rekening Resmi Pembayaran SPP */}
            <div className="bg-gradient-to-br from-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md border border-indigo-800 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-black font-heading text-white">
                    Rekening Resmi Pembayaran
                  </h4>
                  <p className="text-xs text-slate-300">
                    Gunakan selalu rekening resmi berikut untuk transaksi iuran les &amp; biaya pendaftaran:
                  </p>
                </div>
              </div>

              <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="font-mono text-sm sm:text-base font-bold text-amber-300">
                  {bankInfo}
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyBank(bankInfo)}
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0"
                >
                  {copiedBank === bankInfo ? (
                    <>
                      <Check className="w-4 h-4 text-slate-950" />
                      <span>Berhasil Disalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Salin Nomor Rekening</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-slate-400 italic">
                * Setelah melakukan transfer, harap kirimkan foto struk / bukti transfer ke nomor WhatsApp Admin untuk penerbitan Kwitansi Resmi.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* --- FOOTER --- */}
      <footer className="bg-white border-t border-slate-200 py-8 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 space-y-2">
        <p className="font-bold text-slate-700">
          © {new Date().getFullYear()} {bimbelName} • Sistem Portal Layanan Terpadu &amp; Presensi Digital
        </p>
        <p className="text-[11px] text-slate-400">
          {address} • Hubungi Admin: {contactPhone}
        </p>
      </footer>
      {/* --- REGISTRATION RECEIPT MODAL --- */}
      <RegistrationReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setReceiptModalProspective(null);
        }}
        prospectiveStudent={receiptModalProspective}
        settings={settings}
      />
    </div>
  );
};
