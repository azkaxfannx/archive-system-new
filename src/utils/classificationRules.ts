// utils/classificationRules.ts
export interface ClassificationRule {
  code: string;
  name: string;
  retentionYears: number;
  description?: string;
}

export const CLASSIFICATION_RULES: ClassificationRule[] = [
  {
    code: "KU",
    name: "Keuangan & Kepegawaian",
    retentionYears: 10,
    description: "Dokumen kepegawaian terkait mutasi pegawai",
  },
  {
    code: "TEK",
    name: "Teknis",
    retentionYears: 5,
    description: "Dokumen struktur organisasi",
  },
  {
    code: "PR",
    name: "Perlengkapan",
    retentionYears: 7,
    description: "Perlengkapan kantor dan inventaris",
  },
  // Tambahkan aturan klasifikasi lainnya sesuai kebutuhan
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

export function validateRetentionYear(
  classification: string,
  retentionYears: number
): boolean {
  const rule = getClassificationRule(classification);
  if (!rule) return true; // Jika tidak ada aturan, dianggap valid
  return rule.retentionYears === retentionYears;
}

export interface RetentionMismatch {
  row: number;
  classification: string;
  currentRetention: number;
  expectedRetention: number;
  ruleName: string;
}
