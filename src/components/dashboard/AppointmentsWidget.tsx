import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Database } from "@/types/supabase";

type Appointment = Database["public"]["Tables"]["appointments"]["Row"];

interface AppointmentsWidgetProps {
  appointments: Appointment[];
  members: Record<string, { first_name: string; last_name: string }>;
  trainers: Record<string, { first_name: string; last_name: string }>;
  services: Record<string, { name: string }>;
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
  const appointmentTime = new Date(date + 'T' + time);
  const now = new Date();
  const diffInMinutes = Math.floor((appointmentTime.getTime() - now.getTime()) / (1000 * 60));
  return diffInMinutes >= 0 && diffInMinutes <= 30 ? diffInMinutes : null;
};

const getElapsedTime = (date: string, time: string): number | null => {
  const appointmentTime = new Date(date + 'T' + time);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - appointmentTime.getTime()) / (1000 * 60));
  return diffInMinutes >= 0 ? diffInMinutes : null;
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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {displayAppointments.map((appointment) => {
          const member = members[appointment.member_id];
          const trainer = trainers[appointment.trainer_id];
          const service = services[appointment.service_id];
          
          return (
            <div
              key={appointment.id}
              className={cn(
                "flex flex-col p-4 rounded-lg border transition-all hover:shadow-md",
                appointment.status === "in-progress"
                  ? "border-2 border-yellow-500 bg-yellow-500/10 scale-105 shadow-lg animate-pulse-border"
                  : getTimeUntilStart(appointment.date, appointment.time) !== null
                  ? "border-2 border-orange-500 bg-orange-500/5 shadow-md"
                  : "border-border hover:bg-accent"
              )}
              role="button"
              onClick={() => navigate("/appointments")}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium text-foreground">
                    {member?.first_name} {member?.last_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {service?.name}
                  </p>
                  {(() => {
                    if (appointment.status === "in-progress") {
                      const elapsedTime = getElapsedTime(appointment.date, appointment.time);
                      if (elapsedTime !== null) {
                        return (
                          <p className="text-sm text-yellow-500 font-medium mt-1">
                            {elapsedTime === 0 
                              ? "Yeni başladı" 
                              : `${elapsedTime} dakikadır devam ediyor`}
                          </p>
                        );
                      }
                    }
                    const timeUntilStart = getTimeUntilStart(appointment.date, appointment.time);
                    if (timeUntilStart !== null) {
                      return (
                        <p className="text-sm text-orange-500 font-medium mt-1">
                          {timeUntilStart === 0 
                            ? "Şimdi başlayacak" 
                            : `${timeUntilStart} dakika içinde başlayacak`}
                        </p>
                      );
                    }
                    return null;
                  })()}
                </div>
                <Badge
                  className={cn(
                    "px-2 py-1",
                    getStatusColor(appointment.status)
                  )}
                >
                  {getStatusText(appointment.status)}
                </Badge>
              </div>
              
              <div className="mt-auto pt-3 border-t flex justify-between items-center text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{appointment.time.slice(0, 5)} </span>
                </div>
                <span>
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
