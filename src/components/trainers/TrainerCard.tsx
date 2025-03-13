import React from "react";
import {
  Award,
  Clock,
  FileText,
  User2,
  Phone,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trainer } from "@/types";
import cn from "classnames";

interface Service {
  id: string;
  name: string;
  duration: number;
}

interface Member {
  first_name: string;
  last_name: string;
}

interface Appointment {
  id: string;
  time: string;
  service_id: string;
  member?: Member;
  service?: {
    name: string;
  };
}

interface TrainerCardProps {
  trainer: Trainer;
  isBusy?: boolean;
  currentAppointment?: Appointment;
  services?: Service[];
  onClick?: () => void;
  getRemainingMinutes?: (startTime: string, durationMinutes?: number) => number;
}

export const TrainerCard = ({
  trainer,
  isBusy,
  currentAppointment,
  services,
  onClick,
  getRemainingMinutes,
}: TrainerCardProps) => {
  return (
    <Card
      className={cn(
        "relative  min-w-[500px] cursor-pointer overflow-hidden border-zinc-300 bg-gradient-to-br from-white to-gray-50 p-6 transition-all",
        "hover:shadow-xl hover:-translate-y-1 hover:shadow-primary/20",
        "dark:from-gray-900 dark:to-gray-800 dark:hover:shadow-gray-950",
        isBusy && "border-l-4 border-yellow-400"
      )}
      onClick={onClick}
    >
      {/* Durum Şeridi */}
      {isBusy && (
        <div className="absolute -right-8 top-4 w-32 rotate-45 bg-yellow-400 py-1 text-center text-xs font-bold shadow">
          RANDEVUDA
        </div>
      )}

      <div className="flex items-start gap-5">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div
            className={cn(
              "h-16 w-16 rounded-2xl border-4 border-white bg-gradient-to-tr",
              "from-primary/20 to-primary/40 p-2 shadow-lg dark:border-gray-800",
              isBusy ? "grayscale-[40%]" : "grayscale-0"
            )}
          >
            {trainer.first_name && trainer.last_name ? (
              <div className="flex h-full w-full items-center justify-center rounded-xl bg-white/80 text-xl font-bold text-primary dark:bg-gray-800/80">
                {trainer.first_name.charAt(0)}
                {trainer.last_name.charAt(0)}
              </div>
            ) : (
              <Award className="h-full w-full text-primary/80" />
            )}
          </div>
        </div>

        {/* Ana İçerik */}
        <div className="flex-1 space-y-3">
          {/* İsim ve Puan */}
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {trainer.first_name} {trainer.last_name}
            </h3>
          </div>

          {/* Randevu Bilgileri */}
          {isBusy && currentAppointment && (
            <div className="space-y-2 rounded-lg bg-primary/5 p-3 dark:bg-primary/10">
              <div className="flex items-center gap-2 text-sm">
                <User2 className="h-5 w-5 text-primary" />
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {currentAppointment.member?.first_name}{" "}
                  {currentAppointment.member?.last_name}
                </span>
              </div>
              <div className="flex  gap-2 text-sm">
                <FileText className="h-5 w-5 text-primary" />
                <span className="text-gray-600  dark:text-gray-400">
                  {currentAppointment.service?.name}
                </span>
                {getRemainingMinutes && (
                  <Badge
                    variant="outline"
                    className="ml-2 shrink-0 border-primary/20 bg-white px-2 dark:bg-gray-800"
                  >
                    <Clock className="mr-1 h-4 w-4" />
                
                    {(() => {
                      const service = services?.find(
                        (s) => s.id === currentAppointment.service_id
                      );
                      const duration = service?.duration || 60;
                      const remainingMinutes = getRemainingMinutes(
                        currentAppointment.time,
                        duration
                      );
                      return remainingMinutes > 0
                        ? `${remainingMinutes} dk kaldı`
                        : "Süre doldu";
                    })()}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* İletişim ve Çalışma Saatleri */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <Phone className="h-4 w-4 text-primary" />
              <span>{trainer.phone}</span>
            </div>
            <div className="h-4 w-px bg-gray-200 dark:bg-gray-700" />
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <Clock className="h-4 w-4 text-primary" />
              <span>
                {" "}
                {trainer.working_hours.start} - {trainer.working_hours.end}{" "}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Hover Efekti */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
    </Card>
  );
};
