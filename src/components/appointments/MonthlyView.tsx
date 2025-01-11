import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format,  isWithinInterval, startOfDay, endOfDay } from "date-fns";
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
  start: "09:00",
  end: "21:00",
};

const TIME_SLOTS = Array.from({ length: 13 }, (_, i) => {
  const hour = i + 9;
  return `${hour.toString().padStart(2, "0")}:00`;
});

const MonthlyView: React.FC<MonthlyViewProps> = ({
  appointments,
  members,
  trainers,
  services,
  onEdit,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTrainer, setSelectedTrainer] = useState<string>("all");
  const [showAvailable, setShowAvailable] = useState<boolean>(false);
  const [timeRange, setTimeRange] = useState({
    start: WORKING_HOURS.start,
    end: WORKING_HOURS.end,
  });

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const appointmentDate = new Date(`${appointment.date} ${appointment.time}`);
      const isDateMatch = selectedDate 
        ? isWithinInterval(appointmentDate, {
            start: startOfDay(selectedDate),
            end: endOfDay(selectedDate),
          })
        : true;
      
      const isTrainerMatch = selectedTrainer === "all" || appointment.trainer_id === selectedTrainer;
      
      const appointmentTime = appointment.time;
      const isTimeMatch = appointmentTime >= timeRange.start && appointmentTime <= timeRange.end;

      return isDateMatch && isTrainerMatch && isTimeMatch;
    }).sort((a, b) => {
      // Tarihe göre sıralama
      const dateA = new Date(`${a.date} ${a.time}`);
      const dateB = new Date(`${b.date} ${b.time}`);
      return dateA.getTime() - dateB.getTime();
    });
  }, [appointments, selectedDate, selectedTrainer, timeRange]);

  const availableSlots = useMemo(() => {
    if (!selectedDate || !showAvailable) return [];

    const bookedSlots = new Set(
      filteredAppointments.map((apt) => apt.time)
    );

    return TIME_SLOTS.filter(
      (slot) => 
        !bookedSlots.has(slot) && 
        slot >= timeRange.start && 
        slot <= timeRange.end
    );
  }, [filteredAppointments, selectedDate, showAvailable, timeRange]);

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
            <span className="self-center">-</span>
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
                      disabled={!selectedDate}
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
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => onEdit(appointment)}
                >
                  <TableCell>
                    {format(new Date(`${appointment.date} ${appointment.time}`), "d MMMM yyyy", {
                      locale: tr,
                    })}
                  </TableCell>
                  <TableCell>
                    {format(new Date(`${appointment.date} ${appointment.time}`), "HH:mm")}
                  </TableCell>
                  <TableCell>
                    {trainer ? `${trainer.first_name} ${trainer.last_name}` : "-"}
                  </TableCell>
                  <TableCell>
                    {member ? `${member.first_name} ${member.last_name}` : "-"}
                  </TableCell>
                  <TableCell>{service ? service.name : "-"}</TableCell>
                  <TableCell>
                    {getStatusBadge(appointment.status)}
                  </TableCell>
                </TableRow>
              )
            })}
            {showAvailable && availableSlots.map((slot) => (
              <TableRow key={slot} className="bg-green-50">
                <TableCell>
                  {selectedDate && format(selectedDate, "d MMMM yyyy", { locale: tr })}
                </TableCell>
                <TableCell>{slot}</TableCell>
                <TableCell colSpan={4} className="text-green-600 font-medium">
                  Müsait
                </TableCell>
              </TableRow>
            ))}
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
