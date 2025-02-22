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
import {
  format,
  startOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  endOfWeek,
} from "date-fns";
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
//import TIME_SLOTS  from "@/constants/timeSlots";
// geçici olarak saatler
const TIME_SLOTS = [
  "10:00",
  "11:30",
  "13:00",
  "14:00",
  "15:30",
  "17:00",
  "18:00",
  "19:00",
];
interface WeeklyViewProps {
  appointments: Appointment[];
  members: Member[];
  services: Service[];
  selectedTrainerId: string | null;
  onAppointmentClick: (appointment: Appointment) => void;
  onAddAppointment: (date: string, time: string) => void;
}

export default function WeeklyView({
  appointments,
  members,
  services,
  selectedTrainerId,
  onAppointmentClick,
  onAddAppointment,
}: WeeklyViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);

  const getDayName = (dayIndex: number) => {
    const days = [
      "Pazartesi",
      "Salı",
      "Çarşamba",
      "Perşembe",
      "Cuma",
      "Cumartesi",
    ];
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
  const { weekStart, weekEnd } = useMemo(
    () => ({
      weekStart: startOfWeek(selectedDate, { weekStartsOn: 1 }),
      weekEnd: endOfWeek(selectedDate, { weekStartsOn: 1 }),
    }),
    [selectedDate]
  );

  // Randevuları ve hizmetleri grupla ve önbelleğe al
  const appointmentsByDayAndHour = useMemo(() => {
    const result = new Map();

    for (let dayIndex = 0; dayIndex < 6; dayIndex++) {
      const currentDate = weekDates[dayIndex];
      const dateStr = format(currentDate, "yyyy-MM-dd");

      for (const timeSlot of TIME_SLOTS) {
        const hour = timeSlot.split(":")[0];
        const minute = timeSlot.split(":")[1];
        const key = `${dayIndex}-${timeSlot}`;

        const filteredAppointments = appointments.filter((apt) => {
          const [aptHour, aptMinute] = apt.time.split(":");
          return (
            apt.date === dateStr &&
            aptHour === hour &&
            aptMinute === minute &&
            apt.trainer_id === selectedTrainerId &&
            apt.status === "scheduled"
          );
        });

        // Randevuları hizmetlere göre grupla
        const groupedByService = filteredAppointments.reduce(
          (acc, appointment) => {
            const service = services.find(
              (s) => s.id === appointment.service_id
            );
            if (!service) return acc;

            if (!acc[service.id]) {
              acc[service.id] = {
                service,
                appointments: [],
              };
            }
            acc[service.id].appointments.push(appointment);
            return acc;
          },
          {} as Record<
            string,
            { service: Service; appointments: Appointment[] }
          >
        );

        result.set(key, Object.values(groupedByService));
      }
    }

    return result;
  }, [appointments, weekDates, selectedTrainerId, services]);

  // Belirli gün ve saat için randevuları getir
  const getAppointmentsForDayAndHour = (dayIndex: number, timeSlot: string) => {
    return appointmentsByDayAndHour.get(`${dayIndex}-${timeSlot}`) || [];
  };

  // Belirli gün ve saatte kontenjan var mı kontrol et
  const hasAvailableSlot = (dayIndex: number, timeSlot: string) => {
    const currentDate = new Date();
    const slotDate = weekDates[dayIndex];
    const [hour, minute] = timeSlot.split(":").map(Number);
    const slotDateTime = new Date(slotDate);
    slotDateTime.setHours(hour, minute, 0, 0);

    // Geçmiş tarih ve saatler için false döndür
    if (slotDateTime < currentDate) {
      return false;
    }

    const appointments = getAppointmentsForDayAndHour(dayIndex, timeSlot);

    // Hiç randevu yoksa, kontenjan vardır
    if (appointments.length === 0) {
      return true;
    }

    // VIP randevusu varsa, kontenjan yoktur
    const hasVipAppointment = appointments.some(
      ({ service }) => service.isVipOnly
    );
    if (hasVipAppointment) {
      return false;
    }

    // Standart randevular için toplam katılımcı sayısını kontrol et
    const totalParticipants = appointments.reduce(
      (total: number, { appointments }) => total + appointments.length,
      0
    );
    const MAX_STANDARD_PARTICIPANTS = 4;

    return totalParticipants < MAX_STANDARD_PARTICIPANTS;
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
    <div className="space-y-4 ">
      <span>Bu tabloda geçici süreyle
        eskı saatler gösterilmektedir. ramazan saatlerine girilen randevuları görmek
        için <span className="font-semibold underline">liste </span> veya{" "}
        <span className="font-semibold underline">tablo</span> görünümlerini
        kullanabilirsiniz.
      </span>
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow">
        <Button variant="outline" size="icon" onClick={handlePreviousWeek}>
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">
            {format(weekStart, "d MMMM", { locale: tr })} -{" "}
            {format(weekEnd, "d MMMM yyyy", { locale: tr })}
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
        <Table className="border-2 border-gray-300">
          <TableHeader>
            <TableRow className="border-b-2 border-gray-300">
              <TableHead className="w-[50px] bg-muted/50 border-r-2 border-gray-300">
                <div className="text-sm font-semibold">Saat</div>
              </TableHead>
              {[0, 1, 2, 3, 4, 5].map((dayIndex) => (
                <TableHead
                  key={dayIndex}
                  className="min-w-[140px] bg-muted/50 border-r-2 border-gray-300 last:border-r-0"
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
            {TIME_SLOTS.map((timeSlot) => (
              <TableRow key={timeSlot}>
                <TableCell className="font-medium text-sm p-1.5 bg-muted/50 border-r-2 border-gray-300">
                  {timeSlot}
                </TableCell>
                {[0, 1, 2, 3, 4, 5].map((dayIndex) => (
                  <TableCell
                    key={dayIndex}
                    className="p-1 h-[80px] align-top border-r-2 border-gray-300 last:border-r-0 border-b"
                  >
                    <div className="space-y-2">
                      {getAppointmentsForDayAndHour(dayIndex, timeSlot).map(
                        ({ service, appointments }) => (
                          <div
                            key={service.id}
                            className="rounded-lg overflow-hidden border shadow-sm"
                          >
                            <div
                              className={`text-xs font-medium px-2 py-1.5 flex items-center justify-between cursor-pointer hover:opacity-80
                              ${
                                service.isVipOnly
                                  ? "bg-purple-300 text-purple-900"
                                  : "bg-blue-300 text-blue-900"
                              }`}
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
                                {service.max_participants > 1 &&
                                  appointments.length > 1 && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/80 text-muted-foreground">
                                      {appointments.length}/
                                      {service.max_participants}
                                    </span>
                                  )}
                              </div>
                            </div>
                            <div className="p-0.5">
                              {appointments.map((appointment) => (
                                <div
                                  key={appointment.id}
                                  onClick={() =>
                                    onAppointmentClick(appointment)
                                  }
                                  className={`
                                  p-2 rounded text-sm mb-0.5 last:mb-0 cursor-pointer 
                                  hover:opacity-80 transition-opacity
                                  ${
                                    service.isVipOnly
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
                        )
                      )}
                      {hasAvailableSlot(dayIndex, timeSlot) && (
                        <button
                          onClick={() =>
                            onAddAppointment(
                              format(weekDates[dayIndex], "yyyy-MM-dd"),
                              timeSlot
                            )
                          }
                          className="w-full h-6 flex items-center justify-center text-green-600 bg-green-50 hover:bg-green-200 rounded transition-colors"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                          </svg>
                        </button>
                      )}
                    </div>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

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
}
