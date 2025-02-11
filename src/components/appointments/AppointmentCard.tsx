import React, { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  CheckCircle2,
  Pencil,
  User,
  Trash2,
  Calendar,
  Timer,
  Package,
  X,
  ChevronDown,
} from "lucide-react";
import { format, isToday } from "date-fns";
import { tr } from "date-fns/locale";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import AppointmentDetailsModal from "./AppointmentDetailsModal";

interface AppointmentCardProps {
  appointment: {
    id: string;
    date: string;
    time: string;
    status: string;
    notes?: string;
  };
  member: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    membership_type?: string;
    phone_number?: string;
    email?: string;
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
  onEdit: (appointment: AppointmentCardProps["appointment"]) => void;
  onDelete: (id: string) => void;
}

export const getStatusColor = (status: string) => {
  const colors = {
    scheduled: "bg-blue-500",
    "in-progress": "bg-yellow-500",
    completed: "bg-green-500",
    cancelled: "bg-red-500",
  };
  return colors[status] || "bg-gray-500";
};

export const getStatusText = (status: string) => {
  const texts = {
    scheduled: "Planlandı",
    "in-progress": "Devam Ediyor",
    completed: "Tamamlandı",
    cancelled: "İptal Edildi",
  };
  return texts[status] || status;
};

