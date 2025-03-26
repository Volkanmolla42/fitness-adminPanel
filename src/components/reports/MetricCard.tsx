import React from "react";
import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  iconColor: string;
  changeRate?: number;
  changeLabel?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  color,
  iconColor,
  changeRate,
  changeLabel,
}) => {
  const isPositiveChange = changeRate !== undefined && changeRate >= 0;
  const changeRateAbs = changeRate !== undefined ? Math.abs(changeRate) : 0;
  
  return (
    <Card className={`relative overflow-hidden border shadow-sm hover:shadow-md transition-all duration-300 ${color}`}>
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-2 rounded-lg ${iconColor} bg-white dark:bg-gray-800 bg-opacity-50 dark:bg-opacity-50`}>
            <Icon className="h-5 w-5" />
          </div>
          
          {changeRate !== undefined && (
            <div className={`flex items-center text-sm font-medium ${isPositiveChange ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {isPositiveChange ? (
                <TrendingUp className="h-3.5 w-3.5 mr-1" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 mr-1" />
              )}
              <span>{changeRateAbs.toFixed(1)}%</span>
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <p className="text-2xl font-bold">{value}</p>
          {changeLabel && (
            <p className="text-xs text-muted-foreground mt-1">{changeLabel}</p>
          )}
        </div>
      </div>
    </Card>
  );
};
