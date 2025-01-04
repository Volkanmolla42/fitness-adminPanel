import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle2, Pencil, User, UserCog, Briefcase, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

import { Database } from "@/types/supabase";
type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface AppointmentCardProps {
  appointment: Appointment;
  member: {
    firstName: string;
    lastName: string;
  };
  trainer: {
    firstName: string;
    lastName: string;
  };
  service: { 
    name: string;
    duration: number;  
  };
  onStatusChange: (id: string, status: Appointment["status"]) => void;
  onEdit: (appointment: Appointment) => void;
  onDelete: (id: string) => void;
}

const getStatusColor = (status: Appointment["status"]) => {
  switch (status) {
    case "scheduled":
      return "bg-blue-500";
    case "in-progress":
      return "bg-yellow-500";
    case "completed":
      return "bg-green-500";
    case "cancelled":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
};

const getStatusText = (status: Appointment["status"]) => {
  switch (status) {
    case "scheduled":
      return "Planlandı";
    case "in-progress":
      return "Devam Ediyor";
    case "completed":
      return "Tamamlandı";
    case "cancelled":
      return "İptal Edildi";
    default:
      return status;
  }
};

const getRemainingTime = (startTime: string, startDate: string, duration: number, status: string) => {
  const now = new Date();
  const [hours, minutes] = startTime.split(':').map(Number);
  
  if (status === "in-progress") {
    // Eğer randevu devam ediyorsa, servis süresinden kalan dakikayı hesapla
    const appointmentStart = new Date(startDate);
    appointmentStart.setHours(hours, minutes, 0, 0);
    
    // Eğer başlangıç saati henüz gelmediyse ama randevu başlatıldıysa,
    // kalan süreyi direkt olarak servis süresi olarak al
    if (now < appointmentStart) {
      return duration;
    }
    
    const elapsedMinutes = Math.floor((now.getTime() - appointmentStart.getTime()) / (1000 * 60));
    return Math.max(0, duration - elapsedMinutes);
  } else {
    // Randevu henüz başlamadıysa, normal başlangıç saatine göre hesapla
    const appointmentStart = new Date(startDate);
    appointmentStart.setHours(hours, minutes, 0, 0);
    
    const appointmentEnd = new Date(appointmentStart.getTime());
    appointmentEnd.setMinutes(appointmentStart.getMinutes() + duration);
    
    const remainingMs = appointmentEnd.getTime() - now.getTime();
    return Math.floor(remainingMs / (1000 * 60));
  }
};

const AppointmentCard = ({
  appointment,
  member,
  trainer,
  service,
  onStatusChange,
  onEdit,
  onDelete,
}: AppointmentCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<
    Appointment["status"] | null
  >(null);

  const handleChangeStatus = (status: Appointment["status"]) => {
    setPendingStatus(status);
    setIsModalOpen(true);
  };

  const handleDelete = () => {
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    onDelete(appointment.id);
    setIsDeleteModalOpen(false);
  };

  const weekDay = format(new Date(appointment.date), "EEEE", { locale: tr });

  return (
    <>
      <Card className="p-4 w-full hover:shadow-lg transition-shadow duration-200">
        <div className="flex flex-col space-y-4">
          {/* Header with time and status */}
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-2 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-blue-600">
                  {appointment.time.slice(0, 5)}
                </span>
                <span className="text-sm text-gray-500">
                {format(new Date(appointment.date), "d MMMM", { locale: tr })} - {weekDay}
                </span>
                {appointment.status === "in-progress" && (
                  <span className="text-sm font-medium text-yellow-600 mt-1">
                    <Clock className="h-3 w-3 inline-block mr-1" />
                    {getRemainingTime(
                      appointment.time,
                      appointment.date,
                      service.duration,
                      appointment.status
                    )} dakika kaldı
                  </span>
                )}
              </div>
            </div>
            <Badge
              className={`${getStatusColor(
                appointment.status
              )} text-sm px-3 py-1`}
            >
              {getStatusText(appointment.status)}
            </Badge>
          </div>

          {/* Details */}
          <div className="space-y-3 text-sm sm:text-base">
            <div className="flex items-center gap-3">
              <div className="bg-purple-50 p-2 rounded-lg">
                <User className="h-4 w-4 text-purple-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-gray-500 text-sm">Üye</span>
                <span className="font-medium">{`${member.firstName} ${member.lastName}`}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-green-50 p-2 rounded-lg">
                <UserCog className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-gray-500 text-sm">Eğitmen</span>
                <span className="font-medium">{`${trainer.firstName} ${trainer.lastName}`}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-orange-50 p-2 rounded-lg">
                <Briefcase className="h-4 w-4 text-orange-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-gray-500 text-sm">Hizmet</span>
                <span className="font-medium">{service.name}</span>
              </div>
            </div>

            {appointment.notes && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 break-words">
                  {appointment.notes}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 mt-4">
            {appointment.status === "scheduled" && (
              <>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full h-8 text-md font-medium text-yellow-600 border-2 border-yellow-600 hover:bg-yellow-50"
                  onClick={() => handleChangeStatus("in-progress")}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Başlat
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="h-8 text-blue-600 border-2 border-blue-600 hover:bg-blue-50"
                    onClick={() => onEdit(appointment)}
                  >
                    <Pencil className="w-5 h-5 mr-2" />
                    Düzenle
                  </Button>
                  <Button
                    variant="outline"
                    className="h-8 text-red-600 border-2 border-red-600 hover:bg-red-50"
                    onClick={handleDelete}
                  >
                    <Trash2 className="w-5 h-5 mr-2" />
                    Sil
                  </Button>
                </div>
              </>
            )}
            {appointment.status === "in-progress" && (
              <>
                <Button
                  variant="outline"
                  className="w-full h-8 text-md font-medium text-green-600 border-2 border-green-600 hover:bg-green-50"
                  onClick={() => handleChangeStatus("completed")}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Tamamla
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="h-8 text-blue-600 border-2 border-blue-600 hover:bg-blue-50"
                    onClick={() => onEdit(appointment)}
                  >
                    <Pencil className="w-5 h-5 mr-2" />
                    Düzenle
                  </Button>
                  <Button
                    variant="outline"
                    className="h-8 text-red-600 border-2 border-red-600 hover:bg-red-50"
                    onClick={handleDelete}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Sil
                  </Button>
                </div>
              </>
            )}
            {(appointment.status === "completed" || appointment.status === "cancelled") && (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="h-8 text-blue-600 border-2 border-blue-600 hover:bg-blue-50"
                  onClick={() => onEdit(appointment)}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Düzenle
                </Button>
                <Button
                  variant="outline"
                  className="h-8 text-red-600 border-2 border-red-600 hover:bg-red-50"
                  onClick={handleDelete}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Sil
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Status Change Confirmation Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden">
          <div className="p-6">
            <DialogTitle className="text-center mb-2">Eylemi Onayla</DialogTitle>
            <DialogDescription className="text-center">
              {pendingStatus === "in-progress"
                ? "Bu randevuyu başlatmak istediğinize emin misiniz?"
                : pendingStatus === "completed"
                ? "Bu randevuyu tamamlamak istediğinize emin misiniz?"
                : "Bu işlemi yapmak istediğinize emin misiniz?"}
            </DialogDescription>
          </div>
          <div className="flex flex-col gap-2 p-4 bg-gray-50/90">
            <Button
              className="w-full bg-yellow-500 text-white hover:bg-yellow-600"
              onClick={() => {
                onStatusChange(appointment.id, pendingStatus!);
                setIsModalOpen(false);
              }}
            >
              {pendingStatus === "in-progress" ? "Başlat" : "Tamamla"}
            </Button>
            <Button
              variant="outline"
              className="w-full border-2"
              onClick={() => setIsModalOpen(false)}
            >
              İptal Et
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden">
          <div className="p-6">
            <DialogTitle className="text-center mb-2">Eylemi Onayla</DialogTitle>
            <DialogDescription className="text-center">
              Bu randevuyu silmek istediğinize emin misiniz?
            </DialogDescription>
          </div>
          <div className="flex flex-col gap-2 p-4 bg-gray-50/90">
            <Button
              className="w-full bg-red-600 text-white hover:bg-red-700"
              onClick={confirmDelete}
            >
              Sil
            </Button>
            <Button
              variant="outline"
              className="w-full border-2"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              İptal Et
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AppointmentCard;
