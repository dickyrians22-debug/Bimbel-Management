import { WhatsAppTemplates, BimbelSettings } from '../types';

export const DEFAULT_WA_TEMPLATES: Required<WhatsAppTemplates> = {
  unpaidBilling: `Halo Bapak/Ibu Orang Tua dari *{{nama_siswa}}* ({{kelas}}),

Kami dari *{{nama_bimbel}}* menyampaikan rincian tagihan iuran les pasca-belajar untuk periode *{{bulan}} {{tahun}}*:
• Siswa: *{{nama_siswa}}* (NIS: {{nis}})
• Kelas: *{{kelas}} ({{tipe_kelas}})*
• Tarif per Sesi: *{{tarif_per_sesi}}*
• Kehadiran Masuk: *{{jumlah_sesi}} Sesi* (Tgl: {{daftar_tanggal}})
• *TOTAL TAGIHAN: {{total_tagihan}}*
• Status: *Belum Bayar*

Pembayaran dapat ditransfer melalui:
{{rekening_bimbel}}
atau diserahkan tunai ke kasir Bimbel.

Konfirmasi bukti transfer dapat dikirimkan ke nomor ini. Terima kasih banyak atas kepercayaan Bapak/Ibu! 🙏✨`,

  partialBilling: `Halo Bapak/Ibu Orang Tua dari *{{nama_siswa}}* ({{kelas}}),

Kami dari *{{nama_bimbel}}* menginformasikan rincian iuran les periode *{{bulan}} {{tahun}}*:
• Siswa: *{{nama_siswa}}* (NIS: {{nis}})
• Total Kehadiran: *{{jumlah_sesi}} Sesi Hadir* (Tgl: {{daftar_tanggal}})
• Total Tagihan: *{{total_tagihan}}*
• Sudah Dibayar: *{{sudah_dibayar}}*
• *SISA KURANG BAYAR: {{sisa_tagihan}}*

Pembayaran sisa dapat ditransfer melalui:
{{rekening_bimbel}}
atau diserahkan tunai ke kasir Bimbel.

Terima kasih banyak atas perhatian dan kerja samanya! 🙏✨`,

  paidBilling: `Halo Bapak/Ibu Orang Tua dari *{{nama_siswa}}* ({{kelas}}),

Kami dari *{{nama_bimbel}}* mengucapkan terima kasih. Pembayaran iuran les periode *{{bulan}} {{tahun}}* dengan total *{{jumlah_sesi}} Sesi Hadir* ({{total_tagihan}}) telah *LUNAS*.

Terima kasih banyak atas kerja sama dan kepercayaannya mendidik ananda bersama kami! 🙏✨`,

  studentReport: `Halo Bapak/Ibu Orang Tua dari *{{nama_siswa}}*,

Berikut adalah Rekapitulasi Presensi & Evaluasi Pembelajaran ananda di *{{nama_bimbel}}* periode *{{bulan}} {{tahun}}*:
• Nama Siswa: *{{nama_siswa}}* (NIS: {{nis}})
• Tingkat / Kelas: *{{kelas}} ({{tipe_kelas}})*
• Total Kehadiran: *{{jumlah_sesi}} Sesi Hadir*
• Tutor Pembimbing: *{{nama_tutor}}*

Rincian materi yang telah dipelajari dapat dilihat pada lembar laporan belajar terlampir. Terima kasih atas dukungan Bapak/Ibu untuk kemajuan belajar ananda! 🌟📚`,

  ppdbGreeting: `Halo Bapak/Ibu {{nama_ortu}},

Terima kasih telah mendaftarkan ananda *{{nama_siswa}}* ({{kelas}}) di *{{nama_bimbel}}* dengan No. Registrasi: *{{no_registrasi}}*.

📌 *Informasi Sesi Trial Belajar*:
Ananda dapat mengikuti *Sesi Trial Belajar* terlebih dahulu (hanya membayar biaya per sesi trial, *tanpa dikenakan biaya pendaftaran di awal*). Setelah sesi trial selesai dan ananda merasa cocok, barulah dapat melanjutkan proses pendaftaran resmi.

• Mapel Minat: *{{mapel_minat}}*
• Tipe Kelas: *{{tipe_kelas}}*
• Preferensi Jadwal: *{{preferensi_jadwal}}*

Kapan waktu yang nyaman bagi Bapak/Ibu untuk berdiskusi terkait jadwal sesi trial ananda? Terima kasih! 🙏✨`,

  ppdbTrial: `Halo Bapak/Ibu {{nama_ortu}},

Kami dari *{{nama_bimbel}}* ingin mengonfirmasi jadwal *Sesi Trial Belajar* untuk ananda *{{nama_siswa}}* pada:
• Tanggal: *{{tanggal_trial}}*
• Mapel: *{{mapel_minat}}*
• Tipe Kelas: *{{tipe_kelas}}*
• Lokasi: {{alamat_bimbel}}

💡 *Catatan:* Sesi trial ini berbayar per sesi belajar saja (belum dikenakan biaya pendaftaran). Apabila ananda merasa cocok setelah sesi trial, pendaftaran resmi dapat langsung dilanjutkan.

Apakah jadwal di atas sudah sesuai untuk ananda? Terima kasih! 🙏✨`,

  ppdbAccepted: `Selamat Bapak/Ibu {{nama_ortu}}! 🎉

Pendaftaran ananda *{{nama_siswa}}* di *{{nama_bimbel}}* telah kami *TERIMA* secara resmi sebagai siswa aktif (Kode Siswa / NIS: *{{kode_siswa}}*).

Selamat bergabung dalam keluarga besar *{{nama_bimbel}}*. Mari bersama mendidik ananda sampai paham! 📚✨`,
};

