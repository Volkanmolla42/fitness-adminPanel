import React from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Package2, Users, Calendar, TrendingUp, Wallet } from "lucide-react";
import { MetricCard } from "./MetricCard";

interface PerformanceMetricsProps {
  metrics: {
    totalPackages: number;
    uniqueMembers: number;
    totalAppointments: number;
    currentMonthRevenue: number;
    totalRevenue: number;
    packageChangeRate: number;
    memberChangeRate: number;
    appointmentChangeRate: number;
    revenueChangeRate: number;
    currentMonthRevenueChangeRate: number;
    comparisonLabel: string;
  };
}

export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ metrics }) => {
  const metricsData = [
    {
      title: "Toplam Satılan Paket",
      value: metrics.totalPackages,
      icon: Package2,
      color: "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 dark:from-blue-950 dark:to-blue-900 dark:border-blue-800",
      iconColor: "text-blue-500 dark:text-blue-400",
      changeRate: metrics.packageChangeRate,
      changeLabel: metrics.comparisonLabel,
    },
    {
      title: "Üye Sayısı",
      value: metrics.uniqueMembers,
      icon: Users,
      color: "bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 dark:from-purple-950 dark:to-purple-900 dark:border-purple-800",
      iconColor: "text-purple-500 dark:text-purple-400",
      changeRate: metrics.memberChangeRate,
      changeLabel: metrics.comparisonLabel,
    },
    {
      title: "Randevu Sayısı",
      value: metrics.totalAppointments,
      icon: Calendar,
      color: "bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 dark:from-amber-950 dark:to-amber-900 dark:border-amber-800",
      iconColor: "text-amber-500 dark:text-amber-400",
      changeRate: metrics.appointmentChangeRate,
      changeLabel: metrics.comparisonLabel,
    },
    {
      title: `${format(new Date(), "MMMM", { locale: tr })} Ayının Geliri`,
      value: metrics.currentMonthRevenue.toLocaleString("tr-TR", {
        style: "currency",
        currency: "TRY",
      }),
      icon: TrendingUp,
      color: "bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200 dark:from-pink-950 dark:to-pink-900 dark:border-pink-800",
      iconColor: "text-pink-500 dark:text-pink-400",
      changeRate: metrics.currentMonthRevenueChangeRate,
      changeLabel: "Önceki aya göre",
    },
    {
      title: "Toplam Gelir",
      value: metrics.totalRevenue.toLocaleString("tr-TR", {
        style: "currency",
        currency: "TRY",
      }),
      icon: Wallet,
      color: "bg-gradient-to-br from-green-50 to-green-100 border-green-200 dark:from-green-950 dark:to-green-900 dark:border-green-800",
      iconColor: "text-green-500 dark:text-green-400",
      changeRate: metrics.revenueChangeRate,
      changeLabel: metrics.comparisonLabel,
    },
  ];

  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {metricsData.map((item, index) => (
          <MetricCard
            key={index}
            title={item.title}
            value={item.value}
            icon={item.icon}
            color={item.color}
            iconColor={item.iconColor}
            changeRate={item.changeRate}
            changeLabel={item.changeLabel}
          />
        ))}
      </div>
    </div>
  );
};
