import { Card } from "@/components/ui/card";
import { Users, Crown, UserCheck, UserX } from "lucide-react";
import React from "react";
import { useTheme } from "@/contexts/theme-context";

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  iconColor?: string;
  isActive?: boolean;
  onClick?: () => void;
}

const StatsCard = ({
  title,
  value,
  icon: Icon,
  iconColor,
  isActive,
  onClick,
}: StatsCardProps) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Card
      onClick={onClick}
      className={`p-6 px-8 rounded-lg transition-all cursor-pointer transform hover:shadow-xl
        ${
          isActive
            ? isDark
              ? "bg-gradient-to-r from-pink-900/40 to-gray-800 border-2 border-pink-700 shadow-lg scale-105"
              : "bg-gradient-to-r from-pink-100 to-white border-2 border-pink-300 shadow-lg scale-105"
            : isDark
            ? "hover:bg-pink-950/20"
            : "hover:bg-pink-50"
        }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p
            className={`text-lg font-semibold transition-colors ${
              isActive
                ? isDark
                  ? "text-pink-300"
                  : "text-pink-800"
                : isDark
                ? "text-gray-200"
                : "text-gray-800"
            }`}
          >
            {title}
          </p>
          <h3
            className={`text-3xl font-bold mt-2 ${
              isDark ? "text-gray-100" : "text-gray-800"
            }`}
          >
            {value}
          </h3>
        </div>
        <Icon
          className={`h-8 w-8 transition-colors ${
            iconColor || (isDark ? "text-gray-400" : "text-gray-500")
          }`}
        />
      </div>
    </Card>
  );
};

interface MemberStatsProps {
  stats: {
    total: number;
    basic: number;
    vip: number;
    active: number;
    inactive: number;
  };
  activeFilter: "all" | "basic" | "vip" | "active" | "inactive";
  onFilterChange: (
    type: "all" | "basic" | "vip" | "active" | "inactive"
  ) => void;
}

export const MemberStats = ({
  stats,
  activeFilter,
  onFilterChange,
}: MemberStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <StatsCard
        title="Tüm Üyeler"
        value={stats.total}
        icon={Users}
        isActive={activeFilter === "all"}
        onClick={() => onFilterChange("all")}
      />
      <StatsCard
        title="Standart Üyeler"
        value={stats.basic}
        icon={Users}
        iconColor="text-purple-300"
        isActive={activeFilter === "basic"}
        onClick={() => onFilterChange("basic")}
      />
      <StatsCard
        title="VIP Üyeler"
        value={stats.vip}
        icon={Crown}
        iconColor="text-yellow-300"
        isActive={activeFilter === "vip"}
        onClick={() => onFilterChange("vip")}
      />
      <StatsCard
        title="Tüm Aktif Üyeler"
        value={stats.active}
        icon={UserCheck}
        iconColor="text-green-500"
        isActive={activeFilter === "active"}
        onClick={() => onFilterChange("active")}
      />
      <StatsCard
        title="Tüm Pasif Üyeler"
        value={stats.inactive}
        icon={UserX}
        iconColor="text-red-500"
        isActive={activeFilter === "inactive"}
        onClick={() => onFilterChange("inactive")}
      />
    </div>
  );
};
