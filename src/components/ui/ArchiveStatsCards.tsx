import {
  FileText,
  CheckCircle,
  AlertCircle,
  XCircle,
  Package,
} from "lucide-react";

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
      name: "Aktif",
      value: activeCount,
      icon: CheckCircle,
      bgColor: "bg-green-100",
      textColor: "text-green-600",
    },
    {
      name: "Inaktif",
      value: inactiveCount,
      icon: AlertCircle,
      bgColor: "bg-yellow-100",
      textColor: "text-yellow-600",
    },
    {
      name: "Siap Musnah",
      value: disposeCount,
      icon: XCircle,
      bgColor: "bg-red-100",
      textColor: "text-red-600",
    },
  ];

  return (
    <div className="space-y-6 mb-6">
      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className={`p-3 ${stat.bgColor} rounded-lg`}>
                  <Icon className={stat.textColor} size={24} />
                </div>
                <div className="ml-4">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </h3>
                  <p className="text-sm text-gray-600">{stat.name}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Box Stats by Category */}
      {boxStatsByCategory.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Package className="mr-2 text-purple-600" size={20} />
            Detail Box per Kategori
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {boxStatsByCategory.map((boxStat) => (
              <div
                key={boxStat.kategori}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {boxStat.totalBox}
                  </div>
                  <div className="text-sm font-medium text-gray-900 mb-1">
                    Kategori {boxStat.kategori}
                  </div>
                  <div className="text-xs text-gray-500">
                    {boxStat.totalArchives} arsip
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
