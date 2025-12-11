// app/api/archives/nomor-berkas/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/utils/withAuth";

// GET - Get unique nomor berkas list (excluding those with approved serah terima)
export async function GET(req: NextRequest) {
  try {
    const { user, error } = requireAuth(req);
    if (error) return error;

    const userFilter = user.role === "ADMIN" ? {} : { userId: user.userId };

    // Get all archives without approved serah terima
    const archives = await prisma.archive.findMany({
      where: {
        ...userFilter,
        nomorBerkas: { not: null },
        // Exclude archives with approved serah terima
        serahTerimaArchives: {
          none: {
            serahTerima: {
              statusUsulan: "APPROVED",
            },
          },
        },
      },
      select: {
        nomorBerkas: true,
      },
      distinct: ["nomorBerkas"],
      orderBy: {
        nomorBerkas: "asc",
      },
    });

    // Extract unique nomor berkas
    const nomorBerkasList = archives
      .map((a) => a.nomorBerkas)
      .filter((nb): nb is string => nb !== null);

    return NextResponse.json({
      success: true,
      data: nomorBerkasList,
    });
  } catch (error) {
    console.error("Error fetching nomor berkas:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch nomor berkas",
      },
      { status: 500 }
    );
  }
}
