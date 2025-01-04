import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock } from "lucide-react";
import type { Database } from "@/types/supabase";

type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
type Service = Database["public"]["Tables"]["services"]["Row"];
type Trainer = Database["public"]["Tables"]["trainers"]["Row"];

interface AppointmentHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointments: Appointment[];
  services: { [key: string]: Service };
  trainers: { [key: string]: Trainer };
}

const getStatusColor = (status: string) => {
  console.log('getStatusColor called with status:', status);
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-700 border-green-300";
    case "cancelled":
      return "bg-red-100 text-red-700 border-red-300";
    case "scheduled":
      return "bg-blue-100 text-blue-700 border-blue-300";
    case "in-progress":
      return "bg-yellow-100 text-yellow-700 border-yellow-300";
    default:
      console.log('Status not matched in getStatusColor:', status);
      return "bg-gray-100 text-gray-700 border-gray-300";
  }
};

const getStatusText = (status: string) => {
  console.log('getStatusText called with status:', status);
  switch (status) {
    case "completed":
      return "Tamamlandı";
    case "cancelled":
      return "İptal Edildi";
    case "scheduled":
      return "Planlandı";
    case "in-progress":
      return "Devam Ediyor";
    default:
      console.log('Status not matched in getStatusText:', status);
      return status;
  }
};

export const AppointmentHistory = ({
  open,
  onOpenChange,
  appointments,
  services,
  trainers,
}: AppointmentHistoryProps) => {
  const completed = appointments.filter((apt) => apt.status === "completed");
  const cancelled = appointments.filter((apt) => apt.status === "cancelled");
  const scheduled = appointments.filter((apt) => apt.status === "scheduled");
  const inProgress = appointments.filter((apt) => apt.status === "in-progress");

  const getFilteredAppointments = (tab: string) => {
    switch (tab) {
      case "completed":
        return completed;
      case "cancelled":
        return cancelled;
      case "scheduled":
        return scheduled;
      case "in-progress":
        return inProgress;
      default:
        return appointments;
    }
  };

  const getTabLabel = (tab: string) => {
    switch (tab) {
      case "completed":
        return "Tamamlanan";
      case "cancelled":
        return "İptal Edilen";
      case "scheduled":
        return "Planlanan";
      case "in-progress":
        return "Devam Eden";
      default:
        return "Tümü";
    }
  };

  const tabs = [
    { value: "all", count: appointments.length },
    { value: "completed", count: completed.length },
    { value: "scheduled", count: scheduled.length },
    { value: "in-progress", count: inProgress.length },
    { value: "cancelled", count: cancelled.length },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[80vh] max-w-3xl overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Randevu Geçmişi</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          <Tabs defaultValue="scheduled" className="w-full">
            <TabsList className="w-full">
              {tabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {getTabLabel(tab.value)} ({tab.count})
                </TabsTrigger>
              ))}
            </TabsList>

            {tabs.map((tab) => (
              <TabsContent key={tab.value} value={tab.value} className="mt-4">
                <div className="space-y-4">
                  {getFilteredAppointments(tab.value).map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="font-medium">
                          {services[appointment.service_id]?.name || "Yükleniyor..."}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(appointment.date).toLocaleDateString("tr-TR")}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {appointment.time}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Eğitmen: {trainers[appointment.trainer_id]?.first_name} {trainers[appointment.trainer_id]?.last_name}
                        </div>
                      </div>
                      <Badge className={`px-3 py-1 ${getStatusColor(appointment.status)}`}>
                        {getStatusText(appointment.status)}
                      </Badge>
                    </div>
                  ))}
                  {getFilteredAppointments(tab.value).length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      Bu kategoride randevu bulunmuyor
                    </div>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
