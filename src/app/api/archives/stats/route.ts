// app/api/archives/stats/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, verifyToken } from "@/utils/auth";
import { calculateArchiveStatus } from "@/utils/calculateArchiveStatus";

export async function GET() {
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
  const role = payload.role;

  // Filter berdasarkan role
  const baseWhere = role === "ADMIN" ? {} : { userId };

  // Ambil SEMUA arsip dengan tanggal dan klasifikasi untuk perhitungan status
  const allArchives = await prisma.archive.findMany({
    where: baseWhere,
    select: {
      id: true,
      tanggal: true,
      klasifikasi: true,
      nomorBerkas: true,
      jenisNaskahDinas: true,
    },
  });

  // Hitung status secara real-time berdasarkan tanggal dan klasifikasi
  let activeCount = 0;
  let inactiveCount = 0;
  let disposeCount = 0;

  const archivesWithStatus = allArchives.map((archive) => {
    const statusCalc = calculateArchiveStatus(
      archive.tanggal,
      archive.klasifikasi
    );

    // Count berdasarkan status yang dihitung
    if (statusCalc.status === "ACTIVE") activeCount++;
    else if (statusCalc.status === "INACTIVE") inactiveCount++;
    else if (statusCalc.status === "DISPOSE_ELIGIBLE") disposeCount++;

    return {
      ...archive,
      calculatedStatus: statusCalc.status,
    };
  });

  const totalCount = allArchives.length;

  // Hitung distribusi jenisNaskahDinas
  const jenisStatsMap = new Map<string, number>();
  archivesWithStatus.forEach((archive) => {
    const jenis = archive.jenisNaskahDinas || "Lainnya";
    jenisStatsMap.set(jenis, (jenisStatsMap.get(jenis) || 0) + 1);
  });

  const jenisNaskahDinasData = Array.from(jenisStatsMap.entries()).map(
    ([jenis, total]) => ({
      jenis,
      total,
    })
  );

  // Parse nomorBerkas dan hitung box per kategori
  const boxStats = archivesWithStatus.reduce((acc, archive) => {
    let kategori = "UMUM";
    let boxNum: number | null = null;

    if (archive.nomorBerkas) {
      const nomorBerkas = archive.nomorBerkas.trim();

      // Cek jika nomorBerkas adalah angka langsung (1, 2, 3, dll)
      if (/^\d+$/.test(nomorBerkas)) {
        boxNum = parseInt(nomorBerkas);
      }
      // Cek format dengan titik (PKPJ.3.3.9)
      else if (nomorBerkas.includes(".")) {
        const parts = nomorBerkas.split(".");

        // Ambil bagian PERTAMA sebagai kategori (PKPJ, HM, KS, dll)
        kategori = parts[0];

        // Ambil bagian terakhir sebagai nomor box
        const lastPart = parts[parts.length - 1];
        boxNum = parseInt(lastPart);

        // Jika bagian terakhir bukan angka, coba bagian sebelumnya
        if (isNaN(boxNum) && parts.length >= 2) {
          const secondLastPart = parts[parts.length - 2];
          boxNum = parseInt(secondLastPart);
        }
      }
    }

    // Jika berhasil mendapatkan nomor box yang valid
    if (boxNum && !isNaN(boxNum) && boxNum > 0) {
      if (!acc[kategori]) {
        acc[kategori] = new Set<number>();
      }
      acc[kategori].add(boxNum);
    }

    return acc;
  }, {} as Record<string, Set<number>>);

  // Hitung total box keseluruhan dan format response
  let totalBoxCount = 0;
  const boxStatsByCategory = Object.entries(boxStats).map(
    ([kategori, boxNumbers]) => {
      const uniqueBoxes = Array.from(boxNumbers);
      const totalBox = uniqueBoxes.length;
      totalBoxCount += totalBox;

      // Hitung total arsip untuk kategori ini
      const totalArchives = archivesWithStatus.filter((archive) => {
        if (!archive.nomorBerkas) {
          return kategori === "UMUM";
        }

        const nomorBerkas = archive.nomorBerkas.trim();

        if (nomorBerkas.includes(".")) {
          const parts = nomorBerkas.split(".");
          const archiveKategori = parts[0];
          return archiveKategori === kategori;
        } else {
          return kategori === "UMUM";
        }
      }).length;

      return {
        kategori,
        totalBox,
        totalArchives,
      };
    }
  );

  return NextResponse.json({
    // Stats arsip dengan perhitungan real-time
    totalCount,
    activeCount,
    inactiveCount,
    disposeCount,

    // Stats box
    totalBoxCount,
    boxStatsByCategory,

    // Stats jenis naskah dinas
    jenisNaskahDinasData,
  });
}
