import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User2 } from "lucide-react";
import { Trainer, Appointment } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TrainerAppointmentHistoryDialogProps {
  trainer: Trainer;
  appointments: Appointment[];
  isOpen: boolean;
  onClose: () => void;
}

export const TrainerAppointmentHistoryDialog = ({
  trainer,
  appointments,
  isOpen,
  onClose,
}: TrainerAppointmentHistoryDialogProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "cancelled":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "in-progress":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "scheduled":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default:
        return "bg-slate-500/10 text-slate-500 border-slate-500/20";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Tamamlandı";
      case "cancelled":
        return "İptal Edildi";
      case "in-progress":
        return "Devam Ediyor";
      case "scheduled":
        return "Planlandı";
      default:
        return "Bilinmiyor";
    }
  };

  // Randevuları tarihe göre sırala (en yeniden en eskiye)
  const sortedAppointments = [...appointments].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}`);
    const dateB = new Date(`${b.date}T${b.time}`);
    return dateB.getTime() - dateA.getTime();
  });

  // Randevuları durumlarına göre filtrele
  const inProgressAppointments = sortedAppointments.filter(
    (a) => a.status === "in-progress"
  );
  const scheduledAppointments = sortedAppointments.filter(
    (a) => a.status === "scheduled"
  );
  const completedAppointments = sortedAppointments.filter(
    (a) => a.status === "completed"
  );
  const cancelledAppointments = sortedAppointments.filter(
    (a) => a.status === "cancelled"
  );

  const AppointmentList = ({ appointments }: { appointments: Appointment[] }) => (
    <div className="space-y-4">
      {appointments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Bu kategoride randevu bulunmuyor.
        </div>
      ) : (
        appointments.map((appointment) => (
          <div
            key={appointment.id}
            className="p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <User2 className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">
                    {appointment.member?.first_name} {appointment.member?.last_name}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {appointment.service?.name}
                </div>
              </div>
              <Badge
                variant="outline"
                className={getStatusColor(appointment.status)}
              >
                {getStatusText(appointment.status)}
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(appointment.date).toLocaleDateString("tr-TR")}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {appointment.time}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {trainer.first_name} {trainer.last_name} - Randevu Geçmişi
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="in-progress" className="w-full">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="in-progress" className="flex items-center gap-2">
              Devam Eden
              {inProgressAppointments.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {inProgressAppointments.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="flex items-center gap-2">
              Planlanmış
              {scheduledAppointments.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {scheduledAppointments.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              Tamamlanan
              {completedAppointments.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {completedAppointments.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="flex items-center gap-2">
              İptal Edilen
              {cancelledAppointments.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {cancelledAppointments.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="mt-4 overflow-y-auto max-h-[60vh] pr-2">
            <TabsContent value="in-progress">
              <AppointmentList appointments={inProgressAppointments} />
            </TabsContent>
            <TabsContent value="scheduled">
              <AppointmentList appointments={scheduledAppointments} />
            </TabsContent>
            <TabsContent value="completed">
              <AppointmentList appointments={completedAppointments} />
            </TabsContent>
            <TabsContent value="cancelled">
              <AppointmentList appointments={cancelledAppointments} />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
