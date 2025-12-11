"use client";

import React, { useState } from "react";
import {
  X,
  CheckCircle,
  XCircle,
  Calendar,
  AlertTriangle,
  CheckSquare,
  Square,
  ChevronUp,
  ChevronDown,
  Clock,
  Package,
} from "lucide-react";
import { SerahTerimaRecord } from "@/types/archive";

interface ProcessFormData {
  nomorBeritaAcara: string;
  tanggalSerahTerima: string;
  keterangan: string;
  alasanPenolakan: string;
}

interface SerahTerimaProcessModalProps {
  item: SerahTerimaRecord;
  onProcess: (data: {
    approvedArchiveIds: string[];
    rejectedArchiveIds: string[];
    nomorBeritaAcara: string;
    tanggalSerahTerima: string;
    keterangan: string;
    alasanPenolakan: string;
  }) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export default function SerahTerimaProcessModal({
  item,
  onProcess,
  onCancel,
  loading = false,
}: SerahTerimaProcessModalProps) {
  const today = new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState<ProcessFormData>({
    nomorBeritaAcara: "",
    tanggalSerahTerima: today,
    keterangan: "",
    alasanPenolakan: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // State untuk arsip yang diapprove (default: semua dipilih)
  const [selectedArchiveIds, setSelectedArchiveIds] = useState<Set<string>>(
    new Set(item.archives?.map((sta) => sta.archiveId) || [])
  );

  // State untuk expand/collapse
  const [archivesExpanded, setArchivesExpanded] = useState(true);

  const handleChange = (field: keyof ProcessFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const toggleArchiveSelection = (archiveId: string) => {
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
    const allArchiveIds = item.archives?.map((sta) => sta.archiveId) || [];
    if (selectedArchiveIds.size === allArchiveIds.length) {
      setSelectedArchiveIds(new Set());
    } else {
      setSelectedArchiveIds(new Set(allArchiveIds));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Jika ada arsip yang diapprove
    if (selectedArchiveIds.size > 0) {
      if (!formData.nomorBeritaAcara?.trim()) {
        newErrors.nomorBeritaAcara =
          "Nomor Berita Acara wajib diisi untuk arsip yang disetujui";
      }
      if (!formData.tanggalSerahTerima) {
        newErrors.tanggalSerahTerima =
          "Tanggal Serah Terima wajib diisi untuk arsip yang disetujui";
      }
    }

    // Jika ada arsip yang direject
    const rejectedCount =
      (item.archives?.length || 0) - selectedArchiveIds.size;
    if (rejectedCount > 0) {
      if (!formData.alasanPenolakan?.trim()) {
        newErrors.alasanPenolakan =
          "Alasan Penolakan wajib diisi untuk arsip yang ditolak";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const approvedArchiveIds = Array.from(selectedArchiveIds);
    const rejectedArchiveIds = (item.archives || [])
      .map((sta) => sta.archiveId)
      .filter((id) => !selectedArchiveIds.has(id));

    try {
      await onProcess({
        approvedArchiveIds,
        rejectedArchiveIds,
        nomorBeritaAcara: formData.nomorBeritaAcara,
        tanggalSerahTerima: formData.tanggalSerahTerima,
        keterangan: formData.keterangan,
        alasanPenolakan: formData.alasanPenolakan,
      });
    } catch (error) {
      console.error("Process error:", error);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch (error) {
      return "-";
    }
  };

  const totalArchives = item.archives?.length || 0;
  const approvedCount = selectedArchiveIds.size;
  const rejectedCount = totalArchives - approvedCount;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Proses Usulan Serah Terima
              </h2>
              <p className="text-sm text-gray-600">
                Pilih arsip yang disetujui dan ditolak
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
          {/* Info Usulan */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-3">
              Informasi Usulan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-medium text-blue-800">
                  Pihak Penyerah:
                </span>
                <span className="ml-2 text-blue-900">{item.pihakPenyerah}</span>
              </div>
              <div>
                <span className="font-medium text-blue-800">
                  Pihak Penerima:
                </span>
                <span className="ml-2 text-blue-900">{item.pihakPenerima}</span>
              </div>
              <div>
                <span className="font-medium text-blue-800">Nomor Berkas:</span>
                <span className="ml-2 text-blue-900">{item.nomorBerkas}</span>
              </div>
              <div>
                <span className="font-medium text-blue-800">
                  Tanggal Usulan:
                </span>
                <span className="ml-2 text-blue-900">
                  {formatDate(item.tanggalUsulan)}
                </span>
              </div>
            </div>
          </div>

          {/* Status Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
              <Package className="h-8 w-8 text-gray-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">
                {totalArchives}
              </p>
              <p className="text-sm text-gray-600">Total Arsip</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-900">
                {approvedCount}
              </p>
              <p className="text-sm text-green-700">Disetujui</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-red-900">{rejectedCount}</p>
              <p className="text-sm text-red-700">Ditolak</p>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Petunjuk:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  Centang arsip yang <strong>DISETUJUI</strong>
                </li>
                <li>
                  Arsip yang <strong>TIDAK dicentang</strong> akan otomatis
                  ditolak
                </li>
                <li>
                  Isi data untuk arsip yang disetujui dan alasan untuk yang
                  ditolak
                </li>
              </ul>
            </div>
          </div>

          {/* Archive Selection */}
          <div className="border-t pt-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Pilih Arsip yang Disetujui
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-sm text-purple-600 hover:text-purple-800 flex items-center px-3 py-1 border border-purple-300 rounded-md hover:bg-purple-50"
                >
                  {selectedArchiveIds.size === totalArchives ? (
                    <CheckSquare size={16} className="mr-1" />
                  ) : (
                    <Square size={16} className="mr-1" />
                  )}
                  {selectedArchiveIds.size === totalArchives
                    ? "Batalkan Semua"
                    : "Pilih Semua"}
                </button>
                {totalArchives > 3 && (
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
                        Tampilkan Semua
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            <div
              className={`space-y-2 ${
                archivesExpanded ? "" : "max-h-96 overflow-y-auto"
              }`}
            >
              {item.archives
                ?.slice(0, archivesExpanded ? item.archives.length : 3)
                .map((sta, index) => {
                  const isSelected = selectedArchiveIds.has(sta.archiveId);
                  return (
                    <div
                      key={sta.id}
                      className={`p-4 border rounded-lg transition-all ${
                        isSelected
                          ? "border-green-300 bg-green-50"
                          : "border-red-300 bg-red-50"
                      }`}
                    >
                      <label className="flex items-start cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleArchiveSelection(sta.archiveId)}
                          className="mt-1 h-5 w-5 focus:ring-purple-500 border-gray-300 rounded text-green-600"
                        />
                        <div className="ml-3 flex-1">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap mb-2">
                                <p className="font-medium text-gray-900">
                                  {sta.archive?.judulBerkas || "-"}
                                </p>
                                {isSelected ? (
                                  <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full flex items-center">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Disetujui
                                  </span>
                                ) : (
                                  <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full flex items-center">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Ditolak
                                  </span>
                                )}
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                                <div>
                                  <span className="font-medium">
                                    No. Surat:
                                  </span>
                                  <p className="truncate">
                                    {sta.archive?.nomorSurat || "-"}
                                  </p>
                                </div>
                                <div>
                                  <span className="font-medium">Perihal:</span>
                                  <p className="truncate">
                                    {sta.archive?.perihal || "-"}
                                  </p>
                                </div>
                                <div>
                                  <span className="font-medium">Tanggal:</span>
                                  <p>{formatDate(sta.archive?.tanggal)}</p>
                                </div>
                                <div>
                                  <span className="font-medium">Lokasi:</span>
                                  <p className="truncate">
                                    {sta.archive?.lokasiSimpan || "-"}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <span className="ml-4 text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                              #{index + 1}
                            </span>
                          </div>
                        </div>
                      </label>
                    </div>
                  );
                })}

              {!archivesExpanded && (item.archives?.length || 0) > 3 && (
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setArchivesExpanded(true)}
                    className="text-sm text-purple-600 hover:text-purple-800 underline"
                  >
                    Tampilkan {(item.archives?.length || 0) - 3} arsip
                    lainnya...
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Form untuk Approved */}
          {approvedCount > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-green-900 mb-3 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                Data untuk Arsip yang Disetujui ({approvedCount})
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nomor Berita Acara *
                  </label>
                  <input
                    type="text"
                    value={formData.nomorBeritaAcara}
                    onChange={(e) =>
                      handleChange("nomorBeritaAcara", e.target.value)
                    }
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      errors.nomorBeritaAcara
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="Contoh: BA/001/ST/2024"
                    disabled={loading}
                  />
                  {errors.nomorBeritaAcara && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.nomorBeritaAcara}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    Tanggal Serah Terima *
                  </label>
                  <input
                    type="date"
                    value={formData.tanggalSerahTerima}
                    onChange={(e) =>
                      handleChange("tanggalSerahTerima", e.target.value)
                    }
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      errors.tanggalSerahTerima
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    disabled={loading}
                  />
                  {errors.tanggalSerahTerima && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.tanggalSerahTerima}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Keterangan
                  </label>
                  <textarea
                    value={formData.keterangan}
                    onChange={(e) => handleChange("keterangan", e.target.value)}
                    rows={2}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent border-gray-300"
                    placeholder="Keterangan tambahan (opsional)"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Form untuk Rejected */}
          {rejectedCount > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-red-900 mb-3 flex items-center">
                <XCircle className="h-5 w-5 mr-2" />
                Alasan Penolakan untuk Arsip yang Ditolak ({rejectedCount})
              </h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alasan Penolakan *
                </label>
                <textarea
                  value={formData.alasanPenolakan}
                  onChange={(e) =>
                    handleChange("alasanPenolakan", e.target.value)
                  }
                  rows={3}
                  className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                    errors.alasanPenolakan
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder="Jelaskan alasan penolakan untuk arsip yang tidak dicentang..."
                  disabled={loading}
                />
                {errors.alasanPenolakan && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.alasanPenolakan}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Alasan ini akan tercatat untuk semua arsip yang ditolak
                </p>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Catatan:</strong> Setelah diproses, arsip yang disetujui
              akan menjadi data serah terima terlaksana, dan arsip yang ditolak
              akan dikembalikan ke status awal.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Memproses...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Proses Usulan ({approvedCount} Setuju, {rejectedCount} Tolak)
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
