"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArchiveRecord,
  ArchiveFormData,
  PeminjamanFormData,
} from "@/types/archive";
import { useArchives } from "@/hooks/useArchives";
import { archiveAPI } from "@/services/archiveAPI";
import * as ExcelJS from "exceljs";
import { PAGINATION } from "@/utils/constants";
import { calculateArchiveStatus } from "@/utils/calculateArchiveStatus";

// Components
import Header from "../layout/Header";
import StatsCards from "../ui/ArchiveStatsCards";
import Pagination from "../ui/Pagination";

import ArchiveTable from "./ArchiveTable";
import ArchiveForm from "./ArchiveForm";
import PeminjamanForm from "../peminjaman/PeminjamanForm";
import ImportModal from "../ui/modal/ImportModal";
import ArchiveDetailModal from "../ui/modal/ArchiveDetailModal";
import SuccessModal from "../ui/modal/SuccessModal";
import ExportResultModal from "../ui/modal/ExportResultModal";
import ImportResultModal from "../ui/modal/ImportResultModal";
import DeleteConfirmationModal from "../ui/modal/DeleteConfirmationModal";
import RetentionMismatchModal from "../ui/modal/RetentionMismatchModal";
import PeminjamanErrorModal from "../ui/modal/PeminjamanErrorModal";

interface BoxStats {
  kategori: string;
  totalBox: number;
  totalArchives: number;
}

interface StatsData {
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  disposeCount: number;
  totalBoxCount: number;
  boxStatsByCategory: BoxStats[];
  jenisNaskahDinasData: { jenis: string; total: number }[];
}

