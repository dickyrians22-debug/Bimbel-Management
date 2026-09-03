import React, { useState } from 'react';
import {
  UserPlus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  MessageCircle,
  Phone,
  Edit2,
  Trash2,
  UserCheck,
  Globe,
  Share2,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  Kanban,
  Table as TableIcon,
  Sparkles,
  Calendar,
  AlertCircle,
  BookOpen,
  GraduationCap,
  Printer,
} from 'lucide-react';
import {
  ProspectiveStudent,
  ProspectiveStudentStatus,
  Student,
  UserAccount,
  BimbelSettings,
  UserRole,
} from '../../types';
import { formatDateIndo, formatRupiah } from '../../utils/storage';
import {
  sendWhatsAppDirect,
  formatWhatsAppMessage,
  DEFAULT_WA_TEMPLATES,
  WhatsAppTemplateData,
} from '../../utils/whatsapp';
import { ConvertProspectiveModal } from '../modals/ConvertProspectiveModal';
import { ProspectiveModal } from '../modals/ProspectiveModal';
import { RegistrationReceiptModal } from '../modals/RegistrationReceiptModal';

interface PPDBManagementViewProps {
  prospectiveStudents: ProspectiveStudent[];
  students: Student[];
  users: UserAccount[];
  settings: BimbelSettings;
  userRole: UserRole;
  onSaveProspective: (data: ProspectiveStudent) => void;
  onDeleteProspective: (id: string) => void;
  onConvertToStudent: (newStudent: Student, updatedProspective: ProspectiveStudent) => void;
  onOpenPublicPortal: () => void;
}

