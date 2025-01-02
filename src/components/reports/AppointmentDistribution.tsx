import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AppointmentDistributionProps {
  data: Array<{ saat: string; randevu: number }>;
}

export const AppointmentDistribution: React.FC<AppointmentDistributionProps> = ({
  data,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Saatlik Randevu Dağılımı</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="saat" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="randevu" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
