import { Award, Clock, FileText, User2, Users, CalendarDays, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trainer } from "@/types";
import cn from "classnames";

interface TrainerCardProps {
  trainer: Trainer;
  isBusy?: boolean;
  currentAppointment?: any;
  services?: any[];
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
        "p-4 cursor-pointer hover:shadow-md hover:-translate-y-1 hover:shadow-black/50 transition-all bg-white relative group overflow-hidden",
        isBusy && "animate-pulse-border border-2 border-primary"
      )}
      onClick={onClick}
    >
      {/* Durum Badge'i */}
      {isBusy && (
        <div className="absolute -top-2 -right-2">
          <Badge className="bg-primary text-primary-foreground">
            <Clock className="w-3 h-3 mr-1" />
            Randevuda
          </Badge>
        </div>
      )}

      {/* Arkaplan Deseni */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-5 transform rotate-45">
        {isBusy && (
          <Clock className="w-full h-full text-primary" />
        )}
      </div>

      <div className="flex flex-col items-center text-center relative">
        {/* Avatar ve İsim */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/10 to-primary/30 flex items-center justify-center mb-3 text-xl font-semibold text-primary ring-2 ring-primary/20 ring-offset-2">
          {trainer.first_name && trainer.last_name ? (
            <span>
              {trainer.first_name.charAt(0).toUpperCase()}
              {trainer.last_name.charAt(0).toUpperCase()}
            </span>
          ) : (
            <Award className="w-10 h-10 text-primary" />
          )}
        </div>

        <h3 className="font-semibold text-lg mb-2">
          {trainer.first_name} {trainer.last_name}
        </h3>

       

        {/* Randevu Bilgileri */}
        {isBusy && currentAppointment && (
          <div className="space-y-2 w-full p-2 bg-muted/30 rounded-lg mb-3">
            <div className="flex items-center justify-center gap-2 text-sm">
              <User2 className="w-4 h-4 text-blue-500" />
              <span className="text-muted-foreground font-medium">
                {currentAppointment.member?.first_name} {currentAppointment.member?.last_name}
              </span>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm">
              <FileText className="w-4 h-4 text-emerald-500" />
              <span className="text-muted-foreground">
                {currentAppointment.service?.name}
              </span>
            </div>
            {getRemainingMinutes && (
              <Badge variant="outline" className="w-full justify-center border-primary/30">
                <Clock className="w-3 h-3 mr-1 text-primary" />
                {(() => {
                  const service = services?.find(s => s.id === currentAppointment.service_id);
                  const duration = service?.duration || 60;
                  const remainingMinutes = getRemainingMinutes(currentAppointment.time, duration);
                  return remainingMinutes > 0
                    ? `${remainingMinutes} dakika kaldı`
                    : 'Randevu süresi doldu';
                })()}
              </Badge>
            )}
          </div>
        )}

        {/* Alt Bilgiler */}
        <div className="w-full space-y-2 pt-2 border-t">
          <div className="flex items-center text-sm text-muted-foreground justify-center">
            <Clock className="w-4 h-4 mr-1.5 text-purple-500" />
            {trainer.working_hours?.start || "09:00"} - {trainer.working_hours?.end || "17:00"}
          </div>
          
          {trainer.address && (
            <div className="flex items-center text-sm text-muted-foreground justify-center">
              <MapPin className="w-4 h-4 mr-1.5 text-orange-500" />
              <span className="truncate">{trainer.address}</span>
            </div>
          )}
          
          <div className="flex items-center text-sm text-muted-foreground justify-center">
            <CalendarDays className="w-4 h-4 mr-1.5 text-indigo-500" />
            <span>Başlangıç: {new Date(trainer.start_date).toLocaleDateString('tr-TR')}</span>
          </div>
        </div>
      </div>

      {/* Hover Efekti */}
      <div className="absolute inset-0 bg-gradient-to-tr from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
    </Card>
  );
};
