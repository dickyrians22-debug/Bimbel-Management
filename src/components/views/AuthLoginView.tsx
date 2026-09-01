import React, { useState } from 'react';
import {
  ShieldCheck,
  GraduationCap,
  Users,
  LogIn,
  Sparkles,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  KeyRound,
  Globe,
} from 'lucide-react';
import { UserRole, UserSession, UserAccount, BimbelSettings, Student } from '../../types';
import { UserAvatar } from '../common/UserAvatar';

interface AuthLoginViewProps {
  onLoginSuccess: (user: UserSession) => void;
  users: UserAccount[];
  students?: Student[];
  settings?: BimbelSettings;
  onOpenPublicPortal?: () => void;
}

export const AuthLoginView: React.FC<AuthLoginViewProps> = ({
  onLoginSuccess,
  users,
  students = [],
  settings,
  onOpenPublicPortal,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('owner');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAccountsDirectory, setShowAccountsDirectory] = useState(false);

  const bimbelName = settings?.bimbelName || 'BIMBEL SIGMA';
  const tagline = settings?.tagline || 'Belajar Sampai Paham, Bukan Sekadar Hafal';
  const logoSymbol = settings?.logoSymbol || 'Σ';
  const loginWelcome =
    settings?.loginWelcomeMessage || 'Sistem Manajemen & Presensi Digital Bimbel Terintegrasi';

  // Handle role tab click
  const handleRoleTabClick = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMsg('');
  };

  // Select account from helper directory (hanya isi role & username demi keamanan)
  const handlePickAccount = (acc: UserAccount) => {
    setSelectedRole(acc.role);
    setUsername(acc.username);
    setPassword(''); // Keamanan: password tidak diisi otomatis, pengguna wajib memasukkan password manual
    setErrorMsg('');
    setShowAccountsDirectory(false);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const inputUsername = (username || '').trim().toLowerCase();
    const inputPassword = (password || '').trim();

    // 1. Mandatory Fields Check
    if (!inputUsername) {
      setErrorMsg('Mohon masukkan Username atau ID Akun Anda.');
      return;
    }
    if (!inputPassword) {
      setErrorMsg('Mohon masukkan Kata Sandi (Password) Anda.');
      return;
    }

    // 2. Lookup Account in Database with Priority to the Selected Role Tab
    // First, look for matching account within the chosen role tab
    let matchedAccount = users.find(
      (u) =>
        u.role === selectedRole &&
        ((u.username || '').toLowerCase() === inputUsername ||
          (u.email || '').toLowerCase() === inputUsername ||
          (u.code || '').toLowerCase() === inputUsername)
    );

    // If selected tab is 'siswa' and not found in users, check registered students database
    if (!matchedAccount && selectedRole === 'siswa') {
      const matchedStudent = students.find(
        (s) =>
          (s.code || '').toLowerCase() === inputUsername ||
          (s.name || '').toLowerCase() === inputUsername
      );
      if (matchedStudent) {
        matchedAccount = {
          id: `usr-${matchedStudent.id}`,
          role: 'siswa',
          name: matchedStudent.name,
          username: matchedStudent.code.toLowerCase(),
          code: matchedStudent.code,
          linkedStudentId: matchedStudent.id,
          password: 'sigma123',
          isActive: matchedStudent.status === 'Aktif',
          avatar:
            'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
          specialty: `${matchedStudent.gradeDetail} (${matchedStudent.classType})`,
        };
      }
    }

    // If not found in the selected role, search across all users to give helpful feedback
    if (!matchedAccount) {
      const otherRoleAccount = users.find(
        (u) =>
          (u.username || '').toLowerCase() === inputUsername ||
          (u.email || '').toLowerCase() === inputUsername ||
          (u.code || '').toLowerCase() === inputUsername
      );

      if (otherRoleAccount) {
        setErrorMsg(
          `⚠️ Akun "${otherRoleAccount.name}" terdaftar sebagai peran ${otherRoleAccount.role.toUpperCase()}. Silakan ganti ke tab peran "${otherRoleAccount.role.toUpperCase()}" di bagian atas untuk login.`
        );
        return;
      }
    }

    // STRICT RULE 1: Account must exist in database
    if (!matchedAccount) {
      setErrorMsg(
        `❌ Akun dengan username/ID "${username}" tidak terdaftar di sistem. Periksa kembali atau hubungi pengelola.`
      );
      return;
    }

    // STRICT RULE 2: Account must be active
    if (matchedAccount.isActive === false) {
      setErrorMsg(
        `⚠️ Akun "${matchedAccount.name}" (@${matchedAccount.username}) sedang dinonaktifkan oleh Owner. Silakan hubungi pengelola bimbel.`
      );
      return;
    }

    // STRICT RULE 3: Role must match the selected tab
    if (matchedAccount.role !== selectedRole) {
      setErrorMsg(
        `⚠️ Peran akun tidak sesuai! Akun ini terdaftar sebagai peran ${matchedAccount.role.toUpperCase()}, sedangkan Anda memilih tab ${selectedRole.toUpperCase()}. Silakan klik tab peran ${matchedAccount.role.toUpperCase()} di atas.`
      );
      return;
    }

    // STRICT RULE 4: Password must strictly match
    const validPassword = matchedAccount.password || 'sigma123';
    if (inputPassword !== validPassword) {
      setErrorMsg(
        `❌ Kata sandi (password) yang Anda masukkan salah untuk akun @${matchedAccount.username}. Pastikan huruf besar/kecil sudah benar.`
      );
      return;
    }

    // Validation passed strictly!
    setIsSubmitting(true);
    setTimeout(() => {
      onLoginSuccess(matchedAccount!);
    }, 250);
  };

  // Get active accounts grouped for the reference modal
  const activeAccounts = users.filter((u) => u.isActive !== false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative ambient glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        {/* Brand Logo & Name */}
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-amber-400 flex items-center justify-center font-black text-3xl text-white shadow-2xl shadow-indigo-500/40 mx-auto font-heading border border-white/20">
          {logoSymbol}
        </div>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-white font-heading">
          {bimbelName}
        </h1>
        {tagline && (
          <p className="mt-1 text-xs font-semibold text-amber-300 uppercase tracking-widest">
            {tagline}
          </p>
        )}
        <p className="mt-2 text-xs text-slate-400 max-w-sm mx-auto">
          {loginWelcome}
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-xl relative z-10">
        {onOpenPublicPortal && (
          <button
            type="button"
            onClick={onOpenPublicPortal}
            className="w-full mb-4 py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-amber-500 hover:from-indigo-500 hover:to-amber-400 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center justify-between transition cursor-pointer border border-white/20 group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                <Globe className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <p className="text-xs font-black font-heading text-white">
                  Portal Layanan Publik (PPDB &amp; Cek Mandiri)
                </p>
                <p className="text-[10px] text-indigo-100 font-medium">
                  Pendaftaran Siswa Baru, Cek Presensi &amp; Iuran Tanpa Login
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-white/20 group-hover:bg-white/30 text-white text-[11px] font-bold">
              Buka Portal →
            </span>
          </button>
        )}

        <div className="bg-white/95 backdrop-blur-md py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-white/20 space-y-6">
          {/* 3 Role Selection Tabs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                Pilih Akses Peran Login
              </label>
              <span className="text-[11px] text-slate-400 font-medium">Wajib sesuai akun</span>
            </div>
            <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => handleRoleTabClick('owner')}
                className={`py-3 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1.5 transition cursor-pointer ${
                  selectedRole === 'owner'
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>1. OWNER</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleTabClick('tutor')}
                className={`py-3 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1.5 transition cursor-pointer ${
                  selectedRole === 'tutor'
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>2. TUTOR</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleTabClick('siswa')}
                className={`py-3 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1.5 transition cursor-pointer ${
                  selectedRole === 'siswa'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>3. SISWA</span>
              </button>
            </div>
          </div>

          {/* Role Feature Highlights */}
          <div
            className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
              selectedRole === 'owner'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : selectedRole === 'tutor'
                ? 'bg-teal-50 border-teal-200 text-teal-900'
                : 'bg-indigo-50 border-indigo-200 text-indigo-900'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>
                {selectedRole === 'owner'
                  ? 'Akses Owner (Super Admin / Manajemen Penuh)'
                  : selectedRole === 'tutor'
                  ? 'Akses Pengajar / Tutor'
                  : 'Portal Siswa & Orang Tua'}
              </span>
            </div>
            <p className="text-[11px] leading-relaxed opacity-90">
              {selectedRole === 'owner'
                ? 'Kelola data siswa, absensi, keuangan SPP & pengeluaran, laporan laba rugi, dan manajemen akun pengguna.'
                : selectedRole === 'tutor'
                ? 'Pencatatan absensi harian, topik & evaluasi materi belajar siswa, serta cetak kartu presensi.'
                : 'Absensi mandiri harian, pantau materi tiap sesi pembelajaran, dan riwayat kehadiran pribadi.'}
            </p>
          </div>

          {/* Validated Login Form */}
          <form onSubmit={handleFormSubmit} className="space-y-4" autoComplete="off" data-lpignore="true">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Username / ID Pengguna
                </label>
                <span className="text-[11px] text-slate-400">
                  {selectedRole === 'owner'
                    ? 'Contoh: owner'
                    : selectedRole === 'tutor'
                    ? 'Contoh: tutor, dimas'
                    : 'Contoh: siswa, siti, SGM-001'}
                </span>
              </div>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setErrorMsg('');
                  }}
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-slate-900 text-sm focus:bg-white focus:ring-2 font-medium transition ${
                    errorMsg
                      ? 'border-rose-400 focus:ring-rose-400'
                      : 'border-slate-300 focus:ring-indigo-500'
                  }`}
                  placeholder="Masukkan username atau ID akun Anda..."
                  autoComplete="off"
                  data-lpignore="true"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Kata Sandi (Password)
                </label>
                <span className="text-[11px] text-slate-400">Wajib sesuai akun</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMsg('');
                  }}
                  className={`w-full pl-10 pr-11 py-2.5 bg-slate-50 border rounded-xl text-slate-900 text-sm focus:bg-white focus:ring-2 font-medium transition ${
                    errorMsg
                      ? 'border-rose-400 focus:ring-rose-400'
                      : 'border-slate-300 focus:ring-indigo-500'
                  }`}
                  placeholder="Ketik kata sandi akun..."
                  autoComplete="new-password"
                  data-lpignore="true"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer p-1"
                  title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message Box */}
            {errorMsg && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-700 animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-rose-900">Gagal Masuk (Autentikasi Ditolak)</p>
                  <p className="leading-relaxed">{errorMsg}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              id="login-submit-btn"
              disabled={isSubmitting}
              className={`w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition cursor-pointer ${
                isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Memverifikasi Akun...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Masuk ke Dashboard {bimbelName}</span>
                </>
              )}
            </button>
          </form>

          {/* Collapsible Registered Accounts Directory */}
          <div className="pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowAccountsDirectory(!showAccountsDirectory)}
              className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-between transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                <span>Lihat Daftar Akun Terdaftar di Sistem</span>
              </div>
              {showAccountsDirectory ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {showAccountsDirectory && (
              <div className="mt-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5 animate-in fade-in duration-200 text-xs">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider pb-1 border-b border-slate-200">
                  <span>Akun Aktif Terdaftar</span>
                  <span>Klik untuk Gunakan</span>
                </div>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {activeAccounts.map((acc) => (
                    <div
                      key={acc.id}
                      className="p-2 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-2 hover:border-indigo-300 transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <UserAvatar
                          avatar={acc.avatar}
                          name={acc.name}
                          role={acc.role}
                          size="xs"
                          rounded="rounded-lg"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 text-xs truncate">
                            {acc.name}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            @{acc.username} •{' '}
                            <span className="font-semibold uppercase text-indigo-700">
                              {acc.role}
                            </span>
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handlePickAccount(acc)}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 font-bold rounded-lg text-[11px] transition cursor-pointer shrink-0"
                      >
                        Pilih
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 italic text-center pt-1">
                  * Password akun dapat diubah melalui menu Pengaturan &gt; Kelola Akun (Akses Owner).
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <p className="mt-6 text-center text-xs text-slate-400">
          Sistem Autentikasi Terintegrasi • Validasi Database Akun &amp; Multi-Role
        </p>
      </div>
    </div>
  );
};
