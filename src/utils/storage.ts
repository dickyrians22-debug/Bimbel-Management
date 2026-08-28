import {
  Student,
  AttendanceRecord,
  IncomeRecord,
  ExpenseRecord,
  UserSession,
  UserAccount,
  BimbelSettings,
  MonthlyPLSummary,
} from '../types';
import {
  INITIAL_STUDENTS,
  INITIAL_ATTENDANCE,
  INITIAL_INCOMES,
  INITIAL_EXPENSES,
  DEFAULT_USERS,
  DEFAULT_ACCOUNTS,
  DEFAULT_SETTINGS,
} from './mockData';

const KEYS = {
  STUDENTS: 'bimbel_sigma_students_v3',
  ATTENDANCE: 'bimbel_sigma_attendance_v5',
  INCOMES: 'bimbel_sigma_incomes_v2',
  EXPENSES: 'bimbel_sigma_expenses_v2',
  AUTH: 'bimbel_sigma_auth_v3',
  USERS: 'bimbel_sigma_users_v3',
  SETTINGS: 'bimbel_sigma_settings_v2',
};

// Role sorting priority: 1. Owner -> 2. Tutor -> 3. Siswa
export const ROLE_ORDER_PRIORITY: Record<string, number> = {
  owner: 1,
  tutor: 2,
  siswa: 3,
};

/**
 * Sort user accounts by strict role hierarchy: Owner -> Tutor -> Siswa,
 * then alphabetically by name/username for consistent, organized database records.
 */
export function sortUsersByRole(users: UserAccount[]): UserAccount[] {
  if (!Array.isArray(users)) return [];
  return [...users].sort((a, b) => {
    const pA = ROLE_ORDER_PRIORITY[a.role] ?? 99;
    const pB = ROLE_ORDER_PRIORITY[b.role] ?? 99;
    if (pA !== pB) {
      return pA - pB;
    }
    const nameA = (a.name || '').toLowerCase();
    const nameB = (b.name || '').toLowerCase();
    if (nameA !== nameB) {
      return nameA.localeCompare(nameB, 'id');
    }
    return (a.username || '').toLowerCase().localeCompare((b.username || '').toLowerCase(), 'id');
  });
}

// --- Storage Retrieval with Fallback to Mock Data ---

export function getInitialUsers(): UserAccount[] {
  try {
    const raw = localStorage.getItem(KEYS.USERS);
    if (!raw) {
      const sortedDefault = sortUsersByRole(DEFAULT_ACCOUNTS);
      localStorage.setItem(KEYS.USERS, JSON.stringify(sortedDefault));
      return sortedDefault;
    }
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_ACCOUNTS;
    const sorted = sortUsersByRole(list);
    localStorage.setItem(KEYS.USERS, JSON.stringify(sorted));
    return sorted;
  } catch (e) {
    return sortUsersByRole(DEFAULT_ACCOUNTS);
  }
}

export function saveUsers(users: UserAccount[]): void {
  try {
    const sorted = sortUsersByRole(users);
    localStorage.setItem(KEYS.USERS, JSON.stringify(sorted));
  } catch (e) {
    console.error('Error saving users', e);
  }
}

