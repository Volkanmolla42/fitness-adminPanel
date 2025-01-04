import { Database } from "@/types/supabase";
import AppointmentCard from "./AppointmentCard";
import { useState } from "react";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

type Appointment = Database["public"]["Tables"]["appointments"]["Row"];

interface AppointmentListProps {
  appointments: Appointment[];
  members: Record<string, { firstName: string; lastName: string }>;
  trainers: Record<string, { firstName: string; lastName: string }>;
  services: Record<string, { name: string; duration: number }>;
  onStatusChange: (id: string, status: Appointment["status"]) => void;
  onEdit: (appointment: Appointment) => void;
  onDelete: (id: string) => void;
}

type FilterType = "daily" | "weekly" | "monthly";

export function AppointmentList({
  appointments,
  members,
  trainers,
  services,
  onStatusChange,
  onEdit,
  onDelete,
}: AppointmentListProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>("daily");

  const filterAppointments = (appointments: Appointment[]) => {
    const now = new Date();

    const filtered = appointments.filter((appointment) => {
      const appointmentDate = new Date(appointment.date);

      switch (activeFilter) {
        case "daily":
          return appointmentDate >= startOfDay(now) && appointmentDate <= endOfDay(now);
        case "weekly":
          return appointmentDate >= startOfWeek(now) && appointmentDate <= endOfWeek(now);
        case "monthly":
          return appointmentDate >= startOfMonth(now) && appointmentDate <= endOfMonth(now);
        default:
          return true;
      }
    });

    return filtered.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });
  };

  const filteredAppointments = filterAppointments(appointments);

  return (
    <div className="space-y-6">
      <div className="flex space-x-4 border-b">
        <button
          className={`px-4 py-2 ${
            activeFilter === "daily"
              ? "border-b-2 border-blue-500 text-blue-500"
              : "text-gray-500"
          }`}
          onClick={() => setActiveFilter("daily")}
        >
          Günlük Randevular
        </button>
        <button
          className={`px-4 py-2 ${
            activeFilter === "weekly"
              ? "border-b-2 border-blue-500 text-blue-500"
              : "text-gray-500"
          }`}
          onClick={() => setActiveFilter("weekly")}
        >
          Haftalık Randevular
        </button>
        <button
          className={`px-4 py-2 ${
            activeFilter === "monthly"
              ? "border-b-2 border-blue-500 text-blue-500"
              : "text-gray-500"
          }`}
          onClick={() => setActiveFilter("monthly")}
        >
          Aylık Randevular
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredAppointments.map((appointment) => (
          <AppointmentCard
            key={appointment.id}
            appointment={appointment}
            member={members[appointment.member_id]}
            trainer={trainers[appointment.trainer_id]}
            service={services[appointment.service_id]}
            onStatusChange={onStatusChange}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}
