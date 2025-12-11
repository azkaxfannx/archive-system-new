// app/api/archives/by-nomor-berkas/[nomorBerkas]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/utils/withAuth";

interface RouteParams {
  params: Promise<{
    nomorBerkas: string;
  }>;
}

// GET - Get all archives by nomor berkas (excluding those with approved serah terima)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, error } = requireAuth(request);
    if (error) return error;

    const { nomorBerkas } = await params;
    const decodedNomorBerkas = decodeURIComponent(nomorBerkas);

    const userFilter = user.role === "ADMIN" ? {} : { userId: user.userId };

    // Get archives with the specified nomor berkas
    const archives = await prisma.archive.findMany({
      where: {
        ...userFilter,
        nomorBerkas: decodedNomorBerkas,
        // Exclude archives that:
        // 1. Have approved serah terima
        // 2. Are currently being borrowed (have active peminjaman)
        serahTerimaArchives: {
          none: {
            serahTerima: {
              statusUsulan: "APPROVED",
            },
          },
        },
      },
      include: {
        peminjaman: {
          where: {
            tanggalPengembalian: null,
          },
        },
        serahTerimaArchives: {
          include: {
            serahTerima: {
              select: {
                statusUsulan: true,
              },
            },
          },
        },
      },
      orderBy: {
        tanggal: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        nomorBerkas: decodedNomorBerkas,
        archives: archives,
        totalCount: archives.length,
      },
    });
  } catch (error) {
    console.error("Error fetching archives by nomor berkas:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch archives",
      },
      { status: 500 }
    );
  }
}
