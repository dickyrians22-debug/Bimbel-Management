import * as XLSX from 'xlsx';
import { toPng } from 'html-to-image';
import { Student, AttendanceRecord, IncomeRecord, ExpenseRecord } from '../types';
import { getMonthNameIndo } from './storage';

/**
 * Universal Excel Exporter (.xlsx)
 * Converts any structured object array into a formatted Excel workbook and triggers download.
 */
export const exportToExcel = (data: Record<string, any>[], fileName: string, sheetName: string = 'Data'): boolean => {
  try {
    if (!data || data.length === 0) {
      alert('Tidak ada data yang tersedia untuk diunduh.');
      return false;
    }

    // Create Worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Calculate auto column widths
    const colKeys = Object.keys(data[0] || {});
    const colWidths = colKeys.map((key) => {
      let maxLen = key.length;
      data.forEach((row) => {
        const valStr = row[key] !== undefined && row[key] !== null ? String(row[key]) : '';
        if (valStr.length > maxLen) maxLen = valStr.length;
      });
      return { wch: Math.min(Math.max(maxLen + 4, 12), 45) };
    });
    worksheet['!cols'] = colWidths;

    // Create Workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));

    // Generate clean filename
    const dateStamp = new Date().toISOString().slice(0, 10);
    const cleanFileName = `${fileName.replace(/[/\\?%*:|"<>]/g, '_')}_${dateStamp}.xlsx`;

    // Trigger download
    XLSX.writeFile(workbook, cleanFileName);
    return true;
  } catch (error) {
    console.error('Gagal mengekspor file Excel:', error);
    alert('Terjadi kesalahan saat membuat file Excel. Silakan coba lagi.');
    return false;
  }
};

/**
 * High-Resolution PNG Image Exporter
 * Renders any DOM element (e.g. Receipt, Salary Slip, Student Card) into a crisp PNG file.
 */
export const exportElementToPng = async (
  target: HTMLElement | string,
  fileName: string
): Promise<boolean> => {
  try {
    const node = typeof target === 'string' ? document.getElementById(target) : target;
    if (!node) {
      alert('Elemen tampilan tidak ditemukan untuk diunduh.');
      return false;
    }

    // Render to PNG with 2.5x pixel ratio for sharp print-grade quality
    // skipFonts: true prevents CORS SecurityError when reading document.styleSheets for Google Fonts
    const dataUrl = await toPng(node, {
      quality: 0.98,
      pixelRatio: 2.5,
      backgroundColor: '#ffffff',
      skipFonts: true,
      cacheBust: false,
      filter: (childNode) => {
        // Exclude elements with .no-print or .no-export class
        if (childNode instanceof HTMLElement) {
          if (childNode.classList.contains('no-print') || childNode.classList.contains('no-export')) {
            return false;
          }
        }
        return true;
      },
    });

    // Create download trigger
    const link = document.createElement('a');
    const cleanFileName = `${fileName.replace(/[/\\?%*:|"<>]/g, '_')}.png`;
    link.download = cleanFileName;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return true;
  } catch (error) {
    console.error('Gagal mengunduh gambar:', error);
    alert('Terjadi kesalahan saat menghasilkan gambar. Silakan coba lagi.');
    return false;
  }
};

// ==========================================
// DATA TRANSFORMATION FORMATTERS FOR EXCEL
// ==========================================

export const formatStudentsForExcel = (students: Student[]) => {
  return students.map((s, idx) => ({
    'No': idx + 1,
    'Kode Siswa': s.code || '-',
    'Nama Lengkap Siswa': s.name,
    'Tingkat Pendidikan': s.level,
    'Kelas Spesifik / Jurusan': s.gradeDetail || '-',
    'Jenis Kelas': s.classType,
    'Tarif Per Pertemuan / Sesi (Rp)': s.pricePerSession || 0,
    'Status Keanggotaan': s.status,
    'Nama Orang Tua / Wali': s.parentName || '-',
    'No. WhatsApp Ortu / Siswa': s.parentPhone || '-',
    'Tutor Utama Pembina': s.tutorName || '-',
    'Alamat Rumah Siswa': s.address || '-',
    'Target Belajar & Catatan Khusus': s.notes || '-',
  }));
};

