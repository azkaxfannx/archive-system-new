import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/utils/withAuth";

// GET - Get all serah terima
export async function GET(request: NextRequest) {
  try {
    const { user, error } = requireAuth(request);
    if (error) return error;

    const whereClause =
      user.role === "ADMIN"
        ? {}
        : {
            archives: {
              some: {
                archive: {
                  userId: user.userId,
                },
              },
            },
          };

    const serahTerimaList = await prisma.serahTerima.findMany({
      where: whereClause,
      include: {
        archives: {
          include: {
            archive: {
              select: {
                id: true,
                judulBerkas: true,
                nomorBerkas: true,
                klasifikasi: true,
                nomorSurat: true,
                perihal: true,
                tanggal: true,
                lokasiSimpan: true,
              },
            },
          },
        },
      },
      orderBy: { tanggalUsulan: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: serahTerimaList,
    });
  } catch (error) {
    console.error("Error fetching serah terima:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch serah terima",
      },
      { status: 500 }
    );
  }
}

// POST - Create usulan serah terima with multiple archives
export async function POST(request: NextRequest) {
  try {
    const { user, error } = requireAuth(request);
    if (error) return error;

    const data = await request.json();

    // Validate required fields
    if (
      !data.pihakPenyerah ||
      !data.pihakPenerima ||
      !data.nomorBerkas ||
      !data.archiveIds ||
      data.archiveIds.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Pihak penyerah, pihak penerima, nomor berkas, dan minimal 1 arsip wajib dipilih",
        },
        { status: 400 }
      );
    }

    // Validate archives exist and belong to the same nomorBerkas
    const archives = await prisma.archive.findMany({
      where: {
        id: { in: data.archiveIds },
      },
      include: {
        serahTerimaArchives: {
          include: {
            serahTerima: true,
          },
        },
        peminjaman: {
          where: {
            tanggalPengembalian: null,
          },
        },
      },
    });

    if (archives.length !== data.archiveIds.length) {
      return NextResponse.json(
        {
          success: false,
          error: "Beberapa arsip tidak ditemukan",
        },
        { status: 404 }
      );
    }

    // Check user access
    if (user.role !== "ADMIN") {
      const hasUnauthorizedArchive = archives.some(
        (a) => a.userId !== user.userId
      );
      if (hasUnauthorizedArchive) {
        return NextResponse.json(
          { success: false, error: "Forbidden" },
          { status: 403 }
        );
      }
    }

    // Check if all archives have the same nomorBerkas
    const allSameNomorBerkas = archives.every(
      (a) => a.nomorBerkas === data.nomorBerkas
    );
    if (!allSameNomorBerkas) {
      return NextResponse.json(
        {
          success: false,
          error: "Semua arsip harus memiliki nomor berkas yang sama",
        },
        { status: 400 }
      );
    }

    // Check if any archive already has serah terima
    const archiveWithSerahTerima = archives.find((a) =>
      a.serahTerimaArchives.some(
        (sta) =>
          sta.serahTerima.statusUsulan === "PENDING" ||
          sta.serahTerima.statusUsulan === "APPROVED"
      )
    );

    if (archiveWithSerahTerima) {
      return NextResponse.json(
        {
          success: false,
          error: `Arsip "${archiveWithSerahTerima.judulBerkas}" sudah memiliki usulan serah terima`,
        },
        { status: 400 }
      );
    }

    // Check if any archive is being borrowed
    const borrowedArchive = archives.find((a) => a.peminjaman.length > 0);
    if (borrowedArchive) {
      return NextResponse.json(
        {
          success: false,
          error: `Arsip "${borrowedArchive.judulBerkas}" sedang dipinjam dan tidak dapat diusulkan`,
        },
        { status: 400 }
      );
    }

    // Create serah terima with multiple archives
    const serahTerima = await prisma.serahTerima.create({
      data: {
        pihakPenyerah: data.pihakPenyerah,
        pihakPenerima: data.pihakPenerima,
        nomorBerkas: data.nomorBerkas,
        statusUsulan: "PENDING",
        archives: {
          create: data.archiveIds.map((archiveId: string) => ({
            archiveId: archiveId,
          })),
        },
      },
      include: {
        archives: {
          include: {
            archive: {
              select: {
                id: true,
                judulBerkas: true,
                nomorBerkas: true,
                klasifikasi: true,
                nomorSurat: true,
                perihal: true,
                tanggal: true,
                lokasiSimpan: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: serahTerima,
      message: `Usulan serah terima untuk ${archives.length} arsip berhasil dibuat`,
    });
  } catch (error) {
    console.error("Error creating serah terima:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create serah terima",
      },
      { status: 500 }
    );
  }
}
