"use client";

import React, { useState } from "react";
import { X, XCircle, AlertTriangle } from "lucide-react";
import { SerahTerimaRecord } from "@/types/archive";

interface SerahTerimaRejectModalProps {
  item: SerahTerimaRecord;
  onReject: (alasanPenolakan: string) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export default function SerahTerimaRejectModal({
  item,
  onReject,
  onCancel,
  loading = false,
}: SerahTerimaRejectModalProps) {
  const [alasanPenolakan, setAlasanPenolakan] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!alasanPenolakan.trim()) {
      setError("Alasan penolakan wajib diisi");
      return;
    }

    try {
      await onReject(alasanPenolakan);
    } catch (error) {
      console.error("Reject error:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-xl w-full">
        {/* Header */}
        <div className="p-6 border-b bg-red-50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Tolak Usulan Serah Terima
              </h2>
              <p className="text-sm text-gray-600">
                Berikan alasan penolakan usulan ini
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
          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-yellow-800">
                <strong>Perhatian:</strong> Usulan yang ditolak tidak dapat
                disetujui kembali. Pastikan alasan penolakan sudah tepat.
              </p>
            </div>
          </div>

          {/* Info Usulan */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">
              Informasi Usulan
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-gray-700">Pihak Penyerah:</span>
                <span className="ml-2 text-gray-900">{item.pihakPenyerah}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Pihak Penerima:</span>
                <span className="ml-2 text-gray-900">{item.pihakPenerima}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Berkas:</span>
                <span className="ml-2 text-gray-900">
                  {item.archive?.judulBerkas || "-"}
                </span>
              </div>
            </div>
          </div>

          {/* Form Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alasan Penolakan *
            </label>
            <textarea
              value={alasanPenolakan}
              onChange={(e) => {
                setAlasanPenolakan(e.target.value);
                if (error) setError("");
              }}
              rows={4}
              className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                error ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Jelaskan alasan penolakan usulan ini..."
              disabled={loading}
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            <p className="text-xs text-gray-500 mt-1">
              Alasan ini akan tercatat dan dapat dilihat oleh pengusul
            </p>
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
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Menolak...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Tolak Usulan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}