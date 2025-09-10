import React, { useState } from "react";
import {
  FileText,
  Package,
  BarChart3,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Database,
  Archive,
  Filter,
  X,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Cell,
  Pie,
  AreaChart,
  Area,
  Legend,
  BarProps,
} from "recharts";

interface BoxStats {
  kategori: string;
  totalBox: number;
  totalArchives: number;
}

interface StatsCardsProps {
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  disposeCount: number;
  totalBoxCount?: number;
  boxStatsByCategory?: BoxStats[];
  // New filter props
  onColumnFilter: (column: string, value: string) => void;
  columnFilters: Record<string, string>;
  jenisNaskahDinasData: { jenis: string; total: number }[];
}

export default function ArchiveStatsCards({
  totalCount,
  activeCount,
  inactiveCount,
  disposeCount,
  totalBoxCount = 0,
  boxStatsByCategory = [],
  onColumnFilter,
  columnFilters,
  jenisNaskahDinasData,
}: StatsCardsProps) {
  const [isTableExpanded, setIsTableExpanded] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Data untuk charts
  const archiveStatusData = [
    {
      name: "Aktif",
      value: activeCount,
      color: "#10B981",
      filterValue: "ACTIVE",
    },
    {
      name: "Inaktif",
      value: inactiveCount,
      color: "#F59E0B",
      filterValue: "INACTIVE",
    },
    {
      name: "Siap Musnah",
      value: disposeCount,
      color: "#EF4444",
      filterValue: "DISPOSE_ELIGIBLE",
    },
  ];

  const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

  const categoryData = boxStatsByCategory.map((item) => ({
    kategori: item.kategori,
    totalBox: item.totalBox,
    totalArchives: item.totalArchives,
    efficiency: ((item.totalArchives / item.totalBox) * 100).toFixed(1),
  }));

  // Calculate additional statistics
  const averageArchivesPerBox =
    totalBoxCount > 0 ? (totalCount / totalBoxCount).toFixed(1) : "0";
  const totalCategories = boxStatsByCategory.length;
  const mostEfficientCategory = categoryData.reduce(
    (prev, current) =>
      parseFloat(prev.efficiency) > parseFloat(current.efficiency)
        ? prev
        : current,
    categoryData[0] || { kategori: "-", efficiency: "0" }
  );

  const stats = [
    {
      name: "Total Arsip",
      value: totalCount,
      icon: FileText,
      bgColor: "bg-blue-100",
      textColor: "text-blue-600",
    },
    {
      name: "Total Box",
      value: totalBoxCount,
      icon: Package,
      bgColor: "bg-purple-100",
      textColor: "text-purple-600",
    },
    {
      name: "Total Kategori",
      value: totalCategories,
      icon: Archive,
      bgColor: "bg-indigo-100",
      textColor: "text-indigo-600",
    },
    {
      name: "Rata-rata Arsip/Box",
      value: averageArchivesPerBox,
      icon: Database,
      bgColor: "bg-green-100",
      textColor: "text-green-600",
      isDecimal: true,
    },
  ];

  // Handle status filter from pie chart
  const handleStatusFilter = (status: string) => {
    const currentStatus = columnFilters.status;
    // Toggle filter: if same status is clicked, remove filter; otherwise set new filter
    const newStatus = currentStatus === status ? "" : status;
    onColumnFilter?.("status", newStatus);
  };

  // Handle category filter from charts
  const handleCategoryFilter = (kategori: string) => {
    if (!kategori) {
      onColumnFilter("lokasiSimpan", "");
    } else {
      onColumnFilter("lokasiSimpan", kategori + ".");
    }
  };

  const handleBarClick: BarProps["onClick"] = (data) => {
    const kategori = data?.payload?.kategori as string | undefined;
    if (!kategori) return;

    const currentFilter = columnFilters.lokasiSimpan;
    // toggle: kalau sudah difilter kategori ini, kosongkan filter
    if (currentFilter === kategori + ".") {
      onColumnFilter("lokasiSimpan", "");
    } else {
      onColumnFilter("lokasiSimpan", kategori + ".");
    }
  };

  // Check if any filters are active
  const activeFiltersCount = Object.values(columnFilters || {}).filter(
    (v) => v !== ""
  ).length;

  // Clear all chart-based filters
  const clearChartFilters = () => {
    onColumnFilter("status", "");
    onColumnFilter("jenisNaskahDinas", "");
  };

  return (
    <div className="space-y-6 mb-6">
      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow border border-gray-100"
            >
              <div className="flex items-center">
                <div className={`p-3 ${stat.bgColor} rounded-lg`}>
                  <Icon className={stat.textColor} size={24} />
                </div>
                <div className="ml-4">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {stat.isDecimal
                      ? stat.value
                      : typeof stat.value === "number"
                      ? stat.value.toLocaleString()
                      : stat.value}
                  </h3>
                  <p className="text-sm text-gray-600">{stat.name}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {/* Interactive Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Interactive Pie Chart - Status Distribution */}
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <BarChart3 className="text-blue-600 mr-3" size={20} />
              <h3 className="text-lg font-semibold text-gray-900">
                Distribusi Jenis Naskah Dinas
              </h3>
            </div>
            <span className="ml-auto text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              Klik untuk filter
            </span>
          </div>

          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={jenisNaskahDinasData.map((j, i) => ({
                  name: j.jenis,
                  value: j.total,
                  color: COLORS[i % COLORS.length],
                  filterValue: j.jenis,
                }))}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                onClick={(data) => {
                  const clickedJenis = data.name;
                  const currentFilter = columnFilters.jenisNaskahDinas;
                  onColumnFilter(
                    "jenisNaskahDinas",
                    currentFilter === clickedJenis ? "" : clickedJenis
                  );
                }}
                style={{ cursor: "pointer" }}
              >
                {jenisNaskahDinasData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    stroke={
                      columnFilters.jenisNaskahDinas === _.jenis
                        ? "#000"
                        : "none"
                    }
                    strokeWidth={
                      columnFilters.jenisNaskahDinas === _.jenis ? 3 : 0
                    }
                    style={{ cursor: "pointer" }}
                  />
                ))}
              </Pie>

              <Tooltip
                formatter={(value, name) => [value.toLocaleString(), name]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Stats Visual with Interactive Elements */}
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
          <div className="flex items-center mb-4">
            <TrendingUp className="text-green-600 mr-3" size={20} />
            <h3 className="text-lg font-semibold text-gray-900">
              Summary Status Arsip
            </h3>
            <span className="ml-auto text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              Klik untuk filter
            </span>
          </div>
          <div className="space-y-4">
            {archiveStatusData.map((item) => (
              <div
                key={item.name}
                onClick={() => handleStatusFilter(item.filterValue)}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                  columnFilters.status === item.filterValue
                    ? "bg-blue-50 ring-2 ring-blue-200"
                    : "bg-gray-50 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center">
                  <div
                    className="w-4 h-4 rounded-full mr-3"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="font-medium text-gray-700">{item.name}</span>
                  {columnFilters.status === item.filterValue && (
                    <span className="ml-2 text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">
                      Dipilih
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className="text-2xl font-bold"
                    style={{ color: item.color }}
                  >
                    {item.value.toLocaleString()}
                  </span>
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        backgroundColor: item.color,
                        width: `${(item.value / totalCount) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Box Stats Charts - Interactive */}
      {boxStatsByCategory.length > 0 && (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Interactive Bar Chart - Box per Kategori */}
            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Package className="text-purple-600 mr-3" size={20} />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Box per Kategori
                  </h3>
                </div>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  Klik untuk filter
                </span>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="kategori"
                    tick={{ fontSize: 12, cursor: "pointer" }}
                    stroke="#6b7280"
                  />
                  <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                  <Tooltip
                    formatter={(value, name) => [
                      value,
                      name === "totalBox" ? "Total Box" : "Total Arsip",
                    ]}
                  />
                  <Bar
                    dataKey="totalBox"
                    fill="#8B5CF6"
                    name="Total Box"
                    radius={[4, 4, 0, 0]}
                    onClick={handleBarClick}
                    style={{ cursor: "pointer" }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Interactive Area Chart - Arsip per Kategori */}
            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <FileText className="text-indigo-600 mr-3" size={20} />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Arsip per Kategori
                  </h3>
                </div>
                {/* <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  Klik untuk filter
                </span> */}
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={categoryData}>
                  <defs>
                    <linearGradient
                      id="colorArchives"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8} />
                      <stop
                        offset="95%"
                        stopColor="#6366F1"
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="kategori"
                    tick={{ fontSize: 12, cursor: "pointer" }}
                    stroke="#6b7280"
                  />
                  <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                  <Tooltip formatter={(value) => [value, "Total Arsip"]} />
                  <Area
                    type="monotone"
                    dataKey="totalArchives"
                    stroke="#6366F1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorArchives)"
                    onClick={(data: any) =>
                      handleCategoryFilter(`Kategori ${data.kategori}`)
                    }
                    style={{ cursor: "pointer" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Enhanced Collapsible Box Stats Table */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-100">
            <div
              className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setIsTableExpanded(!isTableExpanded)}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Package className="mr-2 text-purple-600" size={20} />
                  Detail Box per Kategori
                  <span className="ml-2 text-sm text-gray-500 font-normal">
                    ({totalCategories} kategori)
                  </span>
                </h3>
                <div className="flex items-center space-x-2">
                  {mostEfficientCategory.kategori !== "-" && (
                    <span className="text-sm text-gray-600">
                      Terefisien: Kategori {mostEfficientCategory.kategori} (
                      {mostEfficientCategory.efficiency}%)
                    </span>
                  )}
                  {isTableExpanded ? (
                    <ChevronUp className="text-gray-500" size={20} />
                  ) : (
                    <ChevronDown className="text-gray-500" size={20} />
                  )}
                </div>
              </div>
            </div>

            {isTableExpanded && (
              <div className="px-6 pb-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">
                          Kategori
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">
                          Total Box
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">
                          Total Arsip
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">
                          Efisiensi
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoryData.map((boxStat, index) => {
                        const isFiltered =
                          columnFilters.lokasiSimpan === boxStat.kategori + ".";
                        return (
                          <tr
                            key={boxStat.kategori}
                            className={`${
                              index % 2 === 0 ? "bg-white" : "bg-gray-50"
                            } ${
                              isFiltered
                                ? "ring-2 ring-blue-200 bg-blue-50"
                                : ""
                            }`}
                          >
                            <td className="py-3 px-4 font-medium text-gray-900">
                              Kategori {boxStat.kategori}
                              {isFiltered && (
                                <span className="ml-2 text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">
                                  Dipilih
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                {boxStat.totalBox}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                {boxStat.totalArchives}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  parseFloat(boxStat.efficiency) > 80
                                    ? "bg-green-100 text-green-800"
                                    : parseFloat(boxStat.efficiency) > 50
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {boxStat.efficiency}%
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCategoryFilter(
                                    isFiltered ? "" : boxStat.kategori // kalau sudah filter → hapus
                                  );
                                }}
                                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                  isFiltered
                                    ? "bg-red-100 text-red-700 hover:bg-red-200"
                                    : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                }`}
                              >
                                {isFiltered ? "Hapus Filter" : "Filter"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
