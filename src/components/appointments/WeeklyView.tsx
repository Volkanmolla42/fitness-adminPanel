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
  parseISO,
} from "date-fns";
import { tr } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Trash2Icon,
  MessageCircle,
} from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteAppointmentById } from "@/lib/queries";
import { toast } from "sonner";
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
  "22:00",
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

  const [selectedTimeType, setSelectedTimeType] = useState<"old" | "new">(
    "new"
  );

  const TIME_SLOTS =
    selectedTimeType === "old" ? OLD_TIME_SLOTS : NEW_TIME_SLOTS;

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

  const getMemberName = (memberId: string) => {
    const member = members.find((m) => m.id === memberId);
    return member ? `${member.first_name} ${member.last_name}` : "";
  };

  const getMemberPhone = (memberId: string) => {
    const member = members.find((m) => m.id === memberId);
    return member?.phone || "";
  };

  const createWhatsAppMessage = (appointment: Appointment) => {
    const memberName = getMemberName(appointment.member_id);
    const service = services.find((s) => s.id === appointment.service_id);
    const serviceName = service ? service.name : "";
    const appointmentDate = format(parseISO(appointment.date), "d MMMM yyyy", {
      locale: tr,
    });

    // Saat formatını düzelt (saniye bilgisini kaldır)
    const appointmentTime = appointment.time.split(":").slice(0, 2).join(":");

    return `Merhaba ${memberName}, ${serviceName} randevunuz ${appointmentDate} tarihinde saat ${appointmentTime}'de bulunmaktadir. Lütfen zamanında gelmeyi unutmayınız. İyi günler dileriz.`;
  };

  const createWhatsAppLink = (phone: string, message: string) => {
    // Önce telefon numarasındaki tüm boşlukları, parantezleri ve tire işaretlerini temizle
    const cleanPhone = phone.replace(/[\s()-]/g, "");

    // Temizlenmiş numarayı WhatsApp formatına çevir
    const formattedPhone = cleanPhone.startsWith("0")
      ? `9${cleanPhone.substring(1)}` // Baştaki 0'ı kaldır ve 9 ekle
      : cleanPhone.startsWith("+90")
      ? cleanPhone.replace("+", "") // + işaretini kaldır
      : cleanPhone.startsWith("90")
      ? cleanPhone // Zaten 90 ile başlıyorsa değiştirme
      : `90${cleanPhone}`; // Hiçbiri değilse başına 90 ekle

    const encodedMessage = encodeURIComponent(message);

    return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
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

  // Belirli gün ve saat için katılımcı bilgilerini hesapla
  const calculateParticipantInfo = (dayIndex: number, timeSlot: string) => {
    const appointments = getAppointmentsForDayAndHour(dayIndex, timeSlot);

    // Maksimum katılımcı sayısını belirle
    const maxParticipants = appointments[0]?.service?.max_participants || 4;

    // Mevcut katılımcı sayısını hesapla
    const totalParticipants = appointments.reduce(
      (total: number, { appointments }) => total + (appointments?.length || 1),
      0
    );

    return {
      appointments,
      maxParticipants,
      totalParticipants,
      hasVipAppointment: appointments.some(({ service }) => service?.isVipOnly),
    };
  };

  // Belirli gün ve saatte kontenjan var mı kontrol et
  const hasAvailableSlot = (dayIndex: number, timeSlot: string) => {
    // 1. Tarih ve zaman hesaplamaları
    const currentDate = new Date();
    const slotDate = weekDates[dayIndex];
    const [hour, minute] = timeSlot.split(":").map(Number);
    const slotDateTime = new Date(slotDate);
    slotDateTime.setHours(hour, minute, 0, 0);

    // Geçmiş tarih ve saatler için hemen false döndür
    if (slotDateTime < currentDate) {
      return false;
    }

    const { hasVipAppointment, totalParticipants, maxParticipants } =
      calculateParticipantInfo(dayIndex, timeSlot);

    // VIP randevusu varsa veya kontenjan doluysa false döndür
    return !hasVipAppointment && totalParticipants < maxParticipants;
  };

  // Belirli gün ve saatte kaç tane boş slot olduğunu hesapla
  const calculateAvailableSlots = (dayIndex: number, timeSlot: string) => {
    const { totalParticipants, maxParticipants } = calculateParticipantInfo(
      dayIndex,
      timeSlot
    );
    return Math.max(0, maxParticipants - totalParticipants);
  };

  const handlePreviousWeek = () => {
    setSelectedDate(subWeeks(selectedDate, 1));
  };

  const handleNextWeek = () => {
    setSelectedDate(addWeeks(selectedDate, 1));
  };

  // Boş slot için buton oluştur
  const renderAddButton = (
    dayIndex: number,
    timeSlot: string,
    index: number
  ) => (
    <button
      key={index}
      onClick={() =>
        onAddAppointment(format(weekDates[dayIndex], "yyyy-MM-dd"), timeSlot)
      }
      className={`w-full h-6 flex items-center justify-center text-green-600 ${
        isDark
          ? "bg-green-900/50 hover:bg-green-900/70"
          : "bg-green-50 hover:bg-green-200"
      } rounded transition-colors ${index > 0 ? "ml-1" : ""}`}
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
  );

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<
    string | null
  >(null);

  const handleDeleteAppointment = async () => {
    if (!selectedAppointmentId) return;

    try {
      const result = await deleteAppointmentById(selectedAppointmentId);
      if (result.success) {
        toast.success("Randevu başarıyla silindi");
      } else {
        toast.error("Randevu silinirken hata oluştu");
      }
    } catch {
      toast.error("Randevu silinirken hata oluştu");
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  // Servis dialog state'leri
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedServiceAppointments, setSelectedServiceAppointments] =
    useState<Appointment[]>([]);

  // Servis adına tıklandığında üyeleri göster
  const handleServiceClick = (
    service: Service,
    serviceAppointments: Appointment[]
  ) => {
    setSelectedService(service);
    setSelectedServiceAppointments(serviceAppointments);
    setServiceDialogOpen(true);
  };

  if (!selectedTrainerId) {
    return (
      <div
        className={`flex justify-center items-center h-[400px] rounded-lg shadow ${
          isDark ? "bg-gray-800 text-gray-300" : "bg-white text-gray-500"
        }`}
      >
        <p className="text-lg">Lütfen bir antrenör seçin</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className={isDark ? "text-gray-300" : "text-gray-700"}>
            Saat aralığını seçin
          </span>
          <Select
            value={selectedTimeType}
            onValueChange={(value: "old" | "new") => setSelectedTimeType(value)}
          >
            <SelectTrigger
              className={`w-[180px] ${
                isDark
                  ? "bg-gray-800 border-gray-700 text-gray-300"
                  : "bg-white"
              }`}
            >
              <SelectValue placeholder="Saat tipini seçin" />
            </SelectTrigger>
            <SelectContent
              className={isDark ? "bg-gray-800 border-gray-700" : ""}
            >
              <SelectItem value="old" className={isDark ? "text-gray-300" : ""}>
                Normal Saatler
              </SelectItem>
              <SelectItem value="new" className={isDark ? "text-gray-300" : ""}>
                Ramazan Saatleri
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div
        className={`flex items-center justify-between p-4 rounded-lg shadow ${
          isDark ? "bg-gray-800" : "bg-white"
        }`}
      >
        <Button
          variant="outline"
          size="icon"
          onClick={handlePreviousWeek}
          className={isDark ? "border-gray-700 hover:bg-gray-700" : ""}
        >
          <ChevronLeftIcon
            className={`h-4 w-4 ${isDark ? "text-gray-300" : ""}`}
          />
        </Button>

        <div className="flex items-center gap-2">
          <span
            className={`text-lg font-semibold ${isDark ? "text-gray-300" : ""}`}
          >
            {format(weekStart, "d MMMM", { locale: tr })} -{" "}
            {format(weekEnd, "d MMMM yyyy", { locale: tr })}
          </span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={isDark ? "border-gray-700 hover:bg-gray-700" : ""}
              >
                <CalendarIcon
                  className={`h-4 w-4 ${isDark ? "text-gray-300" : ""}`}
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className={`w-auto p-0 ${
                isDark ? "bg-gray-800 border-gray-700" : ""
              }`}
            >
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

        <Button
          variant="outline"
          size="icon"
          onClick={handleNextWeek}
          className={isDark ? "border-gray-700 hover:bg-gray-700" : ""}
        >
          <ChevronRightIcon
            className={`h-4 w-4 ${isDark ? "text-gray-300" : ""}`}
          />
        </Button>
      </div>

      <div
        className={`rounded-lg shadow overflow-x-auto ${
          isDark ? "bg-gray-800" : "bg-white"
        }`}
      >
        <Table
          className={`border-2 ${
            isDark ? "border-gray-700" : "border-gray-300"
          }`}
        >
          <TableHeader>
            <TableRow
              className={`border-b-2 ${
                isDark ? "border-gray-700" : "border-gray-300"
              }`}
            >
              <TableHead
                className={`w-[50px] border-r-2 ${
                  isDark
                    ? "bg-gray-900/50 border-gray-700 text-gray-300"
                    : "bg-muted/50 border-gray-300"
                }`}
              >
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
                    <div
                      className={`text-xs font-normal ${
                        isDark ? "text-gray-400" : ""
                      }`}
                    >
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
                <TableCell
                  className={`font-medium text-sm p-1.5 border-r-2 ${
                    isDark
                      ? "bg-gray-900/50 border-gray-700 text-gray-300"
                      : "bg-muted/50 border-gray-300"
                  }`}
                >
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
                              className={`text-xs font-medium px-2 py-1.5 hover:underline underline-offset-2 flex items-center justify-between cursor-pointer hover:opacity-80
                              ${
                                service.isVipOnly
                                  ? isDark
                                    ? "bg-purple-900 text-purple-100"
                                    : "bg-purple-300 text-purple-900"
                                  : isDark
                                  ? "bg-blue-900 text-blue-100"
                                  : "bg-blue-300 text-blue-900"
                              }`}
                              onClick={() =>
                                handleServiceClick(service, appointments)
                              }
                            >
                              {service.name}

                              {service.max_participants > 1 &&
                                appointments.length > 1 && (
                                  <span
                                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                      isDark ? "bg-white/20" : "bg-white/80"
                                    }`}
                                  >
                                    {appointments.length}/
                                    {service.max_participants}
                                  </span>
                                )}
                            </div>
                            <div className="p-0.5">
                              {appointments.map((appointment) => (
                                <div
                                  key={appointment.id}
                                  className={`rounded text-sm mb-0.5 last:mb-0 cursor-pointer 
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
                                  <div
                                    className="flex items-center p-2 border rounded justify-between gap-2"
                                    onClick={() =>
                                      onAppointmentClick(appointment)
                                    }
                                  >
                                    <span
                                      className={`truncate text-sm ${
                                        isDark ? "text-gray-300" : ""
                                      }`}
                                    >
                                      {getMemberName(appointment.member_id)}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedAppointmentId(
                                          appointment.id
                                        );
                                        setDeleteDialogOpen(true);
                                      }}
                                    >
                                      <Trash2Icon className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      )}
                      {hasAvailableSlot(dayIndex, timeSlot) && (
                        <div className="flex">
                          {Array.from({
                            length: calculateAvailableSlots(dayIndex, timeSlot),
                          }).map((_, index) =>
                            renderAddButton(dayIndex, timeSlot, index)
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent
          className={isDark ? "bg-gray-800 text-gray-300 border-gray-700" : ""}
        >
          <DialogHeader>
            <DialogTitle className={isDark ? "text-gray-300" : ""}>
              Randevu Silme Onayı
            </DialogTitle>
            <DialogDescription className={isDark ? "text-gray-400" : ""}>
              Bu randevuyu silmek istediğinizden emin misiniz? Bu işlem geri
              alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className={
                isDark
                  ? "bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600"
                  : ""
              }
            >
              İptal
            </Button>
            <Button variant="destructive" onClick={handleDeleteAppointment}>
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Servis Üyeleri Dialog */}
      <Dialog open={serviceDialogOpen} onOpenChange={setServiceDialogOpen}>
        <DialogContent
          className={isDark ? "bg-gray-800 text-gray-300 border-gray-700" : ""}
        >
          <DialogHeader>
            <DialogTitle className={isDark ? "text-gray-300" : ""}>
              {selectedService?.name} - Üye Listesi
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[300px] overflow-y-auto">
            {selectedServiceAppointments.length > 0 ? (
              <div
                className={`rounded-md border ${
                  isDark ? "border-gray-700" : "border-gray-200"
                }`}
              >
                <Table>
                  <TableHeader>
                    <TableRow
                      className={isDark ? "border-gray-700" : "border-gray-200"}
                    >
                      <TableHead className={isDark ? "text-gray-300" : ""}>
                        Üye Adı
                      </TableHead>
                      <TableHead className={isDark ? "text-gray-300" : ""}>
                        Durum
                      </TableHead>
                      <TableHead className={isDark ? "text-gray-300" : ""}>
                        İşlemler
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedServiceAppointments.map((appointment) => {
                      const memberPhone = getMemberPhone(appointment.member_id);
                      const whatsappMessage =
                        createWhatsAppMessage(appointment);
                      const whatsappLink = createWhatsAppLink(
                        memberPhone,
                        whatsappMessage
                      );

                      return (
                        <TableRow
                          key={appointment.id}
                          className={
                            isDark ? "border-gray-700" : "border-gray-200"
                          }
                        >
                          <TableCell className={isDark ? "text-gray-300" : ""}>
                            {getMemberName(appointment.member_id)}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                appointment.status === "scheduled"
                                  ? isDark
                                    ? "bg-blue-900/50 text-blue-100"
                                    : "bg-blue-100 text-blue-800"
                                  : appointment.status === "completed"
                                  ? isDark
                                    ? "bg-green-900/50 text-green-100"
                                    : "bg-green-100 text-green-800"
                                  : appointment.status === "in-progress"
                                  ? isDark
                                    ? "bg-yellow-900/50 text-yellow-100"
                                    : "bg-yellow-100 text-yellow-800"
                                  : isDark
                                  ? "bg-red-900/50 text-red-100"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {appointment.status === "scheduled"
                                ? "Planlandı"
                                : appointment.status === "completed"
                                ? "Tamamlandı"
                                : appointment.status === "in-progress"
                                ? "Devam Ediyor"
                                : "İptal Edildi"}
                            </span>
                          </TableCell>
                          <TableCell>
                            {memberPhone ? (
                              <a
                                href={whatsappLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors
                                  ${
                                    isDark
                                      ? "bg-green-900 text-green-100 hover:bg-green-800"
                                      : "bg-green-600 text-white hover:bg-green-700"
                                  }`}
                              >
                                <MessageCircle className="w-3 h-3" />
                                Hatırlat
                              </a>
                            ) : (
                              <span
                                className={`text-xs ${
                                  isDark ? "text-gray-500" : "text-gray-400"
                                }`}
                              >
                                Telefon bulunamadı
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div
                className={`p-4 text-center ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Bu servise kayıtlı üye bulunamadı.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setServiceDialogOpen(false)}
              className={
                isDark
                  ? "bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600"
                  : ""
              }
            >
              Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
