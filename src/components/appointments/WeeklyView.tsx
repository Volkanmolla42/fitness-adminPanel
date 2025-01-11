import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Appointment, Member, Service } from "@/types/appointments";

interface WeeklyViewProps {
  weekDates: Date[];
  appointments: Appointment[];
  members: Member[];
  services: Service[];
  onAppointmentClick: (appointment: Appointment) => void;
}

const WeeklyView: React.FC<WeeklyViewProps> = ({
  weekDates,
  appointments,
  members,
  services,
  onAppointmentClick,
}) => {
  // Helper functions
  const getDayAbbreviation = (date: Date) => {
    const days = ["Pzr", "Pzt", "Sal", "Çrş", "Prş", "Cum", "Cts"];
    return days[date.getDay()];
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5);
  };

  const getMemberName = (memberId: string) => {
    const member = members.find((m) => m.id === memberId);
    return member ? `${member.first_name} ${member.last_name}` : "";
  };

  const getServiceName = (serviceId: string) => {
    const service = services.find((s) => s.id === serviceId);
    return service ? service.name : "";
  };

  const getAppointmentsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return appointments.filter((apt) => apt.date === dateStr);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px] bg-muted/50">Saat</TableHead>
              {weekDates.map((date) => (
                <TableHead
                  key={date.toISOString()}
                  className={`
                    min-w-[100px] bg-muted/50
                    ${
                      date.toISOString().split("T")[0] ===
                        new Date().toISOString().split("T")[0] &&
                      "bg-primary/10"
                    }`}
                >
                  <div className="font-bold">{getDayAbbreviation(date)}</div>
                  <div>
                    {date.toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "short",
                    })}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 13 }, (_, i) => i + 8).map((hour) => (
              <TableRow key={hour}>
                <TableCell className="font-medium text-sm p-1 bg-muted/50">
                  {`${hour.toString().padStart(2, "0")}:00`}
                </TableCell>
                {weekDates.map((date) => {
                  const dayAppointments = getAppointmentsForDate(date).filter(
                    (apt) => {
                      const aptHour = parseInt(apt.time.split(":")[0]);
                      return aptHour === hour;
                    }
                  );

                  return (
                    <TableCell
                      key={date.toISOString()}
                      className={`
                        p-0.5 h-[70px] align-top
                        ${
                          date.toISOString().split("T")[0] ===
                            new Date().toISOString().split("T")[0] &&
                          "bg-primary/5"
                        }`}
                    >
                      {dayAppointments.map((apt) => (
                        <div
                          key={apt.id}
                          onClick={() => onAppointmentClick(apt)}
                          className={`
                            p-0.5 rounded text-[10px] mb-0.5 cursor-pointer hover:opacity-80 transition-opacity
                            ${
                              apt.status === "completed"
                                ? "bg-green-100 hover:bg-green-200"
                                : apt.status === "in-progress"
                                ? "bg-yellow-100 hover:bg-yellow-200"
                                : apt.status === "cancelled"
                                ? "bg-red-100 hover:bg-red-200"
                                : "bg-blue-100 hover:bg-blue-200"
                            }`}
                        >
                          <div className="font-medium flex justify-between items-center">
                            <span>{formatTime(apt.time)}</span>
                            <span className="text-[9px] text-muted-foreground">
                              {getDayAbbreviation(new Date(apt.date))}
                            </span>
                          </div>
                          <div className="truncate">
                            {getMemberName(apt.member_id)}
                          </div>
                          <div className="text-muted-foreground truncate">
                            {getServiceName(apt.service_id)}
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
    </div>
  );
};

export default WeeklyView;
