import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/utils/withAuth";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// POST /api/serah-terima/[id]/reject - Reject usulan
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, error } = requireAuth(request);
    if (error) return error;

    // Only ADMIN can reject
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Only admin can reject usulan" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const data = await request.json();

    // Validate required field
    if (!data.alasanPenolakan) {
      return NextResponse.json(
        {
          success: false,
          error: "Alasan penolakan wajib diisi",
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

    // Reject usulan
    const rejected = await prisma.serahTerima.update({
      where: { id },
      data: {
        statusUsulan: "REJECTED",
        alasanPenolakan: data.alasanPenolakan,
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
      data: rejected,
      message: "Usulan berhasil ditolak",
    });
  } catch (error) {
    console.error("Error rejecting usulan:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to reject usulan",
      },
      { status: 500 }
    );
  }
}