import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, verifyToken } from "@/utils/auth";
import {
  getClassificationRule,
  validateRetentionFromExcel,
  ClassificationRule,
} from "@/utils/classificationRules";

// Helper function to find header row
const findHeaderRow = (sheetData: any[][]): number => {
  // Cari baris yang mengandung header yang diharapkan
  for (let i = 0; i < Math.min(sheetData.length, 20); i++) {
    const row = sheetData[i];
    if (!Array.isArray(row)) continue;

    // Gabungkan semua sel dalam baris untuk pencarian
    const rowText = row
      .map((cell) => (cell ? cell.toString().trim().toUpperCase() : ""))
      .join(" ");

    // Cek apakah baris ini mengandung minimal 3 header penting
    const hasKodeUnit = row.some(
      (cell) =>
        cell && cell.toString().trim().toUpperCase().includes("KODE UNIT")
    );
    const hasNomorSurat = row.some(
      (cell) =>
        cell && cell.toString().trim().toUpperCase().includes("NOMOR SURAT")
    );
    const hasPerihal = row.some(
      (cell) => cell && cell.toString().trim().toUpperCase().includes("PERIHAL")
    );

    if (hasKodeUnit || hasNomorSurat || hasPerihal) {
      return i;
    }
  }
  return -1;
};

// Function to normalize header names
const normalizeHeader = (header: string): string => {
  if (!header) return "";
  return header.toString().trim().toUpperCase();
};

