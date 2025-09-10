import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, verifyToken } from "@/utils/auth";
import {
  getClassificationRule,
  validateRetentionYear,
  RetentionMismatch,
} from "@/utils/classificationRules";

export async function POST(req: Request) {
  try {
    // FIXED: Get userId from authentication token with await
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

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const forceImport = formData.get("forceImport") === "true"; // Flag untuk bypass validasi retensi

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
    const retentionMismatches: RetentionMismatch[] = [];
    const batchEntryDate = new Date();
    let totalRows = 0;

    // First pass: Validate and collect mismatches
    for (const sheetName of sheetNames) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) continue;

      const sheetData = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });

      const headerRowIndex = sheetData.findIndex((row) =>
        row.some(
          (cell) =>
            typeof cell === "string" && cell.toUpperCase().includes("KODE UNIT")
        )
      );

      if (headerRowIndex === -1) {
        errors.push({
          sheet: sheetName,
          error: "Tidak ditemukan header valid pada sheet",
        });
        continue;
      }

      const rows = XLSX.utils.sheet_to_json(sheet, {
        header: sheetData[headerRowIndex] as string[],
        range: headerRowIndex + 1,
        defval: "",
      }) as any[];

      totalRows += rows.length;

      for (const [index, row] of rows.entries()) {
        try {
          // Skip baris yang hanya berisi angka/nomor urut
          const isNumberedRow = Object.values(row).every((value) => {
            if (value === null || value === undefined || value === "")
              return false;
            return !isNaN(Number(value)) && value.toString().trim() !== "";
          });

          if (isNumberedRow) {
            continue;
          }

          // VALIDASI FLEKSIBEL: Terima NOMOR SURAT atau NOMOR NASKAH DINAS
          const hasNomorSurat =
            row["NOMOR SURAT"] && row["NOMOR SURAT"].toString().trim() !== "";
          const hasNomorNaskahDinas =
            row["NOMOR NASKAH DINAS"] &&
            row["NOMOR NASKAH DINAS"].toString().trim() !== "";

          if (
            !row["KODE UNIT"] ||
            (!hasNomorSurat && !hasNomorNaskahDinas) ||
            !row["PERIHAL"]
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

          const classification = sanitizeString(row["KLASIFIKASI"]);
          const retentionYears = parseRetentionYears(row["RETENSI AKTIF"]);

          // Check retention mismatch if classification exists
          if (classification && !forceImport) {
            const rule = getClassificationRule(classification);
            if (
              rule &&
              !validateRetentionYear(classification, retentionYears)
            ) {
              retentionMismatches.push({
                row: index + headerRowIndex + 2,
                classification: classification,
                currentRetention: retentionYears,
                expectedRetention: rule.retentionYears,
                ruleName: rule.name,
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
          message: "Ditemukan ketidaksesuaian masa retensi dengan klasifikasi",
        },
        { status: 422 }
      );
    }

    // Second pass: Actually import the data
    for (const sheetName of sheetNames) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) continue;

      const sheetData = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });

      const headerRowIndex = sheetData.findIndex((row) =>
        row.some(
          (cell) =>
            typeof cell === "string" && cell.toUpperCase().includes("KODE UNIT")
        )
      );

      if (headerRowIndex === -1) {
        continue;
      }

      const rows = XLSX.utils.sheet_to_json(sheet, {
        header: sheetData[headerRowIndex] as string[],
        range: headerRowIndex + 1,
        defval: "",
      }) as any[];

      for (const [index, row] of rows.entries()) {
        try {
          // Skip baris yang hanya berisi angka/nomor urut
          const isNumberedRow = Object.values(row).every((value) => {
            if (value === null || value === undefined || value === "")
              return false;
            return !isNaN(Number(value)) && value.toString().trim() !== "";
          });

          if (isNumberedRow) {
            continue;
          }

          // VALIDASI FLEKSIBEL
          const hasNomorSurat =
            row["NOMOR SURAT"] && row["NOMOR SURAT"].toString().trim() !== "";
          const hasNomorNaskahDinas =
            row["NOMOR NASKAH DINAS"] &&
            row["NOMOR NASKAH DINAS"].toString().trim() !== "";

          if (
            !row["KODE UNIT"] ||
            (!hasNomorSurat && !hasNomorNaskahDinas) ||
            !row["PERIHAL"]
          ) {
            throw new Error(
              "Kolom KODE UNIT, (NOMOR SURAT atau NOMOR NASKAH DINAS), dan PERIHAL wajib diisi"
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

          const classification = sanitizeString(row["KLASIFIKASI"]);
          let retentionYears = parseRetentionYears(row["RETENTION YEARS"]);

          // Auto-fix retention years if classification rule exists and forceImport is "fix"
          if (classification && formData.get("autoFix") === "true") {
            const rule = getClassificationRule(classification);
            if (rule) {
              retentionYears = rule.retentionYears;
            }
          }

          // Create the archive data with proper validation
          const archiveData = {
            kodeUnit: sanitizeString(row["KODE UNIT"]) || "",
            indeks: sanitizeString(row["INDEKS"]),
            nomorBerkas: sanitizeString(row["NOMOR BERKAS"]),
            judulBerkas: sanitizeString(row["JUDUL BERKAS"]),
            nomorIsiBerkas: sanitizeString(row["NOMOR ISI BERKAS"]),
            jenisNaskahDinas: sanitizeString(row["JENIS NASKAH DINAS"]),
            klasifikasi: classification,
            nomorSurat:
              sanitizeString(row["NOMOR SURAT"]) ||
              sanitizeString(row["NOMOR NASKAH DINAS"]) ||
              "",
            tanggal: parseExcelDateToISOString(row["TANGGAL"]),
            perihal: sanitizeString(row["PERIHAL"]) || "",
            tahun: row["TAHUN"]
              ? parseInt(row["TAHUN"] as string)
              : row["TANGGAL"]
              ? new Date(row["TANGGAL"]).getFullYear()
              : null,
            tingkatPerkembangan: sanitizeString(row["TINGKAT PERKEMBANGAN"]),
            kondisi: sanitizeString(row["KONDISI"]),
            lokasiSimpan: sanitizeString(row["LOKASI SIMPAN"]),
            retensiAktif: sanitizeString(row["RETENSI AKTIF"]),
            keterangan: sanitizeString(row["KETERANGAN"]),
            entryDate: batchEntryDate,
            retentionYears: retentionYears,
            status:
              row["STATUS"] && statusMap[row["STATUS"]?.toString()]
                ? statusMap[row["STATUS"]?.toString()]
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

          await prisma.archive.create({
            data: archiveData,
          });

          success++;
        } catch (err: any) {
          failed++;
          errors.push({
            sheet: sheetName,
            row: index + headerRowIndex + 2,
            error: err.message || "Unknown error",
            data: {
              kodeUnit: row["KODE UNIT"],
              nomorSurat: row["NOMOR SURAT"] || row["NOMOR NASKAH DINAS"],
              perihal: row["PERIHAL"],
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
