import React from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

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
    status: "in-progress",
  },
  {
    id: "6",
    time: "11:30",
    memberName: "Fatma Şahin",
    trainerName: "PT Ali Can",
    service: "Fitness Değerlendirmesi",
    status: "scheduled",
  },
  {
    id: "7",
    time: "13:00",
    memberName: "Can Yılmaz",
    trainerName: "PT Zeynep Yıldız",
    service: "Kişisel Antrenman",
    status: "scheduled",
  },
  {
    id: "8",
    time: "13:30",
    memberName: "Elif Öztürk",
    trainerName: "PT Ayşe Demir",
    service: "Yoga Dersi",
    status: "scheduled",
  },
  {
    id: "9",
    time: "14:00",
    memberName: "Burak Aydın",
    trainerName: "PT Mehmet Öztürk",
    service: "Kişisel Antrenman",
    status: "scheduled",
  },
  {
    id: "10",
    time: "14:30",
    memberName: "Selin Kara",
    trainerName: "PT Ali Can",
    service: "Fitness Değerlendirmesi",
    status: "scheduled",
  },
  {
    id: "11",
    time: "15:00",
    memberName: "Emre Çetin",
    trainerName: "PT Zeynep Yıldız",
    service: "Kişisel Antrenman",
    status: "scheduled",
  },
  {
    id: "12",
    time: "15:30",
    memberName: "Deniz Yıldırım",
    trainerName: "PT Ayşe Demir",
    service: "Yoga Dersi",
    status: "scheduled",
  },
  {
    id: "13",
    time: "16:00",
    memberName: "Mert Aksoy",
    trainerName: "PT Mehmet Öztürk",
    service: "Kişisel Antrenman",
    status: "scheduled",
  },
  {
    id: "14",
    time: "16:30",
    memberName: "Gizem Arslan",
    trainerName: "PT Ali Can",
    service: "Fitness Değerlendirmesi",
    status: "scheduled",
  },
  {
    id: "15",
    time: "17:00",
    memberName: "Onur Yılmaz",
    trainerName: "PT Zeynep Yıldız",
    service: "Kişisel Antrenman",
    status: "scheduled",
  },
  {
    id: "16",
    time: "17:30",
    memberName: "Ceren Demir",
    trainerName: "PT Ayşe Demir",
    service: "Yoga Dersi",
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

const AppointmentsWidget = ({
  appointments = defaultAppointments,
  title = "Günün Randevuları",
}: AppointmentsWidgetProps) => {
  return (
    <Card className="w-full h-[800px] bg-white p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span>Canlı</span>
        </Badge>
      </div>

      <ScrollArea className="h-[700px] w-full pr-4">
        <div className="space-y-3">
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 text-sm font-medium text-gray-600">
                  {appointment.time}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">
                      {appointment.memberName}
                    </p>
                    <span className="text-gray-400 text-sm">•</span>
                    <p className="text-sm text-gray-600">
                      {appointment.trainerName}
                    </p>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {appointment.service}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className={`text-xs ${getStatusColor(appointment.status)} bg-opacity-10 text-gray-600`}
                >
                  {getStatusText(appointment.status)}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};

export default AppointmentsWidget;
