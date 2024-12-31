import AppointmentCard from "./AppointmentCard";
import { Appointment } from "@/types/appointment";

interface AppointmentListProps {
  appointments: Appointment[];
  members: Record<string, { firstName: string; lastName: string }>;
  trainers: Record<string, { name: string }>;
  services: Record<string, { name: string }>;
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
          member={members[appointment.memberId]}
          trainer={trainers[appointment.trainerId]}
          service={services[appointment.serviceId]}
          onStatusChange={onStatusChange}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}
