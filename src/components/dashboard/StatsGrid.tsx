import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { useTheme } from "@/contexts/theme-context";

interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
}

const StatsCard = ({
  title = "İstatistik Başlığı",
  value = "0",
  icon = <TrendingUp />,
}: StatsCardProps) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Card className={isDark ? "bg-gray-800 border-gray-700" : ""}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-muted-foreground"}`}>{title}</p>
            <h3 className={`text-2xl font-bold mt-2 ${isDark ? "text-gray-200" : "text-foreground"}`}>{value}</h3>
          </div>
          <div className={`p-3 rounded-full ${isDark ? "bg-primary/20" : "bg-primary/10"}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
};

interface StatsGridProps {
  stats?: {
    title: string;
    value: string;
    icon: React.ReactNode;
  }[];
}

const StatsGrid = ({ stats }: StatsGridProps) => {
  const defaultStats = [];

  const displayStats = stats || defaultStats;

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayStats.map((stat, index) => (
          <StatsCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
          />
        ))}
      </div>
    </div>
  );
};

export default StatsGrid;
