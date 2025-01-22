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
import { useToast } from "@/components/ui/use-toast";
import { Calendar, DollarSign, TrendingUp, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Type Definitions
type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
type Member = Database["public"]["Tables"]["members"]["Row"];
type Service = Database["public"]["Tables"]["services"]["Row"];
type Trainer = Database["public"]["Tables"]["trainers"]["Row"];

interface Stats {
  activeMembers: number;
  todayAppointments: number;
  monthlyRevenue: number;
  revenueGrowthRate: string;
  memberGrowthRate: string;
}

// Custom hook for error handling - moved outside component
const useErrorHandler = (error: unknown, entityName: string, toast: any) => {
  React.useEffect(() => {
    if (error) {
      toast({
        title: "Hata",
        description: `${entityName} yüklenirken bir hata oluştu.`,
        variant: "destructive",
      });
    }
  }, [error, entityName, toast]);
};

const DashboardPage: React.FC = () => {
  const { toast } = useToast();
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

  // Error handling
  useErrorHandler(appointmentsError, "Randevular", toast);
  useErrorHandler(membersError, "Üyeler", toast);
  useErrorHandler(servicesError, "Paketler", toast);
  useErrorHandler(trainersError, "Eğitmenler", toast);

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
      services: Service[]
    ): Stats => {
      const today = new Date().toISOString().split("T")[0];
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

      const activeMembers = members.length;
      const todayAppointments = appointments.filter(
        (app) =>
          new Date(app.date).toISOString().split("T")[0] === today &&
          app.status === "scheduled"
      ).length;

      const calculateMonthRevenue = (month: number, year: number) =>
        members
          .filter((member) => {
            const startDate = new Date(member.start_date);
            return (
              startDate.getMonth() === month && startDate.getFullYear() === year
            );
          })
          .reduce(
            (sum, member) =>
              sum +
              member.subscribed_services.reduce((serviceSum, serviceId) => {
                const service = services.find((s) => s.id === serviceId);
                return serviceSum + (service?.price || 0);
              }, 0),
            0
          );

      const monthlyRevenue = calculateMonthRevenue(currentMonth, currentYear);
      const previousMonthRevenue = calculateMonthRevenue(
        previousMonth,
        previousYear
      );

      const revenueGrowthRate =
        previousMonthRevenue === 0
          ? monthlyRevenue > 0
            ? "100%"
            : "0%"
          : Number(
              ((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) *
                100
            ).toFixed(1) + "%";

      const currentMonthMembers = members.filter((member) => {
        const joinDate = new Date(member.start_date);
        return (
          joinDate.getMonth() === currentMonth &&
          joinDate.getFullYear() === currentYear
        );
      }).length;

      const previousMonthMembers = members.filter((member) => {
        const joinDate = new Date(member.start_date);
        return (
          joinDate.getMonth() === previousMonth &&
          joinDate.getFullYear() === previousYear
        );
      }).length;

      const memberGrowthRate =
        previousMonthMembers === 0
          ? currentMonthMembers > 0
            ? "100%"
            : "0%"
          : Number(
              ((currentMonthMembers - previousMonthMembers) /
                previousMonthMembers) *
                100
            ).toFixed(1) + "%";

      return {
        activeMembers,
        todayAppointments,
        monthlyRevenue,
        revenueGrowthRate,
        memberGrowthRate,
      };
    },
    []
  );

  const stats = React.useMemo(
    () => calculateStats(members, appointments, services),
    [members, appointments, services, calculateStats]
  );

  const statsForGrid = React.useMemo(
    () => [
      {
        title: "Aktif Üyeler",
        value: stats.activeMembers.toString(),
        icon: <Users className="h-6 w-6 text-primary" />,
        description: `Büyüme: ${stats.memberGrowthRate}`,
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
        description: `Büyüme: ${stats.revenueGrowthRate}`,
      },
      {
        title: "Toplam Randevu",
        value: appointments.length.toString(),
        icon: <TrendingUp className="h-6 w-6 text-primary" />,
        description: "Tüm zamanlar",
      },
    ],
    [stats, appointments.length]
  );

  const isLoading =
    isLoadingAppointments ||
    isLoadingMembers ||
    isLoadingServices ||
    isLoadingTrainers;

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
          services.map((s) => [s.id, { name: s.name }])
        )}
      />
    </div>
  );
};

export default DashboardPage;
