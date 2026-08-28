export type UserRole = 'owner' | 'tutor' | 'siswa';

export interface UserSession {
  role: UserRole;
  id: string;
  name: string;
  username: string;
  email?: string;
  code?: string;
  phone?: string;
  avatar?: string;
  specialty?: string;
}

export interface UserAccount extends UserSession {
  password?: string;
  isActive?: boolean;
  linkedStudentId?: string;
  createdAt?: string;
}

export interface WhatsAppTemplates {
  unpaidBilling?: string; // Template Tagihan SPP Belum Bayar
  partialBilling?: string; // Template Tagihan Cicilan / Bayar Sebagian
  paidBilling?: string; // Template Tagihan Lunas / Terima Kasih
  studentReport?: string; // Template Laporan Presensi & Evaluasi Belajar Siswa
}

export interface BimbelSettings {
  bimbelName: string;
  tagline: string;
  ownerName: string;
  ownerTitle?: string;
  directorTitle?: string;
  financeOfficerName?: string;
  financeOfficerTitle?: string;
  operationalManagerName?: string;
  operationalManagerTitle?: string;
  phone: string;
  email: string;
  address: string;
  city?: string; // Kota / Kabupaten penerbitan dokumen & slip gaji (misal: "Blora", "Jakarta Selatan")
  bankInfo: string;
  expenseCategories: string[];
  incomeCategories: string[];
  paymentMethods: string[];

  // Kategori Sistem Khusus (Acuan otomatis modul SPP & Honor, terkunci dari penghapusan)
  systemSalaryCategory?: string; // e.g. "Gaji / Honor Tutor"
  systemSppCategory?: string; // e.g. "Pembayaran SPP Siswa"

  // Template Pesan WhatsApp Kustom
  whatsappTemplates?: WhatsAppTemplates;

  // Tampilan & Kustomisasi Desain / Teks
  logoSymbol?: string;
  appVersionBadge?: string;
  sidebarFooterTitle?: string;
  sidebarFooterTagline?: string;
  sidebarFooterNote?: string;
  accentColor?: string; // 'indigo' | 'blue' | 'emerald' | 'violet' | 'rose' | 'amber'

  // Kustomisasi Teks Dashboard & Banner
  ownerDashboardBadge?: string;
  ownerDashboardTitle?: string;
  ownerDashboardMessage?: string;
  tutorDashboardBadge?: string;
  tutorDashboardTitle?: string;
  tutorDashboardMessage?: string;
  studentDashboardBadge?: string;
  studentDashboardTitle?: string;
  studentDashboardMessage?: string;
  loginWelcomeMessage?: string;

  // Konfigurasi Tarif & Rumus Gaji Tutor
  salaryCalculationMode?: 'percentage' | 'flat' | 'hybrid';
  privatSalaryPercentage?: number; // default 60%
  groupSalaryPercentage?: number; // default 40%
  semiPrivatSalaryPercentage?: number; // default 50%
  minPrivatSessionRate?: number; // e.g. 50.000
  minGroupSessionRate?: number; // e.g. 60.000
  flatPrivatSessionRate?: number; // e.g. 60.000
  flatGroupSessionRate?: number; // e.g. 75.000
  transportAllowancePerDay?: number; // e.g. 15.000 / hari mengajar
  evaluationBonusPerSession?: number; // e.g. 5.000 / sesi dengan topik lengkap
}

export type StudentLevel = 'PAUD' | 'SD' | 'SMP' | 'SMA' | 'UTBK';
export type ClassType = 'Privat' | 'Grup';
export type StudentStatus = 'Aktif' | 'Non-Aktif';
export type StudentPackageType = 'monthly' | 'session_pack'; // SPP Bulanan vs Paket Sesi

export interface Student {
  id: string;
  code: string; // e.g. "SGM-001"
  name: string;
  level: StudentLevel;
  gradeDetail: string; // e.g. "Kelas 5 SD", "Kelas 9 SMP"
  classType: ClassType;
  packageType?: StudentPackageType; // 'monthly' | 'session_pack'
  monthlyFee?: number; // Nominal SPP Bulanan (default auto saat bayar SPP)
  pricePerSession: number; // in IDR (Tarif per sesi)
  sessionQuota?: number; // Total kuota sesi dimiliki (untuk siswa paket sesi)
  remainingSessions?: number; // Sisa sesi belajar
  parentName: string;
  parentPhone: string;
  address?: string;
  status: StudentStatus;
  joinDate: string; // YYYY-MM-DD
  notes?: string;
  tutorName?: string;
  createdAt?: string;
}

export type AttendanceStatus = 'Hadir' | 'Izin' | 'Sakit' | 'Alpha';

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  studentId: string;
  studentCode: string;
  studentName: string;
  classType: ClassType;
  status: AttendanceStatus;
  sessionNumber?: number;
  topic: string; // Materi Pembelajaran
  tutorNotes?: string; // Catatan Kehadiran / Evaluasi Siswa
  tutorName: string;
  createdAt: string;
}

