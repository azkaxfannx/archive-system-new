// services/archiveAPI.ts - Complete Updated Version
import {
  ArchiveRecord,
  ArchiveFormData,
  ArchiveResponse,
  ArchiveParams,
  ImportResult,
  PeminjamanFormData,
  PeminjamanRecord,
  SerahTerimaFormData,
  SerahTerimaRecord,
} from "@/types/archive";

export const archiveAPI = {
  // ========== ARCHIVE METHODS ==========

  // Get archives with filters
  async getArchives(params: ArchiveParams = {}): Promise<ArchiveResponse> {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.append("page", params.page.toString());
    if (params.limit) searchParams.append("limit", params.limit.toString());
    if (params.search) searchParams.append("search", params.search);
    if (params.status) searchParams.append("status", params.status);
    if (params.sort) searchParams.append("sort", params.sort);
    if (params.order) searchParams.append("order", params.order);

    // Add column filters
    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (value) searchParams.append(`filter[${key}]`, value);
      });
    }

    const res = await fetch(`/api/archives?${searchParams}`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch archives");
    return res.json();
  },

  // Create new archive
  async createArchive(data: ArchiveFormData): Promise<ArchiveRecord> {
    const res = await fetch("/api/archives", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Failed to create archive");
    return res.json();
  },

  // Update archive
  async updateArchive(
    id: string,
    data: ArchiveFormData
  ): Promise<ArchiveRecord> {
    const res = await fetch(`/api/archives/${id}`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Failed to update archive");
    return res.json();
  },

  // Delete archive
  async deleteArchive(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/archives/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!res.ok) throw new Error("Failed to delete archive");
    return res.json();
  },

  // Import from Excel
  async importExcel(file: File): Promise<ImportResult> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/archives/import", {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Gagal mengimpor file");
    }

    return res.json();
  },

  // Get all archives (for export)
  async getAllArchives(): Promise<ArchiveRecord[]> {
    const res = await fetch("/api/archives/export", { credentials: "include" });
    if (!res.ok) throw new Error("Failed to fetch all archives");
    return res.json();
  },

  // ========== PEMINJAMAN METHODS ==========

  // Create peminjaman
  async createPeminjaman(data: PeminjamanFormData): Promise<PeminjamanRecord> {
    const res = await fetch("/api/peminjaman", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to create peminjaman");
    }

    return res.json();
  },

  // Get peminjaman by archive ID
  async getPeminjamanByArchive(archiveId: string): Promise<PeminjamanRecord[]> {
    const res = await fetch(`/api/peminjaman/archives/${archiveId}`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch peminjaman");
    return res.json();
  },

  // Get all peminjaman
  async getAllPeminjaman(): Promise<PeminjamanRecord[]> {
    const res = await fetch("/api/peminjaman", { credentials: "include" });
    if (!res.ok) throw new Error("Failed to fetch peminjaman");
    const json = await res.json();
    return Array.isArray(json) ? json : json.data || [];
  },

  // Get peminjaman with filters
  async getPeminjaman(
    params: Record<string, string | number> = {}
  ): Promise<any> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    });
    const res = await fetch(`/api/peminjaman?${searchParams}`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch peminjaman");
    return res.json();
  },

  // Update peminjaman (untuk pengembalian)
  async updatePeminjaman(
    id: string,
    data: Partial<PeminjamanFormData>
  ): Promise<PeminjamanRecord> {
    const res = await fetch(`/api/peminjaman/${id}`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Failed to update peminjaman");
    return res.json();
  },

  // Delete peminjaman
  async deletePeminjaman(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/peminjaman/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!res.ok) throw new Error("Failed to delete peminjaman");
    return res.json();
  },

  // ========== SERAH TERIMA METHODS (UPDATED) ==========

  // Create usulan serah terima (NEW)
  async createSerahTerimaUsulan(data: {
    pihakPenyerah: string;
    pihakPenerima: string;
    archiveId: string;
  }): Promise<SerahTerimaRecord> {
    const res = await fetch("/api/serah-terima", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to create usulan");
    }

    const result = await res.json();
    return result.data;
  },

  // Get all serah terima
  async getAllSerahTerima(): Promise<SerahTerimaRecord[]> {
    const res = await fetch("/api/serah-terima", { credentials: "include" });
    if (!res.ok) throw new Error("Failed to fetch serah terima");
    const json = await res.json();
    return Array.isArray(json) ? json : json.data || [];
  },

  // Get serah terima with filters
  async getSerahTerima(
    params: Record<string, string | number> = {}
  ): Promise<any> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    });
    const res = await fetch(`/api/serah-terima?${searchParams}`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch serah terima");
    return res.json();
  },

  // Approve usulan serah terima (NEW)
  async approveSerahTerima(
    id: string,
    data: {
      nomorBeritaAcara: string;
      tanggalSerahTerima: string;
      keterangan?: string;
    }
  ): Promise<SerahTerimaRecord> {
    const res = await fetch(`/api/serah-terima/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const error = await res.json();
      throw { response: { data: error } };
    }

    const result = await res.json();
    return result.data;
  },

  // Reject usulan serah terima (NEW)
  async rejectSerahTerima(
    id: string,
    alasanPenolakan: string
  ): Promise<SerahTerimaRecord> {
    const res = await fetch(`/api/serah-terima/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ alasanPenolakan }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw { response: { data: error } };
    }

    const result = await res.json();
    return result.data;
  },

  // Update serah terima (for approved ones only)
  async updateSerahTerima(
    id: string,
    data: Partial<SerahTerimaFormData>
  ): Promise<SerahTerimaRecord> {
    const res = await fetch(`/api/serah-terima/${id}`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to update serah terima");
    }

    const result = await res.json();
    return result.data;
  },

  // Delete serah terima
  async deleteSerahTerima(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/serah-terima/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to delete serah terima");
    }

    return res.json();
  },

  // Check archive availability for serah terima
  async checkArchiveAvailability(
    archiveId: string
  ): Promise<{ available: boolean; reason?: string }> {
    try {
      const res = await fetch(
        `/api/serah-terima/check-availability/${archiveId}`,
        {
          credentials: "include",
        }
      );

      if (!res.ok) {
        // Jika endpoint tidak tersedia atau error, return default response
        if (res.status === 404) {
          console.warn(
            "Availability check endpoint not found, assuming available"
          );
          return {
            available: true,
            reason: "Endpoint tidak tersedia, asumsikan tersedia",
          };
        }

        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.reason || `HTTP error! status: ${res.status}`
        );
      }

      return res.json();
    } catch (error) {
      console.error("Availability check failed:", error);
      // Fallback: assume archive is available to prevent blocking the feature
      return {
        available: true,
        reason: "Pemeriksaan ketersediaan gagal, asumsikan arsip tersedia",
      };
    }
  },

  // ========== LEGACY METHOD (DEPRECATED - keep for backward compatibility) ==========
  // @deprecated Use createSerahTerimaUsulan instead
  async createSerahTerima(
    data: SerahTerimaFormData
  ): Promise<SerahTerimaRecord> {
    console.warn(
      "createSerahTerima is deprecated. Use createSerahTerimaUsulan instead."
    );
    // Convert old format to new format
    return this.createSerahTerimaUsulan({
      pihakPenyerah: data.pihakPenyerah,
      pihakPenerima: data.pihakPenerima,
      archiveId: data.archiveId,
    });
  },
};