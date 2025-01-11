import React, { useState } from "react";
import { Appointment, Member, Service, Trainer } from "@/types/appointments";
import AppointmentCard from "./AppointmentCard";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "../ui/button";

interface AppointmentGroupsProps {
  groupedAppointments: Record<string, Appointment[]>;
  members: Member[];
  trainers: Trainer[];
  services: Service[];
  onStatusChange: (id: string, status: string) => void;
  onEdit: (appointment: Appointment) => void;
  onDelete: (id: string) => void;
}

const AppointmentGroups: React.FC<AppointmentGroupsProps> = ({
  groupedAppointments,
  members,
  trainers,
  services,
  onStatusChange,
  onEdit,
  onDelete,
}) => {
  const [visibleGroups, setVisibleGroups] = useState<Record<string, boolean>>({
    "in-progress": true,
    "scheduled": true,
    "completed": true,
    "cancelled": true,
  });

  const toggleGroupVisibility = (group: string) => {
    setVisibleGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Devam Eden Randevular */}
      {groupedAppointments["in-progress"]?.length > 0 && (
        <div className="bg-yellow-50/60 border border-yellow-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-yellow-800 flex items-center">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2" />
              Devam Eden Randevular
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleGroupVisibility("in-progress")}
              className="text-yellow-800"
            >
              {visibleGroups["in-progress"] ? <ChevronUp /> : <ChevronDown />}
            </Button>
          </div>
          {visibleGroups["in-progress"] && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {groupedAppointments["in-progress"].map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  member={{
                    firstName:
                      members.find((m) => m.id === appointment.member_id)
                        ?.first_name || "",
                    lastName:
                      members.find((m) => m.id === appointment.member_id)
                        ?.last_name || "",
                    avatar:
                      members.find((m) => m.id === appointment.member_id)
                        ?.avatar_url || "",
                  }}
                  trainer={{
                    firstName:
                      trainers.find((t) => t.id === appointment.trainer_id)
                        ?.first_name || "",
                    lastName:
                      trainers.find((t) => t.id === appointment.trainer_id)
                        ?.last_name || "",
                  }}
                  service={{
                    name:
                      services.find((s) => s.id === appointment.service_id)
                        ?.name || "",
                    duration:
                      services.find((s) => s.id === appointment.service_id)
                        ?.duration || 0,
                  }}
                  onStatusChange={onStatusChange}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Planlanmış Randevular */}
      {groupedAppointments["scheduled"]?.length > 0 && (
        <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-blue-800 flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
              Planlanmış Randevular
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleGroupVisibility("scheduled")}
              className="text-blue-800"
            >
              {visibleGroups["scheduled"] ? <ChevronUp /> : <ChevronDown />}
            </Button>
          </div>
          {visibleGroups["scheduled"] && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {groupedAppointments["scheduled"].map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  member={{
                    firstName:
                      members.find((m) => m.id === appointment.member_id)
                        ?.first_name || "",
                    lastName:
                      members.find((m) => m.id === appointment.member_id)
                        ?.last_name || "",
                    avatar:
                      members.find((m) => m.id === appointment.member_id)
                        ?.avatar_url || "",
                  }}
                  trainer={{
                    firstName:
                      trainers.find((t) => t.id === appointment.trainer_id)
                        ?.first_name || "",
                    lastName:
                      trainers.find((t) => t.id === appointment.trainer_id)
                        ?.last_name || "",
                  }}
                  service={{
                    name:
                      services.find((s) => s.id === appointment.service_id)
                        ?.name || "",
                    duration:
                      services.find((s) => s.id === appointment.service_id)
                        ?.duration || 0,
                  }}
                  onStatusChange={onStatusChange}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tamamlanmış Randevular */}
      {groupedAppointments["completed"]?.length > 0 && (
        <div className="bg-green-50/50 border border-green-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-green-800 flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
              Tamamlanmış Randevular
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleGroupVisibility("completed")}
              className="text-green-800"
            >
              {visibleGroups["completed"] ? <ChevronUp /> : <ChevronDown />}
            </Button>
          </div>
          {visibleGroups["completed"] && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {groupedAppointments["completed"].map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  member={{
                    firstName:
                      members.find((m) => m.id === appointment.member_id)
                        ?.first_name || "",
                    lastName:
                      members.find((m) => m.id === appointment.member_id)
                        ?.last_name || "",
                    avatar:
                      members.find((m) => m.id === appointment.member_id)
                        ?.avatar_url || "",
                  }}
                  trainer={{
                    firstName:
                      trainers.find((t) => t.id === appointment.trainer_id)
                        ?.first_name || "",
                    lastName:
                      trainers.find((t) => t.id === appointment.trainer_id)
                        ?.last_name || "",
                  }}
                  service={{
                    name:
                      services.find((s) => s.id === appointment.service_id)
                        ?.name || "",
                    duration:
                      services.find((s) => s.id === appointment.service_id)
                        ?.duration || 0,
                  }}
                  onStatusChange={onStatusChange}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* İptal Edilen Randevular */}
      {groupedAppointments["cancelled"]?.length > 0 && (
        <div className="bg-red-50/50 border border-red-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-red-800 flex items-center">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-2" />
              İptal Edilen Randevular
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleGroupVisibility("cancelled")}
              className="text-red-800"
            >
              {visibleGroups["cancelled"] ? <ChevronUp /> : <ChevronDown />}
            </Button>
          </div>
          {visibleGroups["cancelled"] && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {groupedAppointments["cancelled"].map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  member={{
                    firstName:
                      members.find((m) => m.id === appointment.member_id)
                        ?.first_name || "",
                    lastName:
                      members.find((m) => m.id === appointment.member_id)
                        ?.last_name || "",
                    avatar:
                      members.find((m) => m.id === appointment.member_id)
                        ?.avatar_url || "",
                  }}
                  trainer={{
                    firstName:
                      trainers.find((t) => t.id === appointment.trainer_id)
                        ?.first_name || "",
                    lastName:
                      trainers.find((t) => t.id === appointment.trainer_id)
                        ?.last_name || "",
                  }}
                  service={{
                    name:
                      services.find((s) => s.id === appointment.service_id)
                        ?.name || "",
                    duration:
                      services.find((s) => s.id === appointment.service_id)
                        ?.duration || 0,
                  }}
                  onStatusChange={onStatusChange}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AppointmentGroups;
