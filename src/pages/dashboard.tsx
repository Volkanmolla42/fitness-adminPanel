import React from "react";
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
import { Calendar, TrendingUp, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

// Type Definitions
type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
type Member = Database["public"]["Tables"]["members"]["Row"];
type Service = Database["public"]["Tables"]["services"]["Row"];
type Trainer = Database["public"]["Tables"]["trainers"]["Row"];

interface Stats {
  activeMembers: number;
  todayAppointments: number;
  monthlyAppointments: number;
  inactiveMembers: number;
}

const DashboardPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Data fetching with react-query
  const {
    data: appointments = [],
    isLoading: isLoadingAppointments,
    error: appointmentsError,
  } = useQuery<Appointment[]>({
    queryKey: ["appointments"],
    queryFn: getAppointments,
  });

  const {
    data: members = [],
    isLoading: isLoadingMembers,
    error: membersError,
  } = useQuery<Member[]>({
    queryKey: ["members"],
    queryFn: getMembers,
  });

  const {
    data: services = [],
    isLoading: isLoadingServices,
    error: servicesError,
  } = useQuery<Service[]>({
    queryKey: ["services"],
    queryFn: getServices,
  });

  const {
    data: trainers = [],
    isLoading: isLoadingTrainers,
    error: trainersError,
  } = useQuery<Trainer[]>({
    queryKey: ["trainers"],
    queryFn: getTrainers,
  });

 

  const errorMessages = {
    appointmentsError: "Randevular yüklenirken bir hata oluştu!",
    membersError: "Üyeler yüklenirken bir hata oluştu!",
    servicesError: "Hizmetler yüklenirken bir hata oluştu!",
    trainersError: "Antrenörler yüklenirken bir hata oluştu!",
  };

  Object.entries({
    appointmentsError,
    membersError,
    servicesError,
    trainersError,
  }).forEach(([key, error]) => {
    if (error) toast.error(errorMessages[key] || error.message);
  });

  // Realtime updates setup
  React.useEffect(() => {
    const tables = ["appointments", "members"];
    const channel = supabase.channel("dashboard");

    tables.forEach((table) => {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => queryClient.invalidateQueries({ queryKey: [table] })
      );
    });

    channel.subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, [queryClient]);

  // Stats calculation
  const calculateStats = React.useCallback(
    (
      members: Member[],
      appointments: Appointment[],
 
    ): Stats => {
      const today = new Date().toISOString().split("T")[0];
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const activeMembers = members.filter(member => member.active === true).length;
      const inactiveMembers = members.filter(member => member.active === false).length;
      const todayAppointments = appointments.filter(
        (app) =>
          new Date(app.date).toISOString().split("T")[0] === today
      ).length;

     

      const monthlyAppointments = appointments.filter(appointment => {
        const appointmentDate = new Date(appointment.date);
        return appointmentDate.getMonth() === currentMonth && appointmentDate.getFullYear() === currentYear;
      }).length;

      return {
        activeMembers,
        todayAppointments,
        monthlyAppointments,
        inactiveMembers,
      };
    },
    []
  );

  const stats = React.useMemo(
    () => calculateStats(members, appointments),
    [members, appointments,calculateStats]
  );

  const statsForGrid = React.useMemo(
    () => [
      {
        title: "Aktif Üyeler",
        value: stats.activeMembers.toString(),
        icon: <Users className="h-6 w-6 text-primary" />,
      },
      
      {
        title: "Pasif Üyeler",
        value: stats.inactiveMembers.toString(),
        icon: <Users className="h-6 w-6 text-muted-foreground" />,
      },
      {
        title: "Günün Randevuları",
        value: stats.todayAppointments.toString(),
        icon: <Calendar className="h-6 w-6 text-primary" />,
      },
      {
        title: "Aylık Randevular",
        value: stats.monthlyAppointments.toString(),
        icon: <TrendingUp className="h-6 w-6 text-primary" />,
      },
    ],
    [stats]
  );

  const isLoading =
    isLoadingAppointments ||
    isLoadingMembers ||
    isLoadingServices ||
    isLoadingTrainers

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 space-y-4">
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8 container mt-4 p-0">
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
        }))}
        members={Object.fromEntries(
          members.map((m) => [
            m.id,
            { first_name: m.first_name, last_name: m.last_name },
          ])
        )}
        trainers={Object.fromEntries(
          trainers.map((t) => [
            t.id,
            { first_name: t.first_name, last_name: t.last_name },
          ])
        )}
        services={Object.fromEntries(
          services.map((s) => [s.id, { name: s.name, duration: s.duration }])
        )}
      />
    </div>
  );
};

export default DashboardPage;
