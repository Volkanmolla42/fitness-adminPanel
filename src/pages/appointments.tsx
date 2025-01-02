import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AppointmentForm } from "@/components/forms/AppointmentForm";
import { AppointmentFilters } from "@/components/appointments/AppointmentFilters";
import AppointmentCard from "@/components/appointments/AppointmentCard";
import { supabase } from "@/lib/supabase";
import {
  getAppointments,
  getMembers,
  getTrainers,
  getServices,
  createAppointment,
  updateAppointment,
} from "@/lib/queries";
import type { Database } from "@/types/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Notification } from "@/components/ui/notification";

type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
type Member = Database["public"]["Tables"]["members"]["Row"];
type Trainer = Database["public"]["Tables"]["trainers"]["Row"];
type Service = Database["public"]["Tables"]["services"]["Row"];

function AppointmentsPage() {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeNotifications, setActiveNotifications] = useState<Array<{ id: string; message: string }>>([]);
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(new Set());
  const [acknowledgedNotifications, setAcknowledgedNotifications] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchData();
    setupRealtimeSubscription();
    return () => {
      supabase.channel("appointments").unsubscribe();
    };
  }, []);

  const fetchData = async () => {
    try {
      const [appointmentsData, membersData, trainersData, servicesData] =
        await Promise.all([
          getAppointments(),
          getMembers(),
          getTrainers(),
          getServices(),
        ]);

      setAppointments(appointmentsData);
      setMembers(membersData);
      setTrainers(trainersData);
      setServices(servicesData);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Veriler yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    supabase
      .channel("appointments")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setAppointments((prev) => [payload.new as Appointment, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setAppointments((prev) =>
              prev.map((appointment) =>
                appointment.id === payload.new.id
                  ? (payload.new as Appointment)
                  : appointment
              )
            );
          } else if (payload.eventType === "DELETE") {
            setAppointments((prev) =>
              prev.filter((appointment) => appointment.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();
  };

  // Convert arrays to record objects for easier lookup
  const membersRecord = useMemo(
    () =>
      members.reduce(
        (acc, member) => ({ ...acc, [member.id]: member }),
        {} as Record<string, Member>
      ),
    [members]
  );

  const trainersRecord = useMemo(
    () =>
      trainers.reduce(
        (acc, trainer) => ({ ...acc, [trainer.id]: trainer }),
        {} as Record<string, Trainer>
      ),
    [trainers]
  );

  const servicesRecord = useMemo(
    () =>
      services.reduce(
        (acc, service) => ({ ...acc, [service.id]: service }),
        {} as Record<string, Service>
      ),
    [services]
  );

  // Filter appointments based on search query
  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      if (!searchQuery.trim()) return true;

      const member = membersRecord[appointment.member_id];
      const trainer = trainersRecord[appointment.trainer_id];
      const service = servicesRecord[appointment.service_id];

      if (!member || !trainer || !service) return false;

      const searchTerms = searchQuery.toLowerCase().split(" ");
      const searchString = `
        ${member.first_name}
        ${member.last_name}
        ${trainer.first_name}
        ${trainer.last_name}
        ${service.name}
        ${appointment.date}
        ${appointment.time}
        ${appointment.notes || ""}
      `.toLowerCase();

      return searchTerms.every((term) => searchString.includes(term));
    });
  }, [
    appointments,
    searchQuery,
    membersRecord,
    trainersRecord,
    servicesRecord,
  ]);

  // Group appointments by status
  const groupedAppointments = useMemo(() => {
    const groups = filteredAppointments.reduce((groups, appointment) => {
      const status = appointment.status;
      if (!groups[status]) {
        groups[status] = [];
      }
      groups[status].push(appointment);
      return groups;
    }, {} as Record<Appointment["status"], Appointment[]>);

    // Sort appointments by time within each group
    Object.values(groups).forEach((group) => {
      group.sort((a, b) => a.time.localeCompare(b.time));
    });

    return groups;
  }, [filteredAppointments]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDialogOpen(true);
  };

  const handleFormSubmit = async (
    data: Omit<Appointment, "id" | "created_at" | "status">
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

  const handleStatusChange = async (
    id: string,
    status: Appointment["status"]
  ) => {
    try {
      await updateAppointment(id, { status });
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

  useEffect(() => {
    const checkUpcomingAppointments = () => {
      const now = new Date();
      console.log("Checking appointments at:", now);
      console.log("Total appointments:", appointments.length);
      
      // Mevcut bildirimleri kontrol et ve gerekirse kaldır
      setActiveNotifications(prev => {
        const updatedNotifications = prev.filter(notification => {
          const appointment = appointments.find(a => String(a.id) === String(notification.id));
          if (!appointment) return false;

          const [hours, minutes] = appointment.time.split(':').map(num => parseInt(num, 10));
          const appointmentDate = new Date(appointment.date);
          appointmentDate.setHours(hours);
          appointmentDate.setMinutes(minutes);
          appointmentDate.setSeconds(0);

          const minutesUntil = Math.floor((appointmentDate.getTime() - now.getTime()) / (60 * 1000));
          return minutesUntil >= 10; // 10 dakikadan az kaldıysa kaldır
        });
        return updatedNotifications;
      });

      // Yaklaşan randevuları kontrol et
      appointments.forEach((appointment) => {
        // Eğer bu randevu daha önce kapatıldıysa veya görüldü olarak işaretlendiyse, atla
        if (dismissedNotifications.has(String(appointment.id)) || acknowledgedNotifications.has(String(appointment.id))) {
          return;
        }

        // Eğer bu randevu için zaten aktif bir bildirim varsa, atla
        if (activeNotifications.some(n => n.id === String(appointment.id))) {
          return;
        }

        if (!appointment?.date || !appointment?.time) {
          console.log("Skipping appointment with no date or time:", appointment);
          return;
        }

        try {
          const [hours, minutes] = appointment.time.split(':').map(num => parseInt(num, 10));
          const appointmentDate = new Date(appointment.date);
          appointmentDate.setHours(hours);
          appointmentDate.setMinutes(minutes);
          appointmentDate.setSeconds(0);

          const minutesUntil = Math.floor((appointmentDate.getTime() - now.getTime()) / (60 * 1000));
          
          // 10-20 dakika aralığındaysa bildirim göster
          if (minutesUntil >= 10 && minutesUntil <= 20) {
            const trainer = trainers.find((t) => t.id === appointment.trainer_id);
            const member = members.find((m) => m.id === appointment.member_id);
            if (trainer && member) {
              const newNotification = {
                id: String(appointment.id),
                message: `${minutesUntil} dakika sonra <strong>${trainer.first_name} ${trainer.last_name}</strong> ile ${member.first_name} ${member.last_name} üyenin randevusu var. (${appointmentDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })})`
              };
              
              setActiveNotifications(prev => [...prev, newNotification]);
            }
          }
        } catch (error) {
          console.error("Error checking appointment:", appointment, error);
        }
      });
    };

    // İlk kontrol
    checkUpcomingAppointments();

    // Her 60 saniyede bir kontrol et
    const interval = setInterval(checkUpcomingAppointments, 60000);

    return () => clearInterval(interval);
  }, [appointments, trainers, members, dismissedNotifications, acknowledgedNotifications]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="fixed bottom-4 right-4 space-y-2">
        {activeNotifications.map((notification, index) => (
          <Notification
            key={notification.id}
            message={notification.message}
            index={index}
            onAcknowledge={() => {
              setAcknowledgedNotifications(prev => new Set([...prev, notification.id]));
              setActiveNotifications(prev => prev.filter(n => n.id !== notification.id));
            }}
            onClose={() => {
              setDismissedNotifications(prev => new Set([...prev, notification.id]));
              setActiveNotifications(prev => prev.filter(n => n.id !== notification.id));
            }}
          />
        ))}
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Günlük Randevular</h1>
          <p className="text-gray-500 text-sm sm:text-base">
            {new Date().toLocaleDateString("tr-TR", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setSelectedAppointment(null);
          }}
        >
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Yeni Randevu
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

      <div className="w-full">
        <AppointmentFilters
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onFilterClick={() => {}}
        />
      </div>

      {/* Ongoing Appointments */}
      {groupedAppointments["in-progress"]?.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 text-blue-800">
            Devam Eden Randevular
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groupedAppointments["in-progress"].map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                member={{
                  firstName: membersRecord[appointment.member_id].first_name,
                  lastName: membersRecord[appointment.member_id].last_name,
                }}
                trainer={{
                  firstName: trainersRecord[appointment.trainer_id].first_name,
                  lastName: trainersRecord[appointment.trainer_id].last_name,
                }}
                service={{
                  name: servicesRecord[appointment.service_id].name,
                }}
                onStatusChange={handleStatusChange}
                onEdit={handleEditAppointment}
              />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Appointments */}
      {groupedAppointments["scheduled"]?.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">
            Yaklaşan Randevular
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groupedAppointments["scheduled"].map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                member={{
                  firstName: membersRecord[appointment.member_id].first_name,
                  lastName: membersRecord[appointment.member_id].last_name,
                }}
                trainer={{
                  firstName: trainersRecord[appointment.trainer_id].first_name,
                  lastName: trainersRecord[appointment.trainer_id].last_name,
                }}
                service={servicesRecord[appointment.service_id]}
                onStatusChange={handleStatusChange}
                onEdit={handleEditAppointment}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Appointments */}
      {groupedAppointments["completed"]?.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 text-green-800">
            Tamamlanan Randevular
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groupedAppointments["completed"].map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                member={{
                  firstName: membersRecord[appointment.member_id].first_name,
                  lastName: membersRecord[appointment.member_id].last_name,
                }}
                trainer={{
                  firstName: trainersRecord[appointment.trainer_id].first_name,
                  lastName: trainersRecord[appointment.trainer_id].last_name,
                }}
                service={servicesRecord[appointment.service_id]}
                onStatusChange={handleStatusChange}
                onEdit={handleEditAppointment}
              />
            ))}
          </div>
        </div>
      )}

      {/* Cancelled Appointments */}
      {groupedAppointments["cancelled"]?.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 text-red-800">
            İptal Edilen Randevular
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groupedAppointments["cancelled"].map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                member={{
                  firstName: membersRecord[appointment.member_id].first_name,
                  lastName: membersRecord[appointment.member_id].last_name,
                }}
                trainer={{
                  firstName: trainersRecord[appointment.trainer_id].first_name,
                  lastName: trainersRecord[appointment.trainer_id].last_name,
                }}
                service={servicesRecord[appointment.service_id]}
                onStatusChange={handleStatusChange}
                onEdit={handleEditAppointment}
              />
            ))}
          </div>
        </div>
      )}

      {/* No Appointments Message */}
      {Object.keys(groupedAppointments).length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>Bugün için randevu bulunmamaktadır.</p>
        </div>
      )}
    </div>
  );
}

export default AppointmentsPage;
