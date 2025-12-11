// app/api/serah-terima/[id]/process/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/utils/withAuth";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// POST /api/serah-terima/[id]/process - Process usulan with partial approve/reject
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    console.log("=== DEBUG PROCESS API ===");

    const { user, error } = requireAuth(request);
    if (error) return error;

    // Only ADMIN can process
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Only admin can process usulan" },
        { status: 403 }
      );
    }

    const { id } = await params;
    console.log("Process ID:", id);

    const data = await request.json();
    console.log("Request data:", data);

    const {
      approvedArchiveIds = [],
      rejectedArchiveIds = [],
      nomorBeritaAcara,
      tanggalSerahTerima,
      keterangan,
      alasanPenolakan,
    } = data;

    // Validate: must have at least one action
    if (approvedArchiveIds.length === 0 && rejectedArchiveIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Minimal harus ada arsip yang disetujui atau ditolak",
        },
        { status: 400 }
      );
    }

    // Validate required fields based on actions
    if (approvedArchiveIds.length > 0) {
      if (!nomorBeritaAcara || !tanggalSerahTerima) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Nomor berita acara dan tanggal serah terima wajib diisi untuk arsip yang disetujui",
          },
          { status: 400 }
        );
      }
    }

    if (rejectedArchiveIds.length > 0) {
      if (!alasanPenolakan) {
        return NextResponse.json(
          {
            success: false,
            error: "Alasan penolakan wajib diisi untuk arsip yang ditolak",
          },
          { status: 400 }
        );
      }
    }

    // Check if usulan exists
    const usulan = await prisma.serahTerima.findUnique({
      where: { id },
      include: {
        archives: true,
      },
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

    // Validate that archive IDs belong to this usulan
    const usulanArchiveIds = usulan.archives.map((a) => a.archiveId);
    const allRequestedIds = [...approvedArchiveIds, ...rejectedArchiveIds];
    const invalidIds = allRequestedIds.filter(
      (id) => !usulanArchiveIds.includes(id)
    );

    if (invalidIds.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Beberapa arsip tidak termasuk dalam usulan ini",
        },
        { status: 400 }
      );
    }

    // Check if nomorBeritaAcara is unique (if provided)
    if (approvedArchiveIds.length > 0) {
      const existingBeritaAcara = await prisma.serahTerima.findFirst({
        where: {
          nomorBeritaAcara: nomorBeritaAcara,
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
    }

    // Use transaction for data consistency
    const result = await prisma.$transaction(async (tx) => {
      let approvedSerahTerima = null;
      let rejectedSerahTerima = null;

      // CASE 1: All approved
      if (approvedArchiveIds.length === usulan.archives.length) {
        approvedSerahTerima = await tx.serahTerima.update({
          where: { id },
          data: {
            statusUsulan: "APPROVED",
            nomorBeritaAcara,
            tanggalSerahTerima: new Date(tanggalSerahTerima),
            keterangan: keterangan || null,
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
      }
      // CASE 2: All rejected
      else if (rejectedArchiveIds.length === usulan.archives.length) {
        rejectedSerahTerima = await tx.serahTerima.update({
          where: { id },
          data: {
            statusUsulan: "REJECTED",
            alasanPenolakan,
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
      }
      // CASE 3: Partial - split into two serah terima records
      else {
        // Create new approved serah terima
        if (approvedArchiveIds.length > 0) {
          approvedSerahTerima = await tx.serahTerima.create({
            data: {
              pihakPenyerah: usulan.pihakPenyerah,
              pihakPenerima: usulan.pihakPenerima,
              nomorBerkas: usulan.nomorBerkas,
              tanggalUsulan: usulan.tanggalUsulan,
              statusUsulan: "APPROVED",
              nomorBeritaAcara,
              tanggalSerahTerima: new Date(tanggalSerahTerima),
              keterangan: keterangan || null,
              archives: {
                create: approvedArchiveIds.map((archiveId: string) => ({
                  archiveId,
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
        }

        // Update original to rejected with remaining archives
        if (rejectedArchiveIds.length > 0) {
          // Remove approved archives from original usulan
          await tx.serahTerimaArchive.deleteMany({
            where: {
              serahTerimaId: id,
              archiveId: {
                in: approvedArchiveIds,
              },
            },
          });

          // Update status to rejected
          rejectedSerahTerima = await tx.serahTerima.update({
            where: { id },
            data: {
              statusUsulan: "REJECTED",
              alasanPenolakan,
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
        }
      }

      return { approvedSerahTerima, rejectedSerahTerima };
    });

    console.log("Process result:", result);

    return NextResponse.json({
      success: true,
      data: result,
      message: `Usulan berhasil diproses: ${approvedArchiveIds.length} arsip disetujui, ${rejectedArchiveIds.length} arsip ditolak`,
    });
  } catch (error) {
    console.error("Error processing usulan:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process usulan",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
