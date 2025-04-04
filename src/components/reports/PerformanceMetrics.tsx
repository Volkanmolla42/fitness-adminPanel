import React from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  Package2,
  Users,
  Calendar,
  TrendingUp,
  Wallet,
  RefreshCw,
} from "lucide-react";
import { MetricCard } from "./MetricCard";

interface PerformanceMetricsProps {
  metrics: {
    totalPackages: number;
    uniqueMembers: number;
    totalAppointments: number;
    currentMonthRevenue: number;
    totalRevenue: number;
    packageChangeRate: number;
    packageRenewalChangeRate: number; // Paket yenileme değişim oranı
    memberChangeRate: number;
    appointmentChangeRate: number;
    revenueChangeRate: number;
    currentMonthRevenueChangeRate: number;
    comparisonLabel: string;
    packageRenewalCount: number; // Paket yenileme sayısı
    averageRevenuePerMember: number; // Kişi başı ortalama gelir
    membersWithRenewalCount: number; // Yenileme yapan üye sayısı
    membersWithRenewalPercentage: number; // Yenileme yapan üye yüzdesi
    membersWithRenewalPercentageChangeRate: number; // Yenileme yapan üye yüzdesi değişim oranı
  };
}

export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({
  metrics,
}) => {
  const metricsData = [
    {
      title: "Toplam Satılan Paket",
      value: metrics.totalPackages,
      icon: Package2,
      color:
        "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 dark:from-blue-950 dark:to-blue-900 dark:border-blue-800",
      iconColor: "text-blue-500 dark:text-blue-400",
      changeRate: metrics.packageChangeRate,
      changeLabel: metrics.comparisonLabel,
      subInfo: `Üye başına ortalama: ${(metrics.uniqueMembers > 0
        ? metrics.totalPackages / metrics.uniqueMembers
        : 0
      ).toFixed(1)} paket`,
    },
    {
      title: "Yenilenen Paket Sayısı",
      value: metrics.packageRenewalCount,
      icon: RefreshCw,
      color:
        "bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200 dark:from-cyan-950 dark:to-cyan-900 dark:border-cyan-800",
      iconColor: "text-cyan-500 dark:text-cyan-400",
      changeRate: metrics.packageRenewalChangeRate,
      changeLabel: metrics.comparisonLabel,
      subInfo: `Üyelerin %${metrics.membersWithRenewalPercentage.toFixed(
        1
      )}'i yenileme yapmış`,
    },
    {
      title: "Üye Sayısı",
      value: metrics.uniqueMembers,
      icon: Users,
      color:
        "bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 dark:from-purple-950 dark:to-purple-900 dark:border-purple-800",
      iconColor: "text-purple-500 dark:text-purple-400",
      changeRate: metrics.memberChangeRate,
      changeLabel: metrics.comparisonLabel,
      subInfo: `Toplam gelir: ${Math.round(
        metrics.totalRevenue / metrics.uniqueMembers
      ).toLocaleString("tr-TR")} ₺/üye`,
    },
    {
      title: "Randevu Sayısı",
      value: metrics.totalAppointments,
      icon: Calendar,
      color:
        "bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 dark:from-amber-950 dark:to-amber-900 dark:border-amber-800",
      iconColor: "text-amber-500 dark:text-amber-400",
      changeRate: metrics.appointmentChangeRate,
      changeLabel: metrics.comparisonLabel,
      subInfo: `Üye başına: ${(metrics.uniqueMembers > 0
        ? metrics.totalAppointments / metrics.uniqueMembers
        : 0
      ).toFixed(1)} randevu`,
    },
    {
      title: `${format(new Date(), "MMMM", { locale: tr })} Ayının Geliri`,
      value: metrics.currentMonthRevenue.toLocaleString("tr-TR", {
        style: "currency",
        currency: "TRY",
      }),
      icon: TrendingUp,
      color:
        "bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200 dark:from-pink-950 dark:to-pink-900 dark:border-pink-800",
      iconColor: "text-pink-500 dark:text-pink-400",
      changeRate: metrics.currentMonthRevenueChangeRate,
      changeLabel: "Önceki aya göre",
      subInfo: `Kişi başı ortalama: ${metrics.averageRevenuePerMember.toLocaleString(
        "tr-TR",
        {
          style: "currency",
          currency: "TRY",
        }
      )}`,
    },
    {
      title: "Toplam Gelir",
      value: metrics.totalRevenue.toLocaleString("tr-TR", {
        style: "currency",
        currency: "TRY",
      }),
      icon: Wallet,
      color:
        "bg-gradient-to-br from-green-50 to-green-100 border-green-200 dark:from-green-950 dark:to-green-900 dark:border-green-800",
      iconColor: "text-green-500 dark:text-green-400",
      changeRate: metrics.revenueChangeRate,
      changeLabel: metrics.comparisonLabel,
      subInfo: `Paket başına: ${(metrics.totalPackages > 0
        ? Math.round(metrics.totalRevenue / metrics.totalPackages)
        : 0
      ).toLocaleString("tr-TR")} ₺`,
    },
  ];

  return (
    <div className="flex flex-wrap gap-4">
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
          subInfo={item.subInfo}
        />
      ))}
    </div>
  );
};
