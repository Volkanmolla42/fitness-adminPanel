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
    createAppointment,
    updateAppointment,
    deleteAppointment,
    setAcknowledgedNotifications,
    groupedAppointments,
    getFilteredCount,
  } = useAppointments();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "weekly" | "monthly">("list");
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentType | null>(null);
  const [defaultDate, setDefaultDate] = useState<string | undefined>();
  const [defaultTime, setDefaultTime] = useState<string | undefined>();


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
      console.error(error)
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
      console.error(error)

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
      console.error(error)

    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Randevular yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container p-0 mt-4 md:mt-0 space-y-6">
      {/* Bildirimler */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
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
      </div>
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center p-4">
        <div className="flex flex-col space-y-2">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Randevular</h2>
            <p className="text-sm md:text-base text-muted-foreground">
              Randevuları görüntüle, düzenle ve yönet
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <div className="text-sm md:text-base font-bold bg-muted px-3 py-1 rounded-md">
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
          <div className="flex flex-wrap items-center gap-2 bg-muted/50 p-1 rounded-lg">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="flex-1 sm:flex-none"
            >
              <LayoutList className="h-4 w-4 mr-2" />
              Liste
            </Button>
            <Button
              variant={viewMode === "weekly" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("weekly")}
              className="flex-1 sm:flex-none"
            >
              <CalendarDays className="h-4 w-4 mr-2" />
              Haftalık
            </Button>
            <Button
              variant={viewMode === "monthly" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("monthly")}
              className="flex-1 sm:flex-none"
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
                setDefaultDate(undefined);
                setDefaultTime(undefined);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90">
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
                appointments={appointments}
                appointment={selectedAppointment}
                defaultDate={defaultDate}
                defaultTime={defaultTime}
                defaultTrainerId={selectedTrainerId || undefined}
                onSubmit={handleFormSubmit}
                onCancel={() => {
                  setIsDialogOpen(false);
                  setSelectedAppointment(null);
                  setDefaultDate(undefined);
                  setDefaultTime(undefined);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col space-y-4 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-wrap gap-2 p-1 bg-muted/50 rounded-lg">
            <Button
              variant={activeFilter === "daily" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveFilter("daily")}
              className="flex-1"
            >
              Bugün
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary/20">
                {getFilteredCount("daily")}
              </span>
            </Button>
            <Button
              variant={activeFilter === "weekly" ? "default" : "ghost"}
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
              variant={activeFilter === "monthly" ? "default" : "ghost"}
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
              variant={activeFilter === "all" ? "default" : "ghost"}
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

        <div className="min-h-[400px]">
          {viewMode === "list" && (
            <AppointmentGroups
              groupedAppointments={groupedAppointments}
              members={members}
              trainers={trainers}
              services={services}
              onStatusChange={handleStatusChange}
              onEdit={(appointment) => {
                setSelectedAppointment(appointment);
                setDefaultDate(undefined);
                setDefaultTime(undefined);
                setIsDialogOpen(true);
              }}
              onDelete={handleDeleteAppointment}
            />
          )}

          {viewMode === "weekly" && (
            <WeeklyView
              appointments={appointments}
              members={members}
              services={services}
              selectedTrainerId={selectedTrainerId}
              onAppointmentClick={(appointment) => {
                setSelectedAppointment(appointment);
                setIsDialogOpen(true);
              }}
              onAddAppointment={(date, time) => {
                setSelectedAppointment(null);
                setDefaultDate(date);
                setDefaultTime(time);
                setIsDialogOpen(true);
              }}
            />
          )}

          {viewMode === "monthly" && (
            <MonthlyView
              appointments={appointments}
              members={members}
              trainers={trainers}
              services={services}
              onEdit={(appointment) => {
                setSelectedAppointment(appointment);
                setDefaultDate(undefined);
                setDefaultTime(undefined);
                setIsDialogOpen(true);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default AppointmentsPage;
