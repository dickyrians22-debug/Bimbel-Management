import React, { useState, useMemo } from 'react';
import { X, CheckCircle, Clock, Calendar, BookOpen, Send, Sparkles, GraduationCap } from 'lucide-react';
import { Student, AttendanceRecord, UserAccount } from '../../types';
import { getTodayDateString, getCurrentTimeString } from '../../utils/storage';

interface SelfAttendanceModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onConfirmSelfAttendance: (record: Omit<AttendanceRecord, 'id' | 'createdAt'>) => void;
  student: Student;
  existingTodayRecord?: AttendanceRecord | null;
  users?: UserAccount[];
}

export const SelfAttendanceModal: React.FC<SelfAttendanceModalProps> = ({
  isOpen,
  onClose,
  onConfirmSelfAttendance,
  student,
  existingTodayRecord,
  users = [],
}) => {
  const [currentTime] = useState(getCurrentTimeString());
  const [topic, setTopic] = useState('');
  const [notes, setNotes] = useState('');

  const safeStudent: Student = student || {
    id: 'std-self',
    code: 'SGM-001',
    name: 'Siswa Bimbel',
    level: 'SMP',
    gradeDetail: 'Kelas 9 SMP',
    classType: 'Privat',
    pricePerSession: 60000,
    parentName: 'Orang Tua Siswa',
    parentPhone: '081234567890',
    status: 'Aktif',
    joinDate: getTodayDateString(),
  };

  // Extract real registered tutors strictly from users database with role 'tutor' (Single Source of Truth)
  const tutorList = useMemo(() => {
    const tutorsFromDb = users.filter((u) => u.role === 'tutor' && u.isActive !== false);

    const list: Array<{ id: string; name: string; role: string }> = [];

    tutorsFromDb.forEach((t) => {
      list.push({ id: t.id, name: t.name, role: 'Tutor' });
    });

    return list;
  }, [users]);

  const [selectedTutor, setSelectedTutor] = useState(() => {
    if (safeStudent.tutorName && tutorList.some((t) => t.name === safeStudent.tutorName)) {
      return safeStudent.tutorName;
    }
    return tutorList[0]?.name ?? 'Tutor Bimbel';
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmSelfAttendance({
      date: getTodayDateString(),
      time: getCurrentTimeString(),
      studentId: safeStudent.id,
      studentCode: safeStudent.code,
      studentName: safeStudent.name,
      classType: safeStudent.classType,
      status: 'Hadir',
      topic: topic.trim() || `Sesi Pembelajaran Mandiri / Les Reguler ${safeStudent.gradeDetail}`,
      tutorNotes: notes.trim() || 'Presensi Masuk Mandiri via Portal Siswa',
      tutorName: selectedTutor || safeStudent.tutorName || 'Tutor Bimbel',
    });
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div
        id="self-attendance-modal"
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8"
      >
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-amber-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black font-heading">Absen Masuk Mandiri</h3>
              <p className="text-xs text-indigo-200">Konfirmasi kehadiran sesi belajar hari ini</p>
            </div>
          </div>
          <button
            onClick={() => onClose?.()}
            className="text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {existingTodayRecord ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-800">Kamu Sudah Absen Hari Ini!</h4>
              <p className="text-sm text-slate-600 mt-1">
                Presensi kamu telah tercatat pada jam <strong>{existingTodayRecord.time} WIB</strong>.
              </p>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 text-left space-y-1">
              <p>
                <strong>Tutor Pengajar:</strong> {existingTodayRecord.tutorName}
              </p>
              <p>
                <strong>Materi:</strong> {existingTodayRecord.topic}
              </p>
              {existingTodayRecord.tutorNotes && (
                <p>
                  <strong>Catatan:</strong> {existingTodayRecord.tutorNotes}
                </p>
              )}
            </div>
            <button
              onClick={() => onClose?.()}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition cursor-pointer"
            >
              Tutup
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            {/* Student ID Card Badge */}
            <div className="p-3.5 bg-indigo-50/80 border border-indigo-200 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-md">
                  {safeStudent.code}
                </span>
                <h4 className="text-sm font-bold text-slate-900 mt-1">{safeStudent.name}</h4>
                <p className="text-[11px] text-slate-600">
                  {safeStudent.gradeDetail} • {safeStudent.classType}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-xs text-indigo-700 font-bold">
                  <Clock className="w-3.5 h-3.5" />
                  {currentTime} WIB
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                  <Calendar className="w-3 h-3" />
                  {getTodayDateString()}
                </div>
              </div>
            </div>

            {/* Tutor Pengajar Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                Siapa Tutor yang Mengajar Hari Ini? <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={selectedTutor}
                onChange={(e) => setSelectedTutor(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 focus:bg-white transition text-xs"
              >
                {tutorList.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Materi Pembelajaran yang dipelajari */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                Materi Belajar Hari Ini (Opsional)
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Contoh: Latihan Soal UTS Matematika / Calistung"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition text-xs"
              />
            </div>

            {/* Catatan / Pesan untuk Tutor */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Catatan / Request Materi ke Tutor (Opsional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Ingin fokus bahas PR nomor 5-10..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition text-xs resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onClose?.()}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                id="submit-self-attendance-btn"
                className="flex-1 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
                Konfirmasi Hadir Sekarang
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
