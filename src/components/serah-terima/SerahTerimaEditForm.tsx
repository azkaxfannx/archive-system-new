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
  const [formData, setFormData] = useState<SerahTerimaFormData>({
    nomorBeritaAcara: item.nomorBeritaAcara,
    pihakPenyerah: item.pihakPenyerah,
    pihakPenerima: item.pihakPenerima,
    tanggalSerahTerima: item.tanggalSerahTerima.split("T")[0],
    keterangan: item.keterangan || "",
    archiveId: item.archiveId,
  });

  const handleChange = (field: keyof SerahTerimaFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
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
            <h2 className="text-xl font-bold text-gray-900">
              Edit Serah Terima
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Nomor Berita Acara
            </label>
            <input
              type="text"
              value={formData.nomorBeritaAcara}
              onChange={(e) => handleChange("nomorBeritaAcara", e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Pihak Penyerah
              </label>
              <input
                type="text"
                value={formData.pihakPenyerah}
                onChange={(e) => handleChange("pihakPenyerah", e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Pihak Penerima
              </label>
              <input
                type="text"
                value={formData.pihakPenerima}
                onChange={(e) => handleChange("pihakPenerima", e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              <Calendar className="inline h-4 w-4 mr-1" />
              Tanggal Serah Terima
            </label>
            <input
              type="date"
              value={formData.tanggalSerahTerima}
              onChange={(e) =>
                handleChange("tanggalSerahTerima", e.target.value)
              }
              className="w-full border rounded-lg px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Keterangan</label>
            <textarea
              value={formData.keterangan || ""}
              onChange={(e) => handleChange("keterangan", e.target.value)}
              rows={3}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Keterangan tambahan (opsional)"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-6 py-2 border rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              {loading ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
