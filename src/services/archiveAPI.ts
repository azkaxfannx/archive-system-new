// services/archiveAPI.ts - UPDATED VERSION with Many-to-Many
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
  SerahTerimaUsulanFormData,
  NomorBerkasWithArchives,
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

    // NEW: Exclude archives that are already handed over (approved serah terima)
    if (params.excludeSerahTerima) {
      searchParams.append("excludeSerahTerima", "true");
    }

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

  // NEW: Get unique nomor berkas list
  async getNomorBerkasList(): Promise<string[]> {
    const res = await fetch("/api/archives/nomor-berkas", {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch nomor berkas list");
    const json = await res.json();
    return json.data || [];
  },

  // NEW: Get archives by nomor berkas (for serah terima selection)
  async getArchivesByNomorBerkas(
    nomorBerkas: string
  ): Promise<NomorBerkasWithArchives> {
    const res = await fetch(
      `/api/archives/by-nomor-berkas/${encodeURIComponent(nomorBerkas)}`,
      {
        credentials: "include",
      }
    );
    if (!res.ok) throw new Error("Failed to fetch archives by nomor berkas");

    const response = await res.json();

    // FIXED: Extract data from response.data
    if (response.success && response.data) {
      return response.data; // response.data sudah sesuai dengan NomorBerkasWithArchives
    } else {
      throw new Error("Invalid response structure");
    }
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
  // Get peminjaman by archive ID - FIXED VERSION
  async getPeminjamanByArchive(archiveId: string): Promise<PeminjamanRecord[]> {
    try {
      const res = await fetch(`/api/peminjaman/archives/${archiveId}`, {
        credentials: "include",
      });

      if (!res.ok) {
        // Return empty array if archive not found or no peminjaman
        if (res.status === 404 || res.status === 403) {
          return [];
        }
        throw new Error(`Failed to fetch peminjaman: ${res.status}`);
      }

      const response = await res.json();
      return response.data || [];
    } catch (error) {
      console.error("Error in getPeminjamanByArchive:", error);
      return []; // Return empty array instead of throwing
    }
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

  // ========== SERAH TERIMA METHODS (UPDATED FOR MANY-TO-MANY) ==========

  // UPDATED: Create usulan serah terima with multiple archives
  async createSerahTerimaUsulan(
    data: SerahTerimaUsulanFormData
  ): Promise<SerahTerimaRecord> {
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

  // Approve usulan serah terima
  async approveSerahTerima(
    id: string,
    data: {
      nomorBeritaAcara: string;
      tanggalSerahTerima: string;
      keterangan?: string;
    }
  ): Promise<SerahTerimaRecord> {
    console.log("=== DEBUG FRONTEND API CALL ===");
    console.log("Approve ID:", id);
    console.log("Data to send:", data);

    const url = `/api/serah-terima/${id}/approve`;
    console.log("URL:", url);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      console.log("Response status:", res.status);
      console.log("Response statusText:", res.statusText);

      // Try to get response text first
      const responseText = await res.text();
      console.log("Raw response:", responseText);

      let responseData;
      try {
        responseData = responseText ? JSON.parse(responseText) : {};
        console.log("Parsed response:", responseData);
      } catch (parseError) {
        console.error("Failed to parse JSON:", parseError);
        responseData = { error: "Invalid JSON response" };
      }

      if (!res.ok) {
        console.error("API request failed:", {
          status: res.status,
          data: responseData,
        });

        throw {
          response: {
            data: responseData,
            status: res.status,
            statusText: res.statusText,
          },
          message:
            responseData.error || `HTTP ${res.status}: ${res.statusText}`,
        };
      }
      return responseData.data;
    } catch (error) {
      console.error("Fetch error in approveSerahTerima:", error);
      throw error;
    }
  },

  // Reject usulan serah terima
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
};
