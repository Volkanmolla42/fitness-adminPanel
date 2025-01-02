import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle2, XCircle, Pencil, User, UserCog, Briefcase } from "lucide-react";

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
  service: { name: string };
  onStatusChange: (id: string, status: Appointment["status"]) => void;
  onEdit: (appointment: Appointment) => void;
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

const getRemainingTime = (startTime: string) => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTotalMinutes = currentHour * 60 + currentMinute;

  const [startHour, startMinute] = startTime.split(':').map(Number);
  const startTotalMinutes = startHour * 60 + startMinute;
  
  // Assuming 60 minutes duration
  const endTotalMinutes = startTotalMinutes + 60;
  const remainingMinutes = endTotalMinutes - currentTotalMinutes;
  
  return remainingMinutes;
};

const AppointmentCard = ({
  appointment,
  member,
  trainer,
  service,
  onStatusChange,
  onEdit,
}: AppointmentCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<
    Appointment["status"] | null
  >(null);

  const handleChangeStatus = (status: Appointment["status"]) => {
    setPendingStatus(status);
    setIsModalOpen(true);
  };

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
                  {new Date(appointment.date).toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'long'
                  })}
                </span>
                {appointment.status === "in-progress" && (
                  <span className="text-sm font-medium text-yellow-600 mt-1">
                    <Clock className="h-3 w-3 inline-block mr-1" />
                    {(() => {
                      const remainingMinutes = getRemainingTime(appointment.time);
                      return remainingMinutes > 0 
                        ? `${remainingMinutes} dakika kaldı`
                        : 'Randevu süresi doldu';
                    })()}
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
          <div className="flex flex-col sm:flex-row gap-2 mt-2 pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(appointment)}
              className="flex-1 p-2"
            >
              <Pencil className="mr-2 h-4 w-4" />
              Düzenle
            </Button>

            {appointment.status === "scheduled" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleChangeStatus("in-progress")}
                  className="flex-1 p-2 text-blue-600 hover:text-blue-700"
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Başlat
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleChangeStatus("cancelled")}
                  className="flex-1 text-red-600 hover:text-red-700 p-2"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  İptal Et
                </Button>
              </>
            )}

            {appointment.status === "in-progress" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleChangeStatus("completed")}
                className="flex-1 text-green-600 hover:text-green-700 p-2"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Tamamla
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogTitle>Eylemi Onayla</DialogTitle>
          <DialogDescription>
            Bu randevuyu{" "}{pendingStatus === "completed" ? "tamamlamak" : pendingStatus === "cancelled" ? "iptal etmek" : "başlatmak"}{" "}istediğinize emin misiniz?
          </DialogDescription>
          <Button
            onClick={() => {
              if (pendingStatus) {
                onStatusChange(appointment.id, pendingStatus);
              }
              setIsModalOpen(false);
            }}
          >
            Evet
          </Button>
          <Button onClick={() => setIsModalOpen(false)}>Hayır</Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AppointmentCard;
