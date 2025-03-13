import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/contexts/theme-context";

interface ServiceUsageStatsProps {
  data: Array<{ name: string; kullanim: number }>;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  const { theme } = useTheme();
  if (active && payload && payload.length) {
    return (
      <div className={`${theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'} p-2 border rounded shadow-sm`}>
        <p className="font-semibold">{label}</p>
        <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{`${payload[0].value} Ders`}</p>
      </div>
    );
  }
  return null;
};

export const ServiceUsageStats: React.FC<ServiceUsageStatsProps> = ({
  data,
}) => {
  const { theme } = useTheme();
  const textColor = theme === 'dark' ? '#e0e0e0' : '#666';
  const gridColor = theme === 'dark' ? '#333' : '#f0f0f0';
  const barColor = theme === 'dark' ? '#9F7AEA' : '#7C3AED'; // Daha açık mor renk karanlık tema için

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">
          Paket / Randevu Dağılımı
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              barSize={40}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: textColor, fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: textColor, fontSize: 12 }}
                label={{
                  value: "Ders Sayısı",
                  angle: -90,
                  position: "insideLeft",
                  fill: textColor,
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar
                dataKey="kullanim"
                fill={barColor}
                radius={[4, 4, 0, 0]}
                name="Ders Sayısı"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
