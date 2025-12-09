// types/archive.ts - Complete Updated Version with Usulan Status

// Archive record interface
export interface ArchiveRecord {
  id: string;
  kodeUnit?: string;
  indeks?: string;
  nomorBerkas?: string;
  nomorIsiBerkas?: string;
  judulBerkas?: string;
  jenisNaskahDinas?: string;
  nomorSurat?: string;
  klasifikasi?: string;
  perihal?: string;
  tanggal?: string;
  tingkatPerkembangan?: string;
  kondisi?: string;
  lokasiSimpan?: string;
  retensiAktif?: string;
  retensiInaktif?: string;
  keterangan?: string;
  entryDate: string;
  retentionYears: number;
  status: "ACTIVE" | "INACTIVE" | "DISPOSE_ELIGIBLE";
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    role: "ADMIN" | "USER";
  };
  serahTerima?: SerahTerimaRecord;
}

// Form data interface
export interface ArchiveFormData {
  kodeUnit?: string;
  indeks?: string;
  nomorBerkas?: string;
  nomorIsiBerkas?: string;
  judulBerkas?: string;
  jenisNaskahDinas?: string;
  nomorSurat?: string;
  klasifikasi?: string;
  perihal?: string;
  tanggal?: string;
  tingkatPerkembangan?: string;
  kondisi?: string;
  lokasiSimpan?: string;
  retensiAktif?: string;
  retensiInaktif?: string;
  keterangan?: string;
  entryDate?: string;
  retentionYears?: number;
  status?: "ACTIVE" | "INACTIVE" | "DISPOSE_ELIGIBLE";
}

// Peminjaman interfaces
export interface PeminjamanRecord {
  id: string;
  nomorSurat: string;
  peminjam: string;
  keperluan: string;
  tanggalPinjam: string;
  tanggalHarusKembali: string;
  tanggalPengembalian?: string | null;
  archiveId: string;
  archive: ArchiveRecord;
  createdAt: string;
  updatedAt: string;
}

export interface PeminjamanFormData {
  nomorSurat: string;
  peminjam: string;
  keperluan: string;
  tanggalPinjam?: string;
  tanggalHarusKembali?: string;
  tanggalPengembalian?: string | null;
  archiveId: string;
}

// ========== SERAH TERIMA INTERFACES (UPDATED) ==========

// Status usulan enum
export type StatusUsulan = "PENDING" | "APPROVED" | "REJECTED";

// SerahTerima record with usulan status
export interface SerahTerimaRecord {
  id: string;
  
  // Usulan fields (always filled)
  pihakPenyerah: string;
  pihakPenerima: string;
  tanggalUsulan: string;
  statusUsulan: StatusUsulan;
  
  // Approval fields (nullable - only filled when approved)
  nomorBeritaAcara: string | null;
  tanggalSerahTerima: string | null;
  keterangan: string | null;
  
  // Rejection field (nullable - only filled when rejected)
  alasanPenolakan: string | null;
  
  archiveId: string;
  archive?: {
    id: string;
    judulBerkas?: string;
    nomorBerkas?: string;
    klasifikasi?: string;
    nomorSurat?: string;
    perihal?: string;
    tanggal?: string;
    lokasiSimpan?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Form data for creating usulan (simplified)
export interface SerahTerimaUsulanFormData {
  pihakPenyerah: string;
  pihakPenerima: string;
  archiveId: string;
}

// Form data for approval
export interface SerahTerimaApprovalFormData {
  nomorBeritaAcara: string;
  tanggalSerahTerima: string;
  keterangan?: string;
}

// Legacy form data (for backward compatibility and editing approved)
export interface SerahTerimaFormData {
  nomorBeritaAcara?: string;
  pihakPenyerah: string;
  pihakPenerima: string;
  tanggalSerahTerima?: string;
  keterangan?: string | null;
  archiveId: string;
}

// Pagination interface
export interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// API response interface
export interface ArchiveResponse {
  data: ArchiveRecord[];
  pagination: PaginationData;
}

// Search/filter parameters
export interface ArchiveParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
  status?: string;
  filters?: Record<string, string>;
  startMonth?: string;
  endMonth?: string;
  year?: string;
}

// Import result interface
export interface ImportResult {
  importJobId: string;
  totalRows: number;
  successRows: number;
  failedRows: number;
  errors: ImportError[];
  hasRetentionMismatches?: boolean;
  retentionMismatches?: any[];
  message?: string;
}

// Import error interface
export interface ImportError {
  row: number;
  error: string;
  data: Record<string, any>;
}

// User interface (for header component)
export interface User {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
}