export function getInitialSettings(): BimbelSettings {
  try {
    const raw = localStorage.getItem(KEYS.SETTINGS);
    if (!raw) {
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? { ...DEFAULT_SETTINGS, ...parsed } : DEFAULT_SETTINGS;
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: BimbelSettings): void {
  try {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving settings', e);
  }
}

export function getInitialStudents(): Student[] {
  try {
    const raw = localStorage.getItem(KEYS.STUDENTS);
    if (!raw) {
      localStorage.setItem(KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
      return INITIAL_STUDENTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_STUDENTS;
  } catch (e) {
    return INITIAL_STUDENTS;
  }
}

export function saveStudents(students: Student[]): void {
  try {
    localStorage.setItem(KEYS.STUDENTS, JSON.stringify(students));
  } catch (e) {
    console.error('Error saving students', e);
  }
}

export function getInitialAttendance(): AttendanceRecord[] {
  try {
    const raw = localStorage.getItem(KEYS.ATTENDANCE);
    if (!raw) {
      localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(INITIAL_ATTENDANCE));
      return INITIAL_ATTENDANCE;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_ATTENDANCE;
  } catch (e) {
    return INITIAL_ATTENDANCE;
  }
}

export function saveAttendance(attendance: AttendanceRecord[]): void {
  try {
    localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(attendance));
  } catch (e) {
    console.error('Error saving attendance', e);
  }
}

export function getInitialIncomes(): IncomeRecord[] {
  try {
    const raw = localStorage.getItem(KEYS.INCOMES);
    if (!raw) {
      localStorage.setItem(KEYS.INCOMES, JSON.stringify(INITIAL_INCOMES));
      return INITIAL_INCOMES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_INCOMES;
  } catch (e) {
    return INITIAL_INCOMES;
  }
}

export function saveIncomes(incomes: IncomeRecord[]): void {
  try {
    localStorage.setItem(KEYS.INCOMES, JSON.stringify(incomes));
  } catch (e) {
    console.error('Error saving incomes', e);
  }
}

export function getInitialExpenses(): ExpenseRecord[] {
  try {
    const raw = localStorage.getItem(KEYS.EXPENSES);
    if (!raw) {
      // Normalize raw expenses to include title
      const normalized = INITIAL_EXPENSES.map((e) => ({
        ...e,
        title: (e as any).title || (e as any).description || 'Pengeluaran Operasional',
        paidTo: (e as any).paidTo || (e as any).recipient || '-',
      }));
      localStorage.setItem(KEYS.EXPENSES, JSON.stringify(normalized));
      return normalized;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((e) => ({
        ...e,
        title: (e as any).title || (e as any).description || 'Pengeluaran Operasional',
        paidTo: (e as any).paidTo || (e as any).recipient || '-',
      }));
    }
    return INITIAL_EXPENSES.map((e) => ({
      ...e,
      title: (e as any).title || (e as any).description || 'Pengeluaran Operasional',
      paidTo: (e as any).paidTo || (e as any).recipient || '-',
    }));
  } catch (e) {
    return INITIAL_EXPENSES.map((e) => ({
      ...e,
      title: (e as any).title || (e as any).description || 'Pengeluaran Operasional',
      paidTo: (e as any).paidTo || (e as any).recipient || '-',
    }));
  }
}

export function saveExpenses(expenses: ExpenseRecord[]): void {
  try {
    localStorage.setItem(KEYS.EXPENSES, JSON.stringify(expenses));
  } catch (e) {
    console.error('Error saving expenses', e);
  }
}

export function resetToMockData(): {
  students: Student[];
  attendance: AttendanceRecord[];
  incomes: IncomeRecord[];
  expenses: ExpenseRecord[];
  users: UserAccount[];
  settings: BimbelSettings;
} {
  const normalizedExpenses = INITIAL_EXPENSES.map((e) => ({
    ...e,
    title: (e as any).title || (e as any).description || 'Pengeluaran Operasional',
    paidTo: (e as any).paidTo || (e as any).recipient || '-',
  }));

  const sortedUsers = sortUsersByRole(DEFAULT_ACCOUNTS);
  localStorage.setItem(KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
  localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(INITIAL_ATTENDANCE));
  localStorage.setItem(KEYS.INCOMES, JSON.stringify(INITIAL_INCOMES));
  localStorage.setItem(KEYS.EXPENSES, JSON.stringify(normalizedExpenses));
  localStorage.setItem(KEYS.USERS, JSON.stringify(sortedUsers));
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));

  return {
    students: INITIAL_STUDENTS,
    attendance: INITIAL_ATTENDANCE,
    incomes: INITIAL_INCOMES,
    expenses: normalizedExpenses,
    users: sortedUsers,
    settings: DEFAULT_SETTINGS,
  };
}

// Formatters
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export const MONTH_NAMES_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export function getMonthNameIndo(monthNum: number): string {
  return MONTH_NAMES_ID[monthNum - 1] || `Bulan ${monthNum}`;
}

export function formatDateIndo(dateString: string): string {
  if (!dateString) return '-';
  try {
    const [year, month, day] = dateString.split('-');
    if (!year || !month || !day) return dateString;
    return `${parseInt(day, 10)} ${MONTH_NAMES_ID[parseInt(month, 10) - 1]} ${year}`;
  } catch (e) {
    return dateString;
  }
}

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentTimeString(): string {
  const d = new Date();
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${mins}`;
}

// Student Monthly Summary Calculator
export interface StudentMonthlyAttendanceSummary {
  student: Student;
  month: number;
  year: number;
  records: AttendanceRecord[];
  presentCount: number; // strict >0 logic
  permissionCount: number;
  sickCount: number;
  alphaCount: number;
  totalSessions: number;
  pricePerSession: number;
  totalBilled: number;
  totalPaid: number;
  paymentStatus: 'Lunas' | 'Kurang Bayar' | 'Belum Bayar' | 'Lebih Bayar';
  balanceRemaining: number;
}

export function calculateStudentMonthlySummary(
  student: Student,
  month: number,
  year: number,
  allAttendance: AttendanceRecord[],
  allIncomes: IncomeRecord[]
): StudentMonthlyAttendanceSummary {
  const targetPrefix = `${year}-${String(month).padStart(2, '0')}`;

  const records = allAttendance
    .filter((a) => a.studentId === student.id && a.date && a.date.startsWith(targetPrefix))
    .sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.time || '').localeCompare(b.time || ''));

  // Strict counting logic: if 0 records, it produces exactly 0!
  const presentCount = records.filter((r) => r.status === 'Hadir').length;
  const permissionCount = records.filter((r) => r.status === 'Izin').length;
  const sickCount = records.filter((r) => r.status === 'Sakit').length;
  const alphaCount = records.filter((r) => r.status === 'Alpha').length;
  const totalSessions = records.length;

  const pricePerSession = student.pricePerSession || 0;
  const totalBilled = presentCount * pricePerSession;

  const paidForMonth = allIncomes
    .filter(
      (inc) =>
        inc.studentId === student.id &&
        inc.accrualMonth === month &&
        inc.accrualYear === year
    )
    .reduce((sum, inc) => sum + (inc.amount || 0), 0);

  const balanceRemaining = totalBilled - paidForMonth;

  let paymentStatus: 'Lunas' | 'Kurang Bayar' | 'Belum Bayar' | 'Lebih Bayar' = 'Belum Bayar';
  if (totalBilled === 0 && paidForMonth === 0) {
    paymentStatus = 'Lunas';
  } else if (paidForMonth >= totalBilled && totalBilled > 0) {
    paymentStatus = paidForMonth > totalBilled ? 'Lebih Bayar' : 'Lunas';
  } else if (paidForMonth > 0 && paidForMonth < totalBilled) {
    paymentStatus = 'Kurang Bayar';
  } else {
    paymentStatus = 'Belum Bayar';
  }

  return {
    student,
    month,
    year,
    records,
    presentCount,
    permissionCount,
    sickCount,
    alphaCount,
    totalSessions,
    pricePerSession,
    totalBilled,
    totalPaid: paidForMonth,
    paymentStatus,
    balanceRemaining,
  };
}

// 12-Month Profit & Loss Comprehensive Calculator
export function calculateAnnualPL(
  year: number,
  allAttendance: AttendanceRecord[],
  allIncomes: IncomeRecord[],
  allExpenses: ExpenseRecord[],
  settings?: BimbelSettings | null
): MonthlyPLSummary[] {
  const result: MonthlyPLSummary[] = [];

  for (let m = 1; m <= 12; m++) {
    const targetMonthStr = `${year}-${String(m).padStart(2, '0')}`;

    // Accrual Income: SPP / Pendapatan untuk periode bulan m dari Buku Kas
    const accrualIncome = allIncomes
      .filter((inc) => {
        const incYear = Number(inc.accrualYear);
        const incMonth = Number(inc.accrualMonth);
        const matchesAccrual = incYear === year && incMonth === m;
        const matchesDateFallback =
          (!inc.accrualMonth || incMonth === 0) &&
          inc.datePaid &&
          inc.datePaid.startsWith(targetMonthStr);
        return matchesAccrual || matchesDateFallback;
      })
      .reduce((sum, inc) => sum + (inc.amount || 0), 0);

    // Cash Income: real cash received in month m
    const cashIncome = allIncomes
      .filter((inc) => inc.datePaid && inc.datePaid.startsWith(targetMonthStr))
      .reduce((sum, inc) => sum + (inc.amount || 0), 0);

    // Monthly Expenses
    const monthExpenses = allExpenses.filter((e) => e.date && e.date.startsWith(targetMonthStr));
    const totalExpenses = monthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    const tutorSalaryExpense = monthExpenses
      .filter((e) => isSystemExpenseCategory(e.category, settings))
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    const rentExpense = monthExpenses
      .filter((e) => (e.category || '').toLowerCase().includes('sewa') || (e.category || '').toLowerCase().includes('gedung'))
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    const utilityExpense = monthExpenses
      .filter((e) => (e.category || '').toLowerCase().includes('listrik') || (e.category || '').toLowerCase().includes('internet') || (e.category || '').toLowerCase().includes('air'))
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    const moduleExpense = monthExpenses
      .filter((e) => (e.category || '').toLowerCase().includes('modul') || (e.category || '').toLowerCase().includes('atk') || (e.category || '').toLowerCase().includes('cetak'))
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    const otherExpense = totalExpenses - (tutorSalaryExpense + rentExpense + utilityExpense + moduleExpense);

    const monthAttendance = allAttendance.filter((a) => a.date && a.date.startsWith(targetMonthStr));
    const sessionCount = monthAttendance.length;
    const presentCount = monthAttendance.filter((a) => a.status === 'Hadir').length;

    result.push({
      month: m,
      monthName: MONTH_NAMES_ID[m - 1],
      year,
      accrualIncome,
      cashIncome,
      tutorSalaryExpense,
      rentExpense,
      utilityExpense,
      moduleExpense,
      otherExpense: Math.max(0, otherExpense),
      totalExpenses,
      accrualNetProfit: accrualIncome - totalExpenses,
      cashNetFlow: cashIncome - totalExpenses,
      sessionCount,
      presentCount,
    });
  }

  return result;
}

// =========================================================================
// SYSTEM CATEGORY ANCHORS & HELPER FUNCTIONS
// Digunakan sebagai acuan data tunggal (single source of truth) untuk
// modul pencatatan gaji/honor tutor dan pembayaran SPP siswa.
// =========================================================================

export const DEFAULT_SYSTEM_EXPENSE_CATEGORY = 'Gaji / Honor Tutor';
export const DEFAULT_SYSTEM_INCOME_CATEGORY = 'Pembayaran SPP Siswa';

/**
 * Mendapatkan nama kategori kas pengeluaran khusus untuk Gaji/Honor Tutor saat ini.
 * Jika pengguna mengganti namanya di Pengaturan (misal: "Honorarium Pengajar"),
 * fungsi ini akan selalu mengembalikan nama aktif tersebut.
 */
export function getSystemSalaryCategory(settings?: BimbelSettings | null): string {
  if (!settings) return DEFAULT_SYSTEM_EXPENSE_CATEGORY;
  if (settings.systemSalaryCategory && settings.systemSalaryCategory.trim()) {
    return settings.systemSalaryCategory.trim();
  }
  const found = (settings.expenseCategories || []).find((c) => {
    const cLow = (c || '').toLowerCase();
    return cLow.includes('gaji') || cLow.includes('honor') || cLow.includes('tutor') || cLow.includes('pengajar');
  });
  return found || (settings.expenseCategories && settings.expenseCategories[0]) || DEFAULT_SYSTEM_EXPENSE_CATEGORY;
}

/**
 * Mendapatkan nama kategori kas masuk khusus untuk Pembayaran SPP Siswa saat ini.
 * Jika pengguna mengganti namanya di Pengaturan (misal: "Iuran Les Siswa"),
 * fungsi ini akan selalu mengembalikan nama aktif tersebut.
 */
export function getSystemSppCategory(settings?: BimbelSettings | null): string {
  if (!settings) return DEFAULT_SYSTEM_INCOME_CATEGORY;
  if (settings.systemSppCategory && settings.systemSppCategory.trim()) {
    return settings.systemSppCategory.trim();
  }
  const found = (settings.incomeCategories || []).find((c) => {
    const cLow = (c || '').toLowerCase();
    const isNonSpp =
      cLow.includes('daftar') ||
      cLow.includes('registrasi') ||
      cLow.includes('modul') ||
      cLow.includes('buku') ||
      cLow.includes('try out') ||
      cLow.includes('ujian') ||
      cLow.includes('event') ||
      cLow.includes('workshop');
    return !isNonSpp && (cLow.includes('spp') || cLow.includes('iuran') || cLow.includes('les') || cLow.includes('tuition'));
  });
  return found || (settings.incomeCategories && settings.incomeCategories[0]) || DEFAULT_SYSTEM_INCOME_CATEGORY;
}

/**
 * Mengecek apakah suatu nama kategori pengeluaran merupakan kategori sistem gaji/honor.
 * Mencakup variasi bahasa Indonesia dan Inggris ("gaji", "honor", "salary", "tutor", "pengajar").
 */
export function isSystemExpenseCategory(categoryName: string, settings?: BimbelSettings | null): boolean {
  if (!categoryName) return false;
  const sysCat = getSystemSalaryCategory(settings).toLowerCase().trim();
  const target = categoryName.toLowerCase().trim();
  return (
    target === sysCat ||
    target.includes('gaji') ||
    target.includes('honor') ||
    target.includes('salary') ||
    target.includes('tutor salary') ||
    target.includes('tutor') ||
    target.includes('pengajar')
  );
}

/**
 * Mengecek apakah suatu nama kategori pemasukan merupakan kategori sistem SPP/Iuran Siswa (Lesson Fee).
 * Hanya kategori ini yang otomatis terikat dan mengakumulasi tagihan SPP bulanan siswa.
 * Kategori lain seperti pendaftaran/registrasi, modul, try out, dan kas umum TIDAK masuk kategori sistem SPP.
 */
export function isSystemIncomeCategory(categoryName: string, settings?: BimbelSettings | null): boolean {
  if (!categoryName) return false;
  const sysCat = getSystemSppCategory(settings).toLowerCase().trim();
  const target = categoryName.toLowerCase().trim();

  // Kategori non-SPP tidak boleh pernah dianggap kategori SPP sistem
  if (
    target.includes('daftar') ||
    target.includes('registrasi') ||
    target.includes('registration') ||
    target.includes('modul') ||
    target.includes('buku') ||
    target.includes('try out') ||
    target.includes('ujian') ||
    target.includes('event') ||
    target.includes('workshop') ||
    target.includes('donasi') ||
    target.includes('lain')
  ) {
    return false;
  }

  return (
    target === sysCat ||
    target.includes('spp') ||
    target.includes('iuran les') ||
    target.includes('iuran') ||
    target.includes('lesson fee') ||
    target.includes('biaya les') ||
    target.includes('tuition')
  );
}

/**
 * Menormalkan kategori pengeluaran agar selalu selaras dengan database master di Pengaturan.
 * Jika berupa kategori honor/gaji (apapun variasi namanya), akan selalu dipetakan ke getSystemSalaryCategory(settings).
 * Jika ada di daftar expenseCategories aktif, akan dinormalkan ke huruf kapital yang tepat.
 */
export function normalizeExpenseCategory(rawCategory: string, settings?: BimbelSettings | null): string {
  if (!rawCategory || !rawCategory.trim()) {
    return getSystemSalaryCategory(settings);
  }
  const clean = rawCategory.trim();
  if (isSystemExpenseCategory(clean, settings)) {
    return getSystemSalaryCategory(settings);
  }
  const matchInSettings = (settings?.expenseCategories || []).find(
    (c) => c.toLowerCase().trim() === clean.toLowerCase()
  );
  if (matchInSettings) {
    return matchInSettings;
  }
  return clean;
}

/**
 * Menormalkan kategori pemasukan agar selalu selaras dengan database master di Pengaturan.
 * Jika berupa kategori SPP siswa (apapun variasi namanya), akan selalu dipetakan ke getSystemSppCategory(settings).
 * Jika ada di daftar incomeCategories aktif, akan dinormalkan ke huruf kapital yang tepat.
 */
export function normalizeIncomeCategory(rawCategory: string, settings?: BimbelSettings | null): string {
  if (!rawCategory || !rawCategory.trim()) {
    return getSystemSppCategory(settings);
  }
  const clean = rawCategory.trim();
  if (isSystemIncomeCategory(clean, settings)) {
    return getSystemSppCategory(settings);
  }
  const matchInSettings = (settings?.incomeCategories || []).find(
    (c) => c.toLowerCase().trim() === clean.toLowerCase()
  );
  if (matchInSettings) {
    return matchInSettings;
  }
  return clean;
}

/**
 * Format standar nomor bukti kas:
 * Kas Masuk  : KW-YYYY-MM-XXX (Kwitansi Masuk)
 * Kas Keluar : KK-YYYY-MM-XXX (Bukti Kas Keluar)
 */

/**
 * Generate nomor kwitansi kas masuk berurutan standar: KW-YYYY-MM-XXX
 */
export function generateIncomeReceiptNumber(
  existingIncomes: IncomeRecord[],
  targetDate?: string
): string {
  const dateStr = targetDate || getTodayDateString();
  const [year, month] = dateStr.split('-');
  const yyyy = year || String(new Date().getFullYear());
  const mm = month ? month.padStart(2, '0') : String(new Date().getMonth() + 1).padStart(2, '0');

  const prefix = `KW-${yyyy}-${mm}-`;
  let maxSeq = 0;

  existingIncomes.forEach((inc) => {
    const num = inc.receiptNumber || '';
    if (num.startsWith(prefix)) {
      const seqPart = parseInt(num.slice(prefix.length), 10);
      if (!isNaN(seqPart) && seqPart > maxSeq) {
        maxSeq = seqPart;
      }
    } else if (num.startsWith(`KW-${yyyy}/${mm}/`)) {
      const seqPart = parseInt(num.replace(`KW-${yyyy}/${mm}/`, ''), 10);
      if (!isNaN(seqPart) && seqPart > maxSeq) {
        maxSeq = seqPart;
      }
    }
  });

  if (maxSeq === 0) {
    const monthCount = existingIncomes.filter((i) => (i.datePaid || '').startsWith(`${yyyy}-${mm}`)).length;
    maxSeq = monthCount;
  }

  const nextSeq = maxSeq + 1;
  return `${prefix}${String(nextSeq).padStart(3, '0')}`;
}

/**
 * Generate nomor bukti kas keluar berurutan standar: KK-YYYY-MM-XXX
 */
export function generateExpenseRefNumber(
  existingExpenses: ExpenseRecord[],
  targetDate?: string
): string {
  const dateStr = targetDate || getTodayDateString();
  const [year, month] = dateStr.split('-');
  const yyyy = year || String(new Date().getFullYear());
  const mm = month ? month.padStart(2, '0') : String(new Date().getMonth() + 1).padStart(2, '0');

  const prefix = `KK-${yyyy}-${mm}-`;
  let maxSeq = 0;

  existingExpenses.forEach((exp) => {
    const num = exp.receiptRef || '';
    if (num.startsWith(prefix)) {
      const seqPart = parseInt(num.slice(prefix.length), 10);
      if (!isNaN(seqPart) && seqPart > maxSeq) {
        maxSeq = seqPart;
      }
    } else if (num.startsWith(`KK-${yyyy}/${mm}/`)) {
      const seqPart = parseInt(num.replace(`KK-${yyyy}/${mm}/`, ''), 10);
      if (!isNaN(seqPart) && seqPart > maxSeq) {
        maxSeq = seqPart;
      }
    }
  });

  if (maxSeq === 0) {
    const monthCount = existingExpenses.filter((e) => (e.date || '').startsWith(`${yyyy}-${mm}`)).length;
    maxSeq = monthCount;
  }

  const nextSeq = maxSeq + 1;
  return `${prefix}${String(nextSeq).padStart(3, '0')}`;
}

/**
 * Menormalkan format nomor referensi bukti kas keluar agar seragam KK-YYYY-MM-XXX
 */
export function normalizeExpenseRefNumber(
  ref?: string,
  date?: string,
  indexFallback: number = 1
): string {
  const dateStr = date || getTodayDateString();
  const [year, month] = dateStr.split('-');
  const yyyy = year || String(new Date().getFullYear());
  const mm = month ? month.padStart(2, '0') : String(new Date().getMonth() + 1).padStart(2, '0');
  const cleanRef = (ref || '').trim();

  // If already standard KK-YYYY-MM-XXX
  if (/^KK-\d{4}-\d{2}-\d{3,4}$/.test(cleanRef)) {
    return cleanRef;
  }

  // If slash format KK-YYYY/MM/XXX
  if (/^KK-\d{4}\/\d{2}\/\d{3,4}$/.test(cleanRef)) {
    return cleanRef.replace(/\//g, '-');
  }

  // If invalid, placeholder, raw ID (e.g. KK-exp-17, EXP-460544, exp-xxx, empty)
  if (
    !cleanRef ||
    cleanRef.toLowerCase().includes('exp-') ||
    cleanRef.startsWith('EXP-') ||
    cleanRef.startsWith('KK-exp') ||
    cleanRef === '-'
  ) {
    return `KK-${yyyy}-${mm}-${String(indexFallback).padStart(3, '0')}`;
  }

  return cleanRef;
}

/**
 * Menormalkan format nomor kwitansi kas masuk agar seragam KW-YYYY-MM-XXX
 */
export function normalizeIncomeReceiptNumber(
  receiptNumber?: string,
  date?: string,
  indexFallback: number = 1
): string {
  const dateStr = date || getTodayDateString();
  const [year, month] = dateStr.split('-');
  const yyyy = year || String(new Date().getFullYear());
  const mm = month ? month.padStart(2, '0') : String(new Date().getMonth() + 1).padStart(2, '0');
  const cleanNum = (receiptNumber || '').trim();

  // If already standard KW-YYYY-MM-XXX
  if (/^KW-\d{4}-\d{2}-\d{3,4}$/.test(cleanNum)) {
    return cleanNum;
  }

  // If slash format KW-YYYY/MM/XXX
  if (/^KW-\d{4}\/\d{2}\/\d{3,4}$/.test(cleanNum)) {
    return cleanNum.replace(/\//g, '-');
  }

  // If invalid or raw ID (e.g. KW-inc-17, INC-xxx, empty)
  if (
    !cleanNum ||
    cleanNum.toLowerCase().includes('inc-') ||
    cleanNum.startsWith('INC-') ||
    cleanNum.startsWith('KW-inc') ||
    cleanNum === '-'
  ) {
    return `KW-${yyyy}-${mm}-${String(indexFallback).padStart(3, '0')}`;
  }

  return cleanNum;
}

/**
 * Menyelaraskan seluruh data transaksi pengeluaran (kategori & nomor ref KK) dengan master database.
 */
export function sanitizeAndHarmonizeExpenses(
  expensesList: ExpenseRecord[],
  settings?: BimbelSettings | null
): { sanitized: ExpenseRecord[]; hasChanges: boolean } {
  let hasChanges = false;

  // Track counts per month for deterministic fallback numbering
  const monthSequenceMap: { [monthKey: string]: number } = {};

  const sanitized = expensesList.map((exp) => {
    const rawCat = exp.category || '';
    const normalizedCat = normalizeExpenseCategory(rawCat, settings);

    const dateStr = exp.date || getTodayDateString();
    const monthKey = dateStr.slice(0, 7); // e.g. 2026-08
    monthSequenceMap[monthKey] = (monthSequenceMap[monthKey] || 0) + 1;
    const currentSeq = monthSequenceMap[monthKey];

    const rawRef = exp.receiptRef || '';
    const normalizedRef = normalizeExpenseRefNumber(rawRef, dateStr, currentSeq);

    if (rawCat !== normalizedCat || rawRef !== normalizedRef) {
      hasChanges = true;
      return {
        ...exp,
        category: normalizedCat as any,
        receiptRef: normalizedRef,
      };
    }
    return exp;
  });

  return { sanitized, hasChanges };
}

/**
 * Menyelaraskan seluruh data transaksi pemasukan (kategori & nomor kwitansi KW) dengan master database.
 */
export function sanitizeAndHarmonizeIncomes(
  incomesList: IncomeRecord[],
  settings?: BimbelSettings | null
): { sanitized: IncomeRecord[]; hasChanges: boolean } {
  let hasChanges = false;

  const monthSequenceMap: { [monthKey: string]: number } = {};

  const sanitized = incomesList.map((inc) => {
    const rawCat = inc.category || '';
    const normalizedCat = normalizeIncomeCategory(rawCat, settings);

    const dateStr = inc.datePaid || getTodayDateString();
    const monthKey = dateStr.slice(0, 7); // e.g. 2026-08
    monthSequenceMap[monthKey] = (monthSequenceMap[monthKey] || 0) + 1;
    const currentSeq = monthSequenceMap[monthKey];

    const rawNum = inc.receiptNumber || '';
    const normalizedNum = normalizeIncomeReceiptNumber(rawNum, dateStr, currentSeq);

    if (rawCat !== normalizedCat || rawNum !== normalizedNum) {
      hasChanges = true;
      return {
        ...inc,
        category: normalizedCat as any,
        receiptNumber: normalizedNum,
      };
    }
    return inc;
  });

  return { sanitized, hasChanges };
}

/**
 * Resolves any raw tutor name string to the official registered active tutor account name from users database.
 */
export function resolveTutorName(rawName: string | undefined | null, users: UserAccount[] = []): string {
  if (!rawName || !rawName.trim()) return 'Tutor Bimbel';
  const trimmed = rawName.trim();

  if (!users || users.length === 0) return trimmed;

  const activeTutors = users.filter((u) => u.role === 'tutor' && u.isActive !== false);
  if (activeTutors.length === 0) return trimmed;

  // 1. Exact match (case insensitive)
  const exact = activeTutors.find((t) => t.name.trim().toLowerCase() === trimmed.toLowerCase());
  if (exact) return exact.name;

  // 2. Exact match by username
  const byUser = activeTutors.find((t) => (t.username || '').trim().toLowerCase() === trimmed.toLowerCase());
  if (byUser) return byUser.name;

  // 3. Match if tutor name contains or starts with the raw name, or raw name starts with tutor name
  // e.g. "Nanik" -> "Nanik Susilowati, M.Pd", "Sarah" -> "Kak Sarah Amalia, S.Si."
  const lowerTrimmed = trimmed.toLowerCase();
  const partial = activeTutors.find((t) => {
    const tLower = t.name.trim().toLowerCase();
    const tFirst = tLower.split(' ')[0] || '';
    const rawFirst = lowerTrimmed.split(' ')[0] || '';
    return (
      tLower.startsWith(lowerTrimmed) ||
      lowerTrimmed.startsWith(tLower) ||
      tLower.includes(lowerTrimmed) ||
      lowerTrimmed.includes(tLower) ||
      (tFirst.length >= 3 && rawFirst.length >= 3 && (tFirst === rawFirst || tFirst.includes(rawFirst) || rawFirst.includes(tFirst)))
    );
  });
  if (partial) return partial.name;

  // 4. If there is only 1 active tutor and the raw name is a common generic/previous name
  if (
    activeTutors.length === 1 &&
    (lowerTrimmed.includes('tutor') ||
      lowerTrimmed.includes('nanik') ||
      lowerTrimmed.includes('sarah') ||
      lowerTrimmed.includes('dimas') ||
      lowerTrimmed.includes('dicky') ||
      lowerTrimmed.includes('pengajar'))
  ) {
    return activeTutors[0].name;
  }

  return trimmed;
}

/**
 * Normalizes and synchronizes tutor names across all Attendance records, Students, and Expenses
 * based on the registered active Tutor accounts in the Users database.
 */
export function synchronizeTutorNames(
  usersList: UserAccount[],
  attendanceList: AttendanceRecord[],
  studentsList: Student[],
  expensesList: ExpenseRecord[]
): {
  updatedAttendance: AttendanceRecord[];
  updatedStudents: Student[];
  updatedExpenses: ExpenseRecord[];
  attendanceChangesCount: number;
  studentChangesCount: number;
  expenseChangesCount: number;
} {
  let attendanceChangesCount = 0;
  let studentChangesCount = 0;
  let expenseChangesCount = 0;

  const activeTutors = usersList.filter((u) => u.role === 'tutor' && u.isActive !== false);

  const updatedAttendance = attendanceList.map((att) => {
    const resolved = resolveTutorName(att.tutorName, activeTutors);
    if (resolved && resolved !== att.tutorName) {
      attendanceChangesCount++;
      return { ...att, tutorName: resolved };
    }
    return att;
  });

  const updatedStudents = studentsList.map((std) => {
    if (!std.tutorName) return std;
    const resolved = resolveTutorName(std.tutorName, activeTutors);
    if (resolved && resolved !== std.tutorName) {
      studentChangesCount++;
      return { ...std, tutorName: resolved };
    }
    return std;
  });

  const updatedExpenses = expensesList.map((exp) => {
    if (exp.category === 'Gaji / Honor Tutor' || exp.tutorId || exp.tutorName) {
      const resolved = resolveTutorName(exp.tutorName || exp.paidTo || exp.recipient, activeTutors);
      if (resolved && (exp.tutorName !== resolved || exp.paidTo !== resolved)) {
        expenseChangesCount++;
        return {
          ...exp,
          tutorName: resolved,
          paidTo: exp.paidTo ? resolved : exp.paidTo,
          recipient: exp.recipient ? resolved : exp.recipient,
        };
      }
    }
    return exp;
  });

  return {
    updatedAttendance,
    updatedStudents,
    updatedExpenses,
    attendanceChangesCount,
    studentChangesCount,
    expenseChangesCount,
  };
}