export async function POST(req: Request) {
  try {
    // Authentication
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized - Please login first" },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid token - Please login again" },
        { status: 401 }
      );
    }

    const userId = payload.userId;

    // Get form data
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const forceImport = formData.get("forceImport") === "true";
    const autoFix = formData.get("autoFix") === "true";

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file type
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      return NextResponse.json(
        { error: "File harus berformat Excel (.xlsx atau .xls)" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let workbook;

    try {
      workbook = XLSX.read(buffer, { type: "buffer" });
    } catch (error) {
      return NextResponse.json(
        { error: "File Excel tidak valid atau corrupt" },
        { status: 400 }
      );
    }

    const sheetNames = workbook.SheetNames;
    if (!sheetNames || sheetNames.length === 0) {
      return NextResponse.json(
        { error: "File Excel tidak memiliki sheet" },
        { status: 400 }
      );
    }

    let success = 0;
    let failed = 0;
    const errors: any[] = [];
    const retentionMismatches: {
      row: number;
      classification: string;
      currentRetensiAktif: number;
      expectedRetensiAktif: number;
      ruleName: string;
      retensiInaktifInfo: number;
      sheet: string;
    }[] = [];
    const batchEntryDate = new Date();
    let totalRows = 0;

    // First pass: Validate and collect mismatches
    for (const sheetName of sheetNames) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) continue;

      const sheetData = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
      const headerRowIndex = findHeaderRow(sheetData);

      if (headerRowIndex === -1) {
        errors.push({
          sheet: sheetName,
          error: "Tidak ditemukan header valid pada sheet",
        });
        continue;
      }

      // Ambil header dari baris yang ditemukan
      const headers = sheetData[headerRowIndex];
      // Normalisasi header untuk pencocokan case-insensitive
      const normalizedHeaders = headers.map((header: any) =>
        normalizeHeader(header?.toString() || "")
      );

      // Function untuk mendapatkan nilai berdasarkan nama kolom
      const getValueByColumnName = (
        row: any,
        ...columnNames: string[]
      ): any => {
        for (const columnName of columnNames) {
          const normalizedSearch = normalizeHeader(columnName);
          const columnIndex = normalizedHeaders.findIndex((header: string) => {
            const normalizedHeader = normalizeHeader(header);
            // Matching lebih fleksibel - hapus tanda kurung dan kata-kata dalam kurung
            const cleanedHeader = normalizedHeader
              .replace(/\s*\([^)]*\)/g, "")
              .trim();
            const cleanedSearch = normalizedSearch
              .replace(/\s*\([^)]*\)/g, "")
              .trim();

            return (
              cleanedHeader.includes(cleanedSearch) ||
              cleanedSearch.includes(cleanedHeader) ||
              normalizedHeader.includes(normalizedSearch)
            );
          });

          if (columnIndex !== -1) {
            if (Array.isArray(row)) {
              return row[columnIndex];
            }
            if (typeof row === "object" && row !== null) {
              const originalHeader = headers[columnIndex];
              return row[originalHeader];
            }
          }
        }
        return undefined;
      };

      // Konversi data dari header row ke bawah
      const rows = sheetData.slice(headerRowIndex + 1);
      totalRows += rows.length;

      for (const [rowIndex, rawRow] of rows.entries()) {
        try {
          // Skip baris kosong
          if (
            !rawRow ||
            (Array.isArray(rawRow) &&
              rawRow.every(
                (cell) =>
                  cell === null ||
                  cell === undefined ||
                  cell === "" ||
                  (typeof cell === "string" && cell.trim() === "")
              ))
          ) {
            continue;
          }

          // Skip baris yang hanya berisi angka/nomor urut
          const isNumberedRow =
            Array.isArray(rawRow) &&
            rawRow.every((value) => {
              if (value === null || value === undefined || value === "")
                return false;
              const str = value.toString().trim();
              return !isNaN(Number(str)) && str !== "";
            });

          if (isNumberedRow) continue;

          // Ambil nilai menggunakan nama kolom (case-insensitive)
          const kodeUnit = getValueByColumnName(rawRow, "KODE UNIT");
          const nomorSurat = getValueByColumnName(rawRow, "NOMOR SURAT");
          const nomorNaskahDinas = getValueByColumnName(
            rawRow,
            "NOMOR NASKAH DINAS"
          );
          const perihal = getValueByColumnName(rawRow, "PERIHAL");

          // VALIDASI FLEKSIBEL: Terima NOMOR SURAT atau NOMOR NASKAH DINAS
          const hasNomorSurat =
            nomorSurat && nomorSurat.toString().trim() !== "";
          const hasNomorNaskahDinas =
            nomorNaskahDinas && nomorNaskahDinas.toString().trim() !== "";

          // VALIDASI BARU: Check nomor berkas
          const nomorBerkas = getValueByColumnName(
            rawRow,
            "NOMOR BERKAS",
            "NO BOX SEMENTARA",
            "NOMOR DUS"
          );

          const hasNomorBerkas =
            nomorBerkas && nomorBerkas.toString().trim() !== "";

          if (
            !kodeUnit ||
            (!hasNomorSurat && !hasNomorNaskahDinas) ||
            !perihal ||
            !hasNomorBerkas
          ) {
            continue; // Skip invalid rows in validation phase
          }

          const parseRetentionYears = (value: any): number => {
            if (typeof value === "number") return value;
            if (typeof value === "string") {
              const parsed = parseInt(value);
              return isNaN(parsed) ? 2 : parsed;
            }
            return 2;
          };

          const sanitizeString = (value: any): string | null => {
            if (value === null || value === undefined || value === "")
              return null;
            const str = value.toString().trim();
            return str === "" ? null : str;
          };

          const classification = sanitizeString(
            getValueByColumnName(rawRow, "KLASIFIKASI")
          );
          const retensiAktif = parseRetentionYears(
            getValueByColumnName(rawRow, "RETENSI AKTIF")
          );

          // Check retention mismatch if classification exists
          if (classification && !forceImport) {
            const validation = validateRetentionFromExcel(
              classification,
              retensiAktif
            );

            if (!validation.valid && validation.rule) {
              retentionMismatches.push({
                row: rowIndex + headerRowIndex + 2,
                classification: classification,
                currentRetensiAktif: retensiAktif,
                expectedRetensiAktif: validation.rule.retensiAktif,
                ruleName: validation.rule.name,
                retensiInaktifInfo: validation.rule.retensiInaktif,
                sheet: sheetName,
              });
            }
          }
        } catch (err) {
          // Handle validation errors
          continue;
        }
      }
    }

    // If there are retention mismatches and not forcing import, return them
    if (retentionMismatches.length > 0 && !forceImport) {
      return NextResponse.json(
        {
          hasRetentionMismatches: true,
          retentionMismatches: retentionMismatches,
          totalRows: totalRows,
          message:
            "Ditemukan ketidaksesuaian masa retensi aktif dengan klasifikasi",
        },
        { status: 422 }
      );
    }

    // Second pass: Actually import the data
    for (const sheetName of sheetNames) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) continue;

      const sheetData = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
      const headerRowIndex = findHeaderRow(sheetData);

      if (headerRowIndex === -1) {
        continue;
      }

      // Ambil header dari baris yang ditemukan
      const headers = sheetData[headerRowIndex];
      // Normalisasi header untuk pencocokan case-insensitive
      const normalizedHeaders = headers.map((header: any) =>
        normalizeHeader(header?.toString() || "")
      );

      // Function untuk mendapatkan nilai berdasarkan nama kolom
      const getValueByColumnName = (
        row: any,
        ...columnNames: string[]
      ): any => {
        for (const columnName of columnNames) {
          const normalizedSearch = normalizeHeader(columnName);
          const columnIndex = normalizedHeaders.findIndex((header: string) => {
            const normalizedHeader = normalizeHeader(header);
            // Matching lebih fleksibel - hapus tanda kurung dan kata-kata dalam kurung
            const cleanedHeader = normalizedHeader
              .replace(/\s*\([^)]*\)/g, "")
              .trim();
            const cleanedSearch = normalizedSearch
              .replace(/\s*\([^)]*\)/g, "")
              .trim();

            return (
              cleanedHeader.includes(cleanedSearch) ||
              cleanedSearch.includes(cleanedHeader) ||
              normalizedHeader.includes(normalizedSearch)
            );
          });

          if (columnIndex !== -1) {
            if (Array.isArray(row)) {
              return row[columnIndex];
            }
            if (typeof row === "object" && row !== null) {
              const originalHeader = headers[columnIndex];
              return row[originalHeader];
            }
          }
        }
        return undefined;
      };

      // Konversi data dari header row ke bawah
      const rows = sheetData.slice(headerRowIndex + 1);

      for (const [rowIndex, rawRow] of rows.entries()) {
        try {
          // Skip baris kosong
          if (
            !rawRow ||
            (Array.isArray(rawRow) &&
              rawRow.every(
                (cell) =>
                  cell === null ||
                  cell === undefined ||
                  cell === "" ||
                  (typeof cell === "string" && cell.trim() === "")
              ))
          ) {
            continue;
          }

          // Skip baris yang hanya berisi angka/nomor urut
          const isNumberedRow =
            Array.isArray(rawRow) &&
            rawRow.every((value) => {
              if (value === null || value === undefined || value === "")
                return false;
              const str = value.toString().trim();
              return !isNaN(Number(str)) && str !== "";
            });

          if (isNumberedRow) continue;

          // Ambil nilai menggunakan nama kolom (case-insensitive)
          const kodeUnit = getValueByColumnName(rawRow, "KODE UNIT");
          const nomorSurat = getValueByColumnName(rawRow, "NOMOR SURAT");
          const nomorNaskahDinas = getValueByColumnName(
            rawRow,
            "NOMOR NASKAH DINAS"
          );
          const perihal = getValueByColumnName(rawRow, "PERIHAL");

          // VALIDASI FLEKSIBEL
          const hasNomorSurat =
            nomorSurat && nomorSurat.toString().trim() !== "";
          const hasNomorNaskahDinas =
            nomorNaskahDinas && nomorNaskahDinas.toString().trim() !== "";

          // VALIDASI NOMOR BERKAS - ambil yang ada
          const nomorBerkasValue = getValueByColumnName(
            rawRow,
            "NOMOR BERKAS",
            "NO BOX SEMENTARA",
            "NOMOR DUS"
          );

          const hasNomorBerkasValue =
            nomorBerkasValue && nomorBerkasValue.toString().trim() !== "";

          if (
            !kodeUnit ||
            (!hasNomorSurat && !hasNomorNaskahDinas) ||
            !perihal ||
            !hasNomorBerkasValue
          ) {
            throw new Error(
              "Kolom KODE UNIT, (NOMOR SURAT atau NOMOR NASKAH DINAS), PERIHAL, dan (NOMOR BERKAS/NOMOR DUS/NO BOX SEMENTARA) wajib diisi"
            );
          }

          const statusMap: Record<
            string,
            "ACTIVE" | "INACTIVE" | "DISPOSE_ELIGIBLE"
          > = {
            ACTIVE: "ACTIVE",
            INACTIVE: "INACTIVE",
            DISPOSE_ELIGIBLE: "DISPOSE_ELIGIBLE",
            Aktif: "ACTIVE",
            "Tidak Aktif": "INACTIVE",
            "Siap Musnah": "DISPOSE_ELIGIBLE",
          };

          const parseExcelDateToISOString = (value: any): string | null => {
            if (!value) return null;
            let date: Date | null = null;

            if (value instanceof Date) date = value;
            else if (typeof value === "string") {
              const parsed = new Date(value);
              if (!isNaN(parsed.getTime())) date = parsed;
            } else if (typeof value === "number") {
              const utc_days = Math.floor(value - 25569);
              const fractional_day = value - Math.floor(value);
              const date_utc = new Date(utc_days * 86400 * 1000);
              const total_seconds = Math.floor(86400 * fractional_day);
              date_utc.setUTCHours(
                Math.floor(total_seconds / 3600),
                Math.floor(total_seconds / 60) % 60,
                total_seconds % 60
              );
              date = date_utc;
            }

            if (!date) return null;
            const localDate = new Date(
              date.getFullYear(),
              date.getMonth(),
              date.getDate()
            );
            return localDate.toISOString();
          };

          const parseRetentionYears = (value: any): number => {
            if (typeof value === "number") return value;
            if (typeof value === "string") {
              const parsed = parseInt(value);
              return isNaN(parsed) ? 2 : parsed;
            }
            return 2;
          };

          const sanitizeString = (value: any): string | null => {
            if (value === null || value === undefined || value === "")
              return null;
            const str = value.toString().trim();
            return str === "" ? null : str;
          };

          const classification = sanitizeString(
            getValueByColumnName(rawRow, "KLASIFIKASI")
          );
          let retensiAktif = parseRetentionYears(
            getValueByColumnName(rawRow, "RETENSI AKTIF")
          );

          // Auto-fix retensi aktif jika classification rule exists dan autoFix diaktifkan
          if (classification && autoFix) {
            const rule = getClassificationRule(classification);
            if (rule) {
              retensiAktif = rule.retensiAktif; // Selalu 2 tahun
            }
          }

          // Create the archive data dengan nama kolom yang tepat
          const archiveData = {
            kodeUnit: sanitizeString(kodeUnit) || "",
            indeks: sanitizeString(getValueByColumnName(rawRow, "INDEKS")),
            nomorBerkas: sanitizeString(nomorBerkasValue) || "",
            judulBerkas: sanitizeString(
              getValueByColumnName(rawRow, "JUDUL BERKAS")
            ),
            nomorIsiBerkas: sanitizeString(
              getValueByColumnName(rawRow, "NOMOR ISI BERKAS")
            ),
            jenisNaskahDinas: sanitizeString(
              getValueByColumnName(rawRow, "JENIS NASKAH DINAS")
            ),
            klasifikasi: classification,
            nomorSurat:
              sanitizeString(nomorSurat) ||
              sanitizeString(nomorNaskahDinas) ||
              "",
            tanggal: parseExcelDateToISOString(
              getValueByColumnName(rawRow, "TANGGAL")
            ),
            perihal: sanitizeString(perihal) || "",
            tahun: getValueByColumnName(rawRow, "TAHUN")
              ? parseInt(getValueByColumnName(rawRow, "TAHUN") as string)
              : getValueByColumnName(rawRow, "TANGGAL")
              ? new Date(getValueByColumnName(rawRow, "TANGGAL")).getFullYear()
              : null,
            tingkatPerkembangan: sanitizeString(
              getValueByColumnName(rawRow, "TINGKAT PERKEMBANGAN")
            ),
            kondisi: sanitizeString(getValueByColumnName(rawRow, "KONDISI")),
            lokasiSimpan: sanitizeString(
              getValueByColumnName(rawRow, "LOKASI SIMPAN")
            ),
            retensiAktif: sanitizeString(
              getValueByColumnName(rawRow, "RETENSI AKTIF")
            ),
            keterangan: sanitizeString(
              getValueByColumnName(rawRow, "KETERANGAN")
            ),
            entryDate: batchEntryDate,
            retentionYears: retensiAktif, // Menggunakan retensi aktif yang sudah difix jika perlu
            status:
              getValueByColumnName(rawRow, "STATUS") &&
              statusMap[getValueByColumnName(rawRow, "STATUS")?.toString()]
                ? statusMap[getValueByColumnName(rawRow, "STATUS")?.toString()]
                : "ACTIVE",
            userId: userId,
          };

          // Additional validation for required fields
          if (!archiveData.kodeUnit.trim()) {
            throw new Error("Kode Unit tidak boleh kosong");
          }
          if (!archiveData.nomorSurat.trim()) {
            throw new Error(
              "Nomor Surat/Nomor Naskah Dinas tidak boleh kosong"
            );
          }
          if (!archiveData.perihal.trim()) {
            throw new Error("Perihal tidak boleh kosong");
          }
          if (!archiveData.nomorBerkas.trim()) {
            throw new Error(
              "Nomor Berkas/Nomor Dus/No Box Sementara tidak boleh kosong"
            );
          }

          await prisma.archive.create({
            data: archiveData,
          });

          success++;
        } catch (err: any) {
          failed++;
          errors.push({
            sheet: sheetName,
            row: rowIndex + headerRowIndex + 2,
            error: err.message || "Unknown error",
            data: {
              kodeUnit: getValueByColumnName(rawRow, "KODE UNIT"),
              nomorSurat:
                getValueByColumnName(rawRow, "NOMOR SURAT") ||
                getValueByColumnName(rawRow, "NOMOR NASKAH DINAS"),
              perihal: getValueByColumnName(rawRow, "PERIHAL"),
              nomorBerkas:
                getValueByColumnName(rawRow, "NOMOR BERKAS") ||
                getValueByColumnName(rawRow, "NOMOR DUS") ||
                getValueByColumnName(rawRow, "NO BOX SEMENTARA"),
            },
          });
        }
      }
    }

    return NextResponse.json({
      totalRows,
      successRows: success,
      failedRows: failed,
      errors: errors.slice(0, 10),
      hasRetentionMismatches: false,
    });
  } catch (error: any) {
    console.error("Import API error:", error);
    return NextResponse.json(
      { error: error.message || "Terjadi kesalahan saat mengimpor file" },
      { status: 500 }
    );
  }
}
