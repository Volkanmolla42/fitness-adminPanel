import React from "react";
import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown, Sparkles } from "lucide-react";

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

  // Color variables for dynamic coloring
  const getMainColor = () => {
    if (color.includes("blue")) return "bg-blue-500 dark:bg-blue-600";
    if (color.includes("green")) return "bg-green-500 dark:bg-green-600";
    if (color.includes("purple")) return "bg-purple-500 dark:bg-purple-600";
    if (color.includes("pink")) return "bg-pink-500 dark:bg-pink-600";
    if (color.includes("red")) return "bg-red-500 dark:bg-red-600";
    if (color.includes("yellow")) return "bg-yellow-500 dark:bg-yellow-600";
    if (color.includes("orange")) return "bg-orange-500 dark:bg-orange-600";
    return "bg-indigo-500 dark:bg-indigo-600";
  };

  const getGradientColors = () => {
    if (color.includes("blue"))
      return "from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/10";
    if (color.includes("green"))
      return "from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/10";
    if (color.includes("purple"))
      return "from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/10";
    if (color.includes("pink"))
      return "from-pink-50 to-pink-100 dark:from-pink-900/30 dark:to-pink-800/10";
    if (color.includes("red"))
      return "from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/10";
    if (color.includes("yellow"))
      return "from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/10";
    if (color.includes("orange"))
      return "from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/10";
    return "from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/10";
  };

  const mainColor = getMainColor();
  const gradientColors = getGradientColors();

  return (
    <Card
      className={`tracking-wide flex-grow basis-[calc(25%-12px)] min-w-[250px] bg-gradient-to-br ${gradientColors} shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-0`}
    >
      {/* Colorful top accent bar */}
      <div className={`h-1.5 w-full ${mainColor}`}></div>

      <div className="relative">
        <div className="p-5 relative z-10">
          {/* Title and icon in colored circle with glow effect */}
          <div className="flex items-center mb-4">
            <div
              className={`rounded-full ${iconColor} p-3 mr-3 shadow-md ring-2 ring-white dark:ring-gray-800 ring-opacity-60`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100">
              {title}
            </h3>
          </div>

          {/* Main value area with colorful accent */}
          <div
            className="ml-2 mb-6 border-l-2 pl-3 border-opacity-70 "
            style={{ borderColor: "var(--accent-color, #6366f1)" }}
          >
            <div className="flex items-center">
              <p className="text-4xl font-black tracking-tight text-gray-900 dark:text-white">
                {value}
              </p>

              {/* Change rate with trend icon and sparkle for positive change */}
              {changeRate !== undefined && (
                <div
                  className={`ml-3 flex items-center ${
                    isPositiveChange
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {isPositiveChange ? (
                    <>
                      <TrendingUp className="h-5 w-5 mr-1" />
                      <span className="text-xl font-bold">
                        {changeRateAbs.toFixed(1)}%
                      </span>
                      <Sparkles className="h-3.5 w-3.5 ml-1 text-yellow-500" />
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-5 w-5 mr-1" />
                      <span className="text-sm font-bold">
                        {changeRateAbs.toFixed(1)}%
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Change label right under the percentage with subtle styling */}
            {changeLabel && (
              <div className="mt-1 text-xs  font-medium text-gray-500 dark:text-gray-400 italic">
                {changeLabel}
              </div>
            )}
          </div>

          {/* Card footer with subtle gradient */}
          <div
            className={`bg-gradient-to-r from-white to-gray-100 dark:from-gray-800 dark:to-gray-900 -mx-5 px-5 py-3 mt-3 border-t border-gray-200 dark:border-gray-700`}
          >
            <div className="flex justify-between items-center">
              {/* Sub info with subtle styling */}
              {subInfo && (
                <div className="flex items-center text-xs text-gray-600 dark:text-gray-300 font-medium">
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${mainColor} mr-2`}
                  ></div>
                  <span>{subInfo}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