export const formatAttendanceForExcel = (attendance: AttendanceRecord[]) => {
  return attendance.map((a, idx) => ({
    'No': idx + 1,
    'Tanggal': a.date,
    'Jam': a.time,
    'Kode Siswa': a.studentCode || '-',
    'Nama Siswa': a.studentName,
    'Status Kehadiran': a.status,
    'Topik / Materi Pembelajaran': a.topic || '-',
    'Tutor Pengajar': a.tutorName || '-',
    'Catatan Tutor': a.tutorNotes || '-',
  }));
};

export const formatBillingsForExcel = (billings: any[]) => {
  return billings.map((b, idx) => ({
    'No': idx + 1,
    'Periode Bulan': b.periodMonth ? `${getMonthNameIndo(b.periodMonth)} ${b.periodYear}` : `${b.periodYear}`,
    'Kode Siswa': b.studentCode || '-',
    'Nama Siswa': b.studentName,
    'Tingkat': b.level || '-',
    'Tipe Kelas': b.classType || '-',
    'Model Tagihan': b.packageType === 'session_pack' ? 'Paket Sesi' : 'Bulanan',
    'Total Tagihan (Rp)': b.totalBill || 0,
    'Jumlah Terbayar (Rp)': b.paidAmount || 0,
    'Sisa Tagihan (Rp)': b.remainingBill || 0,
    'Status Pembayaran': b.status || 'Belum Lunas',
    'Tanggal Bayar Terakhir': b.lastPaymentDate || '-',
    'No. Kwitansi Terakhir': b.lastReceiptNumber || '-',
  }));
};

export const formatIncomesForExcel = (incomes: IncomeRecord[]) => {
  return incomes.map((inc, idx) => ({
    'No': idx + 1,
    'No. Kwitansi': inc.receiptNumber,
    'Tanggal Penerimaan': inc.datePaid,
    'Kategori': inc.incomeCategory === 'session_pack'
      ? 'Paket Sesi'
      : inc.incomeCategory === 'registration'
      ? 'Pendaftaran'
      : inc.incomeCategory === 'general'
      ? 'Kas Masuk Umum'
      : 'SPP Bulanan',
    'Nama Siswa / Pembayar': inc.studentName || inc.sourceName || '-',
    'Kode Siswa': inc.studentCode || '-',
    'Periode': inc.accrualMonth ? `${getMonthNameIndo(inc.accrualMonth)} ${inc.accrualYear}` : '-',
    'Metode Pembayaran': inc.paymentMethod,
    'Jumlah Masuk (Rp)': inc.amount,
    'Sisa Tagihan (Rp)': inc.remainingBill || 0,
    'Penerima': inc.receivedBy || 'Admin',
    'Keterangan': inc.notes || '-',
  }));
};

export const formatExpensesForExcel = (expenses: ExpenseRecord[]) => {
  return expenses.map((exp, idx) => ({
    'No': idx + 1,
    'No. Referensi': exp.receiptRef || '-',
    'Tanggal Pengeluaran': exp.date,
    'Kategori': exp.category,
    'Deskripsi / Keperluan': exp.description || exp.title || '-',
    'Jumlah Pengeluaran (Rp)': exp.amount,
    'Metode Pembayaran': exp.paymentMethod || '-',
    'Dibayarkan Kepada / Penerima': exp.recipient || exp.paidTo || '-',
    'Disetujui Oleh': exp.approvedBy || '-',
    'Keterangan': exp.notes || '-',
  }));
};

