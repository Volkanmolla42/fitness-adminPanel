import React, { useState } from "react";
import { Appointment, Member, Service, Trainer } from "@/types/appointments";
import AppointmentCard from "./AppointmentCard";
import { ChevronDown, ChevronUp,Search } from "lucide-react";
import { Button } from "../ui/button";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
interface AppointmentGroupsProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  groupedAppointments: Record<string, Appointment[]>;
  members: Member[];
  trainers: Trainer[];
  services: Service[];
  onStatusChange: (id: string, status: string) => void;
  onEdit: (appointment: Appointment) => void;
  onDelete: (id: string) => void;
  activeFilter: string;
  setActiveFilter: (filter: "today" | "tomorrow" | "weekly" | "monthly" | "all") => void;
  getFilteredCount: (filter: "today" | "tomorrow" | "weekly" | "monthly" | "all") => number;
}

const AppointmentGroups: React.FC<AppointmentGroupsProps> = ({
  searchQuery,
  onSearchChange,
  groupedAppointments,
  members,
  trainers,
  services,
  onStatusChange,
  onEdit,
  onDelete,
  activeFilter,
  setActiveFilter,
  getFilteredCount,
}) => {
  const [visibleGroups, setVisibleGroups] = useState<Record<string, boolean>>({
    "in-progress": true,
    "scheduled": true,
    "completed": true,
    "cancelled": true,
  });

  const [displayCounts, setDisplayCounts] = useState<Record<string, number>>({
    "in-progress": 6,
    "scheduled": 6,
    "completed": 6,
    "cancelled": 6,
  });

  const loadMore = (group: string) => {
    setDisplayCounts(prev => ({
      ...prev,
      [group]: prev[group] + 6
    }));
  };

  const toggleGroupVisibility = (group: string) => {
    setVisibleGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };

  const renderAppointments = (appointments: Appointment[], group: string) => {
    const displayedAppointments = appointments.slice(0, displayCounts[group]);
    const hasMore = appointments.length > displayCounts[group];

    return (
      <>
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          {displayedAppointments.map((appointment) => {
            const member = members.find((m) => m.id === appointment.member_id);
            return (
              <motion.div
                key={appointment.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ 
                  duration: 0.2,
                  ease: "easeOut"
                }}
              >
                <AppointmentCard
                  appointment={appointment}
                  member={{
                    id: appointment.member_id,
                    firstName: member?.first_name || "",
                    lastName: member?.last_name || "",
                    avatar: member?.avatar_url || "",
                    membership_type: member?.membership_type || "",
                    email: member?.email || "",
                    phone_number: member?.phone || "",
                  }}
                  trainer={{
                    firstName: trainers.find((t) => t.id === appointment.trainer_id)?.first_name || "",
                    lastName: trainers.find((t) => t.id === appointment.trainer_id)?.last_name || "",
                  }}
                  service={{
                    name: services.find((s) => s.id === appointment.service_id)?.name || "",
                    duration: services.find((s) => s.id === appointment.service_id)?.duration || 0,
                  }}
                  onStatusChange={onStatusChange}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </motion.div>
            );
          })}
        </motion.div>
        {hasMore && (
          <motion.div 
            className="mt-4 text-center "
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              variant="outline"
              onClick={() => loadMore(group)}
              className="w-full sm:w-auto bg-zinc-200"
            >
              Daha Fazla Göster
            </Button>
          </motion.div>
        )}
      </>
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 p-1 bg-muted/50 rounded-lg">
        <Button
          variant={activeFilter === "today" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveFilter("today")}
          className="flex-1"
        >
          Bugün
          <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary/20">
            {getFilteredCount("today")}
          </span>
        </Button>
        <Button
          variant={activeFilter === "tomorrow" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveFilter("tomorrow")}
          className="flex-1"
        >
          Yarın
          <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary/20">
            {getFilteredCount("tomorrow")}
          </span>
        </Button>
        <Button
          variant={activeFilter === "weekly" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveFilter("weekly")}
          className="flex-1"
        >
          Bu Hafta
          <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary/20">
            {getFilteredCount("weekly")}
          </span>
        </Button>
        <Button
          variant={activeFilter === "monthly" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveFilter("monthly")}
          className="flex-1"
        >
          Bu Ay
          <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary/20">
            {getFilteredCount("monthly")}
          </span>
        </Button>
        <Button
          variant={activeFilter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveFilter("all")}
          className="flex-1"
        >
          Tümü
          <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary/20">
            {getFilteredCount("all")}
          </span>
        </Button>
      </div>
      <div className="relative flex-1">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          placeholder="Ara..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 w-full"
        />
      </div>
      {/* Devam Eden Randevular */}
      {groupedAppointments["in-progress"]?.length > 0 && (
        <div className="bg-yellow-50/60 border border-yellow-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-yellow-800 flex items-center">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2" />
              Devam Eden Randevular ({groupedAppointments["in-progress"]?.length})
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
          {visibleGroups["in-progress"] && renderAppointments(groupedAppointments["in-progress"], "in-progress")}
        </div>
      )}

      {/* Planlanmış Randevular */}
      {groupedAppointments["scheduled"]?.length > 0 && (
        <div className="bg-blue-50/60 border border-blue-200 rounded-lg p-4 ">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-blue-800 flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
              Planlanmış Randevular ({groupedAppointments["scheduled"]?.length})
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
          {visibleGroups["scheduled"] && renderAppointments(groupedAppointments["scheduled"], "scheduled")}
        </div>
      )}

      {/* Tamamlanmış Randevular */}
      {groupedAppointments["completed"]?.length > 0 && (
        <div className="bg-green-50/60 border border-green-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-green-800 flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
              Tamamlanmış Randevular ({groupedAppointments["completed"]?.length})
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
          {visibleGroups["completed"] && renderAppointments(groupedAppointments["completed"], "completed")}
        </div>
      )}

      {/* İptal Edilmiş Randevular */}
      {groupedAppointments["cancelled"]?.length > 0 && (
        <div className="bg-red-50/60 border border-red-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-red-800 flex items-center">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-2" />
              İptal Edilmiş Randevular ({groupedAppointments["cancelled"]?.length})
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
          {visibleGroups["cancelled"] && renderAppointments(groupedAppointments["cancelled"], "cancelled")}
        </div>
      )}
    </div>
  );
};

export default AppointmentGroups;
