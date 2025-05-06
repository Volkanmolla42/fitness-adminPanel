import React from "react";
import { Card, CardContent } from "@/components/ui/card";
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
  subInfo?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  color,
  iconColor,
  changeRate,
  changeLabel,
  subInfo,
}) => {
  const isPositiveChange = changeRate !== undefined && changeRate >= 0;
  const changeRateAbs = changeRate !== undefined ? Math.abs(changeRate) : 0;

  // Generate CSS variables based on color prop
  const getBaseColor = () => {
    if (color.includes("blue")) return "var(--blue)";
    if (color.includes("green")) return "var(--green)";
    if (color.includes("purple")) return "var(--purple)";
    if (color.includes("pink")) return "var(--pink)";
    if (color.includes("red")) return "var(--red)";
    if (color.includes("yellow")) return "var(--yellow)";
    if (color.includes("orange")) return "var(--orange)";
    if (color.includes("cyan")) return "var(--cyan)";
    return "var(--primary)";
  };

  // Get style variables
  const baseColor = getBaseColor();
  
  return (
    <Card 
      className="h-full overflow-hidden border border-gray-300 dark:border-gray-700 shadow-md transition-all hover:shadow-lg text-[110%]"
      style={{
        "--blue": "rgb(37, 99, 235)",
        "--green": "rgb(22, 163, 74)",
        "--purple": "rgb(126, 34, 206)",
        "--pink": "rgb(219, 39, 119)",
        "--red": "rgb(220, 38, 38)",
        "--yellow": "rgb(202, 138, 4)",
        "--orange": "rgb(234, 88, 12)",
        "--cyan": "rgb(8, 145, 178)",
        "--primary": "rgb(79, 70, 229)",
      } as React.CSSProperties}
    >
      <div 
        className="h-1.5" 
        style={{ backgroundColor: baseColor }}
      />
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div 
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${baseColor}15` }}
            >
              <Icon className="h-5 w-5" style={{ color: baseColor }} />
            </div>
            <h3 className="font-medium text-[15px] text-gray-900 dark:text-white">
              {title}
            </h3>
          </div>
          
          {changeRate !== undefined && (
            <div 
              className={`flex items-center gap-1 rounded-full px-2 py-1 text-[13px] font-medium ${
                isPositiveChange 
                  ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400" 
                  : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
              }`}
            >
              {isPositiveChange ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>{changeRateAbs.toFixed(1)}%</span>
            </div>
          )}
        </div>
          
        <div className="my-3">
          <div className="text-[33px] font-bold tracking-tight text-gray-900 dark:text-white">
            {value}
          </div>
          
          {changeLabel && (
            <div className="mt-1 text-[13px] text-gray-900 dark:text-white">
              {changeLabel}
            </div>
          )}
        </div>
        
        {subInfo && (
          <div className="flex items-center mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div 
              className="w-1.5 h-1.5 rounded-full mr-2"
              style={{ backgroundColor: baseColor }}
            />
            <span className="text-[13px] text-gray-900 dark:text-white">
              {subInfo}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
