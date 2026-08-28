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
};

export interface WhatsAppTemplateData {
  nama_siswa?: string;
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
  { key: '{{nama_siswa}}', label: 'Nama Lengkap Siswa', example: 'Naureen Zevania' },
  { key: '{{nis}}', label: 'Kode / NIS Siswa', example: 'NAUREEN' },
  { key: '{{nama_ortu}}', label: 'Nama Orang Tua / Wali', example: 'Bapak Hendra' },
  { key: '{{kelas}}', label: 'Jenjang / Detail Kelas', example: 'Kelas 5 SD' },
  { key: '{{tipe_kelas}}', label: 'Tipe Kelas', example: 'Privat / Grup' },
  { key: '{{bulan}}', label: 'Bulan Tagihan/Laporan', example: 'Agustus' },
  { key: '{{tahun}}', label: 'Tahun', example: '2026' },
  { key: '{{jumlah_sesi}}', label: 'Total Kehadiran / Sesi', example: '8' },
  { key: '{{tarif_per_sesi}}', label: 'Tarif per Sesi', example: 'Rp 50.000' },
  { key: '{{daftar_tanggal}}', label: 'Daftar Tanggal Hadir', example: '03/08, 06/08, 10/08' },
  { key: '{{total_tagihan}}', label: 'Nominal Total Tagihan', example: 'Rp 400.000' },
  { key: '{{sudah_dibayar}}', label: 'Nominal Sudah Dibayar', example: 'Rp 200.000' },
  { key: '{{sisa_tagihan}}', label: 'Sisa Kurang Bayar', example: 'Rp 200.000' },
  { key: '{{status_bayar}}', label: 'Status Pembayaran', example: 'Belum Bayar / Sebagian / Lunas' },
  { key: '{{rekening_bimbel}}', label: 'Info Rekening Bank Bimbel', example: 'BCA: 8830-1234-56 a.n Bimbel' },
  { key: '{{nama_bimbel}}', label: 'Nama Resmi Bimbel', example: 'BIMBEL SIGMA' },
  { key: '{{tagline_bimbel}}', label: 'Slogan / Tagline Bimbel', example: 'Belajar Sampai Paham' },
  { key: '{{telepon_bimbel}}', label: 'No. Telepon / CS Bimbel', example: '0812-3456-7890' },
  { key: '{{nama_tutor}}', label: 'Nama Tutor Pengajar', example: 'Kak Sarah Amalia, S.Si.' },
];
