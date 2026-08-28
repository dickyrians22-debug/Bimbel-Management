import React, { useState, useEffect } from 'react';
import {
  Student,
  AttendanceRecord,
  IncomeRecord,
  ExpenseRecord,
  UserSession,
  UserAccount,
  BimbelSettings,
  ActiveTab,
} from './types';
import {
  getInitialStudents,
  getInitialAttendance,
  getInitialIncomes,
  getInitialExpenses,
  getInitialUsers,
  getInitialSettings,
  saveStudents,
  saveAttendance,
  saveIncomes,
  saveExpenses,
  saveUsers,
  saveSettings,
  resetToMockData,
  sortUsersByRole,
  getTodayDateString,
  getMonthNameIndo,
  formatRupiah,
  getSystemSalaryCategory,
  getSystemSppCategory,
  isSystemExpenseCategory,
  isSystemIncomeCategory,
  normalizeExpenseCategory,
  normalizeIncomeCategory,
  sanitizeAndHarmonizeExpenses,
  sanitizeAndHarmonizeIncomes,
  generateIncomeReceiptNumber,
  generateExpenseRefNumber,
  normalizeExpenseRefNumber,
  normalizeIncomeReceiptNumber,
  synchronizeTutorNames,
  resolveTutorName,
} from './utils/storage';
import {
  DEFAULT_USERS,
  DEFAULT_ACCOUNTS,
  DEFAULT_SETTINGS,
  INITIAL_STUDENTS,
  INITIAL_ATTENDANCE,
  INITIAL_INCOMES,
  INITIAL_EXPENSES,
} from './utils/mockData';
import {
  subscribeToCollection,
  syncDocToFirestore,
  deleteDocFromFirestore,
  batchSeedToFirestore,
  replaceAllInCollection,
  clearFirestoreCollection,
  checkCollectionCount,
  COLLECTIONS,
} from './lib/firebase';

// Layout Components
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';

// View Components
import { AuthLoginView } from './components/views/AuthLoginView';
import { DashboardOwner } from './components/views/DashboardOwner';
import { DashboardTutor } from './components/views/DashboardTutor';
import { DashboardSiswa } from './components/views/DashboardSiswa';
import { StudentDatabaseView } from './components/views/StudentDatabaseView';
import { AttendanceView } from './components/views/AttendanceView';
import { StudentBillingView } from './components/views/StudentBillingView';
import { CashBookView } from './components/views/CashBookView';
import { PrintCardsView } from './components/views/PrintCardsView';
import { IncomeView } from './components/views/IncomeView';
import { ExpenseView } from './components/views/ExpenseView';
import { ProfitLossView } from './components/views/ProfitLossView';
import { SalaryView } from './components/views/SalaryView';
import { SettingsView } from './components/views/SettingsView';

// Modal Components
import { StudentModal } from './components/modals/StudentModal';
import { AttendanceModal } from './components/modals/AttendanceModal';
import { BatchAttendanceModal } from './components/modals/BatchAttendanceModal';
import { SelfAttendanceModal } from './components/modals/SelfAttendanceModal';
import { IncomeModal } from './components/modals/IncomeModal';
import { ExpenseModal } from './components/modals/ExpenseModal';
import { ReceiptModal } from './components/modals/ReceiptModal';
import { ConfirmDeleteModal } from './components/modals/ConfirmDeleteModal';
import { UserAccountModal } from './components/modals/UserAccountModal';
import { ChangePasswordModal } from './components/modals/ChangePasswordModal';

