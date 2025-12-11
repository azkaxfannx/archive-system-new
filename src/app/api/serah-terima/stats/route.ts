import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, verifyToken } from "@/utils/auth";
import { Prisma } from "@prisma/client";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json(
      { error: "Unauthorized - Please login first" },
      { status: 401 }
    );
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json(
      { error: "Invalid token - Please login again" },
      { status: 401 }
    );
  }

  const userId = payload.userId;
  const role = payload.role;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // PERBAIKAN: Base filter for USER role menggunakan many-to-many
  const baseWhere: Prisma.SerahTerimaWhereInput =
    role === "ADMIN"
      ? {}
      : {
          archives: {
            some: {
              archive: {
                userId: userId,
              },
            },
          },
        };

  // Total count
  const totalCount = await prisma.serahTerima.count({
    where: baseWhere,
  });

  // Count by status
  const pendingCount = await prisma.serahTerima.count({
    where: { ...baseWhere, statusUsulan: "PENDING" },
  });

  const approvedCount = await prisma.serahTerima.count({
    where: { ...baseWhere, statusUsulan: "APPROVED" },
  });

  const rejectedCount = await prisma.serahTerima.count({
    where: { ...baseWhere, statusUsulan: "REJECTED" },
  });

  // Count this month (based on tanggalUsulan)
  const thisMonthStart = new Date(currentYear, currentMonth, 1);
  const thisMonthCount = await prisma.serahTerima.count({
    where: {
      ...baseWhere,
      tanggalUsulan: { gte: thisMonthStart },
    },
  });

  // Count this year (based on tanggalUsulan)
  const thisYearStart = new Date(currentYear, 0, 1);
  const thisYearCount = await prisma.serahTerima.count({
    where: {
      ...baseWhere,
      tanggalUsulan: { gte: thisYearStart },
    },
  });

  return NextResponse.json({
    totalCount,
    pendingCount,
    approvedCount,
    rejectedCount,
    thisMonthCount,
    thisYearCount,
  });
}
