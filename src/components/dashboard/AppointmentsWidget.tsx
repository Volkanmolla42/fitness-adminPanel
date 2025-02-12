import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Database } from "@/types/supabase";
import React from "react";
type Appointment = Database["public"]["Tables"]["appointments"]["Row"];

interface AppointmentsWidgetProps {
  appointments: Appointment[];
  members: Record<string, { first_name: string; last_name: string }>;
  trainers: Record<string, { first_name: string; last_name: string }>;
  services: Record<string, { name: string; duration: number }>;
  showAll?: boolean;
}

const getStatusColor = (status: Appointment["status"]) => {
  const colors = {
    scheduled: "bg-blue-500",
    "in-progress": "bg-yellow-500",
    completed: "bg-green-500",
    cancelled: "bg-red-500",
  };
  return colors[status];
};

const getStatusText = (status: Appointment["status"]) => {
  const texts = {
    scheduled: "Planlandı",
    "in-progress": "Devam Ediyor",
    completed: "Tamamlandı",
    cancelled: "İptal Edildi",
  };
  return texts[status];
};

const getRelevantAppointments = (appointments: Appointment[], showAll: boolean) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  
  // Bugün ve gelecek 7 günün randevularını filtrele
  const upcomingAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.date);
    return aptDate >= today && aptDate <= nextWeek;
  });

  // Öncelikli randevuları ayır
  const inProgressAppointments = upcomingAppointments.filter(apt => apt.status === "in-progress");
  const scheduledAppointments = upcomingAppointments.filter(apt => apt.status === "scheduled");
  const otherAppointments = upcomingAppointments.filter(apt => 
    apt.status !== "in-progress" && apt.status !== "scheduled"
  );

  // Planlanan randevuları tarihe ve saate göre sırala
  const sortedScheduledAppointments = scheduledAppointments.sort((a, b) => {
    const dateA = new Date(a.date + 'T' + a.time);
    const dateB = new Date(b.date + 'T' + b.time);
    return dateA.getTime() - dateB.getTime();
  });

  // Önce devam eden, sonra planlanan, en son diğer randevular
  const sortedAppointments = [
    ...inProgressAppointments,
    ...sortedScheduledAppointments,
    ...otherAppointments
  ];

  return showAll ? sortedAppointments : sortedAppointments.slice(0, 3);
};

const getTimeUntilStart = (date: string, time: string): number | null => {
  // Randevu tarih ve saatini Türkiye saatinde oluştur
  const [hours, minutes] = time.split(':');
  const appointmentDate = new Date(date);
  appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  const now = new Date();
  const diffInMinutes = Math.floor((appointmentDate.getTime() - now.getTime()) / (1000 * 60));
  return diffInMinutes >= 0 && diffInMinutes <= 30 ? diffInMinutes : null;
};

const getElapsedTime = (date: string, time: string): number | null => {
  // Randevu tarih ve saatini Türkiye saatinde oluştur
  const [hours, minutes] = time.split(':');
  const appointmentDate = new Date(date);
  appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - appointmentDate.getTime()) / (1000 * 60));
  return diffInMinutes >= 0 ? diffInMinutes : null;
};

const getFormattedDate = (date: string) => {
  const appointmentDate = new Date(date);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  // Tarihleri karşılaştırmak için saat bilgisini sıfırlayalım
  const appointmentDay = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate());
  const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const tomorrowDay = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());

  if (appointmentDay.getTime() === todayDay.getTime()) {
    return "Bugün";
  } else if (appointmentDay.getTime() === tomorrowDay.getTime()) {
    return "Yarın";
  } else {
    return appointmentDate.toLocaleDateString('tr-TR', { 
      day: 'numeric',
      month: 'long'
    });
  }
};

const AppointmentsWidget = ({
  appointments,
  members,
  trainers,
  services,
  showAll = false,
}: AppointmentsWidgetProps) => {
  const navigate = useNavigate();

  const displayAppointments = getRelevantAppointments(appointments, showAll);
  return (
    <Card className="w-full p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <h2 className="text-xl md:text-2xl font-semibold text-foreground">
            Yaklaşan randevular
          </h2>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>Canlı</span>
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="hidden md:flex items-center gap-2"
          onClick={() => navigate("/appointments")}
        >
          Tümünü Gör
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {displayAppointments.map((appointment) => {
          const member = members[appointment.member_id];
          const trainer = trainers[appointment.trainer_id];
          const service = services[appointment.service_id];
          
          return (
            <div
              key={appointment.id}
              className={cn(
                "group flex flex-col p-5 rounded-xl border transition-all duration-3000 hover:shadow-lg cursor-pointer",
                appointment.status === "in-progress"
                  ? "border-2 border-yellow-500 bg-gradient-to-br from-yellow-500/10 to-yellow-500/10 shadow-lg"
                  : getTimeUntilStart(appointment.date, appointment.time) !== null
                  ? "border-2 border-orange-500 bg-gradient-to-br from-orange-500/10 to-orange-500/10 shadow-md"
                  : "border-border hover:bg-accent/50 hover:scale-[1.01]"
              )}
              role="button"
              onClick={() => navigate("/appointments")}
            >
              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                      <Clock className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-primary">
                        {appointment.time.slice(0, 5)}
                      </p>
                      <p className="text-sm font-medium text-muted-foreground">
                        {getFormattedDate(appointment.date)}
                      </p>
                    </div>
                  </div>
                  <Badge
                    className={cn(
                      "px-2.5 py-1 text-xs font-medium rounded-lg shadow-sm",
                      getStatusColor(appointment.status)
                    )}
                  >
                    {getStatusText(appointment.status)}
                  </Badge>
                </div>

                <div className="space-y-1.5">
                  <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                    {member?.first_name} {member?.last_name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary/60" />
                    <p className="text-sm font-medium text-muted-foreground">
                      {service?.name}
                    </p>
                  </div>
                  {(() => {
                    if (appointment.status === "in-progress") {
                      const elapsedTime = getElapsedTime(appointment.date, appointment.time);
                      if (elapsedTime !== null) {
                        const duration = services[appointment.service_id]?.duration || 0;
                        const remainingTime = Math.max(0, duration - elapsedTime);
                        const isOvertime = elapsedTime > duration;
                        return (
                          <div className="flex items-center gap-2 mt-3">
                            <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                            <p className="text-sm text-yellow-600 dark:text-yellow-500 font-medium">
                              {elapsedTime === 0 
                                ? "Yeni başladı" 
                                : `${elapsedTime} dk sürüyor${isOvertime ? ' (Süre aşıldı)' : ` (${remainingTime} dk kaldı)`}`}
                            </p>
                          </div>
                        );
                      }
                    }
                    const timeUntilStart = getTimeUntilStart(appointment.date, appointment.time);
                    if (timeUntilStart !== null) {
                      return (
                        <div className="flex items-center gap-2 mt-3">
                          <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                          <p className="text-sm text-orange-600 dark:text-orange-500 font-medium">
                            {timeUntilStart === 0 
                              ? "Şimdi başlayacak" 
                              : `${timeUntilStart} dk içinde başlıyor`}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
              
              <div className="mt-auto pt-3 border-t flex items-center gap-2 text-sm">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-medium text-primary">
                    {trainer?.first_name?.[0]}{trainer?.last_name?.[0]}
                  </span>
                </div>
                <span className="text-muted-foreground font-medium">
                  {trainer?.first_name} {trainer?.last_name}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        className="w-full mt-4 md:hidden"
        onClick={() => navigate("/appointments")}
      >
        Tümünü Gör
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </Card>
  );
};

export default AppointmentsWidget;
