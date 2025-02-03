import React from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  User,
  Mail,
  Phone,
  Timer,
  UserCog,
  Package,
  Activity,
} from "lucide-react";
import { getStatusText } from "./AppointmentCard";

interface AppointmentDetailsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
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
}

const AppointmentDetailsModal = ({
  isOpen,
  onOpenChange,
  appointment,
  member,
  trainer,
  service,
}: AppointmentDetailsModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogTitle className="flex items-center gap-2 pb-4 border-b">
          <Calendar className="h-5 w-5 text-primary" />
          Randevu Detayları
        </DialogTitle>

        <div className="grid gap-4 sm:gap-6 py-4">
          {/* Üye Bilgileri Bölümü */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="font-medium text-xs sm:text-sm text-muted-foreground">
              ÜYE BİLGİLERİ
            </h3>
            <div className="flex items-start gap-3 sm:gap-4">
              {member.avatar ? (
                <img
                  src={member.avatar}
                  alt={`${member.firstName} ${member.lastName}`}
                  className="h-14 w-14 sm:h-16 sm:w-16 rounded-full object-cover"
                />
              ) : (
                <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground" />
                </div>
              )}
              <div className="space-y-1">
                <h3 className="flex flex-wrap gap-1.5 sm:gap-2 items-center font-medium text-base sm:text-lg">
                  {member.firstName} {member.lastName}
                  {member.membership_type && (
                    <Badge
                      className={`text-[10px] sm:text-xs ${
                        member.membership_type === "vip"
                          ? "bg-yellow-500"
                          : "bg-gray-500"
                      }`}
                    >
                      {member.membership_type.toUpperCase()}
                    </Badge>
                  )}
                </h3>
                {member.email && (
                  <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5 sm:gap-2">
                    <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    {member.email}
                  </p>
                )}
                {member.phone_number && (
                  <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5 sm:gap-2">
                    <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    {member.phone_number}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Randevu Detayları Bölümü */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="font-medium text-xs sm:text-sm text-muted-foreground">
              RANDEVU DETAYLARI
            </h3>
            <div className="grid gap-2.5 sm:gap-3 bg-muted/50 p-3 sm:p-4 rounded-lg">
              <div className="flex items-center gap-2 sm:gap-3">
                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                <span className="text-xs sm:text-sm">
                  {format(new Date(appointment.date), "d MMMM yyyy", {
                    locale: tr,
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <Timer className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                <span className="text-xs sm:text-sm">
                  {appointment.time.slice(0, 5)}
                </span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <UserCog className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                <span className="text-xs sm:text-sm">
                  <span className="text-muted-foreground">Eğitmen:</span>{" "}
                  {trainer.firstName} {trainer.lastName}
                </span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                <span className="text-xs sm:text-sm">
                  <span className="text-muted-foreground">Hizmet:</span>{" "}
                  {service.name}
                </span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                <span className="text-xs sm:text-sm">
                  <span className="text-muted-foreground">Durum:</span>{" "}
                  <Badge
                    className={`text-[10px] sm:text-xs ${
                      appointment.status === "scheduled"
                        ? "bg-blue-500"
                        : appointment.status === "in-progress"
                        ? "bg-yellow-500"
                        : appointment.status === "completed"
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  >
                    {getStatusText(appointment.status)}
                  </Badge>
                </span>
              </div>
            </div>
          </div>

          {/* Notlar Bölümü */}
          {appointment.notes && (
            <div className="space-y-3 sm:space-y-4">
              <h3 className="font-medium text-xs sm:text-sm text-muted-foreground">
                NOTLAR
              </h3>
              <div className="bg-muted/50 p-3 sm:p-4 rounded-lg">
                <p className="text-xs sm:text-sm">{appointment.notes}</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentDetailsModal;
