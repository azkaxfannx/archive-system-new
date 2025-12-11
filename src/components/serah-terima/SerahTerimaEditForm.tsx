"use client";

import React, { useState } from "react";
import { X, FileCheck, Calendar } from "lucide-react";
import { SerahTerimaRecord, SerahTerimaFormData } from "@/types/archive";

interface SerahTerimaEditFormProps {
  item: SerahTerimaRecord;
  onSave: (data: SerahTerimaFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export default function SerahTerimaEditForm({
  item,
  onSave,
  onCancel,
  loading = false,
}: SerahTerimaEditFormProps) {
  // Ambil data archive dari item pertama dalam array archives
  const firstArchive = item.archives?.[0]?.archive;

  const [formData, setFormData] = useState<SerahTerimaFormData>({
    nomorBeritaAcara: item.nomorBeritaAcara || "",
    pihakPenyerah: item.pihakPenyerah,
    pihakPenerima: item.pihakPenerima,
    tanggalSerahTerima: item.tanggalSerahTerima
      ? new Date(item.tanggalSerahTerima).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    keterangan: item.keterangan || "",
    nomorBerkas: item.nomorBerkas || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof SerahTerimaFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field changes
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nomorBeritaAcara?.trim()) {
      newErrors.nomorBeritaAcara = "Nomor Berita Acara wajib diisi";
    }
    if (!formData.pihakPenyerah?.trim()) {
      newErrors.pihakPenyerah = "Pihak Penyerah wajib diisi";
    }
    if (!formData.pihakPenerima?.trim()) {
      newErrors.pihakPenerima = "Pihak Penerima wajib diisi";
    }
    if (!formData.tanggalSerahTerima) {
      newErrors.tanggalSerahTerima = "Tanggal Serah Terima wajib diisi";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await onSave(formData);
    } catch (error) {
      console.error("Error saving edit:", error);
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
        <div className="p-6 border-b bg-purple-50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FileCheck className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Edit Data Serah Terima
              </h2>
              <p className="text-sm text-gray-600">
                Perbarui informasi serah terima yang sudah disetujui
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

        {/* Archive Info */}
        <div className="p-6 bg-blue-50 border-b">
          <h3 className="font-semibold text-blue-900 mb-2">Informasi Berkas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="font-medium text-blue-800">Nomor Berkas:</span>
              <span className="ml-2 text-blue-900">
                {firstArchive?.nomorBerkas || item.nomorBerkas || "-"}
              </span>
            </div>
            <div>
              <span className="font-medium text-blue-800">Nomor Surat:</span>
              <span className="ml-2 text-blue-900">
                {firstArchive?.nomorSurat || "-"}
              </span>
            </div>
            <div className="md:col-span-2">
              <span className="font-medium text-blue-800">Judul:</span>
              <span className="ml-2 text-blue-900">
                {firstArchive?.judulBerkas || "-"}
              </span>
            </div>
            {item.archives && item.archives.length > 1 && (
              <div className="md:col-span-2">
                <span className="font-medium text-blue-800">Total Berkas:</span>
                <span className="ml-2 text-blue-900">
                  {item.archives.length} berkas
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nomor Berita Acara *
            </label>
            <input
              type="text"
              value={formData.nomorBeritaAcara}
              onChange={(e) => handleChange("nomorBeritaAcara", e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.nomorBeritaAcara ? "border-red-500" : "border-gray-300"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pihak Penyerah *
              </label>
              <input
                type="text"
                value={formData.pihakPenyerah}
                onChange={(e) => handleChange("pihakPenyerah", e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.pihakPenyerah ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Nama pihak yang menyerahkan"
                disabled={loading}
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
                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.pihakPenerima ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Nama pihak yang menerima"
                disabled={loading}
              />
              {errors.pihakPenerima && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.pihakPenerima}
                </p>
              )}
            </div>
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
              className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.tanggalSerahTerima ? "border-red-500" : "border-gray-300"
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
              value={formData.keterangan || ""}
              onChange={(e) => handleChange("keterangan", e.target.value)}
              rows={3}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent border-gray-300"
              placeholder="Keterangan tambahan (opsional)"
              disabled={loading}
            />
          </div>

          {/* Info Box */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <strong>Catatan:</strong> Perubahan data akan tercatat dalam
              sistem. Pastikan informasi yang dimasukkan sudah benar.
            </p>
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
              disabled={loading}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Menyimpan...
                </>
              ) : (
                <>
                  <FileCheck className="h-4 w-4 mr-2" />
                  Simpan Perubahan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
