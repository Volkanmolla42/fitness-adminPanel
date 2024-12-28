import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, Search, Filter, CheckCircle2, Calendar } from "lucide-react";

interface Appointment {
  id: string;
  time: string;
  memberName: string;
  trainerName: string;
  service: string;
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
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

const AppointmentsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredAppointments = defaultAppointments.filter((appointment) => {
    const matchesSearch =
      appointment.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.trainerName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      appointment.service.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || appointment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Separate appointments by status
  const inProgressAppointments = filteredAppointments.filter(
    (apt) => apt.status === "in-progress",
  );
  const scheduledAppointments = filteredAppointments.filter(
    (apt) => apt.status === "scheduled",
  );
  const completedAppointments = filteredAppointments.filter(
    (apt) => apt.status === "completed",
  );

  const AppointmentCard = ({ appointment }: { appointment: Appointment }) => (
    <div
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
        <p className="text-sm text-gray-500 truncate">{appointment.service}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Randevular</h1>
        <p className="text-muted-foreground mt-2">
          Tüm randevuları görüntüle ve yönet
        </p>
      </div>

      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="İsim, eğitmen veya hizmet ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Durum Filtrele" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="scheduled">Planlandı</SelectItem>
                <SelectItem value="in-progress">Devam Ediyor</SelectItem>
                <SelectItem value="completed">Tamamlandı</SelectItem>
                <SelectItem value="cancelled">İptal Edildi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-8">
          {/* Active Appointments Section */}
          {inProgressAppointments.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-500" />
                Aktif Randevular
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {inProgressAppointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Scheduled Appointments Section */}
          {scheduledAppointments.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                Planlanan Randevular
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {scheduledAppointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed Appointments Section */}
          {completedAppointments.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Tamamlanan Randevular
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedAppointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AppointmentsPage;
