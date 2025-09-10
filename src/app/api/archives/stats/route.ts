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
  const role = payload.role; // pastikan token menyimpan role juga

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

  // Hitung total box berdasarkan klasifikasi
  const archivesWithLokasiSimpan = await prisma.archive.findMany({
    where: {
      ...baseWhere,
      lokasiSimpan: {
        not: null,
      },
    },
    select: {
      lokasiSimpan: true,
    },
  });

  // Parse klasifikasi dan hitung box per kategori
  const boxStats = archivesWithLokasiSimpan.reduce((acc, archive) => {
    if (archive.lokasiSimpan) {
      const parts = archive.lokasiSimpan.split(".");

      // Pastikan format sesuai (minimal 4 bagian: KATEGORI.RAK.BARIS.BOX)
      if (parts.length >= 4) {
        const kategori = parts[0]; // HM, KS, TEK, dll
        const boxNum = parseInt(parts[3]); // nomor box

        if (!isNaN(boxNum)) {
          if (!acc[kategori]) {
            acc[kategori] = {
              maxBox: 0,
              totalArchives: 0,
            };
          }

          acc[kategori].maxBox = Math.max(acc[kategori].maxBox, boxNum);
          acc[kategori].totalArchives += 1;
        }
      }
    }
    return acc;
  }, {} as Record<string, { maxBox: number; totalArchives: number }>);

  // Hitung total box keseluruhan
  const totalBoxCount = Object.values(boxStats).reduce(
    (sum, stat) => sum + stat.maxBox,
    0
  );

  // Format response untuk box stats
  const boxStatsByCategory = Object.entries(boxStats).map(
    ([kategori, data]) => ({
      kategori,
      totalBox: data.maxBox,
      totalArchives: data.totalArchives,
    })
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
  });
}
