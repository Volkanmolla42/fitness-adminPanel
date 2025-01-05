import React, { useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import StatsGrid from "@/components/dashboard/StatsGrid";
import AppointmentsWidget from "@/components/dashboard/AppointmentsWidget";
import { supabase } from "@/lib/supabase";
import {
  getAppointments,
  getMembers,
  getServices,
  getTrainers,
} from "@/lib/queries";
import type { Database } from "@/types/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Calendar, DollarSign, TrendingUp, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Type Definitions
type Appointment = Database["public"]["Tables"]["appointments"]["Row"];


const DashboardPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Utility function for error handling
  const handleError = (title: string, description: string) => {
    toast({ title, description, variant: "destructive" });
  };

  // Fetch data with react-query
  const { data: appointments = [], isLoading: isLoadingAppointments, error: appointmentsError } = useQuery({
    queryKey: ["appointments"],
    queryFn: getAppointments
  });

  useEffect(() => {
    if (appointmentsError) {
      handleError("Hata", "Randevular yüklenirken bir hata oluştu.");
    }
  }, [appointmentsError]);

  const { data: members = [], isLoading: isLoadingMembers, error: membersError } = useQuery({
    queryKey: ["members"],
    queryFn: getMembers
  });

  useEffect(() => {
    if (membersError) {
      handleError("Hata", "Üyeler yüklenirken bir hata oluştu.");
    }
  }, [membersError]);

  const { data: services = [], isLoading: isLoadingServices, error: servicesError } = useQuery({
    queryKey: ["services"],
    queryFn: getServices
  });

  useEffect(() => {
    if (servicesError) {
      handleError("Hata", "Paketler yüklenirken bir hata oluştu.");
    }
  }, [servicesError]);

  const { data: trainers = [], isLoading: isLoadingTrainers, error: trainersError } = useQuery({
    queryKey: ["trainers"],
    queryFn: getTrainers
  });

  useEffect(() => {
    if (trainersError) {
      handleError("Hata", "Eğitmenler yüklenirken bir hata oluştu.");
    }
  }, [trainersError]);

  // Realtime updates with Supabase
  useEffect(() => {
    const channel = supabase.channel("dashboard");

    channel
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments" },
        () => queryClient.invalidateQueries({ queryKey: ["appointments"] })
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "members" },
        () => queryClient.invalidateQueries({ queryKey: ["members"] })
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [queryClient]);

  // Calculate stats
  const stats = useMemo(() => {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD formatı
  
    const activeMembers = members.length;
  
    const todayAppointments = appointments.filter((app) => {
      // app.date'i aynı formata dönüştür
      const appDate = new Date(app.date).toISOString().split("T")[0];
      return appDate === today && app.status === "scheduled";
    }).length;
  
    const monthlyRevenue = appointments
      .filter((app) => {
        const appointmentDate = new Date(app.date);
        const now = new Date();
        return (
          appointmentDate.getMonth() === now.getMonth() &&
          appointmentDate.getFullYear() === now.getFullYear() &&
          app.status === "completed"
        );
      })
      .reduce((sum, app) => {
        const service = services.find((s) => s.id === app.service_id);
        return sum + (service?.price || 0);
      }, 0);
  
    const growthRate = 12.5; // Placeholder, replace with actual calculation logic
  
    return { activeMembers, todayAppointments, monthlyRevenue, growthRate };
  }, [appointments, members, services]);
  
  // Stats for grid
  const statsForGrid = useMemo(() => [
    {
      title: "Aktif Üyeler",
      value: stats.activeMembers.toString(),
      icon: <Users className="h-6 w-6 text-primary" />,
      description: "Toplam aktif spor salonu üyeleri",
    },
    {
      title: "Günün Randevuları",
      value: stats.todayAppointments.toString(),
      icon: <Calendar className="h-6 w-6 text-primary" />,
      description: "Bugün için planlanan",
    },
    {
      title: "Aylık Gelir",
      value: `₺${stats.monthlyRevenue.toLocaleString("tr-TR")}`,
      icon: <DollarSign className="h-6 w-6 text-primary" />,
      description: "Bu ayki gelir",
    },
    {
      title: "Büyüme Oranı",
      value: `%${stats.growthRate}`,
      icon: <TrendingUp className="h-6 w-6 text-primary" />,
      description: "Geçen aya göre",
    },
  ], [stats]);

  const isLoading = isLoadingAppointments || isLoadingMembers || isLoadingServices || isLoadingTrainers;

  // Loading State
  if (isLoading) {
    return (
      <div className="container mx-auto p-4 space-y-4">
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  // Render Dashboard
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Panel</h1>
        <p className="text-muted-foreground mt-2">
          Spor merkezi panelinize hoş geldiniz
        </p>
      </div>

      <StatsGrid stats={statsForGrid} />

      <AppointmentsWidget
        appointments={appointments.map((appointment) => ({
          ...appointment,
          memberId: appointment.member_id,
          trainerId: appointment.trainer_id,
          serviceId: appointment.service_id,
        })) as Appointment[]}
        members={members.reduce((acc, member) => {
          acc[member.id] = {
            first_name: member.first_name,
            last_name: member.last_name,
          };
          return acc;
        }, {} as Record<string, { first_name: string; last_name: string }>)}
        trainers={trainers.reduce((acc, trainer) => {
          acc[trainer.id] = {
            first_name: trainer.first_name,
            last_name: trainer.last_name,
          };
          return acc;
        }, {} as Record<string, { first_name: string; last_name: string }>)}
        services={services.reduce((acc, service) => {
          acc[service.id] = { name: service.name };
          return acc;
        }, {} as Record<string, { name: string }>)}
      />
    </div>
  );
};

export default DashboardPage;
