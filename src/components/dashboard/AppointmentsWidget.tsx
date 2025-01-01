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
    <Card className="w-full bg-white p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
            Aktif randevular
          </h2>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>Canlı</span>
          </Badge>
        </div>
        {!showAll && (
          <Button
            variant="ghost"
            className="text-primary flex items-center gap-2"
            onClick={() => navigate("/appointments")}
          >
            Tümünü Göster
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {displayAppointments.map((appointment) => {
          return (
            <div
              key={appointment.id}
              className={cn(
                "flex flex-col p-4 rounded-lg border transition-all",
                appointment.status === "in-progress"
                  ? "border-2 border-yellow-500 bg-yellow-50 scale-105 shadow-lg animate-pulse-border"
                  : "border-gray-100 hover:bg-gray-50"
              )}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                  <Clock className="h-4 w-4 " />

                  {appointment.time}
                </div>
                <Badge
                  variant="secondary"
                  className={`text-xs ${getStatusColor(
                    appointment.status
                  )} bg-opacity-30 text-gray-600`}
                >
                  {getStatusText(appointment.status)}
                </Badge>
              </div>

              <div className="space-y-2">
                <div>
                  <p className="font-medium  text-gray-900 truncate">
                    {`${members[appointment.member_id].first_name} ${
                      members[appointment.member_id].last_name
                    }`}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {services[appointment.service_id].name}
                  </p>
                </div>
                <p className="text-sm text-gray-600 truncate">
                  {`${trainers[appointment.trainer_id].first_name} ${
                    trainers[appointment.trainer_id].last_name
                  }`}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default AppointmentsWidget;
