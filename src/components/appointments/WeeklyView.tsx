import React, { useState, useMemo } from "react";
import { useTheme } from "@/contexts/theme-context";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
//import TIME_SLOTS  from "@/constants/timeSlots";
// geçici olarak saatler
const OLD_TIME_SLOTS = [
  "10:00",
  "11:30",
  "13:00",
  "14:00",
  "15:30",
  "17:00",
  "18:00",
  "19:00",
];
const NEW_TIME_SLOTS = [
  "11:30",
  "12:30",
  "13:30",
  "15:00",
  "16:30",
  "20:00",
  "21:00",
  "22:00"
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
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [selectedTimeType, setSelectedTimeType] = useState<"old" | "new">("new");

  const TIME_SLOTS = selectedTimeType === "old" ? OLD_TIME_SLOTS : NEW_TIME_SLOTS;

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
  }, [appointments, weekDates, selectedTrainerId, services, TIME_SLOTS]);

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
      <div className={`flex justify-center items-center h-[400px] rounded-lg shadow ${
        isDark ? "bg-gray-800 text-gray-300" : "bg-white text-gray-500"
      }`}>
        <p className="text-lg">Lütfen bir antrenör seçin</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className={isDark ? "text-gray-300" : "text-gray-700"}>Saat aralığını seçin</span>
          <Select
            value={selectedTimeType}
            onValueChange={(value: "old" | "new") => setSelectedTimeType(value)}
          >
            <SelectTrigger className={`w-[180px] ${
              isDark ? "bg-gray-800 border-gray-700 text-gray-300" : "bg-white"
            }`}>
              <SelectValue placeholder="Saat tipini seçin" />
            </SelectTrigger>
            <SelectContent className={isDark ? "bg-gray-800 border-gray-700" : ""}>
              <SelectItem value="old" className={isDark ? "text-gray-300" : ""}>Normal Saatler</SelectItem>
              <SelectItem value="new" className={isDark ? "text-gray-300" : ""}>Ramazan Saatleri</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className={`flex items-center justify-between p-4 rounded-lg shadow ${
        isDark ? "bg-gray-800" : "bg-white"
      }`}>
        <Button variant="outline" size="icon" onClick={handlePreviousWeek} 
          className={isDark ? "border-gray-700 hover:bg-gray-700" : ""}>
          <ChevronLeftIcon className={`h-4 w-4 ${isDark ? "text-gray-300" : ""}`} />
        </Button>

        <div className="flex items-center gap-2">
          <span className={`text-lg font-semibold ${isDark ? "text-gray-300" : ""}`}>
            {format(weekStart, "d MMMM", { locale: tr })} -{" "}
            {format(weekEnd, "d MMMM yyyy", { locale: tr })}
          </span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" 
                className={isDark ? "border-gray-700 hover:bg-gray-700" : ""}>
                <CalendarIcon className={`h-4 w-4 ${isDark ? "text-gray-300" : ""}`} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className={`w-auto p-0 ${isDark ? "bg-gray-800 border-gray-700" : ""}`}>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                locale={tr}
                initialFocus
                className={isDark ? "dark" : ""}
              />
            </PopoverContent>
          </Popover>
        </div>

        <Button variant="outline" size="icon" onClick={handleNextWeek}
          className={isDark ? "border-gray-700 hover:bg-gray-700" : ""}>
          <ChevronRightIcon className={`h-4 w-4 ${isDark ? "text-gray-300" : ""}`} />
        </Button>
      </div>

      <div className={`rounded-lg shadow overflow-x-auto ${isDark ? "bg-gray-800" : "bg-white"}`}>
        <Table className={`border-2 ${isDark ? "border-gray-700" : "border-gray-300"}`}>
          <TableHeader>
            <TableRow className={`border-b-2 ${isDark ? "border-gray-700" : "border-gray-300"}`}>
              <TableHead className={`w-[50px] border-r-2 ${
                isDark 
                  ? "bg-gray-900/50 border-gray-700 text-gray-300" 
                  : "bg-muted/50 border-gray-300"
              }`}>
                <div className="text-sm font-semibold">Saat</div>
              </TableHead>
              {[0, 1, 2, 3, 4, 5].map((dayIndex) => (
                <TableHead
                  key={dayIndex}
                  className={`min-w-[140px] border-r-2 last:border-r-0 ${
                    isDark 
                      ? "bg-gray-900/50 border-gray-700 text-gray-300" 
                      : "bg-muted/50 border-gray-300"
                  }`}
                >
                  <div className="text-sm font-semibold">
                    {getDayName(dayIndex)}
                    <div className={`text-xs font-normal ${isDark ? "text-gray-400" : ""}`}>
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
                <TableCell className={`font-medium text-sm p-1.5 border-r-2 ${
                  isDark 
                    ? "bg-gray-900/50 border-gray-700 text-gray-300" 
                    : "bg-muted/50 border-gray-300"
                }`}>
                  {timeSlot}
                </TableCell>
                {[0, 1, 2, 3, 4, 5].map((dayIndex) => (
                  <TableCell
                    key={dayIndex}
                    className={`p-1 h-[80px] align-top border-r-2 last:border-r-0 border-b ${
                      isDark ? "border-gray-700" : "border-gray-300"
                    }`}
                  >
                    <div className="space-y-2">
                      {getAppointmentsForDayAndHour(dayIndex, timeSlot).map(
                        ({ service, appointments }) => (
                          <div
                            key={service.id}
                            className={`rounded-lg overflow-hidden shadow-sm ${
                              isDark ? "border-gray-700" : "border"
                            }`}
                          >
                            <div
                              className={`text-xs font-medium px-2 py-1.5 flex items-center justify-between cursor-pointer hover:opacity-80
                              ${
                                service.isVipOnly
                                  ? isDark 
                                    ? "bg-purple-900 text-purple-100" 
                                    : "bg-purple-300 text-purple-900"
                                  : isDark 
                                    ? "bg-blue-900 text-blue-100" 
                                    : "bg-blue-300 text-blue-900"
                              }`}
                            
                            >
                              <div className="flex items-center">
                                {service.name}
                                {appointments.length > 1 && (
                                  <span className={`ml-1 text-[10px] px-1 py-0.5 rounded-full ${
                                    isDark ? "bg-white/20" : "bg-white/50"
                                  }`}>
                                    {appointments.length}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                  isDark ? "bg-white/20" : "bg-white/80"
                                } text-muted-foreground`}>
                                  {formatTime(appointments[0].time)}
                                </span>
                                {service.max_participants > 1 &&
                                  appointments.length > 1 && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                      isDark ? "bg-white/20" : "bg-white/80"
                                    } text-muted-foreground`}>
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
                                      ? isDark 
                                        ? "bg-purple-900/50 hover:bg-purple-900/70" 
                                        : "bg-purple-200 hover:bg-purple-100"
                                      : isDark 
                                        ? "bg-blue-900/50 hover:bg-blue-900/70" 
                                        : "bg-blue-200 hover:bg-blue-100"
                                  }
                                  ${
                                    appointment.status === "completed"
                                      ? isDark 
                                        ? "!bg-green-900/50 hover:!bg-green-900/70" 
                                        : "!bg-green-50 hover:!bg-green-100"
                                      : appointment.status === "in-progress"
                                      ? isDark 
                                        ? "!bg-yellow-900/50 hover:!bg-yellow-900/70" 
                                        : "!bg-yellow-50 hover:!bg-yellow-100"
                                      : appointment.status === "cancelled"
                                      ? isDark 
                                        ? "!bg-red-900/50 hover:!bg-red-900/70" 
                                        : "!bg-red-50 hover:!bg-red-100"
                                      : ""
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className={`font-medium truncate ${
                                      isDark ? "text-gray-300" : ""
                                    }`}>
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
                          className={`w-full h-6 flex items-center justify-center text-green-600 ${
                            isDark ? "bg-green-900/50 hover:bg-green-900/70" : "bg-green-50 hover:bg-green-200"
                          } rounded transition-colors`}
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
    </div>
  );
}
