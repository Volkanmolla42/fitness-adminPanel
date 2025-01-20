import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Calendar, TrendingUp, DollarSign } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  description: string;
}

const StatsCard = ({
  title = "İstatistik Başlığı",
  value = "0",
  icon = <TrendingUp />,
  description = "Açıklama mevcut değil",
}: StatsCardProps) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold mt-2 text-foreground">{value}</h3>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
          <div className="p-3 bg-primary/10 rounded-full">{icon}</div>
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
    description: string;
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
            description={stat.description}
          />
        ))}
      </div>
    </div>
  );
};

export default StatsGrid;
