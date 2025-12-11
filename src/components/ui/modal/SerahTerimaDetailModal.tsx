"use client";

import React from "react";
import {
  X,
  FileCheck,
  CheckCircle,
  XCircle,
  Clock,
  Package,
} from "lucide-react";
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
      });
    } catch (error) {
      return "-";
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: {
        label: "Menunggu Persetujuan",
        className: "bg-yellow-100 text-yellow-800 border-yellow-300",
        icon: Clock,
      },
      APPROVED: {
        label: "Disetujui",
        className: "bg-green-100 text-green-800 border-green-300",
        icon: CheckCircle,
      },
      REJECTED: {
        label: "Ditolak",
        className: "bg-red-100 text-red-800 border-red-300",
        icon: XCircle,
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;

    const Icon = config.icon;

    return (
      <div
        className={`inline-flex items-center px-4 py-2 rounded-lg border ${config.className}`}
      >
        <Icon size={18} className="mr-2" />
        <span className="font-semibold">{config.label}</span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b bg-purple-50 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FileCheck className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Detail Serah Terima
              </h2>
              <p className="text-sm text-gray-600">
                Nomor Berkas: {item.nomorBerkas}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status */}
          <div className="flex justify-center">
            {getStatusBadge(item.statusUsulan)}
          </div>

          {/* Usulan Information */}
          <div className="bg-purple-50 rounded-lg p-5 border border-purple-200">
            <h3 className="font-semibold text-purple-900 mb-4 flex items-center">
              <FileCheck className="mr-2" size={18} />
              Informasi Usulan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-purple-700 uppercase tracking-wide">
                  Pihak Penyerah
                </label>
                <p className="mt-1 text-sm text-gray-900 font-medium">
                  {item.pihakPenyerah}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-purple-700 uppercase tracking-wide">
                  Pihak Penerima
                </label>
                <p className="mt-1 text-sm text-gray-900 font-medium">
                  {item.pihakPenerima}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-purple-700 uppercase tracking-wide">
                  Nomor Berkas
                </label>
                <p className="mt-1 text-sm text-gray-900 font-medium">
                  {item.nomorBerkas}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-purple-700 uppercase tracking-wide">
                  Tanggal Usulan
                </label>
                <p className="mt-1 text-sm text-gray-900 font-medium">
                  {formatDate(item.tanggalUsulan)}
                </p>
              </div>
            </div>
          </div>

          {/* Archives List */}
          <div className="bg-blue-50 rounded-lg p-5 border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-4 flex items-center">
              <Package className="mr-2" size={18} />
              Daftar Arsip ({item.archives?.length || 0})
            </h3>
            {item.archives && item.archives.length > 0 ? (
              <div className="space-y-3">
                {item.archives.map((sta, idx) => (
                  <div
                    key={sta.id}
                    className="bg-white rounded-lg p-4 border border-blue-200"
                  >
                    <div className="flex items-start">
                      <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-blue-100 text-blue-800 text-sm font-bold mr-3 flex-shrink-0">
                        {idx + 1}
                      </span>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 mb-2">
                          {sta.archive?.judulBerkas || "-"}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="font-medium text-gray-600">
                              No. Surat:
                            </span>
                            <span className="ml-2 text-gray-900">
                              {sta.archive?.nomorSurat || "-"}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">
                              Klasifikasi:
                            </span>
                            <span className="ml-2 text-gray-900">
                              {sta.archive?.klasifikasi || "-"}
                            </span>
                          </div>
                          <div className="md:col-span-2">
                            <span className="font-medium text-gray-600">
                              Perihal:
                            </span>
                            <span className="ml-2 text-gray-900">
                              {sta.archive?.perihal || "-"}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">
                              Tanggal:
                            </span>
                            <span className="ml-2 text-gray-900">
                              {formatDate(sta.archive?.tanggal)}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">
                              Lokasi:
                            </span>
                            <span className="ml-2 text-gray-900">
                              {sta.archive?.lokasiSimpan || "-"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                Tidak ada arsip terlampir
              </p>
            )}
          </div>

          {/* Approval Details (if approved) */}
          {item.statusUsulan === "APPROVED" && (
            <div className="bg-green-50 rounded-lg p-5 border border-green-200">
              <h3 className="font-semibold text-green-900 mb-4 flex items-center">
                <CheckCircle className="mr-2" size={18} />
                Detail Persetujuan
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-green-700 uppercase tracking-wide">
                    Nomor Berita Acara
                  </label>
                  <p className="mt-1 text-sm text-gray-900 font-medium">
                    {item.nomorBeritaAcara || "-"}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-green-700 uppercase tracking-wide">
                    Tanggal Serah Terima
                  </label>
                  <p className="mt-1 text-sm text-gray-900 font-medium">
                    {formatDate(item.tanggalSerahTerima)}
                  </p>
                </div>
                {item.keterangan && (
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-green-700 uppercase tracking-wide">
                      Keterangan
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {item.keterangan}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rejection Details (if rejected) */}
          {item.statusUsulan === "REJECTED" && item.alasanPenolakan && (
            <div className="bg-red-50 rounded-lg p-5 border border-red-200">
              <h3 className="font-semibold text-red-900 mb-3 flex items-center">
                <XCircle className="mr-2" size={18} />
                Alasan Penolakan
              </h3>
              <p className="text-sm text-gray-900">{item.alasanPenolakan}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
