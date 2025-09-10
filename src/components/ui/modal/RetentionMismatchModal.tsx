import React from "react";
import { RetentionMismatch } from "@/utils/classificationRules";

interface RetentionMismatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFixAll: () => void;
  onContinueAnyway: () => void;
  mismatches: RetentionMismatch[];
  isLoading?: boolean;
}

export default function RetentionMismatchModal({
  isOpen,
  onClose,
  onFixAll,
  onContinueAnyway,
  mismatches,
  isLoading,
}: RetentionMismatchModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>

        <h3 className="text-lg font-semibold mb-4">
          Masa Retensi Tidak Sesuai Klasifikasi
        </h3>

        <p className="text-sm text-gray-700 mb-4">
          Ditemukan {mismatches.length} baris dengan masa retensi yang tidak
          sesuai:
        </p>

        <div className="max-h-60 overflow-y-auto border rounded-lg mb-4">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase">
                  Baris
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase">
                  Klasifikasi
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase">
                  Retensi Saat Ini
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase">
                  Seharusnya
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase">
                  Aturan
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mismatches.map((m, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-sm font-medium text-gray-900">
                    {m.row}
                  </td>
                  <td className="px-3 py-2 text-sm text-blue-800">
                    {m.classification}
                  </td>
                  <td className="px-3 py-2 text-sm text-red-600 font-semibold">
                    {m.currentRetention} tahun
                  </td>
                  <td className="px-3 py-2 text-sm text-green-600 font-semibold">
                    {m.expectedRetention} tahun
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-700">
                    {m.ruleName}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap gap-2 justify-end">
          <button
            onClick={onFixAll}
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {isLoading ? "Memproses..." : "Perbaiki Semuanya"}
          </button>
          <button
            onClick={onContinueAnyway}
            disabled={isLoading}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
          >
            {isLoading ? "Memproses..." : "Tetap Lanjutkan"}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
