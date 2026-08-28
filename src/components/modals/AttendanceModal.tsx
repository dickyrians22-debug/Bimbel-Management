import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  BookOpen,
  CheckCircle,
  Save,
  MessageSquare,
  Search,
  Check,
  Sparkles,
  GraduationCap,
  Info,
  ChevronDown,
} from 'lucide-react';
import { AttendanceRecord, Student, AttendanceStatus, UserAccount, StudentLevel, ClassType } from '../../types';
import { getTodayDateString, getCurrentTimeString, formatRupiah, getMonthNameIndo, resolveTutorName } from '../../utils/storage';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSave: (record: Omit<AttendanceRecord, 'id' | 'createdAt'> & { id?: string }) => void;
  initialData?: AttendanceRecord | null;
  students: Student[];
  currentUserName: string;
  users?: UserAccount[];
  attendance?: AttendanceRecord[];
}

export const AttendanceModal: React.FC<AttendanceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  students,
  currentUserName,
  users = [],
  attendance = [],
}) => {
  // Extract all registered tutors strictly from users database with role 'tutor' (Single Source of Truth)
  const tutorList = useMemo(() => {
    const tutorsFromDb = users.filter((u) => u.role === 'tutor' && u.isActive !== false);

    const list: Array<{ id: string; name: string; username?: string; role: string }> = [];
    const seen = new Set<string>();

    tutorsFromDb.forEach((t) => {
      const normalized = t.name.trim().toLowerCase();
      if (!seen.has(normalized)) {
        seen.add(normalized);
        list.push({ id: t.id, name: t.name, username: t.username, role: 'Tutor' });
      }
    });

    if (list.length === 0) {
      list.push(
        { id: 't-1', name: 'Kak Sarah Amalia, S.Si.', role: 'Tutor' },
        { id: 't-2', name: 'Kak Dimas Pratama, M.Pd.', role: 'Tutor' }
      );
    }

    return list;
  }, [users]);

  // Form State
  const [formData, setFormData] = useState({
    date: getTodayDateString(),
    time: getCurrentTimeString(),
    studentId: '',
    status: 'Hadir' as AttendanceStatus,
    topic: '',
    tutorNotes: '',
    tutorName: currentUserName || (tutorList[0]?.name ?? 'Tutor Bimbel'),
  });

  // Search & Filter State for Student Picker
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<'All' | StudentLevel>('All');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'All' | ClassType>('All');
  const [isStudentPickerOpen, setIsStudentPickerOpen] = useState(false);

  useEffect(() => {
    if (initialData) {
      // Validate tutorName against registered accounts
      const resolvedTutor = resolveTutorName(initialData.tutorName, users);
      const isRegistered = tutorList.some((t) => t.name === resolvedTutor || t.name === initialData.tutorName);
      const validTutorName = isRegistered
        ? (tutorList.find((t) => t.name === resolvedTutor)?.name || initialData.tutorName)
        : (currentUserName && tutorList.some((t) => t.name === currentUserName) ? currentUserName : null) ||
          tutorList[0]?.name ||
          'Tutor Bimbel';

      setFormData({
        date: initialData.date || getTodayDateString(),
        time: initialData.time || getCurrentTimeString(),
        studentId: initialData.studentId || '',
        status: initialData.status || 'Hadir',
        topic: initialData.topic || '',
        tutorNotes: initialData.tutorNotes || '',
        tutorName: validTutorName,
      });
      setIsStudentPickerOpen(false);
    } else {
      const firstActive = students.find((s) => s.status === 'Aktif') || students[0];
      const defaultTutor =
        (currentUserName && tutorList.some((t) => t.name === currentUserName) ? currentUserName : null) ||
        (firstActive?.tutorName && tutorList.some((t) => t.name === firstActive.tutorName) ? firstActive.tutorName : null) ||
        tutorList[0]?.name ||
        'Tutor Bimbel';

      setFormData({
        date: getTodayDateString(),
        time: getCurrentTimeString(),
        studentId: firstActive ? firstActive.id : '',
        status: 'Hadir',
        topic: '',
        tutorNotes: '',
        tutorName: defaultTutor,
      });
      setStudentSearchTerm('');
      setSelectedLevelFilter('All');
      setSelectedTypeFilter('All');
      setIsStudentPickerOpen(false);
    }
  }, [initialData, isOpen, students, currentUserName, tutorList]);

  const selectedStudent = useMemo(() => {
    return students.find((s) => s.id === formData.studentId);
  }, [students, formData.studentId]);

  // Auto-Count Pertemuan Ke- based on attendance records in the same month
  const { calculatedSessionNumber, pastMonthAttendancesCount, targetMonthName } = useMemo(() => {
    if (!formData.studentId || !formData.date) {
      return { calculatedSessionNumber: 1, pastMonthAttendancesCount: 0, targetMonthName: '' };
    }

    const dateParts = formData.date.split('-');
    const year = dateParts[0] || String(new Date().getFullYear());
    const month = dateParts[1] || String(new Date().getMonth() + 1).padStart(2, '0');
    const monthPrefix = `${year}-${month}`;
    const monthNum = parseInt(month, 10);
    const monthName = getMonthNameIndo(monthNum);

    const pastRecords = attendance.filter((a) => {
      if (a.studentId !== formData.studentId) return false;
      if (initialData && a.id === initialData.id) return false; // ignore the one being edited
      if (a.status !== 'Hadir') return false;
      return a.date && a.date.startsWith(monthPrefix);
    });

    const nextNumber = pastRecords.length + 1;

    return {
      calculatedSessionNumber: initialData?.sessionNumber ?? nextNumber,
      pastMonthAttendancesCount: pastRecords.length,
      targetMonthName: `${monthName} ${year}`,
    };
  }, [formData.studentId, formData.date, attendance, initialData]);

  // Session Number state (defaults to calculated, but user can adjust if needed)
  const [customSessionNumber, setCustomSessionNumber] = useState<number>(1);
  const [isManualSession, setIsManualSession] = useState(false);

  useEffect(() => {
    if (initialData?.sessionNumber) {
      setCustomSessionNumber(initialData.sessionNumber);
      setIsManualSession(true);
    } else {
      setCustomSessionNumber(calculatedSessionNumber);
      setIsManualSession(false);
    }
  }, [calculatedSessionNumber, initialData]);

  // Filter student list for searchable student picker
  const filteredStudents = useMemo(() => {
    const term = studentSearchTerm.toLowerCase().trim();
    return students.filter((s) => {
      // Search term matching
      const matchSearch =
        !term ||
        s.name.toLowerCase().includes(term) ||
        s.code.toLowerCase().includes(term) ||
        s.gradeDetail.toLowerCase().includes(term) ||
        (s.parentName && s.parentName.toLowerCase().includes(term));

      // Level filter
      const matchLevel = selectedLevelFilter === 'All' || s.level === selectedLevelFilter;

      // Class Type filter
      const matchType = selectedTypeFilter === 'All' || s.classType === selectedTypeFilter;

      return matchSearch && matchLevel && matchType;
    });
  }, [students, studentSearchTerm, selectedLevelFilter, selectedTypeFilter]);

  if (!isOpen) return null;

  const handleSelectStudent = (student: Student) => {
    setFormData((prev) => ({
      ...prev,
      studentId: student.id,
      // If student has dedicated tutor assigned and no specific tutor was selected, apply it
      tutorName: prev.tutorName || student.tutorName || currentUserName,
    }));
    setIsStudentPickerOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentId) {
      alert('Silakan pilih siswa terlebih dahulu.');
      return;
    }
    if (!selectedStudent) {
      alert('Data siswa yang dipilih tidak valid.');
      return;
    }

    onSave({
      ...(initialData ? { id: initialData.id } : {}),
      date: formData.date,
      time: formData.time,
      studentId: selectedStudent.id,
      studentCode: selectedStudent.code,
      studentName: selectedStudent.name,
      classType: selectedStudent.classType,
      status: formData.status,
      sessionNumber: isManualSession ? customSessionNumber : calculatedSessionNumber,
      topic: formData.topic.trim() || `Pembelajaran ${selectedStudent.gradeDetail}`,
      tutorNotes: formData.tutorNotes.trim(),
      tutorName: formData.tutorName || currentUserName || 'Tutor Bimbel',
    });
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div
        id="attendance-form-modal"
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-200">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black font-heading">
                {initialData ? 'Edit Presensi & Materi Siswa' : 'Input Presensi / Absensi Baru'}
              </h3>
              <p className="text-xs text-emerald-100">
                {initialData
                  ? `Koreksi presensi ${initialData.studentName}`
                  : 'Catat kehadiran & materi pembelajaran hari ini'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Tanggal & Waktu Pertemuan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                Tanggal Pertemuan <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                id="input-att-date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-500 focus:bg-white transition text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                Jam Masuk / Sesi <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                id="input-att-time"
                required
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-500 focus:bg-white transition text-sm"
              />
            </div>
          </div>

          {/* Searchable Student Picker (Solusi No. 1) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                Pilih Siswa <span className="text-rose-500">*</span>
              </span>
              {selectedStudent && (
                <button
                  type="button"
                  onClick={() => setIsStudentPickerOpen(!isStudentPickerOpen)}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                >
                  {isStudentPickerOpen ? 'Tutup Pencarian' : 'Ganti Siswa Lain'}
                </button>
              )}
            </label>

            {/* Selected Student Display Card */}
            {selectedStudent && !isStudentPickerOpen ? (
              <div
                onClick={() => setIsStudentPickerOpen(true)}
                className="p-3.5 bg-emerald-50/70 hover:bg-emerald-50 border border-emerald-300 rounded-2xl cursor-pointer transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                    {selectedStudent.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900">{selectedStudent.name}</span>
                      <span className="px-1.5 py-0.5 bg-white text-emerald-800 border border-emerald-200 rounded text-[10px] font-mono font-bold">
                        {selectedStudent.code}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      {selectedStudent.gradeDetail} •{' '}
                      <span className="font-semibold text-emerald-900">{selectedStudent.classType}</span> •{' '}
                      <span className="font-mono">{formatRupiah(selectedStudent.pricePerSession)}</span>/sesi
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-[11px]">
                  <span>Klik untuk ganti</span>
                  <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition" />
                </div>
              </div>
            ) : (
              /* Searchable Picker Panel */
              <div className="border border-emerald-300 bg-white rounded-2xl p-3 shadow-md space-y-2.5">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    autoFocus
                    value={studentSearchTerm}
                    onChange={(e) => setStudentSearchTerm(e.target.value)}
                    placeholder="Ketik nama siswa atau kode (contoh: SGM-001)..."
                    className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                  {studentSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setStudentSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Level and Class Type Quick Filter Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Jenjang:</span>
                  {(['All', 'PAUD', 'SD', 'SMP', 'SMA', 'UTBK'] as Array<'All' | StudentLevel>).map(
                    (lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setSelectedLevelFilter(lvl)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                          selectedLevelFilter === lvl
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {lvl === 'All' ? 'Semua' : lvl}
                      </button>
                    )
                  )}
                  <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">Jenis:</span>
                  {(['All', 'Privat', 'Grup'] as Array<'All' | ClassType>).map((ct) => (
                    <button
                      key={ct}
                      type="button"
                      onClick={() => setSelectedTypeFilter(ct)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                        selectedTypeFilter === ct
                          ? 'bg-teal-700 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {ct === 'All' ? 'Semua' : ct}
                    </button>
                  ))}
                </div>

                {/* Students List Results */}
                <div className="max-h-48 overflow-y-auto space-y-1 divide-y divide-slate-100 pr-1">
                  {filteredStudents.length === 0 ? (
                    <div className="py-6 text-center text-slate-400">
                      <GraduationCap className="w-6 h-6 mx-auto mb-1 opacity-50" />
                      <p className="font-bold">Tidak ada siswa yang cocok</p>
                      <p className="text-[10px]">Coba cari dengan kata kunci lain</p>
                    </div>
                  ) : (
                    filteredStudents.map((std) => {
                      const isSelected = std.id === formData.studentId;
                      return (
                        <div
                          key={std.id}
                          onClick={() => handleSelectStudent(std)}
                          className={`p-2 rounded-xl flex items-center justify-between cursor-pointer transition ${
                            isSelected
                              ? 'bg-emerald-100/70 border border-emerald-300 font-bold text-emerald-950'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                                isSelected
                                  ? 'bg-emerald-700 text-white'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {std.name.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold">{std.name}</span>
                                <span className="text-[10px] px-1 py-0.2 bg-slate-100 text-slate-600 font-mono rounded">
                                  {std.code}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500">
                                {std.gradeDetail} • {std.classType} • {formatRupiah(std.pricePerSession)}/sesi
                              </p>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-emerald-700 shrink-0" />}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Status Presensi */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Status Presensi <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['Hadir', 'Izin', 'Sakit', 'Alpha'] as AttendanceStatus[]).map((st) => {
                const isSelected = formData.status === st;
                let activeColor = 'bg-emerald-600 text-white border-emerald-600';
                if (st === 'Izin') activeColor = 'bg-amber-500 text-white border-amber-500';
                if (st === 'Sakit') activeColor = 'bg-blue-600 text-white border-blue-600';
                if (st === 'Alpha') activeColor = 'bg-rose-600 text-white border-rose-600';

                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setFormData({ ...formData, status: st })}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition cursor-pointer text-center ${
                      isSelected
                        ? `${activeColor} shadow-md`
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {st}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Topik / Materi Pembelajaran */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
              Materi / Topik Pembelajaran <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              id="input-att-topic"
              required
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              placeholder="Contoh: Bab 4 Persamaan Kuadrat / Latihan Soal UTS"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white transition text-sm"
            />
          </div>

          {/* Pertemuan Sesi & Dropdown Tutor Database */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Auto-Count Pertemuan Ke */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
              <div className="flex items-center justify-between text-slate-600">
                <span className="font-bold text-slate-700">Pertemuan Sesi:</span>
                {isManualSession ? (
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-400 font-medium">Ke-</span>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={customSessionNumber}
                      onChange={(e) => setCustomSessionNumber(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-16 px-2 py-0.5 bg-white border border-emerald-400 rounded-lg text-emerald-800 font-extrabold text-xs text-center focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsManualSession(false);
                        setCustomSessionNumber(calculatedSessionNumber);
                      }}
                      className="text-[10px] font-bold text-slate-500 hover:text-slate-700 underline ml-0.5 cursor-pointer"
                      title="Kembalikan ke hitungan otomatis"
                    >
                      Reset
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-extrabold rounded-md text-[11px] font-mono">
                      Sesi Ke-{calculatedSessionNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsManualSession(true)}
                      className="text-[10px] font-semibold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                      title="Klik jika ingin mengubah nomor sesi secara manual"
                    >
                      Ubah
                    </button>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-slate-500 flex items-center gap-1 pt-0.5 leading-tight">
                <Info className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>
                  {pastMonthAttendancesCount === 0
                    ? `Pertemuan pertama siswa ini di ${targetMonthName}`
                    : `Siswa ini sudah ${pastMonthAttendancesCount}x hadir di ${targetMonthName}`}
                </span>
              </p>
            </div>

            {/* Flexible Tutor Dropdown from Database */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                Tutor Pengajar <span className="text-rose-500">*</span>
              </label>
              <select
                id="select-att-tutor-name"
                required
                value={formData.tutorName}
                onChange={(e) => setFormData({ ...formData, tutorName: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-500 focus:bg-white transition text-xs"
              >
                {tutorList.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Catatan Tutor / Perkembangan Siswa */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
              Catatan & Evaluasi Siswa (Opsional)
            </label>
            <textarea
              id="input-att-notes"
              rows={2}
              value={formData.tutorNotes}
              onChange={(e) => setFormData({ ...formData, tutorNotes: e.target.value })}
              placeholder="Catatan keaktifan, kendala materi, atau hasil latihan..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white transition text-xs resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              id="save-attendance-btn"
              className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {initialData ? 'Simpan Perubahan' : 'Catat Presensi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
