import React, { useState } from "react";
import { Appointment, Member, Service, Trainer } from "@/types/appointments";
import AppointmentCard from "./AppointmentCard";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { Button } from "../ui/button";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/contexts/theme-context";

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
  const { theme } = useTheme();
  const isDark = theme === "dark";

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
              className={`w-full sm:w-auto ${isDark ? "bg-gray-800 hover:bg-gray-700" : "bg-zinc-200"}`}
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
      <div className={`flex flex-wrap gap-2 p-1 ${isDark ? "bg-gray-800/50" : "bg-muted/50"} rounded-lg`}>
        <Button
          variant={activeFilter === "today" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveFilter("today")}
          className={`flex-1 ${isDark && activeFilter !== "today" ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : ""}`}
        >
          Bugün
          <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${isDark ? "bg-primary/30" : "bg-primary/20"}`}>
            {getFilteredCount("today")}
          </span>
        </Button>
        <Button
          variant={activeFilter === "tomorrow" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveFilter("tomorrow")}
          className={`flex-1 ${isDark && activeFilter !== "tomorrow" ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : ""}`}
        >
          Yarın
          <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${isDark ? "bg-primary/30" : "bg-primary/20"}`}>
            {getFilteredCount("tomorrow")}
          </span>
        </Button>
        <Button
          variant={activeFilter === "weekly" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveFilter("weekly")}
          className={`flex-1 ${isDark && activeFilter !== "weekly" ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : ""}`}
        >
          Bu Hafta
          <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${isDark ? "bg-primary/30" : "bg-primary/20"}`}>
            {getFilteredCount("weekly")}
          </span>
        </Button>
        <Button
          variant={activeFilter === "monthly" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveFilter("monthly")}
          className={`flex-1 ${isDark && activeFilter !== "monthly" ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : ""}`}
        >
          Bu Ay
          <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${isDark ? "bg-primary/30" : "bg-primary/20"}`}>
            {getFilteredCount("monthly")}
          </span>
        </Button>
        <Button
          variant={activeFilter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveFilter("all")}
          className={`flex-1 ${isDark && activeFilter !== "all" ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : ""}`}
        >
          Tümü
          <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${isDark ? "bg-primary/30" : "bg-primary/20"}`}>
            {getFilteredCount("all")}
          </span>
        </Button>
      </div>
      <div className="relative flex-1">
        <Search className={`absolute left-2 top-2.5 h-4 w-4 ${isDark ? "text-gray-400" : "text-gray-500"}`} />
        <Input
          placeholder="Ara..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className={`pl-8 w-full ${isDark ? "bg-gray-800 border-gray-700 text-gray-200" : ""}`}
        />
      </div>
      {/* Devam Eden Randevular */}
      {groupedAppointments["in-progress"]?.length > 0 && (
        <div className={isDark 
          ? "bg-yellow-900/20 border border-yellow-800/30 rounded-lg p-4" 
          : "bg-yellow-50/60 border border-yellow-200 rounded-lg p-4"
        }>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-lg font-semibold ${isDark ? "text-yellow-300" : "text-yellow-800"} flex items-center`}>
              <div className={`w-2 h-2 ${isDark ? "bg-yellow-400" : "bg-yellow-500"} rounded-full mr-2`} />
              Devam Eden Randevular ({groupedAppointments["in-progress"]?.length})
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleGroupVisibility("in-progress")}
              className={isDark ? "text-yellow-300 hover:bg-yellow-900/30" : "text-yellow-800"}
            >
              {visibleGroups["in-progress"] ? <ChevronUp /> : <ChevronDown />}
            </Button>
          </div>
          {visibleGroups["in-progress"] && renderAppointments(groupedAppointments["in-progress"], "in-progress")}
        </div>
      )}

      {/* Planlanmış Randevular */}
      {groupedAppointments["scheduled"]?.length > 0 && (
        <div className={isDark 
          ? "bg-blue-900/20 border border-blue-800/30 rounded-lg p-4" 
          : "bg-blue-50/60 border border-blue-200 rounded-lg p-4"
        }>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-lg font-semibold ${isDark ? "text-blue-300" : "text-blue-800"} flex items-center`}>
              <div className={`w-2 h-2 ${isDark ? "bg-blue-400" : "bg-blue-500"} rounded-full mr-2`} />
              Planlanmış Randevular ({groupedAppointments["scheduled"]?.length})
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleGroupVisibility("scheduled")}
              className={isDark ? "text-blue-300 hover:bg-blue-900/30" : "text-blue-800"}
            >
              {visibleGroups["scheduled"] ? <ChevronUp /> : <ChevronDown />}
            </Button>
          </div>
          {visibleGroups["scheduled"] && renderAppointments(groupedAppointments["scheduled"], "scheduled")}
        </div>
      )}

      {/* Tamamlanmış Randevular */}
      {groupedAppointments["completed"]?.length > 0 && (
        <div className={isDark 
          ? "bg-green-900/20 border border-green-800/30 rounded-lg p-4" 
          : "bg-green-50/60 border border-green-200 rounded-lg p-4"
        }>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-lg font-semibold ${isDark ? "text-green-300" : "text-green-800"} flex items-center`}>
              <div className={`w-2 h-2 ${isDark ? "bg-green-400" : "bg-green-500"} rounded-full mr-2`} />
              Tamamlanmış Randevular ({groupedAppointments["completed"]?.length})
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleGroupVisibility("completed")}
              className={isDark ? "text-green-300 hover:bg-green-900/30" : "text-green-800"}
            >
              {visibleGroups["completed"] ? <ChevronUp /> : <ChevronDown />}
            </Button>
          </div>
          {visibleGroups["completed"] && renderAppointments(groupedAppointments["completed"], "completed")}
        </div>
      )}

      {/* İptal Edilmiş Randevular */}
      {groupedAppointments["cancelled"]?.length > 0 && (
        <div className={isDark 
          ? "bg-red-900/20 border border-red-800/30 rounded-lg p-4" 
          : "bg-red-50/60 border border-red-200 rounded-lg p-4"
        }>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-lg font-semibold ${isDark ? "text-red-300" : "text-red-800"} flex items-center`}>
              <div className={`w-2 h-2 ${isDark ? "bg-red-400" : "bg-red-500"} rounded-full mr-2`} />
              İptal Edilmiş Randevular ({groupedAppointments["cancelled"]?.length})
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleGroupVisibility("cancelled")}
              className={isDark ? "text-red-300 hover:bg-red-900/30" : "text-red-800"}
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