export const PPDBManagementView: React.FC<PPDBManagementViewProps> = ({
  prospectiveStudents,
  students,
  users,
  settings,
  userRole,
  onSaveProspective,
  onDeleteProspective,
  onConvertToStudent,
  onOpenPublicPortal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedClassType, setSelectedClassType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProspectiveStudent | null>(null);

  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [convertingItem, setConvertingItem] = useState<ProspectiveStudent | null>(null);

  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptModalItem, setReceiptModalItem] = useState<ProspectiveStudent | null>(null);

  const [copiedLink, setCopiedLink] = useState(false);

  const bimbelName = settings?.bimbelName || 'BIMBEL SIGMA';
  const contactPhone = settings?.phone || '0812-3456-7890';

  // Metrics
  const totalCount = prospectiveStudents.length;
  const countBaru = prospectiveStudents.filter((p) => p.status === 'Baru').length;
  const countTrial = prospectiveStudents.filter((p) => p.status === 'Jadwal Trial').length;
  const countMenungguBayar = prospectiveStudents.filter((p) => p.status === 'Menunggu Bayar').length;
  const countDiterima = prospectiveStudents.filter((p) => p.status === 'Diterima').length;
  const countBatal = prospectiveStudents.filter((p) => p.status === 'Batal').length;

  // Filtered List
  const filteredList = prospectiveStudents.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    const matchQuery =
      !q ||
      item.studentName.toLowerCase().includes(q) ||
      (item.nickname || '').toLowerCase().includes(q) ||
      item.registrationNumber.toLowerCase().includes(q) ||
      item.parentPhone.includes(q) ||
      item.parentName.toLowerCase().includes(q) ||
      (item.schoolOrigin || '').toLowerCase().includes(q);

    const matchStatus = selectedStatus === 'all' || item.status === selectedStatus;
    const matchLevel = selectedLevel === 'all' || item.level === selectedLevel;
    const matchClassType = selectedClassType === 'all' || item.classType === selectedClassType;

    return matchQuery && matchStatus && matchLevel && matchClassType;
  });

  // Handle Quick Status Change
  const handleQuickStatusChange = (item: ProspectiveStudent, newStatus: ProspectiveStudentStatus) => {
    onSaveProspective({
      ...item,
      status: newStatus,
    });
  };

  // Copy portal link
  const handleCopyPortalLink = () => {
    const url = window.location.origin;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // WhatsApp Templates
  const handleSendWA = (item: ProspectiveStudent, type: 'greeting' | 'trial' | 'accepted') => {
    const customTemplates = settings?.whatsappTemplates;
    const templateString =
      type === 'greeting'
        ? customTemplates?.ppdbGreeting || DEFAULT_WA_TEMPLATES.ppdbGreeting
        : type === 'trial'
        ? customTemplates?.ppdbTrial || DEFAULT_WA_TEMPLATES.ppdbTrial
        : customTemplates?.ppdbAccepted || DEFAULT_WA_TEMPLATES.ppdbAccepted;

    const templateData: WhatsAppTemplateData = {
      nama_ortu: item.parentName,
      nama_siswa: item.studentName,
      nama_panggilan: item.nickname || item.studentName.split(' ')[0],
      kelas: item.gradeDetail || item.level,
      jenjang: item.level,
      tipe_kelas: item.classType,
      no_registrasi: item.registrationNumber,
      nomor_registrasi: item.registrationNumber,
      mapel_minat: (item.interestedSubjects || []).join(', ') || 'Semua Mapel',
      preferensi_jadwal: item.preferredSchedule || 'Fleksibel / Sesuai Kesepakatan',
      tanggal_trial: item.trialDate ? formatDateIndo(item.trialDate) : 'Sesuai Kesepakatan',
      sekolah_asal: item.schoolOrigin || '-',
      nama_tutor: item.assignedTutorName || 'Tutor Bimbel',
      kode_siswa: item.convertedStudentCode || item.registrationNumber,
      nis: item.convertedStudentCode || item.registrationNumber,
      nomor_ortu: item.parentPhone,
      nama_bimbel: bimbelName,
      tagline_bimbel: settings?.tagline || '',
      telepon_bimbel: settings?.phone || '',
      alamat_bimbel: settings?.address || bimbelName,
      rekening_bimbel: settings?.bankInfo || '',
    };

    const msg = formatWhatsAppMessage(templateString, templateData);
    sendWhatsAppDirect(item.parentPhone, msg);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-600/20">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 font-heading">
                Manajemen PPDB &amp; Calon Siswa
              </h2>
              {countBaru > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-500 text-white animate-pulse">
                  {countBaru} Baru
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Kelola pendaftar online dari portal, atur jadwal trial, dan konversi 1-klik menjadi siswa resmi.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenPublicPortal}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-slate-200"
            title="Buka tampilan formulir portal publik"
          >
            <Globe className="w-4 h-4 text-indigo-600" />
            <span>Lihat Portal Publik</span>
          </button>

          <button
            type="button"
            onClick={handleCopyPortalLink}
            className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-indigo-200"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-600 font-extrabold">Link Disalin!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-indigo-600" />
                <span>Salin Link PPDB</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingItem(null);
              setIsEditModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/25 transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Input Calon Siswa (Manual)</span>
          </button>
        </div>
      </div>

      {/* Workflow Guide Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 rounded-3xl p-4 sm:p-5 text-white shadow-sm border border-indigo-800/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Alur Standar Follow-Up PPDB &amp; Sesi Trial</span>
            </span>
            <p className="text-xs text-slate-200 leading-relaxed max-w-2xl">
              1. <strong>Pendaftar Masuk</strong> ➔ 2. <strong>Sesi Trial Belajar</strong> (hanya bayar per sesi trial, <em>bebas biaya pendaftaran awal</em>) ➔ 3. <strong>Evaluasi Kecocokan Siswa</strong> (jika cocok ➔ <em>Menunggu Bayar Pendaftaran</em>) ➔ 4. <strong>Diterima Resmi</strong> sebagai Siswa Aktif.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3 py-1.5 rounded-xl bg-indigo-800/80 text-[11px] font-bold text-indigo-200 border border-indigo-700">
              💡 Transparan &amp; Ramah Siswa
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          type="button"
          onClick={() => setSelectedStatus('all')}
          className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
            selectedStatus === 'all'
              ? 'bg-slate-900 text-white border-slate-900 shadow-md'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80">
            Total Pendaftar
          </span>
          <p className="text-2xl font-black font-heading mt-1">{totalCount}</p>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatus('Baru')}
          className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
            selectedStatus === 'Baru'
              ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50/50'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80">
            1. Perlu Follow Up
          </span>
          <p className="text-2xl font-black font-heading mt-1 text-amber-500 group-hover:text-amber-600">
            {countBaru}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatus('Jadwal Trial')}
          className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
            selectedStatus === 'Jadwal Trial'
              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-blue-50/50'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80">
            2. Jadwal Trial
          </span>
          <p className="text-2xl font-black font-heading mt-1 text-blue-600">{countTrial}</p>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatus('Menunggu Bayar')}
          className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
            selectedStatus === 'Menunggu Bayar'
              ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-purple-50/50'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80">
            3. Menunggu Bayar
          </span>
          <p className="text-2xl font-black font-heading mt-1 text-purple-600">{countMenungguBayar}</p>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatus('Diterima')}
          className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
            selectedStatus === 'Diterima'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50/50'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80">
            4. Diterima (Resmi)
          </span>
          <p className="text-2xl font-black font-heading mt-1 text-emerald-600">{countDiterima}</p>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatus('Batal')}
          className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
            selectedStatus === 'Batal'
              ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-rose-50/50'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80">
            5. Batal / Arsip
          </span>
          <p className="text-2xl font-black font-heading mt-1 text-rose-600">{countBatal}</p>
        </button>
      </div>

      {/* Filter Bar & View Switcher */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, no. registrasi, no. WA, sekolah..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700"
          >
            <option value="all">Semua Status</option>
            <option value="Baru">Baru (Follow Up)</option>
            <option value="Jadwal Trial">Jadwal Trial</option>
            <option value="Menunggu Bayar">Menunggu Bayar</option>
            <option value="Diterima">Diterima</option>
            <option value="Batal">Batal</option>
          </select>

          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700"
          >
            <option value="all">Semua Jenjang</option>
            <option value="PAUD">PAUD / TK</option>
            <option value="SD">SD</option>
            <option value="SMP">SMP</option>
            <option value="SMA">SMA</option>
            <option value="UTBK">UTBK</option>
          </select>

          <select
            value={selectedClassType}
            onChange={(e) => setSelectedClassType(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700"
          >
            <option value="all">Semua Tipe</option>
            <option value="Privat">Privat</option>
            <option value="Grup">Grup</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Tampilan Tabel"
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'kanban' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Tampilan Kanban Board"
            >
              <Kanban className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          {filteredList.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <UserPlus className="w-6 h-6" />
              </div>
              <p className="font-bold text-slate-700 text-sm">Tidak ada data pendaftar yang cocok.</p>
              <p>Coba sesuaikan filter pencarian atau input pendaftar baru.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-extrabold border-b border-slate-200 text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">No. Registrasi &amp; Tgl</th>
                    <th className="py-3.5 px-4">Nama Calon Siswa</th>
                    <th className="py-3.5 px-4">Jenjang &amp; Kelas</th>
                    <th className="py-3.5 px-4">Mapel &amp; Preferensi Jadwal</th>
                    <th className="py-3.5 px-4">Orang Tua / No. WA</th>
                    <th className="py-3.5 px-4">Status Follow-Up</th>
                    <th className="py-3.5 px-4 text-center">Aksi &amp; Konversi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      {/* 1. Reg & Date */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-indigo-950 block">
                          {item.registrationNumber}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatDateIndo(item.registrationDate)}
                        </span>
                      </td>

                      {/* 2. Student Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-xs">
                          {item.studentName} {item.nickname ? `(${item.nickname})` : ''}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {item.gender === 'L' ? 'Laki-laki' : 'Perempuan'} {item.schoolOrigin ? `• ${item.schoolOrigin}` : ''}
                        </div>
                      </td>

                      {/* 3. Level & Class */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 block">
                          {item.gradeDetail}
                        </span>
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                            item.classType === 'Privat'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {item.classType}
                        </span>
                      </td>

                      {/* 4. Mapel & Preferensi Jadwal */}
                      <td className="py-3.5 px-4 max-w-[220px]">
                        <span className="text-slate-800 font-semibold text-xs truncate block" title={item.interestedSubjects.join(', ')}>
                          {item.interestedSubjects.join(', ')}
                        </span>
                        {item.preferredSchedule ? (
                          <span className="text-[10px] text-indigo-900 font-medium bg-indigo-50/80 border border-indigo-100 px-1.5 py-0.5 rounded inline-block mt-0.5 max-w-full truncate" title={item.preferredSchedule}>
                            📅 {item.preferredSchedule}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Jadwal fleksibel
                          </span>
                        )}
                      </td>

                      {/* 5. Parent & Phone */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800 block">
                          {item.parentName}
                        </span>
                        <span className="font-mono text-[11px] text-slate-600">
                          {item.parentPhone}
                        </span>
                      </td>

                      {/* 6. Status Selector */}
                      <td className="py-3.5 px-4">
                        <select
                          value={item.status}
                          onChange={(e) => handleQuickStatusChange(item, e.target.value as ProspectiveStudentStatus)}
                          className={`px-2 py-1 rounded-lg text-xs font-extrabold border transition cursor-pointer ${
                            item.status === 'Baru'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : item.status === 'Jadwal Trial'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : item.status === 'Menunggu Bayar'
                              ? 'bg-purple-50 text-purple-800 border-purple-200'
                              : item.status === 'Diterima'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          <option value="Baru">1. Baru</option>
                          <option value="Jadwal Trial">2. Jadwal Trial</option>
                          <option value="Menunggu Bayar">3. Menunggu Bayar</option>
                          <option value="Diterima">4. Diterima (Resmi)</option>
                          <option value="Batal">5. Batal</option>
                        </select>
                        {item.trialDate && item.status === 'Jadwal Trial' && (
                          <span className="text-[10px] text-blue-700 font-semibold block mt-0.5">
                            Trial: {formatDateIndo(item.trialDate)}
                          </span>
                        )}
                      </td>

                      {/* 7. Actions */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* 1-Click Convert to Official Student */}
                          {item.status !== 'Diterima' ? (
                            <button
                              type="button"
                              onClick={() => {
                                setConvertingItem(item);
                                setIsConvertModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 shadow-xs transition cursor-pointer"
                              title="Jadikan Siswa Resmi (1-Klik)"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Terima Siswa</span>
                            </button>
                          ) : (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-extrabold rounded-md text-[10px] flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>{item.convertedStudentCode || 'Resmi'}</span>
                            </span>
                          )}

                          {/* WhatsApp Action */}
                          <div className="relative group">
                            <button
                              type="button"
                              onClick={() => handleSendWA(item, 'greeting')}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition cursor-pointer"
                              title="Kirim Pesan WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Print Registration Receipt */}
                          <button
                            type="button"
                            onClick={() => {
                              setReceiptModalItem(item);
                              setIsReceiptModalOpen(true);
                            }}
                            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition cursor-pointer"
                            title="Cetak Bukti Registrasi Calon Siswa (A4 / Download PNG)"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingItem(item);
                              setIsEditModalOpen(true);
                            }}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
                            title="Edit Data Pendaftar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => onDeleteProspective(item.id)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition cursor-pointer"
                            title="Hapus Data Calon Siswa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE 2: KANBAN BOARD */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start overflow-x-auto">
          {/* COLUMN 1: BARU */}
          <div className="bg-slate-100/80 rounded-3xl p-4 border border-slate-200 space-y-3 min-w-[260px]">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">1. Baru</h4>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-200 text-amber-900">
                {prospectiveStudents.filter((p) => p.status === 'Baru').length}
              </span>
            </div>

            <div className="space-y-2.5">
              {prospectiveStudents
                .filter((p) => p.status === 'Baru')
                .map((item) => (
                  <div key={item.id} className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-indigo-700">
                        {item.registrationNumber}
                      </span>
                      <span className="text-[9px] text-slate-400">{formatDateIndo(item.registrationDate)}</span>
                    </div>

                    <div>
                      <p className="font-bold text-slate-900">{item.studentName}</p>
                      <p className="text-[11px] text-slate-500">
                        {item.gradeDetail} • <span className="font-semibold text-purple-700">{item.classType}</span>
                      </p>
                    </div>

                    <div className="text-[10px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <strong>Mapel:</strong> {item.interestedSubjects.join(', ')}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleSendWA(item, 'greeting')}
                          className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[11px] font-bold transition cursor-pointer"
                          title="Chat WA"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setReceiptModalItem(item);
                            setIsReceiptModalOpen(true);
                          }}
                          className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition cursor-pointer"
                          title="Cetak Bukti Registrasi"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingItem(item);
                            setIsEditModalOpen(true);
                          }}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteProspective(item.id)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleQuickStatusChange(item, 'Jadwal Trial')}
                        className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-bold cursor-pointer"
                      >
                        Set Trial →
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* COLUMN 2: JADWAL TRIAL */}
          <div className="bg-slate-100/80 rounded-3xl p-4 border border-slate-200 space-y-3 min-w-[260px]">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">2. Jadwal Trial</h4>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-200 text-blue-900">
                {prospectiveStudents.filter((p) => p.status === 'Jadwal Trial').length}
              </span>
            </div>

            <div className="space-y-2.5">
              {prospectiveStudents
                .filter((p) => p.status === 'Jadwal Trial')
                .map((item) => (
                  <div key={item.id} className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-indigo-700">
                        {item.registrationNumber}
                      </span>
                      <span className="text-[9px] text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded">
                        {item.trialDate ? formatDateIndo(item.trialDate) : 'Trial'}
                      </span>
                    </div>

                    <div>
                      <p className="font-bold text-slate-900">{item.studentName}</p>
                      <p className="text-[11px] text-slate-500">
                        {item.gradeDetail} • {item.classType}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleSendWA(item, 'trial')}
                          className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-[11px] font-bold flex items-center transition cursor-pointer"
                          title="Kirim Undangan WA"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setReceiptModalItem(item);
                            setIsReceiptModalOpen(true);
                          }}
                          className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition cursor-pointer"
                          title="Cetak Bukti"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingItem(item);
                            setIsEditModalOpen(true);
                          }}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteProspective(item.id)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setConvertingItem(item);
                          setIsConvertModalOpen(true);
                        }}
                        className="px-2 py-1 bg-emerald-600 text-white rounded-lg text-[11px] font-bold cursor-pointer hover:bg-emerald-700"
                      >
                        Terima ✨
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* COLUMN 3: MENUNGGU BAYAR */}
          <div className="bg-slate-100/80 rounded-3xl p-4 border border-slate-200 space-y-3 min-w-[260px]">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">3. Menunggu Bayar</h4>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-200 text-purple-900">
                {prospectiveStudents.filter((p) => p.status === 'Menunggu Bayar').length}
              </span>
            </div>

            <div className="space-y-2.5">
              {prospectiveStudents
                .filter((p) => p.status === 'Menunggu Bayar')
                .map((item) => (
                  <div key={item.id} className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-2 text-xs">
                    <p className="font-bold text-slate-900">{item.studentName}</p>
                    <p className="text-[11px] text-slate-500">{item.gradeDetail} • {item.parentPhone}</p>
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingItem(item);
                            setIsEditModalOpen(true);
                          }}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteProspective(item.id)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setConvertingItem(item);
                          setIsConvertModalOpen(true);
                        }}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                      >
                        Konfirmasi Siswa ✨
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* COLUMN 4: DITERIMA (RESMI) */}
          <div className="bg-slate-100/80 rounded-3xl p-4 border border-slate-200 space-y-3 min-w-[260px]">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">4. Diterima (Resmi)</h4>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-200 text-emerald-900">
                {prospectiveStudents.filter((p) => p.status === 'Diterima').length}
              </span>
            </div>

            <div className="space-y-2.5">
              {prospectiveStudents
                .filter((p) => p.status === 'Diterima')
                .map((item) => (
                  <div key={item.id} className="bg-white p-3.5 rounded-2xl border border-emerald-200 shadow-xs space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-emerald-700">
                        {item.convertedStudentCode || item.registrationNumber}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-extrabold">
                        Siswa Aktif
                      </span>
                    </div>
                    <p className="font-bold text-slate-900">{item.studentName}</p>
                    <p className="text-[11px] text-slate-500">{item.gradeDetail}</p>
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setReceiptModalItem(item);
                          setIsReceiptModalOpen(true);
                        }}
                        className="p-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded transition cursor-pointer"
                        title="Cetak Bukti"
                      >
                        <Printer className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingItem(item);
                          setIsEditModalOpen(true);
                        }}
                        className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition cursor-pointer"
                        title="Edit"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteProspective(item.id)}
                        className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded transition cursor-pointer"
                        title="Hapus"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* COLUMN 5: BATAL */}
          <div className="bg-slate-100/80 rounded-3xl p-4 border border-slate-200 space-y-3 min-w-[260px]">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">5. Batal</h4>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-200 text-rose-900">
                {prospectiveStudents.filter((p) => p.status === 'Batal').length}
              </span>
            </div>

            <div className="space-y-2.5">
              {prospectiveStudents
                .filter((p) => p.status === 'Batal')
                .map((item) => (
                  <div key={item.id} className="bg-white/70 p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-1 text-xs opacity-75">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-700">{item.studentName}</p>
                      <button
                        type="button"
                        onClick={() => onDeleteProspective(item.id)}
                        className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded transition cursor-pointer"
                        title="Hapus Permanen"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400">{item.gradeDetail} • {item.parentName}</p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Convert to Student Modal */}
      {convertingItem && (
        <ConvertProspectiveModal
          isOpen={isConvertModalOpen}
          onClose={() => {
            setIsConvertModalOpen(false);
            setConvertingItem(null);
          }}
          prospective={convertingItem}
          existingStudents={students}
          users={users}
          settings={settings}
          onConfirmConvert={(newStd, updatedProsp) => {
            onConvertToStudent(newStd, updatedProsp);
            setIsConvertModalOpen(false);
            setConvertingItem(null);
          }}
        />
      )}

      {/* Manual Add / Edit Modal */}
      <ProspectiveModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingItem(null);
        }}
        onSave={(data) => {
          onSaveProspective(data);
          setIsEditModalOpen(false);
          setEditingItem(null);
        }}
        initialData={editingItem}
        existingList={prospectiveStudents}
        users={users}
        settings={settings}
      />

      {/* Registration Receipt Print / Export Modal */}
      <RegistrationReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setReceiptModalItem(null);
        }}
        prospectiveStudent={receiptModalItem}
        settings={settings}
      />
    </div>
  );
};
