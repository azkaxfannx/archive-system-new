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
  onEdit: (serahTerima: SerahTerimaRecord) => void;
  onDelete: (serahTerima: SerahTerimaRecord) => void;
  onSort: (field: string) => void;
  sortField: string;
  sortOrder: "asc" | "desc";
  onColumnFilter: (column: string, value: string) => void;
  columnFilters: Record<string, string>;
  onExport: () => void;
  isExporting: boolean;
  periodFilters: PeriodFilters;
  onPeriodFilterChange: (field: keyof PeriodFilters, value: string) => void;
}

const TABLE_HEADERS = [
  { key: "nomorBeritaAcara", label: "No. Berita Acara", sortable: true },
  { key: "pihakPenyerah", label: "Pihak Penyerah", sortable: true },
  { key: "pihakPenerima", label: "Pihak Penerima", sortable: true },
  { key: "judulBerkas", label: "Berkas", sortable: false },
  { key: "tanggalSerahTerima", label: "Tgl Serah Terima", sortable: true },
  { key: "keterangan", label: "Keterangan", sortable: false },
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
  onEdit,
  onDelete,
  onSort,
  sortField,
  sortOrder,
  onColumnFilter,
  columnFilters,
  onExport,
  isExporting,
  periodFilters,
  onPeriodFilterChange,
}: SerahTerimaTableProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState<Record<string, string>>({});
  const [showPeriodFilters, setShowPeriodFilters] = useState(false);

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
        </div>

        <div className="flex items-center space-x-2">
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
            {/* Year Filter */}
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

            {/* Start Month Filter */}
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

            {/* End Month Filter */}
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

          <p className="text-xs text-purple-600 mt-2">
            <strong>Tips:</strong> Pilih tahun untuk memfilter berdasarkan tahun
            saja, atau kombinasikan dengan bulan untuk periode yang lebih
            spesifik.
          </p>
        </div>
      )}

      {/* Column Filters */}
      {showFilters && (
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Nomor Berita Acara
              </label>
              <input
                type="text"
                value={
                  localFilters.nomorBeritaAcara ||
                  columnFilters.nomorBeritaAcara ||
                  ""
                }
                onChange={(e) =>
                  handleInputChange("nomorBeritaAcara", e.target.value)
                }
                className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Filter nomor berita acara..."
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
              <tr
                key={item.id}
                className={`transition-colors ${getRowColorClass(index)}`}
              >
                {/* No. Berita Acara */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {item.nomorBeritaAcara}
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

                {/* Judul Berkas */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {item.archive?.judulBerkas || "-"}
                  </div>
                </td>

                {/* Tgl Serah Terima */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatDate(item.tanggalSerahTerima)}
                  </div>
                </td>

                {/* Keterangan */}
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 max-w-xs truncate">
                    {item.keterangan || "-"}
                  </div>
                </td>

                {/* Aksi */}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-1">
                    <button
                      onClick={() => onEdit(item)}
                      className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
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
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {serahTerima.length === 0 && !loading && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Tidak ada serah terima ditemukan
          </h3>
          <p className="text-gray-500">
            {Object.keys(columnFilters).length > 0
              ? "Coba ubah filter pencarian yang dipilih"
              : "Belum ada data serah terima"}
          </p>
          {hasPeriodFilters && (
            <button
              onClick={clearPeriodFilters}
              className="text-purple-600 hover:text-purple-800 text-sm underline mt-2"
            >
              Hapus Filter Periode
            </button>
          )}
        </div>
      )}
    </div>
  );
}
