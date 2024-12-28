import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Appointment {
  id: string;
  time: string;
  memberName: string;
  trainerName: string;
  service: string;
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  memberAvatarUrl?: string;
  trainerAvatarUrl?: string;
}

interface AppointmentsWidgetProps {
  appointments?: Appointment[];
  title?: string;
  showAll?: boolean;
}

const defaultAppointments: Appointment[] = [
  {
    id: "1",
    time: "09:00",
    memberName: "Ahmet Yılmaz",
    trainerName: "PT Mehmet Öztürk",
    service: "Kişisel Antrenman",
    status: "completed",
  },
  {
    id: "2",
    time: "09:30",
    memberName: "Zeynep Kaya",
    trainerName: "PT Ayşe Demir",
    service: "Fitness Değerlendirmesi",
    status: "completed",
  },
  {
    id: "3",
    time: "10:00",
    memberName: "Mustafa Çelik",
    trainerName: "PT Ali Can",
    service: "Kişisel Antrenman",
    status: "completed",
  },
  {
    id: "4",
    time: "10:30",
    memberName: "Ayşe Yıldız",
    trainerName: "PT Zeynep Yıldız",
    service: "Yoga Dersi",
    status: "in-progress",
  },
  {
    id: "5",
    time: "11:00",
    memberName: "Mehmet Demir",
    trainerName: "PT Mehmet Öztürk",
    service: "Kişisel Antrenman",
    status: "scheduled",
  },
  {
    id: "6",
    time: "11:30",
    memberName: "Fatma Şahin",
    trainerName: "PT Ali Can",
    service: "Fitness Değerlendirmesi",
    status: "scheduled",
  },
];

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
    (apt) => apt.status === "in-progress",
  );

  if (inProgressIndex === -1) return appointments.slice(0, 3);

  const start = Math.max(0, inProgressIndex - 1);
  const end = Math.min(appointments.length, inProgressIndex + 2);

  return appointments.slice(start, end);
};

const AppointmentsWidget = ({
  appointments = defaultAppointments,
  title = "Aktif Randevular",
  showAll = false,
}: AppointmentsWidgetProps) => {
  const navigate = useNavigate();
  const displayAppointments = showAll
    ? appointments
    : getRelevantAppointments(appointments);

  return (
    <Card className="w-full bg-white p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
            {title}
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
        {displayAppointments.map((appointment) => (
          <div
            key={appointment.id}
            className={cn(
              "flex flex-col p-4 rounded-lg border transition-all",
              appointment.status === "in-progress"
                ? "border-2 border-yellow-500 bg-yellow-50 scale-105 shadow-lg animate-pulse-border"
                : "border-gray-100 hover:bg-gray-50",
            )}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="text-lg font-semibold text-gray-900">
                {appointment.time}
              </div>
              <Badge
                variant="secondary"
                className={`text-xs ${getStatusColor(
                  appointment.status,
                )} bg-opacity-10 text-gray-600`}
              >
                {getStatusText(appointment.status)}
              </Badge>
            </div>

            <div className="space-y-2">
              <div>
                <p className="font-medium text-gray-900 truncate">
                  {appointment.memberName}
                </p>
                <p className="text-sm text-gray-600 truncate">
                  {appointment.trainerName}
                </p>
              </div>
              <p className="text-sm text-gray-500 truncate">
                {appointment.service}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default AppointmentsWidget;
