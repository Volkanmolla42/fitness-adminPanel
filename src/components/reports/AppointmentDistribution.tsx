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

const TIME_SLOTS = [
  "10:00",
  "11:30",
  "13:00",
  "14:30",
  "16:00",
  "17:00",
  "18:00",
  "19:00"
];

export const AppointmentDistribution: React.FC<AppointmentDistributionProps> = ({
  appointments,
}) => {
  const data = useMemo(() => {
    // Create a map to store time slot counts
    const slotDistribution: { [key: string]: number } = {};
    
    // Initialize all time slots with 0
    TIME_SLOTS.forEach(slot => {
      slotDistribution[slot] = 0;
    });

    // Count appointments for each time slot
    appointments.forEach(appointment => {
      const appointmentTime = appointment.time;
      // Find the closest time slot
      const matchingSlot = TIME_SLOTS.find(slot => {
        const [slotHour, slotMinute] = slot.split(":").map(Number);
        const [appHour, appMinute] = appointmentTime.split(":").map(Number);
        
        // Check if the appointment time matches exactly
        return appHour === slotHour && appMinute === slotMinute;
      });

      if (matchingSlot) {
        slotDistribution[matchingSlot]++;
      }
    });

    // Convert to array format for the chart
    return TIME_SLOTS.map(saat => ({
      saat,
      randevu: slotDistribution[saat]
    }));
  }, [appointments]);

  // Calculate total appointments in these time slots
  const totalAppointments = useMemo(() => 
    data.reduce((sum, item) => sum + item.randevu, 0)
  , [data]);

  return (
    <Card>
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
