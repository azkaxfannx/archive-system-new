"use client";

import React from "react";
import { X, FileText, User, Calendar, CheckCircle, XCircle, Clock } from "lucide-react";
import { SerahTerimaRecord } from "@/types/archive";

interface SerahTerimaDetailModalProps {
  item: SerahTerimaRecord;
  onClose: () => void;
}

export default function SerahTerimaDetailModal({
  item,
  onClose,
}: SerahTerimaDetailModalProps) {
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "-";
    }
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      PENDING: {
        label: "Menunggu Persetujuan",
        color: "yellow",
        icon: Clock,
      },
      APPROVED: {
        label: "Disetujui",
        color: "green",
        icon: CheckCircle,
      },
      REJECTED: {
        label: "Ditolak",
        color: "red",
        icon: XCircle,
      },
    };
    return configs[status as keyof typeof configs] || configs.PENDING;
  };

  const statusConfig = getStatusConfig(item.statusUsulan);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`p-6 border-b bg-${statusConfig.color}-50 flex items-center justify-between`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 bg-${statusConfig.color}-100 rounded-lg`}>
              <FileText className={`h-6 w-6 text-${statusConfig.color}-600`} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Detail Serah Terima
              </h2>
              <div className="flex items-center mt-1">
                <StatusIcon size={16} className={`text-${statusConfig.color}-600 mr-1`} />
                <span className={`text-sm font-medium text-${statusConfig.color}-800`}>
                  {statusConfig.label}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Informasi Usulan */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="mr-2 text-blue-600" size={20} />
              Informasi Usulan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Pihak Penyerah
                </label>
                <p className="text-sm text-gray-900 mt-1">
                  {item.pihakPenyerah}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Pihak Penerima
                </label>
                <p className="text-sm text-gray-900 mt-1">
                  {item.pihakPenerima}
                </p>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-600">
                  Tanggal Usulan
                </label>
                <p className="text-sm text-gray-900 mt-1">
                  {formatDate(item.tanggalUsulan)}
                </p>
              </div>
            </div>
          </div>

          {/* Detail Berkas */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="mr-2 text-purple-600" size={20} />
              Detail Berkas
            </h3>
            <div className="bg-purple-50 p-4 rounded-lg space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-purple-800">
                    Nomor Berkas
                  </label>
                  <p className="text-sm text-purple-900 mt-1">
                    {item.archive?.nomorBerkas || "-"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-purple-800">
                    Nomor Surat
                  </label>
                  <p className="text-sm text-purple-900 mt-1">
                    {item.archive?.nomorSurat || "-"}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-purple-800">
                  Judul Berkas
                </label>
                <p className="text-sm text-purple-900 mt-1">
                  {item.archive?.judulBerkas || "-"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-purple-800">
                  Perihal
                </label>
                <p className="text-sm text-purple-900 mt-1">
                  {item.archive?.perihal || "-"}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-purple-800">
                    Klasifikasi
                  </label>
                  <p className="text-sm text-purple-900 mt-1">
                    {item.archive?.klasifikasi || "-"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-purple-800">
                    Lokasi Simpan
                  </label>
                  <p className="text-sm text-purple-900 mt-1">
                    {item.archive?.lokasiSimpan || "-"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-purple-800">
                    Tanggal Surat
                  </label>
                  <p className="text-sm text-purple-900 mt-1">
                    {item.archive?.tanggal
                      ? new Date(item.archive.tanggal).toLocaleDateString(
                          "id-ID"
                        )
                      : "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Informasi Approval (jika sudah disetujui) */}
          {item.statusUsulan === "APPROVED" && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CheckCircle className="mr-2 text-green-600" size={20} />
                Informasi Serah Terima
              </h3>
              <div className="bg-green-50 p-4 rounded-lg space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-green-800">
                      Nomor Berita Acara
                    </label>
                    <p className="text-sm text-green-900 mt-1">
                      {item.nomorBeritaAcara || "-"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-green-800">
                      Tanggal Serah Terima
                    </label>
                    <p className="text-sm text-green-900 mt-1">
                      {formatDate(item.tanggalSerahTerima)}
                    </p>
                  </div>
                </div>
                {item.keterangan && (
                  <div>
                    <label className="text-sm font-medium text-green-800">
                      Keterangan
                    </label>
                    <p className="text-sm text-green-900 mt-1">
                      {item.keterangan}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Informasi Penolakan (jika ditolak) */}
          {item.statusUsulan === "REJECTED" && item.alasanPenolakan && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <XCircle className="mr-2 text-red-600" size={20} />
                Alasan Penolakan
              </h3>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-red-900">{item.alasanPenolakan}</p>
              </div>
            </div>
          )}

          {/* Timestamp */}
          <div className="border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-500">
              <div>
                <label className="font-medium">Dibuat:</label>
                <p>{formatDate(item.createdAt)}</p>
              </div>
              <div>
                <label className="font-medium">Terakhir Diubah:</label>
                <p>{formatDate(item.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}