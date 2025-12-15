// app/api/archives/recalculate-status/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/utils/withAuth";
import { calculateArchiveStatus } from "@/utils/calculateArchiveStatus";

/**
 * POST - Recalculate dan update status semua arsip berdasarkan tanggal dan klasifikasi
 * Endpoint ini hanya bisa diakses oleh ADMIN
 */
export async function POST(req: NextRequest) {
  try {
    const { user, error } = requireAuth(req);
    if (error) return error;

    // Only ADMIN can recalculate status
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - Only ADMIN can recalculate status" },
        { status: 403 }
      );
    }

    // Ambil semua arsip
    const allArchives = await prisma.archive.findMany({
      select: {
        id: true,
        tanggal: true,
        klasifikasi: true,
        status: true, // Current status for comparison
      },
    });

    console.log(`Starting recalculation for ${allArchives.length} archives...`);

    // Recalculate dan update status
    const updatePromises = allArchives.map(async (archive) => {
      const statusCalc = calculateArchiveStatus(
        archive.tanggal,
        archive.klasifikasi
      );
      const newStatus = statusCalc.status;

      // Update hanya jika status berubah
      if (newStatus !== archive.status) {
        return prisma.archive.update({
          where: { id: archive.id },
          data: {
            status: newStatus,
            updatedAt: new Date(),
          },
        });
      }

      return null;
    });

    const results = await Promise.all(updatePromises);
    const updatedCount = results.filter((r) => r !== null).length;
    const unchangedCount = allArchives.length - updatedCount;

    // Hitung distribusi status baru
    const statusCounts = allArchives.reduce(
      (acc, archive) => {
        const statusCalc = calculateArchiveStatus(
          archive.tanggal,
          archive.klasifikasi
        );
        acc[statusCalc.status]++;
        return acc;
      },
      { ACTIVE: 0, INACTIVE: 0, DISPOSE_ELIGIBLE: 0 }
    );

    console.log(
      `Recalculation completed: ${updatedCount} updated, ${unchangedCount} unchanged`
    );

    return NextResponse.json({
      success: true,
      message: "Status recalculation completed",
      stats: {
        total: allArchives.length,
        updated: updatedCount,
        unchanged: unchangedCount,
        distribution: statusCounts,
      },
    });
  } catch (error: any) {
    console.error("Recalculate status error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to recalculate status" },
      { status: 500 }
    );
  }
}

/**
 * GET - Preview status calculation tanpa update database
 * Berguna untuk melihat berapa banyak yang akan berubah
 */
export async function GET(req: NextRequest) {
  try {
    const { user, error } = requireAuth(req);
    if (error) return error;

    // Only ADMIN can preview
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - Only ADMIN can preview status" },
        { status: 403 }
      );
    }

    // Ambil semua arsip
    const allArchives = await prisma.archive.findMany({
      select: {
        id: true,
        tanggal: true,
        klasifikasi: true,
        status: true,
        nomorSurat: true,
      },
    });

    // Calculate status dan bandingkan dengan database
    const changes: Array<{
      id: string;
      nomorSurat: string | null;
      currentStatus: string;
      calculatedStatus: string;
      yearsFromDate: number;
      retensiInfo: string;
    }> = [];

    let activeCount = 0;
    let inactiveCount = 0;
    let disposeCount = 0;

    allArchives.forEach((archive) => {
      const statusCalc = calculateArchiveStatus(
        archive.tanggal,
        archive.klasifikasi
      );

      // Count distribution
      if (statusCalc.status === "ACTIVE") activeCount++;
      else if (statusCalc.status === "INACTIVE") inactiveCount++;
      else if (statusCalc.status === "DISPOSE_ELIGIBLE") disposeCount++;

      // Track changes
      if (statusCalc.status !== archive.status) {
        changes.push({
          id: archive.id,
          nomorSurat: archive.nomorSurat,
          currentStatus: archive.status,
          calculatedStatus: statusCalc.status,
          yearsFromDate: statusCalc.yearsFromDate,
          retensiInfo: `${statusCalc.retensiAktifYears} + ${statusCalc.retensiInaktifYears} tahun`,
        });
      }
    });

    return NextResponse.json({
      preview: true,
      stats: {
        total: allArchives.length,
        willChange: changes.length,
        willStaySame: allArchives.length - changes.length,
        newDistribution: {
          active: activeCount,
          inactive: inactiveCount,
          disposeEligible: disposeCount,
        },
      },
      changes: changes.slice(0, 100), // Limit to first 100 for preview
      note:
        changes.length > 100
          ? `Showing first 100 of ${changes.length} changes`
          : null,
    });
  } catch (error: any) {
    console.error("Preview status error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to preview status" },
      { status: 500 }
    );
  }
}
