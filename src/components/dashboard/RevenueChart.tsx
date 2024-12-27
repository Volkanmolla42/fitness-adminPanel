import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface RevenueChartProps {
  data?: {
    date: string;
    revenue: number;
  }[];
}

const defaultData = [
  { date: "Oca", revenue: 4000 },
  { date: "Şub", revenue: 3000 },
  { date: "Mar", revenue: 5000 },
  { date: "Nis", revenue: 2780 },
  { date: "May", revenue: 1890 },
  { date: "Haz", revenue: 2390 },
];

const RevenueChart = ({ data = defaultData }: RevenueChartProps) => {
  return (
    <Card className="w-full h-[400px] bg-white">
      <CardHeader>
        <CardTitle>Gelir Özeti</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#8884d8"
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default RevenueChart;
