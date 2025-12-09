import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/utils/withAuth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ archiveId: string }> }
) {
  const { archiveId } = await params;

  if (!archiveId) {
    return NextResponse.json(
      { success: false, error: "Archive ID is required" },
      { status: 400 }
    );
  }

  try {
    const { user, error } = requireAuth(request);
    if (error) return error;

    // =============== YOUR LOGIC BELOW ===============

    const archive = await prisma.archive.findUnique({
      where: { id: archiveId },
      select: {
        id: true,
        judulBerkas: true,
        status: true,
        ...(user.role !== "ADMIN" && { userId: true }),
      },
    });

    if (!archive) {
      return NextResponse.json(
        { available: false, reason: "Arsip tidak ditemukan" },
        { status: 404 }
      );
    }

    if (user.role !== "ADMIN" && archive.userId !== user.userId) {
      return NextResponse.json(
        { available: false, reason: "Tidak diizinkan mengakses arsip ini" },
        { status: 403 }
      );
    }

    const activePeminjaman = await prisma.peminjaman.findFirst({
      where: { archiveId, tanggalPengembalian: null },
    });

    if (activePeminjaman) {
      return NextResponse.json({
        available: false,
        reason: "Arsip sedang dipinjam",
        peminjamanDetail: activePeminjaman,
      });
    }

    const serahTerima = await prisma.serahTerima.findUnique({
      where: { archiveId },
    });

    if (serahTerima) {
      return NextResponse.json({
        available: false,
        reason: "Arsip sudah diserahterimakan",
        serahTerimaDetail: serahTerima,
      });
    }

    return NextResponse.json({
      available: true,
      reason: "Arsip tersedia untuk diserahterimakan",
      archive,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        available: false,
        reason: "Terjadi kesalahan server",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
