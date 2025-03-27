import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  format,
  parse,

} from "date-fns";
import { tr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Appointment, Member, Service, Trainer } from "@/types/appointments";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
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
    const [hours, minutes] = normalizedTime.split(":").map(Number);
    return hours * 60 + (minutes || 0);
  };

  // Saati formatlamak için yardımcı fonksiyon
  const formatTime = (time: string) => {
    const normalizedTime = normalizeTime(time);
    return format(parse(normalizedTime, "HH:mm", new Date()), "HH:mm", {
      locale: tr,
    });
  };

  const filteredAppointments = useMemo(() => {
    return appointments
      .filter((appointment) => {
        
       

        const isStatusMatch =
          selectedStatus === "all" || appointment.status === selectedStatus;

        // Sadece belirli randevu saatlerini kabul et
        const normalizedAppointmentTime = normalizeTime(appointment.time);
        const isTimeMatch =
          normalizedAppointmentTime >= timeRange.start &&
          normalizedAppointmentTime <= timeRange.end;

        return  isStatusMatch && isTimeMatch;
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
  }, [appointments, selectedStatus, timeRange]);

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
      <Badge
        className={`${
          statusColors[status as keyof typeof statusColors]
        } text-white`}
      >
        {statusText[status as keyof typeof statusText]}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <div
        className={`flex flex-col sm:flex-row gap-4 px-4 rounded-lg ${
          theme === "dark" ? "bg-gray-00" : "bg-gray-50"
        }`}
      >
        <div className="flex-1 space-y-2">
          <Label
            className={theme === "dark" ? "text-gray-300" : "text-gray-900"}
          >
            Durum
          </Label>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger
              className={
                theme === "dark"
                  ? "bg-gray-800 border-gray-700 text-gray-300"
                  : "bg-white"
              }
            >
              <SelectValue placeholder="Durum seçin" />
            </SelectTrigger>
            <SelectContent
              className={
                theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white"
              }
            >
              <SelectItem
                value="all"
                className={theme === "dark" ? "text-gray-300" : "text-gray-900"}
              >
                Tümü
              </SelectItem>
              <SelectItem
                value="scheduled"
                className={theme === "dark" ? "text-gray-300" : "text-gray-900"}
              >
                Planlandı
              </SelectItem>
              <SelectItem
                value="in-progress"
                className={theme === "dark" ? "text-gray-300" : "text-gray-900"}
              >
                Devam Ediyor
              </SelectItem>
              <SelectItem
                value="completed"
                className={theme === "dark" ? "text-gray-300" : "text-gray-900"}
              >
                Tamamlandı
              </SelectItem>
              <SelectItem
                value="cancelled"
                className={theme === "dark" ? "text-gray-300" : "text-gray-900"}
              >
                İptal Edildi
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 space-y-2">
          <Label
            className={theme === "dark" ? "text-gray-300" : "text-gray-900"}
          >
            Saat Aralığı
          </Label>
          <div className="flex gap-2">
            <Select
              value={timeRange.start}
              onValueChange={(value) =>
                setTimeRange((prev) => ({ ...prev, start: value }))
              }
            >
              <SelectTrigger
                className={
                  theme === "dark"
                    ? "bg-gray-800 border-gray-700 text-gray-300"
                    : "bg-white"
                }
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                className={
                  theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white"
                }
              >
                {TIME_SLOTS.map((time) => (
                  <SelectItem
                    key={time}
                    value={time}
                    className={
                      theme === "dark" ? "text-gray-300" : "text-gray-900"
                    }
                  >
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={timeRange.end}
              onValueChange={(value) =>
                setTimeRange((prev) => ({ ...prev, end: value }))
              }
            >
              <SelectTrigger
                className={
                  theme === "dark"
                    ? "bg-gray-800 border-gray-700 text-gray-300"
                    : "bg-white"
                }
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                className={
                  theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white"
                }
              >
                {TIME_SLOTS.map((time) => (
                  <SelectItem
                    key={time}
                    value={time}
                    className={
                      theme === "dark" ? "text-gray-300" : "text-gray-900"
                    }
                  >
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div
        className={`rounded-md border ${
          theme === "dark" ? "border-gray-700" : "border-gray-200"
        }`}
      >
        <Table>
          <TableHeader>
            <TableRow
              className={`${
                theme === "dark"
                  ? "hover:bg-gray-800/50"
                  : "hover:bg-gray-50/50"
              }`}
            >
              <TableHead
                className={theme === "dark" ? "text-gray-100" : "text-gray-900"}
              >
                Üye
              </TableHead>
              <TableHead
                className={theme === "dark" ? "text-gray-100" : "text-gray-900"}
              >
                Antrenör
              </TableHead>
              <TableHead
                className={theme === "dark" ? "text-gray-100" : "text-gray-900"}
              >
                Hizmet
              </TableHead>
              <TableHead
                className={theme === "dark" ? "text-gray-100" : "text-gray-900"}
              >
                Tarih
              </TableHead>
              <TableHead
                className={theme === "dark" ? "text-gray-100" : "text-gray-900"}
              >
                Saat
              </TableHead>
              <TableHead
                className={theme === "dark" ? "text-gray-100" : "text-gray-900"}
              >
                Durum
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAppointments.map((appointment) => {
              const member = members.find(
                (m) => m.id === appointment.member_id
              );
              const trainer = trainers.find(
                (t) => t.id === appointment.trainer_id
              );
              const service = services.find(
                (s) => s.id === appointment.service_id
              );

              return (
                <TableRow
                  key={appointment.id}
                  className={`cursor-pointer ${
                    theme === "dark"
                      ? "hover:bg-gray-800/50"
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => onEdit(appointment)}
                >
                  <TableCell
                    className={
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }
                  >
                    {member?.first_name} {member?.last_name}
                  </TableCell>
                  <TableCell
                    className={
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }
                  >
                    {trainer?.first_name} {trainer?.last_name}
                  </TableCell>
                  <TableCell
                    className={
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }
                  >
                    {service?.name}
                  </TableCell>
                  <TableCell
                    className={
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }
                  >
                    {format(new Date(appointment.date), "d MMMM yyyy", {
                      locale: tr,
                    })}
                  </TableCell>
                  <TableCell
                    className={
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }
                  >
                    {formatTime(appointment.time)}
                  </TableCell>
                  <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                </TableRow>
              );
            })}
            {filteredAppointments.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className={`text-center py-4 ${
                    theme === "dark" ? "text-gray-500" : "text-gray-400"
                  }`}
                >
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
