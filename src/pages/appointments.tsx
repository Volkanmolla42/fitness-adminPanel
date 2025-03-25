import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { CalendarDays, LayoutList, Table2 } from "lucide-react";
import { useTheme } from "@/contexts/theme-context";
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
import TableView from "@/components/appointments/TableView";
import AppointmentGroups from "@/components/appointments/AppointmentGroups";
import { useAppointments } from "@/hooks/useAppointments";
import { Notification } from "@/components/ui/notification";
import { useToast } from "@/components/ui/use-toast";
import { Database } from "@/types/supabase";
import { LoadingSpinner } from "@/App";

type AppointmentType = Database["public"]["Tables"]["appointments"]["Row"];

function AppointmentsPage() {
  const { toast } = useToast();
  const { theme } = useTheme();
  const isDark = theme === "dark";
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
  const [viewMode, setViewMode] = useState<"list" | "weekly" | "table">(
    "weekly"
  );
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentType | null>(null);
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
      console.error(error);
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
        const currentTime = `${String(now.getHours()).padStart(
          2,
          "0"
        )}:${String(now.getMinutes()).padStart(2, "0")}`;

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
      console.error(error);
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
      console.error(error);
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Randevular yükleniyor..." />;
  }

  return (
    <div className={`space-y-4 container m-0 p-0`}>
      {/* Bildirimler */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
        {activeNotifications.map((notification, index) => (
          <Notification
            key={notification.id}
            message={notification.message}
            index={index}
            onAcknowledge={() => {
              setAcknowledgedNotifications((prev) => new Set([...prev, notification.id]));
              setActiveNotifications((prev) => prev.filter((n) => n.id !== notification.id));
            }}
          />
        ))}
      </div>
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-end">
        <div className="flex flex-col space-y-4">
          <div>
            <h2 className={`text-3xl font-bold ${isDark ? "text-gray-100" : "text-gray-900"}`}>Randevular</h2>
            <p className={`text-sm md:text-base ${isDark ? "text-gray-400" : "text-muted-foreground"}`}>
              Randevuları görüntüle, düzenle ve yönet
            </p>
          </div>
          <div className="flex items-center flex-wrap gap-2">
            <div className={`text-sm md:text-base font-bold px-3 py-1 rounded-md ${
              isDark ? "bg-gray-800 text-gray-300" : "bg-muted text-gray-700"
            }`}>
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
          <div className={`flex flex-wrap items-center gap-2 p-1 rounded-lg ${
            isDark ? "bg-gray-800/50" : "bg-muted/50"
          }`}>
            <Button
              variant={viewMode === "weekly" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("weekly")}
              className={`flex-1 sm:flex-none ${
                isDark && viewMode !== "weekly" ? "hover:bg-gray-700" : ""
              }`}
            >
              <CalendarDays className="h-4 w-4 mr-2" />
              Haftalık
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className={`flex-1 sm:flex-none ${
                isDark && viewMode !== "list" ? "hover:bg-gray-700" : ""
              }`}
            >
              <LayoutList className="h-4 w-4 mr-2" />
              Liste
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className={`flex-1 sm:flex-none ${
                isDark && viewMode !== "table" ? "hover:bg-gray-700" : ""
              }`}
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
              <Button className={`w-full sm:w-auto p-4 ${
                isDark 
                  ? "bg-green-600 hover:bg-green-700 text-white" 
                  : "bg-primary hover:bg-primary/90"
              }`}>
                <span className={`text-xl mr-2 ${isDark ? "text-white" : "text-green-500"}`}>+</span>
                <span>Randevu Ekle</span>
              </Button>
            </DialogTrigger>
            <DialogContent className={`sm:max-w-[425px] ${isDark ? "bg-gray-800 border-gray-700" : ""}`}>
              <DialogHeader>
                <DialogTitle className={isDark ? "text-gray-100" : ""}>
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

      <div className="flex flex-col space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="w-full md:w-auto">
            <AppointmentFilters
              trainers={trainers}
              selectedTrainerId={selectedTrainerId}
              onTrainerChange={setSelectedTrainerId}
            />
          </div>
        </div>

        <div className={`min-h-[400px]`}>
          {viewMode === "list" && (
            <AppointmentGroups
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              activeFilter={activeFilter}
              setActiveFilter={setActiveFilter}
              getFilteredCount={getFilteredCount}
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

          {viewMode === "table" && (
            <TableView
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
