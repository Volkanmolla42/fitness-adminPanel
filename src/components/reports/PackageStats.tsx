import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import type { Database } from "@/types/supabase";

type Service = Database["public"]["Tables"]["services"]["Row"];
type Member = Database["public"]["Tables"]["members"]["Row"];

interface PackageStatsProps {
  members: Member[];
  services: Service[];
  selectedDateRange: "week" | "month" | "year" | "custom";
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
    let startDate: Date;
    let endDate: Date;

    if (customDateRange?.from && customDateRange?.to) {
      startDate = customDateRange.from;
      endDate = customDateRange.to;
    } else {
      switch (selectedDateRange) {
        case "week":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
          endDate = now;
          break;
        case "year":
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31);
          break;
        case "month":
        default:
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          break;
      }
    }

    const packageStats = new Map<string, { count: number; revenue: number }>();
    let totalRevenue = 0;
    let totalPackages = 0;

    // Filter members who subscribed within the date range
    const filteredMembers = members.filter((member) => {
      const memberStartDate = new Date(member.start_date);
      return isWithinInterval(memberStartDate, { start: startDate, end: endDate });
    });

    // Calculate stats for each service
    filteredMembers.forEach((member) => {
      member.subscribed_services.forEach((serviceId) => {
        const service = services.find((s) => s.id === serviceId);
        if (service) {
          const stats = packageStats.get(service.name) || { count: 0, revenue: 0 };
          stats.count += 1;
          stats.revenue += service.price;
          packageStats.set(service.name, stats);
          totalRevenue += service.price;
          totalPackages += 1;
        }
      });
    });

    return {
      packageStats: Array.from(packageStats.entries()).map(([name, stats]) => ({
        name,
        ...stats,
      })),
      totalRevenue,
      totalPackages,
    };
  };

  const stats = calculatePackageStats();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paket İstatistikleri</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border p-3">
              <div className="text-sm font-medium">Toplam Satılan Paket</div>
              <div className="text-2xl font-bold">{stats.totalPackages}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-sm font-medium">Toplam Gelir</div>
              <div className="text-2xl font-bold">₺{stats.totalRevenue.toLocaleString()}</div>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paket Adı</TableHead>
                <TableHead>Satış Adedi</TableHead>
                <TableHead>Gelir</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.packageStats.map((stat) => (
                <TableRow key={stat.name}>
                  <TableCell>{stat.name}</TableCell>
                  <TableCell>{stat.count}</TableCell>
                  <TableCell>₺{stat.revenue.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
