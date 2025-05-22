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
    createAppointment,
    updateAppointment,
    deleteAppointment,
    groupedAppointments,
    getFilteredCount,
    filteredAppointments,
    startDate,
    endDate,
    handleDateRangeChange,
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
    data: Omit<AppointmentType, "id" | "created_at" | "status">,
    isPostpone?: boolean
  ) => {
    try {
      if (selectedAppointment) {
        // Editing existing appointment
        await updateAppointment(selectedAppointment.id, data, isPostpone);
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
    <div className={`space-y-6 container p-0`}>
      <div className="flex flex-col space-y-6">
        {/* Başlık ve Tarih Bölümü */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h2
              className={`text-3xl font-bold ${
                isDark ? "text-gray-100" : "text-gray-900"
              }`}
            >
              Randevular
            </h2>
            <p
              className={`text-sm md:text-base ${
                isDark ? "text-gray-400" : "text-muted-foreground"
              }`}
            >
              Randevuları görüntüle, düzenle ve yönet
            </p>
          </div>
          <div
            className={`text-sm md:text-base font-medium px-3 py-1.5 rounded-md mt-2 sm:mt-0 ${
              isDark
                ? "bg-gray-800/80 text-gray-300"
                : "bg-muted/80 text-gray-700"
            }`}
          >
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

        {/* Görünüm Seçenekleri ve Randevu Ekle */}
        <div className="flex flex-col sm:flex-row justify-between gap-3">
          <div
            className={`flex flex-wrap items-center gap-2 p-1 rounded-lg shadow-sm ${
              isDark
                ? "bg-gray-800/70 border border-gray-700/50"
                : "bg-muted/70 border border-gray-200/50"
            }`}
          >
            <Button
              variant={viewMode === "weekly" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("weekly")}
              className={`flex-1 sm:flex-none transition-colors ${
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
              className={`flex-1 sm:flex-none transition-colors ${
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
              className={`flex-1 sm:flex-none transition-colors ${
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
              <Button
                className={`w-full sm:w-auto px-4 py-2 transition-all duration-200 shadow-sm ${
                  isDark
                    ? "bg-green-600 hover:bg-green-700 text-white hover:shadow-md"
                    : "bg-primary hover:bg-primary/90 hover:shadow-md"
                }`}
              >
                <span
                  className={`text-xl mr-2 ${
                    isDark ? "text-white" : "text-white"
                  }`}
                >
                  +
                </span>
                <span>Randevu Ekle</span>
              </Button>
            </DialogTrigger>
            <DialogContent
              className={`sm:max-w-[425px] ${
                isDark ? "bg-gray-800 border-gray-700" : ""
              }`}
            >
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
              />
            </DialogContent>
          </Dialog>
        </div>
        {/* Filtreler Bölümü */}
        <div
          className={`p-4 rounded-lg shadow-md flex flex-col space-y-2 ${
            isDark
              ? "bg-gray-800/70 border border-gray-700/50"
              : "bg-gray-300/70 border border-gray-200/50"
          }`}
        >
          {/* Tüm Filtreler */}
          <AppointmentFilters
            trainers={trainers}
            selectedTrainerId={selectedTrainerId}
            onTrainerChange={setSelectedTrainerId}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            getFilteredCount={getFilteredCount}
            viewMode={viewMode}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            startDate={startDate}
            endDate={endDate}
            onDateRangeChange={handleDateRangeChange}
          />
        </div>
        {/* İçerik Alanı */}
        <div
          className={`min-h-[500px] bg-opacity-50 rounded-lg ${
            isDark ? "bg-gray-800/30" : "bg-gray-50/70"
          } p-4 shadow-sm`}
        >
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

          {viewMode === "table" && (
            <TableView
              appointments={filteredAppointments}
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
