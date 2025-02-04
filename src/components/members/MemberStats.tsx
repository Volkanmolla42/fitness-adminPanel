import { Card } from "@/components/ui/card";
import { Users, Crown } from "lucide-react";
import React from "react";

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
}: StatsCardProps) => (
  <Card
    onClick={onClick}
    className={`p-6 px-8 rounded-lg transition-all cursor-pointer transform hover:shadow-xl
      ${isActive 
        ? "bg-gradient-to-r from-pink-100 to-white border-2 border-pink-300 shadow-lg scale-105" 
        : "hover:bg-pink-50"
      }`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p
          className={`text-lg font-semibold transition-colors ${
            isActive ? "text-pink-800" : "text-gray-800"
          }`}
        >
          {title}
        </p>
        <h3 className="text-3xl font-bold mt-2 text-gray-800">{value}</h3>
      </div>
      <Icon className={`h-8 w-8 transition-colors ${iconColor || "text-gray-500"}`} />
    </div>
  </Card>
);

interface MemberStatsProps {
  stats: {
    total: number;
    basic: number;
    vip: number;
  };
  activeFilter: "all" | "basic" | "vip";
  onFilterChange: (type: "all" | "basic" | "vip") => void;
}

export const MemberStats = ({ stats, activeFilter, onFilterChange }: MemberStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatsCard 
        title="Toplam Üye" 
        value={stats.total} 
        icon={Users}
        isActive={activeFilter === "all"}
        onClick={() => onFilterChange("all")}
      />
      <StatsCard
        title="Standart Üyeler"
        value={stats.basic}
        icon={Users}
        // Daha kadınsı ve pastel bir his için ikon rengini örneğin lavanta tonlarında ayarladım
        iconColor="text-purple-300"
        isActive={activeFilter === "basic"}
        onClick={() => onFilterChange("basic")}
      />
      <StatsCard
        title="VIP Üyeler"
        value={stats.vip}
        icon={Crown}
        // Hafif pastel altın rengi etkisi veren bir renk kullandım
        iconColor="text-yellow-300"
        isActive={activeFilter === "vip"}
        onClick={() => onFilterChange("vip")}
      />
    </div>
  );
};
