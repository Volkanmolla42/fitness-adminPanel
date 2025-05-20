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
import { useAvailableTimeSlots } from "@/constants/timeSlots";
import { useTheme } from "@/contexts/theme-context";

type Appointment = Database["public"]["Tables"]["appointments"]["Row"];

interface AppointmentDistributionProps {
  appointments: Appointment[];
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
      <div className={`${theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'} p-2 border rounded shadow-sm ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <p className="font-semibold">{label}</p>
        <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
          Randevu Sayısı: {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

export const AppointmentDistribution: React.FC<AppointmentDistributionProps> = ({
  appointments,
}) => {
  const { theme } = useTheme();
  const { TIME_SLOTS } = useAvailableTimeSlots();
  const barColor = theme === 'dark' ? '#6EE7B7' : '#82ca9d'; // Daha parlak yeşil karanlık tema için
  const textColor = theme === 'dark' ? '#e0e0e0' : '#666';
  const gridColor = theme === 'dark' ? '#333' : '#d0d0d0';

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
  }, [appointments, TIME_SLOTS]);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Saatlik Randevu Dağılımı</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="saat" tick={{ fill: textColor }} />
              <YAxis domain={[0, 'auto']} tick={{ fill: textColor }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="randevu" fill={barColor} name="Randevu Sayısı" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
