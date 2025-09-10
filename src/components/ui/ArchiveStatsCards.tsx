import {
  FileText,
  Package,
  BarChart3,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Database,
  Archive,
} from "lucide-react";
import { useState } from "react";
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
}

export default function ArchiveStatsCards({
  totalCount,
  activeCount,
  inactiveCount,
  disposeCount,
  totalBoxCount = 0,
  boxStatsByCategory = [],
}: StatsCardsProps) {
  const [isTableExpanded, setIsTableExpanded] = useState(false);

  // Data untuk charts
  const archiveStatusData = [
    { name: "Aktif", value: activeCount, color: "#10B981" },
    { name: "Inaktif", value: inactiveCount, color: "#F59E0B" },
    { name: "Siap Musnah", value: disposeCount, color: "#EF4444" },
  ];

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

  return (
    <div className="space-y-6 mb-6">
      {/* Updated Main Stats Cards */}
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

      {/* Charts Visualization */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Pie Chart - Status Distribution */}
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
          <div className="flex items-center mb-4">
            <BarChart3 className="text-blue-600 mr-3" size={20} />
            <h3 className="text-lg font-semibold text-gray-900">
              Distribusi Status Arsip
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={archiveStatusData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
              >
                {archiveStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [value.toLocaleString(), name]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Stats Visual */}
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
          <div className="flex items-center mb-4">
            <TrendingUp className="text-green-600 mr-3" size={20} />
            <h3 className="text-lg font-semibold text-gray-900">
              Summary Status Arsip
            </h3>
          </div>
          <div className="space-y-4">
            {archiveStatusData.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center">
                  <div
                    className="w-4 h-4 rounded-full mr-3"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="font-medium text-gray-700">{item.name}</span>
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

      {/* Box Stats Charts */}
      {boxStatsByCategory.length > 0 && (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Bar Chart - Box per Kategori */}
            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
              <div className="flex items-center mb-4">
                <Package className="text-purple-600 mr-3" size={20} />
                <h3 className="text-lg font-semibold text-gray-900">
                  Box per Kategori
                </h3>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="kategori"
                    tick={{ fontSize: 12 }}
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
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Area Chart - Arsip per Kategori */}
            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
              <div className="flex items-center mb-4">
                <FileText className="text-indigo-600 mr-3" size={20} />
                <h3 className="text-lg font-semibold text-gray-900">
                  Arsip per Kategori
                </h3>
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
                    tick={{ fontSize: 12 }}
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
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Collapsible Box Stats Table */}
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
                      </tr>
                    </thead>
                    <tbody>
                      {categoryData.map((boxStat, index) => (
                        <tr
                          key={boxStat.kategori}
                          className={
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }
                        >
                          <td className="py-3 px-4 font-medium text-gray-900">
                            Kategori {boxStat.kategori}
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
                        </tr>
                      ))}
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
