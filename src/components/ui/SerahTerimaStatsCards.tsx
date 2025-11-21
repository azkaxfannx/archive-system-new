// components/ui/SerahTerimaStatsCards.tsx
"use client";

import React from "react";
import { FileCheck, Calendar, TrendingUp, Clock } from "lucide-react";

interface SerahTerimaStatsCardsProps {
  totalCount: number;
  thisMonthCount: number;
  thisYearCount: number;
  pendingCount: number;
}

export default function SerahTerimaStatsCards({
  totalCount,
  thisMonthCount,
  thisYearCount,
  pendingCount,
}: SerahTerimaStatsCardsProps) {
  const stats = [
    {
      label: "Total Serah Terima",
      value: totalCount,
      icon: FileCheck,
      color: "bg-blue-50 text-blue-600",
      bgColor: "bg-blue-500",
    },
    {
      label: "Bulan Ini",
      value: thisMonthCount,
      icon: Calendar,
      color: "bg-green-50 text-green-600",
      bgColor: "bg-green-500",
    },
    {
      label: "Tahun Ini",
      value: thisYearCount,
      icon: TrendingUp,
      color: "bg-purple-50 text-purple-600",
      bgColor: "bg-purple-500",
    },
    {
      label: "Belum Diserahkan",
      value: pendingCount,
      icon: Clock,
      color: "bg-orange-50 text-orange-600",
      bgColor: "bg-orange-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            </div>
            <div className={`p-3 rounded-lg ${stat.color}`}>
              <stat.icon size={24} />
            </div>
          </div>
          <div className={`mt-3 h-1 rounded-full ${stat.bgColor} opacity-20`} />
        </div>
      ))}
    </div>
  );
}
