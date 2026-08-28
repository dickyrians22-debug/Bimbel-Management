import React, { useState, useEffect, useMemo } from 'react';
import { X, UserPlus, Save, User, Phone, BookOpen, Layers, DollarSign, MapPin, FileText, Sparkles } from 'lucide-react';
import { Student, StudentLevel, ClassType, StudentStatus, UserAccount } from '../../types';
import { formatRupiah, resolveTutorName } from '../../utils/storage';

interface StudentModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSave: (studentData: Omit<Student, 'id'> & { id?: string }) => void;
  initialData?: Student | null;
  existingStudentsCount: number;
  users?: UserAccount[];
}

export const StudentModal: React.FC<StudentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  existingStudentsCount,
  users = [],
}) => {
  // Dynamically derive tutor list strictly from user accounts with role 'tutor' (Single Source of Truth)
  const tutorOptions = useMemo(() => {
    const list: Array<{ id: string; name: string; label: string }> = [];
    const seenNames = new Set<string>();

    if (users && users.length > 0) {
      const activeTutorUsers = users.filter((u) => u.role === 'tutor' && u.isActive !== false);
      activeTutorUsers.forEach((u) => {
        const normalized = u.name.trim().toLowerCase();
        if (!seenNames.has(normalized)) {
          seenNames.add(normalized);
          const spec = u.specialty ? ` (${u.specialty})` : ' (Tutor)';
          list.push({
            id: u.id,
            name: u.name,
            label: `${u.name}${spec}`,
          });
        }
      });
    }

    // Default fallbacks if no tutors loaded
    if (list.length === 0) {
      list.push(
        { id: 't-1', name: 'Kak Sarah Amalia, S.Si.', label: 'Kak Sarah Amalia, S.Si. (MIPA SMP/SMA)' },
        { id: 't-2', name: 'Kak Dimas Pratama, M.Pd.', label: 'Kak Dimas Pratama, M.Pd. (SD & Calistung)' }
      );
    }

    return list;
  }, [users]);

  const defaultTutorName = tutorOptions[0]?.name || 'Kak Sarah Amalia, S.Si.';

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    level: 'SD' as StudentLevel,
    gradeDetail: 'Kelas 5 SD',
    classType: 'Privat' as ClassType,
    pricePerSession: 7000,
    parentName: '',
    parentPhone: '',
    address: '',
    status: 'Aktif' as StudentStatus,
    joinDate: new Date().toISOString().split('T')[0],
    notes: '',
    tutorName: defaultTutorName,
  });

  useEffect(() => {
    if (initialData) {
      const resolvedName = resolveTutorName(initialData.tutorName || '', users);
      const isRegistered = tutorOptions.some((t) => t.name === resolvedName || t.name === initialData.tutorName);
      const validTutor = isRegistered ? (tutorOptions.find(t => t.name === resolvedName)?.name || initialData.tutorName) : defaultTutorName;

      setFormData({
        code: initialData.code || '',
        name: initialData.name || '',
        level: initialData.level || 'SD',
        gradeDetail: initialData.gradeDetail || '',
        classType: initialData.classType || 'Privat',
        pricePerSession: initialData.pricePerSession ?? 7000,
        parentName: initialData.parentName || '',
        parentPhone: initialData.parentPhone || '',
        address: initialData.address || '',
        status: initialData.status || 'Aktif',
        joinDate: initialData.joinDate || new Date().toISOString().split('T')[0],
        notes: initialData.notes || '',
        tutorName: validTutor,
      });
    } else {
      const nextNum = String(existingStudentsCount + 1).padStart(3, '0');
      setFormData({
        code: `SGM-${nextNum}`,
        name: '',
        level: 'SD',
        gradeDetail: 'Kelas 5 SD',
        classType: 'Privat',
        pricePerSession: 7000,
        parentName: '',
        parentPhone: '',
        address: '',
        status: 'Aktif',
        joinDate: new Date().toISOString().split('T')[0],
        notes: '',
        tutorName: defaultTutorName,
      });
    }
  }, [initialData, isOpen, existingStudentsCount, defaultTutorName, tutorOptions]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      alert('Mohon lengkapi Nama Siswa dan Kode Siswa.');
      return;
    }
    onSave({
      ...(initialData ? { id: initialData.id } : {}),
      ...formData,
      pricePerSession: Number(formData.pricePerSession),
      monthlyFee: Number(formData.pricePerSession) * 8,
    });
    onClose?.();
  };

  // Quick helper to adjust default suggested price based on level and class type
  const handleLevelOrTypeChange = (newLevel: StudentLevel, newType: ClassType) => {
    let suggestedPrice = 5000;
    if (newLevel === 'PAUD') suggestedPrice = newType === 'Privat' ? 7000 : 5000;
    else if (newLevel === 'SD') suggestedPrice = newType === 'Privat' ? 7000 : 5000;
    else if (newLevel === 'SMP') suggestedPrice = newType === 'Privat' ? 10000 : 8000;
    else if (newLevel === 'SMA') suggestedPrice = newType === 'Privat' ? 20000 : 15000;
    else if (newLevel === 'UTBK') suggestedPrice = newType === 'Privat' ? 100000 : 80000;

    setFormData((prev) => ({
      ...prev,
      level: newLevel,
      classType: newType,
      pricePerSession: suggestedPrice,
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div
        id="student-form-modal"
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8"
      >
        <div className="bg-white border-b border-slate-200 text-slate-900 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              {initialData ? <User className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {initialData ? 'Edit Data Siswa Bimbel' : 'Tambah Siswa Baru'}
              </h3>
              <p className="text-xs text-slate-500">
                {initialData ? `Perbarui profil & tarif sesi siswa (${initialData.code})` : 'Pendaftaran siswa baru dan pengaturan tarif per sesi'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Kode Siswa */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Kode Siswa <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="input-student-code"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="Kode siswa (cth: SGM-001)"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:bg-white transition text-sm"
              />
            </div>

            {/* Nama Siswa */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nama Lengkap Siswa <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="input-student-name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nama lengkap siswa"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition text-sm"
              />
            </div>

            {/* Tingkat / Level */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                Tingkat Pendidikan <span className="text-rose-500">*</span>
              </label>
              <select
                id="select-student-level"
                value={formData.level}
                onChange={(e) => handleLevelOrTypeChange(e.target.value as StudentLevel, formData.classType)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition text-sm cursor-pointer"
              >
                <option value="PAUD">PAUD / TK (Calistung Pra-Sekolah)</option>
                <option value="SD">SD (Sekolah Dasar)</option>
                <option value="SMP">SMP (Sekolah Menengah Pertama)</option>
                <option value="SMA">SMA / SMK (Sekolah Menengah Atas)</option>
                <option value="UTBK">UTBK / SNBT / Kedinasan / Umum</option>
              </select>
            </div>

            {/* Detail Kelas */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Kelas Spesifik / Jurusan
              </label>
              <input
                type="text"
                id="input-student-grade-detail"
                value={formData.gradeDetail}
                onChange={(e) => setFormData({ ...formData, gradeDetail: e.target.value })}
                placeholder="Kelas / Jurusan (misal: Kelas 6 SD)"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition text-sm"
              />
            </div>

            {/* Jenis Kelas (Privat / Grup) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                Jenis Kelas <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleLevelOrTypeChange(formData.level, 'Privat')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition ${
                    formData.classType === 'Privat'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-2 ring-indigo-500/20'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  Privat (1 on 1)
                </button>
                <button
                  type="button"
                  onClick={() => handleLevelOrTypeChange(formData.level, 'Grup')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition ${
                    formData.classType === 'Grup'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-500/20'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  Grup / Reguler
                </button>
              </div>
            </div>

            {/* Tarif Per Sesi / Pertemuan */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  Tarif Per Pertemuan / Sesi (Rp) <span className="text-rose-500">*</span>
                </label>
                <span className="text-xs font-mono font-bold text-indigo-700">
                  {formatRupiah(formData.pricePerSession || 0)}
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                  Rp
                </span>
                <input
                  type="number"
                  id="input-student-price"
                  required
                  min="0"
                  step="any"
                  placeholder="Tarif per sesi..."
                  value={formData.pricePerSession === 0 ? '' : formData.pricePerSession}
                  onChange={(e) => {
                    const val = e.target.value === '' ? 0 : Number(e.target.value);
                    setFormData({
                      ...formData,
                      pricePerSession: isNaN(val) ? 0 : val,
                    });
                  }}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-bold focus:ring-2 focus:ring-indigo-500 focus:bg-white transition text-sm"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                *Tagihan akhir bulan dihitung: Hadir × Tarif Sesi ini.
              </p>
            </div>

            {/* Status Siswa */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Status Keanggotaan
              </label>
              <select
                id="select-student-status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as StudentStatus })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition text-sm cursor-pointer"
              >
                <option value="Aktif">🟢 Aktif (Sedang Berlangsung)</option>
                <option value="Non-Aktif">⚪ Non-Aktif (Cuti / Alumni)</option>
              </select>
            </div>

            {/* Nama Orang Tua / Wali */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nama Orang Tua / Wali
              </label>
              <input
                type="text"
                id="input-student-parent-name"
                value={formData.parentName}
                onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                placeholder="Nama orang tua / wali murid"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition text-sm"
              />
            </div>

            {/* No HP Ortu (WhatsApp) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                No. WhatsApp Ortu / Siswa <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                id="input-student-parent-phone"
                required
                value={formData.parentPhone}
                onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                placeholder="08xxxxxxxxxx"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition text-sm"
              />
            </div>

            {/* Tutor Pengajar Pembina */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Tutor Utama Pembina</span>
                <span className="text-[10px] text-indigo-600 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  Sinkron Database Tutor
                </span>
              </label>
              <select
                id="select-student-tutor"
                value={formData.tutorName}
                onChange={(e) => setFormData({ ...formData, tutorName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition text-sm font-medium cursor-pointer"
              >
                {tutorOptions.map((tutor) => (
                  <option key={tutor.id || tutor.name} value={tutor.name}>
                    {tutor.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Alamat */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              Alamat Rumah Siswa (Opsional)
            </label>
            <input
              type="text"
              id="input-student-address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Alamat lengkap domisili siswa"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition text-sm"
            />
          </div>

          {/* Catatan Khusus */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Target Belajar & Catatan Khusus
            </label>
            <textarea
              id="input-student-notes"
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Target belajar, fokus materi, atau catatan khusus siswa..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition text-sm resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              id="save-student-btn"
              className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-xl shadow-sm flex items-center gap-2 transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {initialData ? 'Simpan Perubahan' : 'Daftarkan Siswa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
