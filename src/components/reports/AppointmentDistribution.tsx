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
    // Create a map to store hour counts
    const hourlyDistribution: { [key: string]: number } = {};
    
    // Initialize all hours with 0
    for (let i = 0; i < 24; i++) {
      const hourStr = i.toString().padStart(2, '0') + ':00';
      hourlyDistribution[hourStr] = 0;
    }

    // Count appointments for each hour
    appointments.forEach(appointment => {
      const timeHour = parseInt(appointment.time.split(':')[0]);
      const hourStr = timeHour.toString().padStart(2, '0') + ':00';
      hourlyDistribution[hourStr]++;
    });

    // Convert to array and sort
    return Object.entries(hourlyDistribution)
      .map(([saat, randevu]) => ({
        saat,
        randevu
      }))
      .sort((a, b) => parseInt(a.saat) - parseInt(b.saat));
  }, [appointments]);

  // Calculate total appointments
  const totalAppointments = useMemo(() => 
    appointments.length
  , [appointments]);

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Saatlik Randevu Dağılımı</CardTitle>
        <p className="text-sm text-muted-foreground">Toplam {totalAppointments} randevu</p>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="saat" />
              <YAxis domain={[0, 'auto']} />
              <Tooltip formatter={(value) => [value, 'Randevu Sayısı']} />
              <Bar dataKey="randevu" fill="#82ca9d" name="Randevu Sayısı" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
