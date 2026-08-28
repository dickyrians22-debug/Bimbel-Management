/**
 * Utility untuk kompresi foto profil otomatis di browser (Client-Side)
 * Mengubah gambar resolusi tinggi menjadi avatar optimal 100-120px
 * Ukuran output sangat ringan: ~4 - 8 KB saja! (Zero Bloat)
 */

export interface CompressionResult {
  dataUrl: string;
  sizeKb: number;
  width: number;
  height: number;
  originalSizeKb: number;
}

export async function compressImageFile(
  file: File,
  options: {
    maxDimension?: number;
    quality?: number;
  } = {}
): Promise<CompressionResult> {
  const maxDimension = options.maxDimension || 120; // 120x120 px ideal untuk layar Retina/HD avatar
  const quality = options.quality ?? 0.75; // Keseimbangan ketajaman dan ukuran < 8 KB

  const originalSizeKb = Math.round((file.size / 1024) * 10) / 10;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('Gagal membaca file gambar yang dipilih.'));
    };

    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => {
        reject(new Error('Format file gambar tidak valid atau rusak.'));
      };

      img.onload = () => {
        try {
          // Buat Canvas HTML5 untuk cropping persegi (1:1) dan resize
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d', { willReadFrequently: false });

          if (!ctx) {
            reject(new Error('Browser tidak mendukung canvas 2D.'));
            return;
          }

          // Hitung center-crop persegi (Aspect Ratio 1:1)
          const srcW = img.width;
          const srcH = img.height;
          const minSrcDim = Math.min(srcW, srcH);
          const srcX = (srcW - minSrcDim) / 2;
          const srcY = (srcH - minSrcDim) / 2;

          // Dimensi target
          canvas.width = maxDimension;
          canvas.height = maxDimension;

          // Haluskan render gambar
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Bersihkan canvas dan gambar crop di tengah
          ctx.clearRect(0, 0, maxDimension, maxDimension);
          ctx.drawImage(
            img,
            srcX,
            srcY,
            minSrcDim,
            minSrcDim,
            0,
            0,
            maxDimension,
            maxDimension
          );

          // Coba ekspor ke format WebP (paling efisien), fallback ke JPEG
          let dataUrl = '';
          try {
            dataUrl = canvas.toDataURL('image/webp', quality);
            if (!dataUrl.startsWith('data:image/webp')) {
              dataUrl = canvas.toDataURL('image/jpeg', quality);
            }
          } catch {
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }

          // Hitung perkiraan ukuran byte dari base64 string
          const stringLength = dataUrl.length - 'data:image/webp;base64,'.length;
          const sizeInBytes = 4 * Math.ceil(stringLength / 3) * 0.562489; // Perkiraan byte real
          const sizeKb = Math.round((sizeInBytes / 1024) * 10) / 10;

          resolve({
            dataUrl,
            sizeKb,
            width: maxDimension,
            height: maxDimension,
            originalSizeKb,
          });
        } catch (err) {
          reject(err);
        }
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Ekstrak 1-2 huruf inisial dari nama pengguna
 * Contoh: "Budi Santoso" -> "BS", "Sarah" -> "S", "Dimas Pratama" -> "DP"
 */
export function getInitials(name?: string): string {
  if (!name || !name.trim()) return '?';
  // Hapus gelar seperti S.Pd, S.Si, M.Pd, Kak, dsb jika ada untuk inisial yang bersih
  const cleanName = name
    .replace(/\b(Kak|Pak|Bu|S\.Pd|S\.Si|M\.Pd|S\.Kom|S\.T|Dr|Ir)\b\.?/gi, '')
    .trim();

  const parts = (cleanName || name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Palet warna gradasi harmonis untuk Avatar Inisial berdasarkan hash nama/role
 */
const AVATAR_GRADIENTS = [
  'from-indigo-600 to-indigo-800 text-white',
  'from-teal-600 to-emerald-700 text-white',
  'from-amber-500 to-orange-600 text-white',
  'from-rose-600 to-pink-700 text-white',
  'from-violet-600 to-purple-800 text-white',
  'from-blue-600 to-cyan-700 text-white',
  'from-cyan-600 to-teal-700 text-white',
  'from-emerald-600 to-green-700 text-white',
];

export function getAvatarGradient(name?: string, role?: string): string {
  if (role === 'owner') return 'from-amber-500 to-orange-600 text-white shadow-amber-500/20';
  if (role === 'tutor') return 'from-teal-600 to-emerald-700 text-white shadow-teal-500/20';
  if (role === 'siswa') return 'from-indigo-600 to-violet-700 text-white shadow-indigo-500/20';

  if (!name) return AVATAR_GRADIENTS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[index];
}
