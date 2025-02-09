import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/lib/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  Pie,
  PieChart,
  Legend,
} from "recharts";

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: PackageIncome;
  }>;
}

interface PackageIncome {
  package_name: string;
  total_income: number;
  purchase_count: number;
}

const COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEEAD",
  "#D4A5A5",
  "#9FA8DA",
  "#FFE0B2",
];

export function PackageIncomeCard() {
  const [packageIncomes, setPackageIncomes] = useState<PackageIncome[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPackageIncomes = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("member_payments")
          .select("package_name, credit_card_paid, cash_paid");

        if (error) throw error;

        const incomeMap = new Map<string, { total: number; count: number }>();
        
        data.forEach((payment) => {
          if (!payment.package_name) return;
          
          const packages = payment.package_name.split(", ");
          const totalPayment = (payment.credit_card_paid || 0) + (payment.cash_paid || 0);
          const paymentPerPackage = totalPayment / packages.length;
          
          packages.forEach((pkg) => {
            const current = incomeMap.get(pkg) || { total: 0, count: 0 };
            incomeMap.set(pkg, {
              total: current.total + paymentPerPackage,
              count: current.count + 1
            });
          });
        });

        const sortedIncomes = Array.from(incomeMap.entries())
          .map(([package_name, { total, count }]) => ({
            package_name,
            total_income: total,
            purchase_count: count
          }))
          .sort((a, b) => b.total_income - a.total_income);

        setPackageIncomes(sortedIncomes);
      } catch (error) {
        console.error("Paket gelirleri yüklenirken hata:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPackageIncomes();
  }, []);

  const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border">
          <p className="font-semibold">{payload[0].payload.package_name}</p>
          <p className="text-sm text-gray-600">
            Gelir:{" "}
            {new Intl.NumberFormat("tr-TR", {
              style: "currency",
              currency: "TRY",
            }).format(payload[0].payload.total_income)}
          </p>
          <p className="text-sm text-gray-600">
            Satın Alınma: {payload[0].payload.purchase_count} kez
          </p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Paket Bazında Gelirler</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-10">Yükleniyor...</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paket Bazında Gelirler</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="chart" className="space-y-4">
          <TabsList>
            <TabsTrigger value="chart">Grafik</TabsTrigger>
            <TabsTrigger value="pie">Pasta Grafik</TabsTrigger>
            <TabsTrigger value="table">Tablo</TabsTrigger>
          </TabsList>

          <TabsContent value="chart" className="space-y-4">
            <div className="h-[300px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={packageIncomes}>
                  <XAxis
                    dataKey="package_name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) =>
                      new Intl.NumberFormat("tr-TR", {
                        style: "currency",
                        currency: "TRY",
                        maximumFractionDigits: 0,
                      }).format(value)
                    }
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="total_income" radius={[4, 4, 0, 0]}>
                    {packageIncomes.map((entry, index) => (
                      <Cell key={entry.package_name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="pie" className="space-y-4">
            <div className="h-[300px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={packageIncomes}
                    dataKey="total_income"
                    nameKey="package_name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => entry.package_name}
                  >
                    {packageIncomes.map((entry, index) => (
                      <Cell key={entry.package_name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="table">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paket Adı</TableHead>
                    <TableHead className="text-right">Satın Alınma</TableHead>
                    <TableHead className="text-right">Toplam Gelir</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {packageIncomes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center">
                        Henüz gelir kaydı yok
                      </TableCell>
                    </TableRow>
                  ) : (
                    packageIncomes.map((income) => (
                      <TableRow key={income.package_name}>
                        <TableCell>{income.package_name}</TableCell>
                        <TableCell className="text-right">
                          {income.purchase_count} kez
                        </TableCell>
                        <TableCell className="text-right">
                          {new Intl.NumberFormat("tr-TR", {
                            style: "currency",
                            currency: "TRY",
                          }).format(income.total_income)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
