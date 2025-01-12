import React, { useState } from "react";
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

interface WeeklyViewProps {
  appointments: Appointment[];
  members: Member[];
  services: Service[];
  selectedTrainerId: string | null;
  onAppointmentClick: (appointment: Appointment) => void;
}

const WeeklyView: React.FC<WeeklyViewProps> = ({
  appointments,
  members,
  services,
  selectedTrainerId,
  onAppointmentClick,
}) => {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

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

  const getAppointmentsForDayAndHour = (dayIndex: number, hour: number) => {
    const filteredAppointments = appointments.filter((apt) => {
      const aptDate = new Date(apt.date);
      const aptHour = parseInt(apt.time.split(":")[0]);
      // getDay() 0=Pazar olduğu için, sadece 1-6 arası günleri alıyoruz
      const day = aptDate.getDay();
      if (day === 0) return false; // Pazar günlerini gösterme
      const adjustedDay = day - 1; // 1->0, 2->1, ... 6->5
      return adjustedDay === dayIndex && 
             aptHour === hour && 
             apt.trainer_id === selectedTrainerId &&
             apt.status === "scheduled";
    });

    const groupedAppointments = filteredAppointments.reduce((acc, curr) => {
      const key = `${curr.member_id}-${curr.service_id}`;
      if (!acc[key]) {
        acc[key] = {
          appointment: curr,
          count: 1
        };
      } else {
        acc[key].count += 1;
      }
      return acc;
    }, {} as Record<string, { appointment: Appointment; count: number }>);

    return Object.values(groupedAppointments);
  };

  if (!selectedTrainerId) {
    return (
      <div className="flex justify-center items-center h-[400px] bg-white rounded-lg shadow">
        <p className="text-lg text-gray-500">Lütfen bir eğitmen seçin</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px] bg-muted/50">
                <div className="text-base font-semibold">Saat</div>
              </TableHead>
              {[0, 1, 2, 3, 4, 5].map((dayIndex) => (
                <TableHead
                  key={dayIndex}
                  className="min-w-[180px] bg-muted/50"
                >
                  <div className="text-base font-semibold">{getDayName(dayIndex)}</div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 13 }, (_, i) => i + 8).map((hour) => (
              <TableRow key={hour}>
                <TableCell className="font-medium text-base p-2 bg-muted/50">
                  {`${hour.toString().padStart(2, "0")}:00`}
                </TableCell>
                {[0, 1, 2, 3, 4, 5].map((dayIndex) => {
                  const groupedAppointments = getAppointmentsForDayAndHour(dayIndex, hour);

                  return (
                    <TableCell
                      key={dayIndex}
                      className="p-1.5 h-[100px] align-top"
                    >
                      {groupedAppointments.map(({ appointment, count }) => (
                        <div
                          key={`${appointment.member_id}-${appointment.service_id}`}
                          onClick={() => {
                            setSelectedAppointment(appointment);
                            setIsDetailsDialogOpen(true);
                          }}
                          className={`
                            p-2 rounded text-sm mb-1 cursor-pointer hover:opacity-80 transition-opacity
                            ${
                              appointment.status === "completed"
                                ? "bg-green-100 hover:bg-green-200"
                                : appointment.status === "in-progress"
                                ? "bg-yellow-100 hover:bg-yellow-200"
                                : appointment.status === "cancelled"
                                ? "bg-red-100 hover:bg-red-200"
                                : "bg-blue-100 hover:bg-blue-200"
                            }`}
                        >
                          <div className="font-medium flex justify-between items-center">
                            <span className="text-base">{formatTime(appointment.time)}</span>
                            {count > 1 && (
                              <span className="text-xs bg-gray-200 px-1.5 py-0.5 rounded-full font-semibold">
                                {count}x
                              </span>
                            )}
                          </div>
                          <div className="font-medium truncate mt-1">
                            {getMemberName(appointment.member_id)}
                          </div>
                        </div>
                      ))}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AppointmentDetailsDialog
        appointment={selectedAppointment}
        appointments={appointments}
        members={members}
        services={services}
        isOpen={isDetailsDialogOpen}
        onClose={() => {
          setIsDetailsDialogOpen(false);
          setSelectedAppointment(null);
        }}
      />
    </div>
  );
};

export default WeeklyView;
