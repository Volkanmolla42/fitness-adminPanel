import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart, CheckCircle, Clock, AlertCircle } from "lucide-react";
import type { Database } from "@/types/supabase";

type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
type Trainer = Database["public"]["Tables"]["trainers"]["Row"];
type Service = Database["public"]["Tables"]["services"]["Row"];

interface TrainerClassesChartProps {
  appointments: Appointment[];
  trainers: Trainer[];
  services: Service[];
}

export const TrainerClassesChart: React.FC<TrainerClassesChartProps> = ({ 
  appointments, 
  trainers,
  services
}) => {
  const [activeTab, setActiveTab] = useState<"count" | "hours">("count");

  const classCountData = useMemo(() => {
    // Return empty array if no data
    if (!appointments.length || !trainers.length) {
      return [];
    }

    // Calculate class counts for each trainer
    const trainerClassCounts = trainers.map((trainer) => {
      const trainerAppointments = appointments.filter(
        (appointment) => appointment.trainer_id === trainer.id
      );
      
      // Separate completed, scheduled and cancelled appointments
      const completedClasses = trainerAppointments.filter(
        (appointment) => appointment.status === "completed"
      ).length;
      
      const scheduledClasses = trainerAppointments.filter(
        (appointment) => appointment.status === "scheduled"
      ).length;
      
      const cancelledClasses = trainerAppointments.filter(
        (appointment) => appointment.status === "cancelled"
      ).length;

      return {
        id: trainer.id,
        name: `${trainer.first_name} ${trainer.last_name}`,
        tamamlanan: completedClasses,
        planlanan: scheduledClasses,
        iptal: cancelledClasses,
        toplam: trainerAppointments.length,
      };
    });

    // Sort by total class count (descending)
    return trainerClassCounts.sort((a, b) => b.toplam - a.toplam);
  }, [appointments, trainers]);

  const hoursData = useMemo(() => {
    // Return empty array if no data
    if (!appointments.length || !trainers.length || !services.length) {
      return [];
    }

    // Create a map of service durations by service ID
    const serviceDurations = services.reduce((acc, service) => {
      acc[service.id] = service.duration;
      return acc;
    }, {} as Record<string, number>);

    // Calculate total class hours for each trainer
    const trainerHourData = trainers.map((trainer) => {
      const trainerAppointments = appointments.filter(
        (appointment) => appointment.trainer_id === trainer.id
      );
      
      // Separate calculations for completed and scheduled appointments
      const completedAppointments = trainerAppointments.filter(
        (appointment) => appointment.status === "completed"
      );
      
      const scheduledAppointments = trainerAppointments.filter(
        (appointment) => appointment.status === "scheduled"
      );
      
      // Calculate total class hours (in minutes)
      const completedMinutes = completedAppointments.reduce((total, appointment) => {
        const duration = serviceDurations[appointment.service_id] || 0;
        return total + duration;
      }, 0);
      
      const scheduledMinutes = scheduledAppointments.reduce((total, appointment) => {
        const duration = serviceDurations[appointment.service_id] || 0;
        return total + duration;
      }, 0);
      
      // Convert minutes to hours (with 1 decimal precision)
      const completedHours = parseFloat((completedMinutes / 60).toFixed(1));
      const scheduledHours = parseFloat((scheduledMinutes / 60).toFixed(1));
      const totalHours = parseFloat(((completedMinutes + scheduledMinutes) / 60).toFixed(1));

      return {
        id: trainer.id,
        name: `${trainer.first_name} ${trainer.last_name}`,
        tamamlanan: completedHours,
        planlanan: scheduledHours,
        toplam: totalHours,
      };
    });

    // Sort by total hours (descending)
    return trainerHourData.sort((a, b) => b.toplam - a.toplam);
  }, [appointments, trainers, services]);

  if ((!classCountData.length && activeTab === "count") || (!hoursData.length && activeTab === "hours")) {
    return (
      <Card className="border border-gray-300 dark:border-0 shadow-md text-[110%]">
        <CardHeader className="px-6 pb-0">
          <div className="flex items-center gap-2">
            <BarChart className="h-5 w-5 text-gray-900" />
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Antrenör Performansı</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center">
          <p className="text-gray-900 dark:text-white">Görüntülenecek veri bulunamadı</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className=" text-[110%]">
      <CardHeader className="px-6 pb-0">
        <div className="flex items-center gap-2">
          <BarChart className="h-5 w-5 text-gray-900" />
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Antrenör Performansı</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <Tabs 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as "count" | "hours")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100 dark:bg-gray-800">
            <TabsTrigger value="count" className="py-2.5 text-[14px] data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>Ders Sayısı</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="hours" className="py-2.5 text-[14px] data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Ders Saati</span>
              </div>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="count" className="mt-0">
            <div className="rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-100 dark:bg-gray-800">
                  <TableRow>
                    <TableHead className="w-[200px] py-3 text-gray-900 dark:text-white text-[14px]">Antrenör</TableHead>
                    <TableHead className="text-center py-3 text-gray-900 dark:text-white text-[14px]">
                      <div className="flex items-center justify-center gap-1.5">
                        <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                        <span>Tamamlanan</span>
                      </div>
                    </TableHead>
                    <TableHead className="text-center py-3 text-gray-900 dark:text-white text-[14px]">
                      <div className="flex items-center justify-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-blue-600" />
                        <span>Planlanan</span>
                      </div>
                    </TableHead>
                    <TableHead className="text-center py-3 text-gray-900 dark:text-white text-[14px]">
                      <div className="flex items-center justify-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5 text-red-600" />
                        <span>İptal Edilen</span>
                      </div>
                    </TableHead>
                    <TableHead className="text-center py-3 text-gray-900 dark:text-white text-[14px]">Toplam</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classCountData.map((trainer) => (
                    <TableRow key={trainer.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                      <TableCell className="font-medium text-gray-900 dark:text-white text-[14px]">{trainer.name}</TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center w-10 h-6 bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 font-medium text-[14px] rounded-full">
                          {trainer.tamamlanan}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center w-10 h-6 bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 font-medium text-[14px] rounded-full">
                          {trainer.planlanan}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center w-10 h-6 bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 font-medium text-[14px] rounded-full">
                          {trainer.iptal}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center w-10 h-6 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white font-semibold text-[14px] rounded-full">
                          {trainer.toplam}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          <TabsContent value="hours" className="mt-0">
            <div className="rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-100 dark:bg-gray-800">
                  <TableRow>
                    <TableHead className="w-[200px] py-3 text-gray-900 dark:text-white text-[14px]">Antrenör</TableHead>
                    <TableHead className="text-center py-3 text-gray-900 dark:text-white text-[14px]">
                      <div className="flex items-center justify-center gap-1.5">
                        <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                        <span>Tamamlanan (Saat)</span>
                      </div>
                    </TableHead>
                    <TableHead className="text-center py-3 text-gray-900 dark:text-white text-[14px]">
                      <div className="flex items-center justify-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-blue-600" />
                        <span>Planlanan (Saat)</span>
                      </div>
                    </TableHead>
                    <TableHead className="text-center py-3 text-gray-900 dark:text-white text-[14px]">Toplam (Saat)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hoursData.map((trainer) => (
                    <TableRow key={trainer.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                      <TableCell className="font-medium text-gray-900 dark:text-white text-[14px]">{trainer.name}</TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-1 bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 font-medium text-[14px] rounded-full">
                          {trainer.tamamlanan}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-1 bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 font-medium text-[14px] rounded-full">
                          {trainer.planlanan}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-1 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white font-semibold text-[14px] rounded-full">
                          {trainer.toplam}
                        </span>
                      </TableCell>
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
};