export default function ArchiveManagement() {
  const router = useRouter();

  // State management
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState("tanggal");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>(
    {}
  );
  const [showPeminjamanForm, setShowPeminjamanForm] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Retention mismatch handling
  const [retentionMismatches, setRetentionMismatches] = useState<any[]>([]);
  const [showRetentionMismatchModal, setShowRetentionMismatchModal] =
    useState(false);
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);

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
      console.error("Auth check failed in ArchiveManagement:", error);
      setUser(null);
      router.push("/login");
      return false;
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    const initializeComponent = async () => {
      await checkAuthStatus();
    };
    initializeComponent();
  }, []);

  // Period filters
  const [periodFilters, setPeriodFilters] = useState({
    startMonth: "",
    endMonth: "",
    year: "",
  });

  // Stats
  const [stats, setStats] = useState<StatsData>({
    totalCount: 0,
    activeCount: 0,
    inactiveCount: 0,
    disposeCount: 0,
    totalBoxCount: 0,
    boxStatsByCategory: [],
    jenisNaskahDinasData: [],
  });

  useEffect(() => {
    if (user) {
      fetch("/api/archives/stats", {
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => setStats(data))
        .catch((err) => console.error("Failed to fetch stats:", err));
    }
  }, [user]);

  // Modal states
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedArchive, setSelectedArchive] = useState<ArchiveRecord | null>(
    null
  );
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState<any | null>(null);
  const [showImportResultModal, setShowImportResultModal] = useState(false);
  const [exportResult, setExportResult] = useState<any | null>(null);
  const [showExportResultModal, setShowExportResultModal] = useState(false);

  const itemsPerPage = PAGINATION.DEFAULT_LIMIT;

  // Success Modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Delete Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Peminjaman Error Modal
  const [showPeminjamanErrorModal, setShowPeminjamanErrorModal] =
    useState(false);
  const [peminjamanErrorMessage, setPeminjamanErrorMessage] = useState("");

  // Use columnFilters.status - backend will filter by CALCULATED status
  const { archives, pagination, loading, error, mutate } = useArchives({
    page: currentPage,
    limit: itemsPerPage,
    search: searchQuery,
    sort: sortField,
    order: sortOrder,
    status: columnFilters.status || "",
    filters: columnFilters,
    startMonth: periodFilters.startMonth,
    endMonth: periodFilters.endMonth,
    year: periodFilters.year,
    excludeSerahTerima: true,
  });

  // Header refresh trigger
  const [headerRefreshTrigger, setHeaderRefreshTrigger] = useState(0);
  // Table refresh trigger for peminjaman status
  const [tableRefreshTrigger, setTableRefreshTrigger] = useState(0);

  const triggerHeaderRefresh = () => {
    setHeaderRefreshTrigger((prev) => prev + 1);
  };

  const triggerTableRefresh = () => {
    setTableRefreshTrigger((prev) => prev + 1);
  };

  // Handle period filter changes
  const handlePeriodFilterChange = (
    field: keyof typeof periodFilters,
    value: string
  ) => {
    setPeriodFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
    setCurrentPage(1);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      const newOrder = sortOrder === "asc" ? "desc" : "asc";
      setSortOrder(newOrder);
    } else {
      setSortField(field);
      const defaultOrder = field === "tanggal" ? "desc" : "asc";
      setSortOrder(defaultOrder);
    }
  };

  const [lastUpdate, setLastUpdate] = useState(
    new Date().toLocaleString("id-ID")
  );

  const handleColumnFilter = (column: string, value: string) => {
    setColumnFilters((prev) => ({
      ...prev,
      [column]: value,
    }));
    setCurrentPage(1);
  };

  interface ArchiveData {
    kodeUnit?: string;
    indeks?: string;
    nomorBerkas?: string;
    judulBerkas?: string;
    nomorIsiBerkas?: string;
    jenisNaskahDinas?: string;
    nomorSurat?: string;
    klasifikasi?: string;
    perihal?: string;
    tanggal?: string;
    tingkatPerkembangan?: string;
    kondisi?: string;
    lokasiSimpan?: string;
    retensiAktif?: string;
    retensiInaktif?: string;
    keterangan?: string;
    retentionYears?: string;
    status?: string;
  }

  const handleExport = async () => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams({
        limit: "999999",
        search: searchQuery,
        status: columnFilters.status || "",
        sort: sortField,
        order: sortOrder,
        excludeSerahTerima: "true",
        ...(periodFilters.year && { year: periodFilters.year }),
        ...(periodFilters.startMonth && {
          startMonth: periodFilters.startMonth,
        }),
        ...(periodFilters.endMonth && { endMonth: periodFilters.endMonth }),
      });
      Object.entries(columnFilters).forEach(([key, value]) => {
        queryParams.append(`filter[${key}]`, value);
      });

      const response = await fetch(`/api/archives?${queryParams}`, {
        credentials: "include",
      });
      const result = await response.json();
      const allArchives = result.data || [];

      if (allArchives.length === 0) {
        setExportResult({
          fileName: "Tidak ada data untuk diekspor",
          totalRows: 0,
        });
        setShowExportResultModal(true);
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Data Arsip");

      // Updated headers - removed TAHUN RETENSI, added TAHUN after PERIHAL
      const headers = [
        "KODE UNIT",
        "INDEKS",
        "NOMOR BERKAS",
        "JUDUL BERKAS",
        "NOMOR ISI BERKAS",
        "JENIS NASKAH DINAS",
        "KLASIFIKASI",
        "NOMOR SURAT",
        "TANGGAL SURAT",
        "PERIHAL",
        "TAHUN",
        "TINGKAT PERKEMBANGAN",
        "KONDISI",
        "LOKASI SIMPAN",
        "RETENSI AKTIF",
        "RETENSI INAKTIF",
        "KETERANGAN",
        "STATUS",
      ];

      worksheet.addRow(headers);

      allArchives.forEach((archive: any) => {
        // Calculate status using the same logic as backend
        const statusCalc = calculateArchiveStatus(
          archive.tanggal,
          archive.klasifikasi
        );

        // Map status to Indonesian
        const statusMap: Record<string, string> = {
          ACTIVE: "Aktif",
          INACTIVE: "Inaktif",
          DISPOSE_ELIGIBLE: "Siap Musnah",
        };

        const statusIndonesian = statusMap[statusCalc.status] || "Aktif";

        // Extract year from tanggal
        const tahun = archive.tanggal
          ? new Date(archive.tanggal).getFullYear()
          : archive.tahun || "";

        worksheet.addRow([
          archive.kodeUnit || "",
          archive.indeks || "",
          archive.nomorBerkas || "",
          archive.judulBerkas || "",
          archive.nomorIsiBerkas || "",
          archive.jenisNaskahDinas || "",
          archive.klasifikasi || "",
          archive.nomorSurat || "",
          archive.tanggal
            ? new Date(archive.tanggal).toLocaleDateString("id-ID")
            : "",
          archive.perihal || "",
          tahun,
          archive.tingkatPerkembangan || "",
          archive.kondisi || "",
          archive.lokasiSimpan || "",
          `${statusCalc.retensiAktifYears} tahun`, // From calculation
          `${statusCalc.retensiInaktifYears} tahun`, // From calculation
          archive.keterangan || "",
          statusIndonesian, // Mapped status
        ]);
      });

      // Style header row
      const headerRow = worksheet.getRow(1);
      headerRow.height = 25;
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE8F4FD" },
        };
        cell.font = {
          name: "Arial",
          size: 10,
          bold: true,
        };
        cell.alignment = {
          vertical: "middle",
          horizontal: "center",
          wrapText: true,
        };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });

      // Style data rows
      for (let i = 2; i <= worksheet.rowCount; i++) {
        const row = worksheet.getRow(i);
        row.height = 20;
        row.eachCell((cell) => {
          cell.font = {
            name: "Arial",
            size: 10,
          };
          cell.alignment = {
            vertical: "middle",
            horizontal: "center",
            wrapText: true,
          };
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
      }

      // Updated column widths (removed one column, so adjust array)
      const columnWidths = [
        15, // KODE UNIT
        10, // INDEKS
        15, // NOMOR BERKAS
        25, // JUDUL BERKAS
        18, // NOMOR ISI BERKAS
        20, // JENIS NASKAH DINAS
        15, // KLASIFIKASI
        15, // NOMOR SURAT
        15, // TANGGAL SURAT
        25, // PERIHAL
        10, // TAHUN
        20, // TINGKAT PERKEMBANGAN
        12, // KONDISI
        15, // LOKASI SIMPAN
        15, // RETENSI AKTIF
        15, // RETENSI INAKTIF
        20, // KETERANGAN
        15, // STATUS
      ];

      headers.forEach((header, index) => {
        const column = worksheet.getColumn(index + 1);
        let maxWidth = header.length;

        for (let rowIndex = 2; rowIndex <= worksheet.rowCount; rowIndex++) {
          const cell = worksheet.getCell(rowIndex, index + 1);
          const cellValue = cell.value ? cell.value.toString() : "";
          maxWidth = Math.max(maxWidth, cellValue.length);
        }

        const finalWidth = Math.min(
          Math.max(maxWidth + 2, columnWidths[index] || 15),
          50
        );
        column.width = finalWidth;
      });

      let periodInfo = "";
      if (periodFilters.year) {
        periodInfo += `-${periodFilters.year}`;
        if (periodFilters.startMonth && periodFilters.endMonth) {
          periodInfo += `-bulan${periodFilters.startMonth}to${periodFilters.endMonth}`;
        }
      }
      const fileName = `data-arsip${periodInfo}-${
        new Date().toISOString().split("T")[0]
      }.xlsx`;

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(url);

      setExportResult({ fileName, totalRows: allArchives.length });
      setShowExportResultModal(true);
    } catch (error) {
      console.error("Export failed:", error);
      setExportResult({ fileName: "Gagal Export", totalRows: 0 });
      setShowExportResultModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async (file: File, autoFix: boolean) => {
    try {
      setIsLoading(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("autoFix", autoFix.toString());
      formData.append("forceImport", "true");

      const response = await fetch("/api/archives/import", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const result = await response.json();

      const message = autoFix
        ? "Import berhasil dengan masa retensi yang telah diperbaiki sesuai aturan klasifikasi"
        : result.message || "Import berhasil";

      setImportResult({
        ...result,
        message,
      });
      setShowImportResultModal(true);
      mutate();

      fetch("/api/archives/stats", {
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => setStats(data));

      triggerHeaderRefresh();
      setShowImportModal(false);
    } catch (error) {
      console.error("Import error:", error);
      alert("Terjadi kesalahan saat mengimpor file!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFixAllRetention = async () => {
    if (!pendingImportFile) return;

    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append("file", pendingImportFile);
      formData.append("autoFix", "true");
      formData.append("forceImport", "true");

      const response = await fetch("/api/archives/import", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const result = await response.json();

      setImportResult({
        ...result,
        message:
          "Import berhasil dengan masa retensi yang telah diperbaiki sesuai aturan klasifikasi",
      });
      setShowImportResultModal(true);
      setShowRetentionMismatchModal(false);
      mutate();
      fetch("/api/archives/stats", {
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => setStats(data));
      triggerHeaderRefresh();
    } catch (error) {
      console.error("Fixed import error:", error);
      alert("Terjadi kesalahan saat mengimpor dengan perbaikan otomatis!");
    } finally {
      setIsLoading(false);
      setPendingImportFile(null);
    }
  };

  const handleContinueAnywayRetention = async () => {
    if (!pendingImportFile) return;

    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append("file", pendingImportFile);
      formData.append("forceImport", "true");

      const response = await fetch("/api/archives/import", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const result = await response.json();

      setImportResult({
        ...result,
        message:
          "Import berhasil dengan masa retensi dari file Excel (mungkin tidak sesuai aturan klasifikasi)",
      });
      setShowImportResultModal(true);
      setShowRetentionMismatchModal(false);
      mutate();
      fetch("/api/archives/stats", {
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => setStats(data));
      triggerHeaderRefresh();
    } catch (error) {
      console.error("Force import error:", error);
      alert("Terjadi kesalahan saat mengimpor!");
    } finally {
      setIsLoading(false);
      setPendingImportFile(null);
    }
  };

  const handleSaveArchive = async (formData: ArchiveFormData) => {
    setIsLoading(true);
    try {
      if (selectedArchive) {
        await archiveAPI.updateArchive(selectedArchive.id, formData);
        setSuccessMessage("Arsip berhasil diperbarui!");
      } else {
        await archiveAPI.createArchive(formData);
        setSuccessMessage("Arsip berhasil ditambahkan!");
      }

      setShowAddForm(false);
      setSelectedArchive(null);
      mutate();
      fetch("/api/archives/stats", {
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => setStats(data));
      triggerHeaderRefresh();
      setShowSuccessModal(true);
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat menyimpan arsip!");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinjamArchive = (archive: ArchiveRecord) => {
    setSelectedArchive(archive);
    setShowPeminjamanForm(true);
  };

  const handleSavePeminjaman = async (formData: PeminjamanFormData) => {
    setIsLoading(true);
    try {
      await archiveAPI.createPeminjaman(formData);
      setSuccessMessage("Peminjaman berkas berhasil dibuat!");

      setShowPeminjamanForm(false);
      setSelectedArchive(null);
      triggerTableRefresh();
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error("Error creating peminjaman:", error);

      const isConflictError = error?.response?.status === 400;
      const errorMessage = error?.response?.data?.error || error?.message || "";
      const isDuplicateNomorSurat = errorMessage.includes(
        "Nomor surat peminjaman masih digunakan"
      );

      if (isConflictError && isDuplicateNomorSurat) {
        setPeminjamanErrorMessage(
          "Nomor surat ini masih digunakan untuk peminjaman yang belum dikembalikan. " +
            "Silakan gunakan nomor surat yang berbeda atau tunggu hingga peminjaman sebelumnya dikembalikan."
        );
        setShowPeminjamanErrorModal(true);
      } else {
        const fallbackMessage = "Terjadi kesalahan saat membuat peminjaman!";
        const displayMessage = errorMessage || fallbackMessage;
        alert(displayMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
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
        <StatsCards
          totalCount={stats.totalCount}
          activeCount={stats.activeCount}
          inactiveCount={stats.inactiveCount}
          disposeCount={stats.disposeCount}
          totalBoxCount={stats.totalBoxCount}
          boxStatsByCategory={stats.boxStatsByCategory}
          jenisNaskahDinasData={stats.jenisNaskahDinasData}
          onColumnFilter={handleColumnFilter}
          columnFilters={columnFilters}
        />

        <ArchiveTable
          archives={archives}
          loading={loading}
          onEdit={(archive) => {
            setSelectedArchive(archive);
            setShowAddForm(true);
          }}
          onDelete={async (id) => {
            setDeleteId(id);
            setShowDeleteModal(true);
          }}
          onView={(archive) => {
            setSelectedArchive(archive);
            setShowDetailModal(true);
          }}
          onPinjam={(archive) => handlePinjamArchive(archive)}
          onSort={handleSort}
          sortField={sortField}
          sortOrder={sortOrder}
          onColumnFilter={handleColumnFilter}
          onAdd={() => {
            setSelectedArchive(null);
            setShowAddForm(true);
          }}
          onImport={() => setShowImportModal(true)}
          onExport={handleExport}
          columnFilters={columnFilters}
          periodFilters={periodFilters}
          onPeriodFilterChange={handlePeriodFilterChange}
          refreshTrigger={tableRefreshTrigger}
        />

        {pagination && (
          <Pagination pagination={pagination} onPageChange={setCurrentPage} />
        )}
      </main>

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={async () => {
          if (deleteId) {
            await archiveAPI.deleteArchive(deleteId);
            mutate();
            fetch("/api/archives/stats", {
              credentials: "include",
            })
              .then((res) => res.json())
              .then((data) => setStats(data));
            triggerHeaderRefresh();
          }
          setShowDeleteModal(false);
          setDeleteId(null);
        }}
      />

      {showAddForm && (
        <ArchiveForm
          archive={selectedArchive || undefined}
          onSave={handleSaveArchive}
          onCancel={() => setShowAddForm(false)}
          loading={isLoading}
        />
      )}

      {showImportModal && (
        <ImportModal
          onClose={() => setShowImportModal(false)}
          onImport={handleImport}
        />
      )}

      <RetentionMismatchModal
        isOpen={showRetentionMismatchModal}
        onClose={() => {
          setShowRetentionMismatchModal(false);
          setPendingImportFile(null);
          setRetentionMismatches([]);
        }}
        mismatches={retentionMismatches}
        onFixAll={handleFixAllRetention}
        onContinueAnyway={handleContinueAnywayRetention}
        isLoading={isLoading}
      />

      <ExportResultModal
        isOpen={showExportResultModal}
        onClose={() => setShowExportResultModal(false)}
        result={exportResult}
      />

      <ImportResultModal
        isOpen={showImportResultModal}
        onClose={() => setShowImportResultModal(false)}
        result={importResult}
      />

      {showDetailModal && selectedArchive && (
        <ArchiveDetailModal
          archive={selectedArchive}
          onClose={() => setShowDetailModal(false)}
          currentUserRole={user?.role}
        />
      )}

      {showPeminjamanForm && selectedArchive && (
        <PeminjamanForm
          archive={selectedArchive}
          onSave={handleSavePeminjaman}
          onCancel={() => setShowPeminjamanForm(false)}
          loading={isLoading}
        />
      )}

      <SuccessModal
        isOpen={showSuccessModal}
        message={successMessage}
        onClose={() => setShowSuccessModal(false)}
      />

      <PeminjamanErrorModal
        isOpen={showPeminjamanErrorModal}
        onClose={() => setShowPeminjamanErrorModal(false)}
        message={peminjamanErrorMessage}
      />
    </div>
  );
}
