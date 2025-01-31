import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Package2, ChevronDown } from "lucide-react";
import type { Database } from "@/types/supabase";
import { useMemo, useState } from "react";
import { format, isToday, isTomorrow, isYesterday } from "date-fns";
import { tr } from "date-fns/locale";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
type Service = Database["public"]["Tables"]["services"]["Row"];
type Trainer = Database["public"]["Tables"]["trainers"]["Row"];
type AppointmentStatus = "completed" | "cancelled" | "scheduled" | "in-progress";

interface AppointmentHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointments: Appointment[];
  services: { [key: string]: Service };
  trainers: { [key: string]: Trainer };
}

interface StatusConfig {
  color: string;
  text: string;
}

const STATUS_CONFIG: Record<AppointmentStatus, StatusConfig> = {
  completed: {
    color: "bg-green-100 text-green-700 border-green-300",
    text: "Tamamlandı"
  },
  cancelled: {
    color: "bg-red-100 text-red-700 border-red-300",
    text: "İptal Edildi"
  },
  scheduled: {
    color: "bg-blue-100 text-blue-700 border-blue-300",
    text: "Planlandı"
  },
  "in-progress": {
    color: "bg-yellow-100 text-yellow-700 border-yellow-300",
    text: "Devam Ediyor"
  }
};

const getStatusColor = (status: AppointmentStatus) => {
  return STATUS_CONFIG[status]?.color ?? "bg-gray-100 text-gray-700 border-gray-300";
};

const getStatusText = (status: AppointmentStatus) => {
  return STATUS_CONFIG[status]?.text ?? status;
};

const formatDate = (date: string) => {
  const appointmentDate = new Date(date);
  
  if (isToday(appointmentDate)) {
    return "Bugün";
  } else if (isTomorrow(appointmentDate)) {
    return "Yarın";
  } else if (isYesterday(appointmentDate)) {
    return "Dün";
  }
  
  return format(appointmentDate, "d MMMM yyyy, EEEE", { locale: tr });
};

const formatTime = (time: string) => {
  return time.slice(0, 5); // "14:30:00" -> "14:30"
};

const sortAppointments = (appointments: Appointment[]) => {
  return [...appointments].sort((a, b) => {
    const dateA = new Date(`${a.date} ${a.time}`);
    const dateB = new Date(`${b.date} ${b.time}`);
    const now = new Date();
    
    // Gelecek randevuları en üste al
    const isAFuture = dateA > now;
    const isBFuture = dateB > now;
    
    if (isAFuture && !isBFuture) return -1;
    if (!isAFuture && isBFuture) return 1;
    
    // Aynı kategorideyse (ikisi de gelecek veya geçmiş) tarihe göre sırala
    return Math.abs(dateA.getTime() - now.getTime()) - Math.abs(dateB.getTime() - now.getTime());
  });
};

const getAppointmentCardStyle = (date: string) => {
  const appointmentDate = new Date(date);
  
  if (isToday(appointmentDate)) {
    return "bg-primary/5 border-primary/20 hover:bg-primary/10";
  } else if (isTomorrow(appointmentDate)) {
    return "bg-blue-500/5 border-blue-500/20 hover:bg-blue-500/10";
  }
  
  return "bg-card hover:bg-accent/50";
};

