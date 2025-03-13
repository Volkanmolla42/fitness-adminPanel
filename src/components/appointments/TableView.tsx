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
import TIME_SLOTS, { WORKING_HOURS } from "@/constants/timeSlots";
import { useTheme } from "@/contexts/theme-context";

interface TableViewProps {
  appointments: Appointment[];
  members: Member[];
  trainers: Trainer[];
  services: Service[];
  onEdit: (appointment: Appointment) => void;
}

const TableView: React.FC<TableViewProps> = ({
  appointments,
  members,
  trainers,
  services,
  onEdit,
}) => {
  const { theme } = useTheme();
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

    // Standart randevular için maksimum 4 kişi kontrolü
    const MAX_STANDARD_APPOINTMENTS = 4;
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

    const MAX_STANDARD_APPOINTMENTS = 4;
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
      <div className={`flex flex-col sm:flex-row gap-4 p-4 rounded-lg ${
        theme === 'dark' ? 'bg-gray-00' : 'bg-gray-50'
      }`}>
        <div className="flex-1 space-y-2">
          <Label className={theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}>Tarih</Label>
          <div className="relative">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={`w-full justify-start text-left font-normal ${
                  theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white'
                }`}>
                  {selectedDate ? format(selectedDate, "d MMMM yyyy", { locale: tr }) : "Tüm Tarihler"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className={`w-auto p-0 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'}`} align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={tr}
                  className={`rounded-md border-0 shadow-sm ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}
                  showOutsideDays
                  fixedWeeks
                />
              </PopoverContent>
            </Popover>
            {selectedDate && (
              <Button
                variant="ghost"
                size="icon"
                className={`absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 ${
                  theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setSelectedDate(undefined)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <Label className={theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}>Antrenör</Label>
          <Select value={selectedTrainer} onValueChange={setSelectedTrainer}>
            <SelectTrigger className={theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white'}>
              <SelectValue placeholder="Antrenör seçin" />
            </SelectTrigger>
            <SelectContent className={theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
              <SelectItem value="all" className={theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}>Tümü</SelectItem>
              {trainers.map((trainer) => (
                <SelectItem 
                  key={trainer.id} 
                  value={trainer.id}
                  className={theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}
                >
                  {trainer.first_name} {trainer.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 space-y-2">
          <Label className={theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}>Durum</Label>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className={theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white'}>
              <SelectValue placeholder="Durum seçin" />
            </SelectTrigger>
            <SelectContent className={theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
              <SelectItem value="all" className={theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}>Tümü</SelectItem>
              <SelectItem value="scheduled" className={theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}>Planlandı</SelectItem>
              <SelectItem value="in-progress" className={theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}>Devam Ediyor</SelectItem>
              <SelectItem value="completed" className={theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}>Tamamlandı</SelectItem>
              <SelectItem value="cancelled" className={theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}>İptal Edildi</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 space-y-2">
          <Label className={theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}>Saat Aralığı</Label>
          <div className="flex gap-2">
            <Select 
              value={timeRange.start}
              onValueChange={(value) => setTimeRange(prev => ({ ...prev, start: value }))}
            >
              <SelectTrigger className={theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white'}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
                {TIME_SLOTS.map((time) => (
                  <SelectItem 
                    key={time} 
                    value={time}
                    className={theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}
                  >
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select 
              value={timeRange.end}
              onValueChange={(value) => setTimeRange(prev => ({ ...prev, end: value }))}
            >
              <SelectTrigger className={theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white'}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
                {TIME_SLOTS.map((time) => (
                  <SelectItem 
                    key={time} 
                    value={time}
                    className={theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}
                  >
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
                      className={theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' : 'bg-white'}
                    >
                      {showAvailable ? "Müsait Saatleri Gizle" : "Müsait Saatleri Göster"}
                    </Button>
                  </div>
                </TooltipTrigger>
                {!selectedDate && (
                  <TooltipContent className={theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white'}>
                    <p>Lütfen önce bir tarih seçin</p>
                  </TooltipContent>
                )}
                {selectedTrainer === "all" && (
                  <TooltipContent className={theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white'}>
                    <p>Lütfen bir antrenör seçin</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      <div className={`rounded-md border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <Table>
          <TableHeader>
            <TableRow className={`${theme === 'dark' ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50/50'}`}>
              <TableHead className={theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}>Üye</TableHead>
              <TableHead className={theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}>Antrenör</TableHead>
              <TableHead className={theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}>Hizmet</TableHead>
              <TableHead className={theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}>Tarih</TableHead>
              <TableHead className={theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}>Saat</TableHead>
              <TableHead className={theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}>Durum</TableHead>
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
                  className={`cursor-pointer ${
                    theme === 'dark' ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => onEdit(appointment)}
                >
                  <TableCell className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                    {member?.first_name} {member?.last_name}
                  </TableCell>
                  <TableCell className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                    {trainer?.first_name} {trainer?.last_name}
                  </TableCell>
                  <TableCell className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                    {service?.name}
                  </TableCell>
                  <TableCell className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                    {format(new Date(appointment.date), "d MMMM yyyy", { locale: tr })}
                  </TableCell>
                  <TableCell className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>{formatTime(appointment.time)}</TableCell>
                  <TableCell>
                    {getStatusBadge(appointment.status)}
                  </TableCell>
                </TableRow>
              )
            })}
            {showAvailable && availableSlots.map(slot => {
              const remainingSlots = getRemainingStandardSlots(selectedDate!, slot);
              return (
                <TableRow key={slot} className={theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'}>
                  <TableCell className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>-</TableCell>
                  <TableCell className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                    {trainers.find(t => t.id === selectedTrainer)?.first_name} {trainers.find(t => t.id === selectedTrainer)?.last_name}
                  </TableCell>
                  <TableCell className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>-</TableCell>
                  <TableCell className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                    {selectedDate && format(selectedDate, "d MMMM yyyy", { locale: tr })}
                  </TableCell>
                  <TableCell className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>{formatTime(slot)}</TableCell>
                  <TableCell className={theme === 'dark' ? 'text-green-600' : 'text-green-500'} font-medium>
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
                <TableCell colSpan={6} className={`text-center py-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
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

export default TableView;