export type PaymentMethod =
  | 'Tunai'
  | 'Transfer BCA'
  | 'Transfer Mandiri'
  | 'Transfer BRI'
  | 'Transfer BNI'
  | 'QRIS'
  | 'GoPay / OVO / Dana'
  | string;

export type IncomeCategoryType = 'spp_monthly' | 'session_pack' | 'registration' | 'general';

export interface IncomeRecord {
  id: string;
  datePaid: string; // YYYY-MM-DD (Tanggal Uang Masuk)
  incomeCategory?: IncomeCategoryType; // 'spp_monthly' | 'session_pack' | 'registration' | 'general'
  accrualMonth: number; // 1-12 ("Pembayaran Untuk Bulan X")
  accrualYear: number; // e.g. 2026
  studentId?: string; // Kosong jika penerimaan kas umum / non-siswa
  studentCode?: string;
  studentName?: string;
  sourceName?: string; // Nama pembayar/sumber dana (untuk kas masuk umum)
  category?: string; // e.g. "SPP Bulanan Siswa", "Paket Sesi", "Biaya Pendaftaran", etc.
  amount: number; // Jumlah yang dibayarkan sekarang (kas riil masuk)
  totalBill?: number; // Total tagihan asli (jika cicilan)
  remainingBill?: number; // Sisa tagihan belum dibayar (jika cicilan)
  paymentStatus?: 'Lunas' | 'Cicilan';
  sessionsCount?: number;
  paymentMethod: string;
  receiptNumber: string; // e.g. "KW-2026-08-01"
  notes?: string;
  receivedBy: string;
  createdAt: string;
}

export type ExpenseCategory = string;

export interface ExpenseRecord {
  id: string;
  date: string; // YYYY-MM-DD (Tanggal riil kas keluar)
  category: ExpenseCategory;
  title?: string;
  description?: string;
  amount: number;
  paidTo?: string;
  recipient?: string;
  periodMonth?: number; // Periode bulan hak gaji / beban operasional (misal: 8 untuk Agustus)
  periodYear?: number; // Periode tahun hak gaji (misal: 2026)
  tutorId?: string; // ID Tutor jika kategori gaji
  tutorName?: string; // Nama Tutor jika kategori gaji
  paymentMethod?: string;
  receiptRef?: string;
  approvedBy?: string;
  notes?: string;
  createdAt: string;
}

export interface MonthlyPLSummary {
  month: number;
  monthName: string;
  year: number;
  accrualIncome: number; // SPP dialokasikan untuk bulan les ini
  cashIncome: number; // Kas riil masuk di bulan ini
  tutorSalaryExpense: number;
  rentExpense: number;
  utilityExpense: number;
  moduleExpense: number;
  otherExpense: number;
  totalExpenses: number; // Pengeluaran di bulan ini
  accrualNetProfit: number; // accrualIncome - totalExpenses
  cashNetFlow: number; // cashIncome - totalExpenses
  sessionCount: number;
  presentCount: number;
}

export interface TutorSessionDetail {
  attendanceId: string;
  date: string;
  time: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  gradeDetail: string;
  classType: ClassType;
  studentPricePerSession: number;
  calculationType: 'percentage' | 'flat';
  percentageApplied: number;
  calculatedHonor: number;
  topic: string;
  tutorNotes?: string;
}

export interface TutorSalaryRecord {
  id: string;
  month: number;
  year: number;
  tutorId?: string;
  tutorName: string;
  privatSessionsCount: number;
  groupSessionsCount: number;
  totalSessionsCount: number;
  uniqueTeachingDays: number;
  privatGrossHonor: number;
  groupGrossHonor: number;
  baseGrossHonor: number;
  transportAllowance: number;
  bonus: number;
  deductions: number;
  netTotalSalary: number;
  paidAmount?: number;
  remainingAmount?: number;
  status: 'Draft' | 'Menunggu Pembayaran' | 'Dibayar Sebagian' | 'Lunas';
  paidAt?: string;
  paidBy?: string;
  paymentMethod?: string;
  expenseId?: string;
  paymentHistory?: ExpenseRecord[];
  notes?: string;
  sessionDetails?: TutorSessionDetail[];
}

export interface StudentBillingItem {
  id: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  parentName: string;
  parentPhone: string;
  gradeDetail: string;
  classType: ClassType;
  level: StudentLevel;
  month: number;
  year: number;
  pricePerSession: number;
  attendedSessionsCount: number;
  totalSessionsInMonth: number;
  attendanceDates: string[];
  sessionTopics: string[];
  totalBill: number;
  paidAmount: number;
  remainingAmount: number;
  status: 'Belum Bayar' | 'Sebagian' | 'Lunas' | 'Tanpa Tagihan';
  incomesList: IncomeRecord[];
}

export type ActiveTab =
  | 'dashboard'
  | 'students'
  | 'attendance'
  | 'student-billing'
  | 'cash-book'
  | 'print-cards'
  | 'salary'
  | 'incomes'
  | 'expenses'
  | 'profit-loss'
  | 'student-portal'
  | 'settings';
