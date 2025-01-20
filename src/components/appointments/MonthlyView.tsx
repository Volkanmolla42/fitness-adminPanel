import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, parse, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { tr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Appointment, Member, Service, Trainer } from "@/types/appointments";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MonthlyViewProps {
  appointments: Appointment[];
  members: Member[];
  trainers: Trainer[];
  services: Service[];
  onEdit: (appointment: Appointment) => void;
}

const WORKING_HOURS = {
  start: "10:00",
  end: "19:00",
};

// Sabit randevu saatleri
const TIME_SLOTS = [
  "10:00",
  "11:30",
  "13:00",
  "14:30",
  "16:00",
  "17:00",
  "18:00",
  "19:00"
];

const MonthlyView: React.FC<MonthlyViewProps> = ({
  appointments,
  members,
  trainers,
  services,
  onEdit,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTrainer, setSelectedTrainer] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("scheduled");
  const [showAvailable, setShowAvailable] = useState<boolean>(false);
  const [timeRange, setTimeRange] = useState({
    start: WORKING_HOURS.start,
    end: WORKING_HOURS.end,
  });

  // Saat formatını normalize eden yardımcı fonksiyon
  const normalizeTime = (time: string): string => {
    // HH:mm:ss formatını HH:mm formatına çevir
    return time.length === 8 ? time.substring(0, 5) : time;
  };

  // Saat dilimini dakikaya çeviren yardımcı fonksiyon
  const timeToMinutes = (time: string): number => {
    const normalizedTime = normalizeTime(time);
    const [hours, minutes] = normalizedTime.split(':').map(Number);
    return hours * 60 + (minutes || 0);
  };

  // İki saat aralığının çakışıp çakışmadığını kontrol eden fonksiyon
  const isTimeOverlapping = (start1: string, duration1: number, start2: string, duration2: number): boolean => {
    const start1Minutes = timeToMinutes(start1);
    const end1Minutes = start1Minutes + duration1;
    const start2Minutes = timeToMinutes(start2);
    const end2Minutes = start2Minutes + duration2;

    return (start1Minutes < end2Minutes && end1Minutes > start2Minutes);
  };

  // Randevu çakışmasını kontrol eden fonksiyon
  const checkTimeConflict = (time: string, appointments: Appointment[]): boolean => {
    if (!selectedTrainer || !services) return true;

    // Seçili tarihteki randevuları filtrele
    const dayAppointments = appointments.filter(apt => 
      apt.date === format(selectedDate!, 'yyyy-MM-dd') && 
      apt.trainer_id === selectedTrainer &&
      apt.status === "scheduled"
    );

    // Aynı saatteki randevuları bul
    const conflictingAppointments = dayAppointments.filter(apt => 
      normalizeTime(apt.time) === normalizeTime(time)
    );

    // VIP randevuları bul
    const vipAppointments = conflictingAppointments.filter(apt => {
      const appointmentService = services.find(s => s.id === apt.service_id);
      return appointmentService?.isVipOnly ?? false;
    });

    // Eğer VIP randevu varsa, slot müsait değil
    if (vipAppointments.length > 0) {
      return true;
    }

    // Standart randevular için maksimum 3 kişi kontrolü
    const MAX_STANDARD_APPOINTMENTS = 3;
    return conflictingAppointments.length >= MAX_STANDARD_APPOINTMENTS;
  };

  // Belirli bir gün ve saat için kalan standart randevu randevuını hesapla
  const getRemainingStandardSlots = (date: Date, time: string) => {
    if (!selectedTrainer || !services) return 0;

    const dayAppointments = appointments.filter(apt => 
      apt.date === format(date, 'yyyy-MM-dd') && 
      apt.trainer_id === selectedTrainer &&
      normalizeTime(apt.time) === normalizeTime(time) &&
      apt.status === "scheduled"
    );

    // VIP randevuları bul
    const vipAppointments = dayAppointments.filter(apt => {
      const appointmentService = services.find(s => s.id === apt.service_id);
      return appointmentService?.isVipOnly ?? false;
    });

    // Eğer VIP randevu varsa, standart randevu alınamaz
    if (vipAppointments.length > 0) {
      return 0;
    }

    const MAX_STANDARD_APPOINTMENTS = 3;
    return MAX_STANDARD_APPOINTMENTS - dayAppointments.length;
  };

  // Saati formatlamak için yardımcı fonksiyon
  const formatTime = (time: string) => {
    const normalizedTime = normalizeTime(time);
    return format(parse(normalizedTime, 'HH:mm', new Date()), 'HH:mm', { locale: tr });
  };

  const filteredAppointments = useMemo(() => {
    return appointments
      .filter((appointment) => {
        const appointmentDate = new Date(`${appointment.date} ${appointment.time}`);
        const isDateMatch = selectedDate 
          ? isWithinInterval(appointmentDate, {
              start: startOfDay(selectedDate),
              end: endOfDay(selectedDate),
            })
          : true;
        
        const isTrainerMatch = selectedTrainer === "all" || appointment.trainer_id === selectedTrainer;
        const isStatusMatch = selectedStatus === "all" || appointment.status === selectedStatus;
        
        // Sadece belirli randevu saatlerini kabul et
        const normalizedAppointmentTime = normalizeTime(appointment.time);
        const isValidTimeSlot = TIME_SLOTS.some(slot => normalizeTime(slot) === normalizedAppointmentTime);
        const isTimeMatch = normalizedAppointmentTime >= timeRange.start && normalizedAppointmentTime <= timeRange.end;

        return isDateMatch && isTrainerMatch && isStatusMatch && isTimeMatch;
      })
      .sort((a, b) => {
        // Tarihleri karşılaştır (en eski tarih önce)
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        const dateCompare = dateA.getTime() - dateB.getTime();
        
        if (dateCompare !== 0) return dateCompare;

        // Aynı tarihli randevuları saate göre sırala
        return timeToMinutes(a.time) - timeToMinutes(b.time);
      });
  }, [appointments, selectedDate, selectedTrainer, selectedStatus, timeRange]);

  const availableSlots = useMemo(() => {
    if (!selectedDate || !showAvailable || !selectedTrainer || selectedTrainer === "all") return [];

    // Seçili tarihteki randevuları filtrele
    const dayAppointments = appointments.filter(apt => 
      apt.date === format(selectedDate, 'yyyy-MM-dd') && 
      apt.trainer_id === selectedTrainer &&
      apt.status === "scheduled"
    );

    // Sadece belirli zaman dilimlerini kontrol et
    return TIME_SLOTS.filter(slot => {
      // Seçili aralık kontrolü
      const normalizedSlot = normalizeTime(slot);
      if (normalizedSlot < timeRange.start || normalizedSlot > timeRange.end) {
        return false;
      }

      // Çakışma kontrolü
      return !checkTimeConflict(slot, dayAppointments);
    });
  }, [appointments, selectedDate, selectedTrainer, showAvailable, timeRange, services]);

  const getStatusBadge = (status: string) => {
    const statusColors = {
      "in-progress": "bg-yellow-500",
      scheduled: "bg-blue-500",
      completed: "bg-green-500",
      cancelled: "bg-red-500",
    };

    const statusText = {
      "in-progress": "Devam Ediyor",
      scheduled: "Planlandı",
      completed: "Tamamlandı",
      cancelled: "İptal Edildi",
    };

    return (
      <Badge className={`${statusColors[status as keyof typeof statusColors]} text-white`}>
        {statusText[status as keyof typeof statusText]}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex-1 space-y-2">
          <Label>Tarih</Label>
          <div className="relative">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  {selectedDate ? format(selectedDate, "d MMMM yyyy", { locale: tr }) : "Tüm Tarihler"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={tr}
                  className="rounded-md border-0 shadow-sm"
                  showOutsideDays
                  fixedWeeks
                />
              </PopoverContent>
            </Popover>
            {selectedDate && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={() => setSelectedDate(undefined)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <Label>Eğitmen</Label>
          <Select value={selectedTrainer} onValueChange={setSelectedTrainer}>
            <SelectTrigger>
              <SelectValue placeholder="Eğitmen seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              {trainers.map((trainer) => (
                <SelectItem key={trainer.id} value={trainer.id}>
                  {trainer.first_name} {trainer.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 space-y-2">
          <Label>Durum</Label>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Durum seçin" />
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

        <div className="flex-1 space-y-2">
          <Label>Saat Aralığı</Label>
          <div className="flex gap-2">
            <Select 
              value={timeRange.start}
              onValueChange={(value) => setTimeRange(prev => ({ ...prev, start: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_SLOTS.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select 
              value={timeRange.end}
              onValueChange={(value) => setTimeRange(prev => ({ ...prev, end: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_SLOTS.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex-1 self-end">
          <div className="flex items-center space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      variant="outline"
                      onClick={() => setShowAvailable(!showAvailable)}
                      disabled={!selectedDate || selectedTrainer === "all"}
                    >
                      {showAvailable ? "Müsait Saatleri Gizle" : "Müsait Saatleri Göster"}
                    </Button>
                  </div>
                </TooltipTrigger>
                {!selectedDate && (
                  <TooltipContent>
                    <p>Lütfen önce bir tarih seçin</p>
                  </TooltipContent>
                )}
                {selectedTrainer === "all" && (
                  <TooltipContent>
                    <p>Lütfen bir eğitmen seçin</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tarih</TableHead>
              <TableHead>Saat</TableHead>
              <TableHead>Eğitmen</TableHead>
              <TableHead>Üye</TableHead>
              <TableHead>Hizmet</TableHead>
              <TableHead>Durum</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAppointments.map((appointment) => {
              const member = members.find((m) => m.id === appointment.member_id);
              const trainer = trainers.find((t) => t.id === appointment.trainer_id);
              const service = services.find((s) => s.id === appointment.service_id);

              return (
                <TableRow
                  key={appointment.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => onEdit(appointment)}
                >
                  <TableCell>
                    {format(new Date(appointment.date), "d MMMM yyyy", { locale: tr })}
                  </TableCell>
                  <TableCell>{formatTime(appointment.time)}</TableCell>
                  <TableCell>
                    {trainer?.first_name} {trainer?.last_name}
                  </TableCell>
                  <TableCell>
                    {member?.first_name} {member?.last_name}
                  </TableCell>
                  <TableCell>
                    {service?.name}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(appointment.status)}
                  </TableCell>
                </TableRow>
              )
            })}
            {showAvailable && availableSlots.map(slot => {
              const remainingSlots = getRemainingStandardSlots(selectedDate!, slot);
              return (
                <TableRow key={slot} className="bg-gray-50">
                  <TableCell>
                    {selectedDate && format(selectedDate, "d MMMM yyyy", { locale: tr })}
                  </TableCell>
                  <TableCell>{formatTime(slot)}</TableCell>
                  <TableCell>
                    {trainers.find(t => t.id === selectedTrainer)?.first_name} {trainers.find(t => t.id === selectedTrainer)?.last_name}
                  </TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell className="text-green-600 font-medium">
                    {remainingSlots === 3 ? (
                      "Boş"
                    ) : remainingSlots > 0 ? (
                      `${remainingSlots} randevu daha alınabilir`
                    ) : (
                      "Randevu saati doldu"
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredAppointments.length === 0 && !showAvailable && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                  Bu kriterlere uygun randevu bulunamadı
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default MonthlyView;
