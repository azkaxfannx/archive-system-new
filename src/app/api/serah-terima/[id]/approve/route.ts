// app/api/serah-terima/[id]/approve/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/utils/withAuth";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// POST /api/serah-terima/[id]/approve - Approve usulan
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    console.log("=== DEBUG APPROVE API ===");

    const { user, error } = requireAuth(request);
    if (error) return error;

    // Only ADMIN can approve
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Only admin can approve usulan" },
        { status: 403 }
      );
    }

    const { id } = await params;
    console.log("Approve ID:", id);

    const data = await request.json();
    console.log("Request data:", data);

    // Validate required fields
    if (!data.nomorBeritaAcara || !data.tanggalSerahTerima) {
      return NextResponse.json(
        {
          success: false,
          error: "Nomor berita acara dan tanggal serah terima wajib diisi",
        },
        { status: 400 }
      );
    }

    // Check if usulan exists
    const usulan = await prisma.serahTerima.findUnique({
      where: { id },
    });

    if (!usulan) {
      return NextResponse.json(
        { success: false, error: "Usulan tidak ditemukan" },
        { status: 404 }
      );
    }

    console.log("Found usulan:", usulan);

    // Check if already processed
    if (usulan.statusUsulan !== "PENDING") {
      return NextResponse.json(
        {
          success: false,
          error: `Usulan sudah ${
            usulan.statusUsulan === "APPROVED" ? "disetujui" : "ditolak"
          }`,
        },
        { status: 400 }
      );
    }

    // Check if nomorBeritaAcara is unique
    const existingBeritaAcara = await prisma.serahTerima.findFirst({
      where: {
        nomorBeritaAcara: data.nomorBeritaAcara,
        id: { not: id },
      },
    });

    if (existingBeritaAcara) {
      return NextResponse.json(
        {
          success: false,
          error: "Nomor berita acara sudah digunakan",
        },
        { status: 400 }
      );
    }

    // Approve usulan
    const approved = await prisma.serahTerima.update({
      where: { id },
      data: {
        statusUsulan: "APPROVED",
        nomorBeritaAcara: data.nomorBeritaAcara,
        tanggalSerahTerima: new Date(data.tanggalSerahTerima),
        keterangan: data.keterangan || null,
      },
      // FIXED: Menggunakan many-to-many relation yang benar
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

    console.log("Approved result:", approved);

    return NextResponse.json({
      success: true,
      data: approved,
      message: "Usulan berhasil disetujui",
    });
  } catch (error) {
    console.error("Error approving usulan:", error);
    // Return more detailed error
    return NextResponse.json(
      {
        success: false,
        error: "Failed to approve usulan",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
