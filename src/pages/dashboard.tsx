import React, { useEffect, useState } from "react";
import StatsGrid from "@/components/dashboard/StatsGrid";
import AppointmentsWidget from "@/components/dashboard/AppointmentsWidget";
import RevenueChart from "@/components/dashboard/RevenueChart";
import { supabase } from "@/lib/supabase";
import { getAppointments, getMembers, getServices } from "@/lib/queries";
import type { Database } from "@/types/supabase";
import { useToast } from "@/components/ui/use-toast";

type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
type Member = Database["public"]["Tables"]["members"]["Row"];
type Service = Database["public"]["Tables"]["services"]["Row"];

const DashboardPage = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    fetchData();
    setupRealtimeSubscription();
    return () => {
      supabase.channel("dashboard").unsubscribe();
    };
  }, []);

  const fetchData = async () => {
    try {
      const [appointmentsData, membersData, servicesData] = await Promise.all([
        getAppointments(),
        getMembers(),
        getServices(),
      ]);

      setAppointments(appointmentsData);
      setMembers(membersData);
      setServices(servicesData);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Veriler yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase.channel("dashboard");

    // Appointments subscription
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "appointments" },
      (payload) => {
        if (payload.eventType === "INSERT") {
          setAppointments((prev) => [payload.new as Appointment, ...prev]);
        } else if (payload.eventType === "UPDATE") {
          setAppointments((prev) =>
            prev.map((appointment) =>
              appointment.id === payload.new.id
                ? (payload.new as Appointment)
                : appointment,
            ),
          );
        } else if (payload.eventType === "DELETE") {
          setAppointments((prev) =>
            prev.filter((appointment) => appointment.id !== payload.old.id),
          );
        }
      },
    );

    // Members subscription
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "members" },
      (payload) => {
        if (payload.eventType === "INSERT") {
          setMembers((prev) => [payload.new as Member, ...prev]);
        } else if (payload.eventType === "DELETE") {
          setMembers((prev) =>
            prev.filter((member) => member.id !== payload.old.id),
          );
        }
      },
    );

    channel.subscribe();
  };

  // Calculate stats
  const stats = {
    activeMembers: members.length,
    todayAppointments: appointments.filter(
      (app) => app.date === new Date().toISOString().split("T")[0],
    ).length,
    monthlyRevenue: appointments
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
      }, 0),
    growthRate: 12.5, // Bu değeri önceki aya göre hesaplayabiliriz
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Panel</h1>
        <p className="text-muted-foreground mt-2">
          Spor merkezi panelinize hoş geldiniz
        </p>
      </div>

      <StatsGrid
        stats={[
          {
            title: "Aktif Üyeler",
            value: stats.activeMembers.toString(),
            icon: "users",
            description: "Toplam aktif spor salonu üyeleri",
          },
          {
            title: "Günün Randevuları",
            value: stats.todayAppointments.toString(),
            icon: "calendar",
            description: "Bugün için planlanan",
          },
          {
            title: "Aylık Gelir",
            value: `₺${stats.monthlyRevenue.toLocaleString("tr-TR")}`,
            icon: "dollar",
            description: "Bu ayki gelir",
          },
          {
            title: "Büyüme Oranı",
            value: `%${stats.growthRate}`,
            icon: "trending-up",
            description: "Geçen aya göre",
          },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <AppointmentsWidget appointments={appointments} />
        <RevenueChart />
      </div>
    </div>
  );
};

export default DashboardPage;
