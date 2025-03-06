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
    // Eğer veri yoksa boş dizi döndür
    if (!appointments.length || !trainers.length) {
      return [];
    }

    // Her antrenör için ders sayısını hesapla
    const trainerClassCounts = trainers.map((trainer) => {
      const trainerAppointments = appointments.filter(
        (appointment) => appointment.trainer_id === trainer.id
      );
      
      // Tamamlanan, planlanan ve iptal edilen randevuları ayır
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

    // Toplam ders sayısına göre sırala (çoktan aza)
    return trainerClassCounts.sort((a, b) => b.toplam - a.toplam);
  }, [appointments, trainers]);

  const hoursData = useMemo(() => {
    // Eğer veri yoksa boş dizi döndür
    if (!appointments.length || !trainers.length || !services.length) {
      return [];
    }

    // Hizmet ID'lerine göre süre bilgilerini içeren bir harita oluştur
    const serviceDurations = services.reduce((acc, service) => {
      acc[service.id] = service.duration;
      return acc;
    }, {} as Record<string, number>);

    // Her antrenör için toplam ders saatini hesapla
    const trainerHourData = trainers.map((trainer) => {
      const trainerAppointments = appointments.filter(
        (appointment) => appointment.trainer_id === trainer.id
      );
      
      // Tamamlanan, planlanan ve iptal edilen randevular için ayrı hesaplamalar
      const completedAppointments = trainerAppointments.filter(
        (appointment) => appointment.status === "completed"
      );
      
      const scheduledAppointments = trainerAppointments.filter(
        (appointment) => appointment.status === "scheduled"
      );
      
      // Toplam ders saatlerini hesapla (dakika cinsinden)
      const completedMinutes = completedAppointments.reduce((total, appointment) => {
        const duration = serviceDurations[appointment.service_id] || 0;
        return total + duration;
      }, 0);
      
      const scheduledMinutes = scheduledAppointments.reduce((total, appointment) => {
        const duration = serviceDurations[appointment.service_id] || 0;
        return total + duration;
      }, 0);
      
      // Dakikaları saate çevir (1 ondalık basamak hassasiyetle)
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

    // Toplam ders saatine göre sırala (çoktan aza)
    return trainerHourData.sort((a, b) => b.toplam - a.toplam);
  }, [appointments, trainers, services]);

  if ((!classCountData.length && activeTab === "count") || (!hoursData.length && activeTab === "hours")) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Antrenör Performansı</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-[300px]">
          <p className="text-muted-foreground">Görüntülenecek veri bulunamadı</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Antrenör Performansı</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "count" | "hours")}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="count">Ders Sayısı</TabsTrigger>
            <TabsTrigger value="hours">Ders Saati</TabsTrigger>
          </TabsList>
          
          <TabsContent value="count">
            <div className="rounded-md border">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[200px]">Antrenör</TableHead>
                    <TableHead className="text-center bg-green-50">Tamamlanan</TableHead>
                    <TableHead className="text-center bg-blue-50">Planlanan</TableHead>
                    <TableHead className="text-center bg-red-50">İptal Edilen</TableHead>
                    <TableHead className="text-center bg-gray-100">Toplam</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classCountData.map((trainer) => (
                    <TableRow key={trainer.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{trainer.name}</TableCell>
                      <TableCell className="text-center text-green-600 font-medium">{trainer.tamamlanan}</TableCell>
                      <TableCell className="text-center text-blue-600 font-medium">{trainer.planlanan}</TableCell>
                      <TableCell className="text-center text-red-600 font-medium">{trainer.iptal}</TableCell>
                      <TableCell className="text-center font-semibold bg-gray-50">{trainer.toplam}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          <TabsContent value="hours">
            <div className="rounded-md border">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[200px]">Antrenör</TableHead>
                    <TableHead className="text-center bg-green-50">Tamamlanan (Saat)</TableHead>
                    <TableHead className="text-center bg-blue-50">Planlanan (Saat)</TableHead>
                    <TableHead className="text-center bg-gray-100">Toplam (Saat)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hoursData.map((trainer) => (
                    <TableRow key={trainer.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{trainer.name}</TableCell>
                      <TableCell className="text-center text-green-600 font-medium">{trainer.tamamlanan}</TableCell>
                      <TableCell className="text-center text-blue-600 font-medium">{trainer.planlanan}</TableCell>
                      <TableCell className="text-center font-semibold bg-gray-50">{trainer.toplam}</TableCell>
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
