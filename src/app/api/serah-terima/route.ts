// app/api/serah-terima/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/utils/withAuth";

// GET - Get all serah terima
export async function GET(request: NextRequest) {
  try {
    console.log("=== SERAH TERIMA API DEBUG ===");
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

    const { searchParams } = new URL(request.url);
    const archiveId = searchParams.get("archiveId");
    const pihakPenyerah = searchParams.get("pihakPenyerah");
    const pihakPenerima = searchParams.get("pihakPenerima");

    // Build where condition
    const where: any =
      user.role === "ADMIN" ? {} : { archive: { userId: user.userId } };
    if (archiveId) where.archiveId = archiveId;
    if (pihakPenyerah) {
      where.pihakPenyerah = {
        contains: pihakPenyerah,
        mode: "insensitive",
      };
    }
    if (pihakPenerima) {
      where.pihakPenerima = {
        contains: pihakPenerima,
        mode: "insensitive",
      };
    }

    const serahTerima = await prisma.serahTerima.findMany({
      where,
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
      orderBy: {
        tanggalSerahTerima: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: serahTerima,
      total: serahTerima.length,
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

// POST - Create new serah terima
export async function POST(request: NextRequest) {
  try {
    console.log("=== CREATE SERAH TERIMA DEBUG ===");
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

    const data = await request.json();
    console.log("Request data:", data);

    // Check user permissions for non-admin users
    if (user.role !== "ADMIN") {
      const archive = await prisma.archive.findFirst({
        where: { id: data.archiveId, userId: user.userId },
        select: { id: true },
      });
      if (!archive) {
        return NextResponse.json(
          { error: "Tidak boleh menyerahterimakan arsip yang bukan milikmu" },
          { status: 403 }
        );
      }
    }

    // Validate required fields
    const requiredFields = [
      "archiveId",
      "nomorBeritaAcara",
      "pihakPenyerah",
      "pihakPenerima",
      "tanggalSerahTerima",
    ];
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          {
            success: false,
            error: `Field ${field} is required`,
          },
          { status: 400 }
        );
      }
    }

    // Check if archive exists
    const archive = await prisma.archive.findUnique({
      where: { id: data.archiveId },
      include: {
        peminjaman: {
          where: {
            tanggalPengembalian: null, // Peminjaman yang masih aktif
          },
        },
        serahTerima: true,
      },
    });

    if (!archive) {
      return NextResponse.json(
        {
          success: false,
          error: "Archive not found",
        },
        { status: 404 }
      );
    }

    // Check if archive already has serah terima
    if (archive.serahTerima) {
      return NextResponse.json(
        {
          success: false,
          error: "Arsip ini sudah diserahterimakan",
        },
        { status: 400 }
      );
    }

    // Check if archive is currently being borrowed
    if (archive.peminjaman && archive.peminjaman.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Arsip ini masih dalam peminjaman dan belum dikembalikan. Tidak dapat diserahterimakan.",
        },
        { status: 400 }
      );
    }

    // Check if nomorBeritaAcara is unique
    const existingBeritaAcara = await prisma.serahTerima.findUnique({
      where: { nomorBeritaAcara: data.nomorBeritaAcara },
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

    const serahTerima = await prisma.serahTerima.create({
      data: {
        archiveId: data.archiveId,
        nomorBeritaAcara: data.nomorBeritaAcara,
        pihakPenyerah: data.pihakPenyerah,
        pihakPenerima: data.pihakPenerima,
        tanggalSerahTerima: new Date(data.tanggalSerahTerima),
        keterangan: data.keterangan || null,
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

    return NextResponse.json(
      {
        success: true,
        data: serahTerima,
        message: "Serah terima created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating serah terima:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create serah terima",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
