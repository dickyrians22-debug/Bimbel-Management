import React, { useState, useEffect } from 'react';
import {
  X,
  UserCheck,
  Sparkles,
  GraduationCap,
  DollarSign,
  User,
  Calendar,
  Phone,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
} from 'lucide-react';
import {
  ProspectiveStudent,
  Student,
  UserAccount,
  BimbelSettings,
  ClassType,
  StudentLevel,
} from '../../types';
import { formatRupiah, getTodayDateString } from '../../utils/storage';
import { sendWhatsAppDirect } from '../../utils/whatsapp';

interface ConvertProspectiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  prospective: ProspectiveStudent | null;
  existingStudents: Student[];
  users: UserAccount[];
  settings: BimbelSettings;
  onConfirmConvert: (newStudent: Student, updatedProspective: ProspectiveStudent) => void;
}

export const ConvertProspectiveModal: React.FC<ConvertProspectiveModalProps> = ({
  isOpen,
  onClose,
  prospective,
  existingStudents,
  users,
  settings,
  onConfirmConvert,
}) => {
  if (!isOpen || !prospective) return null;

  // Check if this prospective student was already converted or matches an existing student
  const existingLinkedStudent = existingStudents.find(
    (s) =>
      (prospective.convertedStudentId && s.id === prospective.convertedStudentId) ||
      (prospective.convertedStudentCode && s.code.toUpperCase() === prospective.convertedStudentCode.toUpperCase()) ||
      (s.name.trim().toLowerCase() === prospective.studentName.trim().toLowerCase() &&
        s.parentPhone.replace(/\D/g, '') === prospective.parentPhone.replace(/\D/g, '') &&
        prospective.parentPhone.trim().length > 5)
  );

  // Auto-generate suggested Student Code (NIS)
  const generateSuggestedCode = (): string => {
    if (existingLinkedStudent) {
      return existingLinkedStudent.code;
    }
    if (prospective.convertedStudentCode) {
      return prospective.convertedStudentCode;
    }
    // Check if name has initials or short code
    const namePart = (prospective.nickname || prospective.studentName.split(' ')[0] || 'S')
      .slice(0, 3)
      .toUpperCase();
    const gradeNumberMatch = prospective.gradeDetail.match(/\d+/);
    const gradeNum = gradeNumberMatch ? gradeNumberMatch[0] : '';
    
    let candidate = `${namePart}${gradeNum}`;
    let counter = 1;
    while (existingStudents.some((s) => s.code.toLowerCase() === candidate.toLowerCase())) {
      candidate = `${namePart}${gradeNum}_${counter}`;
      counter++;
    }
    return candidate;
  };

  // Determine default price per session based on level and class type
  const getDefaultPricePerSession = (): number => {
    if (existingLinkedStudent) {
      return existingLinkedStudent.pricePerSession || (existingLinkedStudent.classType === 'Privat' ? 50000 : 5000);
    }
    if (prospective.classType === 'Privat') {
      if (prospective.level === 'PAUD' || prospective.level === 'SD') return 50000;
      if (prospective.level === 'SMP') return 60000;
      if (prospective.level === 'SMA' || prospective.level === 'UTBK') return 75000;
      return 50000;
    } else {
      // Grup
      if (prospective.level === 'PAUD' || prospective.level === 'SD') return 5000;
      if (prospective.level === 'SMP') return 8000;
      if (prospective.level === 'SMA' || prospective.level === 'UTBK') return 15000;
      return 5000;
    }
  };

  const [studentCode, setStudentCode] = useState(existingLinkedStudent ? existingLinkedStudent.code : generateSuggestedCode());
  const [studentName, setStudentName] = useState(existingLinkedStudent ? existingLinkedStudent.name : prospective.studentName);
  const [level, setLevel] = useState<StudentLevel>(existingLinkedStudent ? existingLinkedStudent.level : prospective.level);
  const [gradeDetail, setGradeDetail] = useState(existingLinkedStudent ? existingLinkedStudent.gradeDetail : prospective.gradeDetail);
  const [classType, setClassType] = useState<ClassType>(existingLinkedStudent ? existingLinkedStudent.classType : prospective.classType);
  const [pricePerSession, setPricePerSession] = useState<number>(getDefaultPricePerSession());
  const [monthlyFee, setMonthlyFee] = useState<number>(
    existingLinkedStudent?.monthlyFee || getDefaultPricePerSession() * 8
  );
  const [assignedTutor, setAssignedTutor] = useState<string>(
    existingLinkedStudent?.tutorName ||
      prospective.assignedTutorName ||
      users.find((u) => u.role === 'tutor')?.name ||
      'Tutor Bimbel'
  );
  const [joinDate, setJoinDate] = useState<string>(existingLinkedStudent?.joinDate || getTodayDateString());
  const [parentName, setParentName] = useState(existingLinkedStudent?.parentName || prospective.parentName);
  const [parentPhone, setParentPhone] = useState(existingLinkedStudent?.parentPhone || prospective.parentPhone);
  const [address, setAddress] = useState(existingLinkedStudent?.address || prospective.address || '');
  const [notes, setNotes] = useState(
    existingLinkedStudent?.notes ||
      (prospective.notes
        ? `Konversi PPDB (${prospective.registrationNumber}): ${prospective.notes}`
        : `Pendaftaran via PPDB (${prospective.registrationNumber})`)
  );
  const [errorMsg, setErrorMsg] = useState('');

  const activeTutors = users.filter((u) => u.role === 'tutor' && u.isActive !== false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanCode = studentCode.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMsg('Kode Siswa (NIS) tidak boleh kosong.');
      return;
    }

    // Check code duplication against OTHER students
    const duplicate = existingStudents.find(
      (s) => s.code.toUpperCase() === cleanCode && (!existingLinkedStudent || s.id !== existingLinkedStudent.id)
    );
    if (duplicate) {
      setErrorMsg(`Kode Siswa "${cleanCode}" sudah digunakan oleh siswa lain (${duplicate.name}). Mohon gunakan kode lain.`);
      return;
    }

    // REUSE existing student ID if this prospective was already converted to prevent duplicates!
    const targetStudentId = existingLinkedStudent ? existingLinkedStudent.id : `std-${Date.now()}`;
    const newStudent: Student = {
      id: targetStudentId,
      code: cleanCode,
      name: studentName.trim(),
      level,
      gradeDetail: gradeDetail.trim(),
      classType,
      packageType: 'monthly',
      pricePerSession: Number(pricePerSession) || 0,
      monthlyFee: Number(monthlyFee) || 0,
      parentName: parentName.trim(),
      parentPhone: parentPhone.trim(),
      address: address.trim() || undefined,
      status: 'Aktif',
      joinDate,
      tutorName: assignedTutor,
      notes: notes.trim() || undefined,
      createdAt: existingLinkedStudent?.createdAt || new Date().toISOString(),
    };

    const updatedProspective: ProspectiveStudent = {
      ...prospective,
      status: 'Diterima',
      convertedStudentId: targetStudentId,
      convertedStudentCode: cleanCode,
      assignedTutorName: assignedTutor,
    };

    onConfirmConvert(newStudent, updatedProspective);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black font-heading">
                Terima &amp; Jadikan Siswa Resmi
              </h3>
              <p className="text-xs text-emerald-100">
                Konversi dari Pendaftaran PPDB: <strong>{prospective.registrationNumber}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {existingLinkedStudent && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Calon siswa ini sudah pernah terdaftar di Database Siswa!</p>
                <p className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">
                  Terhubung dengan <strong>{existingLinkedStudent.name}</strong> (NIS: <strong>{existingLinkedStudent.code}</strong>).
                  Menyimpan formulir ini akan <strong>memperbarui profil siswa yang sudah ada</strong> tanpa membuat data duplikat/ganda.
                </p>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Prospective Original Info Card */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-slate-400 block">Pendaftar Awal:</span>
              <strong className="text-slate-900">{prospective.studentName}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">No. WhatsApp Ortu:</span>
              <strong className="text-slate-900">{prospective.parentPhone}</strong>
            </div>
            <div className="col-span-2">
              <span className="text-[10px] text-slate-400 block">Minat Mapel:</span>
              <span className="text-indigo-700 font-semibold">{prospective.interestedSubjects.join(', ')}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kode Siswa / NIS Baru <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={studentCode}
                onChange={(e) => setStudentCode(e.target.value.toUpperCase())}
                placeholder="Contoh: RIZKY5, SGM-026"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold text-indigo-950 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Lengkap Siswa <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Jenjang &amp; Kelas
              </label>
              <input
                type="text"
                value={gradeDetail}
                onChange={(e) => setGradeDetail(e.target.value)}
                placeholder="Contoh: Kelas 5 SD"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tipe Kelas
              </label>
              <select
                value={classType}
                onChange={(e) => {
                  const newType = e.target.value as ClassType;
                  setClassType(newType);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium"
              >
                <option value="Privat">Privat (1-on-1)</option>
                <option value="Grup">Grup / Kelompok</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tarif per Sesi Pembelajaran (Rp) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                value={pricePerSession}
                onChange={(e) => setPricePerSession(Number(e.target.value))}
                step={1000}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-emerald-800"
                required
              />
              <span className="text-[10px] text-slate-400">
                Nilai riil per sesi les: {formatRupiah(pricePerSession)}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tutor Pembimbing yang Ditugaskan
              </label>
              <select
                value={assignedTutor}
                onChange={(e) => setAssignedTutor(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium"
              >
                {activeTutors.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name}
                  </option>
                ))}
                {!activeTutors.some((t) => t.name === assignedTutor) && (
                  <option value={assignedTutor}>{assignedTutor}</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tanggal Mulai Masuk Les (Join Date)
              </label>
              <input
                type="date"
                value={joinDate}
                onChange={(e) => setJoinDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Orang Tua / Wali
              </label>
              <input
                type="text"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Catatan Siswa
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {existingLinkedStudent
                  ? `Perbarui Data Siswa (${existingLinkedStudent.code})`
                  : 'Simpan ke Database Siswa Resmi'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
