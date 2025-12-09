"use client";

import React from "react";
import { FileCheck, Clock, CheckCircle, XCircle, Calendar, TrendingUp } from "lucide-react";

interface SerahTerimaStatsCardsProps {
  totalCount: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  thisMonthCount: number;
  thisYearCount: number;
}

export default function SerahTerimaStatsCards({
  totalCount,
  pendingCount,
  approvedCount,
  rejectedCount,
  thisMonthCount,
  thisYearCount,
}: SerahTerimaStatsCardsProps) {
  const stats = [
    {
      label: "Total Usulan",
      value: totalCount,
      icon: FileCheck,
      color: "bg-blue-50 text-blue-600",
      bgColor: "bg-blue-500",
    },
    {
      label: "Menunggu Persetujuan",
      value: pendingCount,
      icon: Clock,
      color: "bg-yellow-50 text-yellow-600",
      bgColor: "bg-yellow-500",
    },
    {
      label: "Disetujui",
      value: approvedCount,
      icon: CheckCircle,
      color: "bg-green-50 text-green-600",
      bgColor: "bg-green-500",
    },
    {
      label: "Ditolak",
      value: rejectedCount,
      icon: XCircle,
      color: "bg-red-50 text-red-600",
      bgColor: "bg-red-500",
    },
    {
      label: "Bulan Ini",
      value: thisMonthCount,
      icon: Calendar,
      color: "bg-purple-50 text-purple-600",
      bgColor: "bg-purple-500",
    },
    {
      label: "Tahun Ini",
      value: thisYearCount,
      icon: TrendingUp,
      color: "bg-indigo-50 text-indigo-600",
      bgColor: "bg-indigo-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
            <div className={`p-2 rounded-lg ${stat.color}`}>
              <stat.icon size={20} />
            </div>
          </div>
          <div className={`mt-2 h-1 rounded-full ${stat.bgColor} opacity-20`} />
        </div>
      ))}
    </div>
  );
}