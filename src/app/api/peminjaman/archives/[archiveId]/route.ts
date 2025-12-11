import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/utils/withAuth";

interface RouteParams {
  params: Promise<{
    archiveId: string;
  }>;
}

// GET - Get peminjaman by archive ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, error } = requireAuth(request);
    if (error) return error;

    // Await params to get the actual object
    const { archiveId } = await params;

    if (!archiveId) {
      return NextResponse.json(
        {
          success: false,
          error: "Archive ID is required",
        },
        { status: 400 }
      );
    }

    // Check user permissions
    if (user.role !== "ADMIN") {
      // Check if archive belongs to user
      const archive = await prisma.archive.findFirst({
        where: {
          id: archiveId,
          userId: user.userId,
        },
        select: { id: true },
      });

      if (!archive) {
        return NextResponse.json(
          { error: "Tidak diizinkan mengakses arsip ini" },
          { status: 403 }
        );
      }
    }

    // Get peminjaman for this archive
    const peminjaman = await prisma.peminjaman.findMany({
      where: {
        archiveId: archiveId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        archive: {
          select: {
            id: true,
            judulBerkas: true,
            nomorBerkas: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: peminjaman,
    });
  } catch (error) {
    console.error("Error fetching peminjaman by archive:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch peminjaman",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
