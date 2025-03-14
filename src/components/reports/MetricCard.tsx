import React from "react";
import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  iconColor: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  color,
  iconColor,
}) => {
  return (
    <Card className={`relative overflow-hidden border shadow-sm hover:shadow-md transition-all duration-300 ${color}`}>
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-2 rounded-lg ${iconColor} bg-white dark:bg-gray-800 bg-opacity-50 dark:bg-opacity-50`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </Card>
  );
};
