"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  FileCheck,
  AlertTriangle,
  CheckSquare,
  Square,
  ChevronUp,
  ChevronDown,
  Clock,
} from "lucide-react";
import { archiveAPI } from "@/services/archiveAPI";
import { ArchiveRecord, SerahTerimaUsulanFormData } from "@/types/archive";

interface SerahTerimaCreateFormProps {
  onSave: (data: SerahTerimaUsulanFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

interface ArchiveWithStatus extends ArchiveRecord {
  hasActivePeminjaman?: boolean;
  hasPendingSerahTerima?: boolean;
}

export default function SerahTerimaCreateForm({
  onSave,
  onCancel,
  loading = false,
}: SerahTerimaCreateFormProps) {
  const [formData, setFormData] = useState({
    pihakPenyerah: "",
    pihakPenerima: "",
    nomorBerkas: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingNomorBerkas, setLoadingNomorBerkas] = useState(true);
  const [loadingArchives, setLoadingArchives] = useState(false);

  const [nomorBerkasList, setNomorBerkasList] = useState<string[]>([]);
  const [archives, setArchives] = useState<ArchiveWithStatus[]>([]);
  const [selectedArchiveIds, setSelectedArchiveIds] = useState<Set<string>>(
    new Set()
  );

  // State untuk minimize/expand archive list
  const [archivesExpanded, setArchivesExpanded] = useState(false);

  // Fetch nomor berkas list on mount
  useEffect(() => {
    fetchNomorBerkasList();
  }, []);

  // Fetch archives when nomor berkas is selected
  useEffect(() => {
    if (formData.nomorBerkas) {
      fetchArchivesByNomorBerkas(formData.nomorBerkas);
    } else {
      setArchives([]);
      setSelectedArchiveIds(new Set());
      setArchivesExpanded(false);
    }
  }, [formData.nomorBerkas]);

  const fetchNomorBerkasList = async () => {
    try {
      setLoadingNomorBerkas(true);
      const list = await archiveAPI.getNomorBerkasList();
      setNomorBerkasList(list);
    } catch (error) {
      console.error("Error fetching nomor berkas:", error);
      alert("Gagal memuat daftar nomor berkas");
    } finally {
      setLoadingNomorBerkas(false);
    }
  };

  const fetchArchivesByNomorBerkas = async (nomorBerkas: string) => {
    try {
      setLoadingArchives(true);
      const result = await archiveAPI.getArchivesByNomorBerkas(nomorBerkas);

      // PERBAIKAN: Check status untuk setiap arsip
      const archivesWithStatus = await Promise.all(
        result.archives.map(async (archive: ArchiveRecord) => {
          try {
            // Check peminjaman aktif
            const peminjaman = await archiveAPI.getPeminjamanByArchive(
              archive.id
            );
            const hasActivePeminjaman = peminjaman.some(
              (p) => !p.tanggalPengembalian
            );

            // Check apakah sudah ada usulan serah terima
            // Untuk ini, kita perlu mengecek melalui API serah terima
            // Tapi karena kita tidak punya API khusus untuk cek ini,
            // kita akan coba melalui getAllSerahTerima dengan filter
            let hasPendingSerahTerima = false;
            try {
              const allSerahTerima = await archiveAPI.getAllSerahTerima();
              const serahTerimaWithArchive = allSerahTerima.filter((st) =>
                st.archives?.some((a) => a.archive?.id === archive.id)
              );
              hasPendingSerahTerima = serahTerimaWithArchive.some(
                (st) =>
                  st.statusUsulan === "PENDING" ||
                  st.statusUsulan === "APPROVED"
              );
            } catch (serahTerimaError) {
              console.error(
                "Error checking serah terima status:",
                serahTerimaError
              );
            }

            return {
              ...archive,
              hasActivePeminjaman,
              hasPendingSerahTerima,
            };
          } catch (error) {
            console.error(
              `Error checking status for archive ${archive.id}:`,
              error
            );
            return {
              ...archive,
              hasActivePeminjaman: false,
              hasPendingSerahTerima: false,
            };
          }
        })
      );

      setArchives(archivesWithStatus);

      // OTOMATIS PILIH ARSIP YANG BISA DIPILIH
      // (tidak dipinjam dan tidak ada usulan)
      const availableArchiveIds = archivesWithStatus
        .filter(
          (archive) =>
            !archive.hasActivePeminjaman && !archive.hasPendingSerahTerima
        )
        .map((archive) => archive.id);

      setSelectedArchiveIds(new Set(availableArchiveIds));
    } catch (error) {
      console.error("Error fetching archives:", error);
      alert("Gagal memuat arsip");
      setArchives([]);
      setSelectedArchiveIds(new Set());
    } finally {
      setLoadingArchives(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const toggleArchiveSelection = (archiveId: string) => {
    const archive = archives.find((a) => a.id === archiveId);
    // Jangan izinkan memilih arsip yang sedang dipinjam atau sudah ada usulan
    if (archive?.hasActivePeminjaman || archive?.hasPendingSerahTerima) return;

    setSelectedArchiveIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(archiveId)) {
        newSet.delete(archiveId);
      } else {
        newSet.add(archiveId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    // Hanya pilih arsip yang bisa dipilih
    const availableArchives = archives.filter(
      (a) => !a.hasActivePeminjaman && !a.hasPendingSerahTerima
    );
    const availableArchiveIds = availableArchives.map((a) => a.id);

    if (selectedArchiveIds.size === availableArchiveIds.length) {
      // Unselect all
      setSelectedArchiveIds(new Set());
    } else {
      // Select all available archives
      setSelectedArchiveIds(new Set(availableArchiveIds));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.pihakPenyerah?.trim())
      newErrors.pihakPenyerah = "Pihak Penyerah wajib diisi";
    if (!formData.pihakPenerima?.trim())
      newErrors.pihakPenerima = "Pihak Penerima wajib diisi";
    if (!formData.nomorBerkas)
      newErrors.nomorBerkas = "Nomor Berkas wajib dipilih";
    if (selectedArchiveIds.size === 0)
      newErrors.archives = "Minimal pilih 1 arsip";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    // **DEBUG: Cari arsip yang dipinjam di antara yang dipilih**
    const problematicArchives = archives.filter(
      (a) => selectedArchiveIds.has(a.id) && a.hasActivePeminjaman
    );

    console.log("=== DEBUG: Problematic archives in selection ===");
    console.log("Count:", problematicArchives.length);
    problematicArchives.forEach((a) => {
      console.log("Problematic archive:", {
        id: a.id,
        judulBerkas: a.judulBerkas,
        hasActivePeminjaman: a.hasActivePeminjaman,
      });
    });

    const usulanData: SerahTerimaUsulanFormData = {
      pihakPenyerah: formData.pihakPenyerah,
      pihakPenerima: formData.pihakPenerima,
      nomorBerkas: formData.nomorBerkas,
      archiveIds: Array.from(selectedArchiveIds),
    };

    console.log("=== DEBUG: Submitting usulan ===");
    console.log("Selected archive IDs:", Array.from(selectedArchiveIds));
    console.log("Selected count:", selectedArchiveIds.size);
    console.log("Total archives:", archives.length);

    try {
      await onSave(usulanData);
    } catch (error: any) {
      console.error("Form submission error:", error);
      // Tampilkan error dari backend
      if (error.message) {
        alert(`Error: ${error.message}`);
      } else if (error.response?.data?.error) {
        alert(`Error: ${error.response.data.error}`);
      } else {
        alert("Terjadi kesalahan saat mengajukan usulan");
      }
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch (error) {
      return "-";
    }
  };

  const canSubmit =
    formData.pihakPenyerah &&
    formData.pihakPenerima &&
    formData.nomorBerkas &&
    selectedArchiveIds.size > 0;

  // Hitung statistik
  const totalArchives = archives.length;
  const availableArchives = archives.filter(
    (a) => !a.hasActivePeminjaman && !a.hasPendingSerahTerima
  ).length;
  const borrowedArchives = archives.filter((a) => a.hasActivePeminjaman).length;
  const pendingArchives = archives.filter(
    (a) => a.hasPendingSerahTerima
  ).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto my-4">
        {/* Header */}
        <div className="p-6 border-b bg-purple-50 flex items-center justify-between sticky top-0 z-10 rounded-t-lg">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FileCheck className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Buat Usulan Serah Terima
              </h2>
              <p className="text-sm text-gray-600">
                Pilih nomor berkas dan arsip yang akan diserahterimakan
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Basic Info */}
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pihak Penyerah *
                </label>
                <input
                  type="text"
                  value={formData.pihakPenyerah}
                  onChange={(e) =>
                    handleChange("pihakPenyerah", e.target.value)
                  }
                  className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.pihakPenyerah ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Nama pihak yang menyerahkan"
                />
                {errors.pihakPenyerah && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.pihakPenyerah}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pihak Penerima *
                </label>
                <input
                  type="text"
                  value={formData.pihakPenerima}
                  onChange={(e) =>
                    handleChange("pihakPenerima", e.target.value)
                  }
                  className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.pihakPenerima ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Nama pihak yang menerima"
                />
                {errors.pihakPenerima && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.pihakPenerima}
                  </p>
                )}
              </div>
            </div>

            {/* Nomor Berkas Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nomor Berkas *
              </label>
              {loadingNomorBerkas ? (
                <div className="text-sm text-gray-500 py-2">
                  Memuat daftar nomor berkas...
                </div>
              ) : (
                <select
                  value={formData.nomorBerkas}
                  onChange={(e) => handleChange("nomorBerkas", e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.nomorBerkas ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">-- Pilih Nomor Berkas --</option>
                  {nomorBerkasList.map((nb) => (
                    <option key={nb} value={nb}>
                      {nb}
                    </option>
                  ))}
                </select>
              )}
              {errors.nomorBerkas && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.nomorBerkas}
                </p>
              )}
            </div>
          </div>

          {/* Archives List */}
          {formData.nomorBerkas && (
            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Arsip dalam Nomor Berkas: {formData.nomorBerkas}
                  </h3>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      {availableArchives} tersedia
                    </span>
                    {borrowedArchives > 0 && (
                      <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
                        {borrowedArchives} sedang dipinjam
                      </span>
                    )}
                    {pendingArchives > 0 && (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                        {pendingArchives} sudah ada usulan
                      </span>
                    )}
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                      {selectedArchiveIds.size} terpilih
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {archives.length > 0 && availableArchives > 0 && (
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="text-sm text-purple-600 hover:text-purple-800 flex items-center px-3 py-1 border border-purple-300 rounded-md hover:bg-purple-50"
                    >
                      {selectedArchiveIds.size === availableArchives ? (
                        <CheckSquare size={16} className="mr-1" />
                      ) : (
                        <Square size={16} className="mr-1" />
                      )}
                      {selectedArchiveIds.size === availableArchives
                        ? "Batalkan Semua"
                        : "Pilih Semua"}
                    </button>
                  )}
                  {archives.length > 3 && (
                    <button
                      type="button"
                      onClick={() => setArchivesExpanded(!archivesExpanded)}
                      className="text-sm text-gray-600 hover:text-gray-800 flex items-center px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      {archivesExpanded ? (
                        <>
                          <ChevronUp size={16} className="mr-1" />
                          Sembunyikan
                        </>
                      ) : (
                        <>
                          <ChevronDown size={16} className="mr-1" />
                          Tampilkan ({archives.length})
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {loadingArchives ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Memuat arsip...</p>
                </div>
              ) : archives.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <AlertTriangle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                  <p className="text-sm text-yellow-800">
                    Tidak ada arsip ditemukan untuk nomor berkas ini.
                  </p>
                </div>
              ) : (
                <>
                  {/* Summary box */}
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-purple-800">
                          <strong>{selectedArchiveIds.size}</strong> dari{" "}
                          <strong>{availableArchives}</strong> arsip tersedia
                          dipilih
                        </p>
                        {(borrowedArchives > 0 || pendingArchives > 0) && (
                          <div className="text-xs mt-1 space-y-1">
                            {borrowedArchives > 0 && (
                              <p className="text-amber-700">
                                <Clock className="inline h-3 w-3 mr-1" />
                                {borrowedArchives} arsip sedang dipinjam
                              </p>
                            )}
                            {pendingArchives > 0 && (
                              <p className="text-red-700">
                                <AlertTriangle className="inline h-3 w-3 mr-1" />
                                {pendingArchives} arsip sudah ada usulan serah
                                terima
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Archives grid */}
                  <div
                    className={`space-y-2 ${
                      archivesExpanded ? "" : "max-h-96 overflow-y-auto"
                    }`}
                  >
                    {archives
                      .slice(0, archivesExpanded ? archives.length : 3)
                      .map((archive, index) => (
                        <div
                          key={archive.id}
                          className={`p-4 border rounded-lg transition-colors ${
                            selectedArchiveIds.has(archive.id)
                              ? "border-purple-300 bg-purple-50"
                              : "border-gray-200 hover:bg-gray-50"
                          } ${
                            archive.hasActivePeminjaman ||
                            archive.hasPendingSerahTerima
                              ? "opacity-75 bg-gray-50 border-dashed"
                              : ""
                          }`}
                        >
                          <label
                            className={`flex items-start cursor-pointer ${
                              archive.hasActivePeminjaman ||
                              archive.hasPendingSerahTerima
                                ? "cursor-not-allowed"
                                : ""
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedArchiveIds.has(archive.id)}
                              onChange={() =>
                                toggleArchiveSelection(archive.id)
                              }
                              disabled={
                                archive.hasActivePeminjaman ||
                                archive.hasPendingSerahTerima
                              }
                              className={`mt-1 h-4 w-4 focus:ring-purple-500 border-gray-300 rounded ${
                                archive.hasActivePeminjaman ||
                                archive.hasPendingSerahTerima
                                  ? "text-gray-400 cursor-not-allowed"
                                  : "text-purple-600"
                              }`}
                            />
                            <div className="ml-3 flex-1">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-start gap-2 flex-wrap">
                                    <p className="font-medium text-gray-900">
                                      {archive.judulBerkas || "-"}
                                    </p>
                                    {archive.hasActivePeminjaman && (
                                      <span className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded-full flex items-center">
                                        <Clock className="h-3 w-3 mr-1" />
                                        Dipinjam
                                      </span>
                                    )}
                                    {archive.hasPendingSerahTerima && (
                                      <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full flex items-center">
                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                        Sudah ada usulan
                                      </span>
                                    )}
                                  </div>
                                  <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                                    <div>
                                      <span className="font-medium">
                                        No. Surat:
                                      </span>
                                      <p className="truncate">
                                        {archive.nomorSurat || "-"}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="font-medium">
                                        Perihal:
                                      </span>
                                      <p className="truncate">
                                        {archive.perihal || "-"}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="font-medium">
                                        Tanggal:
                                      </span>
                                      <p>{formatDate(archive.tanggal)}</p>
                                    </div>
                                    <div>
                                      <span className="font-medium">
                                        Lokasi:
                                      </span>
                                      <p className="truncate">
                                        {archive.lokasiSimpan || "-"}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <span className="ml-4 text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                                  #{index + 1}
                                </span>
                              </div>
                              {archive.hasActivePeminjaman && (
                                <p className="text-xs text-amber-600 mt-2 flex items-center">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Arsip sedang dipinjam dan tidak dapat
                                  diserahterimakan
                                </p>
                              )}
                              {archive.hasPendingSerahTerima && (
                                <p className="text-xs text-red-600 mt-2 flex items-center">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Arsip sudah ada usulan serah terima
                                  (menunggu/disetujui)
                                </p>
                              )}
                            </div>
                          </label>
                        </div>
                      ))}

                    {/* Show "Show more" button */}
                    {!archivesExpanded && archives.length > 3 && (
                      <div className="text-center pt-2">
                        <button
                          type="button"
                          onClick={() => setArchivesExpanded(true)}
                          className="text-sm text-purple-600 hover:text-purple-800 underline"
                        >
                          Tampilkan {archives.length - 3} arsip lainnya...
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}

              {errors.archives && (
                <p className="text-red-500 text-sm mt-2">{errors.archives}</p>
              )}
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <p className="text-sm text-blue-800 font-medium mb-1">Catatan:</p>
            <ul className="text-sm text-blue-800 list-disc pl-5 space-y-1">
              <li>Usulan ini akan masuk ke daftar dengan status "Menunggu"</li>
              <li>Arsip yang sedang dipinjam tidak dapat dipilih</li>
              <li>
                Arsip yang sudah ada usulan (menunggu/disetujui) tidak dapat
                dipilih
              </li>
              <li>
                Detail seperti nomor berita acara akan diisi setelah usulan
                disetujui oleh admin
              </li>
            </ul>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !canSubmit}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Mengajukan...
                </>
              ) : (
                <>
                  <FileCheck className="h-4 w-4 mr-2" />
                  Ajukan Usulan ({selectedArchiveIds.size} Arsip)
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