// Helper: Ensure accounts have unique usernames and no role collisions (e.g. non-owner cannot have username "owner")
export const sanitizeAndFixUserAccounts = (
  rawUsers: UserAccount[]
): { fixed: UserAccount[]; changed: boolean } => {
  const seenUsernames = new Set<string>();
  let changed = false;

  const result = rawUsers.map((u) => {
    let cleanUsername = (u.username || '').trim().toLowerCase();
    const currentRole = u.role;

    // Rule 1: Only OWNER role can use username 'owner'. If a Tutor/Siswa has username 'owner', rename it!
    if (currentRole !== 'owner' && cleanUsername === 'owner') {
      const derived = (u.name || '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 10);
      cleanUsername = derived && derived !== 'owner' ? derived : `tutor_${u.id.slice(-4)}`;
      changed = true;
    }

    // Rule 2: Ensure username is not empty
    if (!cleanUsername) {
      const derived = (u.name || currentRole)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 10);
      cleanUsername = derived || `user_${u.id.slice(-4)}`;
      changed = true;
    }

    // Rule 3: Avoid duplicate username collisions across accounts
    if (seenUsernames.has(cleanUsername)) {
      const derived = (u.name || '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 8);
      cleanUsername = derived ? `${derived}_${u.id.slice(-3)}` : `${cleanUsername}_${u.id.slice(-3)}`;
      changed = true;
    }

    seenUsernames.add(cleanUsername);

    if (cleanUsername !== u.username) {
      return { ...u, username: cleanUsername };
    }
    return u;
  });

  return { fixed: sortUsersByRole(result), changed };
};

export default function App() {
  // 1. Authentication State - Mandatory login required for fresh sessions
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem('bimbel_sigma_auth_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null; // Require login screen first!
  });

  // 2. Navigation State
  const [currentTab, setCurrentTab] = useState<ActiveTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCloudConnected, setIsCloudConnected] = useState(true);

  // 3. Core Data States (Synced with LocalStorage & Firestore Cloud)
  const [students, setStudents] = useState<Student[]>(() => getInitialStudents());
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => getInitialAttendance());
  const [incomes, setIncomes] = useState<IncomeRecord[]>(() => getInitialIncomes());
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() => getInitialExpenses());
  const [users, setUsers] = useState<UserAccount[]>(() => {
    const raw = getInitialUsers();
    const { fixed } = sanitizeAndFixUserAccounts(raw);
    return fixed;
  });
  const [settings, setSettings] = useState<BimbelSettings>(() => getInitialSettings());

  // 4. Modal Visibility & Editing Target States
  // Student Modal
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | undefined>(undefined);

  // Attendance Modal
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<AttendanceRecord | undefined>(undefined);

  // Batch Attendance Modal
  const [isBatchAttendanceModalOpen, setIsBatchAttendanceModalOpen] = useState(false);

  // Self Attendance Modal (For Siswa)
  const [isSelfAttendanceModalOpen, setIsSelfAttendanceModalOpen] = useState(false);

  // Income Modal
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<IncomeRecord | undefined>(undefined);

  // Expense Modal
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | undefined>(undefined);

  // Receipt Modal
  const [receiptIncome, setReceiptIncome] = useState<IncomeRecord | null>(null);

  // User Account Modal
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | undefined>(undefined);

  // Change Password Modal
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [passwordTargetUser, setPasswordTargetUser] = useState<UserAccount | UserSession | undefined>(undefined);

  // Confirm Delete Modal
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    itemName: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    itemName: '',
    onConfirm: () => {},
  });

  // 5. Toast / Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3000);
  };

  // --- Realtime Firestore Cloud Synchronization & Auto-Seeding ---
  useEffect(() => {
    const unsubs: Array<() => void> = [];

    // Auto-seed cloud if database is fresh/empty
    const checkAndSeedCloud = async () => {
      try {
        const usersCount = await checkCollectionCount(COLLECTIONS.USERS);
        if (usersCount === 0) {
          console.log('Seeding essential accounts and students to Firestore...');
          await batchSeedToFirestore(COLLECTIONS.USERS, DEFAULT_ACCOUNTS);
          await batchSeedToFirestore(COLLECTIONS.STUDENTS, INITIAL_STUDENTS);
          await syncDocToFirestore(COLLECTIONS.SETTINGS, 'default', { id: 'default', ...DEFAULT_SETTINGS });
          console.log('Firestore essential seed completed.');
        } else {
          // If Firestore contains fewer than 25 students or old mock data, update with student list and user accounts
          const studentCount = await checkCollectionCount(COLLECTIONS.STUDENTS);
          if (studentCount < 25) {
            console.log('Updating Firestore with 25 students from bimbel list...');
            await replaceAllInCollection(COLLECTIONS.STUDENTS, INITIAL_STUDENTS);
            await replaceAllInCollection(COLLECTIONS.USERS, DEFAULT_ACCOUNTS);
          }
        }
      } catch (e) {
        console.warn('Initial cloud seed check:', e);
      }
    };

    checkAndSeedCloud();

    // 1. Subscribe to Students
    const unsubStudents = subscribeToCollection<Student>(
      COLLECTIONS.STUDENTS,
      (cloudData) => {
        setStudents(cloudData);
        saveStudents(cloudData);
        setIsCloudConnected(true);
      },
      () => setIsCloudConnected(false)
    );
    unsubs.push(unsubStudents);

    // 2. Subscribe to Attendance
    const unsubAttendance = subscribeToCollection<AttendanceRecord>(
      COLLECTIONS.ATTENDANCE,
      (cloudData) => {
        setAttendance(cloudData);
        saveAttendance(cloudData);
        setIsCloudConnected(true);
      },
      () => setIsCloudConnected(false)
    );
    unsubs.push(unsubAttendance);

    // 3. Subscribe to Incomes
    const unsubIncomes = subscribeToCollection<IncomeRecord>(
      COLLECTIONS.INCOMES,
      (cloudData) => {
        const { sanitized, hasChanges } = sanitizeAndHarmonizeIncomes(cloudData, settings);
        setIncomes(sanitized);
        saveIncomes(sanitized);
        if (hasChanges && sanitized.length > 0) {
          sanitized.forEach((inc) => {
            syncDocToFirestore(COLLECTIONS.INCOMES, inc.id, inc).catch(console.error);
          });
        }
        setIsCloudConnected(true);
      },
      () => setIsCloudConnected(false)
    );
    unsubs.push(unsubIncomes);

    // 4. Subscribe to Expenses
    const unsubExpenses = subscribeToCollection<ExpenseRecord>(
      COLLECTIONS.EXPENSES,
      (cloudData) => {
        const { sanitized, hasChanges } = sanitizeAndHarmonizeExpenses(cloudData, settings);
        setExpenses(sanitized);
        saveExpenses(sanitized);
        if (hasChanges && sanitized.length > 0) {
          sanitized.forEach((exp) => {
            syncDocToFirestore(COLLECTIONS.EXPENSES, exp.id, exp).catch(console.error);
          });
        }
        setIsCloudConnected(true);
      },
      () => setIsCloudConnected(false)
    );
    unsubs.push(unsubExpenses);

    // 5. Subscribe to Users
    const unsubUsers = subscribeToCollection<UserAccount>(
      COLLECTIONS.USERS,
      (cloudData) => {
        if (cloudData.length > 0) {
          const { fixed, changed } = sanitizeAndFixUserAccounts(cloudData);
          setUsers(fixed);
          saveUsers(fixed);

          // If there were collisions that got automatically resolved, sync fixed docs back to Firestore
          if (changed) {
            fixed.forEach((u) => {
              syncDocToFirestore(COLLECTIONS.USERS, u.id, u).catch(console.error);
            });
          }

          // Auto-sync currentUser session data if modified in database
          setCurrentUser((prevUser) => {
            if (!prevUser) return null;
            const matched = fixed.find(
              (u) =>
                u.id === prevUser.id ||
                (u.role === prevUser.role && u.username.toLowerCase() === prevUser.username.toLowerCase())
            );
            if (matched) {
              const updatedSession = { ...prevUser, ...matched };
              localStorage.setItem('bimbel_sigma_auth_user', JSON.stringify(updatedSession));
              return updatedSession;
            }
            return prevUser;
          });
        }
        setIsCloudConnected(true);
      },
      () => setIsCloudConnected(false)
    );
    unsubs.push(unsubUsers);

    // 6. Subscribe to Settings
    const unsubSettings = subscribeToCollection<BimbelSettings & { id: string }>(
      COLLECTIONS.SETTINGS,
      (cloudData) => {
        if (cloudData.length > 0) {
          const { id, ...cleanSettings } = cloudData[0];
          setSettings(cleanSettings as BimbelSettings);
          saveSettings(cleanSettings as BimbelSettings);
        }
        setIsCloudConnected(true);
      },
      () => setIsCloudConnected(false)
    );
    unsubs.push(unsubSettings);

    return () => {
      unsubs.forEach((unsub) => {
        try {
          unsub();
        } catch (e) {
          // ignore
        }
      });
    };
  }, []);

  // Auto-harmonize expenses and incomes whenever database settings or categories change
  useEffect(() => {
    if (expenses.length > 0) {
      const { sanitized: cleanExp, hasChanges: expChanged } = sanitizeAndHarmonizeExpenses(expenses, settings);
      if (expChanged) {
        setExpenses(cleanExp);
        saveExpenses(cleanExp);
        cleanExp.forEach((exp) => {
          syncDocToFirestore(COLLECTIONS.EXPENSES, exp.id, exp).catch(console.error);
        });
      }
    }

    if (incomes.length > 0) {
      const { sanitized: cleanInc, hasChanges: incChanged } = sanitizeAndHarmonizeIncomes(incomes, settings);
      if (incChanged) {
        setIncomes(cleanInc);
        saveIncomes(cleanInc);
        cleanInc.forEach((inc) => {
          syncDocToFirestore(COLLECTIONS.INCOMES, inc.id, inc).catch(console.error);
        });
      }
    }
  }, [settings]);

  // --- Handlers: Auth ---
  const handleLoginSuccess = (user: UserSession) => {
    setCurrentUser(user);
    localStorage.setItem('bimbel_sigma_auth_user', JSON.stringify(user));
    setCurrentTab(user.role === 'siswa' ? 'student-portal' : 'dashboard');
    showToast(`Selamat datang, ${user.name} (${user.role.toUpperCase()})`);
  };

  const handleLogout = () => {
    localStorage.removeItem('bimbel_sigma_auth_user');
    setCurrentUser(null);
  };

  const handleSwitchUser = (user: UserSession) => {
    setCurrentUser(user);
    localStorage.setItem('bimbel_sigma_auth_user', JSON.stringify(user));
    setCurrentTab(user.role === 'siswa' ? 'student-portal' : 'dashboard');
    showToast(`Beralih ke tampilan akun: ${user.name} (${user.role.toUpperCase()})`);
  };

  const handleSwitchUserRole = (newRole: 'owner' | 'tutor' | 'siswa') => {
    const target = users.find((u) => u.role === newRole && u.isActive !== false) ||
      users.find((u) => u.role === newRole) ||
      DEFAULT_USERS.find((u) => u.role === newRole) ||
      DEFAULT_USERS[0];
    handleSwitchUser(target);
  };

  // --- Handlers: Students CRUD ---
  const handleOpenStudentModal = (studentToEdit?: Student) => {
    setEditingStudent(studentToEdit);
    setIsStudentModalOpen(true);
  };

  const handleSaveStudent = (data: Omit<Student, 'id' | 'createdAt'> & { id?: string }) => {
    if (data.id) {
      // 1. Update Students Master Data
      const updated = students.map((s) => (s.id === data.id ? { ...s, ...data } : s));
      setStudents(updated);
      saveStudents(updated);
      const studentObj = updated.find((s) => s.id === data.id)!;
      syncDocToFirestore(COLLECTIONS.STUDENTS, data.id, studentObj).catch(console.error);

      // 2. Cascade Update to Attendance Records
      const updatedAttendance = attendance.map((a) => {
        if (a.studentId === data.id) {
          return {
            ...a,
            studentName: data.name,
            studentCode: data.code,
            classType: data.classType,
          };
        }
        return a;
      });
      const hasAttendanceChanges = updatedAttendance.some((a, idx) => a !== attendance[idx]);
      if (hasAttendanceChanges) {
        setAttendance(updatedAttendance);
        saveAttendance(updatedAttendance);
        const affectedAttendance = updatedAttendance.filter((a) => a.studentId === data.id);
        batchSeedToFirestore(COLLECTIONS.ATTENDANCE, affectedAttendance).catch(console.error);
      }

      // 3. Cascade Update to Incomes Records (SPP / Registrations)
      const updatedIncomes = incomes.map((inc) => {
        if (inc.studentId === data.id) {
          return {
            ...inc,
            studentName: data.name,
            studentCode: data.code,
            sourceName: inc.category === 'SPP Bulanan' ? `SPP Siswa: ${data.name} (${data.code})` : inc.sourceName,
          };
        }
        return inc;
      });
      const hasIncomeChanges = updatedIncomes.some((inc, idx) => inc !== incomes[idx]);
      if (hasIncomeChanges) {
        setIncomes(updatedIncomes);
        saveIncomes(updatedIncomes);
        const affectedIncomes = updatedIncomes.filter((inc) => inc.studentId === data.id);
        batchSeedToFirestore(COLLECTIONS.INCOMES, affectedIncomes).catch(console.error);
      }

      // 4. Cascade Update to User Accounts (Student portal login)
      const updatedUsers = users.map((u) => {
        if (u.linkedStudentId === data.id || u.code === studentObj.code || (u.role === 'siswa' && u.code === data.code)) {
          return {
            ...u,
            name: data.name,
            code: data.code,
            username: data.code.toLowerCase(),
            linkedStudentId: data.id,
          };
        }
        return u;
      });
      const hasUserChanges = updatedUsers.some((u, idx) => u !== users[idx]);
      if (hasUserChanges) {
        setUsers(updatedUsers);
        saveUsers(updatedUsers);
        const affectedUsers = updatedUsers.filter((u) => u.linkedStudentId === data.id || u.code === data.code);
        batchSeedToFirestore(COLLECTIONS.USERS, affectedUsers).catch(console.error);
      }

      showToast(`Data siswa "${data.name}" dan seluruh presensi/keuangan berhasil disinkronkan!`);
    } else {
      // Add
      const newStudent: Student = {
        ...data,
        id: `std-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      const updated = [newStudent, ...students];
      setStudents(updated);
      saveStudents(updated);
      syncDocToFirestore(COLLECTIONS.STUDENTS, newStudent.id, newStudent).catch(console.error);
      showToast(`Siswa baru "${data.name}" (${data.code}) berhasil ditambahkan.`);
    }
  };

  const handleDeleteStudent = (studentOrId: Student | string, customName?: string) => {
    const id = typeof studentOrId === 'string' ? studentOrId : studentOrId.id;
    const target = typeof studentOrId === 'object' ? studentOrId : students.find((s) => s.id === id);
    const itemName = customName || (target ? `${target.name} (${target.code})` : 'Data Siswa');

    setDeleteDialog({
      isOpen: true,
      title: 'Hapus Data Siswa',
      message: 'Apakah Anda yakin ingin menghapus data siswa ini? Semua histori presensi terkait akan tetap tersimpan.',
      itemName,
      onConfirm: () => {
        const updated = students.filter((s) => s.id !== id);
        setStudents(updated);
        saveStudents(updated);
        deleteDocFromFirestore(COLLECTIONS.STUDENTS, id).catch(console.error);
        setDeleteDialog((prev) => ({ ...prev, isOpen: false }));
        showToast(`Siswa "${itemName}" telah berhasil dihapus.`);
      },
    });
  };

  const handleResetToScreenshotStudents = () => {
    setDeleteDialog({
      isOpen: true,
      title: 'Perbarui Seluruh Database Siswa',
      message: 'Apakah Anda ingin memperbarui seluruh database siswa menjadi 25 siswa lengkap sesuai daftar yang telah diinput (Naureen, Kia, Brian, Gyo, Abi, Silvia, Geo, Elvano, Kaysa, Agan, Dolken, Rara, Kaila, Debi, Tasya, Bella, Raja, Aura, Naila, Rangga, Juna, Agha, Zidane, Valen, Athar)?',
      itemName: '25 Data Siswa Bimbel',
      onConfirm: async () => {
        setStudents(INITIAL_STUDENTS);
        saveStudents(INITIAL_STUDENTS);
        setUsers(DEFAULT_ACCOUNTS);
        saveUsers(DEFAULT_ACCOUNTS);
        try {
          await replaceAllInCollection(COLLECTIONS.STUDENTS, INITIAL_STUDENTS);
          await replaceAllInCollection(COLLECTIONS.USERS, DEFAULT_ACCOUNTS);
        } catch (err) {
          console.error('Error syncing 25 students to cloud:', err);
        }
        setDeleteDialog((prev) => ({ ...prev, isOpen: false }));
        showToast('Database 25 siswa berhasil diperbarui & disinkronkan!');
      },
    });
  };

  // --- Handlers: Attendance CRUD ---
  const handleOpenAttendanceModal = (recordToEdit?: AttendanceRecord) => {
    setEditingAttendance(recordToEdit);
    setIsAttendanceModalOpen(true);
  };

  const handleSaveAttendance = (
    data: Omit<AttendanceRecord, 'id' | 'createdAt'> & { id?: string }
  ) => {
    if (data.id) {
      const updated = attendance.map((a) => (a.id === data.id ? { ...a, ...data } : a));
      setAttendance(updated);
      saveAttendance(updated);
      const targetObj = updated.find((a) => a.id === data.id)!;
      syncDocToFirestore(COLLECTIONS.ATTENDANCE, data.id, targetObj).catch(console.error);
      showToast(`Data presensi "${data.studentName}" berhasil diperbarui.`);
    } else {
      const newRecord: AttendanceRecord = {
        ...data,
        id: `att-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      const updated = [newRecord, ...attendance];
      setAttendance(updated);
      saveAttendance(updated);
      syncDocToFirestore(COLLECTIONS.ATTENDANCE, newRecord.id, newRecord).catch(console.error);
      showToast(`Presensi "${data.studentName}" [${data.status}] berhasil disimpan.`);
    }
  };

  const handleBatchAttendance = (newRecords: Omit<AttendanceRecord, 'id' | 'createdAt'>[]) => {
    const createdList: AttendanceRecord[] = newRecords.map((r, i) => ({
      ...r,
      id: `att-${Date.now()}-${i}`,
      createdAt: new Date().toISOString(),
    }));
    const updated = [...createdList, ...attendance];
    setAttendance(updated);
    saveAttendance(updated);
    batchSeedToFirestore(COLLECTIONS.ATTENDANCE, createdList).catch(console.error);
    showToast(`Presensi batch ${createdList.length} siswa berhasil disimpan!`);
  };

  const handleSelfAttendance = (
    student: Student,
    topic: string,
    notes: string,
    time: string,
    tutorName?: string
  ) => {
    const todayStr = getTodayDateString();
    const existing = attendance.find(
      (a) => a.studentId === student.id && a.date === todayStr
    );

    if (existing) {
      const updatedRecord = {
        ...existing,
        time,
        status: 'Hadir' as const,
        topic: topic || existing.topic,
        tutorNotes: notes ? `[Siswa]: ${notes}` : existing.tutorNotes,
        tutorName: tutorName || existing.tutorName,
      };
      const updated = attendance.map((a) => (a.id === existing.id ? updatedRecord : a));
      setAttendance(updated);
      saveAttendance(updated);
      syncDocToFirestore(COLLECTIONS.ATTENDANCE, existing.id, updatedRecord).catch(console.error);
      showToast(`Absen mandiri diperbarui pada pukul ${time}`);
    } else {
      const newRecord: AttendanceRecord = {
        id: `att-self-${Date.now()}`,
        date: todayStr,
        time,
        studentId: student.id,
        studentCode: student.code,
        studentName: student.name,
        classType: student.classType,
        status: 'Hadir',
        topic: topic || 'Belajar Mandiri & Pendalaman Materi',
        tutorNotes: notes ? `[Absen Mandiri Siswa]: ${notes}` : 'Hadir mandiri melalui portal siswa',
        tutorName: tutorName || student.tutorName || 'Tutor Bimbel Sigma',
        createdAt: new Date().toISOString(),
      };
      const updated = [newRecord, ...attendance];
      setAttendance(updated);
      saveAttendance(updated);
      syncDocToFirestore(COLLECTIONS.ATTENDANCE, newRecord.id, newRecord).catch(console.error);
      showToast(`Berhasil Absen Masuk! Data tersimpan di Cloud.`);
    }
  };

  const handleDeleteAttendance = (recordOrId: AttendanceRecord | string, customName?: string) => {
    const id = typeof recordOrId === 'string' ? recordOrId : recordOrId.id;
    const target = typeof recordOrId === 'object' ? recordOrId : attendance.find((a) => a.id === id);
    const itemName = customName || (target ? `${target.studentName} - Tanggal ${target.date} (${target.status})` : 'Data Presensi');

    setDeleteDialog({
      isOpen: true,
      title: 'Hapus Log Presensi',
      message: 'Apakah Anda yakin ingin menghapus data presensi ini?',
      itemName,
      onConfirm: () => {
        const updated = attendance.filter((a) => a.id !== id);
        setAttendance(updated);
        saveAttendance(updated);
        deleteDocFromFirestore(COLLECTIONS.ATTENDANCE, id).catch(console.error);
        setDeleteDialog((prev) => ({ ...prev, isOpen: false }));
        showToast(`Log presensi "${itemName}" berhasil dihapus.`);
      },
    });
  };

  // --- Handlers: Incomes (SPP) CRUD ---
  const handleOpenIncomeModal = (recordToEdit?: IncomeRecord) => {
    setEditingIncome(recordToEdit);
    setIsIncomeModalOpen(true);
  };

  const handleSaveIncome = (
    data: Omit<IncomeRecord, 'id' | 'createdAt'> & { id?: string }
  ) => {
    const rawCat = data.category || (data.incomeCategory === 'registration' ? 'Biaya Pendaftaran / Registrasi' : getSystemSppCategory(settings));
    const normalizedCategory = normalizeIncomeCategory(rawCat, settings);
    const dateStr = data.datePaid || getTodayDateString();
    const rawNum = data.receiptNumber || generateIncomeReceiptNumber(incomes, dateStr);
    const normalizedReceiptNumber = normalizeIncomeReceiptNumber(rawNum, dateStr);

    if (data.id) {
      const updated = incomes.map((inc) => (inc.id === data.id ? { ...inc, ...data, category: normalizedCategory as any, receiptNumber: normalizedReceiptNumber } : inc));
      setIncomes(updated);
      saveIncomes(updated);
      const targetObj = updated.find((i) => i.id === data.id)!;
      syncDocToFirestore(COLLECTIONS.INCOMES, data.id, targetObj).catch(console.error);
      showToast(`Pencatatan kas masuk "${data.studentName || data.sourceName}" berhasil diperbarui.`);
    } else {
      const newIncome: IncomeRecord = {
        ...data,
        category: normalizedCategory as any,
        receiptNumber: normalizedReceiptNumber,
        id: `inc-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      const updated = [newIncome, ...incomes];
      setIncomes(updated);
      saveIncomes(updated);
      syncDocToFirestore(COLLECTIONS.INCOMES, newIncome.id, newIncome).catch(console.error);

      // Auto top up student quota if buying session pack
      if (data.incomeCategory === 'session_pack' && data.studentId && data.sessionsCount) {
        const targetStudent = students.find((s) => s.id === data.studentId);
        if (targetStudent) {
          const currentQuota = targetStudent.sessionQuota || 0;
          const currentRemaining = targetStudent.remainingSessions !== undefined ? targetStudent.remainingSessions : currentQuota;
          const updatedStudent: Student = {
            ...targetStudent,
            packageType: 'session_pack',
            sessionQuota: currentQuota + data.sessionsCount,
            remainingSessions: currentRemaining + data.sessionsCount,
          };
          const updatedStudentsList = students.map((s) => (s.id === targetStudent.id ? updatedStudent : s));
          setStudents(updatedStudentsList);
          saveStudents(updatedStudentsList);
          syncDocToFirestore(COLLECTIONS.STUDENTS, updatedStudent.id, updatedStudent).catch(console.error);
        }
      }

      showToast(`Penerimaan kas "${data.studentName || data.sourceName}" sebesar Rp ${data.amount.toLocaleString('id-ID')} berhasil dicatat.`);
      setReceiptIncome(newIncome);
    }
  };

  const handleRecordStudentPayment = (paymentData: {
    student: Student;
    month: number;
    year: number;
    amount: number;
    totalBill: number;
    remainingBill: number;
    sessionsCount: number;
    paymentMethod: string;
    datePaid: string;
    notes?: string;
    autoOpenReceipt?: boolean;
  }) => {
    const receiptNum = generateIncomeReceiptNumber(incomes, paymentData.datePaid);
    const activeSppCategory = getSystemSppCategory(settings);
    const newIncome: IncomeRecord = {
      id: `inc-${Date.now()}`,
      datePaid: paymentData.datePaid,
      category: activeSppCategory as any,
      incomeCategory: 'spp_monthly',
      accrualMonth: paymentData.month,
      accrualYear: paymentData.year,
      studentId: paymentData.student.id,
      studentCode: paymentData.student.code,
      studentName: paymentData.student.name,
      amount: paymentData.amount,
      totalBill: paymentData.totalBill,
      remainingBill: paymentData.remainingBill,
      paymentStatus: paymentData.remainingBill === 0 ? 'Lunas' : 'Cicilan',
      sessionsCount: paymentData.sessionsCount,
      paymentMethod: paymentData.paymentMethod,
      receiptNumber: receiptNum,
      notes: paymentData.notes || `Pembayaran Iuran Les Periode ${getMonthNameIndo(paymentData.month)} ${paymentData.year} (${paymentData.sessionsCount} Sesi)`,
      receivedBy: currentUser?.name || settings.ownerName || 'Petugas Kasir',
      createdAt: new Date().toISOString(),
    };

    const updated = [newIncome, ...incomes];
    setIncomes(updated);
    saveIncomes(updated);
    syncDocToFirestore(COLLECTIONS.INCOMES, newIncome.id, newIncome).catch(console.error);

    showToast(`Pembayaran les "${paymentData.student.name}" sebesar ${formatRupiah(paymentData.amount)} berhasil dicatat ke Kas Masuk.`);

    if (paymentData.autoOpenReceipt) {
      setReceiptIncome(newIncome);
    }
  };

  const handleDeleteIncome = (incomeOrId: IncomeRecord | string, customLabel?: string) => {
    const id = typeof incomeOrId === 'string' ? incomeOrId : incomeOrId.id;
    const target = typeof incomeOrId === 'object' ? incomeOrId : incomes.find((i) => i.id === id);
    const itemName = customLabel || (target ? `${target.receiptNumber} - ${target.studentName} (Rp ${target.amount.toLocaleString('id-ID')})` : 'Penerimaan SPP');

    setDeleteDialog({
      isOpen: true,
      title: 'Hapus Kas Masuk SPP',
      message: 'Apakah Anda yakin ingin menghapus catatan penerimaan kas SPP ini?',
      itemName,
      onConfirm: () => {
        const updated = incomes.filter((i) => i.id !== id);
        setIncomes(updated);
        saveIncomes(updated);
        deleteDocFromFirestore(COLLECTIONS.INCOMES, id).catch(console.error);
        setDeleteDialog((prev) => ({ ...prev, isOpen: false }));
        showToast(`Catatan kas masuk SPP telah dihapus.`);
      },
    });
  };

  // --- Handlers: Expenses CRUD ---
  const handleOpenExpenseModal = (expenseToEdit?: ExpenseRecord) => {
    setEditingExpense(expenseToEdit);
    setIsExpenseModalOpen(true);
  };

  const handleSaveExpense = (
    data: Omit<ExpenseRecord, 'id' | 'createdAt'> & { id?: string }
  ) => {
    const rawCat = data.category || getSystemSalaryCategory(settings);
    const normalizedCategory = normalizeExpenseCategory(rawCat, settings);
    const dateStr = data.date || getTodayDateString();
    const rawRef = data.receiptRef || generateExpenseRefNumber(expenses, dateStr);
    const normalizedRef = normalizeExpenseRefNumber(rawRef, dateStr);

    if (data.id) {
      const updated = expenses.map((exp) => (exp.id === data.id ? { ...exp, ...data, category: normalizedCategory as any, receiptRef: normalizedRef } : exp));
      setExpenses(updated);
      saveExpenses(updated);
      const targetObj = updated.find((e) => e.id === data.id)!;
      syncDocToFirestore(COLLECTIONS.EXPENSES, data.id, targetObj).catch(console.error);
      showToast(`Biaya pengeluaran "${data.title || data.description}" berhasil diperbarui.`);
    } else {
      const newExpense: ExpenseRecord = {
        ...data,
        category: normalizedCategory as any,
        receiptRef: normalizedRef,
        id: `exp-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      const updated = [newExpense, ...expenses];
      setExpenses(updated);
      saveExpenses(updated);
      syncDocToFirestore(COLLECTIONS.EXPENSES, newExpense.id, newExpense).catch(console.error);
      showToast(`Pengeluaran "${data.title || data.description}" sebesar Rp ${data.amount.toLocaleString('id-ID')} dicatat.`);
    }
  };

  const handleDeleteExpense = (expenseOrId: ExpenseRecord | string, customLabel?: string) => {
    const id = typeof expenseOrId === 'string' ? expenseOrId : expenseOrId.id;
    const target = typeof expenseOrId === 'object' ? expenseOrId : expenses.find((e) => e.id === id);
    const itemName = customLabel || (target ? `${target.category} - ${target.title || target.description} (Rp ${target.amount.toLocaleString('id-ID')})` : 'Biaya Pengeluaran');

    setDeleteDialog({
      isOpen: true,
      title: 'Hapus Biaya Pengeluaran',
      message: 'Apakah Anda yakin ingin menghapus catatan biaya pengeluaran ini?',
      itemName,
      onConfirm: () => {
        const updated = expenses.filter((e) => e.id !== id);
        setExpenses(updated);
        saveExpenses(updated);
        deleteDocFromFirestore(COLLECTIONS.EXPENSES, id).catch(console.error);
        setDeleteDialog((prev) => ({ ...prev, isOpen: false }));
        showToast(`Biaya pengeluaran telah dihapus.`);
      },
    });
  };

  // --- Handlers: User Accounts CRUD ---
  const handleOpenUserModal = (accountToEdit?: UserAccount) => {
    setEditingUser(accountToEdit);
    setIsUserModalOpen(true);
  };

  const handleSaveUser = (
    accountData: Omit<UserAccount, 'id' | 'createdAt'> & { id?: string }
  ) => {
    const cleanUsername = (accountData.username || '').trim().toLowerCase();
    const cleanName = (accountData.name || '').trim();

    // Check duplicate username across other accounts
    const duplicate = users.find(
      (u) => u.id !== accountData.id && (u.username || '').trim().toLowerCase() === cleanUsername
    );
    if (duplicate) {
      alert(
        `❌ Gagal: Username "${cleanUsername}" sudah digunakan oleh akun "${duplicate.name}" (Peran: ${duplicate.role.toUpperCase()}).\n\nSetiap akun wajib memiliki username yang unik agar login tidak tertukar.`
      );
      return;
    }

    // Check if non-owner is trying to use "owner"
    if (accountData.role !== 'owner' && cleanUsername === 'owner') {
      alert('❌ Username "owner" hanya diperuntukkan bagi akun Kepala Bimbel (Owner). Silakan gunakan username lain.');
      return;
    }

    if (accountData.id) {
      const rawUpdated = users.map((u) =>
        u.id === accountData.id ? { ...u, ...accountData, username: cleanUsername, name: cleanName } : u
      );
      const updated = sortUsersByRole(rawUpdated);
      setUsers(updated);
      saveUsers(updated);
      const targetObj = updated.find((u) => u.id === accountData.id)!;
      syncDocToFirestore(COLLECTIONS.USERS, accountData.id, targetObj).catch(console.error);
      // If updating the currently logged in user, refresh session
      if (currentUser && currentUser.id === accountData.id) {
        const updatedSession = { ...currentUser, ...accountData, username: cleanUsername, name: cleanName };
        setCurrentUser(updatedSession);
        localStorage.setItem('bimbel_sigma_auth_user', JSON.stringify(updatedSession));
      }

      // If tutor name or details changed, synchronize historical records across attendance, students & expenses
      const syncRes = synchronizeTutorNames(updated, attendance, students, expenses);
      if (syncRes.attendanceChangesCount > 0) {
        setAttendance(syncRes.updatedAttendance);
        saveAttendance(syncRes.updatedAttendance);
        replaceAllInCollection(COLLECTIONS.ATTENDANCE, syncRes.updatedAttendance).catch(console.error);
      }
      if (syncRes.studentChangesCount > 0) {
        setStudents(syncRes.updatedStudents);
        saveStudents(syncRes.updatedStudents);
        replaceAllInCollection(COLLECTIONS.STUDENTS, syncRes.updatedStudents).catch(console.error);
      }
      if (syncRes.expenseChangesCount > 0) {
        setExpenses(syncRes.updatedExpenses);
        saveExpenses(syncRes.updatedExpenses);
        replaceAllInCollection(COLLECTIONS.EXPENSES, syncRes.updatedExpenses).catch(console.error);
      }

      showToast(`Akun pengguna "${cleanName}" (@${cleanUsername}) berhasil diperbarui.`);
    } else {
      const newAccount: UserAccount = {
        ...accountData,
        name: cleanName,
        username: cleanUsername,
        id: `usr-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      const updated = sortUsersByRole([newAccount, ...users]);
      setUsers(updated);
      saveUsers(updated);
      syncDocToFirestore(COLLECTIONS.USERS, newAccount.id, newAccount).catch(console.error);

      // If new tutor added, harmonize records if any
      if (newAccount.role === 'tutor') {
        const syncRes = synchronizeTutorNames(updated, attendance, students, expenses);
        if (syncRes.attendanceChangesCount > 0) {
          setAttendance(syncRes.updatedAttendance);
          saveAttendance(syncRes.updatedAttendance);
          replaceAllInCollection(COLLECTIONS.ATTENDANCE, syncRes.updatedAttendance).catch(console.error);
        }
        if (syncRes.studentChangesCount > 0) {
          setStudents(syncRes.updatedStudents);
          saveStudents(syncRes.updatedStudents);
          replaceAllInCollection(COLLECTIONS.STUDENTS, syncRes.updatedStudents).catch(console.error);
        }
      }

      showToast(`Akun baru "${cleanName}" (${accountData.role.toUpperCase()}) berhasil dibuat!`);
    }
  };

  const handleSyncTutorNames = () => {
    const syncRes = synchronizeTutorNames(users, attendance, students, expenses);
    let totalUpdated = 0;

    if (syncRes.attendanceChangesCount > 0) {
      setAttendance(syncRes.updatedAttendance);
      saveAttendance(syncRes.updatedAttendance);
      replaceAllInCollection(COLLECTIONS.ATTENDANCE, syncRes.updatedAttendance).catch(console.error);
      totalUpdated += syncRes.attendanceChangesCount;
    }
    if (syncRes.studentChangesCount > 0) {
      setStudents(syncRes.updatedStudents);
      saveStudents(syncRes.updatedStudents);
      replaceAllInCollection(COLLECTIONS.STUDENTS, syncRes.updatedStudents).catch(console.error);
      totalUpdated += syncRes.studentChangesCount;
    }
    if (syncRes.expenseChangesCount > 0) {
      setExpenses(syncRes.updatedExpenses);
      saveExpenses(syncRes.updatedExpenses);
      replaceAllInCollection(COLLECTIONS.EXPENSES, syncRes.updatedExpenses).catch(console.error);
      totalUpdated += syncRes.expenseChangesCount;
    }

    if (totalUpdated > 0) {
      showToast(`✅ Berhasil menyinkronkan nama tutor: ${syncRes.attendanceChangesCount} presensi & ${syncRes.studentChangesCount} siswa diperbarui sesuai database akun.`);
    } else {
      showToast('ℹ️ Seluruh nama tutor di catatan presensi dan data siswa sudah sesuai dengan database akun.');
    }
  };

  const handleDeleteUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return;

    if (currentUser && currentUser.id === userId) {
      showToast('Tidak dapat menghapus akun yang sedang Anda gunakan saat ini.');
      return;
    }

    setDeleteDialog({
      isOpen: true,
      title: 'Hapus Akun Pengguna',
      message: `Apakah Anda yakin ingin menghapus akun @${target.username} (${target.name})? Pengguna ini tidak akan bisa login lagi ke sistem.`,
      itemName: `${target.name} (@${target.username})`,
      onConfirm: () => {
        const rawUpdated = users.filter((u) => u.id !== userId);
        const updated = sortUsersByRole(rawUpdated);
        setUsers(updated);
        saveUsers(updated);
        deleteDocFromFirestore(COLLECTIONS.USERS, userId).catch(console.error);
        setDeleteDialog((prev) => ({ ...prev, isOpen: false }));
        showToast(`Akun @${target.username} berhasil dihapus.`);
      },
    });
  };

  const handleOpenChangePasswordModal = (targetUser?: UserAccount | UserSession) => {
    setPasswordTargetUser(targetUser || currentUser || undefined);
    setIsChangePasswordModalOpen(true);
  };

  const handleSavePassword = (username: string, newPass: string) => {
    const rawUpdated = users.map((u) => (u.username === username ? { ...u, password: newPass } : u));
    const updatedUsers = sortUsersByRole(rawUpdated);
    setUsers(updatedUsers);
    saveUsers(updatedUsers);
    const targetObj = updatedUsers.find((u) => u.username === username);
    if (targetObj) {
      syncDocToFirestore(COLLECTIONS.USERS, targetObj.id, targetObj).catch(console.error);
    }

    // If changing current logged in user's password, sync session
    if (currentUser && currentUser.username === username) {
      const updatedSession = { ...currentUser, password: newPass };
      setCurrentUser(updatedSession);
      localStorage.setItem('bimbel_sigma_auth_user', JSON.stringify(updatedSession));
    }

    showToast(`Kata sandi untuk @${username} berhasil diperbarui dan tersinkronisasi.`);
  };

  // --- Handlers: Settings & Backup ---
  const handleSaveSettings = (newSettings: BimbelSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    syncDocToFirestore(COLLECTIONS.SETTINGS, 'default', { id: 'default', ...newSettings }).catch(console.error);
    showToast('Pengaturan sistem & profil bimbel berhasil disimpan.');
  };

  // Cascade rename existing transactions when category name is edited in Settings
  const handleRenameExpenseCategory = (oldCategory: string, newCategory: string) => {
    const affectedExpenses = expenses.filter((e) => e.category === oldCategory);
    if (affectedExpenses.length > 0) {
      const updated = expenses.map((e) => (e.category === oldCategory ? { ...e, category: newCategory as any } : e));
      setExpenses(updated);
      saveExpenses(updated);
      const updatedAffected = updated.filter((e) => e.category === newCategory);
      batchSeedToFirestore(COLLECTIONS.EXPENSES, updatedAffected).catch(console.error);
      showToast(`${affectedExpenses.length} data pengeluaran di buku kas otomatis diperbarui ke kategori baru.`);
    }
  };

  const handleRenameIncomeCategory = (oldCategory: string, newCategory: string) => {
    const affectedIncomes = incomes.filter((i) => i.category === oldCategory);
    if (affectedIncomes.length > 0) {
      const updated = incomes.map((i) => (i.category === oldCategory ? { ...i, category: newCategory as any } : i));
      setIncomes(updated);
      saveIncomes(updated);
      const updatedAffected = updated.filter((i) => i.category === newCategory);
      batchSeedToFirestore(COLLECTIONS.INCOMES, updatedAffected).catch(console.error);
      showToast(`${affectedIncomes.length} data kas masuk di buku kas otomatis diperbarui ke kategori baru.`);
    }
  };

  // Harmonize all historical transactions to match current settings
  const handleHarmonizeCategories = () => {
    const activeSalaryCategory = getSystemSalaryCategory(settings);
    const activeSppCategory = getSystemSppCategory(settings);

    let expUpdatedCount = 0;
    const updatedExpenses = expenses.map((exp) => {
      const isSalaryRelated = isSystemExpenseCategory(exp.category, settings);
      if (isSalaryRelated && exp.category !== activeSalaryCategory) {
        expUpdatedCount++;
        return { ...exp, category: activeSalaryCategory as any };
      }
      return exp;
    });

    let incUpdatedCount = 0;
    const updatedIncomes = incomes.map((inc) => {
      const isSppRelated = isSystemIncomeCategory(inc.category, settings);
      if (isSppRelated && inc.category !== activeSppCategory) {
        incUpdatedCount++;
        return { ...inc, category: activeSppCategory as any };
      }
      return inc;
    });

    if (expUpdatedCount > 0) {
      setExpenses(updatedExpenses);
      saveExpenses(updatedExpenses);
      batchSeedToFirestore(COLLECTIONS.EXPENSES, updatedExpenses).catch(console.error);
    }

    if (incUpdatedCount > 0) {
      setIncomes(updatedIncomes);
      saveIncomes(updatedIncomes);
      batchSeedToFirestore(COLLECTIONS.INCOMES, updatedIncomes).catch(console.error);
    }

    const totalUpdated = expUpdatedCount + incUpdatedCount;
    if (totalUpdated > 0) {
      showToast(`✅ Berhasil menyelaraskan ${totalUpdated} data transaksi (Honor: ${expUpdatedCount}, SPP: ${incUpdatedCount}) ke master kategori aktif.`);
    } else {
      showToast('Seluruh kategori pengeluaran dan pemasukan di buku kas sudah 100% selaras.');
    }
  };

  const handleResetAllData = async () => {
    const data = resetToMockData();
    setStudents(data.students);
    setAttendance(data.attendance);
    setIncomes(data.incomes);
    setExpenses(data.expenses);
    setUsers(data.users);
    setSettings(data.settings);

    try {
      await replaceAllInCollection(COLLECTIONS.USERS, data.users);
      await replaceAllInCollection(COLLECTIONS.STUDENTS, data.students);
      await clearFirestoreCollection(COLLECTIONS.ATTENDANCE);
      await clearFirestoreCollection(COLLECTIONS.INCOMES);
      await clearFirestoreCollection(COLLECTIONS.EXPENSES);
      await syncDocToFirestore(COLLECTIONS.SETTINGS, 'default', { id: 'default', ...data.settings });
    } catch (e) {
      console.warn('Reset cloud seed error:', e);
    }

    showToast('Seluruh data demo transaksi & presensi berhasil dibersihkan.');
  };

  const handleImportFullData = async (data: {
    students: Student[];
    attendance: AttendanceRecord[];
    incomes: IncomeRecord[];
    expenses: ExpenseRecord[];
    users: UserAccount[];
    settings: BimbelSettings;
  }) => {
    const sortedUsers = sortUsersByRole(data.users || []);
    setStudents(data.students);
    setAttendance(data.attendance);
    setIncomes(data.incomes);
    setExpenses(data.expenses);
    setUsers(sortedUsers);
    setSettings(data.settings);
    saveStudents(data.students);
    saveAttendance(data.attendance);
    saveIncomes(data.incomes);
    saveExpenses(data.expenses);
    saveUsers(sortedUsers);
    saveSettings(data.settings);

    try {
      await batchSeedToFirestore(COLLECTIONS.USERS, sortedUsers);
      await batchSeedToFirestore(COLLECTIONS.STUDENTS, data.students);
      await batchSeedToFirestore(COLLECTIONS.ATTENDANCE, data.attendance);
      await batchSeedToFirestore(COLLECTIONS.INCOMES, data.incomes);
      await batchSeedToFirestore(COLLECTIONS.EXPENSES, data.expenses);
      await syncDocToFirestore(COLLECTIONS.SETTINGS, 'default', { id: 'default', ...data.settings });
    } catch (e) {
      console.warn('Import cloud sync error:', e);
    }

    showToast('Seluruh data berhasil dipulihkan dari file backup dan disinkronkan ke Cloud!');
  };

  const handleSyncAllToCloud = async () => {
    const sortedUsers = sortUsersByRole(users);
    await batchSeedToFirestore(COLLECTIONS.USERS, sortedUsers);
    await batchSeedToFirestore(COLLECTIONS.STUDENTS, students);
    await batchSeedToFirestore(COLLECTIONS.ATTENDANCE, attendance);
    await batchSeedToFirestore(COLLECTIONS.INCOMES, incomes);
    await batchSeedToFirestore(COLLECTIONS.EXPENSES, expenses);
    await syncDocToFirestore(COLLECTIONS.SETTINGS, 'default', { id: 'default', ...settings });
    showToast('Seluruh data berhasil diunggah dan disinkronkan ke Firebase Cloud!');
  };

  // Fallback / Siswa object for student portal
  const today = getTodayDateString();
  const todayAttendanceCount = attendance.filter((a) => a.date === today && a.status === 'Hadir').length;

  const currentStudentObj: Student =
    students.find((s) => s.code && s.code === currentUser?.code) ||
    students.find((s) => s.id && s.id === currentUser?.id) ||
    students.find((s) => s.name && currentUser?.name && s.name.toLowerCase() === currentUser.name.toLowerCase()) ||
    students[0] || {
      id: currentUser?.id || 'std-fallback',
      code: currentUser?.code || 'SGM-001',
      name: currentUser?.name || 'Siswa Bimbel',
      level: 'SMP',
      gradeDetail: 'Kelas 9 SMP',
      classType: 'Privat',
      pricePerSession: 60000,
      parentName: 'Orang Tua Siswa',
      parentPhone: '081234567890',
      status: 'Aktif',
      joinDate: today,
    };

  // If user is not logged in, show AuthLoginView
  if (!currentUser) {
    return (
      <AuthLoginView
        onLoginSuccess={handleLoginSuccess}
        users={users}
        students={students}
        settings={settings}
      />
    );
  }

  return (
    <div className="h-screen bg-slate-100 flex flex-col antialiased text-slate-900 selection:bg-indigo-500 selection:text-white overflow-hidden print:h-auto print:overflow-visible">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="bg-slate-900/95 backdrop-blur-md text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* 1. Global Navigation Bar */}
      <Navbar
        currentUser={currentUser}
        users={users}
        settings={settings}
        onSwitchUser={handleSwitchUser}
        onLogout={handleLogout}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        onResetData={handleResetAllData}
        todayAttendanceCount={todayAttendanceCount}
        totalStudentsCount={students.length}
        onOpenChangePasswordModal={() => handleOpenChangePasswordModal(currentUser)}
        isCloudConnected={isCloudConnected}
      />

      {/* 2. Main Content Layout with Responsive Sidebar */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Sidebar Navigation */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => setCurrentTab(tab)}
          currentUser={currentUser}
          settings={settings}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          todayAttendanceCount={todayAttendanceCount}
          totalStudentsCount={students.length}
        />

        {/* Main View Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 min-h-0">
          {/* TAB 1: DASHBOARD (Role-Based Display) */}
          {currentTab === 'dashboard' && currentUser.role === 'owner' && (
            <DashboardOwner
              students={students}
              attendance={attendance}
              incomes={incomes}
              expenses={expenses}
              settings={settings}
              currentUser={currentUser}
              onNavigate={setCurrentTab}
              onOpenStudentModal={() => handleOpenStudentModal()}
              onOpenAttendanceModal={(rec) => handleOpenAttendanceModal(rec)}
              onOpenIncomeModal={() => handleOpenIncomeModal()}
              onOpenExpenseModal={() => handleOpenExpenseModal()}
              onOpenChangePasswordModal={() => handleOpenChangePasswordModal(currentUser)}
              onDeleteAttendance={handleDeleteAttendance}
            />
          )}

          {currentTab === 'dashboard' && currentUser.role === 'tutor' && (
            <DashboardTutor
              currentUser={currentUser}
              students={students}
              attendance={attendance}
              users={users}
              settings={settings}
              onOpenAttendanceModal={handleOpenAttendanceModal}
              onOpenBatchAttendanceModal={() => setIsBatchAttendanceModalOpen(true)}
              onDeleteAttendance={handleDeleteAttendance}
              onNavigate={setCurrentTab}
              onOpenChangePasswordModal={() => handleOpenChangePasswordModal(currentUser)}
            />
          )}

          {/* TAB 2: PORTAL SISWA (For Siswa Role) */}
          {(currentTab === 'student-portal' || (currentTab === 'dashboard' && currentUser.role === 'siswa')) && (
            <DashboardSiswa
              currentUser={currentUser}
              student={currentStudentObj}
              attendance={attendance}
              allStudents={students}
              settings={settings}
              onOpenSelfAttendanceModal={() => setIsSelfAttendanceModalOpen(true)}
              onNavigate={setCurrentTab}
              onOpenChangePasswordModal={() => handleOpenChangePasswordModal(currentUser)}
            />
          )}

          {/* TAB 3: DATABASE SISWA */}
          {currentTab === 'students' && (
            <StudentDatabaseView
              students={students}
              users={users}
              userRole={currentUser.role}
              onOpenStudentModal={handleOpenStudentModal}
              onDeleteStudent={handleDeleteStudent}
              onResetStudents={handleResetToScreenshotStudents}
            />
          )}

          {/* TAB 4: PRESENSI & MATERI */}
          {currentTab === 'attendance' && (
            <AttendanceView
              attendance={
                currentUser.role === 'siswa'
                  ? attendance.filter((a) => a.studentId === currentStudentObj.id)
                  : attendance
              }
              students={students}
              users={users}
              userRole={currentUser.role}
              currentUserName={currentUser.name}
              onOpenAttendanceModal={handleOpenAttendanceModal}
              onOpenBatchAttendanceModal={() => setIsBatchAttendanceModalOpen(true)}
              onDeleteAttendance={handleDeleteAttendance}
            />
          )}

          {/* TAB 5: TAGIHAN SISWA (SKEMA PASCA-BAYAR: PRESENSI × TARIF) */}
          {currentTab === 'student-billing' && (
            <StudentBillingView
              students={students}
              attendance={attendance}
              incomes={incomes}
              userRole={currentUser.role}
              currentStudentCode={currentUser.code}
              settings={settings}
              onRecordPayment={handleRecordStudentPayment}
              onViewReceipt={(inc) => setReceiptIncome(inc)}
            />
          )}

          {/* TAB 6: BUKU KAS UTAMA & ARUS KAS (KAS MASUK + KAS KELUAR) - Role Owner Only */}
          {(currentTab === 'cash-book' || currentTab === 'incomes' || currentTab === 'expenses') && currentUser.role === 'owner' && (
            <CashBookView
              incomes={incomes}
              expenses={expenses}
              userRole={currentUser.role}
              settings={settings}
              onOpenIncomeModal={handleOpenIncomeModal}
              onOpenExpenseModal={handleOpenExpenseModal}
              onDeleteIncome={handleDeleteIncome}
              onDeleteExpense={handleDeleteExpense}
              onViewReceipt={(inc) => setReceiptIncome(inc)}
            />
          )}

          {/* TAB 7: CETAK REKAP PRESENSI & KARTU (MODE A & MODE B) */}
          {currentTab === 'print-cards' && (
            <PrintCardsView
              students={students}
              attendance={attendance}
              incomes={incomes}
              users={users}
              userRole={currentUser.role}
              currentStudentCode={currentUser.code}
              settings={settings}
            />
          )}

          {/* TAB 8: LAPORAN LABA RUGI (P&L) BULANAN & TAHUNAN - Role Owner Only */}
          {currentTab === 'profit-loss' && currentUser.role === 'owner' && (
            <ProfitLossView
              attendance={attendance}
              incomes={incomes}
              expenses={expenses}
              settings={settings}
              students={students}
              users={users}
            />
          )}

          {/* TAB 9: HONOR & GAJI TUTOR (Role Owner & Tutor) */}
          {currentTab === 'salary' && (currentUser.role === 'owner' || currentUser.role === 'tutor') && (
            <SalaryView
              currentUser={currentUser}
              tutors={users.filter((u) => u.role === 'tutor')}
              users={users}
              students={students}
              attendances={attendance}
              settings={settings}
              expenses={expenses}
              onAddExpense={handleSaveExpense}
              onNavigateToSettings={() => setCurrentTab('settings')}
            />
          )}

          {/* TAB 10: PENGATURAN SISTEM & KELOLA AKUN - Role Owner Only */}
          {currentTab === 'settings' && currentUser.role === 'owner' && (
            <SettingsView
              users={users}
              settings={settings}
              students={students}
              expenses={expenses}
              incomes={incomes}
              attendance={attendance}
              currentUserId={currentUser.id}
              onSaveUser={handleSaveUser}
              onDeleteUser={handleDeleteUser}
              onSaveSettings={handleSaveSettings}
              onResetAllData={handleResetAllData}
              onOpenUserModal={handleOpenUserModal}
              onRenameExpenseCategory={handleRenameExpenseCategory}
              onRenameIncomeCategory={handleRenameIncomeCategory}
              onHarmonizeCategories={handleHarmonizeCategories}
              onSyncTutorNames={handleSyncTutorNames}
              onImportFullData={handleImportFullData}
              onSyncAllToCloud={handleSyncAllToCloud}
            />
          )}
        </main>
      </div>

      {/* --- ALL INTERACTIVE MODAL DIALOGS --- */}

      {/* 1. Student Modal (Add/Edit) */}
      <StudentModal
        isOpen={isStudentModalOpen}
        onClose={() => {
          setIsStudentModalOpen(false);
          setEditingStudent(undefined);
        }}
        onSave={handleSaveStudent}
        initialData={editingStudent}
        existingStudentsCount={students.length}
        users={users}
      />

      {/* 2. Attendance Modal (Single Add/Edit) */}
      <AttendanceModal
        isOpen={isAttendanceModalOpen}
        onClose={() => {
          setIsAttendanceModalOpen(false);
          setEditingAttendance(undefined);
        }}
        onSave={handleSaveAttendance}
        students={students}
        initialData={editingAttendance}
        currentUserName={currentUser.name}
        users={users}
        attendance={attendance}
      />

      {/* 3. Batch Attendance Modal */}
      <BatchAttendanceModal
        isOpen={isBatchAttendanceModalOpen}
        onClose={() => setIsBatchAttendanceModalOpen(false)}
        onSaveBatch={handleBatchAttendance}
        students={students}
        currentUserName={currentUser.name}
        users={users}
      />

      {/* 4. Self Attendance Modal (For Siswa) */}
      <SelfAttendanceModal
        isOpen={isSelfAttendanceModalOpen}
        onClose={() => setIsSelfAttendanceModalOpen(false)}
        onConfirmSelfAttendance={(record) =>
          handleSelfAttendance(
            currentStudentObj,
            record.topic,
            record.tutorNotes || '',
            record.time,
            record.tutorName
          )
        }
        student={currentStudentObj}
        existingTodayRecord={attendance.find(
          (a) => a.studentId === currentStudentObj.id && a.date === today
        )}
        users={users}
      />

      {/* 5. Income Modal (Add/Edit SPP) */}
      <IncomeModal
        isOpen={isIncomeModalOpen}
        onClose={() => {
          setIsIncomeModalOpen(false);
          setEditingIncome(undefined);
        }}
        onSave={handleSaveIncome}
        students={students}
        attendances={attendance}
        initialData={editingIncome}
        currentUserName={currentUser.name}
        totalExistingIncomes={incomes.length}
        existingIncomes={incomes}
        paymentMethods={settings.paymentMethods}
        categories={settings.incomeCategories}
        settings={settings}
      />

      {/* 6. Expense Modal (Add/Edit Expense) */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setEditingExpense(undefined);
        }}
        onSave={handleSaveExpense}
        initialData={editingExpense}
        currentUserName={currentUser.name}
        categories={settings.expenseCategories}
        paymentMethods={settings.paymentMethods}
        existingExpenses={expenses}
        tutors={users.filter((u) => u.role === 'tutor' && u.isActive !== false)}
      />

      {/* 7. Receipt Modal (Kwitansi Resmi) */}
      {receiptIncome && (
        <ReceiptModal
          isOpen={Boolean(receiptIncome)}
          onClose={() => setReceiptIncome(null)}
          income={receiptIncome}
          student={students.find((s) => s.id === receiptIncome.studentId)}
          settings={settings}
        />
      )}

      {/* 8. User Account Modal (Owner, Tutor, Siswa) */}
      <UserAccountModal
        isOpen={isUserModalOpen}
        onClose={() => {
          setIsUserModalOpen(false);
          setEditingUser(undefined);
        }}
        onSave={handleSaveUser}
        onDelete={handleDeleteUser}
        initialData={editingUser}
        students={students}
        existingUsers={users}
        currentUserId={currentUser?.id}
      />

      {/* 9. Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={deleteDialog.isOpen}
        title={deleteDialog.title}
        message={deleteDialog.message}
        itemName={deleteDialog.itemName}
        onConfirm={deleteDialog.onConfirm}
        onClose={() => setDeleteDialog((prev) => ({ ...prev, isOpen: false }))}
        onCancel={() => setDeleteDialog((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* 10. Change Password Modal (For all user roles & Owner sync) */}
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => {
          setIsChangePasswordModalOpen(false);
          setPasswordTargetUser(undefined);
        }}
        targetUser={passwordTargetUser}
        onSavePassword={handleSavePassword}
      />
    </div>
  );
}
