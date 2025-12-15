// utils/calculateArchiveStatus.ts
import { getClassificationRule } from "./classificationRules";

export type ArchiveStatus = "ACTIVE" | "INACTIVE" | "DISPOSE_ELIGIBLE";

export interface ArchiveStatusCalculation {
  status: ArchiveStatus;
  yearsFromDate: number;
  retensiAktifYears: number;
  retensiInaktifYears: number;
  totalRetensiYears: number;
  isInActivePhase: boolean;
  isInInactivePhase: boolean;
  shouldBeDisposed: boolean;
}

/**
 * Menghitung status arsip berdasarkan tanggal surat dan klasifikasi
 *
 * Logika:
 * - ACTIVE: 0-2 tahun dari tanggal surat (fase retensi aktif)
 * - INACTIVE: 2 tahun sampai (2 + retensiInaktif) tahun (fase retensi inaktif)
 * - DISPOSE_ELIGIBLE: Lebih dari (2 + retensiInaktif) tahun (siap musnah)
 *
 * @param tanggalSurat - Tanggal surat dari arsip
 * @param klasifikasi - Kode klasifikasi arsip (misal: "UM.01", "HK.02")
 * @returns Status arsip dan informasi perhitungan
 */
export function calculateArchiveStatus(
  tanggalSurat: string | Date | null | undefined,
  klasifikasi: string | null | undefined
): ArchiveStatusCalculation {
  // Default values jika data tidak lengkap
  const defaultRetensiAktif = 2;
  const defaultRetensiInaktif = 0;

  // Jika tidak ada tanggal surat, default ke ACTIVE
  if (!tanggalSurat) {
    return {
      status: "ACTIVE",
      yearsFromDate: 0,
      retensiAktifYears: defaultRetensiAktif,
      retensiInaktifYears: defaultRetensiInaktif,
      totalRetensiYears: defaultRetensiAktif + defaultRetensiInaktif,
      isInActivePhase: true,
      isInInactivePhase: false,
      shouldBeDisposed: false,
    };
  }

  // Parse tanggal
  const suratDate =
    typeof tanggalSurat === "string" ? new Date(tanggalSurat) : tanggalSurat;

  // Hitung selisih tahun dari tanggal surat sampai sekarang
  const now = new Date();
  const diffTime = now.getTime() - suratDate.getTime();
  const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25); // Menggunakan 365.25 untuk akurasi leap year

  // Dapatkan aturan retensi dari klasifikasi
  let retensiAktif = defaultRetensiAktif;
  let retensiInaktif = defaultRetensiInaktif;

  if (klasifikasi) {
    const rule = getClassificationRule(klasifikasi);
    if (rule) {
      retensiAktif = rule.retensiAktif;
      retensiInaktif = rule.retensiInaktif;
    }
  }

  const totalRetensi = retensiAktif + retensiInaktif;

  // Tentukan status berdasarkan umur dokumen
  let status: ArchiveStatus;
  let isInActivePhase = false;
  let isInInactivePhase = false;
  let shouldBeDisposed = false;

  if (diffYears <= retensiAktif) {
    // Fase Aktif: 0 - 2 tahun
    status = "ACTIVE";
    isInActivePhase = true;
  } else if (diffYears <= totalRetensi) {
    // Fase Inaktif: 2 tahun - (2 + retensiInaktif) tahun
    status = "INACTIVE";
    isInInactivePhase = true;
  } else {
    // Siap Musnah: Lebih dari (2 + retensiInaktif) tahun
    status = "DISPOSE_ELIGIBLE";
    shouldBeDisposed = true;
  }

  return {
    status,
    yearsFromDate: Math.floor(diffYears * 10) / 10, // Round to 1 decimal
    retensiAktifYears: retensiAktif,
    retensiInaktifYears: retensiInaktif,
    totalRetensiYears: totalRetensi,
    isInActivePhase,
    isInInactivePhase,
    shouldBeDisposed,
  };
}

/**
 * Batch calculate status untuk banyak arsip sekaligus
 */
export function calculateArchiveStatusBatch(
  archives: Array<{
    tanggal: string | Date | null;
    klasifikasi: string | null;
  }>
): ArchiveStatusCalculation[] {
  return archives.map((archive) =>
    calculateArchiveStatus(archive.tanggal, archive.klasifikasi)
  );
}

/**
 * Helper untuk mendapatkan hanya status tanpa detail perhitungan
 */
export function getArchiveStatus(
  tanggalSurat: string | Date | null | undefined,
  klasifikasi: string | null | undefined
): ArchiveStatus {
  return calculateArchiveStatus(tanggalSurat, klasifikasi).status;
}
