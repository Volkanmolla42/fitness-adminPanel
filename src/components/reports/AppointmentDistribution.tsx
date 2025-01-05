import React, { useMemo } from "react";
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
import type { Database } from "@/types/supabase";

type Appointment = Database["public"]["Tables"]["appointments"]["Row"];

interface AppointmentDistributionProps {
  appointments: Appointment[];
}

export const AppointmentDistribution: React.FC<AppointmentDistributionProps> = ({
  appointments,
}) => {
  const data = useMemo(() => {
    const hourlyDistribution = appointments.reduce((acc: { [key: string]: number }, appointment) => {
      const hour = new Date(appointment.date).getHours();
      const hourStr = `${hour}:00`;
      acc[hourStr] = (acc[hourStr] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(hourlyDistribution)
      .map(([saat, randevu]) => ({
        saat,
        randevu
      }))
      .sort((a, b) => parseInt(a.saat) - parseInt(b.saat));
  }, [appointments]);

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
