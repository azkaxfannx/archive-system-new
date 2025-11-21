// components/serah-terima/SerahTerimaManagement.tsx
"use client";

import React, { useEffect, useState } from "react";
import Header from "../layout/Header";
import SerahTerimaStatsCards from "../ui/SerahTerimaStatsCards";
import SerahTerimaTable from "./SerahTerimaTable";
import { SerahTerimaRecord, SerahTerimaFormData } from "@/types/archive";
import { archiveAPI } from "@/services/archiveAPI";
import * as XLSX from "xlsx";
import SuccessModal from "../ui/modal/SuccessModal";
import SerahTerimaEditForm from "./SerahTerimaEditForm";
import DeleteConfirmationModal from "./DeleteConfirmationModal";

export default function SerahTerimaManagement() {
  const [serahTerima, setSerahTerima] = useState<SerahTerimaRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<string>("tanggalSerahTerima");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>(
    {}
  );
  const [isExporting, setIsExporting] = useState(false);

  const [periodFilters, setPeriodFilters] = useState({
    startMonth: "",
    endMonth: "",
    year: "",
  });

  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // edit modal
  const [editingItem, setEditingItem] = useState<SerahTerimaRecord | null>(
    null
  );
  const [saving, setSaving] = useState(false);

  // delete modal
  const [deletingItem, setDeletingItem] = useState<SerahTerimaRecord | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);

  // header refresh trigger
  const [headerRefreshTrigger, setHeaderRefreshTrigger] = useState(0);
  const triggerHeaderRefresh = () => setHeaderRefreshTrigger((v) => v + 1);

  // stats state
  const [stats, setStats] = useState({
    totalCount: 0,
    thisMonthCount: 0,
    thisYearCount: 0,
    pendingCount: 0,
  });

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/serah-terima/stats");
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.error("Failed to fetch serah terima stats:", e);
    }
  };

  const fetchSerahTerima = async () => {
    try {
      setLoading(true);
      const result = await archiveAPI.getAllSerahTerima();
      setSerahTerima(result || []);
    } catch (err) {
      console.error("Error fetching serah terima:", err);
    } finally {
      setLoading(false);
    }
  };

  // initial load
  useEffect(() => {
    fetchSerahTerima();
    fetchStats();
  }, []);

  const handleEdit = (item: SerahTerimaRecord) => setEditingItem(item);

  const handleSaveEdit = async (data: SerahTerimaFormData) => {
    if (!editingItem) return;
    try {
      setSaving(true);
      await archiveAPI.updateSerahTerima(editingItem.id, {
        ...editingItem,
        ...data,
      });
      await fetchSerahTerima();
      await fetchStats();
      triggerHeaderRefresh();
      setEditingItem(null);

      setSuccessMessage("Data serah terima berhasil diperbarui.");
      setShowSuccessModal(true);
    } catch (err) {
      console.error("Error updating serah terima:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => setEditingItem(null);

  const handleDelete = (item: SerahTerimaRecord) => {
    setDeletingItem(item);
  };

  const confirmDelete = async () => {
    if (!deletingItem) return;
    try {
      setDeleting(true);
      await archiveAPI.deleteSerahTerima(deletingItem.id);
      await fetchSerahTerima();
      await fetchStats();
      triggerHeaderRefresh();
      setDeletingItem(null);

      setSuccessMessage("Data serah terima berhasil dihapus.");
      setShowSuccessModal(true);
    } catch (err) {
      console.error("Error deleting serah terima:", err);
    } finally {
      setDeleting(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handleColumnFilter = (column: string, value: string) => {
    setColumnFilters((prev) => ({ ...prev, [column]: value }));
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const allSerahTerima = await archiveAPI.getAllSerahTerima();
      const worksheet = XLSX.utils.json_to_sheet(
        allSerahTerima.map((item: SerahTerimaRecord) => ({
          "NOMOR BERITA ACARA": item.nomorBeritaAcara,
          "PIHAK PENYERAH": item.pihakPenyerah,
          "PIHAK PENERIMA": item.pihakPenerima,
          "TANGGAL SERAH TERIMA": new Date(
            item.tanggalSerahTerima
          ).toLocaleDateString("id-ID"),
          "NOMOR BERKAS": item.archive?.nomorBerkas || "-",
          "JUDUL BERKAS": item.archive?.judulBerkas || "-",
          KETERANGAN: item.keterangan || "-",
        }))
      );
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "SerahTerima");
      XLSX.writeFile(workbook, "data_serah_terima.xlsx");
    } catch (err) {
      console.error("Error exporting serah terima:", err);
    } finally {
      setIsExporting(false);
    }
  };

  // filter & sort
  const filteredData = serahTerima.filter((item) => {
    const matchesFilters = Object.entries(columnFilters).every(
      ([column, value]) => {
        if (!value) return true;
        if (column === "judulBerkas") {
          return item.archive?.judulBerkas
            ?.toLowerCase()
            .includes(value.toLowerCase());
        }
        const fieldValue = (item as any)[column];
        return fieldValue
          ? fieldValue.toString().toLowerCase().includes(value.toLowerCase())
          : false;
      }
    );

    // filter berdasarkan periode
    let matchesPeriod = true;
    if (periodFilters.year) {
      const year = new Date(item.tanggalSerahTerima).getFullYear();
      matchesPeriod = year === parseInt(periodFilters.year);
    }
    if (periodFilters.startMonth && periodFilters.endMonth) {
      const month = new Date(item.tanggalSerahTerima).getMonth() + 1;
      matchesPeriod =
        matchesPeriod &&
        month >= parseInt(periodFilters.startMonth) &&
        month <= parseInt(periodFilters.endMonth);
    }

    return matchesFilters && matchesPeriod;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    const aValue =
      sortField === "judulBerkas"
        ? a.archive?.judulBerkas || ""
        : (a as any)[sortField] || "";
    const bValue =
      sortField === "judulBerkas"
        ? b.archive?.judulBerkas || ""
        : (b as any)[sortField] || "";
    if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
    if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const handlePeriodFilterChange = (
    field: keyof typeof periodFilters,
    value: string
  ) => {
    setPeriodFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header refreshTrigger={headerRefreshTrigger} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        <SerahTerimaStatsCards
          totalCount={stats.totalCount}
          thisMonthCount={stats.thisMonthCount}
          thisYearCount={stats.thisYearCount}
          pendingCount={stats.pendingCount}
        />

        {/* Tabel */}
        <SerahTerimaTable
          serahTerima={sortedData}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onSort={handleSort}
          sortField={sortField}
          sortOrder={sortOrder}
          onColumnFilter={handleColumnFilter}
          columnFilters={columnFilters}
          onExport={handleExport}
          isExporting={isExporting}
          periodFilters={periodFilters}
          onPeriodFilterChange={handlePeriodFilterChange}
        />
      </main>

      {/* Edit Modal */}
      {editingItem && (
        <SerahTerimaEditForm
          item={editingItem}
          onSave={handleSaveEdit}
          onCancel={handleCancelEdit}
          loading={saving}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingItem && (
        <DeleteConfirmationModal
          isOpen={!!deletingItem}
          onClose={() => setDeletingItem(null)}
          onConfirm={confirmDelete}
          loading={deleting}
          nomorBeritaAcara={deletingItem.nomorBeritaAcara}
          judulBerkas={deletingItem.archive?.judulBerkas}
        />
      )}

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        message={successMessage}
        onClose={() => setShowSuccessModal(false)}
      />
    </div>
  );
}
