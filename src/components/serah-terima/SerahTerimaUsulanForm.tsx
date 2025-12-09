"use client";

import React, { useState, useEffect } from "react";
import { X, FileCheck, AlertTriangle } from "lucide-react";
import { ArchiveRecord } from "@/types/archive";
import { archiveAPI } from "@/services/archiveAPI";

export interface SerahTerimaUsulanFormData {
  pihakPenyerah: string;
  pihakPenerima: string;
  archiveId: string;
}

interface SerahTerimaUsulanFormProps {
  archive: ArchiveRecord;
  onSave: (data: SerahTerimaUsulanFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export default function SerahTerimaUsulanForm({
  archive,
  onSave,
  onCancel,
  loading = false,
}: SerahTerimaUsulanFormProps) {
  const [formData, setFormData] = useState<SerahTerimaUsulanFormData>({
    pihakPenyerah: "",
    pihakPenerima: "",
    archiveId: archive.id,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [checking, setChecking] = useState(true);
  const [availabilityStatus, setAvailabilityStatus] = useState<{
    available: boolean;
    reason?: string;
  } | null>(null);

  useEffect(() => {
    checkAvailability();
  }, [archive.id]);

  const checkAvailability = async () => {
    setChecking(true);
    try {
      const result = await archiveAPI.checkArchiveAvailability(archive.id);
      setAvailabilityStatus(result);
    } catch (err) {
      console.error("Error checking availability:", err);
      setAvailabilityStatus({
        available: false,
        reason: "Gagal memeriksa ketersediaan arsip",
      });
    } finally {
      setChecking(false);
    }
  };

  const handleChange = (field: keyof SerahTerimaUsulanFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.pihakPenyerah?.trim())
      newErrors.pihakPenyerah = "Pihak Penyerah wajib diisi";
    if (!formData.pihakPenerima?.trim())
      newErrors.pihakPenerima = "Pihak Penerima wajib diisi";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (!availabilityStatus?.available) {
      alert(
        availabilityStatus?.reason ||
          "Arsip ini tidak dapat diusulkan untuk diserahterimakan saat ini"
      );
      return;
    }

    try {
      await onSave(formData);
    } catch (error) {
      console.error("Form submission error:", error);
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b bg-blue-50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileCheck className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Usulan Serah Terima Berkas
              </h2>
              <p className="text-sm text-gray-600">
                Ajukan usulan serah terima arsip
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
          {/* Checking Availability */}
          {checking && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                <p className="text-sm text-blue-800">
                  Memeriksa ketersediaan arsip...
                </p>
              </div>
            </div>
          )}

          {/* Availability Warning */}
          {!checking && !availabilityStatus?.available && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-3 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900 mb-1">
                    Arsip Tidak Dapat Diusulkan
                  </h3>
                  <p className="text-sm text-red-800">
                    {availabilityStatus?.reason ||
                      "Arsip ini tidak dapat diusulkan saat ini"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Archive Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">
              Detail Berkas yang Diusulkan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-medium text-blue-800">Nomor Berkas:</span>
                <span className="ml-2 text-blue-900">
                  {archive.nomorBerkas || "-"}
                </span>
              </div>
              <div>
                <span className="font-medium text-blue-800">Nomor Surat:</span>
                <span className="ml-2 text-blue-900">
                  {archive.nomorSurat || "-"}
                </span>
              </div>
              <div className="md:col-span-2">
                <span className="font-medium text-blue-800">Judul:</span>
                <span className="ml-2 text-blue-900">
                  {archive.judulBerkas || "-"}
                </span>
              </div>
              <div className="md:col-span-2">
                <span className="font-medium text-blue-800">Perihal:</span>
                <span className="ml-2 text-blue-900">
                  {archive.perihal || "-"}
                </span>
              </div>
              <div>
                <span className="font-medium text-blue-800">
                  Tanggal Surat:
                </span>
                <span className="ml-2 text-blue-900">
                  {formatDate(archive.tanggal)}
                </span>
              </div>
              <div>
                <span className="font-medium text-blue-800">Lokasi:</span>
                <span className="ml-2 text-blue-900">
                  {archive.lokasiSimpan || "-"}
                </span>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pihak Penyerah *
              </label>
              <input
                type="text"
                value={formData.pihakPenyerah}
                onChange={(e) => handleChange("pihakPenyerah", e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.pihakPenyerah ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Nama pihak yang menyerahkan"
                disabled={!availabilityStatus?.available}
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
                onChange={(e) => handleChange("pihakPenerima", e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.pihakPenerima ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Nama pihak yang menerima"
                disabled={!availabilityStatus?.available}
              />
              {errors.pihakPenerima && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.pihakPenerima}
                </p>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>Catatan:</strong> Usulan ini akan masuk ke halaman Serah Terima untuk ditinjau lebih lanjut. 
                Detail seperti nomor berita acara, tanggal serah terima, dan keterangan akan diisi setelah usulan disetujui.
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !availabilityStatus?.available}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Mengajukan...
                </>
              ) : (
                <>
                  <FileCheck className="h-4 w-4 mr-2" />
                  Ajukan Usulan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}