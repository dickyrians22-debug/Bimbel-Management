import React, { useState, useMemo } from 'react';
import { X, CheckSquare, Calendar, Clock, BookOpen, UserCheck, Layers, Save, Search, GraduationCap } from 'lucide-react';
import { Student, AttendanceRecord, AttendanceStatus, UserAccount, StudentLevel, ClassType } from '../../types';
import { getTodayDateString, getCurrentTimeString, formatRupiah } from '../../utils/storage';

interface BatchAttendanceModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSaveBatch: (records: Array<Omit<AttendanceRecord, 'id' | 'createdAt'>>) => void;
  students: Student[];
  currentUserName: string;
  users?: UserAccount[];
}

export const BatchAttendanceModal: React.FC<BatchAttendanceModalProps> = ({
  isOpen,
  onClose,
  onSaveBatch,
  students,
  currentUserName,
  users = [],
}) => {
  // Extract all registered tutors strictly from users database with role 'tutor' (Single Source of Truth)
  const tutorList = useMemo(() => {
    const tutorsFromDb = users.filter((u) => u.role === 'tutor' && u.isActive !== false);

    const list: Array<{ id: string; name: string; role: string }> = [];
    const seen = new Set<string>();

    tutorsFromDb.forEach((t) => {
      const normalized = t.name.trim().toLowerCase();
      if (!seen.has(normalized)) {
        seen.add(normalized);
        list.push({ id: t.id, name: t.name, role: 'Tutor' });
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

  const [date, setDate] = useState(getTodayDateString());
  const [time, setTime] = useState(getCurrentTimeString());
  const [topic, setTopic] = useState('');
  const [selectedClassType, setSelectedClassType] = useState<'All' | ClassType>('All');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<'All' | StudentLevel>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [tutorName, setTutorName] = useState(
    (currentUserName && tutorList.some((t) => t.name === currentUserName) ? currentUserName : null) ||
    tutorList[0]?.name ||
    'Tutor Bimbel'
  );

  // Map student ID to attendance status & inclusion
  const [studentStatuses, setStudentStatuses] = useState<Record<string, { included: boolean; status: AttendanceStatus }>>(
    () => {
      const initial: Record<string, { included: boolean; status: AttendanceStatus }> = {};
      students.forEach((s) => {
        initial[s.id] = { included: s.status === 'Aktif', status: 'Hadir' };
      });
      return initial;
    }
  );

  if (!isOpen) return null;

  const filteredStudents = students.filter((s) => {
    if (s.status !== 'Aktif') return false;
    if (selectedClassType !== 'All' && s.classType !== selectedClassType) return false;
    if (selectedLevelFilter !== 'All' && s.level !== selectedLevelFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.gradeDetail.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleToggleSelectAll = (select: boolean) => {
    const next = { ...studentStatuses };
    filteredStudents.forEach((s) => {
      if (!next[s.id]) next[s.id] = { included: select, status: 'Hadir' };
      else next[s.id].included = select;
    });
    setStudentStatuses(next);
  };

  const handleStudentStatusChange = (studentId: string, status: AttendanceStatus) => {
    setStudentStatuses((prev) => ({
      ...prev,
      [studentId]: { ...(prev[studentId] || { included: true }), status },
    }));
  };

  const handleStudentIncludeToggle = (studentId: string) => {
    setStudentStatuses((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { status: 'Hadir' }),
        included: !(prev[studentId]?.included ?? true),
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      alert('Mohon masukkan Materi / Topik Pembelajaran.');
      return;
    }

    const recordsToSave: Array<Omit<AttendanceRecord, 'id' | 'createdAt'>> = [];
    filteredStudents.forEach((std) => {
      const state = studentStatuses[std.id];
      if (state && state.included) {
        recordsToSave.push({
          date,
          time,
          studentId: std.id,
          studentCode: std.code,
          studentName: std.name,
          classType: std.classType,
          status: state.status,
          sessionNumber: 1, // Will be maintained by auto-counting per student
          topic: topic.trim(),
          tutorNotes: `Presensi Kolektif Kelas ${std.gradeDetail}`,
          tutorName: tutorName || currentUserName || 'Tutor Bimbel',
        });
      }
    });

    if (recordsToSave.length === 0) {
      alert('Tidak ada siswa yang dipilih untuk dicatat presensinya.');
      return;
    }

    onSaveBatch(recordsToSave);
    onClose?.();
  };

  const totalIncluded = filteredStudents.filter((s) => studentStatuses[s.id]?.included).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div
        id="batch-attendance-modal"
        className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 to-indigo-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-teal-200">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black font-heading">Input Presensi Sekaligus (Batch Mode)</h3>
              <p className="text-xs text-teal-100">
                Catat kehadiran beberapa siswa sekaligus dalam satu sesi pertemuan kelas
              </p>
            </div>
          </div>
          <button
            onClick={() => onClose?.()}
            className="text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-teal-600" />
                Tanggal Pertemuan
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-semibold focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-teal-600" />
                Jam Sesi
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-semibold focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-teal-600" />
                Tutor Pengajar
              </label>
              <select
                value={tutorName}
                onChange={(e) => setTutorName(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-semibold focus:ring-2 focus:ring-teal-500"
              >
                {tutorList.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-teal-600" />
              Materi / Topik Pembelajaran <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Contoh: Pembahasan Paket Soal Tryout UTBK / Latihan Bersama"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-medium focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Filter Bar */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-2.5">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama atau kode siswa..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedClassType}
                onChange={(e) => setSelectedClassType(e.target.value as any)}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-800 text-xs font-medium"
              >
                <option value="All">Semua Jenis</option>
                <option value="Grup">Khusus Grup</option>
                <option value="Privat">Khusus Privat</option>
              </select>
              <select
                value={selectedLevelFilter}
                onChange={(e) => setSelectedLevelFilter(e.target.value as any)}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-800 text-xs font-medium"
              >
                <option value="All">Semua Jenjang</option>
                <option value="PAUD">PAUD</option>
                <option value="SD">SD</option>
                <option value="SMP">SMP</option>
                <option value="SMA">SMA</option>
                <option value="UTBK">UTBK</option>
              </select>
            </div>
          </div>

          {/* Student Checklist Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
            <div className="p-3 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-teal-700" />
                <span className="text-xs font-black text-slate-800">
                  Daftar Siswa ({totalIncluded} dari {filteredStudents.length} terpilih)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleSelectAll(true)}
                  className="text-xs font-bold text-teal-700 hover:text-teal-900 bg-white px-2.5 py-1 rounded-lg border border-slate-300 transition cursor-pointer"
                >
                  Pilih Semua
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleSelectAll(false)}
                  className="text-xs font-bold text-slate-600 hover:text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-300 transition cursor-pointer"
                >
                  Batal Semua
                </button>
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <p className="font-bold">Tidak ada siswa aktif yang cocok dengan filter</p>
                </div>
              ) : (
                filteredStudents.map((std) => {
                  const state = studentStatuses[std.id] || { included: false, status: 'Hadir' };
                  return (
                    <div
                      key={std.id}
                      className={`p-2.5 flex items-center justify-between transition ${
                        state.included ? 'bg-teal-50/40' : 'bg-white opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={state.included}
                          onChange={() => handleStudentIncludeToggle(std.id)}
                          className="w-4 h-4 text-teal-600 rounded cursor-pointer"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">{std.name}</span>
                            <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 font-mono rounded">
                              {std.code}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500">
                            {std.gradeDetail} • {std.classType} • {formatRupiah(std.pricePerSession)}/sesi
                          </p>
                        </div>
                      </div>

                      {state.included && (
                        <div className="flex items-center gap-1">
                          {(['Hadir', 'Izin', 'Sakit', 'Alpha'] as AttendanceStatus[]).map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => handleStudentStatusChange(std.id, st)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                                state.status === st
                                  ? st === 'Hadir'
                                    ? 'bg-emerald-600 text-white'
                                    : st === 'Izin'
                                    ? 'bg-amber-500 text-white'
                                    : st === 'Sakit'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-rose-600 text-white'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => onClose?.()}
              className="px-5 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={totalIncluded === 0}
              className={`px-6 py-2.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-lg shadow-teal-700/20 flex items-center gap-2 transition cursor-pointer ${
                totalIncluded === 0 ? 'opacity-40 cursor-not-allowed' : ''
              }`}
            >
              <Save className="w-4 h-4" />
              Simpan Presensi ({totalIncluded} Siswa)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
