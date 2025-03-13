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
import { useTheme } from "@/contexts/theme-context";

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

// Açık ve karanlık tema için renk paletleri
const LIGHT_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEEAD",
  "#D4A5A5",
  "#9FA8DA",
  "#FFE0B2",
];

const DARK_COLORS = [
  "#FF8A8A",
  "#6EEAE0",
  "#67D5F0",
  "#B4E0D0",
  "#FFF0C0",
  "#F0C0C0",
  "#B0C0F0",
  "#FFE0C0",
];

export function PackageIncomeCard() {
  const { theme } = useTheme();
  const COLORS = theme === 'dark' ? DARK_COLORS : LIGHT_COLORS;
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
        <div className={`${theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'} p-4 rounded-lg shadow-lg border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <p className="font-semibold">{payload[0].payload.package_name}</p>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            Gelir:{" "}
            {new Intl.NumberFormat("tr-TR", {
              style: "currency",
              currency: "TRY",
            }).format(payload[0].payload.total_income)}
          </p>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
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
                    stroke={theme === 'dark' ? "#aaaaaa" : "#888888"}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke={theme === 'dark' ? "#aaaaaa" : "#888888"}
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
                    labelLine={{ stroke: theme === 'dark' ? '#aaaaaa' : '#888888' }}
                  >
                    {packageIncomes.map((entry, index) => (
                      <Cell key={entry.package_name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend formatter={(value) => <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="table" className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Paket Adı</TableHead>
                    <TableHead className="text-right">Gelir</TableHead>
                    <TableHead className="text-right">Satın Alınma</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {packageIncomes.map((item) => (
                    <TableRow key={item.package_name} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{item.package_name}</TableCell>
                      <TableCell className="text-right">
                        {new Intl.NumberFormat("tr-TR", {
                          style: "currency",
                          currency: "TRY",
                        }).format(item.total_income)}
                      </TableCell>
                      <TableCell className="text-right">{item.purchase_count} kez</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
