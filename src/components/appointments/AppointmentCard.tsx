import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  CheckCircle2, 
  Pencil, 
  User, 
  UserCog, 
  Briefcase, 
  Trash2,
  Calendar,
  AlertCircle,
  ChevronDown,
  Timer,
  Dumbbell,
  Package
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface AppointmentCardProps {
  appointment: {
    id: string;
    date: string;
    time: string;
    status: string;
    notes?: string;
  };
  member: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  trainer: {
    firstName: string;
    lastName: string;
  };
  service: {
    name: string;
    duration: number;
  };
  onStatusChange: (id: string, status: string) => void;
  onEdit: (appointment: any) => void;
  onDelete: (id: string) => void;
}

const getStatusColor = (status: string) => {
  const colors = {
    scheduled: "bg-blue-500",
    "in-progress": "bg-yellow-500",
    completed: "bg-green-500",
    cancelled: "bg-red-500"
  };
  return colors[status] || "bg-gray-500";
};

const getStatusText = (status: string) => {
  const texts = {
    scheduled: "Planlandı",
    "in-progress": "Devam Ediyor",
    completed: "Tamamlandı",
    cancelled: "İptal Edildi"
  };
  return texts[status] || status;
};

const getRemainingTime = (startTime: string, startDate: string, duration: number, status: string) => {
  const now = new Date();
  const [hours, minutes] = startTime.split(':').map(Number);
  
  if (status === "in-progress") {
    const appointmentStart = new Date(startDate);
    appointmentStart.setHours(hours, minutes, 0, 0);
    
    if (now < appointmentStart) {
      return duration;
    }
    
    const elapsedMinutes = Math.floor((now.getTime() - appointmentStart.getTime()) / (1000 * 60));
    return Math.max(0, duration - elapsedMinutes);
  }
  
  const appointmentStart = new Date(startDate);
  appointmentStart.setHours(hours, minutes, 0, 0);
  const appointmentEnd = new Date(appointmentStart.getTime());
  appointmentEnd.setMinutes(appointmentStart.getMinutes() + duration);
  
  const remainingMs = appointmentEnd.getTime() - now.getTime();
  return Math.floor(remainingMs / (1000 * 60));
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  const handleChangeStatus = (status: string) => {
    setPendingStatus(status);
    setIsModalOpen(true);
  };

  const weekDay = format(new Date(appointment.date), "EEEE", { locale: tr });
  const remainingTime = getRemainingTime(
    appointment.time,
    appointment.date,
    service.duration,
    appointment.status
  );

  const isUpcoming = appointment.status === "scheduled" && remainingTime <= 30;

  return (
    <>
      <Card className="h-max transform transition-all duration-200 hover:shadow-lg">
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <div className="p-4 relative">
            {/* Header */}
            <Badge className={`${getStatusColor(appointment.status)} px-2 py-1  absolute top-4 right-4`}>
              {getStatusText(appointment.status)}
            </Badge>
            <div className="flex  items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-50 p-2 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-bold text-blue-600">
                      {appointment.time.slice(0, 5)}
                    </span>
                    
                  </div>
                  <span className="text-sm text-gray-600">
                    {format(new Date(appointment.date), "d MMMM", { locale: tr })} - {weekDay}
                  </span>
                </div>
              </div>

              <CollapsibleTrigger asChild className="border absolute bottom-2 right-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-9 p-0"
                >
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? "transform rotate-180" : ""}`} />
                </Button>
              </CollapsibleTrigger>
            </div>

            {/* Quick Info */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex flex-col gap-2">
                <div className="flex gap-2 items-center ">
                  {member.avatar ? (
                    <img
                      src={member.avatar}
                      alt={`${member.firstName} ${member.lastName}`}
                      className="w-8 h-8 rounded-full border-2 border-white"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-500" />
                    </div>
                  )}
                  {member.firstName && member.lastName ? (
                    <span>
                      {member.firstName} {member.lastName}
                    </span>
                  ) : (
                    <span> üye adı bulunamadı </span>
                  )}
                </div>
                <div className="flex gap-2 items-center  p-2 rounded-lg">
                    <Package className="h-4 w-4 text-orange-600" />
                    <span> {service.name}</span>
                  </div>
                 
              </div>
              
              {appointment.status === "in-progress" && (
                <div className="flex items-center space-x-1 text-yellow-600">
                  <Timer className="w-4 h-4" />
                  <span className="text-sm font-medium">{remainingTime}dk</span>
                </div>
              )}
              
              {isUpcoming && appointment.status === "scheduled" && (
                <div className="flex items-center space-x-1 text-orange-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Yaklaşıyor</span>
                </div>
              )}
            </div>
          </div>

          {/* Expanded Content */}
          <CollapsibleContent>
            <div className="px-4 pb-4 space-y-2">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="bg-purple-50 p-2 rounded-lg">
                    <User className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Üye</span>
                    <p className="font-medium">{`${member.firstName} ${member.lastName}`}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="bg-green-50 p-2 rounded-lg">
                    <UserCog className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Eğitmen</span>
                    <p className="font-medium">{`${trainer.firstName} ${trainer.lastName}`}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="bg-orange-50 p-2 rounded-lg">
                    <Package className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Paket</span>
                    <p className="font-medium">{service.name}</p>
                    <span className="text-sm text-gray-500">
                      {service.duration} dakika
                    </span>
                  </div>
                </div>
              </div>

              {appointment.notes && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                    {appointment.notes}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2">
                {appointment.status === "scheduled" && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        className="w-full h-9 text-yellow-600 border-2 border-yellow-600 hover:bg-yellow-50"
                        onClick={() => handleChangeStatus("in-progress")}
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        Başlat
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full h-9 text-red-600 border-2 border-red-600 hover:bg-red-50"
                        onClick={() => handleChangeStatus("cancelled")}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        İptal Et
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        className="h-9 text-blue-600 border-2 border-blue-600 hover:bg-blue-50"
                        onClick={() => onEdit(appointment)}
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        Düzenle
                      </Button>
                      <Button
                        variant="outline"
                        className="h-9 text-red-600 border-2 border-red-600 hover:bg-red-50"
                        onClick={() => setIsDeleteModalOpen(true)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Sil
                      </Button>
                    </div>
                  </>
                )}

                {appointment.status === "in-progress" && (
                  <>
                    <Button
                      variant="outline"
                      className="w-full h-9 text-green-600 border-2 border-green-600 hover:bg-green-50"
                      onClick={() => handleChangeStatus("completed")}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Tamamla
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        className="h-9 text-blue-600 border-2 border-blue-600 hover:bg-blue-50"
                        onClick={() => onEdit(appointment)}
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        Düzenle
                      </Button>
                      <Button
                        variant="outline"
                        className="h-9 text-red-600 border-2 border-red-600 hover:bg-red-50"
                        onClick={() => setIsDeleteModalOpen(true)}
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
                      className="h-9 text-blue-600 border-2 border-blue-600 hover:bg-blue-50"
                      onClick={() => onEdit(appointment)}
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Düzenle
                    </Button>
                    <Button
                      variant="outline"
                      className="h-9 text-red-600 border-2 border-red-600 hover:bg-red-50"
                      onClick={() => setIsDeleteModalOpen(true)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Sil
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Status Change Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px] p-0">
          <div className="p-6">
            <DialogTitle className="text-xl font-semibold text-center mb-2">
              Eylemi Onayla
            </DialogTitle>
            <DialogDescription className="text-center">
              {pendingStatus === "in-progress"
                ? "Bu randevuyu başlatmak istediğinize emin misiniz?"
                : pendingStatus === "completed"
                ? "Bu randevuyu tamamlamak istediğinize"
                : "Bu randevuyu iptal etmek istediğinize emin misiniz?"}
                </DialogDescription>
                <div className="mt-4 flex justify-center space-x-4">
                  <Button
                    variant="outline"
                    className="w-full h-9 text-gray-600 border-2 border-gray-600 hover:bg-gray-50"
                    onClick={() => setIsModalOpen(false)}
                  >
                    İptal
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full h-9 text-green-600 border-2 border-green-600 hover:bg-green-50"
                    onClick={() => {
                      setIsModalOpen(false);
                      if (pendingStatus) {
                        onStatusChange(appointment.id, pendingStatus);
                        setPendingStatus(null);
                      }
                    }}
                  >
                    Onayla
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
    
          {/* Delete Confirmation Modal */}
          <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
            <DialogContent className="sm:max-w-[425px] p-0">
              <div className="p-6">
                <DialogTitle className="text-xl font-semibold text-center mb-2">
                  Silme İşlemi
                </DialogTitle>
                <DialogDescription className="text-center">
                  Bu randevuyu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                </DialogDescription>
                <div className="mt-4 flex justify-center space-x-4">
                  <Button
                    variant="outline"
                    className="w-full h-9 text-gray-600 border-2 border-gray-600 hover:bg-gray-50"
                    onClick={() => setIsDeleteModalOpen(false)}
                  >
                    İptal
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full h-9 text-red-600 border-2 border-red-600 hover:bg-red-50"
                    onClick={() => {
                      setIsDeleteModalOpen(false);
                      onDelete(appointment.id);
                    }}
                  >
                    Sil
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </>
      );
    };
    
    export default AppointmentCard;
    