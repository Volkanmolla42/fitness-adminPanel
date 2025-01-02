import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  isWithinInterval,
} from "date-fns";
import { tr } from "date-fns/locale";
import type { Database } from "@/types/supabase";

type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
type Member = Database["public"]["Tables"]["members"]["Row"];

const calculateTrends = (data: any[], currentPeriod: Date[], previousPeriod: Date[]) => {
  const currentData = data.filter((item) =>
    isWithinInterval(new Date(item.created_at), {
      start: currentPeriod[0],
      end: currentPeriod[1],
    })
  );

  const previousData = data.filter((item) =>
    isWithinInterval(new Date(item.created_at), {
      start: previousPeriod[0],
      end: previousPeriod[1],
    })
  );

  return {
    current: currentData.length,
    previous: previousData.length,
    percentageChange: previousData.length
      ? ((currentData.length - previousData.length) / previousData.length) * 100
      : 100,
  };
};

interface TrendAnalysisProps {
  appointments: Appointment[];
  members: Member[];
  selectedDateRange: "week" | "month" | "year";
}

export const TrendAnalysis = ({ appointments, members, selectedDateRange }: TrendAnalysisProps) => {
  const [currentPeriod, previousPeriod] = useMemo(() => {
    const now = new Date();
    let currentStart, currentEnd, previousStart, previousEnd;

    switch (selectedDateRange) {
      case "week":
        currentStart = startOfWeek(now, { locale: tr });
        currentEnd = endOfWeek(now, { locale: tr });
        previousStart = startOfWeek(new Date(currentStart.getTime() - 7 * 24 * 60 * 60 * 1000), { locale: tr });
        previousEnd = endOfWeek(new Date(currentEnd.getTime() - 7 * 24 * 60 * 60 * 1000), { locale: tr });
        break;
      case "month":
        currentStart = startOfMonth(now);
        currentEnd = endOfMonth(now);
        previousStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1));
        previousEnd = endOfMonth(new Date(now.getFullYear(), now.getMonth() - 1));
        break;
      case "year":
        currentStart = startOfYear(now);
        currentEnd = endOfYear(now);
        previousStart = startOfYear(new Date(now.getFullYear() - 1));
        previousEnd = endOfYear(new Date(now.getFullYear() - 1));
        break;
    }

    return [[currentStart, currentEnd], [previousStart, previousEnd]];
  }, [selectedDateRange]);

  const appointmentTrends = calculateTrends(appointments, currentPeriod, previousPeriod);
  const memberTrends = calculateTrends(members, currentPeriod, previousPeriod);

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 mb-4">
      <Card>
        <CardHeader>
          <CardTitle>Randevu Trendi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{appointmentTrends.current}</div>
          <div className={`text-sm ${appointmentTrends.percentageChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {appointmentTrends.percentageChange >= 0 ? '↑' : '↓'} {Math.abs(appointmentTrends.percentageChange).toFixed(1)}%
            <span className="text-gray-500 ml-1">önceki döneme göre</span>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Üye Trendi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{memberTrends.current}</div>
          <div className={`text-sm ${memberTrends.percentageChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {memberTrends.percentageChange >= 0 ? '↑' : '↓'} {Math.abs(memberTrends.percentageChange).toFixed(1)}%
            <span className="text-gray-500 ml-1">önceki döneme göre</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
