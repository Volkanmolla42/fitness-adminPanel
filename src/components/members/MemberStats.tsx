import { Card } from "@/components/ui/card";
import { Users, Crown } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  iconColor?: string;
  onClick?: () => void;
}

const StatsCard = ({
  title,
  value,
  icon: Icon,
  iconColor,
  onClick,
}: StatsCardProps) => (
  <Card 
    className="p-6 px-8 hover:shadow-xl rounded-lg transition-all cursor-pointer" 
    onClick={onClick}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-lg font-semibold text-foreground">{title}</p>
        <h3 className="text-3xl font-bold mt-2 text-foreground">{value}</h3>
      </div>
      <Icon className={`h-8 w-8 ${iconColor || "text-muted-foreground"}`} />
    </div>
  </Card>
);

interface MemberStatsProps {
  stats: {
    total: number;
    basic: number;
    vip: number;
  };
  onFilterChange: (type: "all" | "basic" | "vip") => void;
}

export const MemberStats = ({ stats, onFilterChange }: MemberStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatsCard 
        title="Toplam Üye" 
        value={stats.total} 
        icon={Users} 
        onClick={() => onFilterChange("all")}
      />
      <StatsCard
        title="Standart Üyeler"
        value={stats.basic}
        icon={Users}
        iconColor="text-blue-500"
        onClick={() => onFilterChange("basic")}
      />
      <StatsCard
        title="VIP Üyeler"
        value={stats.vip}
        icon={Crown}
        iconColor="text-yellow-500"
        onClick={() => onFilterChange("vip")}
      />
    </div>
  );
};
