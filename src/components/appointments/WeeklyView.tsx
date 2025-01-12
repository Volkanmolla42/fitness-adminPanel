import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Appointment, Member, Service } from "@/types/appointments";
import AppointmentDetailsDialog from "./AppointmentDetailsDialog";
import { format, startOfWeek, addDays, addWeeks, subWeeks, endOfWeek } from "date-fns";
import { tr } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ServiceAppointmentsDialog } from "./ServiceAppointmentsDialog";

interface WeeklyViewProps {
  appointments: Appointment[];
  members: Member[];
  services: Service[];
  selectedTrainerId: string | null;
  onAppointmentClick: (appointment: Appointment) => void;
}

export default function WeeklyView({
  appointments,
  members,
  services,
  selectedTrainerId,
  onAppointmentClick,
}: WeeklyViewProps) {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);

  const getDayName = (dayIndex: number) => {
    const days = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
    return days[dayIndex];
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5);
  };

  const getMemberName = (memberId: string) => {
    const member = members.find((m) => m.id === memberId);
    return member ? `${member.first_name} ${member.last_name}` : "";
  };

  // Hafta tarihlerini hesapla ve önbelleğe al
  const weekDates = useMemo(() => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    return Array.from({ length: 6 }, (_, i) => addDays(weekStart, i));
  }, [selectedDate]);

  // Hafta başlangıç ve bitiş tarihlerini önbelleğe al
  const { weekStart, weekEnd } = useMemo(() => ({
    weekStart: startOfWeek(selectedDate, { weekStartsOn: 1 }),
    weekEnd: endOfWeek(selectedDate, { weekStartsOn: 1 })
  }), [selectedDate]);

  // Randevuları ve hizmetleri grupla ve önbelleğe al
  const appointmentsByDayAndHour = useMemo(() => {
    const result = new Map();
    
    for (let dayIndex = 0; dayIndex < 6; dayIndex++) {
      const currentDate = weekDates[dayIndex];
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      
      for (let hour = 8; hour <= 20; hour++) {
        const key = `${dayIndex}-${hour}`;
        const hourStr = hour.toString().padStart(2, "0");
        
        const filteredAppointments = appointments.filter((apt) => {
          const aptHour = parseInt(apt.time.split(":")[0]);
          return apt.date === dateStr && 
                 aptHour === hour && 
                 apt.trainer_id === selectedTrainerId &&
                 apt.status === "scheduled";
        });

        // Randevuları hizmetlere göre grupla
        const groupedByService = filteredAppointments.reduce((acc, appointment) => {
          const service = services.find(s => s.id === appointment.service_id);
          if (!service) return acc;

          if (!acc[service.id]) {
            acc[service.id] = {
              service,
              appointments: []
            };
          }
          acc[service.id].appointments.push(appointment);
          return acc;
        }, {} as Record<string, { service: Service, appointments: Appointment[] }>);

        result.set(key, Object.values(groupedByService));
      }
    }
    
    return result;
  }, [appointments, weekDates, selectedTrainerId, services]);

  // Belirli gün ve saat için randevuları getir
  const getAppointmentsForDayAndHour = (dayIndex: number, hour: number) => {
    return appointmentsByDayAndHour.get(`${dayIndex}-${hour}`) || [];
  };

  const handlePreviousWeek = () => {
    setSelectedDate(subWeeks(selectedDate, 1));
  };

  const handleNextWeek = () => {
    setSelectedDate(addWeeks(selectedDate, 1));
  };

  if (!selectedTrainerId) {
    return (
      <div className="flex justify-center items-center h-[400px] bg-white rounded-lg shadow">
        <p className="text-lg text-gray-500">Lütfen bir eğitmen seçin</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow">
        <Button variant="outline" size="icon" onClick={handlePreviousWeek}>
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">
            {format(weekStart, "d MMMM", { locale: tr })} - {format(weekEnd, "d MMMM yyyy", { locale: tr })}
          </span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon">
                <CalendarIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                locale={tr}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <Button variant="outline" size="icon" onClick={handleNextWeek}>
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px] bg-muted/50">
                <div className="text-sm font-semibold">Saat</div>
              </TableHead>
              {[0, 1, 2, 3, 4, 5].map((dayIndex) => (
                <TableHead
                  key={dayIndex}
                  className="min-w-[140px] bg-muted/50"
                >
                  <div className="text-sm font-semibold">
                    {getDayName(dayIndex)}
                    <div className="text-xs font-normal">
                      {format(weekDates[dayIndex], "d MMMM", { locale: tr })}
                    </div>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 13 }, (_, i) => i + 8).map((hour) => (
              <TableRow key={hour}>
                <TableCell className="font-medium text-sm p-1.5 bg-muted/50">
                  {`${hour.toString().padStart(2, "0")}:00`}
                </TableCell>
                {[0, 1, 2, 3, 4, 5].map((dayIndex) => (
                  <TableCell
                    key={dayIndex}
                    className="p-1 h-[80px] align-top"
                  >
                    {getAppointmentsForDayAndHour(dayIndex, hour).map(({ service, appointments }) => (
                      <div
                        key={service.id}
                        className="mb-2 last:mb-0 rounded-lg overflow-hidden border shadow-sm"
                      >
                        <div 
                          className={`text-xs font-medium px-2 py-1.5 flex items-center justify-between cursor-pointer hover:opacity-80
                            ${service.isVipOnly 
                              ? "bg-purple-300 text-purple-900" 
                              : "bg-blue-300 text-blue-900"}`}
                          onClick={() => {
                            setSelectedService(service);
                            setIsServiceDialogOpen(true);
                          }}
                        >
                          <div className="flex items-center">
                            {service.name}
                            {appointments.length > 1 && (
                              <span className="ml-1 text-[10px] px-1 py-0.5 rounded-full bg-white/50">
                                {appointments.length}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/80 text-muted-foreground">
                              {formatTime(appointments[0].time)}
                            </span>
                            {service.max_participants > 1 && appointments.length > 1 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/80 text-muted-foreground">
                                {appointments.length}/{service.max_participants}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="p-0.5">
                          {appointments.map((appointment) => (
                            <div
                              key={appointment.id}
                              onClick={() => {
                                setSelectedAppointment(appointment);
                                setIsDetailsDialogOpen(true);
                              }}
                              className={`
                                p-2 rounded text-sm mb-0.5 last:mb-0 cursor-pointer 
                                hover:opacity-80 transition-opacity
                                ${service.isVipOnly
                                  ? "bg-purple-200 hover:bg-purple-100"
                                  : "bg-blue-200 hover:bg-blue-100"
                                }
                                ${
                                  appointment.status === "completed"
                                    ? "!bg-green-50 hover:!bg-green-100"
                                    : appointment.status === "in-progress"
                                    ? "!bg-yellow-50 hover:!bg-yellow-100"
                                    : appointment.status === "cancelled"
                                    ? "!bg-red-50 hover:!bg-red-100"
                                    : ""
                                }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-medium truncate">
                                  {getMemberName(appointment.member_id)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AppointmentDetailsDialog
        isOpen={isDetailsDialogOpen}
        onClose={() => setIsDetailsDialogOpen(false)}
        appointment={selectedAppointment}
        appointments={appointments}
        members={members}
        services={services}
      />

      {selectedService && (
        <ServiceAppointmentsDialog
          isOpen={isServiceDialogOpen}
          onClose={() => {
            setIsServiceDialogOpen(false);
            setSelectedService(null);
          }}
          service={selectedService}
          appointments={appointments.filter(
            (apt) => 
              apt.service_id === selectedService.id && 
              apt.trainer_id === selectedTrainerId &&
              apt.status === "scheduled"
          )}
          members={members}
        />
      )}
    </div>
  );
};
