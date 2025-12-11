"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../layout/Header";
import SerahTerimaStatsCards from "../ui/SerahTerimaStatsCards";
import SerahTerimaTable from "./SerahTerimaTable";
import { SerahTerimaRecord, SerahTerimaUsulanFormData } from "@/types/archive";
import { archiveAPI } from "@/services/archiveAPI";
import * as XLSX from "xlsx";
import SuccessModal from "../ui/modal/SuccessModal";
import SerahTerimaEditForm from "./SerahTerimaEditForm";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import SerahTerimaDetailModal from "../ui/modal/SerahTerimaDetailModal";
import SerahTerimaApprovalForm from "./SerahTerimaApprovalForm";
import SerahTerimaRejectModal from "./SerahTerimaRejectModal";
import SerahTerimaCreateForm from "./SerahTerimaCreateForm";

export default function SerahTerimaManagement() {
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [serahTerima, setSerahTerima] = useState<SerahTerimaRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<string>("tanggalUsulan");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>(
    {}
  );
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
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [viewingItem, setViewingItem] = useState<SerahTerimaRecord | null>(
    null
  );
  const [approvingItem, setApprovingItem] = useState<SerahTerimaRecord | null>(
    null
  );
  const [rejectingItem, setRejectingItem] = useState<SerahTerimaRecord | null>(
    null
  );
  const [editingItem, setEditingItem] = useState<SerahTerimaRecord | null>(
    null
  );
  const [deletingItem, setDeletingItem] = useState<SerahTerimaRecord | null>(
    null
  );

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

  // Auth check
  const checkAuthStatus = async () => {
    try {
      setAuthLoading(true);
      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setUser(data.user);
          return true;
        } else {
          throw new Error("No user data received");
        }
      } else {
        throw new Error(
          `Authentication failed with status: ${response.status}`
        );
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setUser(null);
      router.push("/login");
      return false;
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    const initializeComponent = async () => {
      const isAuthenticated = await checkAuthStatus();
      if (isAuthenticated) {
        fetchSerahTerima();
        fetchStats();
      }
    };
    initializeComponent();
  }, []);

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

  const handleCreate = () => {
    setShowCreateForm(true);
  };

  const handleSaveCreate = async (data: SerahTerimaUsulanFormData) => {
    try {
      setSaving(true);
      await archiveAPI.createSerahTerimaUsulan(data);
      await fetchSerahTerima();
      await fetchStats();
      triggerHeaderRefresh();
      setShowCreateForm(false);
      setSuccessMessage(
        `Usulan serah terima untuk ${data.archiveIds.length} arsip berhasil dibuat.`
      );
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error("Error creating serah terima:", err);
      alert(err.message || "Gagal membuat usulan serah terima");
    } finally {
      setSaving(false);
    }
  };

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

      // Flatten data for export (one row per archive)
      const exportData: any[] = [];

      allSerahTerima.forEach((item: SerahTerimaRecord) => {
        if (item.archives && item.archives.length > 0) {
          item.archives.forEach((sta) => {
            exportData.push({
              STATUS: item.statusUsulan,
              "PIHAK PENYERAH": item.pihakPenyerah,
              "PIHAK PENERIMA": item.pihakPenerima,
              "NOMOR BERKAS": item.nomorBerkas,
              "TANGGAL USULAN": new Date(item.tanggalUsulan).toLocaleDateString(
                "id-ID"
              ),
              "NOMOR SURAT": sta.archive?.nomorSurat || "-",
              "JUDUL BERKAS": sta.archive?.judulBerkas || "-",
              PERIHAL: sta.archive?.perihal || "-",
              "NOMOR BERITA ACARA": item.nomorBeritaAcara || "-",
              "TANGGAL SERAH TERIMA": item.tanggalSerahTerima
                ? new Date(item.tanggalSerahTerima).toLocaleDateString("id-ID")
                : "-",
              KETERANGAN: item.keterangan || "-",
              "ALASAN PENOLAKAN": item.alasanPenolakan || "-",
            });
          });
        } else {
          // If no archives attached (shouldn't happen, but just in case)
          exportData.push({
            STATUS: item.statusUsulan,
            "PIHAK PENYERAH": item.pihakPenyerah,
            "PIHAK PENERIMA": item.pihakPenerima,
            "NOMOR BERKAS": item.nomorBerkas,
            "TANGGAL USULAN": new Date(item.tanggalUsulan).toLocaleDateString(
              "id-ID"
            ),
            "NOMOR SURAT": "-",
            "JUDUL BERKAS": "-",
            PERIHAL: "-",
            "NOMOR BERITA ACARA": item.nomorBeritaAcara || "-",
            "TANGGAL SERAH TERIMA": item.tanggalSerahTerima
              ? new Date(item.tanggalSerahTerima).toLocaleDateString("id-ID")
              : "-",
            KETERANGAN: item.keterangan || "-",
            "ALASAN PENOLAKAN": item.alasanPenolakan || "-",
          });
        }
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
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
        if (column === "nomorBerkas") {
          return item.nomorBerkas?.toLowerCase().includes(value.toLowerCase());
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
    const aValue = (a as any)[sortField] || "";
    const bValue = (b as any)[sortField] || "";
    if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
    if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

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
          onAdd={handleCreate}
          isExporting={isExporting}
          periodFilters={periodFilters}
          onPeriodFilterChange={handlePeriodFilterChange}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />
      </main>

      {/* Create Form */}
      {showCreateForm && (
        <SerahTerimaCreateForm
          onSave={handleSaveCreate}
          onCancel={() => setShowCreateForm(false)}
          loading={saving}
        />
      )}

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
          nomorBeritaAcara={
            deletingItem.nomorBeritaAcara || deletingItem.nomorBerkas
          }
          judulBerkas={`${deletingItem.archives?.length || 0} arsip`}
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
