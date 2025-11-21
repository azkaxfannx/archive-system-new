import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, verifyToken } from "@/utils/auth";

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

  // Kalau ADMIN → tidak ada filter ({}), kalau USER → filter berdasarkan userId
  const baseWhere = role === "ADMIN" ? {} : { userId };

  // Stats arsip seperti biasa
  const totalCount = await prisma.archive.count({ where: baseWhere });
  const activeCount = await prisma.archive.count({
    where: { ...baseWhere, status: "ACTIVE" },
  });
  const inactiveCount = await prisma.archive.count({
    where: { ...baseWhere, status: "INACTIVE" },
  });
  const disposeCount = await prisma.archive.count({
    where: { ...baseWhere, status: "DISPOSE_ELIGIBLE" },
  });

  // Hitung distribusi jenisNaskahDinas
  const jenisStats = await prisma.archive.groupBy({
    by: ["jenisNaskahDinas"],
    _count: { jenisNaskahDinas: true },
    where: baseWhere,
  });

  // Format response
  const jenisNaskahDinasData = jenisStats.map((j) => ({
    jenis: j.jenisNaskahDinas || "Lainnya",
    total: j._count.jenisNaskahDinas,
  }));

  // Ambil semua arsip dengan nomorBerkas untuk menghitung box
  const archivesWithNomorBerkas = await prisma.archive.findMany({
    where: {
      ...baseWhere,
      nomorBerkas: {
        not: null,
      },
    },
    select: {
      nomorBerkas: true,
    },
  });

  // Parse nomorBerkas dan hitung box per kategori (dari prefix nomorBerkas)
  const boxStats = archivesWithNomorBerkas.reduce((acc, archive) => {
    if (archive.nomorBerkas) {
      const nomorBerkas = archive.nomorBerkas.trim();

      let kategori = "UMUM";
      let boxNum: number | null = null;

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

      // Jika berhasil mendapatkan nomor box yang valid
      if (boxNum && !isNaN(boxNum) && boxNum > 0) {
        if (!acc[kategori]) {
          acc[kategori] = new Set<number>();
        }

        // Tambahkan nomor box ke Set (unik)
        acc[kategori].add(boxNum);
      }
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
      const totalArchives = archivesWithNomorBerkas.filter((archive) => {
        if (!archive.nomorBerkas) return false;

        const nomorBerkas = archive.nomorBerkas.trim();
        let archiveKategori = "UMUM";

        if (nomorBerkas.includes(".")) {
          const parts = nomorBerkas.split(".");
          archiveKategori = parts[0];
        }

        return archiveKategori === kategori;
      }).length;

      return {
        kategori,
        totalBox,
        totalArchives,
      };
    }
  );

  return NextResponse.json({
    // Stats arsip
    totalCount,
    activeCount,
    inactiveCount,
    disposeCount,

    // Stats box
    totalBoxCount,
    boxStatsByCategory,

    jenisNaskahDinasData,
  });
}
