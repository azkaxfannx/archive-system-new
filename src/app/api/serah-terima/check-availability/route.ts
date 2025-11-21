// app/api/serah-terima/check-availability/[archiveId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/utils/withAuth";

interface RouteParams {
  params: Promise<{
    archiveId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    console.log("=== CHECK AVAILABILITY DEBUG ===");
    console.log("Headers:", Object.fromEntries(request.headers.entries()));
    console.log("Cookies:", Object.fromEntries(request.cookies));

    const authToken = request.cookies.get("auth-token")?.value;
    console.log("Auth token found:", authToken ? "YES" : "NO");

    const { user, error } = requireAuth(request);
    console.log("Auth result:", { user: !!user, error: !!error });

    if (error) {
      console.log("Auth failed, returning error");
      return error;
    }

    console.log("Auth successful, user:", user);

    // Await params to get the actual object
    const { archiveId } = await params;
    console.log("Checking availability for archiveId:", archiveId);

    if (!archiveId) {
      return NextResponse.json(
        {
          success: false,
          error: "Archive ID is required",
        },
        { status: 400 }
      );
    }

    // Check if archive exists
    const archive = await prisma.archive.findUnique({
      where: { id: archiveId },
      select: {
        id: true,
        judulBerkas: true,
        status: true,
        // For non-admin users, check ownership
        ...(user.role !== "ADMIN" && { userId: true }),
      },
    });

    if (!archive) {
      return NextResponse.json(
        {
          available: false,
          reason: "Arsip tidak ditemukan",
        },
        { status: 404 }
      );
    }

    // Check permissions for non-admin users
    if (user.role !== "ADMIN" && archive.userId !== user.userId) {
      return NextResponse.json(
        {
          available: false,
          reason: "Tidak diizinkan mengakses arsip ini",
        },
        { status: 403 }
      );
    }

    // Check if archive has active peminjaman (belum dikembalikan)
    const activePeminjaman = await prisma.peminjaman.findFirst({
      where: {
        archiveId: archiveId,
        tanggalPengembalian: null, // Belum dikembalikan
      },
      select: {
        id: true,
        peminjam: true,
        tanggalPinjam: true,
        tanggalHarusKembali: true,
      },
    });

    if (activePeminjaman) {
      const harusKembali = new Date(
        activePeminjaman.tanggalHarusKembali
      ).toLocaleDateString("id-ID");
      return NextResponse.json({
        available: false,
        reason: `Arsip sedang dipinjam oleh ${activePeminjaman.peminjam} (harus kembali: ${harusKembali})`,
        peminjamanDetail: activePeminjaman,
      });
    }

    // Check if archive already has serah terima (berdasarkan schema, archiveId unique di SerahTerima)
    const existingSerahTerima = await prisma.serahTerima.findUnique({
      where: {
        archiveId: archiveId,
      },
      select: {
        id: true,
        nomorBeritaAcara: true,
        pihakPenyerah: true,
        pihakPenerima: true,
        tanggalSerahTerima: true,
      },
    });

    if (existingSerahTerima) {
      const tanggalSerahTerima = new Date(
        existingSerahTerima.tanggalSerahTerima
      ).toLocaleDateString("id-ID");
      return NextResponse.json({
        available: false,
        reason: `Arsip sudah diserahterimakan (Berita Acara: ${existingSerahTerima.nomorBeritaAcara}, tanggal: ${tanggalSerahTerima})`,
        serahTerimaDetail: existingSerahTerima,
      });
    }

    // Check archive status
    if (archive.status === "DISPOSE_ELIGIBLE") {
      return NextResponse.json({
        available: false,
        reason: "Arsip sudah eligible untuk dimusnahkan (DISPOSE_ELIGIBLE)",
      });
    }

    if (archive.status === "INACTIVE") {
      return NextResponse.json({
        available: false,
        reason: "Arsip dalam status tidak aktif (INACTIVE)",
      });
    }

    // Archive is available for handover
    return NextResponse.json({
      available: true,
      reason: "Arsip tersedia untuk diserahterimakan",
      archive: {
        id: archive.id,
        judulBerkas: archive.judulBerkas,
        status: archive.status,
      },
    });
  } catch (error) {
    console.error("Error checking archive availability:", error);
    return NextResponse.json(
      {
        success: false,
        available: false,
        reason: "Terjadi kesalahan server saat memeriksa ketersediaan arsip",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
