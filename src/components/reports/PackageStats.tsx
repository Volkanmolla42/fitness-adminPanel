import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import type { Database } from "@/types/supabase";

type Service = Database["public"]["Tables"]["services"]["Row"];
type Member = Database["public"]["Tables"]["members"]["Row"];

interface PackageStatsProps {
  members: Member[];
  services: Service[];
  selectedDateRange: "all" | "week" | "month" | "year" | "custom";
  customDateRange?: { from: Date; to: Date } | undefined;
}

export const PackageStats: React.FC<PackageStatsProps> = ({
  members,
  services,
  selectedDateRange,
  customDateRange,
}) => {
  const calculatePackageStats = () => {
    const now = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    if (selectedDateRange === "all") {
      // Tüm zamanlar seçiliyse tarih filtresi uygulamayacağız
    } else if (
      selectedDateRange === "custom" &&
      customDateRange?.from &&
      customDateRange?.to
    ) {
      startDate = customDateRange.from;
      endDate = customDateRange.to;
    } else {
      switch (selectedDateRange) {
        case "week":
          startDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() - 7
          );
          endDate = now;
          break;
        case "year":
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31);
          break;
        case "month":
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          break;
      }
    }

    const packageStats = new Map<string, { count: number; revenue: number }>();
    let totalRevenue = 0;
    let totalPackages = 0;

    // Önce tüm paketleri 0 satış ile başlat
    services.forEach((service) => {
      packageStats.set(service.name, { count: 0, revenue: 0 });
    });

    // Filter members based on date range (if applicable)
    const filteredMembers = members.filter((member) => {
      if (!startDate || !endDate) return true;
      const memberStartDate = new Date(member.start_date);
      return isWithinInterval(memberStartDate, {
        start: startDate,
        end: endDate,
      });
    });

    // Calculate stats for each service
    filteredMembers.forEach((member) => {
      member.subscribed_services.forEach((serviceId) => {
        const service = services.find((s) => s.id === serviceId);
        if (service) {
          const stats = packageStats.get(service.name) || {
            count: 0,
            revenue: 0,
          };
          stats.count += 1;
          stats.revenue += service.price;
          packageStats.set(service.name, stats);
          totalRevenue += service.price;
          totalPackages += 1;
        }
      });
    });

    return {
      packageStats: Array.from(packageStats.entries())
        .map(([name, stats]) => ({
          name,
          ...stats,
          percentage:
            totalPackages === 0 ? 0 : (stats.count / totalPackages) * 100,
        }))
        .sort((a, b) => b.count - a.count), // En çok satılan paketleri üste sırala
      totalRevenue,
      totalPackages,
    };
  };

  const stats = calculatePackageStats();

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <CardTitle>Paket / Üye Dağılımı</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paket</TableHead>
                  <TableHead className="text-right">Satış</TableHead>
                  <TableHead className="text-right">Oran</TableHead>
                  <TableHead className="text-right">Gelir</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.packageStats.map((stat) => (
                  <TableRow
                    key={stat.name}
                    className={stat.count === 0 ? "text-muted-foreground" : ""}
                  >
                    <TableCell className="font-medium">{stat.name}</TableCell>
                    <TableCell className="text-right">{stat.count}</TableCell>
                    <TableCell className="text-right">
                      {stat.percentage.toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-right">
                      ₺{stat.revenue.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
