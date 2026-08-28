import React, { useState } from 'react';
import {
  Settings,
  Users,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  Plus,
  Trash2,
  Edit,
  Save,
  RotateCcw,
  CheckCircle2,
  Download,
  Upload,
  AlertCircle,
  TrendingDown,
  DollarSign,
  Building,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Eye,
  EyeOff,
  Copy,
  Check,
  Search,
  KeyRound,
  Filter,
  Palette,
  LayoutTemplate,
  Type,
  Paintbrush,
  Layout,
  Wallet,
  Calculator,
  Percent,
  Cloud,
  CloudCheck,
  ArrowUpRight,
  ArrowDownRight,
  X,
  MessageCircle,
  MessageSquare,
  Send,
  Smartphone,
  Share2,
  RefreshCw,
  Lock,
} from 'lucide-react';
import {
  UserAccount,
  UserRole,
  Student,
  BimbelSettings,
  WhatsAppTemplates,
  ExpenseRecord,
  IncomeRecord,
  AttendanceRecord,
} from '../../types';
import { UserAvatar } from '../common/UserAvatar';
import {
  getSystemSalaryCategory,
  getSystemSppCategory,
  isSystemExpenseCategory,
  isSystemIncomeCategory,
  sortUsersByRole,
} from '../../utils/storage';
import {
  DEFAULT_WA_TEMPLATES,
  formatWhatsAppMessage,
  AVAILABLE_WA_VARIABLES,
  sendWhatsAppDirect,
} from '../../utils/whatsapp';
import { ConfirmDeleteModal } from '../modals/ConfirmDeleteModal';

interface SettingsViewProps {
  users: UserAccount[];
  settings: BimbelSettings;
  students: Student[];
  expenses: ExpenseRecord[];
  incomes: IncomeRecord[];
  attendance: AttendanceRecord[];
  currentUserId: string;
  onSaveUser: (account: Omit<UserAccount, 'id' | 'createdAt'> & { id?: string }) => void;
  onDeleteUser: (userId: string) => void;
  onSaveSettings: (settings: BimbelSettings) => void;
  onResetAllData: () => void;
  onOpenUserModal: (account?: UserAccount) => void;
  onRenameExpenseCategory?: (oldName: string, newName: string) => void;
  onRenameIncomeCategory?: (oldName: string, newName: string) => void;
  onHarmonizeCategories?: () => void;
  onSyncTutorNames?: () => void;
  onImportFullData: (data: {
    students: Student[];
    attendance: AttendanceRecord[];
    incomes: IncomeRecord[];
    expenses: ExpenseRecord[];
    users: UserAccount[];
    settings: BimbelSettings;
  }) => void;
  onSyncAllToCloud?: () => Promise<void>;
}

type SettingsSubTab = 'accounts' | 'salary-rates' | 'financial-categories' | 'profile' | 'whatsapp-templates' | 'appearance' | 'backup';

