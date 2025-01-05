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
  
  // Bugünün randevularını filtrele
  const todayAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.date);
    return aptDate.getDate() === today.getDate() &&
           aptDate.getMonth() === today.getMonth() &&
           aptDate.getFullYear() === today.getFullYear();
  });

  // Öncelikli randevuları ayır
  const inProgressAppointments = todayAppointments.filter(apt => apt.status === "in-progress");
  const scheduledAppointments = todayAppointments.filter(apt => apt.status === "scheduled");
  const otherAppointments = todayAppointments.filter(apt => 
    apt.status !== "in-progress" && apt.status !== "scheduled"
  );

  // Planlanan randevuları saate göre sırala
  const sortedScheduledAppointments = scheduledAppointments.sort((a, b) => {
    const timeA = a.time.slice(0, 5);
    const timeB = b.time.slice(0, 5);
    return timeA.localeCompare(timeB);
  });

  // Önce devam eden, sonra planlanan, en son diğer randevular
  const sortedAppointments = [
    ...inProgressAppointments,
    ...sortedScheduledAppointments,
    ...otherAppointments
  ];

  return showAll ? sortedAppointments : sortedAppointments.slice(0, 3);
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
            Günlük randevular
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
