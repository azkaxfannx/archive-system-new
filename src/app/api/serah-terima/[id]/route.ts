import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/utils/withAuth";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

async function canAccessSerahTerima(
  id: string,
  user: { userId: string; role: "ADMIN" | "USER" }
) {
  if (user.role === "ADMIN") return true;

  // FIXED: Access through archives (many-to-many)
  const serahTerima = await prisma.serahTerima.findUnique({
    where: { id },
    include: {
      archives: {
        include: {
          archive: {
            select: { userId: true },
          },
        },
      },
    },
  });

  // Check if any of the archives belong to the user
  return serahTerima?.archives.some(
    (stArchive) => stArchive.archive?.userId === user.userId
  );
}

// GET - Get serah terima by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, error } = requireAuth(request);
    if (error) return error;

    const { id } = await params;

    if (!(await canAccessSerahTerima(id, user))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // FIXED: Use archives instead of archive
    const serahTerima = await prisma.serahTerima.findUnique({
      where: { id },
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
                tahun: true,
                lokasiSimpan: true,
                jenisNaskahDinas: true,
                kondisi: true,
              },
            },
          },
        },
      },
    });

    if (!serahTerima) {
      return NextResponse.json(
        {
          success: false,
          error: "Serah terima not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: serahTerima,
    });
  } catch (error) {
    console.error("Error fetching serah terima:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch serah terima",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// PUT - Update serah terima by ID
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, error } = requireAuth(request);
    if (error) return error;

    const { id } = await params;

    if (!(await canAccessSerahTerima(id, user))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await request.json();

    // Check if serah terima exists
    const existingSerahTerima = await prisma.serahTerima.findUnique({
      where: { id },
    });

    if (!existingSerahTerima) {
      return NextResponse.json(
        {
          success: false,
          error: "Serah terima not found",
        },
        { status: 404 }
      );
    }

    // Check if nomorBeritaAcara is unique (if being updated)
    if (
      data.nomorBeritaAcara &&
      data.nomorBeritaAcara !== existingSerahTerima.nomorBeritaAcara
    ) {
      const existingNomorBeritaAcara = await prisma.serahTerima.findFirst({
        where: { nomorBeritaAcara: data.nomorBeritaAcara },
      });

      if (existingNomorBeritaAcara) {
        return NextResponse.json(
          {
            success: false,
            error: "Nomor berita acara sudah digunakan",
          },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};

    if (data.nomorBeritaAcara)
      updateData.nomorBeritaAcara = data.nomorBeritaAcara;
    if (data.pihakPenyerah) updateData.pihakPenyerah = data.pihakPenyerah;
    if (data.pihakPenerima) updateData.pihakPenerima = data.pihakPenerima;
    if (data.tanggalSerahTerima)
      updateData.tanggalSerahTerima = new Date(data.tanggalSerahTerima);
    if (data.keterangan !== undefined)
      updateData.keterangan = data.keterangan || null;
    if (data.nomorBerkas) updateData.nomorBerkas = data.nomorBerkas;

    const updatedSerahTerima = await prisma.serahTerima.update({
      where: { id },
      data: updateData,
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
      data: updatedSerahTerima,
      message: "Serah terima updated successfully",
    });
  } catch (error) {
    console.error("Error updating serah terima:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update serah terima",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete serah terima by ID
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, error } = requireAuth(request);
    if (error) return error;

    const { id } = await params;

    if (!(await canAccessSerahTerima(id, user))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if serah terima exists
    const existingSerahTerima = await prisma.serahTerima.findUnique({
      where: { id },
    });

    if (!existingSerahTerima) {
      return NextResponse.json(
        {
          success: false,
          error: "Serah terima not found",
        },
        { status: 404 }
      );
    }

    await prisma.serahTerima.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Serah terima deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting serah terima:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete serah terima",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
