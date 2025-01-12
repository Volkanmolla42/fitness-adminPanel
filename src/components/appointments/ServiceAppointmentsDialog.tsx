import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Appointment, Member, Service } from "@/types/appointments";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ServiceAppointmentsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service;
  appointments: Appointment[];
  members: Member[];
}

export function ServiceAppointmentsDialog({
  isOpen,
  onClose,
  service,
  appointments,
  members,
}: ServiceAppointmentsDialogProps) {
  const getMemberName = (memberId: string) => {
    const member = members.find((m) => m.id === memberId);
    return member ? `${member.first_name} ${member.last_name}` : "";
  };

  // Randevuları tarihe göre sırala
  const sortedAppointments = [...appointments].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}`);
    const dateB = new Date(`${b.date}T${b.time}`);
    return dateA.getTime() - dateB.getTime();
  });

  // Randevuları tarihe göre grupla
  const groupedAppointments = sortedAppointments.reduce((acc, appointment) => {
    const date = appointment.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(appointment);
    return acc;
  }, {} as Record<string, Appointment[]>);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>{service.name}</span>
              <span className="text-sm text-muted-foreground">
                ({appointments.length} Randevu)
              </span>
            </div>
            {service.max_participants > 1 && (
              <span className="text-xs px-2 py-1 rounded-full bg-muted">
                Maks. {service.max_participants} Kişi
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4">
            {Object.entries(groupedAppointments).map(([date, dayAppointments]) => (
              <div key={date} className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  {format(new Date(date), "d MMMM yyyy, EEEE", { locale: tr })}
                </h3>
                <div className="space-y-1">
                  {dayAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className={`p-3 rounded-lg text-sm ${
                        service.isVipOnly
                          ? "bg-purple-50"
                          : "bg-blue-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {getMemberName(appointment.member_id)}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-white/80 text-muted-foreground">
                          {appointment.time.substring(0, 5)}
                        </span>
                      </div>
                      {appointment.notes && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {appointment.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
