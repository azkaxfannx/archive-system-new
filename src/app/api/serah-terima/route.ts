import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/utils/withAuth";

// GET - Get all serah terima
export async function GET(request: NextRequest) {
  try {
    const { user, error } = requireAuth(request);
    if (error) return error;

    const whereClause =
      user.role === "ADMIN" ? {} : { archive: { userId: user.userId } };

    const serahTerimaList = await prisma.serahTerima.findMany({
      where: whereClause,
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

// POST - Create usulan serah terima
export async function POST(request: NextRequest) {
  try {
    const { user, error } = requireAuth(request);
    if (error) return error;

    const data = await request.json();

    // Validate required fields
    if (!data.pihakPenyerah || !data.pihakPenerima || !data.archiveId) {
      return NextResponse.json(
        {
          success: false,
          error: "Pihak penyerah, pihak penerima, dan arsip wajib diisi",
        },
        { status: 400 }
      );
    }

    // Check if archive exists and user has access
    const archive = await prisma.archive.findUnique({
      where: { id: data.archiveId },
      include: { serahTerima: true, peminjaman: true },
    });

    if (!archive) {
      return NextResponse.json(
        {
          success: false,
          error: "Arsip tidak ditemukan",
        },
        { status: 404 }
      );
    }

    // Check user access
    if (user.role !== "ADMIN" && archive.userId !== user.userId) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Check if already has serah terima
    if (archive.serahTerima) {
      return NextResponse.json(
        {
          success: false,
          error: "Arsip ini sudah memiliki usulan serah terima",
        },
        { status: 400 }
      );
    }

    // Check if being borrowed
    const activePeminjaman = archive.peminjaman.find(
      (p) => !p.tanggalPengembalian
    );
    if (activePeminjaman) {
      return NextResponse.json(
        {
          success: false,
          error: "Arsip sedang dipinjam dan tidak dapat diusulkan",
        },
        { status: 400 }
      );
    }

    // Create usulan serah terima
    const serahTerima = await prisma.serahTerima.create({
      data: {
        pihakPenyerah: data.pihakPenyerah,
        pihakPenerima: data.pihakPenerima,
        archiveId: data.archiveId,
        statusUsulan: "PENDING",
      },
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
    });

    return NextResponse.json({
      success: true,
      data: serahTerima,
      message: "Usulan serah terima berhasil dibuat",
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