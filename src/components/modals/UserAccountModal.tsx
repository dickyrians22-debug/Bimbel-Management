import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  User,
  ShieldCheck,
  GraduationCap,
  Users,
  Lock,
  Mail,
  Phone,
  BookOpen,
  Sparkles,
  Save,
  Upload,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Cpu,
} from 'lucide-react';
import { UserAccount, UserRole, Student } from '../../types';
import { UserAvatar } from '../common/UserAvatar';
import { compressImageFile, CompressionResult } from '../../utils/imageCompressor';

interface UserAccountModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSave: (account: Omit<UserAccount, 'id' | 'createdAt'> & { id?: string }) => void;
  onDelete?: (userId: string) => void;
  initialData?: UserAccount | null;
  students: Student[];
  existingUsers?: UserAccount[];
  currentUserId?: string;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
];

export const UserAccountModal: React.FC<UserAccountModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
  students,
  existingUsers = [],
  currentUserId,
}) => {
  const [role, setRole] = useState<UserRole>('tutor');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('sigma123');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [code, setCode] = useState('');
  const [linkedStudentId, setLinkedStudentId] = useState('');
  const [avatar, setAvatar] = useState<string>('');
  const [isActive, setIsActive] = useState(true);

  // Kompresi upload state
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<CompressionResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setRole(initialData.role);
      setName(initialData.name || '');
      setUsername(initialData.username || '');
      setPassword(initialData.password || 'sigma123');
      setEmail(initialData.email || '');
      setPhone(initialData.phone || '');
      setSpecialty(initialData.specialty || '');
      setCode(initialData.code || '');
      setLinkedStudentId(initialData.linkedStudentId || '');
      setAvatar(initialData.avatar || '');
      setIsActive(initialData.isActive !== false);
      setCompressionInfo(null);
    } else {
      setRole('tutor');
      setName('');
      setUsername('');
      setPassword('sigma123');
      setEmail('');
      setPhone('');
      setSpecialty('Tutor Pengajar Bimbel Sigma');
      setCode('');
      setLinkedStudentId('');
      setAvatar(''); // Default inisial (0 KB)
      setIsActive(true);
      setCompressionInfo(null);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleStudentSelect = (stdId: string) => {
    setLinkedStudentId(stdId);
    const selected = students.find((s) => s.id === stdId);
    if (selected) {
      setName(selected.name || '');
      setCode(selected.code || '');
      setPhone(selected.parentPhone || '');
      setSpecialty(`${selected.gradeDetail || ''} (${selected.classType || ''})`);
      if (!username && selected.name) {
        setUsername((selected.name || '').toLowerCase().replace(/\s+/g, '').slice(0, 10));
      }
      if (!email && selected.code) {
        setEmail(`${(selected.code || '').toLowerCase()}@siswa.bimbelsigma.id`);
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih file gambar (JPG, PNG, WebP, dsb).');
      return;
    }

    try {
      setIsCompressing(true);
      // Kompresi otomatis menjadi 120x120 px WebP/JPEG (~4-8 KB)
      const result = await compressImageFile(file, { maxDimension: 120, quality: 0.75 });
      setAvatar(result.dataUrl);
      setCompressionInfo(result);
    } catch (err: any) {
      alert('Gagal mengompresi gambar: ' + (err?.message || 'Error tidak diketahui'));
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = () => {
    setAvatar('');
    setCompressionInfo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim().toLowerCase();
    const cleanName = name.trim();

    if (!cleanName || !cleanUsername) {
      alert('Nama dan Username wajib diisi!');
      return;
    }

    // STRICT CHECK: Username uniqueness validation across all accounts
    const duplicateUser = existingUsers.find(
      (u) => u.id !== initialData?.id && (u.username || '').trim().toLowerCase() === cleanUsername
    );

    if (duplicateUser) {
      alert(
        `❌ GAGAL: Username "${cleanUsername}" sudah digunakan oleh akun "${duplicateUser.name}" (Peran: ${duplicateUser.role.toUpperCase()}).\n\nSetiap akun wajib memiliki username unik agar sistem login tidak tertukar. Silakan gunakan username lain.`
      );
      return;
    }

    // Role-specific check: non-owner accounts shouldn't use "owner" as username
    if (role !== 'owner' && cleanUsername === 'owner') {
      alert('❌ Username "owner" hanya diperuntukkan bagi akun Kepala Bimbel (Owner). Silakan gunakan username lain.');
      return;
    }

    onSave({
      id: initialData?.id,
      role,
      name: cleanName,
      username: cleanUsername,
      password: password.trim() || 'sigma123',
      email: email.trim(),
      phone: phone.trim(),
      specialty: specialty.trim(),
      code: role === 'siswa' ? code.trim() : undefined,
      linkedStudentId: role === 'siswa' ? linkedStudentId : undefined,
      avatar: avatar.trim(),
      isActive,
    });
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-amber-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-heading">
                {initialData ? 'Edit Akun Pengguna' : 'Tambah Akun Pengguna Baru'}
              </h3>
              <p className="text-xs text-indigo-200">
                Kelola hak akses untuk Owner, Tutor pengajar, atau Siswa & Wali Murid
              </p>
            </div>
          </div>
          <button
            onClick={() => onClose?.()}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Peran Akun (Role) Tabs */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Pilih Peran Akun (Role Access)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRole('owner')}
                className={`py-2.5 px-3 rounded-2xl text-xs font-bold flex flex-col items-center gap-1 transition border cursor-pointer ${
                  role === 'owner'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/30'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Owner (Admin)</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('tutor')}
                className={`py-2.5 px-3 rounded-2xl text-xs font-bold flex flex-col items-center gap-1 transition border cursor-pointer ${
                  role === 'tutor'
                    ? 'bg-teal-600 text-white border-teal-700 shadow-md shadow-teal-600/30'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Tutor / Pengajar</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('siswa')}
                className={`py-2.5 px-3 rounded-2xl text-xs font-bold flex flex-col items-center gap-1 transition border cursor-pointer ${
                  role === 'siswa'
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-md shadow-indigo-600/30'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Siswa / Wali</span>
              </button>
            </div>
          </div>

          {/* If Siswa: Hubungkan dengan Siswa yang sudah terdaftar di Database */}
          {role === 'siswa' && (
            <div className="p-3.5 bg-indigo-50/80 border border-indigo-200 rounded-2xl space-y-2">
              <label className="block text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Hubungkan dengan Profil Siswa di Database (Opsional):
              </label>
              <select
                value={linkedStudentId}
                onChange={(e) => handleStudentSelect(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Pilih Siswa Terdaftar (Auto-Fill Data) --</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} - {s.name} ({s.gradeDetail} / {s.classType})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-indigo-700">
                Memilih profil siswa akan otomatis menyinkronkan Kode Siswa, Nama, No. HP, dan Keahlian.
              </p>
            </div>
          )}

          {/* Grid: Nama & Username */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nama Lengkap *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama lengkap pengguna"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Username Login *
              </label>
              <div className="relative">
                <span className="text-slate-400 font-bold absolute left-3 top-1/2 -translate-y-1/2 text-xs">
                  @
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  placeholder="username (huruf kecil & tanpa spasi)"
                  required
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Grid: Kata Sandi & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Kata Sandi (Password) *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="sigma123"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email Akun
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@bimbelsigma.id"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Grid: No HP & Keahlian/Spesialisasi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                No. WhatsApp / HP
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {role === 'tutor'
                  ? 'Keahlian / Bidang Studi'
                  : role === 'siswa'
                  ? 'Kelas & Program Les'
                  : 'Jabatan / Deskripsi'}
              </label>
              <div className="relative">
                <BookOpen className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder={
                    role === 'tutor'
                      ? 'Bidang studi pengajaran'
                      : role === 'siswa'
                      ? 'Kelas & tipe program bimbel'
                      : 'Jabatan / posisi tugas'
                  }
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* If Siswa: Kode Siswa */}
          {role === 'siswa' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Kode Siswa (ID Kartu Presensi)
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Kode ID Siswa (cth: SGM-001)"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 uppercase"
              />
            </div>
          )}

          {/* Avatar Hybrid Section (Inisial Default 0 KB vs Upload Kompresi 4-8 KB) */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Foto Profil Akun (Sistem Hybrid)
                </label>
                <p className="text-[11px] text-slate-500">
                  Default inisial (0 KB) atau upload foto sendiri (otomatis dikompresi ke 4–8 KB).
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                {avatar ? 'Foto Kustom Aktif' : 'Avatar Inisial (0 KB)'}
              </span>
            </div>

            {/* Live Preview & Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4 p-3 bg-white border border-slate-200/80 rounded-xl">
              {/* Preview Avatar */}
              <div className="flex items-center gap-3">
                <UserAvatar
                  avatar={avatar}
                  name={name || username || 'Pengguna'}
                  role={role}
                  size="xl"
                  rounded="rounded-2xl"
                />
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-800">
                    {name || 'Nama Belum Diisi'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    @{username || 'username'}
                  </p>
                  <p className="text-[10px] font-bold text-indigo-600 mt-0.5">
                    {avatar ? '🖼️ Memakai Foto Profil' : '🎨 Memakai Inisial Otomatis (0 KB)'}
                  </p>
                </div>
              </div>

              {/* Upload & Reset Buttons */}
              <div className="flex-1 flex flex-wrap items-center justify-end gap-2 w-full">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="avatar-upload-input"
                />

                <label
                  htmlFor="avatar-upload-input"
                  className={`inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer ${
                    isCompressing ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  {isCompressing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Mengompresi...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Foto (4-8 KB)</span>
                    </>
                  )}
                </label>

                {avatar && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    title="Hapus foto dan kembali ke inisial nama (0 KB)"
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Pakai Inisial (0 KB)</span>
                  </button>
                )}
              </div>
            </div>

            {/* Status Informasi Kompresi */}
            {compressionInfo && (
              <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800">
                <Cpu className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Kompresi Berhasil:</strong> Dari {compressionInfo.originalSizeKb} KB menjadi <strong>{compressionInfo.sizeKb} KB</strong> ({compressionInfo.width}x{compressionInfo.height} px). Sangat ringan dan siap disimpan!
                </span>
              </div>
            )}

            {/* Presets Alternatif */}
            <div className="pt-2 border-t border-slate-200/60">
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Atau Pilih Contoh Karakter Siap Pakai:
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {AVATAR_PRESETS.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setAvatar(url);
                      setCompressionInfo(null);
                    }}
                    className={`relative shrink-0 rounded-xl overflow-hidden p-0.5 border-2 transition cursor-pointer ${
                      avatar === url
                        ? 'border-indigo-600 ring-2 ring-indigo-400/30'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt="preset" className="w-8 h-8 rounded-lg object-cover" />
                    {avatar === url && (
                      <div className="absolute inset-0 bg-indigo-600/30 flex items-center justify-center">
                        <CheckCircle2 className="w-3.5 h-3.5 text-white drop-shadow" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Status Aktif Switch */}
          <div className="pt-2 flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <div>
              <span className="text-xs font-bold text-slate-800">Status Akun Aktif</span>
              <p className="text-[10px] text-slate-500">
                Akun aktif dapat masuk dan menggunakan fitur sesuai perannya
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-2.5">
            <div>
              {initialData?.id && onDelete && (
                initialData.id === currentUserId ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-500 rounded-xl text-xs font-semibold">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Akun login Anda saat ini (tidak dapat dihapus)</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onClose?.();
                      onDelete(initialData.id);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Akun</span>
                  </button>
                )
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onClose?.()}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/25 flex items-center gap-1.5 transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Simpan Akun
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
