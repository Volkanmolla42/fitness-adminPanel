import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import {
  getAppointments,
  getMembers,
  getTrainers,
  getServices,
  updateAppointment,
} from "@/lib/queries";
import {
  Appointment,
  Member,
  Trainer,
  Service,
  FilterType,
} from "@/types/appointments";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";

type Database = {
  public: {
    Tables: {
      appointments: {
        Row: Appointment;
      };
      members: {
        Row: Member;
      };
      trainers: {
        Row: Trainer;
      };
      services: {
        Row: Service;
      };
    };
  };
};

export const useAppointments = () => {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrainerId, setSelectedTrainerId] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [activeNotifications, setActiveNotifications] = useState<
    Array<{ id: string; message: string }>
  >([]);
  const [acknowledgedNotifications, setAcknowledgedNotifications] = useState<
    Set<string>
  >(() => {
    const saved = localStorage.getItem("acknowledgedNotifications");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // Helper functions
  const getFilteredCount = (filter: FilterType) => {
    const now = new Date();
    return appointments.filter((appointment) => {
      const appointmentDate = new Date(appointment.date);
      switch (filter) {
        case "all":
          return true;
        case "daily":
          return (
            appointmentDate >= startOfDay(now) &&
            appointmentDate <= endOfDay(now)
          );
        case "weekly":
          return (
            appointmentDate >= startOfWeek(now) &&
            appointmentDate <= endOfWeek(now)
          );
        case "monthly":
          return (
            appointmentDate >= startOfMonth(now) &&
            appointmentDate <= endOfMonth(now)
          );
      }
    }).length;
  };

  // Data fetching
  const fetchData = async () => {
    try {
      const [appointmentsData, membersData, trainersData, servicesData] =
        await Promise.all([
          getAppointments(),
          getMembers(),
          getTrainers(),
          getServices(),
        ]);

      setAppointments(appointmentsData);
      setMembers(membersData);
      setTrainers(trainersData);
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

  // Realtime subscription setup
  const setupRealtimeSubscription = () => {
    supabase
      .channel("appointments")
      .on(
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
                  : appointment
              )
            );
          } else if (payload.eventType === "DELETE") {
            setAppointments((prev) =>
              prev.filter((appointment) => appointment.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();
  };

  // Filtered appointments
  const filteredAppointments = useMemo(() => {
    let filtered = [...appointments];

    // Filter by trainer
    if (selectedTrainerId) {
      filtered = filtered.filter(
        (appointment) => appointment.trainer_id === selectedTrainerId
      );
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((appointment) => {
        const member = members.find((m) => m.id === appointment.member_id);
        const trainer = trainers.find((t) => t.id === appointment.trainer_id);
        const service = services.find((s) => s.id === appointment.service_id);

        return (
          `${member?.first_name} ${member?.last_name}`
            .toLowerCase()
            .includes(query) ||
          `${trainer?.first_name} ${trainer?.last_name}`
            .toLowerCase()
            .includes(query) ||
          service?.name.toLowerCase().includes(query)
        );
      });
    }

    // Filter by date
    const now = new Date();
    if (activeFilter === "daily") {
      filtered = filtered.filter(
        (appointment) =>
          new Date(appointment.date) >= startOfDay(now) &&
          new Date(appointment.date) <= endOfDay(now)
      );
    } else if (activeFilter === "weekly") {
      filtered = filtered.filter(
        (appointment) =>
          new Date(appointment.date) >= startOfWeek(now) &&
          new Date(appointment.date) <= endOfWeek(now)
      );
    } else if (activeFilter === "monthly") {
      filtered = filtered.filter(
        (appointment) =>
          new Date(appointment.date) >= startOfMonth(now) &&
          new Date(appointment.date) <= endOfMonth(now)
      );
    }

    // Sort appointments based on status and date
    filtered.sort((a, b) => {
      // If both appointments have the same status, sort by date
      if (a.status === b.status) {
        const dateTimeA = new Date(`${a.date}T${a.time}`);
        const dateTimeB = new Date(`${b.date}T${b.time}`);
        // For completed appointments, sort in reverse order (newest first)
        return a.status === "completed"
          ? dateTimeB.getTime() - dateTimeA.getTime() // Reverse order for completed
          : dateTimeA.getTime() - dateTimeB.getTime(); // Normal order for others
      }

      // If different status, maintain existing order priority
      const statusOrder = {
        scheduled: 0,
        "in-progress": 1,
        completed: 2,
        cancelled: 3,
      };
      return (
        (statusOrder[a.status as keyof typeof statusOrder] || 0) -
        (statusOrder[b.status as keyof typeof statusOrder] || 0)
      );
    });

    return filtered;
  }, [
    appointments,
    searchQuery,
    activeFilter,
    selectedTrainerId,
    members,
    trainers,
    services,
  ]);

  // Grouped appointments
  const groupedAppointments = useMemo(() => {
    const groups = filteredAppointments.reduce((acc, appointment) => {
      const status = appointment.status;
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(appointment);
      return acc;
    }, {} as Record<string, Appointment[]>);

    return groups;
  }, [filteredAppointments]);

  // Appointment status management
  const updateAppointmentStatus = async (
    appointmentId: string,
    newStatus: string
  ) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: newStatus })
        .eq("id", appointmentId);

      if (error) throw error;

      setAppointments((prev) =>
        prev.map((apt) =>
          apt.id === appointmentId ? { ...apt, status: newStatus } : apt
        )
      );

      toast({
        title: "Randevu durumu güncellendi",
        description: `Randevu durumu "${newStatus}" olarak değiştirildi.`,
      });
    } catch (error) {
      console.error("Error updating appointment status:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Randevu durumu güncellenirken bir hata oluştu.",
      });
    }
  };

  // Effects
  useEffect(() => {
    fetchData();
    setupRealtimeSubscription();
    return () => {
      supabase.channel("appointments").unsubscribe();
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const checkAppointments = async () => {
      const now = new Date();

      for (const appointment of appointments) {
        const appointmentDateTime = new Date(
          `${appointment.date}T${appointment.time}`
        );
        const service = services.find((s) => s.id === appointment.service_id);
        const appointmentEndTime = new Date(
          appointmentDateTime.getTime() + (service?.duration || 60) * 60000
        );

        // If appointment time has arrived and status is still 'scheduled'
        if (
          now >= appointmentDateTime &&
          now < appointmentEndTime &&
          appointment.status === "scheduled"
        ) {
          await updateAppointmentStatus(appointment.id, "in-progress");
        }

        // If appointment end time has passed and status is still 'in-progress'
        if (now >= appointmentEndTime && appointment.status === "in-progress") {
          await updateAppointmentStatus(appointment.id, "completed");
        }
      }
    };

    // Check every minute
    const statusUpdateTimer = setInterval(checkAppointments, 60000);
    // Also check immediately on component mount or when appointments change
    checkAppointments();

    return () => clearInterval(statusUpdateTimer);
  }, [appointments, currentTime, services]);

  useEffect(() => {
    localStorage.setItem(
      "acknowledgedNotifications",
      JSON.stringify([...acknowledgedNotifications])
    );
  }, [acknowledgedNotifications]);

  return {
    appointments,
    members,
    trainers,
    services,
    searchQuery,
    setSearchQuery,
    selectedTrainerId,
    setSelectedTrainerId,
    isLoading,
    currentTime,
    activeFilter,
    setActiveFilter,
    activeNotifications,
    setActiveNotifications,
    acknowledgedNotifications,
    setAcknowledgedNotifications,
    filteredAppointments,
    groupedAppointments,
    getFilteredCount,
    updateAppointmentStatus,
  };
};

export default useAppointments;
