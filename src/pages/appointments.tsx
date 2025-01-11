import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, CalendarDays, LayoutList, Table2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AppointmentForm } from "@/components/forms/AppointmentForm";
import { AppointmentFilters } from "@/components/appointments/AppointmentFilters";
import WeeklyView from "@/components/appointments/WeeklyView";
import MonthlyView from "@/components/appointments/MonthlyView";
import AppointmentGroups from "@/components/appointments/AppointmentGroups";
import { useAppointments } from "@/hooks/useAppointments";
import { Notification } from "@/components/ui/notification";
import { createAppointment, updateAppointment, deleteAppointment } from "@/lib/queries";
import { useToast } from "@/components/ui/use-toast";
import { Database } from "@/types/supabase";

type AppointmentType = Database["public"]["Tables"]["appointments"]["Row"];

function AppointmentsPage() {
  const { toast } = useToast();
  const {
    appointments,
    members,
    trainers,
    services,
    searchQuery,
    setSearchQuery,
    selectedTrainerId,
    setSelectedTrainerId,
    isLoading,
    currentTime,
    activeFilter,
    setActiveFilter,
    activeNotifications,
    setActiveNotifications,
    acknowledgedNotifications,
    setAcknowledgedNotifications,
    filteredAppointments,
    groupedAppointments,
    getFilteredCount,
  } = useAppointments();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "weekly" | "monthly">("list");
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentType | null>(null);

  // Get the current week's start and end dates
  const getWeekDates = () => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const diff = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1); // Adjust when current day is Sunday
    const monday = new Date(now.setDate(diff));
    const weekDates = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      weekDates.push(date);
    }

    return weekDates;
  };

  const handleFormSubmit = async (
    data: Omit<AppointmentType, "id" | "created_at" | "status">
  ) => {
    try {
      if (selectedAppointment) {
        // Editing existing appointment
        await updateAppointment(selectedAppointment.id, data);
        toast({
          title: "Başarılı",
          description: "Randevu başarıyla güncellendi.",
        });
      } else {
        // Adding new appointment
        await createAppointment({ ...data, status: "scheduled" });
        toast({
          title: "Başarılı",
          description: "Yeni randevu başarıyla oluşturuldu.",
        });
      }
      setSelectedAppointment(null);
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Randevu kaydedilirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      if (status === "in-progress") {
        // Randevu başlatıldığında, başlangıç tarih ve saatini güncelle
        const now = new Date();
        const currentDate = `${now.getFullYear()}-${String(
          now.getMonth() + 1
        ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
        const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(
          now.getMinutes()
        ).padStart(2, "0")}`;

        await updateAppointment(id, {
          status,
          date: currentDate,
          time: currentTime,
        });
      } else {
        await updateAppointment(id, { status });
      }

      toast({
        title: "Başarılı",
        description: "Randevu durumu güncellendi.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Randevu durumu güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    try {
      await deleteAppointment(id);
      toast({
        title: "Başarılı",
        description: "Randevu başarıyla silindi.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Randevu silinirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="container p-0 mt-4 md:mt-0 py-6 space-y-6">
      {/* Notifications */}
      {activeNotifications.map((notification, index) => (
        <Notification
          key={notification.id}
          message={notification.message}
          index={index}
          onAcknowledge={() => {
            setAcknowledgedNotifications(
              (prev) => new Set([...prev, notification.id])
            );
            setActiveNotifications((prev) =>
              prev.filter((n) => n.id !== notification.id)
            );
          }}
        />
      ))}
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center p-4">
        <div className="flex flex-col space-y-2">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Randevular</h2>
            <p className="text-sm md:text-base text-muted-foreground">
              Randevuları görüntüle, düzenle ve yönet
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <div className="text-sm md:text-base text-muted-foreground">
              {currentTime.toLocaleDateString("tr-TR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}{" "}
              -{" "}
              {currentTime.toLocaleTimeString("tr-TR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <LayoutList className="h-4 w-4 mr-2" />
              Liste
            </Button>
            <Button
              variant={viewMode === "weekly" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("weekly")}
            >
              <CalendarDays className="h-4 w-4 mr-2" />
              Haftalık
            </Button>
            <Button
              variant={viewMode === "monthly" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("monthly")}
            >
              <Table2 className="h-4 w-4 mr-2" />
              Tablo
            </Button>
          </div>

          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setSelectedAppointment(null);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" /> Yeni Randevu
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {selectedAppointment ? "Randevu Düzenle" : "Yeni Randevu"}
                </DialogTitle>
              </DialogHeader>
              <AppointmentForm
                members={members}
                trainers={trainers}
                services={services}
                appointment={selectedAppointment}
                onSubmit={handleFormSubmit}
                onCancel={() => {
                  setIsDialogOpen(false);
                  setSelectedAppointment(null);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
        <div className="flex flex-col md:flex-row md:space-x-2 border-b md:border-none w-full md:w-auto">
          <button
            className={`px-4 py-2 ${
              activeFilter === "all"
                ? "border-b-2 border-blue-500 text-blue-500 "
                : "text-gray-500"
            }`}
            onClick={() => setActiveFilter("all")}
          >
            Tüm Randevular ({getFilteredCount("all")})
          </button>
          <button
            className={`px-4 py-2 ${
              activeFilter === "daily"
                ? "border-b-2 border-blue-500 text-blue-500 "
                : "text-gray-500"
            }`}
            onClick={() => setActiveFilter("daily")}
          >
            Günlük Randevular ({getFilteredCount("daily")})
          </button>
          <button
            className={`px-4 py-2 ${
              activeFilter === "weekly"
                ? "border-b-2 border-blue-500 text-blue-500"
                : "text-gray-500"
            }`}
            onClick={() => setActiveFilter("weekly")}
          >
            Haftalık Randevular ({getFilteredCount("weekly")})
          </button>
          <button
            className={`px-4 py-2 ${
              activeFilter === "monthly"
                ? "border-b-2 border-blue-500 text-blue-500"
                : "text-gray-500"
            }`}
            onClick={() => setActiveFilter("monthly")}
          >
            Aylık Randevular ({getFilteredCount("monthly")})
          </button>
        </div>
        <div className="w-full md:w-auto">
          <AppointmentFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            trainers={trainers}
            selectedTrainerId={selectedTrainerId}
            onTrainerChange={setSelectedTrainerId}
          />
        </div>
      </div>

      {viewMode === "list" && (
        <AppointmentGroups
          groupedAppointments={groupedAppointments}
          members={members}
          trainers={trainers}
          services={services}
          onStatusChange={handleStatusChange}
          onEdit={(appointment) => {
            setSelectedAppointment(appointment);
            setIsDialogOpen(true);
          }}
          onDelete={handleDeleteAppointment}
        />
      )}

      {viewMode === "weekly" && (
        <WeeklyView
          weekDates={getWeekDates()}
          appointments={appointments}
          members={members}
          services={services}
          onAppointmentClick={(appointment) => {
            setSelectedAppointment(appointment);
            setIsDialogOpen(true);
          }}
        />
      )}

      {viewMode === "monthly" && (
        <MonthlyView
          appointments={filteredAppointments}
          members={members}
          trainers={trainers}
          services={services}
          onEdit={(appointment) => {
            setSelectedAppointment(appointment);
            setIsDialogOpen(true);
          }}
        />
      )}
    </div>
  );
}

export default AppointmentsPage;
