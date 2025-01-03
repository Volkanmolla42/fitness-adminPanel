import { Database } from "@/types/supabase";
import AppointmentCard from "./AppointmentCard";
type Appointment = Database["public"]["Tables"]["appointments"]["Row"];

interface AppointmentListProps {
  appointments: Appointment[];
  members: Record<string, { firstName: string; lastName: string }>;
  trainers: Record<string, { firstName: string; lastName: string }>;
  services: Record<string, { name: string; duration: number }>;
  onStatusChange: (id: string, status: Appointment["status"]) => void;
  onEdit: (appointment: Appointment) => void;
}

export function AppointmentList({
  appointments,
  members,
  trainers,
  services,
  onStatusChange,
  onEdit,
}: AppointmentListProps) {
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {appointments.map((appointment) => (
        <AppointmentCard
          key={appointment.id}
          appointment={appointment}
          member={members[appointment.member_id]}
          trainer={trainers[appointment.trainer_id]}
          service={services[appointment.service_id]}
          onStatusChange={onStatusChange}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}
