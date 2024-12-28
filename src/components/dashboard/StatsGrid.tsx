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
    <Card className="bg-white">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold mt-2">{value}</h3>
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
  const defaultStats = [
    {
      title: "Aktif Üyeler",
      value: "2.345",
      icon: <Users className="h-6 w-6 text-primary" />,
      description: "Toplam aktif spor salonu üyeleri",
    },
    {
      title: "Günün Randevuları",
      value: "48",
      icon: <Calendar className="h-6 w-6 text-primary" />,
      description: "Bugün için planlanan",
    },
    {
      title: "Aylık Gelir",
      value: "₺45.231",
      icon: <DollarSign className="h-6 w-6 text-primary" />,
      description: "Bu ayki gelir",
    },
    {
      title: "Büyüme Oranı",
      value: "%12,5",
      icon: <TrendingUp className="h-6 w-6 text-primary" />,
      description: "Geçen aya göre",
    },
  ];

  const displayStats = stats || defaultStats;

  return (
    <div className="w-full bg-background px-2">
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
