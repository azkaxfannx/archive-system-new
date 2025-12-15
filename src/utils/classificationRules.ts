// utils/classificationRules.ts
export interface ClassificationRule {
  code: string;
  name: string;
  retensiAktif: number; // Selalu 2 tahun untuk semua
  retensiInaktif: number; // Berbeda-beda sesuai klasifikasi
  description?: string;
}

export const CLASSIFICATION_RULES: ClassificationRule[] = [
  {
    code: "DL",
    name: "Pendidikan & Pelatihan",
    retensiAktif: 2,
    retensiInaktif: 3,
    description: "",
  },
  {
    code: "UM",
    name: "Umum",
    retensiAktif: 2,
    retensiInaktif: 0, // Total 2 tahun (2 aktif + 0 inaktif)
    description: "Dokumen umum dan surat menyurat",
  },
  {
    code: "HK",
    name: "Hukum",
    retensiAktif: 2,
    retensiInaktif: 4,
    description: "",
  },
  {
    code: "HM",
    name: "Kehumasan",
    retensiAktif: 2,
    retensiInaktif: 3,
    description: "",
  },
  {
    code: "KL",
    name: "K3L",
    retensiAktif: 2,
    retensiInaktif: 3,
    description: "",
  },
  {
    code: "KP",
    name: "Kepegawaian",
    retensiAktif: 2,
    retensiInaktif: 3,
    description: "",
  },
  {
    code: "KS",
    name: "Kerjasama",
    retensiAktif: 2,
    retensiInaktif: 3,
    description: "",
  },
  {
    code: "KU",
    name: "Keuangan",
    retensiAktif: 2,
    retensiInaktif: 8,
    description: "",
  },
  {
    code: "MK",
    name: "Manajemen Kearsipan",
    retensiAktif: 2,
    retensiInaktif: 3,
    description: "",
  },
  {
    code: "OT",
    name: "Organisasi dan Tatalaksana",
    retensiAktif: 2,
    retensiInaktif: 5,
    description: "",
  },
  {
    code: "PD",
    name: "Pengadaan",
    retensiAktif: 2,
    retensiInaktif: 8,
    description: "",
  },
  {
    code: "PJ",
    name: "Pelayanan Jasa Kapal",
    retensiAktif: 2,
    retensiInaktif: 3,
    description: "",
  },
  {
    code: "PP",
    name: "Pengelolaan Aset & Properti Perusahaan",
    retensiAktif: 2,
    retensiInaktif: 8,
    description: "",
  },
  {
    code: "PR",
    name: "Perencanaan",
    retensiAktif: 2,
    retensiInaktif: 3,
    description: "",
  },
  {
    code: "PS",
    name: "Pemasaran",
    retensiAktif: 2,
    retensiInaktif: 3,
    description: "",
  },
  {
    code: "PU",
    name: "Pengembangan Bisnis",
    retensiAktif: 2,
    retensiInaktif: 3,
    description: "",
  },
  {
    code: "PW",
    name: "Pengawasan",
    retensiAktif: 2,
    retensiInaktif: 5,
    description: "",
  },
  {
    code: "RT",
    name: "Rumah Tangga",
    retensiAktif: 2,
    retensiInaktif: 5,
    description: "",
  },
  {
    code: "SI",
    name: "Sistem Informasi",
    retensiAktif: 2,
    retensiInaktif: 5,
    description: "",
  },
  {
    code: "SK",
    name: "Kesertariatan",
    retensiAktif: 2,
    retensiInaktif: 4,
    description: "",
  },
  {
    code: "TL",
    name: "Tanggung Jawab Sosial & Lingkungan",
    retensiAktif: 2,
    retensiInaktif: 8,
    description: "",
  },
];

export function getClassificationRule(
  classification: string
): ClassificationRule | null {
  const prefix = classification.split(".")[0].toLowerCase();
  return (
    CLASSIFICATION_RULES.find((rule) => rule.code.toLowerCase() === prefix) ||
    null
  );
}

// Fungsi untuk validasi retensi aktif (harus selalu 2 tahun)
export function validateRetensiAktif(retensiAktif: number): boolean {
  return retensiAktif === 2;
}

// Interface untuk mismatch - HANYA RETENSI AKTIF dari Excel
export interface RetentionMismatch {
  row: number;
  classification: string;
  currentRetensiAktif: number;
  expectedRetensiAktif: number;
  ruleName: string;
  retensiInaktifInfo: number; // Info saja, bukan dari Excel
}

// Fungsi validasi untuk import - HANYA CEK RETENSI AKTIF dari Excel
export function validateRetentionFromExcel(
  classification: string,
  retensiAktif: number
): { valid: boolean; rule: ClassificationRule | null } {
  const rule = getClassificationRule(classification);
  if (!rule) return { valid: true, rule: null }; // Tidak ada aturan = valid

  const aktifValid = retensiAktif === rule.retensiAktif;

  return { valid: aktifValid, rule };
}
