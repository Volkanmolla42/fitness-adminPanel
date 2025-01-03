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

const getRelevantAppointments = (appointments: Appointment[]) => {
  const inProgressIndex = appointments.findIndex(
    (apt) => apt.status === "in-progress"
  );

  if (inProgressIndex === -1) return appointments.slice(0, 3);

  const start = Math.max(0, inProgressIndex - 1);
  const end = Math.min(appointments.length, inProgressIndex + 2);

  return appointments.slice(start, end);
};

const AppointmentsWidget = ({
  appointments,
  members,
  trainers,
  services,
  showAll = false,
}: AppointmentsWidgetProps) => {
  const navigate = useNavigate();

  const displayAppointments = showAll
    ? appointments
    : getRelevantAppointments(appointments);

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
        
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {displayAppointments.map((appointment) => {
          return (
            <div
              key={appointment.id}
              className={cn(
                "flex flex-col p-4 rounded-lg border transition-all",
                appointment.status === "in-progress"
                  ? "border-2 border-yellow-500 bg-yellow-500/10 scale-105 shadow-lg animate-pulse-border"
                  : "border-border hover:bg-accent"
              )}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium text-foreground">
                    {members[appointment.member_id]?.first_name}{" "}
                    {members[appointment.member_id]?.last_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {services[appointment.service_id]?.name}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-xs px-2 py-1",
                    getStatusColor(appointment.status)
                  )}
                >
                  {getStatusText(appointment.status)}
                </Badge>
              </div>
              <div className="mt-auto pt-3 flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>
                    {new Date(appointment.date).toLocaleDateString("tr-TR")}
                  </span>
                </div>
                <span>
                  {trainers[appointment.trainer_id]?.first_name}{" "}
                  {trainers[appointment.trainer_id]?.last_name}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {!showAll && (
          <Button
            variant="outline"
            className="text-primary flex items-center  mt-6 mx-auto gap-2"
            onClick={() => navigate("/appointments")}
          >
            Tümünü Göster
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
    </Card>
  );
};

export default AppointmentsWidget;