const AppointmentCard = ({ appointment, service, trainer }: { 
  appointment: Appointment; 
  service: Service | undefined; 
  trainer: Trainer | undefined;
}) => {
  const cardStyle = getAppointmentCardStyle(appointment.date);
  const isUpcoming = isToday(new Date(appointment.date)) || isTomorrow(new Date(appointment.date));

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg border transition-colors ${cardStyle}`}>
      <div className="flex-1 grid gap-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className={`flex items-center gap-1.5 min-w-[140px] text-base font-medium ${isUpcoming ? "text-primary" : ""}`}>
            <Calendar className={`w-4 h-4 ${isUpcoming ? "text-primary" : "text-muted-foreground"}`} />
            {formatDate(appointment.date)}
          </span>
          <span className={`flex items-center gap-1.5 text-base font-medium ${isUpcoming ? "text-primary" : ""}`}>
            <Clock className={`w-4 h-4 ${isUpcoming ? "text-primary" : "text-muted-foreground"}`} />
            {formatTime(appointment.time)}
          </span>
        </div>
        <div className="text-sm text-muted-foreground flex items-center gap-1">
          <span>Eğitmen:</span> 
          <span className="text-foreground/80">{trainer?.first_name} {trainer?.last_name}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge className={`shrink-0 px-3 py-1 ${getStatusColor(appointment.status as AppointmentStatus)}`}>
          {getStatusText(appointment.status as AppointmentStatus)}
        </Badge>
      </div>
    </div>
  );
};

const ServiceGroup = ({ 
  serviceName, 
  appointments,
  services,
  trainers 
}: { 
  serviceName: string;
  appointments: Appointment[];
  services: { [key: string]: Service };
  trainers: { [key: string]: Trainer };
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const sortedAppointments = useMemo(() => sortAppointments(appointments), [appointments]);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="space-y-2"
    >
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-3 hover:bg-accent rounded-lg transition-colors">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Package2 className="w-5 h-5 text-primary" />
              </div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-lg font-semibold">
                  {serviceName}
                </h3>
                <span className="text-sm text-muted-foreground">
                  {appointments.length} randevu
                </span>
              </div>
            </div>
            <ChevronDown className={cn(
              "w-5 h-5 text-muted-foreground/50 transition-transform duration-200",
              isOpen && "transform rotate-180"
            )} />
          </div>
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent className="space-y-2">
        {sortedAppointments.map((appointment) => (
          <AppointmentCard
            key={appointment.id}
            appointment={appointment}
            service={services[appointment.service_id]}
            trainer={trainers[appointment.trainer_id]}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
};

export const AppointmentHistory = ({
  open,
  onOpenChange,
  appointments,
  services,
  trainers,
}: AppointmentHistoryProps) => {
  const filteredAppointments = useMemo(() => {
    const filterAndSort = (appointments: Appointment[]) => sortAppointments(appointments);
    
    return {
      all: filterAndSort(appointments),
      completed: filterAndSort(appointments.filter((apt) => apt.status === "completed")),
      cancelled: filterAndSort(appointments.filter((apt) => apt.status === "cancelled")),
      scheduled: filterAndSort(appointments.filter((apt) => apt.status === "scheduled")),
      "in-progress": filterAndSort(appointments.filter((apt) => apt.status === "in-progress")),
    };
  }, [appointments]);

  const tabs = useMemo(() => [
    { value: "all", label: "Tümü", count: filteredAppointments.all.length },
    { value: "scheduled", label: "Planlanan", count: filteredAppointments.scheduled.length },
    { value: "in-progress", label: "Devam Eden", count: filteredAppointments["in-progress"].length },
    { value: "completed", label: "Tamamlanan", count: filteredAppointments.completed.length },
    { value: "cancelled", label: "İptal Edilen", count: filteredAppointments.cancelled.length },
  ], [filteredAppointments]);

  const groupedAppointments = useMemo(() => {
    const groupByService = (appointments: Appointment[]) => {
      const groups: { [key: string]: Appointment[] } = {};
      
      appointments.forEach((apt) => {
        const serviceName = services[apt.service_id]?.name || "Diğer";
        if (!groups[serviceName]) {
          groups[serviceName] = [];
        }
        groups[serviceName].push(apt);
      });

      // Her grup içindeki randevuları tarihe göre sırala
      Object.keys(groups).forEach((key) => {
        groups[key] = sortAppointments(groups[key]);
      });

      return groups;
    };

    return {
      all: groupByService(filteredAppointments.all),
      completed: groupByService(filteredAppointments.completed),
      cancelled: groupByService(filteredAppointments.cancelled),
      scheduled: groupByService(filteredAppointments.scheduled),
      "in-progress": groupByService(filteredAppointments["in-progress"]),
    };
  }, [filteredAppointments, services]);

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
                <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-1">
                  {tab.label}
                  {tab.count > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {tab.count}
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {tabs.map((tab) => (
              <TabsContent key={tab.value} value={tab.value} className="mt-4">
                <div className="space-y-6">
                  {Object.entries(groupedAppointments[tab.value === "all" ? "all" : tab.value as keyof typeof groupedAppointments])
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([serviceName, appointments]) => (
                      <ServiceGroup
                        key={serviceName}
                        serviceName={serviceName}
                        appointments={appointments}
                        services={services}
                        trainers={trainers}
                      />
                    ))}
                  {Object.keys(groupedAppointments[tab.value === "all" ? "all" : tab.value as keyof typeof groupedAppointments]).length === 0 && (
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