export const formatCashBookForExcel = (incomes: IncomeRecord[], expenses: ExpenseRecord[]) => {
  // Combine all transactions sorted by date
  type CombinedRow = {
    date: string;
    ref: string;
    type: 'Pemasukan' | 'Pengeluaran';
    category: string;
    description: string;
    incomeAmount: number;
    expenseAmount: number;
    method: string;
    pic: string;
  };

  const combined: CombinedRow[] = [];

  incomes.forEach((inc) => {
    combined.push({
      date: inc.datePaid,
      ref: inc.receiptNumber,
      type: 'Pemasukan',
      category: inc.category || 'Iuran SPP / Les',
      description: `${inc.studentName ? `Pembayaran dari ${inc.studentName} (${inc.studentCode || ''})` : inc.sourceName || ''} - ${inc.notes || ''}`.trim(),
      incomeAmount: inc.amount,
      expenseAmount: 0,
      method: inc.paymentMethod,
      pic: inc.receivedBy || 'Admin',
    });
  });

  expenses.forEach((exp) => {
    combined.push({
      date: exp.date,
      ref: exp.receiptRef || '-',
      type: 'Pengeluaran',
      category: exp.category,
      description: `${exp.description || exp.title || ''} ${exp.recipient || exp.paidTo ? `(Penerima: ${exp.recipient || exp.paidTo})` : ''}`.trim(),
      incomeAmount: 0,
      expenseAmount: exp.amount,
      method: exp.paymentMethod || '-',
      pic: exp.approvedBy || 'Admin',
    });
  });

  // Sort ascending by date
  combined.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let runningBalance = 0;
  return combined.map((row, idx) => {
    runningBalance += row.incomeAmount - row.expenseAmount;
    return {
      'No': idx + 1,
      'Tanggal': row.date,
      'No. Ref / Kwitansi': row.ref,
      'Jenis': row.type,
      'Kategori': row.category,
      'Keterangan / Deskripsi': row.description,
      'Pemasukan (Rp)': row.incomeAmount,
      'Pengeluaran (Rp)': row.expenseAmount,
      'Saldo Kumulatif (Rp)': runningBalance,
      'Metode': row.method,
      'Penanggung Jawab': row.pic,
    };
  });
};

export const formatAttendanceMatrixForExcel = (
  students: Student[],
  matrixData: Record<string, {
    days?: Record<number, any>;
    hadirCount?: number;
    izinCount?: number;
    sakitCount?: number;
    alphaCount?: number;
    totalCount?: number;
    percentage?: number;
    [key: string]: any;
  }>,
  daysArray: number[]
) => {
  return students.map((s, idx) => {
    const data = matrixData[s.id];
    const rowObj: Record<string, any> = {
      'No': idx + 1,
      'NIS / Kode': s.code || '-',
      'Nama Siswa': s.name,
      'Jenjang / Tingkat': s.gradeDetail || s.level,
      'Tipe Kelas': s.classType,
      'Tutor Pembimbing': s.tutorName || '-',
    };

    daysArray.forEach((d) => {
      const dayData = data?.days?.[d];
      rowObj[`Tgl ${d}`] = !dayData ? '-' : dayData.status === 'Hadir' ? 'H' : dayData.status === 'Izin' ? 'I' : dayData.status === 'Sakit' ? 'S' : 'A';
    });

    rowObj['Hadir (H)'] = data?.hadirCount || 0;
    rowObj['Izin (I)'] = data?.izinCount || 0;
    rowObj['Sakit (S)'] = data?.sakitCount || 0;
    rowObj['Alpha (A)'] = data?.alphaCount || 0;
    rowObj['Total Sesi'] = data?.totalCount || 0;
    rowObj['% Kehadiran'] = `${data?.percentage || 0}%`;

    return rowObj;
  });
};

export const formatSalariesForExcel = (salaryRecords: any[], periodMonth: number, periodYear: number) => {
  return salaryRecords.map((s, idx) => ({
    'No': idx + 1,
    'Periode': `${getMonthNameIndo(periodMonth)} ${periodYear}`,
    'Nama Tutor': s.tutorName,
    'Username Akun': s.username || '-',
    'Total Sesi Mengajar': s.totalSessions || s.sessionCount || 0,
    'Honor Per Sesi (Rp)': s.baseRatePerSession || 0,
    'Total Honor Sesi (Rp)': s.totalBaseHonor || 0,
    'Bonus & Insentif (Rp)': s.bonusAmount || 0,
    'Potongan / Kasbon (Rp)': s.deductionAmount || 0,
    'Gaji Bersih / Take Home Pay (Rp)': s.netSalary || 0,
    'Status Pembayaran': s.status || 'Draft',
    'Tanggal Transfer / Bayar': s.paidDate || '-',
    'Catatan': s.notes || '-',
  }));
};
