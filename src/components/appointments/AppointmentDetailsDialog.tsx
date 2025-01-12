import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Appointment, Member, Service } from "@/types/appointments";

interface AppointmentDetailsDialogProps {
  appointment: Appointment | null;
  appointments: Appointment[];
  members: Member[];
  services: Service[];
  isOpen: boolean;
  onClose: () => void;
}

const AppointmentDetailsDialog: React.FC<AppointmentDetailsDialogProps> = ({
  appointment,
  appointments,
  members,
  services,
  isOpen,
  onClose,
}) => {
  if (!appointment) return null;

  const member = members.find((m) => m.id === appointment.member_id);
  const service = services.find((s) => s.id === appointment.service_id);

  // Aynı üye ve hizmete ait tüm randevuları bul
  const relatedAppointments = appointments.filter(
    (apt) => 
      apt.member_id === appointment.member_id && 
      apt.service_id === appointment.service_id
  ).sort((a, b) => {
    // Tarihe göre sırala
    const dateA = new Date(a.date + "T" + a.time);
    const dateB = new Date(b.date + "T" + b.time);
    return dateA.getTime() - dateB.getTime();
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("tr-TR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "scheduled": return "Planlandı";
      case "completed": return "Tamamlandı";
      case "cancelled": return "İptal Edildi";
      case "in-progress": return "Devam Ediyor";
      default: return status;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Randevu Detayları</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground">Üye</h4>
            <p className="text-lg font-semibold">
              {member ? `${member.first_name} ${member.last_name}` : "Belirtilmemiş"}
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground">Hizmet</h4>
            <p className="text-lg font-semibold">
              {service ? service.name : "Belirtilmemiş"}
            </p>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground">Tüm Randevular</h4>
            <div className="space-y-3">
              {relatedAppointments.map((apt) => (
                <div 
                  key={apt.id}
                  className={`p-4 rounded-lg ${
                    apt.id === appointment.id ? "bg-blue-50 border border-blue-200" : "bg-gray-50"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{formatDate(apt.date)}</div>
                      <div className="text-sm text-muted-foreground">{formatTime(apt.time)}</div>
                    </div>
                    <div className={`px-2 py-1 rounded text-sm ${
                      apt.status === "completed" ? "bg-green-100 text-green-700" :
                      apt.status === "in-progress" ? "bg-yellow-100 text-yellow-700" :
                      apt.status === "cancelled" ? "bg-red-100 text-red-700" :
                      "bg-blue-100 text-blue-700"
                    }`}>
                      {getStatusText(apt.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentDetailsDialog;
