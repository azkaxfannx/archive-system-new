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

  // Filter kalau USER
  const baseWhere: Prisma.SerahTerimaWhereInput =
    role === "ADMIN" ? {} : { archive: { userId } };

  const totalCount = await prisma.serahTerima.count({
    where: baseWhere,
  });

  // Count this month
  const thisMonthStart = new Date(currentYear, currentMonth, 1);
  const thisMonthCount = await prisma.serahTerima.count({
    where: {
      ...baseWhere,
      tanggalSerahTerima: { gte: thisMonthStart },
    },
  });

  // Count this year
  const thisYearStart = new Date(currentYear, 0, 1);
  const thisYearCount = await prisma.serahTerima.count({
    where: {
      ...baseWhere,
      tanggalSerahTerima: { gte: thisYearStart },
    },
  });

  // Count pending (archives that can be handed over: not borrowed, not handed over yet)
  const pendingCount = await prisma.archive.count({
    where: {
      ...(role === "ADMIN" ? {} : { userId }),
      serahTerima: null, // Belum diserahterimakan
      peminjaman: {
        none: {
          tanggalPengembalian: null, // Tidak sedang dipinjam
        },
      },
    },
  });

  return NextResponse.json({
    totalCount,
    thisMonthCount,
    thisYearCount,
    pendingCount,
  });
}