const getRemainingTime = (
  startTime: string,
  startDate: string,
  duration: number,
  status: string
) => {
  const now = new Date();
  const [hours, minutes] = startTime.split(":").map(Number);
  const appointmentStart = new Date(startDate);
  appointmentStart.setHours(hours, minutes, 0, 0);

  // Zaman dilimi farkını düzeltmek için
  const localAppointmentStart = new Date(
    appointmentStart.toLocaleString("en-US", { timeZone: "Europe/Istanbul" })
  );

  // Calculate minutes until appointment starts
  const minutesUntilStart = Math.floor(
    (localAppointmentStart.getTime() - now.getTime()) / (1000 * 60)
  );

  if (status === "scheduled" && minutesUntilStart <= -duration) {
    // Eğer seans süresi dolmuşsa ve hala "scheduled" durumundaysa
    return -1; // Özel durum kodu
  }

  if (status === "scheduled") {
    return minutesUntilStart;
  }

  if (status === "in-progress") {
    if (minutesUntilStart > 0) {
      return duration;
    }

    const elapsedMinutes = Math.floor(
      (now.getTime() - localAppointmentStart.getTime()) / (1000 * 60)
    );
    return Math.max(0, duration - elapsedMinutes);
  }

  return 0;
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
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

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

  const isUpcoming =
    appointment.status === "scheduled" &&
    remainingTime > 0 &&
    remainingTime <= 30;
  const isAboutToStart =
    appointment.status === "scheduled" &&
    remainingTime > 0 &&
    remainingTime <= 1;

  return (
    <>
      <Card
        className="group h-max transform transition-all duration-300 hover:shadow-lg relative border-gray-300 overflow-hidden border-l-4 bg-white cursor-pointer"
        style={{
          borderLeftColor:
            appointment.status === "scheduled"
              ? "#3b82f6"
              : appointment.status === "in-progress"
              ? "#eab308"
              : appointment.status === "completed"
              ? "#22c55e"
              : "#ef4444",
        }}
        ref={cardRef}
        onClick={() => setIsMemberModalOpen(true)}
      >
        <div
          className="text-blue-600 z-50 absolute bottom-4 right-4 cursor-pointer flex items-center border border-blue-300 rounded-md p-2 hover:bg-blue-50"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(appointment);
          }}
        >
          <Pencil className="h-4 w-4" />
        </div>
        <div className="p-4">
          {/* Status Badge with Dropdown */}
          <div className="absolute top-3 right-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  className="p-0 h-auto hover:bg-transparent cursor-pointer"
                >
                  <Badge
                    className={`
                      ${getStatusColor(appointment.status)} px-3 py-1.5 
                      font-medium tracking-wide cursor-pointer
                      flex items-center gap-1.5 shadow-sm
                      transition-all duration-200
                      hover:opacity-90
                    `}
                  >
                    <span>{getStatusText(appointment.status)}</span>
                    <ChevronDown className="h-3.5 w-3.5 opacity-70 stroke-[3]" />
                  </Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {appointment.status === "scheduled" && (
                  <>
                    <DropdownMenuItem
                      className="text-yellow-600 focus:text-yellow-600 focus:bg-yellow-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleChangeStatus("in-progress");
                      }}
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      <span>Başlat</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600 focus:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleChangeStatus("cancelled");
                      }}
                    >
                      <X className="mr-2 h-4 w-4" />
                      <span>İptal Et</span>
                    </DropdownMenuItem>
                  </>
                )}

                {appointment.status === "in-progress" && (
                  <DropdownMenuItem
                    className="text-green-600 focus:text-green-600 focus:bg-green-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleChangeStatus("completed");
                    }}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    <span>Tamamla</span>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDeleteModalOpen(true);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Sil</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {/* Tarih ve Saat */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-2 sm:space-y-0">
              <div className="flex items-center space-x-2">
                <div className="bg-gray-50 p-1.5 sm:p-2 rounded-lg">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <span
                      className={`text-xl sm:text-2xl font-bold tracking-tight ${
                        isUpcoming || isAboutToStart
                          ? "text-orange-500"
                          : "text-gray-900"
                      }`}
                    >
                      {appointment.time.slice(0, 5)}
                    </span>
                    {isAboutToStart && appointment.status === "scheduled" && (
                      <div className="flex items-center bg-orange-100 px-1.5 sm:px-2 py-0.5 rounded-full">
                        <Timer className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-600 mr-1" />
                        <span className="text-xs font-medium text-orange-600 whitespace-nowrap">
                          Başlamak Üzere
                        </span>
                      </div>
                    )}
                    {isUpcoming &&
                      !isAboutToStart &&
                      appointment.status === "scheduled" && (
                        <div className="flex items-center bg-orange-100 px-1.5 sm:px-2 py-0.5 rounded-full">
                          <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-600 mr-1" />
                          <span className="text-xs font-medium text-orange-600 whitespace-nowrap">
                            Yaklaşıyor
                          </span>
                        </div>
                      )}
                  </div>
                  <span className="text-xs sm:text-sm text-gray-500">
                    {(() => {
                      const appointmentDate = new Date(appointment.date);
                      const isAppointmentToday = isToday(appointmentDate);
                      const formattedDate = format(appointmentDate, "d MMMM", {
                        locale: tr,
                      });

                      return isAppointmentToday
                        ? "Bugün"
                        : `${formattedDate} ${weekDay}`;
                    })()}
                  </span>
                </div>
              </div>

              {appointment.status === "in-progress" && (
                <div className="flex items-center bg-yellow-50 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg ml-0 sm:ml-auto">
                  <Timer className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-600 mr-1 sm:mr-1.5" />
                  <span className="text-xs sm:text-sm font-medium text-yellow-700">
                    {remainingTime}dk kaldı
                  </span>
                </div>
              )}
            </div>

            {/* Kişi ve Paket Bilgileri */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <div className="flex items-center space-x-3">
                {member.avatar ? (
                  <img
                    src={member.avatar}
                    alt={`${member.firstName} ${member.lastName}`}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-white shadow-sm"
                  />
                ) : (
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-sm">
                    <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600" />
                  </div>
                )}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                    <span className="text-sm sm:text-base font-medium text-gray-900">
                      {member.firstName && member.lastName
                        ? `${member.firstName} ${member.lastName}`
                        : "Üye adı bulunamadı"}
                    </span>
                    <div className="flex items-center mt-0.5 sm:mt-0">
                      <span className="text-sm text-gray-400 hidden sm:inline">
                        •
                      </span>
                      <span className="text-xs sm:text-sm text-gray-600 sm:ml-2">
                        {trainer.firstName} {trainer.lastName}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center text-xs sm:text-sm text-gray-500 mt-0.5">
                    <Package className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-400 mr-1.5" />
                    <span className="truncate">{service.name}</span>
                    <span className="mx-1.5">•</span>
                    <span>{service.duration}dk</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notlar */}
            {appointment.notes && (
              <div className="text-xs sm:text-sm text-gray-600 bg-gray-50/50 rounded-lg p-2 sm:p-2.5 border border-gray-100/80">
                {appointment.notes}
              </div>
            )}
          </div>
        </div>
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
              Bu randevuyu silmek istediğinize emin misiniz? Bu işlem geri
              alınamaz.
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

      {/* Randevu Detayları Modal */}
      <AppointmentDetailsModal
        isOpen={isMemberModalOpen}
        onOpenChange={setIsMemberModalOpen}
        appointment={appointment}
        member={member}
        trainer={trainer}
        service={service}
      />
    </>
  );
};

export default AppointmentCard;
