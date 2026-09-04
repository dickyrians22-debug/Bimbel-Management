import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Camera,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Volume2,
  VolumeX,
  RefreshCw,
  Search,
  Clock,
  BookOpen,
  Sparkles,
  Zap,
  RotateCcw,
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Student, AttendanceRecord, UserAccount, BimbelSettings } from '../../types';
import { formatTimeIndo, getTodayDateString, resolveTutorName } from '../../utils/storage';
import { playBeepSound, triggerHaptic, extractStudentCodeFromQR } from '../../utils/qrAudio';
import { UserAvatar } from '../common/UserAvatar';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  attendance: AttendanceRecord[];
  currentUserName: string;
  users?: UserAccount[];
  settings?: BimbelSettings;
  onSaveAttendance: (student: Student, topic: string, notes: string, time: string) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  students,
  attendance,
  currentUserName,
  users = [],
  settings,
  onSaveAttendance,
}) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [rapidScan, setRapidScan] = useState(true);

  // Default topic for today's lesson
  const [topic, setTopic] = useState('Bimbingan Belajar & Latihan Soal Harian');
  const [tutorNotes, setTutorNotes] = useState('');

  // Scan result state
  const [lastScannedStudent, setLastScannedStudent] = useState<Student | null>(null);
  const [scanStatus, setScanStatus] = useState<'idle' | 'success' | 'already-present' | 'not-found'>('idle');
  const [existingRecord, setExistingRecord] = useState<AttendanceRecord | null>(null);
  const [recentScans, setRecentScans] = useState<{ student: Student; time: string; status: 'new' | 'updated' }[]>([]);

  // Manual fallback search
  const [manualSearch, setManualSearch] = useState('');
  const [showManualDropdown, setShowManualDropdown] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'qr-camera-reader-view';
  const isProcessingRef = useRef(false);
  const autoResetTimerRef = useRef<number | null>(null);

  // Keep latest references to prevent stale closures in camera callback
  const attendanceRef = useRef(attendance);
  const handleDecodedTextRef = useRef<(text: string) => void>(() => {});
  const lastScannedStudentCodeRef = useRef<{ code: string; timestamp: number } | null>(null);

  // Immediate in-memory session cache of attended students for today
  // guarantees zero duplicate race conditions even across rapid camera frame updates
  const attendedStudentKeysRef = useRef<Set<string>>(new Set());

  // Keep attendanceRef and attendedStudentKeysRef in sync with attendance prop
  useEffect(() => {
    attendanceRef.current = attendance;
    const todayStr = getTodayDateString();
    const set = new Set<string>();
    attendance.forEach((a) => {
      if (a.date === todayStr) {
        if (a.studentId) set.add(`id:${a.studentId.trim()}`);
        if (a.studentCode) set.add(`code:${a.studentCode.trim().toUpperCase()}`);
        if (a.studentName) set.add(`name:${a.studentName.trim().toLowerCase()}`);
      }
    });
    // Merge existing session marks into the set
    attendedStudentKeysRef.current.forEach((k) => set.add(k));
    attendedStudentKeysRef.current = set;
  }, [attendance]);

  // Initialize and stop camera
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setScanStatus('idle');
      setLastScannedStudent(null);
      setCameraError(null);
      lastScannedStudentCodeRef.current = null;
      return;
    }

    // Delay slight tick to ensure DOM container is mounted
    const timer = setTimeout(() => {
      startCamera();
    }, 250);

    return () => {
      clearTimeout(timer);
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
        } catch {
          // Ignore
        }
      }

      const container = document.getElementById(scannerContainerId);
      if (!container) return;

      const html5QrCode = new Html5Qrcode(scannerContainerId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
        ],
        verbose: false,
      });

      scannerRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        { facingMode },
        config,
        (decodedText) => {
          handleDecodedTextRef.current(decodedText);
        },
        () => {
          // Ignore frame scan failures
        }
      );

      setCameraActive(true);
    } catch (err: unknown) {
      console.warn('Camera start error:', err);
      const errString = err instanceof Error ? err.message : String(err);
      if (errString.includes('Permission') || errString.includes('NotAllowedError')) {
        setCameraError('Izin akses kamera ditolak oleh browser. Mohon izinkan kamera di pengaturan browser Anda.');
      } else if (errString.includes('NotFound') || errString.includes('DevicesNotFoundError')) {
        setCameraError('Kamera tidak ditemukan pada perangkat ini. Anda dapat menggunakan pencarian manual di bawah.');
      } else {
        setCameraError('Gagal mengakses kamera: ' + errString);
      }
      setCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch {
        // Ignore stop errors
      }
      scannerRef.current = null;
    }
    setCameraActive(false);
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Main QR processing logic
  const handleDecodedText = (decodedText: string) => {
    if (isProcessingRef.current) return;

    const extractedCode = extractStudentCodeFromQR(decodedText).toUpperCase();

    // Look up student by code or ID
    const foundStudent = students.find(
      (s) =>
        s.code.toUpperCase() === extractedCode ||
        s.id.toUpperCase() === extractedCode ||
        (s.name.toUpperCase() === extractedCode && extractedCode.length > 3)
    );

    if (!foundStudent) {
      isProcessingRef.current = true;
      if (soundEnabled) playBeepSound('warning');
      triggerHaptic('warning');
      setScanStatus('not-found');
      setLastScannedStudent(null);
      setTimeout(() => {
        isProcessingRef.current = false;
        setScanStatus('idle');
      }, 2500);
      return;
    }

    // Cooldown check: if this same student card was scanned within last 6 seconds,
    // ignore duplicate camera frames while holding the card in view
    const now = Date.now();
    if (
      lastScannedStudentCodeRef.current &&
      lastScannedStudentCodeRef.current.code === foundStudent.code.toUpperCase() &&
      now - lastScannedStudentCodeRef.current.timestamp < 6000
    ) {
      return;
    }

    isProcessingRef.current = true;
    lastScannedStudentCodeRef.current = { code: foundStudent.code.toUpperCase(), timestamp: now };

    // Process attendance for this student
    processAttendanceForStudent(foundStudent);
  };

  // Sync handleDecodedTextRef on every render to eliminate stale closures
  handleDecodedTextRef.current = handleDecodedText;

  const processAttendanceForStudent = (student: Student) => {
    const todayStr = getTodayDateString();
    const now = new Date();
    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const stdId = (student.id || '').trim();
    const stdCode = (student.code || '').trim().toUpperCase();
    const stdName = (student.name || '').trim().toLowerCase();

    // 1. Check in latest attendance array ref (case-insensitive & multiple fallbacks)
    const existing = attendanceRef.current.find((a) => {
      if (a.date !== todayStr) return false;
      if (stdId && a.studentId && a.studentId.trim() === stdId) return true;
      if (stdCode && a.studentCode && a.studentCode.trim().toUpperCase() === stdCode) return true;
      if (stdName && a.studentName && a.studentName.trim().toLowerCase() === stdName) return true;
      return false;
    });

    // 2. Check in immediate session cache (instant guarantee against rapid frame duplicates)
    const isAlreadyMarkedInSession =
      (stdId && attendedStudentKeysRef.current.has(`id:${stdId}`)) ||
      (stdCode && attendedStudentKeysRef.current.has(`code:${stdCode}`)) ||
      (stdName && attendedStudentKeysRef.current.has(`name:${stdName}`));

    setLastScannedStudent(student);

    if (existing || isAlreadyMarkedInSession) {
      if (existing) setExistingRecord(existing);
      setScanStatus('already-present');
      if (soundEnabled) playBeepSound('warning');
      triggerHaptic('warning');

      if (rapidScan) {
        if (autoResetTimerRef.current) clearTimeout(autoResetTimerRef.current);
        autoResetTimerRef.current = window.setTimeout(() => {
          isProcessingRef.current = false;
          setScanStatus('idle');
        }, 2500);
      } else {
        isProcessingRef.current = false;
      }
      return;
    }

    // Mark as attended in session set immediately!
    if (stdId) attendedStudentKeysRef.current.add(`id:${stdId}`);
    if (stdCode) attendedStudentKeysRef.current.add(`code:${stdCode}`);
    if (stdName) attendedStudentKeysRef.current.add(`name:${stdName}`);

    // Save attendance immediately
    setExistingRecord(null);
    setScanStatus('success');
    if (soundEnabled) playBeepSound('success');
    triggerHaptic('success');

    onSaveAttendance(student, topic, tutorNotes, currentTimeStr);

    setRecentScans((prev) => [
      { student, time: currentTimeStr, status: 'new' },
      ...prev.slice(0, 9),
    ]);

    if (rapidScan) {
      if (autoResetTimerRef.current) clearTimeout(autoResetTimerRef.current);
      autoResetTimerRef.current = window.setTimeout(() => {
        isProcessingRef.current = false;
        setScanStatus('idle');
      }, 2000);
    } else {
      isProcessingRef.current = false;
    }
  };

  const handleUpdateExisting = () => {
    if (!lastScannedStudent) return;
    const now = new Date();
    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    onSaveAttendance(lastScannedStudent, topic, tutorNotes || 'Diperbarui via Scan Barcode', currentTimeStr);
    if (soundEnabled) playBeepSound('success');

    setRecentScans((prev) => [
      { student: lastScannedStudent, time: currentTimeStr, status: 'updated' },
      ...prev.slice(0, 9),
    ]);

    setScanStatus('success');
    setTimeout(() => {
      isProcessingRef.current = false;
      setScanStatus('idle');
    }, 1500);
  };

  // Manual search matching
  const matchingStudents = students.filter((s) => {
    if (!manualSearch.trim()) return false;
    const term = manualSearch.toLowerCase();
    return (
      s.name.toLowerCase().includes(term) ||
      s.code.toLowerCase().includes(term) ||
      s.gradeDetail.toLowerCase().includes(term)
    );
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-slate-200 flex flex-col max-h-[95vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-inner">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base font-heading">
                  Scan QR Absensi Siswa
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-400/30 border border-emerald-300/40 text-emerald-100">
                  Real-time
                </span>
              </div>
              <p className="text-[11px] text-emerald-100">
                Arahkan kamera ke kartu QR siswa untuk absensi 1 detik
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Matikan Suara Bip' : 'Nyalakan Suara Bip'}
              className={`p-2 rounded-xl transition cursor-pointer ${
                soundEnabled ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-rose-500/80 text-white'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Controls bar: Rapid Scan & Camera Toggle */}
          <div className="flex items-center justify-between gap-2 p-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rapidScan}
                onChange={(e) => setRapidScan(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Mode Scan Cepat (Auto Siap Siswa Berikutnya)
              </span>
            </label>

            <button
              onClick={toggleFacingMode}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
            >
              <RefreshCw className="w-3 h-3" />
              <span>{facingMode === 'environment' ? 'Kamera Belakang' : 'Kamera Depan'}</span>
            </button>
          </div>

          {/* Camera Viewport & Scan Area */}
          <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-slate-800 aspect-square max-h-[300px] flex items-center justify-center">
            <div id={scannerContainerId} className="w-full h-full" />

            {/* Scanning Target Overlay */}
            {cameraActive && scanStatus === 'idle' && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="w-56 h-56 border-2 border-dashed border-emerald-400/80 rounded-2xl flex items-center justify-center relative">
                  <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                  <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                  <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                  <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
                  <p className="text-[10px] text-white/80 bg-black/50 px-2 py-0.5 rounded-full backdrop-blur-xs font-semibold">
                    Posisikan QR di dalam kotak
                  </p>
                </div>
              </div>
            )}

            {/* Error Overlay if camera blocked */}
            {cameraError && (
              <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-6 text-center text-white space-y-3">
                <AlertCircle className="w-10 h-10 text-rose-400" />
                <p className="text-xs text-slate-300 font-medium leading-relaxed max-w-sm">
                  {cameraError}
                </p>
                <button
                  onClick={startCamera}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Coba Akses Kamera Lagi
                </button>
              </div>
            )}

            {/* Success Celebratory Banner Overlay */}
            {scanStatus === 'success' && lastScannedStudent && (
              <div className="absolute inset-0 bg-emerald-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-white text-center space-y-2.5 animate-in zoom-in-95 duration-200">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-lg">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
                    🎉 Presensi Berhasil Dicatat!
                  </span>
                  <h4 className="text-lg font-bold font-heading">{lastScannedStudent.name}</h4>
                  <p className="text-xs text-emerald-100 font-mono">
                    NIS: {lastScannedStudent.code} • {lastScannedStudent.gradeDetail}
                  </p>
                </div>
                <div className="px-3 py-1 bg-emerald-500/20 rounded-full text-[11px] text-emerald-200 font-medium">
                  {formatTimeIndo(new Date().toTimeString().slice(0, 5))} WIB • Hadir
                </div>
                {rapidScan && (
                  <p className="text-[10px] text-emerald-300/70 pt-1 animate-pulse">
                    Otomatis siap memindai siswa berikutnya...
                  </p>
                )}
              </div>
            )}

            {/* Already Checked In Warning Overlay */}
            {scanStatus === 'already-present' && lastScannedStudent && existingRecord && (
              <div className="absolute inset-0 bg-amber-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-white text-center space-y-2.5 animate-in zoom-in-95 duration-200">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-400">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                    Sudah Hadir Hari Ini
                  </span>
                  <h4 className="text-base font-bold">{lastScannedStudent.name}</h4>
                  <p className="text-xs text-amber-100">
                    Tercatat pukul <strong>{existingRecord.time} WIB</strong> oleh Tutor{' '}
                    <strong>{resolveTutorName(existingRecord.tutorName, users)}</strong>
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleUpdateExisting}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Perbarui Jam Sekarang
                  </button>
                  <button
                    onClick={() => {
                      isProcessingRef.current = false;
                      setScanStatus('idle');
                    }}
                    className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    Lanjut Siswa Lain
                  </button>
                </div>
              </div>
            )}

            {/* QR Not Found Overlay */}
            {scanStatus === 'not-found' && (
              <div className="absolute inset-0 bg-rose-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-white text-center space-y-2 animate-in zoom-in-95 duration-200">
                <AlertCircle className="w-10 h-10 text-rose-400" />
                <h4 className="text-sm font-bold">Kode QR Tidak Dikenali</h4>
                <p className="text-xs text-rose-200 max-w-xs">
                  Barcode/QR ini tidak cocok dengan kode siswa mana pun di database Bimbel Sigma.
                </p>
              </div>
            )}
          </div>

          {/* Quick Config: Topic & Notes */}
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                Materi Hari Ini (Otomatis Masuk Log)
              </span>
              <span className="text-[11px] text-slate-400">
                Tutor: {currentUserName}
              </span>
            </div>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Contoh: Bimbingan Matematika Pecahan & Latihan Soal..."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition"
            />
          </div>

          {/* Fallback Manual Search (If barcode damaged or camera unavailable) */}
          <div className="space-y-1.5 relative">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Atau Cari Siswa Manual (Ketik NIS / Nama):
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={manualSearch}
                onFocus={() => setShowManualDropdown(true)}
                onChange={(e) => {
                  setManualSearch(e.target.value);
                  setShowManualDropdown(true);
                }}
                placeholder="Ketik NIS (misal: SIS-001) atau nama anak..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden transition"
              />
            </div>

            {/* Dropdown for manual match */}
            {showManualDropdown && matchingStudents.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl border border-slate-200 shadow-xl z-20 max-h-48 overflow-y-auto divide-y divide-slate-100">
                {matchingStudents.map((std) => (
                  <button
                    key={std.id}
                    onClick={() => {
                      setShowManualDropdown(false);
                      setManualSearch('');
                      processAttendanceForStudent(std);
                    }}
                    className="w-full p-2.5 text-left hover:bg-emerald-50 flex items-center justify-between transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <UserAvatar name={std.name} role="siswa" size="sm" rounded="rounded-lg" />
                      <div>
                        <p className="text-xs font-bold text-slate-900">{std.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {std.code} • {std.gradeDetail} ({std.classType})
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-bold">
                      Pilih & Absen
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Recent Scans in this session */}
          {recentScans.length > 0 && (
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Riwayat Scan Sesi Ini ({recentScans.length} Siswa):</span>
                <span className="text-[10px] text-emerald-600 font-normal">Tersimpan di Cloud</span>
              </p>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {recentScans.map((item, idx) => (
                  <div
                    key={`${item.student.id}-${idx}`}
                    className="p-2 bg-slate-50 rounded-xl flex items-center justify-between text-xs border border-slate-100"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-bold text-slate-800">{item.student.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({item.student.code})</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded font-bold">
                      {item.time} WIB
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <p className="text-[11px] text-slate-500">
            Tutor / Admin: <strong>{currentUserName}</strong>
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