export interface WhatsAppTemplateData {
  nama_siswa?: string;
  nama_panggilan?: string;
  nis?: string;
  kode_siswa?: string;
  nama_ortu?: string;
  nomor_ortu?: string;
  kelas?: string;
  tipe_kelas?: string;
  jenjang?: string;
  bulan?: string;
  tahun?: string | number;
  jumlah_sesi?: string | number;
  tarif_per_sesi?: string;
  daftar_tanggal?: string;
  total_tagihan?: string;
  sudah_dibayar?: string;
  sisa_tagihan?: string;
  status_bayar?: string;
  rekening_bimbel?: string;
  nama_bimbel?: string;
  tagline_bimbel?: string;
  telepon_bimbel?: string;
  alamat_bimbel?: string;
  nama_tutor?: string;
  // PPDB specific fields
  no_registrasi?: string;
  nomor_registrasi?: string;
  mapel_minat?: string;
  preferensi_jadwal?: string;
  tanggal_trial?: string;
  sekolah_asal?: string;
  [key: string]: string | number | undefined;
}

/**
 * Replace placeholders like {{nama_siswa}}, {{total_tagihan}} in template
 */
export function formatWhatsAppMessage(template: string, data: WhatsAppTemplateData): string {
  if (!template) return '';

  let result = template;

  // Replace double brace placeholders {{key}} and single brace {key}
  Object.keys(data).forEach((key) => {
    const val = data[key] !== undefined && data[key] !== null ? String(data[key]) : '';
    const regexDouble = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi');
    const regexSingle = new RegExp(`\\{\\s*${key}\\s*\\}`, 'gi');
    result = result.replace(regexDouble, val).replace(regexSingle, val);
  });

  // Also support alias keys
  if (data.kode_siswa && !data.nis) {
    result = result.replace(/\{\{\s*nis\s*\}\}/gi, String(data.kode_siswa));
  }
  if (data.nis && !data.kode_siswa) {
    result = result.replace(/\{\{\s*kode_siswa\s*\}\}/gi, String(data.nis));
  }
  if (data.no_registrasi && !data.nomor_registrasi) {
    result = result.replace(/\{\{\s*nomor_registrasi\s*\}\}/gi, String(data.no_registrasi));
  }
  if (data.nomor_registrasi && !data.no_registrasi) {
    result = result.replace(/\{\{\s*no_registrasi\s*\}\}/gi, String(data.nomor_registrasi));
  }

  return result;
}

/**
 * Clean phone number to 628xxx international format and open WhatsApp Web/App
 */
export function sendWhatsAppDirect(phone: string | undefined, message: string): void {
  let cleanPhone = (phone || '').replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '62' + cleanPhone.slice(1);
  } else if (cleanPhone.startsWith('8')) {
    cleanPhone = '62' + cleanPhone;
  }

  const encoded = encodeURIComponent(message);
  const waUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;

  window.open(waUrl, '_blank');
}

/**
 * Standard list of variable placeholders for documentation
 */
