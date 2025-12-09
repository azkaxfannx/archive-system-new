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
  Minus,
  Plus,
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

  // Helper function untuk convert HSL ke HEX
  const hslToHex = (h: number, s: number, l: number): string => {
    l /= 100;
    const a = (s * Math.min(l, 1 - l)) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color)
        .toString(16)
        .padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  // Generate warna unik menggunakan Golden Ratio
  const generateDistinctColors = (count: number): string[] => {
    const colors: string[] = [];
    const goldenRatio = 0.618033988749895;
    // let hue = Math.random(); // Start dengan hue random
    let hue = 0.5; // Start dengan hue random
    
    for (let i = 0; i < count; i++) {
      hue += goldenRatio;
      hue %= 1;
      
      // Saturation 65-80%, Lightness 45-60% untuk warna yang vibrant tapi nyaman dilihat
      const saturation = 0.65 + (Math.random() * 0.15);
      const lightness = 0.45 + (Math.random() * 0.15);
      
      const h = hue * 360;
      const s = saturation * 100;
      const l = lightness * 100;
      
      colors.push(hslToHex(h, s, l));
    }
    
    return colors;
  };

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
  // State untuk mengontrol chart mana yang dibuka
  const [expandedCharts, setExpandedCharts] = useState({
    jenisNaskahDinas: true,
    statusArsip: true,
    boxPerKategori: true,
    arsipPerKategori: true,
  });

  // Fungsi untuk toggle chart
  const toggleChart = (chartName: keyof typeof expandedCharts) => {
    setExpandedCharts((prev) => ({
      ...prev,
      [chartName]: !prev[chartName],
    }));
  };

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

  // const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

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
    const newStatus = currentStatus === status ? "" : status;
    onColumnFilter?.("status", newStatus);
  };

  // Handle category filter from charts - UBAH INI
  const handleCategoryFilter = (kategori: string) => {
    if (!kategori) {
      onColumnFilter("nomorBerkas", ""); // Ubah dari kodeUnit ke nomorBerkas
    } else {
      onColumnFilter("nomorBerkas", kategori + "."); // Filter berdasarkan prefix nomorBerkas
    }
  };

  const handleBarClick: BarProps["onClick"] = (data) => {
    const kategori = data?.payload?.kategori as string | undefined;
    if (!kategori) return;

    const currentFilter = columnFilters.nomorBerkas; // Ubah ke nomorBerkas
    // toggle: kalau sudah difilter kategori ini, kosongkan filter
    if (currentFilter?.startsWith(kategori + ".")) {
      onColumnFilter("nomorBerkas", "");
    } else {
      onColumnFilter("nomorBerkas", kategori + ".");
    }
  };

  // Fungsi untuk menentukan layout grid yang benar-benar fleksibel
  const getFlexibleGridClass = () => {
    const openCharts = Object.entries(expandedCharts)
      .filter(([_, isOpen]) => isOpen)
      .map(([key]) => key);

    if (openCharts.length === 0) return "";

    // Untuk 1 chart, gunakan layout yang memanfaatkan ruang penuh
    if (openCharts.length === 1) {
      return "grid-cols-1";
    }

    // Untuk 2 chart, selalu 2 kolom
    if (openCharts.length === 2) {
      return "grid-cols-1 lg:grid-cols-2";
    }

    // Untuk 3 chart: 2 di atas (sejajar), 1 di bawah (full width)
    if (openCharts.length === 3) {
      return "grid-cols-1 lg:grid-cols-2";
    }

    // Untuk 4 chart, 2x2 grid
    return "grid-cols-1 lg:grid-cols-2";
  };

  // Fungsi untuk menentukan row span berdasarkan chart dan jumlah chart terbuka
  const getChartRowSpan = (chartKey: string) => {
    const openCharts = Object.entries(expandedCharts)
      .filter(([_, isOpen]) => isOpen)
      .map(([key]) => key);

    if (openCharts.length !== 3) return "";

    // Untuk 3 chart, chart ketiga (berdasarkan urutan state) akan full width
    const thirdChart = openCharts[2]; // Chart ketiga yang dibuka
    return chartKey === thirdChart ? "lg:col-span-2" : "";
  };

  // Fungsi untuk menentukan tinggi chart yang benar-benar adaptif
  const getAdaptiveChartHeight = (chartKey?: string) => {
    const openChartsCount =
      Object.values(expandedCharts).filter(Boolean).length;

    // Untuk pie chart, tinggi khusus agar proporsional
    if (chartKey === "jenisNaskahDinas") {
      switch (openChartsCount) {
        case 1:
          return 500; // Sangat besar untuk 1 chart
        case 2:
          return 400; // Besar untuk 2 chart
        case 3:
          // Jika pie chart adalah yang full width di 3 chart
          const openCharts = Object.entries(expandedCharts)
            .filter(([_, isOpen]) => isOpen)
            .map(([key]) => key);
          const isFullWidth = openCharts[2] === "jenisNaskahDinas";
          return isFullWidth ? 400 : 300;
        case 4:
          return 250; // Normal untuk 4 chart
        default:
          return 300;
      }
    }

    // Untuk chart lainnya
    switch (openChartsCount) {
      case 1:
        return 500;
      case 2:
        return 400;
      case 3:
        const openCharts = Object.entries(expandedCharts)
          .filter(([_, isOpen]) => isOpen)
          .map(([key]) => key);
        const isFullWidth = openCharts[2] === chartKey;
        return isFullWidth ? 400 : 300;
      case 4:
        return 250;
      default:
        return 300;
    }
  };

  // Fungsi untuk menentukan outer radius pie chart yang proporsional
  const getPieChartRadius = () => {
    const openChartsCount =
      Object.values(expandedCharts).filter(Boolean).length;

    switch (openChartsCount) {
      case 1:
        return 180; // Sangat besar untuk 1 chart
      case 2:
        return 120; // Besar untuk 2 chart
      case 3:
        const openCharts = Object.entries(expandedCharts)
          .filter(([_, isOpen]) => isOpen)
          .map(([key]) => key);
        const isFullWidth = openCharts[2] === "jenisNaskahDinas";
        return isFullWidth ? 140 : 100;
      case 4:
        return 80; // Normal untuk 4 chart
      default:
        return 100;
    }
  };

  // Dapatkan chart yang sedang terbuka
  const openCharts = Object.entries(expandedCharts)
    .filter(([_, isOpen]) => isOpen)
    .map(([key]) => key);

  // Generate warna unik berdasarkan jumlah data
  const uniqueColors = React.useMemo(
    () => generateDistinctColors(jenisNaskahDinasData.length),
    [jenisNaskahDinasData.length]
  );

  return (
    <div className="space-y-6 mb-6">
      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100"
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

      {/* Kontrol Chart */}
      <div className="flex flex-wrap justify-center gap-2">
        {Object.entries(expandedCharts).map(([key, isExpanded]) => (
          <button
            key={key}
            onClick={() => toggleChart(key as keyof typeof expandedCharts)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
              isExpanded
                ? "bg-blue-100 text-blue-700 hover:bg-blue-200 shadow-md border border-blue-200"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
            }`}
          >
            {key === "jenisNaskahDinas" && "Jenis Naskah"}
            {key === "statusArsip" && "Status Arsip"}
            {key === "boxPerKategori" && "Box per Kategori"}
            {key === "arsipPerKategori" && "Arsip per Kategori"}
            {isExpanded ? " ✓" : " +"}
          </button>
        ))}
      </div>

      {/* Container Charts dengan layout yang benar-benar fleksibel */}
      <div
        className={`grid ${getFlexibleGridClass()} gap-6 transition-all duration-500`}
      >
        {/* Chart 1: Jenis Naskah Dinas */}
        {expandedCharts.jenisNaskahDinas && (
          <div
            className={`bg-white rounded-lg shadow-lg border border-gray-100 transition-all duration-500 hover:shadow-xl ${getChartRowSpan(
              "jenisNaskahDinas"
            )}`}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <BarChart3 className="text-blue-600 mr-3" size={20} />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Distribusi Jenis Naskah Dinas
                  </h3>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    Klik untuk filter
                  </span>
                  <button
                    onClick={() => toggleChart("jenisNaskahDinas")}
                    className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-100 transition-colors"
                  >
                    <Minus size={16} />
                  </button>
                </div>
              </div>

              <ResponsiveContainer
                width="100%"
                height={getAdaptiveChartHeight("jenisNaskahDinas")}
                className="transition-all duration-300"
              >
                <PieChart>
                  <Pie
                    data={jenisNaskahDinasData.map((j, i) => ({
                      name: j.jenis,
                      value: j.total,
                      color: uniqueColors[i],  // ← UBAH INI
                      filterValue: j.jenis,
                    }))}
                    cx="50%"
                    cy="50%"
                    outerRadius={getPieChartRadius()}
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
                    label={false}
                  >
                    {jenisNaskahDinasData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={uniqueColors[index]}  // ← UBAH INI
                        stroke={
                          columnFilters.jenisNaskahDinas === entry.jenis
                            ? "#000"
                            : "none"
                        }
                        strokeWidth={
                          columnFilters.jenisNaskahDinas === entry.jenis ? 3 : 0
                        }
                        style={{ cursor: "pointer" }}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [value.toLocaleString(), name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Chart 2: Status Arsip */}
        {expandedCharts.statusArsip && (
          <div
            className={`bg-white rounded-lg shadow-lg border border-gray-100 transition-all duration-500 hover:shadow-xl ${getChartRowSpan(
              "statusArsip"
            )}`}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <TrendingUp className="text-green-600 mr-3" size={20} />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Summary Status Arsip
                  </h3>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    Klik untuk filter
                  </span>
                  <button
                    onClick={() => toggleChart("statusArsip")}
                    className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-100 transition-colors"
                  >
                    <Minus size={16} />
                  </button>
                </div>
              </div>

              <div
                className="space-y-4 transition-all duration-300"
                style={{
                  minHeight: `${getAdaptiveChartHeight("statusArsip") - 80}px`,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent:
                    openCharts.length === 1 ? "center" : "flex-start",
                }}
              >
                {archiveStatusData.map((item) => (
                  <div
                    key={item.name}
                    onClick={() => handleStatusFilter(item.filterValue)}
                    className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-all duration-300 ${
                      columnFilters.status === item.filterValue
                        ? "bg-blue-50 ring-2 ring-blue-200 transform scale-[1.02] shadow-md"
                        : "bg-gray-50 hover:bg-gray-100 hover:scale-[1.01] shadow-sm"
                    } ${openCharts.length === 1 ? "py-6" : "py-3"}`}
                  >
                    <div className="flex items-center">
                      <div
                        className="w-4 h-4 rounded-full mr-3 transition-colors"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span
                        className={`font-medium text-gray-700 ${
                          openCharts.length === 1 ? "text-lg" : "text-base"
                        }`}
                      >
                        {item.name}
                      </span>
                      {columnFilters.status === item.filterValue && (
                        <span className="ml-2 text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">
                          Dipilih
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-3">
                      <span
                        className={`font-bold transition-colors ${
                          openCharts.length === 1 ? "text-3xl" : "text-2xl"
                        }`}
                        style={{ color: item.color }}
                      >
                        {item.value.toLocaleString()}
                      </span>
                      <div
                        className={`bg-gray-200 rounded-full ${
                          openCharts.length === 1 ? "w-24 h-3" : "w-16 h-2"
                        }`}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            backgroundColor: item.color,
                            width: `${
                              (item.value / Math.max(totalCount, 1)) * 100
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Chart 3: Box per Kategori */}
        {expandedCharts.boxPerKategori && (
          <div
            className={`bg-white rounded-lg shadow-lg border border-gray-100 transition-all duration-500 hover:shadow-xl ${getChartRowSpan(
              "boxPerKategori"
            )}`}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Package className="text-purple-600 mr-3" size={20} />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Box per Kategori
                  </h3>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    Klik untuk filter
                  </span>
                  <button
                    onClick={() => toggleChart("boxPerKategori")}
                    className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-100 transition-colors"
                  >
                    <Minus size={16} />
                  </button>
                </div>
              </div>
              <ResponsiveContainer
                width="100%"
                height={getAdaptiveChartHeight("boxPerKategori")}
                className="transition-all duration-300"
              >
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="kategori"
                    tick={{
                      fontSize: openCharts.length <= 2 ? 12 : 10,
                      cursor: "pointer",
                    }}
                    stroke="#6b7280"
                    angle={openCharts.length >= 3 ? -45 : 0}
                    textAnchor={openCharts.length >= 3 ? "end" : "middle"}
                    height={openCharts.length >= 3 ? 80 : 40}
                  />
                  <YAxis
                    tick={{
                      fontSize: openCharts.length <= 2 ? 12 : 10,
                    }}
                    stroke="#6b7280"
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      value,
                      name === "Total Box" ? "Total Box" : "Total Arsip",
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
          </div>
        )}

        {/* Chart 4: Arsip per Kategori */}
        {expandedCharts.arsipPerKategori && (
          <div
            className={`bg-white rounded-lg shadow-lg border border-gray-100 transition-all duration-500 hover:shadow-xl ${getChartRowSpan(
              "arsipPerKategori"
            )}`}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <FileText className="text-indigo-600 mr-3" size={20} />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Arsip per Kategori
                  </h3>
                </div>
                <button
                  onClick={() => toggleChart("arsipPerKategori")}
                  className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-100 transition-colors"
                >
                  <Minus size={16} />
                </button>
              </div>
              <ResponsiveContainer
                width="100%"
                height={getAdaptiveChartHeight("arsipPerKategori")}
                className="transition-all duration-300"
              >
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
                    tick={{
                      fontSize: openCharts.length <= 2 ? 12 : 10,
                      cursor: "pointer",
                    }}
                    stroke="#6b7280"
                    angle={openCharts.length >= 3 ? -45 : 0}
                    textAnchor={openCharts.length >= 3 ? "end" : "middle"}
                    height={openCharts.length >= 3 ? 80 : 40}
                  />
                  <YAxis
                    tick={{
                      fontSize: openCharts.length <= 2 ? 12 : 10,
                    }}
                    stroke="#6b7280"
                  />
                  <Tooltip formatter={(value) => [value, "Total Arsip"]} />
                  <Area
                    type="monotone"
                    dataKey="totalArchives"
                    stroke="#6366F1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorArchives)"
                    onClick={(data: any) => handleCategoryFilter(data.kategori)}
                    style={{ cursor: "pointer" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Collapsible Box Stats Table */}
      {boxStatsByCategory.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg border border-gray-100 transition-all duration-300 hover:shadow-xl">
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
                    Terefisien: {mostEfficientCategory.kategori} (
                    {mostEfficientCategory.efficiency}%)
                  </span>
                )}
                {isTableExpanded ? (
                  <ChevronUp
                    className="text-gray-500 transition-transform"
                    size={20}
                  />
                ) : (
                  <ChevronDown
                    className="text-gray-500 transition-transform"
                    size={20}
                  />
                )}
              </div>
            </div>
          </div>

          <div
            className={`transition-all duration-500 overflow-hidden ${
              isTableExpanded
                ? "max-h-[1000px] opacity-100"
                : "max-h-0 opacity-0"
            }`}
          >
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
                          columnFilters.nomorBerkas?.startsWith(
                            boxStat.kategori + "."
                          );
                        return (
                          <tr
                            key={boxStat.kategori}
                            className={`${
                              index % 2 === 0 ? "bg-white" : "bg-gray-50"
                            } ${
                              isFiltered
                                ? "ring-2 ring-blue-200 bg-blue-50"
                                : ""
                            } transition-colors duration-300`}
                          >
                            <td className="py-3 px-4 font-medium text-gray-900">
                              {boxStat.kategori}
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
                                    isFiltered ? "" : boxStat.kategori
                                  );
                                }}
                                className={`px-3 py-1 rounded text-xs font-medium transition-all duration-300 ${
                                  isFiltered
                                    ? "bg-red-100 text-red-700 hover:bg-red-200 transform hover:scale-105"
                                    : "bg-blue-100 text-blue-700 hover:bg-blue-200 transform hover:scale-105"
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
        </div>
      )}
    </div>
  );
}
