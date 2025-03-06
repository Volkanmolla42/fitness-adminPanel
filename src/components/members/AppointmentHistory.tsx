import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Package2, ChevronDown, User } from "lucide-react";
import type { Database } from "@/types/supabase";
import { useMemo, useState, useCallback } from "react";
import { format, isToday, isTomorrow, isYesterday, parseISO, isFuture } from "date-fns";
import { tr } from "date-fns/locale";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
type Service = Database["public"]["Tables"]["services"]["Row"];
type Trainer = Database["public"]["Tables"]["trainers"]["Row"];
type AppointmentStatus = "completed" | "cancelled" | "scheduled" | "in-progress";
type Member = Database["public"]["Tables"]["members"]["Row"];

interface AppointmentHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointments: Appointment[];
  services: { [key: string]: Service };
  trainers: { [key: string]: Trainer };
  member: Member;
}

interface StatusConfig {
  color: string;
  text: string;
  bgColor: string;
  icon?: React.ReactNode;
}

const STATUS_CONFIG: Record<AppointmentStatus, StatusConfig> = {
  completed: {
    color: "bg-green-100 text-green-700 border-green-300",
    bgColor: "bg-green-50",
    text: "Tamamlandı"
  },
  cancelled: {
    color: "bg-red-100 text-red-700 border-red-300",
    bgColor: "bg-red-50",
    text: "İptal Edildi"
  },
  scheduled: {
    color: "bg-blue-100 text-blue-700 border-blue-300",
    bgColor: "bg-blue-50",
    text: "Planlandı"
  },
  "in-progress": {
    color: "bg-yellow-100 text-yellow-700 border-yellow-300",
    bgColor: "bg-yellow-50",
    text: "Devam Ediyor"
  }
};

const getStatusColor = (status: AppointmentStatus) => {
  return STATUS_CONFIG[status]?.color ?? "bg-gray-100 text-gray-700 border-gray-300";
};

const getStatusText = (status: AppointmentStatus) => {
  return STATUS_CONFIG[status]?.text ?? status;
};

const getStatusBgColor = (status: AppointmentStatus) => {
  return STATUS_CONFIG[status]?.bgColor ?? "bg-gray-50";
};

const formatDate = (date: string) => {
  const appointmentDate = parseISO(date);
  
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

const getAppointmentCardStyle = (date: string, status: AppointmentStatus) => {
  const appointmentDate = parseISO(date);
  
  if (status === "cancelled") {
    return "bg-red-50/70 border-red-200/70 hover:bg-red-100/50";
  } else if (status === "completed") {
    return "bg-green-50/70 border-green-200/70 hover:bg-green-100/50";
  } else if (isToday(appointmentDate)) {
    return "bg-primary/5 border-primary/20 hover:bg-primary/10";
  } else if (isTomorrow(appointmentDate)) {
    return "bg-blue-50/70 border-blue-200/70 hover:bg-blue-100/50";
  } else if (status === "in-progress") {
    return "bg-yellow-50/70 border-yellow-200/70 hover:bg-yellow-100/50";
  }
  
  return "bg-card hover:bg-accent/50";
};

interface AppointmentCardProps {
  appointment: Appointment;
  trainer: Trainer | undefined;
}

const AppointmentCard = React.memo(({ appointment, trainer }: AppointmentCardProps) => {
  const cardStyle = getAppointmentCardStyle(appointment.date, appointment.status as AppointmentStatus);
  const isUpcoming = isFuture(parseISO(`${appointment.date}T${appointment.time}`));
  const status = appointment.status as AppointmentStatus;

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg border shadow-sm transition-colors ${cardStyle}`}>
      <div className="flex-1 grid gap-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className={`flex items-center gap-1.5 min-w-[140px] text-sm sm:text-base font-medium ${isUpcoming ? "text-primary" : ""}`}>
            <Calendar className={`w-4 h-4 ${isUpcoming ? "text-primary" : "text-muted-foreground"}`} />
            {formatDate(appointment.date)}
          </span>
          <span className={`flex items-center gap-1.5 text-sm sm:text-base font-medium ${isUpcoming ? "text-primary" : ""}`}>
            <Clock className={`w-4 h-4 ${isUpcoming ? "text-primary" : "text-muted-foreground"}`} />
            {formatTime(appointment.time)}
          </span>
        </div>
        <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5">
          <User className="w-3.5 h-3.5" />
          <span>Antrenör:</span> 
          <span className="text-foreground/80 font-medium">{trainer?.first_name} {trainer?.last_name}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge className={`shrink-0 px-3 py-1 ${getStatusColor(status)} ${getStatusBgColor(status)}`}>
                {getStatusText(status)}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Durum: {getStatusText(status)}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
});

AppointmentCard.displayName = "AppointmentCard";

interface ServiceGroupProps {
  serviceName: string;
  appointments: Appointment[];
  trainers: { [key: string]: Trainer };
}

const ServiceGroup = React.memo(({ 
  serviceName, 
  appointments,
  trainers 
}: ServiceGroupProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const sortedAppointments = useMemo(() => sortAppointments(appointments), [appointments]);
  const hasUpcomingAppointments = useMemo(() => 
    sortedAppointments.some(apt => isFuture(parseISO(`${apt.date}T${apt.time}`))),
    [sortedAppointments]
  );

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="space-y-2"
    >
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <CollapsibleTrigger className="w-full">
          <div className={cn(
            "flex items-center justify-between p-3 hover:bg-accent rounded-lg transition-colors",
            hasUpcomingAppointments && "border-l-4 border-primary pl-2"
          )}>
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

      <CollapsibleContent className="space-y-2.5 pl-1">
        {sortedAppointments.map((appointment) => (
          <AppointmentCard
            key={appointment.id}
            appointment={appointment}
            trainer={trainers[appointment.trainer_id]}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
});

ServiceGroup.displayName = "ServiceGroup";

export const AppointmentHistory = ({
  open,
  onOpenChange,
  appointments,
  services,
  trainers,
  member,
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
    { value: "completed", label: "Tamamlanan", count: filteredAppointments.completed.length },
    { value: "scheduled", label: "Planlanan", count: filteredAppointments.scheduled.length },
    { value: "cancelled", label: "İptal Edilen", count: filteredAppointments.cancelled.length },
    { value: "in-progress", label: "Devam Eden", count: filteredAppointments["in-progress"].length },
    { value: "all", label: "Tümü", count: filteredAppointments.all.length },
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

  const renderTabContent = useCallback((tabValue: string) => {
    const currentGroups = groupedAppointments[tabValue === "all" ? "all" : tabValue as keyof typeof groupedAppointments];
    
    if (Object.keys(currentGroups).length === 0) {
      return (
        <div className="text-center text-muted-foreground py-12 bg-accent/30 rounded-lg">
          <p className="text-lg">Bu kategoride randevu bulunmuyor</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        {Object.entries(currentGroups)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([serviceName, appointments]) => (
            <ServiceGroup
              key={serviceName}
              serviceName={serviceName}
              appointments={appointments}
              trainers={trainers}
            />
          ))}
      </div>
    );
  }, [groupedAppointments, trainers]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[85vh] max-w-3xl overflow-hidden flex flex-col">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <span className="font-semibold">{member.first_name} {member.last_name}</span>
            <span className="text-muted-foreground">-</span>
            <span>Randevu Geçmişi</span>
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-2">
          <Tabs defaultValue="completed" className="w-full">
            <TabsList className="w-full mb-4 grid grid-cols-5 ">
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
                {renderTabContent(tab.value)}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
