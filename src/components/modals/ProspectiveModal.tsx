import React, { useState, useEffect } from 'react';
import {
  X,
  UserPlus,
  Save,
  GraduationCap,
  Users,
  BookOpen,
  Calendar,
  AlertCircle,
  Clock,
  Check,
  Sparkles,
} from 'lucide-react';
import {
  ProspectiveStudent,
  ProspectiveStudentStatus,
  StudentLevel,
  ClassType,
  UserAccount,
  BimbelSettings,
} from '../../types';
import { generateRegistrationNumber, getTodayDateString } from '../../utils/storage';

interface ProspectiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ProspectiveStudent) => void;
  initialData?: ProspectiveStudent | null;
  existingList: ProspectiveStudent[];
  users: UserAccount[];
  settings: BimbelSettings;
}

export const ProspectiveModal: React.FC<ProspectiveModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  existingList,
  users,
  settings,
}) => {
  if (!isOpen) return null;

  const AVAILABLE_DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
  const DAY_PRESETS = [
    { label: 'Senin & Rabu', days: ['Senin', 'Rabu'] },
    { label: 'Selasa & Kamis', days: ['Selasa', 'Kamis'] },
    { label: 'Senin, Rabu, Jumat', days: ['Senin', 'Rabu', 'Jumat'] },
    { label: 'Selasa, Kamis, Sabtu', days: ['Selasa', 'Kamis', 'Sabtu'] },
    { label: 'Weekend', days: ['Sabtu', 'Minggu'] },
  ];
  const TIME_SLOTS = [
    { id: 'pagi', label: 'Pagi (08:00 - 10:00 WIB)', icon: '☀️' },
    { id: 'siang', label: 'Siang (13:00 - 15:00 WIB)', icon: '🌤️' },
    { id: 'sore1', label: 'Sore 1 (15:30 - 17:00 WIB)', icon: '🌅' },
    { id: 'sore2', label: 'Sore 2 (16:00 - 17:30 WIB)', icon: '🌆' },
    { id: 'malam', label: 'Malam (18:30 - 20:00 WIB)', icon: '🌙' },
    { id: 'fleksibel', label: 'Fleksibel', icon: '🕒' },
  ];

  const COMMON_SUBJECT_PRESETS = [
    'Matematika',
    'IPA',
    'Bahasa Inggris',
    'Bahasa Indonesia',
    'IPS / PKn',
    'Calistung (Baca, Tulis, Hitung)',
    'Semua Mapel',
  ];

  const [studentName, setStudentName] = useState(initialData?.studentName || '');
  const [nickname, setNickname] = useState(initialData?.nickname || '');
  const [gender, setGender] = useState<'L' | 'P'>(initialData?.gender || 'L');
  const [birthDate, setBirthDate] = useState(initialData?.birthDate || '');
  const [schoolOrigin, setSchoolOrigin] = useState(initialData?.schoolOrigin || '');
  const [level, setLevel] = useState<StudentLevel>(initialData?.level || 'SD');
  const [gradeDetail, setGradeDetail] = useState(initialData?.gradeDetail || 'Kelas 4 SD');
  const [classType, setClassType] = useState<ClassType>(initialData?.classType || 'Grup');
  const [interestedSubjects, setInterestedSubjects] = useState<string[]>(
    initialData?.interestedSubjects || []
  );
  const [subjectInput, setSubjectInput] = useState('');
  const [preferredSchedule, setPreferredSchedule] = useState(initialData?.preferredSchedule || '');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [parentName, setParentName] = useState(initialData?.parentName || '');
  const [parentPhone, setParentPhone] = useState(initialData?.parentPhone || '');
  const [parentEmail, setParentEmail] = useState(initialData?.parentEmail || '');
  const [address, setAddress] = useState(initialData?.address || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [status, setStatus] = useState<ProspectiveStudentStatus>(initialData?.status || 'Baru');
  const [trialDate, setTrialDate] = useState(initialData?.trialDate || '');
  const [assignedTutorName, setAssignedTutorName] = useState(initialData?.assignedTutorName || '');
  const [errorMsg, setErrorMsg] = useState('');

  const activeTutors = users.filter((u) => u.role === 'tutor' && u.isActive !== false);

  const toggleDay = (day: string) => {
    const updated = selectedDays.includes(day)
      ? selectedDays.filter((d) => d !== day)
      : [...selectedDays, day];
    setSelectedDays(updated);
    updateFormattedSchedule(updated, selectedTimeSlot);
  };

  const applyDayPreset = (days: string[]) => {
    setSelectedDays(days);
    updateFormattedSchedule(days, selectedTimeSlot);
  };

  const selectTimeSlot = (slotLabel: string) => {
    const updated = selectedTimeSlot === slotLabel ? '' : slotLabel;
    setSelectedTimeSlot(updated);
    updateFormattedSchedule(selectedDays, updated);
  };

  const updateFormattedSchedule = (days: string[], timeSlot: string) => {
    const parts: string[] = [];
    if (days.length > 0) parts.push(`Hari: ${days.join(', ')}`);
    if (timeSlot) parts.push(`Waktu: ${timeSlot}`);
    if (parts.length > 0) {
      setPreferredSchedule(parts.join(' | '));
    }
  };

  const handleAddSubject = () => {
    if (subjectInput.trim() && !interestedSubjects.includes(subjectInput.trim())) {
      setInterestedSubjects([...interestedSubjects, subjectInput.trim()]);
      setSubjectInput('');
    }
  };

  const handleRemoveSubject = (sub: string) => {
    setInterestedSubjects(interestedSubjects.filter((s) => s !== sub));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!studentName.trim()) {
      setErrorMsg('Nama calon siswa wajib diisi.');
      return;
    }
    if (!parentPhone.trim()) {
      setErrorMsg('Nomor WhatsApp orang tua wajib diisi.');
      return;
    }

    const regNum = initialData?.registrationNumber || generateRegistrationNumber(existingList);
    const item: ProspectiveStudent = {
      id: initialData?.id || `ppdb-${Date.now()}`,
      registrationNumber: regNum,
      studentName: studentName.trim(),
      nickname: nickname.trim() || undefined,
      gender,
      birthDate: birthDate || undefined,
      schoolOrigin: schoolOrigin.trim() || undefined,
      level,
      gradeDetail: gradeDetail.trim(),
      classType,
      interestedSubjects: interestedSubjects.length > 0 ? interestedSubjects : ['Semua Mapel'],
      preferredSchedule: preferredSchedule.trim() || undefined,
      parentName: parentName.trim() || 'Orang Tua',
      parentPhone: parentPhone.trim(),
      parentEmail: parentEmail.trim() || undefined,
      address: address.trim() || undefined,
      notes: notes.trim() || undefined,
      status,
      trialDate: trialDate || undefined,
      assignedTutorName: assignedTutorName || undefined,
      convertedStudentId: initialData?.convertedStudentId,
      convertedStudentCode: initialData?.convertedStudentCode,
      registrationDate: initialData?.registrationDate || getTodayDateString(),
      createdAt: initialData?.createdAt || new Date().toISOString(),
    };

    onSave(item);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black font-heading">
                {initialData ? 'Edit Data Calon Siswa (PPDB)' : 'Tambah Calon Siswa Baru (Manual)'}
              </h3>
              <p className="text-xs text-indigo-200">
                {initialData ? `No. Registrasi: ${initialData.registrationNumber}` : 'Pendaftaran Walk-In / Telepon'}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Lengkap Siswa <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Contoh: Muhammad Rizky Pratama"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Panggilan</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Contoh: Rizky"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Kelamin</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'L' | 'P')}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium"
              >
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Jenjang</label>
              <select
                value={level}
                onChange={(e) => {
                  const lvl = e.target.value as StudentLevel;
                  setLevel(lvl);
                  if (lvl === 'PAUD') setGradeDetail('PAUD / TK');
                  if (lvl === 'SD') setGradeDetail('Kelas 4 SD');
                  if (lvl === 'SMP') setGradeDetail('Kelas 8 SMP');
                  if (lvl === 'SMA') setGradeDetail('Kelas 11 SMA');
                  if (lvl === 'UTBK') setGradeDetail('Persiapan UTBK/SNBT');
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium"
              >
                <option value="PAUD">PAUD / TK</option>
                <option value="SD">SD</option>
                <option value="SMP">SMP</option>
                <option value="SMA">SMA</option>
                <option value="UTBK">UTBK / SNBT</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Detail Kelas</label>
              <input
                type="text"
                value={gradeDetail}
                onChange={(e) => setGradeDetail(e.target.value)}
                placeholder="Contoh: Kelas 4 SD"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tipe Kelas</label>
              <select
                value={classType}
                onChange={(e) => setClassType(e.target.value as ClassType)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium"
              >
                <option value="Privat">Privat (1-on-1)</option>
                <option value="Grup">Grup (Kelompok)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Asal Sekolah</label>
              <input
                type="text"
                value={schoolOrigin}
                onChange={(e) => setSchoolOrigin(e.target.value)}
                placeholder="Contoh: SDN 1 Blora"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium"
              />
            </div>

            {/* Mata Pelajaran */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mata Pelajaran yang Diminati
              </label>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-1 mb-2">
                {COMMON_SUBJECT_PRESETS.map((preset) => {
                  const isChecked = interestedSubjects.includes(preset);
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        if (isChecked) {
                          setInterestedSubjects(interestedSubjects.filter((s) => s !== preset));
                        } else {
                          setInterestedSubjects([...interestedSubjects, preset]);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                        isChecked
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {preset} {isChecked ? '✓' : '+'}
                    </button>
                  );
                })}
              </div>

              {/* Selected Chips */}
              {interestedSubjects.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {interestedSubjects.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 font-semibold text-xs rounded-lg border border-indigo-200"
                    >
                      <span>{s}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubject(s)}
                        className="text-indigo-400 hover:text-indigo-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={subjectInput}
                  onChange={(e) => setSubjectInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSubject();
                    }
                  }}
                  placeholder="Ketik nama mapel kustom jika tidak ada di atas..."
                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddSubject}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl cursor-pointer"
                >
                  + Tambah
                </button>
              </div>
            </div>

            {/* Preferensi Hari & Jam Belajar */}
            <div className="sm:col-span-2 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>Preferensi Hari &amp; Jam Belajar</span>
              </label>

              {/* Day chips */}
              <div className="flex flex-wrap gap-1">
                {AVAILABLE_DAYS.map((day) => {
                  const isChecked = selectedDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-2 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                        isChecked
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              {/* Time slot chips */}
              <div className="flex flex-wrap gap-1">
                {TIME_SLOTS.map((slot) => {
                  const isSelected = selectedTimeSlot === slot.label;
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => selectTimeSlot(slot.label)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {slot.icon} {slot.label}
                    </button>
                  );
                })}
              </div>

              <input
                type="text"
                value={preferredSchedule}
                onChange={(e) => setPreferredSchedule(e.target.value)}
                placeholder="Contoh: Hari: Senin, Rabu | Waktu: Sore 1 (15:30 - 17:00 WIB)"
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Orang Tua / Wali <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder="Contoh: Hendra Pratama"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                No. WhatsApp Ortu <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                placeholder="Contoh: 081234567890"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Status Follow-Up PPDB
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProspectiveStudentStatus)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-indigo-900"
              >
                <option value="Baru">1. Baru (Pendaftar Baru)</option>
                <option value="Jadwal Trial">2. Jadwal Trial (Berbayar Sesi - Bebas Biaya Pendaftaran)</option>
                <option value="Menunggu Bayar">3. Menunggu Bayar (Anak Cocok - Siap Pendaftaran Resmi)</option>
                <option value="Diterima">4. Diterima (Resmi Jadi Siswa)</option>
                <option value="Batal">5. Batal / Tidak Lanjut</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Jadwal Sesi Trial (Opsional)
              </label>
              <input
                type="date"
                value={trialDate}
                onChange={(e) => setTrialDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tutor yang Ditugaskan untuk Trial / Kelas
              </label>
              <select
                value={assignedTutorName}
                onChange={(e) => setAssignedTutorName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium"
              >
                <option value="">-- Belum Ditentukan --</option>
                {activeTutors.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Catatan / Keterangan Tambahan
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan perkembangan calon siswa..."
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
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Data PPDB</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
