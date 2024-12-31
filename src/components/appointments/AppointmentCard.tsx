import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle2, XCircle, Pencil } from "lucide-react";
import { Appointment } from "@/types/appointment";
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
  trainer: { name: string };
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
      <Card className="p-4 w-full">
        <div className="flex flex-col space-y-4">
          {/* Header with time and status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-base sm:text-lg font-semibold">
                {appointment.time}
              </span>
            </div>
            <Badge
              className={`${getStatusColor(
                appointment.status
              )} text-xs sm:text-sm`}
            >
              {getStatusText(appointment.status)}
            </Badge>
          </div>

          {/* Details */}
          <div className="space-y-2 text-sm sm:text-base">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="font-medium min-w-[80px]">Üye:</span>
              <span className="text-gray-700">{`${member.firstName} ${member.lastName}`}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="font-medium min-w-[80px]">Eğitmen:</span>
              <span className="text-gray-700">{trainer.name}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="font-medium min-w-[80px]">Hizmet:</span>
              <span className="text-gray-700">{service.name}</span>
            </div>
            {appointment.notes && (
              <p className="text-sm text-gray-600 mt-2 break-words">
                {appointment.notes}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 mt-2">
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
                  className="flex-1 p-2"
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
            Bu randevuyu{" "}
            {pendingStatus === "completed"
              ? "tamamlamak"
              : pendingStatus === "cancelled"
              ? "iptal etmek"
              : "başlatmak"}{" "}
            istediğinize emin misiniz?
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
