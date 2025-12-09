"use client";

import React, { useEffect, useState } from "react";
import Header from "../layout/Header";
import SerahTerimaStatsCards from "../ui/SerahTerimaStatsCards";
import SerahTerimaTable from "./SerahTerimaTable";
import { SerahTerimaRecord } from "@/types/archive";
import { archiveAPI } from "@/services/archiveAPI";
import * as XLSX from "xlsx";
import SuccessModal from "../ui/modal/SuccessModal";
import SerahTerimaEditForm from "./SerahTerimaEditForm";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import SerahTerimaDetailModal from "../ui/modal/SerahTerimaDetailModal";
import SerahTerimaApprovalForm from "./SerahTerimaApprovalForm";
import SerahTerimaRejectModal from "./SerahTerimaRejectModal";

export default function SerahTerimaManagement() {
  const [serahTerima, setSerahTerima] = useState<SerahTerimaRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<string>("tanggalUsulan");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [isExporting, setIsExporting] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");

  const [periodFilters, setPeriodFilters] = useState({
    startMonth: "",
    endMonth: "",
    year: "",
  });

  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Modals
  const [viewingItem, setViewingItem] = useState<SerahTerimaRecord | null>(null);
  const [approvingItem, setApprovingItem] = useState<SerahTerimaRecord | null>(null);
  const [rejectingItem, setRejectingItem] = useState<SerahTerimaRecord | null>(null);
  const [editingItem, setEditingItem] = useState<SerahTerimaRecord | null>(null);
  const [deletingItem, setDeletingItem] = useState<SerahTerimaRecord | null>(null);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [headerRefreshTrigger, setHeaderRefreshTrigger] = useState(0);
  const triggerHeaderRefresh = () => setHeaderRefreshTrigger((v) => v + 1);

  const [stats, setStats] = useState({
    totalCount: 0,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    thisMonthCount: 0,
    thisYearCount: 0,
  });

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/serah-terima/stats", {
        credentials: "include",
      });
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

  useEffect(() => {
    fetchSerahTerima();
    fetchStats();
  }, []);

  const handleView = (item: SerahTerimaRecord) => setViewingItem(item);

  const handleApprove = (item: SerahTerimaRecord) => setApprovingItem(item);

  const handleApproveConfirm = async (data: {
    nomorBeritaAcara: string;
    tanggalSerahTerima: string;
    keterangan: string;
  }) => {
    if (!approvingItem) return;
    try {
      setSaving(true);
      await archiveAPI.approveSerahTerima(approvingItem.id, data);
      await fetchSerahTerima();
      await fetchStats();
      triggerHeaderRefresh();
      setApprovingItem(null);
      setSuccessMessage("Usulan serah terima berhasil disetujui.");
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error("Error approving serah terima:", err);
      alert(err.response?.data?.error || "Gagal menyetujui usulan");
    } finally {
      setSaving(false);
    }
  };

  const handleReject = (item: SerahTerimaRecord) => setRejectingItem(item);

  const handleRejectConfirm = async (alasanPenolakan: string) => {
    if (!rejectingItem) return;
    try {
      setSaving(true);
      await archiveAPI.rejectSerahTerima(rejectingItem.id, alasanPenolakan);
      await fetchSerahTerima();
      await fetchStats();
      triggerHeaderRefresh();
      setRejectingItem(null);
      setSuccessMessage("Usulan serah terima berhasil ditolak.");
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error("Error rejecting serah terima:", err);
      alert(err.response?.data?.error || "Gagal menolak usulan");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: SerahTerimaRecord) => setEditingItem(item);

  const handleSaveEdit = async (data: any) => {
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
      alert("Gagal memperbarui data");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item: SerahTerimaRecord) => setDeletingItem(item);

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
      alert("Gagal menghapus data");
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
          STATUS: item.statusUsulan,
          "PIHAK PENYERAH": item.pihakPenyerah,
          "PIHAK PENERIMA": item.pihakPenerima,
          "TANGGAL USULAN": new Date(item.tanggalUsulan).toLocaleDateString("id-ID"),
          "NOMOR BERKAS": item.archive?.nomorBerkas || "-",
          "JUDUL BERKAS": item.archive?.judulBerkas || "-",
          "NOMOR BERITA ACARA": item.nomorBeritaAcara || "-",
          "TANGGAL SERAH TERIMA": item.tanggalSerahTerima
            ? new Date(item.tanggalSerahTerima).toLocaleDateString("id-ID")
            : "-",
          KETERANGAN: item.keterangan || "-",
          "ALASAN PENOLAKAN": item.alasanPenolakan || "-",
        }))
      );
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "SerahTerima");
      XLSX.writeFile(workbook, "data_serah_terima.xlsx");
    } catch (err) {
      console.error("Error exporting serah terima:", err);
      alert("Gagal export data");
    } finally {
      setIsExporting(false);
    }
  };

  const handlePeriodFilterChange = (
    field: keyof typeof periodFilters,
    value: string
  ) => {
    setPeriodFilters((prev) => ({ ...prev, [field]: value }));
  };

  // Filter & sort
  const filteredData = serahTerima.filter((item) => {
    // Status filter
    if (statusFilter && item.statusUsulan !== statusFilter) {
      return false;
    }

    // Column filters
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

    // Period filters
    let matchesPeriod = true;
    if (periodFilters.year) {
      const year = new Date(item.tanggalUsulan).getFullYear();
      matchesPeriod = year === parseInt(periodFilters.year);
    }
    if (periodFilters.startMonth && periodFilters.endMonth) {
      const month = new Date(item.tanggalUsulan).getMonth() + 1;
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header refreshTrigger={headerRefreshTrigger} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        <SerahTerimaStatsCards
          totalCount={stats.totalCount}
          pendingCount={stats.pendingCount}
          approvedCount={stats.approvedCount}
          rejectedCount={stats.rejectedCount}
          thisMonthCount={stats.thisMonthCount}
          thisYearCount={stats.thisYearCount}
        />

        {/* Table */}
        <SerahTerimaTable
          serahTerima={sortedData}
          loading={loading}
          onView={handleView}
          onApprove={handleApprove}
          onReject={handleReject}
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
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />
      </main>

      {/* Detail Modal */}
      {viewingItem && (
        <SerahTerimaDetailModal
          item={viewingItem}
          onClose={() => setViewingItem(null)}
        />
      )}

      {/* Approval Form */}
      {approvingItem && (
        <SerahTerimaApprovalForm
          item={approvingItem}
          onApprove={handleApproveConfirm}
          onCancel={() => setApprovingItem(null)}
          loading={saving}
        />
      )}

      {/* Reject Modal */}
      {rejectingItem && (
        <SerahTerimaRejectModal
          item={rejectingItem}
          onReject={handleRejectConfirm}
          onCancel={() => setRejectingItem(null)}
          loading={saving}
        />
      )}

      {/* Edit Modal */}
      {editingItem && (
        <SerahTerimaEditForm
          item={editingItem}
          onSave={handleSaveEdit}
          onCancel={() => setEditingItem(null)}
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
          nomorBeritaAcara={deletingItem.nomorBeritaAcara || deletingItem.pihakPenyerah}
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