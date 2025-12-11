"use client";

import React, { useState } from "react";
import {
  Edit2,
  Trash2,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileText,
  Calendar,
  CalendarDays,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  ChevronDown,
  ChevronRight,
  Package,
} from "lucide-react";
import { SerahTerimaRecord } from "@/types/archive";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface PeriodFilters {
  startMonth: string;
  endMonth: string;
  year: string;
}

interface SerahTerimaTableProps {
  serahTerima: SerahTerimaRecord[];
  loading: boolean;
  onView: (serahTerima: SerahTerimaRecord) => void;
  onApprove: (serahTerima: SerahTerimaRecord) => void;
  onReject: (serahTerima: SerahTerimaRecord) => void;
  onEdit: (serahTerima: SerahTerimaRecord) => void;
  onDelete: (serahTerima: SerahTerimaRecord) => void;
  onSort: (field: string) => void;
  sortField: string;
  sortOrder: "asc" | "desc";
  onColumnFilter: (column: string, value: string) => void;
  columnFilters: Record<string, string>;
  onExport: () => void;
  onAdd: () => void;
  isExporting: boolean;
  periodFilters: PeriodFilters;
  onPeriodFilterChange: (field: keyof PeriodFilters, value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
}

const TABLE_HEADERS = [
  { key: "statusUsulan", label: "Status", sortable: true },
  { key: "nomorBerkas", label: "No. Berkas", sortable: true },
  { key: "pihakPenyerah", label: "Pihak Penyerah", sortable: true },
  { key: "pihakPenerima", label: "Pihak Penerima", sortable: true },
  { key: "tanggalUsulan", label: "Tgl Usulan", sortable: true },
  { key: "archives", label: "Arsip", sortable: false },
  { key: "nomorBeritaAcara", label: "No. BA", sortable: false },
  { key: "tanggalSerahTerima", label: "Tgl Serah Terima", sortable: false },
  { key: "actions", label: "Aksi", sortable: false },
];

const MONTHS = [
  { value: "1", label: "Januari" },
  { value: "2", label: "Februari" },
  { value: "3", label: "Maret" },
  { value: "4", label: "April" },
  { value: "5", label: "Mei" },
  { value: "6", label: "Juni" },
  { value: "7", label: "Juli" },
  { value: "8", label: "Agustus" },
  { value: "9", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Desember" },
];

export default function SerahTerimaTable({
  serahTerima,
  loading,
  onView,
  onApprove,
  onReject,
  onEdit,
  onDelete,
  onSort,
  sortField,
  sortOrder,
  onColumnFilter,
  columnFilters,
  onExport,
  onAdd,
  isExporting,
  periodFilters,
  onPeriodFilterChange,
  statusFilter,
  onStatusFilterChange,
}: SerahTerimaTableProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState<Record<string, string>>({});
  const [showPeriodFilters, setShowPeriodFilters] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRowExpansion = (id: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown size={14} className="text-gray-400" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp size={14} className="text-purple-600" />
    ) : (
      <ArrowDown size={14} className="text-purple-600" />
    );
  };

  const handleInputChange = (column: string, value: string) => {
    setLocalFilters((prev) => ({ ...prev, [column]: value }));
    setTimeout(() => {
      onColumnFilter(column, value);
    }, 300);
  };

  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear + 2; i >= currentYear - 10; i--) {
      years.push(i);
    }
    return years;
  };

  const hasPeriodFilters =
    periodFilters.year || periodFilters.startMonth || periodFilters.endMonth;

  const getPeriodFilterText = () => {
    if (!hasPeriodFilters) return "";

    let text = "";
    if (periodFilters.year) {
      text += `Tahun ${periodFilters.year}`;
    }

    if (periodFilters.startMonth && periodFilters.endMonth) {
      const startMonthName = MONTHS.find(
        (m) => m.value === periodFilters.startMonth
      )?.label;
      const endMonthName = MONTHS.find(
        (m) => m.value === periodFilters.endMonth
      )?.label;

      if (periodFilters.startMonth === periodFilters.endMonth) {
        text += text ? ` - ${startMonthName}` : `Bulan ${startMonthName}`;
      } else {
        text += text
          ? ` - ${startMonthName} s/d ${endMonthName}`
          : `${startMonthName} s/d ${endMonthName}`;
      }
    }

    return text;
  };

  const clearPeriodFilters = () => {
    onPeriodFilterChange("year", "");
    onPeriodFilterChange("startMonth", "");
    onPeriodFilterChange("endMonth", "");
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch (error) {
      return "-";
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: {
        label: "Menunggu",
        className: "bg-yellow-100 text-yellow-800",
        icon: Clock,
      },
      APPROVED: {
        label: "Disetujui",
        className: "bg-green-100 text-green-800",
        icon: CheckCircle,
      },
      REJECTED: {
        label: "Ditolak",
        className: "bg-red-100 text-red-800",
        icon: XCircle,
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;

    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}
      >
        <Icon size={12} className="mr-1" />
        {config.label}
      </span>
    );
  };

  const getRowColorClass = (index: number) => {
    return index % 2 === 0
      ? "bg-white hover:bg-purple-50"
      : "bg-gray-50 hover:bg-purple-50";
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header Controls */}
      <div className="px-6 py-3 bg-gray-50 border-b flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">
            {serahTerima.length} serah terima ditemukan
          </span>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="text-sm border border-gray-300 rounded px-3 py-1 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">Semua Status</option>
            <option value="PENDING">Menunggu</option>
            <option value="APPROVED">Disetujui</option>
            <option value="REJECTED">Ditolak</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          {/* Add Button */}
          <button
            onClick={onAdd}
            className="px-3 py-1.5 text-sm rounded bg-purple-600 text-white hover:bg-purple-700 transition-colors"
          >
            + Tambah Serah Terima
          </button>

          {/* Export Button */}
          <button
            onClick={onExport}
            disabled={isExporting}
            className="px-3 py-1.5 text-sm rounded bg-yellow-600 text-white hover:bg-yellow-700 transition-colors disabled:opacity-50 flex items-center"
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Exporting...
              </>
            ) : (
              "Export Excel"
            )}
          </button>

          {/* Toggle Period Filter */}
          <button
            onClick={() => setShowPeriodFilters(!showPeriodFilters)}
            className={`text-sm flex items-center transition-colors px-3 py-1.5 rounded ${
              hasPeriodFilters
                ? "bg-purple-100 text-purple-800 hover:bg-purple-200"
                : "text-purple-600 hover:text-purple-800 hover:bg-purple-50"
            }`}
          >
            <CalendarDays size={16} className="mr-1" />
            {showPeriodFilters ? "Sembunyikan" : "Filter"} Periode
          </button>

          {/* Toggle Column Filter */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-sm text-purple-600 hover:text-purple-800 flex items-center transition-colors"
          >
            <Filter size={16} className="mr-1" />
            {showFilters ? "Sembunyikan" : "Filter"} Kolom
          </button>
        </div>
      </div>

      {/* Period Filters Banner */}
      {hasPeriodFilters && (
        <div className="px-6 py-2 bg-purple-50 border-b border-purple-200 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Calendar size={16} className="text-purple-600" />
            <span className="text-sm font-medium text-purple-800">
              Filter Periode: {getPeriodFilterText()}
            </span>
          </div>
          <button
            onClick={clearPeriodFilters}
            className="text-xs text-purple-600 hover:text-purple-800 underline"
          >
            Hapus Filter
          </button>
        </div>
      )}

      {/* Period Filters */}
      {showPeriodFilters && (
        <div className="px-6 py-4 bg-purple-50 border-b border-purple-200">
          <h4 className="text-sm font-semibold text-purple-800 mb-3 flex items-center">
            <CalendarDays size={16} className="mr-2" />
            Filter Berdasarkan Periode dan Tahun
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-purple-700 mb-1">
                Tahun
              </label>
              <select
                value={periodFilters.year}
                onChange={(e) => onPeriodFilterChange("year", e.target.value)}
                className="w-full text-sm border border-purple-300 rounded px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
              >
                <option value="">Semua Tahun</option>
                {generateYears().map((year) => (
                  <option key={year} value={year.toString()}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-purple-700 mb-1">
                Dari Bulan
              </label>
              <select
                value={periodFilters.startMonth}
                onChange={(e) =>
                  onPeriodFilterChange("startMonth", e.target.value)
                }
                className="w-full text-sm border border-purple-300 rounded px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
              >
                <option value="">Pilih Bulan</option>
                {MONTHS.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-purple-700 mb-1">
                Sampai Bulan
              </label>
              <select
                value={periodFilters.endMonth}
                onChange={(e) =>
                  onPeriodFilterChange("endMonth", e.target.value)
                }
                className="w-full text-sm border border-purple-300 rounded px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
              >
                <option value="">Pilih Bulan</option>
                {MONTHS.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Column Filters */}
      {showFilters && (
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Nomor Berkas
              </label>
              <input
                type="text"
                value={
                  localFilters.nomorBerkas || columnFilters.nomorBerkas || ""
                }
                onChange={(e) =>
                  handleInputChange("nomorBerkas", e.target.value)
                }
                className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Filter nomor berkas..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Pihak Penyerah
              </label>
              <input
                type="text"
                value={
                  localFilters.pihakPenyerah ||
                  columnFilters.pihakPenyerah ||
                  ""
                }
                onChange={(e) =>
                  handleInputChange("pihakPenyerah", e.target.value)
                }
                className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Filter pihak penyerah..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Pihak Penerima
              </label>
              <input
                type="text"
                value={
                  localFilters.pihakPenerima ||
                  columnFilters.pihakPenerima ||
                  ""
                }
                onChange={(e) =>
                  handleInputChange("pihakPenerima", e.target.value)
                }
                className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Filter pihak penerima..."
              />
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                {/* Expand column */}
              </th>
              {TABLE_HEADERS.map((header) => (
                <th
                  key={header.key}
                  onClick={() => header.sortable && onSort(header.key)}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    header.sortable
                      ? "cursor-pointer hover:bg-gray-100 transition-colors"
                      : ""
                  }`}
                >
                  <div className="flex items-center space-x-1">
                    <span>{header.label}</span>
                    {header.sortable && getSortIcon(header.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {serahTerima.map((item, index) => (
              <React.Fragment key={item.id}>
                <tr className={`transition-colors ${getRowColorClass(index)}`}>
                  {/* Expand Button */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleRowExpansion(item.id)}
                      className="text-purple-600 hover:text-purple-900"
                      title={
                        expandedRows.has(item.id)
                          ? "Sembunyikan"
                          : "Lihat Detail Arsip"
                      }
                    >
                      {expandedRows.has(item.id) ? (
                        <ChevronDown size={18} />
                      ) : (
                        <ChevronRight size={18} />
                      )}
                    </button>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(item.statusUsulan)}
                  </td>

                  {/* Nomor Berkas */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {item.nomorBerkas}
                    </div>
                  </td>

                  {/* Pihak Penyerah */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {item.pihakPenyerah}
                    </div>
                  </td>

                  {/* Pihak Penerima */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {item.pihakPenerima}
                    </div>
                  </td>

                  {/* Tanggal Usulan */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(item.tanggalUsulan)}
                    </div>
                  </td>

                  {/* Archives Count */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Package size={14} className="mr-1 text-purple-600" />
                      <span className="font-medium">
                        {item.archives?.length || 0} arsip
                      </span>
                    </div>
                  </td>

                  {/* Nomor Berita Acara */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {item.nomorBeritaAcara || "-"}
                    </div>
                  </td>

                  {/* Tanggal Serah Terima */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(item.tanggalSerahTerima)}
                    </div>
                  </td>

                  {/* Aksi */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-1">
                      <button
                        onClick={() => onView(item)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                        title="Lihat Detail"
                      >
                        <Eye size={16} />
                      </button>

                      {item.statusUsulan === "PENDING" && (
                        <>
                          <button
                            onClick={() => onApprove(item)}
                            className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors"
                            title="Setujui"
                          >
                            <CheckCircle size={16} />
                          </button>
                          <button
                            onClick={() => onReject(item)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                            title="Tolak"
                          >
                            <XCircle size={16} />
                          </button>
                        </>
                      )}

                      {item.statusUsulan === "APPROVED" && (
                        <button
                          onClick={() => onEdit(item)}
                          className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50 transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                      )}

                      <button
                        onClick={() => onDelete(item)}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                        title="Hapus"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Expanded Row - Archive Details */}
                {expandedRows.has(item.id) && (
                  <tr className={getRowColorClass(index)}>
                    <td colSpan={10} className="px-6 py-4 bg-purple-50">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm text-purple-900 mb-3">
                          Daftar Arsip ({item.archives?.length || 0}):
                        </h4>
                        {item.archives && item.archives.length > 0 ? (
                          <div className="grid grid-cols-1 gap-2">
                            {item.archives.map((sta, idx) => (
                              <div
                                key={sta.id}
                                className="bg-white rounded-lg p-3 border border-purple-200"
                              >
                                <div className="flex items-start">
                                  <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-purple-100 text-purple-800 text-xs font-medium mr-3 flex-shrink-0">
                                    {idx + 1}
                                  </span>
                                  <div className="flex-1 text-sm">
                                    <p className="font-medium text-gray-900">
                                      {sta.archive?.judulBerkas || "-"}
                                    </p>
                                    <div className="mt-1 text-xs text-gray-600 space-y-1">
                                      <p>
                                        <span className="font-medium">
                                          No. Surat:
                                        </span>{" "}
                                        {sta.archive?.nomorSurat || "-"}
                                      </p>
                                      <p>
                                        <span className="font-medium">
                                          Perihal:
                                        </span>{" "}
                                        {sta.archive?.perihal || "-"}
                                      </p>
                                      <p>
                                        <span className="font-medium">
                                          Tanggal:
                                        </span>{" "}
                                        {formatDate(sta.archive?.tanggal)}
                                      </p>
                                      <p>
                                        <span className="font-medium">
                                          Lokasi:
                                        </span>{" "}
                                        {sta.archive?.lokasiSimpan || "-"}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">
                            Tidak ada arsip terlampir
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {serahTerima.length === 0 && !loading && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Tidak ada data ditemukan
          </h3>
          <p className="text-gray-500 mb-4">
            {Object.keys(columnFilters).length > 0 || statusFilter
              ? "Coba ubah filter pencarian yang dipilih"
              : "Belum ada usulan serah terima"}
          </p>
          <button
            onClick={onAdd}
            className="text-purple-600 hover:text-purple-800 text-sm underline"
          >
            + Tambah Serah Terima Baru
          </button>
        </div>
      )}
    </div>
  );
}