export const AVAILABLE_WA_VARIABLES = [
  // PPDB Variables
  { key: '{{no_registrasi}}', label: 'No. Registrasi Calon Siswa (PPDB)', category: 'ppdb', example: 'REG-20260901-001' },
  { key: '{{mapel_minat}}', label: 'Mata Pelajaran yang Diminati', category: 'ppdb', example: 'Matematika, IPA' },
  { key: '{{preferensi_jadwal}}', label: 'Preferensi Hari & Jam Belajar', category: 'ppdb', example: 'Hari: Senin, Rabu | Waktu: Sore 1 (15:30 - 17:00 WIB)' },
  { key: '{{tanggal_trial}}', label: 'Tanggal Sesi Trial Belajar', category: 'ppdb', example: 'Kamis, 04 September 2026' },
  { key: '{{sekolah_asal}}', label: 'Asal Sekolah Calon Siswa', category: 'ppdb', example: 'SDN 1 Teladan' },
  { key: '{{nama_panggilan}}', label: 'Nama Panggilan Siswa', category: 'ppdb', example: 'Fatih' },

  // General Student & Parent Variables
  { key: '{{nama_siswa}}', label: 'Nama Lengkap Siswa', category: 'student', example: 'Naureen Zevania' },
  { key: '{{nis}}', label: 'Kode / NIS Siswa', category: 'student', example: 'NAUREEN' },
  { key: '{{kode_siswa}}', label: 'Kode Siswa Resmi', category: 'student', example: 'NAUREEN4' },
  { key: '{{nama_ortu}}', label: 'Nama Orang Tua / Wali', category: 'student', example: 'Bapak Hendra' },
  { key: '{{nomor_ortu}}', label: 'No. WhatsApp Orang Tua', category: 'student', example: '081234567890' },
  { key: '{{kelas}}', label: 'Jenjang / Detail Kelas', category: 'student', example: 'Kelas 5 SD' },
  { key: '{{tipe_kelas}}', label: 'Tipe Kelas', category: 'student', example: 'Privat / Grup' },
  { key: '{{jenjang}}', label: 'Tingkat Jenjang', category: 'student', example: 'SD' },
  { key: '{{nama_tutor}}', label: 'Nama Tutor Pengajar', category: 'student', example: 'Kak Sarah Amalia, S.Si.' },

  // Billing / SPP Variables
  { key: '{{bulan}}', label: 'Bulan Tagihan/Laporan', category: 'billing', example: 'Agustus' },
  { key: '{{tahun}}', label: 'Tahun', category: 'billing', example: '2026' },
  { key: '{{jumlah_sesi}}', label: 'Total Kehadiran / Sesi', category: 'billing', example: '8' },
  { key: '{{tarif_per_sesi}}', label: 'Tarif per Sesi', category: 'billing', example: 'Rp 50.000' },
  { key: '{{daftar_tanggal}}', label: 'Daftar Tanggal Hadir', category: 'billing', example: '03/08, 06/08, 10/08' },
  { key: '{{total_tagihan}}', label: 'Nominal Total Tagihan', category: 'billing', example: 'Rp 400.000' },
  { key: '{{sudah_dibayar}}', label: 'Nominal Sudah Dibayar', category: 'billing', example: 'Rp 200.000' },
  { key: '{{sisa_tagihan}}', label: 'Sisa Kurang Bayar', category: 'billing', example: 'Rp 200.000' },
  { key: '{{status_bayar}}', label: 'Status Pembayaran', category: 'billing', example: 'Belum Bayar / Sebagian / Lunas' },

  // Bimbel Profile Variables
  { key: '{{nama_bimbel}}', label: 'Nama Resmi Bimbel', category: 'bimbel', example: 'BIMBEL SIGMA' },
  { key: '{{tagline_bimbel}}', label: 'Slogan / Tagline Bimbel', category: 'bimbel', example: 'Belajar Sampai Paham' },
  { key: '{{telepon_bimbel}}', label: 'No. Telepon / CS Bimbel', category: 'bimbel', example: '0812-3456-7890' },
  { key: '{{alamat_bimbel}}', label: 'Alamat / Lokasi Bimbel', category: 'bimbel', example: 'Jl. Pemuda No. 12' },
  { key: '{{rekening_bimbel}}', label: 'Info Rekening Bank Bimbel', category: 'bimbel', example: 'BCA: 8830-1234-56 a.n Bimbel' },
];
