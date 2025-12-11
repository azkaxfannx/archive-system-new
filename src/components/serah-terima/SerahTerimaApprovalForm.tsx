"use client";

import React, { useState } from "react";
import { X, CheckCircle, Calendar } from "lucide-react";
import { SerahTerimaRecord } from "@/types/archive";

interface ApprovalFormData {
  nomorBeritaAcara: string;
  tanggalSerahTerima: string;
  keterangan: string;
}

interface SerahTerimaApprovalFormProps {
  item: SerahTerimaRecord;
  onApprove: (data: ApprovalFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export default function SerahTerimaApprovalForm({
  item,
  onApprove,
  onCancel,
  loading = false,
}: SerahTerimaApprovalFormProps) {
  const today = new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState<ApprovalFormData>({
    nomorBeritaAcara: "",
    tanggalSerahTerima: today,
    keterangan: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof ApprovalFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nomorBeritaAcara?.trim()) {
      newErrors.nomorBeritaAcara = "Nomor Berita Acara wajib diisi";
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
      await onApprove(formData);
    } catch (error) {
      console.error("Approval error:", error);
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

  // FIXED: Get first archive if available
  const getFirstArchiveInfo = () => {
    if (!item.archives || item.archives.length === 0) {
      return { judulBerkas: "-", nomorBerkas: item.nomorBerkas || "-" };
    }

    const firstArchive = item.archives[0];
    return {
      judulBerkas: firstArchive.archive?.judulBerkas || "-",
      nomorBerkas: firstArchive.archive?.nomorBerkas || item.nomorBerkas || "-",
    };
  };

  const firstArchive = getFirstArchiveInfo();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b bg-green-50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Setujui Usulan Serah Terima
              </h2>
              <p className="text-sm text-gray-600">
                Lengkapi data untuk menyetujui usulan
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
              <div className="md:col-span-2">
                <span className="font-medium text-blue-800">Arsip:</span>
                <span className="ml-2 text-blue-900">
                  {firstArchive.judulBerkas}
                </span>
              </div>
              <div>
                <span className="font-medium text-blue-800">Nomor Berkas:</span>
                <span className="ml-2 text-blue-900">
                  {firstArchive.nomorBerkas}
                </span>
              </div>
              <div>
                <span className="font-medium text-blue-800">Jumlah Arsip:</span>
                <span className="ml-2 text-blue-900">
                  {item.archives?.length || 0} arsip
                </span>
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

          {/* Form Fields */}
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
                rows={3}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent border-gray-300"
                placeholder="Keterangan tambahan (opsional)"
                disabled={loading}
              />
            </div>

            {/* Info Box */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">
                <strong>Catatan:</strong> Setelah disetujui, usulan ini akan
                menjadi data serah terima yang telah terlaksana dan tidak dapat
                diubah statusnya kembali ke pending.
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t">
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
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Menyetujui...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Setujui Usulan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