export const SettingsView: React.FC<SettingsViewProps> = ({
  users,
  settings,
  students,
  expenses,
  incomes,
  attendance,
  currentUserId,
  onSaveUser,
  onDeleteUser,
  onSaveSettings,
  onResetAllData,
  onOpenUserModal,
  onRenameExpenseCategory,
  onRenameIncomeCategory,
  onHarmonizeCategories,
  onSyncTutorNames,
  onImportFullData,
  onSyncAllToCloud,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<SettingsSubTab>('accounts');
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [cloudSyncSuccess, setCloudSyncSuccess] = useState(false);

  // Accounts state
  const [accountFilter, setAccountFilter] = useState<'all' | UserRole>('all');
  const [accountSearch, setAccountSearch] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Dynamic Categories state
  const [newExpenseCategory, setNewExpenseCategory] = useState('');
  const [newIncomeCategory, setNewIncomeCategory] = useState('');
  const [newPaymentMethod, setNewPaymentMethod] = useState('');

  // Editing state for financial categories & payment methods
  const [editingItem, setEditingItem] = useState<{
    type: 'expense' | 'income' | 'payment';
    oldValue: string;
    newValue: string;
  } | null>(null);

  // Salary Formula & Rates state
  const [salaryForm, setSalaryForm] = useState<BimbelSettings>({
    ...settings,
    salaryCalculationMode: settings.salaryCalculationMode || 'percentage',
    privatSalaryPercentage: settings.privatSalaryPercentage ?? 60,
    groupSalaryPercentage: settings.groupSalaryPercentage ?? 40,
    semiPrivatSalaryPercentage: settings.semiPrivatSalaryPercentage ?? 50,
    minPrivatSessionRate: settings.minPrivatSessionRate ?? 50000,
    minGroupSessionRate: settings.minGroupSessionRate ?? 60000,
    flatPrivatSessionRate: settings.flatPrivatSessionRate ?? 65000,
    flatGroupSessionRate: settings.flatGroupSessionRate ?? 80000,
    transportAllowancePerDay: settings.transportAllowancePerDay ?? 15000,
    evaluationBonusPerSession: settings.evaluationBonusPerSession ?? 0,
  });
  const [salarySavedToast, setSalarySavedToast] = useState(false);

  // Salary Simulation states
  const [simPrivatPrice, setSimPrivatPrice] = useState<number>(100000);
  const [simGroupPricePerStudent, setSimGroupPricePerStudent] = useState<number>(40000);
  const [simGroupStudentsCount, setSimGroupStudentsCount] = useState<number>(4);

  // Profile Form state
  const [profileForm, setProfileForm] = useState<BimbelSettings>({ ...settings });
  const [profileSavedToast, setProfileSavedToast] = useState(false);

  // Appearance & Dashboard Texts state
  const [appearanceForm, setAppearanceForm] = useState<BimbelSettings>({
    ...settings,
    logoSymbol: settings.logoSymbol || 'Σ',
    appVersionBadge: settings.appVersionBadge || 'v2.6 PRO',
    sidebarFooterTitle: settings.sidebarFooterTitle || settings.bimbelName || 'BIMBEL SIGMA',
    sidebarFooterTagline: settings.sidebarFooterTagline || (settings.tagline ? `“${settings.tagline}”` : '“Belajar Sampai Paham”'),
    sidebarFooterNote: settings.sidebarFooterNote || 'Data tersimpan aman di LocalStorage browser',
    accentColor: settings.accentColor || 'indigo',
    ownerDashboardBadge: settings.ownerDashboardBadge || 'Executive Dashboard (Owner Access)',
    ownerDashboardTitle: settings.ownerDashboardTitle || '',
    ownerDashboardMessage: settings.ownerDashboardMessage || 'Pantau metrik finansial, absensi digital real-time, dan pembukuan tahunan dalam satu pintu.',
    tutorDashboardBadge: settings.tutorDashboardBadge || 'Ruang Kerja Pengajar (Tutor Access)',
    tutorDashboardTitle: settings.tutorDashboardTitle || '',
    tutorDashboardMessage: settings.tutorDashboardMessage || 'Fokus pada kualitas pembelajaran: catat absensi harian siswa, topik materi, serta evaluasi pemahaman belajar.',
    studentDashboardBadge: settings.studentDashboardBadge || 'Portal Siswa & Orang Tua Bimbel Sigma',
    studentDashboardTitle: settings.studentDashboardTitle || '',
    studentDashboardMessage: settings.studentDashboardMessage || '“Belajar Sampai Paham, Bukan Sekadar Hafal”. Catat kehadiran mandiri, pantau materi tiap sesi pembelajaran, dan evaluasi hasil belajar.',
    loginWelcomeMessage: settings.loginWelcomeMessage || 'Sistem Manajemen & Presensi Digital Bimbel Terintegrasi',
  });
  const [appearanceSavedToast, setAppearanceSavedToast] = useState(false);
  const [previewRole, setPreviewRole] = useState<'owner' | 'tutor' | 'siswa'>('owner');

  // WhatsApp Templates state
  const [whatsappForm, setWhatsappForm] = useState<WhatsAppTemplates>({
    unpaidBilling: settings.whatsappTemplates?.unpaidBilling || DEFAULT_WA_TEMPLATES.unpaidBilling,
    partialBilling: settings.whatsappTemplates?.partialBilling || DEFAULT_WA_TEMPLATES.partialBilling,
    paidBilling: settings.whatsappTemplates?.paidBilling || DEFAULT_WA_TEMPLATES.paidBilling,
    studentReport: settings.whatsappTemplates?.studentReport || DEFAULT_WA_TEMPLATES.studentReport,
  });
  const [whatsappSavedToast, setWhatsappSavedToast] = useState(false);
  const [activeTemplateType, setActiveTemplateType] = useState<'unpaid' | 'partial' | 'paid' | 'report'>('unpaid');
  const [testPhoneNumber, setTestPhoneNumber] = useState(settings.phone || '081234567890');
  const [copiedTemplate, setCopiedTemplate] = useState(false);

  // In-App Confirmation & Notice Dialog states (Iframe-Safe)
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    itemName?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    itemName: '',
    onConfirm: () => {},
  });

  const [noticeModal, setNoticeModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'warning' | 'info' | 'error';
  } | null>(null);

  React.useEffect(() => {
    setProfileForm({ ...settings });
    setSalaryForm({
      ...settings,
      salaryCalculationMode: settings.salaryCalculationMode || 'percentage',
      privatSalaryPercentage: settings.privatSalaryPercentage ?? 60,
      groupSalaryPercentage: settings.groupSalaryPercentage ?? 40,
      semiPrivatSalaryPercentage: settings.semiPrivatSalaryPercentage ?? 50,
      minPrivatSessionRate: settings.minPrivatSessionRate ?? 50000,
      minGroupSessionRate: settings.minGroupSessionRate ?? 60000,
      flatPrivatSessionRate: settings.flatPrivatSessionRate ?? 65000,
      flatGroupSessionRate: settings.flatGroupSessionRate ?? 80000,
      transportAllowancePerDay: settings.transportAllowancePerDay ?? 15000,
      evaluationBonusPerSession: settings.evaluationBonusPerSession ?? 0,
    });
    setAppearanceForm({
      ...settings,
      logoSymbol: settings.logoSymbol || 'Σ',
      appVersionBadge: settings.appVersionBadge || 'v2.6 PRO',
      sidebarFooterTitle: settings.sidebarFooterTitle || settings.bimbelName || 'BIMBEL SIGMA',
      sidebarFooterTagline: settings.sidebarFooterTagline || (settings.tagline ? `“${settings.tagline}”` : '“Belajar Sampai Paham”'),
      sidebarFooterNote: settings.sidebarFooterNote || 'Data tersimpan aman di LocalStorage browser',
      accentColor: settings.accentColor || 'indigo',
      ownerDashboardBadge: settings.ownerDashboardBadge || 'Executive Dashboard (Owner Access)',
      ownerDashboardTitle: settings.ownerDashboardTitle || '',
      ownerDashboardMessage: settings.ownerDashboardMessage || 'Pantau metrik finansial, absensi digital real-time, dan pembukuan tahunan dalam satu pintu.',
      tutorDashboardBadge: settings.tutorDashboardBadge || 'Ruang Kerja Pengajar (Tutor Access)',
      tutorDashboardTitle: settings.tutorDashboardTitle || '',
      tutorDashboardMessage: settings.tutorDashboardMessage || 'Fokus pada kualitas pembelajaran: catat absensi harian siswa, topik materi, serta evaluasi pemahaman belajar.',
      studentDashboardBadge: settings.studentDashboardBadge || 'Portal Siswa & Orang Tua Bimbel Sigma',
      studentDashboardTitle: settings.studentDashboardTitle || '',
      studentDashboardMessage: settings.studentDashboardMessage || '“Belajar Sampai Paham, Bukan Sekadar Hafal”. Catat kehadiran mandiri, pantau materi tiap sesi pembelajaran, dan evaluasi hasil belajar.',
      loginWelcomeMessage: settings.loginWelcomeMessage || 'Sistem Manajemen & Presensi Digital Bimbel Terintegrasi',
    });
    setWhatsappForm({
      unpaidBilling: settings.whatsappTemplates?.unpaidBilling || DEFAULT_WA_TEMPLATES.unpaidBilling,
      partialBilling: settings.whatsappTemplates?.partialBilling || DEFAULT_WA_TEMPLATES.partialBilling,
      paidBilling: settings.whatsappTemplates?.paidBilling || DEFAULT_WA_TEMPLATES.paidBilling,
      studentReport: settings.whatsappTemplates?.studentReport || DEFAULT_WA_TEMPLATES.studentReport,
    });
  }, [settings]);

  // Handle Save Salary Settings
  const handleSaveSalarySettings = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(salaryForm);
    setSalarySavedToast(true);
    setTimeout(() => setSalarySavedToast(false), 3000);
  };

  // Toggle password visibility for an account
  const toggleShowPassword = (id: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Copy username & password info
  const handleCopyCredentials = (acc: UserAccount) => {
    const text = `Akun Bimbel Sigma:\nRole: ${acc.role.toUpperCase()}\nUsername: ${acc.username}\nPassword: ${
      acc.password || 'sigma123'
    }`;
    navigator.clipboard.writeText(text);
    setCopiedId(acc.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered & role-ordered accounts (Owner -> Tutor -> Siswa)
  const filteredUsers = sortUsersByRole(
    users.filter((u) => {
      const matchRole = accountFilter === 'all' || u.role === accountFilter;
      const q = (accountSearch || '').toLowerCase();
      const matchSearch =
        !q ||
        (u.name || '').toLowerCase().includes(q) ||
        (u.username || '').toLowerCase().includes(q) ||
        (u.specialty && u.specialty.toLowerCase().includes(q)) ||
        (u.code && u.code.toLowerCase().includes(q));
      return matchRole && matchSearch;
    })
  );

  // Unified Financial Categories & Payment Handlers
  const handleAddExpenseCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const cat = (newExpenseCategory || '').trim();
    if (!cat) return;
    if ((settings.expenseCategories || []).some((c) => (c || '').toLowerCase() === cat.toLowerCase())) {
      setNoticeModal({
        isOpen: true,
        title: 'Kategori Sudah Ada',
        message: `Kategori pengeluaran "${cat}" sudah ada dalam daftar pilihan!`,
        type: 'warning',
      });
      return;
    }
    const updated = {
      ...settings,
      expenseCategories: [...(settings.expenseCategories || []), cat],
    };
    onSaveSettings(updated);
    setNewExpenseCategory('');
  };

  const handleDeleteExpenseCategory = (categoryName: string) => {
    const sysSalaryCat = getSystemSalaryCategory(settings);
    if (
      categoryName.toLowerCase().trim() === sysSalaryCat.toLowerCase().trim() ||
      isSystemExpenseCategory(categoryName, settings)
    ) {
      setNoticeModal({
        isOpen: true,
        title: 'Kategori Sistem Wajib',
        message: `Kategori "${categoryName}" adalah Kategori Sistem (Wajib) yang terhubung otomatis dengan modul honor & gaji tutor.\n\nKategori ini tidak dapat dihapus, namun Anda bebas mengubah namanya menggunakan tombol Edit (✏️).`,
        type: 'warning',
      });
      return;
    }

    if ((settings.expenseCategories || []).length <= 1) {
      setNoticeModal({
        isOpen: true,
        title: 'Tidak Dapat Dihapus',
        message: 'Minimal harus ada 1 kategori pengeluaran dalam sistem!',
        type: 'warning',
      });
      return;
    }
    const count = expenses.filter((e) => e.category === categoryName).length;
    const confirmMsg = count > 0
      ? `Kategori "${categoryName}" sudah pernah digunakan pada ${count} catatan pengeluaran. Yakin ingin menghapus dari daftar pilihan?`
      : `Hapus kategori pengeluaran "${categoryName}" dari daftar pilihan?`;

    setDeleteDialog({
      isOpen: true,
      title: 'Hapus Kategori Pengeluaran',
      message: confirmMsg,
      itemName: categoryName,
      onConfirm: () => {
        const updated = {
          ...settings,
          expenseCategories: (settings.expenseCategories || []).filter((c) => c !== categoryName),
        };
        onSaveSettings(updated);
      },
    });
  };

  const handleAddIncomeCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const cat = (newIncomeCategory || '').trim();
    if (!cat) return;
    if ((settings.incomeCategories || []).some((c) => (c || '').toLowerCase() === cat.toLowerCase())) {
      setNoticeModal({
        isOpen: true,
        title: 'Kategori Sudah Ada',
        message: `Kategori kas masuk "${cat}" sudah ada dalam daftar pilihan!`,
        type: 'warning',
      });
      return;
    }
    const updated = {
      ...settings,
      incomeCategories: [...(settings.incomeCategories || []), cat],
    };
    onSaveSettings(updated);
    setNewIncomeCategory('');
  };

  const handleDeleteIncomeCategory = (categoryName: string) => {
    const sysSppCat = getSystemSppCategory(settings);
    if (
      categoryName.toLowerCase().trim() === sysSppCat.toLowerCase().trim() ||
      isSystemIncomeCategory(categoryName, settings)
    ) {
      setNoticeModal({
        isOpen: true,
        title: 'Kategori Sistem Wajib',
        message: `Kategori "${categoryName}" adalah Kategori Sistem (Wajib) yang terhubung otomatis dengan modul kasir dan pembayaran SPP siswa.\n\nKategori ini tidak dapat dihapus, namun Anda bebas mengubah namanya menggunakan tombol Edit (✏️).`,
        type: 'warning',
      });
      return;
    }

    if ((settings.incomeCategories || []).length <= 1) {
      setNoticeModal({
        isOpen: true,
        title: 'Tidak Dapat Dihapus',
        message: 'Minimal harus ada 1 kategori penerimaan kas dalam sistem!',
        type: 'warning',
      });
      return;
    }
    const count = incomes.filter((i) => i.category === categoryName).length;
    const confirmMsg = count > 0
      ? `Kategori "${categoryName}" sudah pernah digunakan pada ${count} catatan penerimaan kas. Yakin ingin menghapus dari daftar pilihan?`
      : `Hapus kategori penerimaan "${categoryName}" dari daftar pilihan?`;

    setDeleteDialog({
      isOpen: true,
      title: 'Hapus Kategori Penerimaan',
      message: confirmMsg,
      itemName: categoryName,
      onConfirm: () => {
        const updated = {
          ...settings,
          incomeCategories: (settings.incomeCategories || []).filter((c) => c !== categoryName),
        };
        onSaveSettings(updated);
      },
    });
  };

  const handleAddPaymentMethod = (e: React.FormEvent) => {
    e.preventDefault();
    const method = (newPaymentMethod || '').trim();
    if (!method) return;
    if ((settings.paymentMethods || []).some((m) => (m || '').toLowerCase() === method.toLowerCase())) {
      setNoticeModal({
        isOpen: true,
        title: 'Metode Pembayaran Sudah Ada',
        message: `Metode pembayaran "${method}" sudah ada dalam daftar pilihan!`,
        type: 'warning',
      });
      return;
    }
    const updated = {
      ...settings,
      paymentMethods: [...(settings.paymentMethods || []), method],
    };
    onSaveSettings(updated);
    setNewPaymentMethod('');
  };

  const handleDeletePaymentMethod = (methodName: string) => {
    if ((settings.paymentMethods || []).length <= 1) {
      setNoticeModal({
        isOpen: true,
        title: 'Tidak Dapat Dihapus',
        message: 'Minimal harus ada 1 metode pembayaran dalam sistem!',
        type: 'warning',
      });
      return;
    }
    const isUsedIncome = incomes.some((inc) => inc.paymentMethod === methodName);
    const isUsedExpense = expenses.some((exp) => exp.paymentMethod === methodName);
    const totalUsage = (isUsedIncome ? incomes.filter((i) => i.paymentMethod === methodName).length : 0) +
      (isUsedExpense ? expenses.filter((e) => e.paymentMethod === methodName).length : 0);

    const confirmMsg = totalUsage > 0
      ? `Metode pembayaran "${methodName}" sudah pernah digunakan pada ${totalUsage} transaksi. Yakin ingin menghapus dari daftar pilihan?`
      : `Hapus metode pembayaran "${methodName}" dari daftar pilihan?`;

    setDeleteDialog({
      isOpen: true,
      title: 'Hapus Metode Pembayaran',
      message: confirmMsg,
      itemName: methodName,
      onConfirm: () => {
        const updated = {
          ...settings,
          paymentMethods: (settings.paymentMethods || []).filter((m) => m !== methodName),
        };
        onSaveSettings(updated);
      },
    });
  };

  // Edit / Rename Handler for all 3 financial master items
  const handleSaveEditedItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    const trimmedNew = editingItem.newValue.trim();
    if (!trimmedNew) {
      setNoticeModal({
        isOpen: true,
        title: 'Input Tidak Valid',
        message: 'Nama kategori / metode pembayaran tidak boleh kosong!',
        type: 'warning',
      });
      return;
    }
    if (trimmedNew.toLowerCase() === editingItem.oldValue.toLowerCase()) {
      setEditingItem(null);
      return;
    }

    if (editingItem.type === 'expense') {
      if (settings.expenseCategories.some((c) => c.toLowerCase() === trimmedNew.toLowerCase())) {
        setNoticeModal({
          isOpen: true,
          title: 'Kategori Sudah Ada',
          message: `Kategori pengeluaran dengan nama "${trimmedNew}" sudah ada!`,
          type: 'warning',
        });
        return;
      }
      const isSystemSalary = editingItem.oldValue.toLowerCase().trim() === getSystemSalaryCategory(settings).toLowerCase().trim();
      const updated: BimbelSettings = {
        ...settings,
        expenseCategories: settings.expenseCategories.map((c) =>
          c === editingItem.oldValue ? trimmedNew : c
        ),
        ...(isSystemSalary ? { systemSalaryCategory: trimmedNew } : {}),
      };
      onSaveSettings(updated);

      // Cascade update existing expense records in database
      if (onRenameExpenseCategory) {
        onRenameExpenseCategory(editingItem.oldValue, trimmedNew);
      }
    } else if (editingItem.type === 'income') {
      if ((settings.incomeCategories || []).some((c) => c.toLowerCase() === trimmedNew.toLowerCase())) {
        setNoticeModal({
          isOpen: true,
          title: 'Kategori Sudah Ada',
          message: `Kategori penerimaan dengan nama "${trimmedNew}" sudah ada!`,
          type: 'warning',
        });
        return;
      }
      const isSystemSpp = editingItem.oldValue.toLowerCase().trim() === getSystemSppCategory(settings).toLowerCase().trim();
      const updated: BimbelSettings = {
        ...settings,
        incomeCategories: (settings.incomeCategories || []).map((c) =>
          c === editingItem.oldValue ? trimmedNew : c
        ),
        ...(isSystemSpp ? { systemSppCategory: trimmedNew } : {}),
      };
      onSaveSettings(updated);

      // Cascade update existing income records in database
      if (onRenameIncomeCategory) {
        onRenameIncomeCategory(editingItem.oldValue, trimmedNew);
      }
    } else if (editingItem.type === 'payment') {
      if ((settings.paymentMethods || []).some((m) => m.toLowerCase() === trimmedNew.toLowerCase())) {
        setNoticeModal({
          isOpen: true,
          title: 'Metode Pembayaran Sudah Ada',
          message: `Metode pembayaran dengan nama "${trimmedNew}" sudah ada!`,
          type: 'warning',
        });
        return;
      }
      const updated: BimbelSettings = {
        ...settings,
        paymentMethods: (settings.paymentMethods || []).map((m) =>
          m === editingItem.oldValue ? trimmedNew : m
        ),
      };
      onSaveSettings(updated);
    }

    setEditingItem(null);
  };

  // Profile Form Save
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(profileForm);
    setProfileSavedToast(true);
    setTimeout(() => setProfileSavedToast(false), 3000);
  };

  // Backup Export
  const handleExportData = () => {
    const fullBackup = {
      exportDate: new Date().toISOString(),
      version: '2.0.0',
      appName: 'Bimbel Sigma OMS',
      data: {
        students,
        attendance,
        incomes,
        expenses,
        users: sortUsersByRole(users),
        settings,
      },
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `backup_bimbel_sigma_${new Date().toISOString().split('T')[0]}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Backup Import
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!json.data || !Array.isArray(json.data.students)) {
          setNoticeModal({
            isOpen: true,
            title: 'Format File Tidak Valid',
            message: 'Format file cadangan tidak valid atau rusak! Pastikan file adalah format JSON cadangan Bimbel Sigma.',
            type: 'error',
          });
          return;
        }

        setDeleteDialog({
          isOpen: true,
          title: 'Impor & Timpa Seluruh Data',
          message: `Impor data cadangan (${json.data.students?.length || 0} Siswa, ${json.data.attendance?.length || 0} Presensi, ${json.data.users?.length || 0} Akun)? Seluruh data saat ini akan digantikan dengan data cadangan ini.`,
          itemName: file.name,
          onConfirm: () => {
            onImportFullData({
              students: json.data.students || [],
              attendance: json.data.attendance || [],
              incomes: json.data.incomes || [],
              expenses: json.data.expenses || [],
              users: json.data.users || [],
              settings: json.data.settings || settings,
            });
            setNoticeModal({
              isOpen: true,
              title: 'Impor Berhasil',
              message: 'Seluruh data aplikasi berhasil diimpor dan diperbarui!',
              type: 'info',
            });
          },
        });
      } catch (err) {
        setNoticeModal({
          isOpen: true,
          title: 'Gagal Membaca File',
          message: 'Gagal membaca file JSON cadangan: ' + String(err),
          type: 'error',
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Appearance Submit Handlers
  const handleSubmitAppearance = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(appearanceForm);
    setAppearanceSavedToast(true);
    setTimeout(() => setAppearanceSavedToast(false), 3000);
  };

  const handleResetAppearanceDefaults = () => {
    setDeleteDialog({
      isOpen: true,
      title: 'Reset Tampilan & Desain',
      message: 'Kembalikan teks dashboard, sidebar, navbar, dan desain ke format awal standar pabrik?',
      itemName: 'Pengaturan Tampilan Bawaan',
      onConfirm: () => {
        const resetAppearance: BimbelSettings = {
          ...settings,
          logoSymbol: 'Σ',
          appVersionBadge: 'v2.6 PRO',
          sidebarFooterTitle: 'BIMBEL SIGMA',
          sidebarFooterTagline: '“Belajar Sampai Paham”',
          sidebarFooterNote: 'Data tersimpan aman di LocalStorage browser',
          accentColor: 'indigo',
          ownerDashboardBadge: 'Executive Dashboard (Owner Access)',
          ownerDashboardTitle: '',
          ownerDashboardMessage:
            'Pantau metrik finansial, absensi digital real-time, dan pembukuan tahunan dalam satu pintu.',
          tutorDashboardBadge: 'Ruang Kerja Pengajar (Tutor Access)',
          tutorDashboardTitle: '',
          tutorDashboardMessage:
            'Fokus pada kualitas pembelajaran: catat absensi harian siswa, topik materi, serta evaluasi pemahaman belajar.',
          studentDashboardBadge: 'Portal Siswa & Orang Tua Bimbel Sigma',
          studentDashboardTitle: '',
          studentDashboardMessage:
            '“Belajar Sampai Paham, Bukan Sekadar Hafal”. Catat kehadiran mandiri, pantau materi tiap sesi pembelajaran, dan evaluasi hasil belajar.',
          loginWelcomeMessage: 'Sistem Manajemen & Presensi Digital Bimbel Terintegrasi',
        };
        setAppearanceForm(resetAppearance);
        onSaveSettings(resetAppearance);
        setAppearanceSavedToast(true);
        setTimeout(() => setAppearanceSavedToast(false), 3000);
      },
    });
  };

  // Handle Save WhatsApp Templates
  const handleSubmitWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedSettings: BimbelSettings = {
      ...settings,
      whatsappTemplates: {
        ...whatsappForm,
      },
    };
    onSaveSettings(updatedSettings);
    setWhatsappSavedToast(true);
    setTimeout(() => setWhatsappSavedToast(false), 3500);
  };

  // Handle Reset WhatsApp Templates
  const handleResetWhatsAppDefaults = () => {
    setDeleteDialog({
      isOpen: true,
      title: 'Reset Template WhatsApp',
      message: 'Kembalikan semua template pesan WhatsApp ke format standar bawaan sistem?',
      itemName: 'Template WhatsApp Bawaan',
      onConfirm: () => {
        const defaultTemplates = { ...DEFAULT_WA_TEMPLATES };
        setWhatsappForm(defaultTemplates);
        onSaveSettings({
          ...settings,
          whatsappTemplates: defaultTemplates,
        });
        setWhatsappSavedToast(true);
        setTimeout(() => setWhatsappSavedToast(false), 3500);
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-indigo-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-amber-400/20 text-amber-300 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider border border-amber-400/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Khusus Hak Akses Owner (Super Admin)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-heading tracking-tight">
            Pusat Pengaturan Sistem & Kelola Akun
          </h2>
          <p className="text-xs sm:text-sm text-indigo-200 mt-1 max-w-2xl">
            Kelola akun pengguna (Tutor, Siswa, Admin), kustomisasi kategori pengeluaran & kas masuk, profil lembaga, serta pencadangan database.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {onSyncTutorNames && (
            <button
              onClick={onSyncTutorNames}
              className="px-3.5 py-2.5 bg-white/15 hover:bg-white/25 active:scale-95 text-white border border-white/20 font-bold rounded-2xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              title="Sinkronkan nama tutor dari database akun ke seluruh riwayat presensi & data siswa"
            >
              <RefreshCw className="w-3.5 h-3.5 text-teal-300" />
              <span>Sinkronkan Nama Tutor</span>
            </button>
          )}
          <button
            onClick={() => onOpenUserModal()}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold rounded-2xl text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Akun Baru</span>
          </button>
        </div>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab('accounts')}
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeSubTab === 'accounts'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Kelola Akun Pengguna ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('salary-rates')}
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeSubTab === 'salary-rates'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Calculator className="w-4 h-4 text-amber-500" />
          <span>Tarif & Rumus Gaji Tutor</span>
        </button>

        <button
          onClick={() => setActiveSubTab('financial-categories')}
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeSubTab === 'financial-categories'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Wallet className="w-4 h-4 text-emerald-500" />
          <span>Kategori Keuangan & Pembayaran</span>
        </button>

        <button
          onClick={() => setActiveSubTab('profile')}
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeSubTab === 'profile'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building className="w-4 h-4 text-amber-500" />
          <span>Profil Lembaga & Kwitansi</span>
        </button>

        <button
          onClick={() => setActiveSubTab('whatsapp-templates')}
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeSubTab === 'whatsapp-templates'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <MessageCircle className="w-4 h-4 text-emerald-500" />
          <span>📱 Template Pesan WhatsApp</span>
        </button>

        <button
          onClick={() => setActiveSubTab('appearance')}
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeSubTab === 'appearance'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Palette className="w-4 h-4 text-purple-500" />
          <span>🎨 Tampilan & Desain Teks</span>
        </button>

        <button
          onClick={() => setActiveSubTab('backup')}
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeSubTab === 'backup'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Download className="w-4 h-4 text-indigo-500" />
          <span>Backup & Reset Data</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* SUB-TAB 1: KELOLA AKUN PENGGUNA */}
      {/* ========================================================= */}
      {activeSubTab === 'accounts' && (
        <div className="space-y-4">
          {/* Transparency & Password Sync Notice */}
          <div className="p-4 bg-gradient-to-r from-amber-50 to-indigo-50 border border-amber-200/70 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-700">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-slate-900">
                  Sinkronisasi Password Real-Time & Transparansi Owner
                </p>
                <p className="text-[11px] text-slate-600">
                  Ketika siswa atau tutor mengganti kata sandi di portal mereka, password baru otomatis terupdate dan dapat dilihat langsung oleh Owner di tabel bawah ini.
                </p>
              </div>
            </div>
            <span className="shrink-0 px-2.5 py-1 bg-white text-indigo-700 font-extrabold rounded-lg border border-indigo-200 text-[10px] uppercase tracking-wider">
              Privilese Super Admin
            </span>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Total Akun</p>
                <p className="text-xl font-extrabold text-slate-800">{users.length}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Akun Owner</p>
                <p className="text-xl font-extrabold text-amber-600">
                  {users.filter((u) => u.role === 'owner').length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Akun Tutor</p>
                <p className="text-xl font-extrabold text-teal-600">
                  {users.filter((u) => u.role === 'tutor').length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                <GraduationCap className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Akun Siswa/Wali</p>
                <p className="text-xl font-extrabold text-indigo-600">
                  {users.filter((u) => u.role === 'siswa').length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={accountSearch}
                onChange={(e) => setAccountSearch(e.target.value)}
                placeholder="Cari nama, @username, kode siswa..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3" />
                Role:
              </span>
              {(['all', 'owner', 'tutor', 'siswa'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setAccountFilter(r)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    accountFilter === r
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {r === 'all' ? 'Semua' : r === 'owner' ? 'Owner' : r === 'tutor' ? 'Tutor' : 'Siswa'}
                </button>
              ))}
            </div>
          </div>

          {/* Accounts List Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Pengguna</th>
                    <th className="py-3 px-4">Peran (Role)</th>
                    <th className="py-3 px-4">Username & Login</th>
                    <th className="py-3 px-4">Kata Sandi</th>
                    <th className="py-3 px-4">Kontak / Keterangan</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredUsers.map((acc) => {
                    const isSelf = acc.id === currentUserId;
                    const isPassVisible = visiblePasswords[acc.id] || false;
                    const isCopied = copiedId === acc.id;

                    return (
                      <tr key={acc.id} className="hover:bg-slate-50/80 transition">
                        {/* User Profile */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <UserAvatar
                              avatar={acc.avatar}
                              name={acc.name}
                              role={acc.role}
                              size="md"
                              rounded="rounded-xl"
                            />
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                                {acc.name}
                                {isSelf && (
                                  <span className="text-[9px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-extrabold">
                                    Anda
                                  </span>
                                )}
                              </p>
                              {acc.code && (
                                <span className="inline-block mt-0.5 text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded">
                                  ID: {acc.code}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Role Badge */}
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider ${
                              acc.role === 'owner'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : acc.role === 'tutor'
                                ? 'bg-teal-100 text-teal-900 border border-teal-300'
                                : 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                            }`}
                          >
                            {acc.role === 'owner' && <ShieldCheck className="w-3 h-3 text-amber-600" />}
                            {acc.role === 'tutor' && <GraduationCap className="w-3 h-3 text-teal-600" />}
                            {acc.role === 'siswa' && <Sparkles className="w-3 h-3 text-indigo-600" />}
                            {acc.role === 'owner' ? 'Owner' : acc.role === 'tutor' ? 'Tutor' : 'Siswa'}
                          </span>
                        </td>

                        {/* Username */}
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">
                          <span className="text-slate-400">@</span>
                          {acc.username}
                        </td>

                        {/* Password with peek */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg w-fit border border-slate-200">
                            <span className="font-mono text-xs font-bold text-slate-700 select-all">
                              {isPassVisible ? acc.password || 'sigma123' : '••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleShowPassword(acc.id)}
                              className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
                              title="Tampilkan / Sembunyikan"
                            >
                              {isPassVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopyCredentials(acc)}
                              className="text-slate-400 hover:text-indigo-600 cursor-pointer p-0.5"
                              title="Salin Data Login"
                            >
                              {isCopied ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Contact & Specialty */}
                        <td className="py-3 px-4 text-slate-600">
                          <p className="text-xs truncate max-w-[200px]">{acc.specialty || '-'}</p>
                          <p className="text-[11px] text-slate-400">{acc.phone || acc.email || '-'}</p>
                        </td>

                        {/* Status Switch */}
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            disabled={isSelf}
                            onClick={() => {
                              onSaveUser({
                                ...acc,
                                isActive: acc.isActive === false ? true : false,
                              });
                            }}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold transition cursor-pointer ${
                              acc.isActive !== false
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                            } ${isSelf ? 'opacity-60 cursor-not-allowed' : ''}`}
                          >
                            {acc.isActive !== false ? '● Aktif' : '○ Non-Aktif'}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onOpenUserModal(acc)}
                              className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                              title="Edit Akun"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            {!isSelf ? (
                              <button
                                onClick={() => onDeleteUser(acc.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Hapus Akun Pengguna"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            ) : (
                              <span
                                className="p-1.5 text-slate-300 cursor-not-allowed inline-flex items-center"
                                title="Akun login Anda saat ini (tidak dapat menghapus akun sendiri)"
                              >
                                <Lock className="w-4 h-4" />
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Tidak ada akun pengguna yang sesuai dengan filter pencarian.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB: TARIF & RUMUS GAJI TUTOR (OWNER CONFIGURATION) */}
      {/* ========================================================= */}
      {activeSubTab === 'salary-rates' && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 font-heading">
                      Konfigurasi Skema & Rumus Gaji Pengajar (Tutor)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Atur persentase bagi hasil SPP atau tarif flat per sesi, uang transport, dan batas honor minimum.
                    </p>
                  </div>
                </div>
              </div>

              {salarySavedToast && (
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-3.5 py-2 rounded-xl animate-in fade-in shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Pengaturan Gaji Disimpan!
                </span>
              )}
            </div>

            <form onSubmit={handleSaveSalarySettings} className="space-y-6">
              {/* 1. Mode Perhitungan Utama */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  1. Mode Perhitungan Utama Penggajian
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    onClick={() => setSalaryForm({ ...salaryForm, salaryCalculationMode: 'percentage' })}
                    className={`p-4 rounded-2xl border-2 transition cursor-pointer flex items-start gap-3 ${
                      salaryForm.salaryCalculationMode === 'percentage'
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="salaryMode"
                      checked={salaryForm.salaryCalculationMode === 'percentage'}
                      onChange={() => setSalaryForm({ ...salaryForm, salaryCalculationMode: 'percentage' })}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-bold text-xs">Model Bagi Hasil Persentase SPP (%) (Direkomendasikan)</p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Honor tutor dihitung otomatis dari sekian persen SPP per sesi yang dibayarkan siswa yang hadir. Sangat adil & proporsional terhadap omzet bimbel.
                      </p>
                    </div>
                  </label>

                  <label
                    onClick={() => setSalaryForm({ ...salaryForm, salaryCalculationMode: 'flat' })}
                    className={`p-4 rounded-2xl border-2 transition cursor-pointer flex items-start gap-3 ${
                      salaryForm.salaryCalculationMode === 'flat'
                        ? 'border-amber-600 bg-amber-50/70 text-amber-950'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="salaryMode"
                      checked={salaryForm.salaryCalculationMode === 'flat'}
                      onChange={() => setSalaryForm({ ...salaryForm, salaryCalculationMode: 'flat' })}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-bold text-xs">Model Tarif Flat Nominal Tetap (Rp)</p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Honor tutor bernilai tetap per pertemuan (contoh: Rp 65.000/sesi privat, Rp 80.000/sesi grup) tanpa memperhitungkan fluktuasi SPP per anak.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* 2. Pengaturan Persentase Bagi Hasil (Jika Mode Percentage Aktif) */}
              {salaryForm.salaryCalculationMode === 'percentage' && (
                <div className="p-5 bg-indigo-50/40 border border-indigo-200/80 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                      2. Pengaturan Persentase Bagi Hasil SPP Siswa
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-2xs">
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Kelas Privat (1 Siswa) *
                      </label>
                      <p className="text-[11px] text-slate-500 mb-2">Persentase honor untuk tutor</p>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={salaryForm.privatSalaryPercentage ?? 60}
                          onChange={(e) =>
                            setSalaryForm({
                              ...salaryForm,
                              privatSalaryPercentage: Number(e.target.value),
                            })
                          }
                          required
                          className="w-full pr-8 pl-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-black text-indigo-700 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">
                          %
                        </span>
                      </div>
                      <p className="text-[10px] text-indigo-600 font-bold mt-1.5">
                        Bimbel menerima: {100 - (salaryForm.privatSalaryPercentage ?? 60)}%
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-2xs">
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Kelas Grup / Reguler *
                      </label>
                      <p className="text-[11px] text-slate-500 mb-2">Persentase honor untuk tutor</p>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={salaryForm.groupSalaryPercentage ?? 40}
                          onChange={(e) =>
                            setSalaryForm({
                              ...salaryForm,
                              groupSalaryPercentage: Number(e.target.value),
                            })
                          }
                          required
                          className="w-full pr-8 pl-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-black text-teal-700 focus:bg-white focus:ring-2 focus:ring-teal-500"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">
                          %
                        </span>
                      </div>
                      <p className="text-[10px] text-teal-600 font-bold mt-1.5">
                        Bimbel menerima: {100 - (salaryForm.groupSalaryPercentage ?? 40)}%
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-2xs">
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Batas Minimal Honor (Safety Net)
                      </label>
                      <p className="text-[11px] text-slate-500 mb-2">Min. per sesi jika SPP rendah</p>
                      <div className="space-y-2">
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                            Min Privat:
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={salaryForm.minPrivatSessionRate ?? 50000}
                            onChange={(e) =>
                              setSalaryForm({
                                ...salaryForm,
                                minPrivatSessionRate: Number(e.target.value),
                              })
                            }
                            className="w-full pl-20 pr-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                          />
                        </div>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                            Min Grup:
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={salaryForm.minGroupSessionRate ?? 60000}
                            onChange={(e) =>
                              setSalaryForm({
                                ...salaryForm,
                                minGroupSessionRate: Number(e.target.value),
                              })
                            }
                            className="w-full pl-20 pr-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Pengaturan Tarif Flat (Jika Mode Flat Aktif) */}
              {salaryForm.salaryCalculationMode === 'flat' && (
                <div className="p-5 bg-amber-50/40 border border-amber-200/80 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                      2. Pengaturan Tarif Flat per Sesi Mengajar (Rp)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-amber-100">
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Tarif Sesi Privat (Rp / Pertemuan) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={salaryForm.flatPrivatSessionRate ?? 65000}
                        onChange={(e) =>
                          setSalaryForm({
                            ...salaryForm,
                            flatPrivatSessionRate: Number(e.target.value),
                          })
                        }
                        required
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-black text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-amber-100">
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Tarif Sesi Grup (Rp / Pertemuan) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={salaryForm.flatGroupSessionRate ?? 80000}
                        onChange={(e) =>
                          setSalaryForm({
                            ...salaryForm,
                            flatGroupSessionRate: Number(e.target.value),
                          })
                        }
                        required
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-black text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 4. Insentif Tambahan: Uang Transport & Bonus Evaluasi */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  3. Komponen Tambahan & Uang Kehadiran (Transport)
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Uang Transport per Hari Masuk Mengajar (Rp)
                    </label>
                    <p className="text-[11px] text-slate-500 mb-2">
                      Dikalikan dengan jumlah hari unik tutor hadir mengajar di bimbel
                    </p>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={salaryForm.transportAllowancePerDay ?? 15000}
                      onChange={(e) =>
                        setSalaryForm({
                          ...salaryForm,
                          transportAllowancePerDay: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Contoh: 12 hari mengajar = 12 × Rp {(salaryForm.transportAllowancePerDay ?? 15000).toLocaleString('id-ID')} = Rp {(12 * (salaryForm.transportAllowancePerDay ?? 15000)).toLocaleString('id-ID')}
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Bonus Pengisian Topik & Evaluasi Belajar (Rp / Sesi)
                    </label>
                    <p className="text-[11px] text-slate-500 mb-2">
                      Insentif ekstra jika tutor selalu mencatat materi & evaluasi di presensi
                    </p>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={salaryForm.evaluationBonusPerSession ?? 0}
                      onChange={(e) =>
                        setSalaryForm({
                          ...salaryForm,
                          evaluationBonusPerSession: Number(e.target.value),
                        })
                      }
                      placeholder="0 (Opsional)"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* LIVE SIMULATOR / INTERACTIVE PREVIEW */}
              <div className="p-5 bg-gradient-to-br from-indigo-950 to-slate-900 text-white rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                      Simulasi Interaktif Perhitungan Honor & Margin Bimbel
                    </span>
                  </div>
                  <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-slate-300">
                    Live Simulator
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Simulasi Privat */}
                  <div className="bg-white/10 p-4 rounded-xl border border-white/10 space-y-2">
                    <p className="text-xs font-bold text-indigo-300">Simulasi: 1 Sesi Kelas Privat</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-300">Tarif SPP Siswa:</span>
                      <input
                        type="number"
                        value={simPrivatPrice}
                        onChange={(e) => setSimPrivatPrice(Number(e.target.value))}
                        className="w-28 px-2 py-1 bg-slate-900 text-white border border-indigo-400/40 rounded text-xs font-bold"
                      />
                    </div>
                    <div className="pt-2 border-t border-white/10 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-300">
                          Honor Tutor ({salaryForm.privatSalaryPercentage}%):
                        </span>
                        <span className="font-bold text-amber-300">
                          Rp{' '}
                          {Math.round(
                            (simPrivatPrice * (salaryForm.privatSalaryPercentage ?? 60)) / 100
                          ).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">
                          Bimbel ({100 - (salaryForm.privatSalaryPercentage ?? 60)}%):
                        </span>
                        <span className="font-bold text-emerald-300">
                          Rp{' '}
                          {Math.round(
                            (simPrivatPrice * (100 - (salaryForm.privatSalaryPercentage ?? 60))) / 100
                          ).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Simulasi Grup */}
                  <div className="bg-white/10 p-4 rounded-xl border border-white/10 space-y-2">
                    <p className="text-xs font-bold text-teal-300">Simulasi: 1 Sesi Kelas Grup</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-300">SPP per Anak:</span>
                      <input
                        type="number"
                        value={simGroupPricePerStudent}
                        onChange={(e) => setSimGroupPricePerStudent(Number(e.target.value))}
                        className="w-24 px-2 py-1 bg-slate-900 text-white border border-teal-400/40 rounded text-xs font-bold"
                      />
                      <span className="text-[11px] text-slate-300">× Siswa:</span>
                      <input
                        type="number"
                        value={simGroupStudentsCount}
                        onChange={(e) => setSimGroupStudentsCount(Number(e.target.value))}
                        className="w-14 px-2 py-1 bg-slate-900 text-white border border-teal-400/40 rounded text-xs font-bold"
                      />
                    </div>
                    <div className="pt-2 border-t border-white/10 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-300">
                          Total SPP Masuk ({simGroupStudentsCount} Siswa):
                        </span>
                        <span className="font-bold text-white">
                          Rp {(simGroupPricePerStudent * simGroupStudentsCount).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">
                          Honor Tutor ({salaryForm.groupSalaryPercentage}%):
                        </span>
                        <span className="font-bold text-amber-300">
                          Rp{' '}
                          {Math.round(
                            (simGroupPricePerStudent *
                              simGroupStudentsCount *
                              (salaryForm.groupSalaryPercentage ?? 40)) /
                              100
                          ).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">
                          Bimbel ({100 - (salaryForm.groupSalaryPercentage ?? 40)}%):
                        </span>
                        <span className="font-bold text-emerald-300">
                          Rp{' '}
                          {Math.round(
                            (simGroupPricePerStudent *
                              simGroupStudentsCount *
                              (100 - (salaryForm.groupSalaryPercentage ?? 40))) /
                              100
                          ).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Save Button */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() =>
                    setSalaryForm({
                      ...settings,
                      salaryCalculationMode: 'percentage',
                      privatSalaryPercentage: 60,
                      groupSalaryPercentage: 40,
                      minPrivatSessionRate: 50000,
                      minGroupSessionRate: 60000,
                      transportAllowancePerDay: 15000,
                      evaluationBonusPerSession: 0,
                    })
                  }
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Reset Standar (60% / 40%)
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-amber-600/20 flex items-center gap-2 transition cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Tarif & Rumus Gaji</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 2: KATEGORI KEUANGAN & METODE PEMBAYARAN TERPADU  */}
      {/* ========================================================= */}
      {activeSubTab === 'financial-categories' && (
        <div className="space-y-6">
          {/* Header Description & Summary Stats */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                  <Wallet className="w-4 h-4" />
                </span>
                <h3 className="text-base font-bold text-slate-900 font-heading">
                  Master Kategori Keuangan & Metode Pembayaran Terpadu
                </h3>
              </div>
              <p className="text-xs text-slate-500 max-w-2xl">
                Kelola seluruh opsi penerimaan kas masuk, pos beban pengeluaran, dan kanal pembayaran dalam satu halaman terpusat. Anda dapat menambah, mengedit/mengubah nama, dan menghapus opsi pilihan.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                <span className="block text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Kas Masuk</span>
                <span className="text-xs font-black text-emerald-800">{(settings.incomeCategories || []).length} Kategori</span>
              </div>
              <div className="px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-xl text-center">
                <span className="block text-[10px] font-bold text-rose-600 uppercase tracking-wider">Pengeluaran</span>
                <span className="text-xs font-black text-rose-800">{settings.expenseCategories.length} Kategori</span>
              </div>
              <div className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-xl text-center">
                <span className="block text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Metode Bayar</span>
                <span className="text-xs font-black text-indigo-800">{settings.paymentMethods.length} Opsi</span>
              </div>
            </div>
          </div>

          {/* Modal / Inline Edit Dialog if editing */}
          {editingItem && (
            <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-200/70 text-amber-900 rounded-xl">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                    Ubah Nama {editingItem.type === 'income' ? 'Kategori Kas Masuk' : editingItem.type === 'expense' ? 'Kategori Pengeluaran' : 'Metode Pembayaran'}
                  </h4>
                  <p className="text-[11px] text-amber-800">
                    Mengganti: <span className="font-bold underline">{editingItem.oldValue}</span>
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveEditedItem} className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  value={editingItem.newValue}
                  onChange={(e) => setEditingItem({ ...editingItem, newValue: e.target.value })}
                  className="px-3 py-2 bg-white border border-amber-400 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 w-full sm:w-64"
                  placeholder="Ketik nama baru..."
                  required
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-1 transition shrink-0 cursor-pointer shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  Simpan
                </button>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-amber-200/50 rounded-xl transition cursor-pointer"
                  title="Batal"
                >
                  <X className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* Smart Category Harmonizer Banner */}
          {(() => {
            const activeSalaryCat = getSystemSalaryCategory(settings);
            const activeSppCat = getSystemSppCategory(settings);

            const mismatchedExpenseCount = expenses.filter((e) => {
              const cLow = (e.category || '').toLowerCase();
              const isSalary = cLow.includes('gaji') || cLow.includes('honor') || cLow.includes('tutor') || cLow.includes('pengajar');
              return isSalary && e.category !== activeSalaryCat;
            }).length;

            const mismatchedIncomeCount = incomes.filter((i) => {
              const cLow = (i.category || '').toLowerCase();
              const isSpp = cLow.includes('spp') || cLow.includes('pembayaran') || cLow.includes('iuran');
              return isSpp && i.category !== activeSppCat;
            }).length;

            const totalMismatched = mismatchedExpenseCount + mismatchedIncomeCount;
            if (totalMismatched === 0) return null;

            return (
              <div className="p-4 bg-linear-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-xs shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-amber-950 flex items-center gap-1.5 uppercase tracking-wider">
                      Sinkronisasi Transaksi Kategori Lama Terdeteksi
                    </h4>
                    <p className="text-xs text-amber-800 mt-0.5">
                      Ditemukan <strong>{totalMismatched} transaksi buku kas</strong> yang masih memakai label kategori lama. Klik tombol di samping untuk menyelaraskan ke master kategori aktif saat ini (Honor: <strong className="underline text-amber-950">"{activeSalaryCat}"</strong>, SPP: <strong className="underline text-amber-950">"{activeSppCat}"</strong>).
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onHarmonizeCategories?.()}
                  className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition shrink-0 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Selaraskan {totalMismatched} Data Sekarang</span>
                </button>
              </div>
            );
          })()}

          {/* 3-Column Unified Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* COLUMN 1: KATEGORI KAS MASUK (PEMASUKAN) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                      <ArrowDownRight className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider font-heading">
                        1. Kas Masuk / Pemasukan
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Sumber penerimaan dana bimbel
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">
                    {(settings.incomeCategories || []).length}
                  </span>
                </div>

                {/* Form Add Income Category */}
                <form onSubmit={handleAddIncomeCategory} className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newIncomeCategory}
                    onChange={(e) => setNewIncomeCategory(e.target.value)}
                    placeholder="Tambah pemasukan baru..."
                    required
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1 transition cursor-pointer shrink-0"
                    title="Tambah Kategori Masuk"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah</span>
                  </button>
                </form>

                {/* List Income Categories */}
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {(settings.incomeCategories || []).map((cat, idx) => {
                    const count = incomes.filter((i) => i.category === cat).length;
                    const isSystem = isSystemIncomeCategory(cat, settings) || cat.toLowerCase().trim() === getSystemSppCategory(settings).toLowerCase().trim();

                    return (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition group ${
                          isSystem
                            ? 'bg-emerald-50/60 border-emerald-200/90 hover:bg-emerald-50'
                            : 'bg-slate-50 hover:bg-emerald-50/40 border-slate-200/80'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className={`text-xs font-bold truncate ${isSystem ? 'text-emerald-950' : 'text-slate-900'}`}>{cat}</p>
                            {isSystem && (
                              <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-300/80 px-1.5 py-0.5 rounded font-bold flex items-center gap-1 shrink-0">
                                <Lock className="w-2.5 h-2.5 text-emerald-700" />
                                Sistem (Wajib)
                              </span>
                            )}
                          </div>
                          <p className={`text-[10px] mt-0.5 ${isSystem ? 'text-emerald-700 font-medium' : 'text-slate-400'}`}>
                            {isSystem ? `Acuan otomatis SPP siswa • ${count} transaksi` : `${count} transaksi kas tercatat`}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              setEditingItem({
                                type: 'income',
                                oldValue: cat,
                                newValue: cat,
                              })
                            }
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-white rounded-lg transition cursor-pointer"
                            title="Ubah Nama Kategori"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {isSystem ? (
                            <button
                              type="button"
                              disabled
                              className="p-1.5 text-slate-300 cursor-not-allowed rounded-lg"
                              title="Kategori sistem wajib tidak dapat dihapus. Anda dapat mengubah namanya via tombol Edit."
                            >
                              <Lock className="w-3.5 h-3.5 text-slate-400" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleDeleteIncomeCategory(cat)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition cursor-pointer"
                              title="Hapus Kategori"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <p className="text-[10px] text-slate-500 leading-tight">
                  🔒 Kategori <span className="font-bold text-emerald-700">Sistem (Wajib)</span> menjadi acuan tunggal modul kasir SPP. Nama dapat diedit sesuai kebutuhan lembaga.
                </p>
              </div>
            </div>

            {/* COLUMN 2: KATEGORI PENGELUARAN (BEBAN) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                      <ArrowUpRight className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider font-heading">
                        2. Kategori Pengeluaran
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Pos beban operasional &amp; biaya bimbel
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-bold rounded-full">
                    {settings.expenseCategories.length}
                  </span>
                </div>

                {/* Form Add Expense Category */}
                <form onSubmit={handleAddExpenseCategory} className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newExpenseCategory}
                    onChange={(e) => setNewExpenseCategory(e.target.value)}
                    placeholder="Tambah pengeluaran baru..."
                    required
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 transition"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1 transition cursor-pointer shrink-0"
                    title="Tambah Kategori Pengeluaran"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah</span>
                  </button>
                </form>

                {/* List Expense Categories */}
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {settings.expenseCategories.map((cat, idx) => {
                    const count = expenses.filter((e) => e.category === cat).length;
                    const isSystem = isSystemExpenseCategory(cat, settings) || cat.toLowerCase().trim() === getSystemSalaryCategory(settings).toLowerCase().trim();

                    return (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition group ${
                          isSystem
                            ? 'bg-rose-50/60 border-rose-200/90 hover:bg-rose-50'
                            : 'bg-slate-50 hover:bg-rose-50/40 border-slate-200/80'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className={`text-xs font-bold truncate ${isSystem ? 'text-rose-950' : 'text-slate-900'}`}>{cat}</p>
                            {isSystem && (
                              <span className="text-[9px] bg-rose-100 text-rose-800 border border-rose-300/80 px-1.5 py-0.5 rounded font-bold flex items-center gap-1 shrink-0">
                                <Lock className="w-2.5 h-2.5 text-rose-700" />
                                Sistem (Wajib)
                              </span>
                            )}
                          </div>
                          <p className={`text-[10px] mt-0.5 ${isSystem ? 'text-rose-700 font-medium' : 'text-slate-400'}`}>
                            {isSystem ? `Acuan otomatis honor & gaji tutor • ${count} transaksi` : `${count} transaksi beban tercatat`}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              setEditingItem({
                                type: 'expense',
                                oldValue: cat,
                                newValue: cat,
                              })
                            }
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-white rounded-lg transition cursor-pointer"
                            title="Ubah Nama Kategori"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {isSystem ? (
                            <button
                              type="button"
                              disabled
                              className="p-1.5 text-slate-300 cursor-not-allowed rounded-lg"
                              title="Kategori sistem wajib tidak dapat dihapus. Anda dapat mengubah namanya via tombol Edit."
                            >
                              <Lock className="w-3.5 h-3.5 text-slate-400" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleDeleteExpenseCategory(cat)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition cursor-pointer"
                              title="Hapus Kategori"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <p className="text-[10px] text-slate-500 leading-tight">
                  🔒 Kategori <span className="font-bold text-rose-700">Sistem (Wajib)</span> menjadi acuan modul penggajian tutor &amp; P&amp;L. Nama dapat diedit sesuai kebutuhan.
                </p>
              </div>
            </div>

            {/* COLUMN 3: METODE PEMBAYARAN */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider font-heading">
                        3. Metode Pembayaran
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Pilihan kanal transaksi (Cash, Bank, QRIS)
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full">
                    {settings.paymentMethods.length}
                  </span>
                </div>

                {/* Form Add Payment Method */}
                <form onSubmit={handleAddPaymentMethod} className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newPaymentMethod}
                    onChange={(e) => setNewPaymentMethod(e.target.value)}
                    placeholder="Tambah cara bayar..."
                    required
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1 transition cursor-pointer shrink-0"
                    title="Tambah Metode Pembayaran"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah</span>
                  </button>
                </form>

                {/* List Payment Methods */}
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {settings.paymentMethods.map((method, idx) => {
                    const countIncome = incomes.filter((i) => i.paymentMethod === method).length;
                    const countExpense = expenses.filter((e) => e.paymentMethod === method).length;
                    const totalUsage = countIncome + countExpense;

                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-indigo-50/50 rounded-xl border border-slate-200/80 transition group"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="text-xs font-bold text-slate-900 truncate">{method}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {totalUsage} transaksi ({countIncome} Masuk, {countExpense} Keluar)
                          </p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() =>
                              setEditingItem({
                                type: 'payment',
                                oldValue: method,
                                newValue: method,
                              })
                            }
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-white rounded-lg transition cursor-pointer"
                            title="Ubah Nama Metode"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePaymentMethod(method)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition cursor-pointer"
                            title="Hapus Metode"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <p className="text-[10px] text-slate-400 leading-tight">
                  💡 Tertera pada pilihan cara pembayaran di <span className="font-semibold text-slate-600">Kwitansi SPP</span> &amp; <span className="font-semibold text-slate-600">Pencatatan Kas</span>.
                </p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 3: PROFIL LEMBAGA & PENGATURAN UMUM */}
      {/* ========================================================= */}
      {activeSubTab === 'profile' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs max-w-3xl">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-heading">
                Identitas & Profil Operasional Bimbel
              </h3>
              <p className="text-xs text-slate-500">
                Informasi ini akan dicantumkan secara otomatis pada Kwitansi SPP, Kartu Presensi Cetak, dan Dokumen Resmi
              </p>
            </div>
            {profileSavedToast && (
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-xl animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Tersimpan!
              </span>
            )}
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Lembaga Bimbel *
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={profileForm.bimbelName}
                    onChange={(e) => setProfileForm({ ...profileForm, bimbelName: e.target.value })}
                    required
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tagline / Slogan Bimbel
                </label>
                <input
                  type="text"
                  value={profileForm.tagline}
                  onChange={(e) => setProfileForm({ ...profileForm, tagline: e.target.value })}
                  placeholder="Belajar Sampai Paham, Bukan Sekadar Hafal"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 italic"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Pemilik / Kepala Lembaga *
                </label>
                <input
                  type="text"
                  value={profileForm.ownerName}
                  onChange={(e) => setProfileForm({ ...profileForm, ownerName: e.target.value })}
                  required
                  placeholder="Contoh: Budi Santoso, S.Pd."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Jabatan Pemilik / Kepala Lembaga
                </label>
                <input
                  type="text"
                  value={profileForm.ownerTitle || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, ownerTitle: e.target.value })}
                  placeholder="Contoh: Pemilik & Kepala Lembaga"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Nama Pejabat Tambahan untuk Laporan P&L dan Kwitansi */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <p className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                Penandatangan Dokumen & Laporan P & L (Finance & Operasional)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Nama Petugas Keuangan / Bendahara (Finance)
                  </label>
                  <input
                    type="text"
                    value={profileForm.financeOfficerName || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, financeOfficerName: e.target.value })}
                    placeholder="Contoh: Sarah Amalia, S.Si."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Jabatan Petugas Keuangan (Finance)
                  </label>
                  <input
                    type="text"
                    value={profileForm.financeOfficerTitle || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, financeOfficerTitle: e.target.value })}
                    placeholder="Contoh: Bendahara / Finance & Admin"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Nama Manajer / Penanggung Jawab Operasional
                  </label>
                  <input
                    type="text"
                    value={profileForm.operationalManagerName || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, operationalManagerName: e.target.value })}
                    placeholder="Contoh: Dimas Pratama, M.Pd."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Jabatan Manajer Operasional
                  </label>
                  <input
                    type="text"
                    value={profileForm.operationalManagerTitle || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, operationalManagerTitle: e.target.value })}
                    placeholder="Contoh: Manajer Akademik & Operasional"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nomor WhatsApp Pengelola *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    required
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email Resmi Lembaga
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Kota / Wilayah Penerbitan Dokumen & Slip Gaji
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={profileForm.city || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                    placeholder="Contoh: Blora, Jakarta Selatan, Semarang"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  💡 Dicantumkan pada titimangsa tanda tangan Slip Gaji (contoh: <span className="font-semibold text-slate-600">{profileForm.city || 'Blora'}, [Tanggal]</span>)
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Rekening Pembayaran Default (Kwitansi SPP)
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={profileForm.bankInfo}
                    onChange={(e) => setProfileForm({ ...profileForm, bankInfo: e.target.value })}
                    placeholder="BCA: 8830-1234-56 a.n Bimbel Sigma"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Alamat Lengkap Kantor / Cabang
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <textarea
                  rows={2}
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  placeholder="Contoh: Karang Muso 06/02 Bicak, Todanan, Blora, Jawa Tengah"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Simpan Profil Lembaga
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB: TEMPLATE PESAN WHATSAPP (KUSTOMISASI PESAN WA)   */}
      {/* ========================================================= */}
      {activeSubTab === 'whatsapp-templates' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {whatsappSavedToast && (
            <div className="p-4 bg-emerald-500 text-white rounded-2xl shadow-xl flex items-center gap-3 text-xs font-bold animate-in slide-in-from-top-3">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>Format template pesan WhatsApp berhasil disimpan! Format baru akan langsung otomatis digunakan saat mengirim tagihan dan laporan siswa ke wali murid.</span>
            </div>
          )}

          {/* Top Banner Info */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-extrabold uppercase tracking-wider">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                Kustomisasi Format Teks WhatsApp
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 font-heading">
                Pengaturan Template Pesan WhatsApp ke Wali Murid
              </h3>
              <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
                Sesuaikan kata-kata pesan WhatsApp yang dikirimkan ke orang tua siswa untuk penagihan SPP (Belum Bayar, Cicilan/Sebagian, Lunas) serta Laporan Hasil Belajar. Gunakan kode variabel seperti <code className="bg-slate-100 text-emerald-700 px-1 py-0.5 rounded font-mono text-[11px] font-bold">{'{{nama_siswa}}'}</code> atau <code className="bg-slate-100 text-emerald-700 px-1 py-0.5 rounded font-mono text-[11px] font-bold">{'{{total_tagihan}}'}</code> untuk menyisipkan data otomatis.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleResetWhatsAppDefaults}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-slate-200"
                title="Kembalikan semua template ke teks standar bawaan"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Standar Pabrik</span>
              </button>

              <button
                type="button"
                onClick={handleSubmitWhatsApp}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Template WA</span>
              </button>
            </div>
          </div>

          {/* Template Category Selector Pills */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => setActiveTemplateType('unpaid')}
              className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-2 ${
                activeTemplateType === 'unpaid'
                  ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-500 shadow-sm'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xs">
                  💳
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                  Tagihan Utama
                </span>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 font-heading">1. Tagihan Belum Bayar</p>
                <p className="text-[11px] text-slate-500">Pemberitahuan total tagihan & sesi hadir</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTemplateType('partial')}
              className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-2 ${
                activeTemplateType === 'partial'
                  ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-500 shadow-sm'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-xs">
                  ⏳
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  Cicilan / Sisa
                </span>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 font-heading">2. Bayar Sebagian</p>
                <p className="text-[11px] text-slate-500">Informasi sisa kekurangan tagihan</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTemplateType('paid')}
              className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-2 ${
                activeTemplateType === 'paid'
                  ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500 shadow-sm'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">
                  ✅
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  Kwitansi / Lunas
                </span>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 font-heading">3. Konfirmasi Lunas</p>
                <p className="text-[11px] text-slate-500">Ucapan terima kasih pembayaran lunas</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTemplateType('report')}
              className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-2 ${
                activeTemplateType === 'report'
                  ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500 shadow-sm'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                  📊
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  Laporan Siswa
                </span>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 font-heading">4. Laporan Presensi Belajar</p>
                <p className="text-[11px] text-slate-500">Pengantar evaluasi & kehadiran siswa</p>
              </div>
            </button>
          </div>

          {/* Main Editor & Live Preview Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT: Text Editor & Placeholder Helper (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-sm font-bold text-slate-900 font-heading">
                      {activeTemplateType === 'unpaid' && 'Edit Template: Tagihan Belum Bayar'}
                      {activeTemplateType === 'partial' && 'Edit Template: Tagihan Bayar Sebagian'}
                      {activeTemplateType === 'paid' && 'Edit Template: Konfirmasi Pembayaran Lunas'}
                      {activeTemplateType === 'report' && 'Edit Template: Laporan Presensi & Evaluasi'}
                    </h4>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const cur =
                        activeTemplateType === 'unpaid'
                          ? whatsappForm.unpaidBilling || DEFAULT_WA_TEMPLATES.unpaidBilling
                          : activeTemplateType === 'partial'
                          ? whatsappForm.partialBilling || DEFAULT_WA_TEMPLATES.partialBilling
                          : activeTemplateType === 'paid'
                          ? whatsappForm.paidBilling || DEFAULT_WA_TEMPLATES.paidBilling
                          : whatsappForm.studentReport || DEFAULT_WA_TEMPLATES.studentReport;
                      navigator.clipboard.writeText(cur);
                      setCopiedTemplate(true);
                      setTimeout(() => setCopiedTemplate(false), 2000);
                    }}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    {copiedTemplate ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Teks</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Textarea Area */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Format Isi Pesan:
                  </label>
                  <textarea
                    rows={12}
                    value={
                      activeTemplateType === 'unpaid'
                        ? whatsappForm.unpaidBilling || ''
                        : activeTemplateType === 'partial'
                        ? whatsappForm.partialBilling || ''
                        : activeTemplateType === 'paid'
                        ? whatsappForm.paidBilling || ''
                        : whatsappForm.studentReport || ''
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (activeTemplateType === 'unpaid') {
                        setWhatsappForm({ ...whatsappForm, unpaidBilling: val });
                      } else if (activeTemplateType === 'partial') {
                        setWhatsappForm({ ...whatsappForm, partialBilling: val });
                      } else if (activeTemplateType === 'paid') {
                        setWhatsappForm({ ...whatsappForm, paidBilling: val });
                      } else {
                        setWhatsappForm({ ...whatsappForm, studentReport: val });
                      }
                    }}
                    placeholder="Tuliskan format pesan WhatsApp di sini..."
                    className="w-full p-4 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-mono leading-relaxed text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 resize-y"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Tips WhatsApp: Gunakan <span className="font-bold text-slate-600">*teks tebal*</span> untuk huruf tebal, <span className="italic text-slate-600">_teks miring_</span> untuk cetak miring, dan <span className="font-mono text-slate-600">~coret~</span> untuk teks tercoret.
                  </p>
                </div>

                {/* Variable Placeholder Chips */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Variabel Data Otomatis (Klik untuk menyisipkan ke pesan):
                    </label>
                  </div>

                  <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
                    {AVAILABLE_WA_VARIABLES.map((v) => (
                      <button
                        key={v.key}
                        type="button"
                        onClick={() => {
                          const keyToInsert = v.key;
                          if (activeTemplateType === 'unpaid') {
                            setWhatsappForm({
                              ...whatsappForm,
                              unpaidBilling: (whatsappForm.unpaidBilling || '') + ' ' + keyToInsert,
                            });
                          } else if (activeTemplateType === 'partial') {
                            setWhatsappForm({
                              ...whatsappForm,
                              partialBilling: (whatsappForm.partialBilling || '') + ' ' + keyToInsert,
                            });
                          } else if (activeTemplateType === 'paid') {
                            setWhatsappForm({
                              ...whatsappForm,
                              paidBilling: (whatsappForm.paidBilling || '') + ' ' + keyToInsert,
                            });
                          } else {
                            setWhatsappForm({
                              ...whatsappForm,
                              studentReport: (whatsappForm.studentReport || '') + ' ' + keyToInsert,
                            });
                          }
                        }}
                        title={`Contoh isi: ${v.example} (${v.label})`}
                        className="px-2.5 py-1 bg-white hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-lg text-[11px] font-mono font-medium text-slate-700 transition cursor-pointer shadow-2xs active:scale-95 flex items-center gap-1 group"
                      >
                        <span className="text-emerald-600 font-bold group-hover:text-emerald-700">{v.key}</span>
                        <span className="text-[10px] text-slate-400 font-sans">({v.label})</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Save Bar */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-xs text-slate-500">
                    Klik tombol simpan untuk mengaktifkan template ini ke seluruh sistem.
                  </span>
                  <button
                    type="button"
                    onClick={handleSubmitWhatsApp}
                    className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan Template Ini</span>
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT: Live Smartphone WhatsApp Preview (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 text-white shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      Pratinjau Layar HP (Live Preview)
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                    WhatsApp Chat
                  </span>
                </div>

                {/* Phone Mockup Frame */}
                <div className="bg-[#0b141a] rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
                  {/* WhatsApp Top Header Bar */}
                  <div className="bg-[#1f2c34] px-4 py-3 flex items-center justify-between border-b border-[#2a3942]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                        {settings.logoSymbol || 'Σ'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-100 leading-tight">
                          {settings.bimbelName || 'BIMBEL SIGMA'}
                        </p>
                        <p className="text-[10px] text-emerald-400">online</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-xs">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* WhatsApp Chat Body */}
                  <div
                    className="p-3.5 space-y-2 min-h-[280px] max-h-[380px] overflow-y-auto text-slate-100 text-xs leading-relaxed"
                    style={{
                      backgroundColor: '#0b141a',
                      backgroundImage: 'radial-gradient(#1f2c34 1px, transparent 1px)',
                      backgroundSize: '16px 16px',
                    }}
                  >
                    {/* Timestamp Bubble */}
                    <div className="text-center my-1">
                      <span className="bg-[#182229] text-[10px] text-slate-400 px-2 py-0.5 rounded-md">
                        HARI INI
                      </span>
                    </div>

                    {/* Chat Bubble Outgoing */}
                    <div className="bg-[#005c4b] text-slate-100 rounded-2xl rounded-tr-xs p-3.5 shadow-md max-w-[95%] ml-auto space-y-1.5 whitespace-pre-wrap font-sans text-xs break-words border border-[#00705a]">
                      {(() => {
                        const sampleStudent = students[0];
                        const sampleData = {
                          nama_siswa: sampleStudent?.name || 'Naureen Zevania Putri Riansyah',
                          nis: sampleStudent?.code || 'NAUREEN',
                          kode_siswa: sampleStudent?.code || 'NAUREEN',
                          nama_ortu: sampleStudent?.parentName || 'Bapak Riansyah',
                          nomor_ortu: sampleStudent?.parentPhone || '081234567801',
                          kelas: sampleStudent?.gradeDetail || 'Kelas 2 SD',
                          tipe_kelas: sampleStudent?.classType || 'Privat',
                          jenjang: sampleStudent?.level || 'SD',
                          bulan: 'Agustus',
                          tahun: 2026,
                          jumlah_sesi: 8,
                          tarif_per_sesi: 'Rp 50.000',
                          daftar_tanggal: '03/08, 07/08, 10/08, 14/08, 17/08, 21/08, 24/08, 28/08',
                          total_tagihan: 'Rp 400.000',
                          sudah_dibayar:
                            activeTemplateType === 'partial'
                              ? 'Rp 200.000'
                              : activeTemplateType === 'paid'
                              ? 'Rp 400.000'
                              : 'Rp 0',
                          sisa_tagihan:
                            activeTemplateType === 'partial'
                              ? 'Rp 200.000'
                              : activeTemplateType === 'paid'
                              ? 'Rp 0'
                              : 'Rp 400.000',
                          status_bayar:
                            activeTemplateType === 'unpaid'
                              ? 'Belum Bayar'
                              : activeTemplateType === 'partial'
                              ? 'Sebagian'
                              : 'Lunas',
                          rekening_bimbel:
                            settings.bankInfo || 'BCA: 8830-1234-56 a.n Bimbel Sigma Mandiri',
                          nama_bimbel: settings.bimbelName || 'BIMBEL SIGMA',
                          tagline_bimbel: settings.tagline || 'Belajar Sampai Paham',
                          telepon_bimbel: settings.phone || '0812-3456-7890',
                          alamat_bimbel: settings.address || '',
                          nama_tutor: sampleStudent?.tutorName || 'Kak Sarah Amalia, S.Si.',
                        };

                        const currentRaw =
                          activeTemplateType === 'unpaid'
                            ? whatsappForm.unpaidBilling || DEFAULT_WA_TEMPLATES.unpaidBilling
                            : activeTemplateType === 'partial'
                            ? whatsappForm.partialBilling || DEFAULT_WA_TEMPLATES.partialBilling
                            : activeTemplateType === 'paid'
                            ? whatsappForm.paidBilling || DEFAULT_WA_TEMPLATES.paidBilling
                            : whatsappForm.studentReport || DEFAULT_WA_TEMPLATES.studentReport;

                        return formatWhatsAppMessage(currentRaw, sampleData);
                      })()}

                      <div className="flex items-center justify-end gap-1 text-[10px] text-emerald-300 pt-1">
                        <span>10:30</span>
                        <span className="text-sky-300 font-bold">✓✓</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Direct Test Sending Box */}
                <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-2">
                  <label className="block text-[11px] font-bold text-slate-300">
                    Tes Kirimkan Format Ini ke WhatsApp:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={testPhoneNumber}
                      onChange={(e) => setTestPhoneNumber(e.target.value)}
                      placeholder="Contoh: 081234567890"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-xl text-xs text-white placeholder:text-slate-500 font-mono focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const sampleStudent = students[0];
                        const sampleData = {
                          nama_siswa: sampleStudent?.name || 'Naureen Zevania Putri Riansyah',
                          nis: sampleStudent?.code || 'NAUREEN',
                          kode_siswa: sampleStudent?.code || 'NAUREEN',
                          nama_ortu: sampleStudent?.parentName || 'Bapak Riansyah',
                          nomor_ortu: sampleStudent?.parentPhone || '081234567801',
                          kelas: sampleStudent?.gradeDetail || 'Kelas 2 SD',
                          tipe_kelas: sampleStudent?.classType || 'Privat',
                          jenjang: sampleStudent?.level || 'SD',
                          bulan: 'Agustus',
                          tahun: 2026,
                          jumlah_sesi: 8,
                          tarif_per_sesi: 'Rp 50.000',
                          daftar_tanggal: '03/08, 07/08, 10/08, 14/08, 17/08, 21/08, 24/08, 28/08',
                          total_tagihan: 'Rp 400.000',
                          sudah_dibayar:
                            activeTemplateType === 'partial'
                              ? 'Rp 200.000'
                              : activeTemplateType === 'paid'
                              ? 'Rp 400.000'
                              : 'Rp 0',
                          sisa_tagihan:
                            activeTemplateType === 'partial'
                              ? 'Rp 200.000'
                              : activeTemplateType === 'paid'
                              ? 'Rp 0'
                              : 'Rp 400.000',
                          status_bayar:
                            activeTemplateType === 'unpaid'
                              ? 'Belum Bayar'
                              : activeTemplateType === 'partial'
                              ? 'Sebagian'
                              : 'Lunas',
                          rekening_bimbel:
                            settings.bankInfo || 'BCA: 8830-1234-56 a.n Bimbel Sigma Mandiri',
                          nama_bimbel: settings.bimbelName || 'BIMBEL SIGMA',
                          tagline_bimbel: settings.tagline || 'Belajar Sampai Paham',
                          telepon_bimbel: settings.phone || '0812-3456-7890',
                          alamat_bimbel: settings.address || '',
                          nama_tutor: sampleStudent?.tutorName || 'Kak Sarah Amalia, S.Si.',
                        };

                        const currentRaw =
                          activeTemplateType === 'unpaid'
                            ? whatsappForm.unpaidBilling || DEFAULT_WA_TEMPLATES.unpaidBilling
                            : activeTemplateType === 'partial'
                            ? whatsappForm.partialBilling || DEFAULT_WA_TEMPLATES.partialBilling
                            : activeTemplateType === 'paid'
                            ? whatsappForm.paidBilling || DEFAULT_WA_TEMPLATES.paidBilling
                            : whatsappForm.studentReport || DEFAULT_WA_TEMPLATES.studentReport;

                        const message = formatWhatsAppMessage(currentRaw, sampleData);
                        sendWhatsAppDirect(testPhoneNumber, message);
                      }}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-sm"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Tes Buka WA</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 5: KUSTOMISASI TAMPILAN & TEKS DASHBOARD / SIDEBAR */}
      {/* ========================================================= */}
      {activeSubTab === 'appearance' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {appearanceSavedToast && (
            <div className="p-4 bg-emerald-500 text-white rounded-2xl shadow-xl flex items-center gap-3 text-xs font-bold animate-in slide-in-from-top-3">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>Pengaturan tampilan & teks dashboard berhasil disimpan! Perubahan langsung diterapkan pada Sidebar, Navbar, dan Dashboard.</span>
            </div>
          )}

          {/* Top Info & Action Bar */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-[10px] font-extrabold uppercase tracking-wider">
                <Palette className="w-3.5 h-3.5" />
                Desain & Kustomisasi Teks UI
              </div>
              <h3 className="text-base font-bold text-slate-900 font-heading">
                Kustomisasi Teks Tampilan Dashboard & Sidebar
              </h3>
              <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
                Ubah tulisan yang ada di sidebar pojok kiri bawah (seperti <span className="font-semibold text-slate-700">“BIMBEL SIGMA”</span> dan <span className="font-semibold text-slate-700">“Belajar Sampai Paham”</span>), header navbar, ucapan selamat datang di dashboard Owner, Tutor, Siswa, hingga halaman login.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleResetAppearanceDefaults}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-slate-200"
                title="Kembalikan semua teks ke tulisan awal bawaan"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Teks Default</span>
              </button>

              <button
                type="button"
                onClick={handleSubmitAppearance}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </div>

          {/* ========================================================= */}
          {/* LIVE PREVIEW BOX (Pratinjau Langsung Interaktif) */}
          {/* ========================================================= */}
          <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-200">
                  Pratinjau Langsung (Live Preview)
                </h4>
              </div>
              <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700 text-xs">
                <span className="text-[11px] text-slate-400 px-2 font-medium">Tampilkan Banner:</span>
                <button
                  type="button"
                  onClick={() => setPreviewRole('owner')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                    previewRole === 'owner' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Owner
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewRole('tutor')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                    previewRole === 'tutor' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Tutor
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewRole('siswa')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                    previewRole === 'siswa' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Siswa
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              {/* Preview 1: Sidebar Footer Bawah Kiri */}
              <div className="lg:col-span-4 bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  <span>📌 Footer Sidebar Bawah Kiri</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-300">Live</span>
                </div>
                <div className="p-3.5 bg-white rounded-xl text-center shadow-md border border-slate-200">
                  <p className="text-[12px] font-extrabold text-indigo-950 font-heading">
                    {appearanceForm.sidebarFooterTitle || appearanceForm.bimbelName || 'BIMBEL SIGMA'}
                  </p>
                  <p className="text-[11px] text-amber-700 font-semibold italic mt-0.5">
                    {appearanceForm.sidebarFooterTagline || '“Belajar Sampai Paham”'}
                  </p>
                  {appearanceForm.sidebarFooterNote && (
                    <p className="text-[9px] text-slate-400 mt-1">
                      {appearanceForm.sidebarFooterNote}
                    </p>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 italic text-center">
                  Teks ini muncul di bagian paling bawah pada menu sidebar kiri.
                </p>
              </div>

              {/* Preview 2: Navbar Header & Dashboard Banner */}
              <div className="lg:col-span-8 space-y-3">
                {/* Navbar Mini Preview */}
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-indigo-600 to-amber-500 flex items-center justify-center font-black text-base text-white shadow-md">
                      {appearanceForm.logoSymbol || 'Σ'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white">
                          {appearanceForm.bimbelName || 'BIMBEL SIGMA'}
                        </span>
                        {appearanceForm.appVersionBadge && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                            {appearanceForm.appVersionBadge}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-amber-300/90 font-medium">
                        “{appearanceForm.tagline || 'Belajar Sampai Paham, Bukan Sekadar Hafal'}”
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-1 rounded-md border border-slate-800">
                    Header Navbar
                  </span>
                </div>

                {/* Dashboard Banner Preview according to chosen role */}
                {previewRole === 'owner' && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 border border-indigo-700/50 space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-extrabold uppercase tracking-wider">
                      <Sparkles className="w-3 h-3" />
                      {appearanceForm.ownerDashboardBadge || 'Executive Dashboard (Owner Access)'}
                    </div>
                    <h5 className="text-sm font-black text-white font-heading">
                      {appearanceForm.ownerDashboardTitle || `${appearanceForm.bimbelName || 'BIMBEL SIGMA'} • Budi Santoso, S.Pd.`}
                    </h5>
                    <p className="text-xs text-indigo-200 font-medium leading-relaxed">
                      {appearanceForm.ownerDashboardMessage || 'Pantau metrik finansial, absensi digital real-time, dan pembukuan tahunan dalam satu pintu.'}
                    </p>
                  </div>
                )}

                {previewRole === 'tutor' && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 border border-teal-700/50 space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-400/20 border border-teal-400/40 text-teal-300 text-[10px] font-extrabold uppercase tracking-wider">
                      <GraduationCap className="w-3 h-3" />
                      {appearanceForm.tutorDashboardBadge || 'Ruang Kerja Pengajar (Tutor Access)'}
                    </div>
                    <h5 className="text-sm font-black text-white font-heading">
                      {appearanceForm.tutorDashboardTitle || 'Halo, Kak Tutor!'}
                    </h5>
                    <p className="text-xs text-teal-200 font-medium leading-relaxed">
                      {appearanceForm.tutorDashboardMessage || 'Fokus pada kualitas pembelajaran: catat absensi harian siswa, topik materi, serta evaluasi pemahaman belajar.'}
                    </p>
                  </div>
                )}

                {previewRole === 'siswa' && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-800 via-indigo-900 to-slate-900 border border-indigo-700/50 space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-extrabold uppercase tracking-wider">
                      <Sparkles className="w-3 h-3" />
                      {appearanceForm.studentDashboardBadge || 'Portal Siswa & Orang Tua Bimbel Sigma'}
                    </div>
                    <h5 className="text-sm font-black text-white font-heading">
                      {appearanceForm.studentDashboardTitle || 'Selamat Belajar, Ananda Siswa!'}
                    </h5>
                    <p className="text-xs text-indigo-200 font-medium leading-relaxed">
                      {appearanceForm.studentDashboardMessage || '“Belajar Sampai Paham, Bukan Sekadar Hafal”. Catat kehadiran mandiri, pantau materi tiap sesi pembelajaran, dan evaluasi hasil belajar.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form Settings */}
          <form onSubmit={handleSubmitAppearance} className="space-y-6">
            {/* CARD 1: PENGATURAN TEKS SIDEBAR POJOK KIRI BAWAH (Permintaan Khusus) */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-amber-200 shadow-xs space-y-5 bg-gradient-to-br from-amber-50/40 via-white to-white">
              <div className="flex items-center gap-3 pb-3 border-b border-amber-200/60">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-700 flex items-center justify-center font-bold">
                  <Layout className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 font-heading flex items-center gap-2">
                    <span>1. Teks Menu Sidebar Bawah Kiri</span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-extrabold">Pojok Kiri Bawah</span>
                  </h4>
                  <p className="text-xs text-slate-500">
                    Pengaturan tulisan pada kotak info di paling bawah menu samping (Sidebar).
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Judul Brand Sidebar Bawah *
                  </label>
                  <input
                    type="text"
                    value={appearanceForm.sidebarFooterTitle || ''}
                    onChange={(e) => setAppearanceForm({ ...appearanceForm, sidebarFooterTitle: e.target.value })}
                    placeholder="Contoh: BIMBEL SIGMA"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Default awal: <span className="font-semibold text-slate-600">BIMBEL SIGMA</span>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Tagline / Slogan di Bawah Kiri *
                  </label>
                  <input
                    type="text"
                    value={appearanceForm.sidebarFooterTagline || ''}
                    onChange={(e) => setAppearanceForm({ ...appearanceForm, sidebarFooterTagline: e.target.value })}
                    placeholder="Contoh: “Belajar Sampai Paham”"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Default awal: <span className="font-semibold text-slate-600">“Belajar Sampai Paham”</span>
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Catatan Kaki Bawah Kiri (Keterangan Tambahan)
                  </label>
                  <input
                    type="text"
                    value={appearanceForm.sidebarFooterNote || ''}
                    onChange={(e) => setAppearanceForm({ ...appearanceForm, sidebarFooterNote: e.target.value })}
                    placeholder="Contoh: Data tersimpan aman di LocalStorage browser"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* CARD 2: HEADER & NAVBAR ATAS */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <LayoutTemplate className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 font-heading">
                    2. Logo & Teks Header Navbar Atas
                  </h4>
                  <p className="text-xs text-slate-500">
                    Pengaturan identitas visual pada navigasi bar atas aplikasi.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Simbol Logo / Inisial (1-4 Karakter)
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={appearanceForm.logoSymbol || ''}
                    onChange={(e) => setAppearanceForm({ ...appearanceForm, logoSymbol: e.target.value })}
                    placeholder="Contoh: Σ atau ⭐"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 text-center font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Badge Versi / Status Tag
                  </label>
                  <input
                    type="text"
                    value={appearanceForm.appVersionBadge || ''}
                    onChange={(e) => setAppearanceForm({ ...appearanceForm, appVersionBadge: e.target.value })}
                    placeholder="Contoh: v2.6 PRO"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nama Lembaga di Navbar (Sinkron dengan Profil)
                  </label>
                  <input
                    type="text"
                    value={appearanceForm.bimbelName || ''}
                    onChange={(e) => setAppearanceForm({ ...appearanceForm, bimbelName: e.target.value })}
                    placeholder="Contoh: BIMBEL SIGMA"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2 md:col-span-4">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Slogan Utama Lembaga di Navbar
                  </label>
                  <input
                    type="text"
                    value={appearanceForm.tagline || ''}
                    onChange={(e) => setAppearanceForm({ ...appearanceForm, tagline: e.target.value })}
                    placeholder="Contoh: Belajar Sampai Paham, Bukan Sekadar Hafal"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* CARD 3: TEKS DASHBOARD OWNER */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 font-heading">
                    3. Kustomisasi Teks Dashboard Owner (Super Admin)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Pengaturan tulisan pada banner utama dashboard Owner.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Teks Badge Owner
                  </label>
                  <input
                    type="text"
                    value={appearanceForm.ownerDashboardBadge || ''}
                    onChange={(e) => setAppearanceForm({ ...appearanceForm, ownerDashboardBadge: e.target.value })}
                    placeholder="Contoh: Executive Dashboard (Owner Access)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Judul Banner Owner (Opsional)
                  </label>
                  <input
                    type="text"
                    value={appearanceForm.ownerDashboardTitle || ''}
                    onChange={(e) => setAppearanceForm({ ...appearanceForm, ownerDashboardTitle: e.target.value })}
                    placeholder="Kosongkan untuk otomatis: [Nama Bimbel] • [Nama Owner]"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Pesan Sambutan / Subtitle Owner
                  </label>
                  <textarea
                    rows={2}
                    value={appearanceForm.ownerDashboardMessage || ''}
                    onChange={(e) => setAppearanceForm({ ...appearanceForm, ownerDashboardMessage: e.target.value })}
                    placeholder="Contoh: Pantau metrik finansial, absensi digital real-time, dan pembukuan tahunan dalam satu pintu."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* CARD 4: TEKS DASHBOARD TUTOR & PORTAL SISWA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tutor Dashboard */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 font-heading">
                      4. Teks Dashboard Pengajar (Tutor)
                    </h4>
                    <p className="text-[11px] text-slate-500">Banner sambutan peran Tutor</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Label Badge Tutor
                    </label>
                    <input
                      type="text"
                      value={appearanceForm.tutorDashboardBadge || ''}
                      onChange={(e) => setAppearanceForm({ ...appearanceForm, tutorDashboardBadge: e.target.value })}
                      placeholder="Ruang Kerja Pengajar (Tutor Access)"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Judul Banner Tutor (Opsional)
                    </label>
                    <input
                      type="text"
                      value={appearanceForm.tutorDashboardTitle || ''}
                      onChange={(e) => setAppearanceForm({ ...appearanceForm, tutorDashboardTitle: e.target.value })}
                      placeholder="Kosongkan untuk otomatis: Halo, [Nama Tutor]!"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Pesan Sambutan Tutor
                    </label>
                    <textarea
                      rows={2}
                      value={appearanceForm.tutorDashboardMessage || ''}
                      onChange={(e) => setAppearanceForm({ ...appearanceForm, tutorDashboardMessage: e.target.value })}
                      placeholder="Fokus pada kualitas pembelajaran: catat absensi harian siswa..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>

              {/* Student Portal */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 font-heading">
                      5. Teks Portal Siswa & Wali Murid
                    </h4>
                    <p className="text-[11px] text-slate-500">Banner sambutan peran Siswa</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Label Badge Portal Siswa
                    </label>
                    <input
                      type="text"
                      value={appearanceForm.studentDashboardBadge || ''}
                      onChange={(e) => setAppearanceForm({ ...appearanceForm, studentDashboardBadge: e.target.value })}
                      placeholder="Portal Siswa & Orang Tua Bimbel Sigma"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Judul Sambutan Siswa (Opsional)
                    </label>
                    <input
                      type="text"
                      value={appearanceForm.studentDashboardTitle || ''}
                      onChange={(e) => setAppearanceForm({ ...appearanceForm, studentDashboardTitle: e.target.value })}
                      placeholder="Kosongkan untuk otomatis: Selamat Belajar, [Nama Siswa]!"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Pesan Motivasi Siswa
                    </label>
                    <textarea
                      rows={2}
                      value={appearanceForm.studentDashboardMessage || ''}
                      onChange={(e) => setAppearanceForm({ ...appearanceForm, studentDashboardMessage: e.target.value })}
                      placeholder="Catat kehadiran mandiri, pantau materi tiap sesi..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 5: TEKS HALAMAN LOGIN */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 font-heading">
                    6. Teks Pengantar Halaman Login (Selamat Datang)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Keterangan sistem yang muncul di bawah nama lembaga pada layar masuk (login).
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Pesan Pengantar / Subtitle Login
                </label>
                <input
                  type="text"
                  value={appearanceForm.loginWelcomeMessage || ''}
                  onChange={(e) => setAppearanceForm({ ...appearanceForm, loginWelcomeMessage: e.target.value })}
                  placeholder="Contoh: Sistem Manajemen & Presensi Digital Bimbel Terintegrasi"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Submit Bar at Bottom */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                Semua perubahan teks dan tampilan tersimpan secara aman di database lokal aplikasi.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetAppearanceDefaults}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Reset Standar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/25 flex items-center gap-2 transition cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan Tampilan</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 6: BACKUP & RESTORE DATA */}
      {/* ========================================================= */}
      {activeSubTab === 'backup' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Cloud Firebase Sync */}
          <div className="bg-white p-6 rounded-2xl border border-indigo-200 shadow-xs flex flex-col justify-between bg-indigo-50/20">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-500/20">
                <Cloud className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 font-heading">
                Sinkronisasi Cloud Firebase (Realtime)
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Kirim seluruh data lokal saat ini (Siswa, Presensi, SPP, Pengeluaran, Akun) ke cloud database Firebase Firestore agar sinkron di semua HP, tablet, dan laptop.
              </p>
            </div>

            <button
              onClick={async () => {
                if (onSyncAllToCloud) {
                  try {
                    setIsSyncingCloud(true);
                    await onSyncAllToCloud();
                    setCloudSyncSuccess(true);
                    setTimeout(() => setCloudSyncSuccess(false), 4000);
                  } finally {
                    setIsSyncingCloud(false);
                  }
                }
              }}
              disabled={isSyncingCloud}
              className="mt-6 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              {cloudSyncSuccess ? (
                <>
                  <CloudCheck className="w-4 h-4 text-emerald-300" />
                  <span>Tersinkron ke Cloud!</span>
                </>
              ) : isSyncingCloud ? (
                <span>Menyinkronkan...</span>
              ) : (
                <>
                  <Cloud className="w-4 h-4" />
                  <span>Sync Semua Data ke Cloud</span>
                </>
              )}
            </button>
          </div>

          {/* Card 2: Export JSON */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Download className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 font-heading">
                Unduh Cadangan (Export JSON)
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Simpan seluruh data operasional (Database Siswa, Presensi Harian, Kas Masuk SPP, Pengeluaran, Akun Pengguna, dan Pengaturan) ke dalam file `.json` di komputer Anda.
              </p>
            </div>

            <button
              onClick={handleExportData}
              className="mt-6 w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-md shadow-slate-900/20 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download Backup (.json)
            </button>
          </div>

          {/* Card 3: Import JSON */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 font-heading">
                Pulihkan Cadangan (Import JSON)
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Unggah file cadangan `.json` yang telah disimpan sebelumnya untuk memulihkan seluruh data aplikasi secara instan.
              </p>
            </div>

            <label className="mt-6 w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 transition cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>Pilih File Backup (.json)</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>
          </div>

          {/* Card 4: Factory Reset Demo */}
          <div className="bg-white p-6 rounded-2xl border border-rose-200 shadow-xs flex flex-col justify-between bg-rose-50/20">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <RotateCcw className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 font-heading">
                Reset ke Data Awal Pabrik
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Kembalikan seluruh database ke data demonstrasi standar Bimbel Sigma. Semua data baru yang dibuat akan terhapus.
              </p>
            </div>

            <button
              onClick={() => {
                setDeleteDialog({
                  isOpen: true,
                  title: 'Reset ke Data Default Pabrik',
                  message: 'PERINGATAN: Apakah Anda yakin ingin mereset seluruh data aplikasi ke data bawaan demo? Seluruh data baru dan perubahan yang Anda buat akan terhapus.',
                  itemName: 'Seluruh Database Aplikasi',
                  onConfirm: () => {
                    onResetAllData();
                  },
                });
              }}
              className="mt-6 w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Reset ke Data Default Pabrik
            </button>
          </div>
        </div>
      )}

      {/* In-App Confirmation Modal (Safe for iframe / preview) */}
      <ConfirmDeleteModal
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={deleteDialog.onConfirm}
        title={deleteDialog.title}
        message={deleteDialog.message}
        itemName={deleteDialog.itemName}
      />

      {/* In-App Notice / Warning Modal */}
      {noticeModal && noticeModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                  noticeModal.type === 'error'
                    ? 'bg-rose-100 text-rose-600'
                    : noticeModal.type === 'info'
                    ? 'bg-indigo-100 text-indigo-600'
                    : 'bg-amber-100 text-amber-600'
                }`}
              >
                {noticeModal.type === 'info' ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <AlertCircle className="w-6 h-6" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-900 font-heading">
                  {noticeModal.title}
                </h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed whitespace-pre-line">
                  {noticeModal.message}
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setNoticeModal(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
