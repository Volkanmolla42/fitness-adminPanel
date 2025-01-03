import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, CalendarDays, LayoutList } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  deleteAppointment,
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
  const [viewMode, setViewMode] = useState<'list' | 'weekly'>('list');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeNotifications, setActiveNotifications] = useState<Array<{ id: string; message: string }>>([]);
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(new Set());
  const [acknowledgedNotifications, setAcknowledgedNotifications] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('acknowledgedNotifications');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  useEffect(() => {
    fetchData();
    setupRealtimeSubscription();
    return () => {
      supabase.channel("appointments").unsubscribe();
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
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
    return filteredAppointments.reduce((groups, appointment) => {
      const status = appointment.status;
      if (!groups[status]) {
        groups[status] = [];
      }
      groups[status].push(appointment);
      return groups;
    }, {} as Record<string, Appointment[]>);
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
      if (status === "in-progress") {
        // Randevu başlatıldığında, başlangıç saatini güncelle
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        await updateAppointment(id, { 
          status,
          time: currentTime 
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
          
          // Eğer randevu geçmişse veya onaylanmışsa bildirimi kaldır
          if (minutesUntil < 10 || acknowledgedNotifications.has(String(appointment.id))) {
            return false;
          }
          
          return true;
        });
        return updatedNotifications;
      });

      // Yaklaşan randevuları kontrol et
      appointments.forEach((appointment) => {
        // Eğer bu randevu daha önce onaylandıysa, atla
        if (acknowledgedNotifications.has(String(appointment.id))) {
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

  useEffect(() => {
    localStorage.setItem('acknowledgedNotifications', JSON.stringify([...acknowledgedNotifications]));
  }, [acknowledgedNotifications]);

  // Randevu süresini dakika cinsinden hesapla
  const getAppointmentDuration = (appointment: Appointment) => {
    const service = services.find(s => s.id === appointment.service_id);
    if (!service) {
      console.warn(`Service not found for appointment ${appointment.id}, using default duration`);
      return 1; // Varsayılan süre 1 dakika
    }
    return service.duration;
  };

  // Randevunun bitiş zamanını hesapla
  const calculateEndTime = (appointment: Appointment) => {
    const startDateTime = new Date(`${appointment.date}T${appointment.time}`);
    const duration = getAppointmentDuration(appointment);
    return new Date(startDateTime.getTime() + duration * 60000);
  };

  // Kalan süreyi dakika cinsinden hesapla
  const calculateRemainingTime = (appointment: Appointment) => {
    const now = new Date();
    const startTime = new Date(`${appointment.date}T${appointment.time}`);
    const duration = getAppointmentDuration(appointment);
    const endTime = new Date(startTime.getTime() + duration * 60000);
    
    // Eğer randevu henüz başlamamışsa, toplam süreyi döndür
    if (now < startTime) {
      return duration;
    }
    
    // Eğer randevu bitmişse, 0 döndür
    if (now >= endTime) {
      return 0;
    }
    
    // Kalan süreyi hesapla
    const remainingMs = endTime.getTime() - now.getTime();
    const remainingMinutes = Math.ceil(remainingMs / 60000);
    
    console.log('Remaining time calculation:', {
      appointmentId: appointment.id,
      startTime: startTime.toLocaleTimeString(),
      endTime: endTime.toLocaleTimeString(),
      duration,
      remainingMinutes,
      service: services.find(s => s.id === appointment.service_id)
    });
    
    return remainingMinutes;
  };

  // Geri sayım ve otomatik durum güncellemesi için useEffect
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      
      appointments.forEach(appointment => {
        if (appointment.status === 'scheduled') {
          const startTime = new Date(`${appointment.date}T${appointment.time}`);
          const timeDiff = startTime.getTime() - now.getTime();
          const minutesDiff = Math.floor(timeDiff / (1000 * 60));
          const secondsDiff = Math.floor(timeDiff / 1000);

          // Randevu zamanı geldiğinde
          if (secondsDiff <= 0) {
            updateAppointmentStatus(appointment.id, 'in-progress');
            toast({
              title: "Randevu Başladı",
              description: `${getMemberName(appointment.member_id)} üyesinin randevusu başladı. (${getAppointmentDuration(appointment)} dakika)`,
            });
          }
          // 5 dakika veya daha az kaldıysa
          else if (minutesDiff <= 5) {
            toast({
              title: "Yaklaşan Randevu",
              description: `${getMemberName(appointment.member_id)} üyesinin randevusuna ${minutesDiff} dakika kaldı. (${getAppointmentDuration(appointment)} dakika)`,
              duration: 5000,
            });
          }
        }
        // Devam eden randevunun süresi dolduysa
        else if (appointment.status === 'in-progress') {
          const remainingMinutes = calculateRemainingTime(appointment);
          
          if (remainingMinutes <= 0) {
            updateAppointmentStatus(appointment.id, 'completed');
            toast({
              title: "Randevu Tamamlandı",
              description: `${getMemberName(appointment.member_id)} üyesinin randevusu otomatik olarak tamamlandı.`,
            });
          } else if (remainingMinutes % 15 === 0) {
            toast({
              title: "Devam Eden Randevu",
              description: `${getMemberName(appointment.member_id)} üyesinin randevusunun bitmesine ${remainingMinutes} dakika kaldı.`,
              duration: 5000,
            });
          }
        }
      });
    }, 10000);

    return () => clearInterval(timer);
  }, [appointments, services]);

  // Randevu durumunu güncellemek için yardımcı fonksiyon
  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId);

      if (error) throw error;

      // State'i güncelle
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === appointmentId ? { ...apt, status: newStatus } : apt
        )
      );

      toast({
        title: "Randevu durumu güncellendi",
        description: `Randevu durumu "${newStatus}" olarak değiştirildi.`,
      });
    } catch (error) {
      console.error('Error updating appointment status:', error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Randevu durumu güncellenirken bir hata oluştu.",
      });
    }
  };

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

  // Get appointments for a specific date
  const getAppointmentsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return appointments.filter(apt => apt.date === dateStr);
  };

  // Format time for display
  const formatTime = (time: string) => {
    return time.slice(0, 5);
  };

  // Get member and trainer names
  const getMemberName = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    return member ? `${member.first_name} ${member.last_name}` : '';
  };

  const getTrainerName = (trainerId: string) => {
    const trainer = trainers.find(t => t.id === trainerId);
    return trainer ? `${trainer.first_name} ${trainer.last_name}` : '';
  };

  const getServiceName = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    return service ? service.name : '';
  };

  const getDayAbbreviation = (date: Date) => {
    const days = ['Pzr', 'Pzt', 'Sal', 'Çrş', 'Prş', 'Cum', 'Cts'];
    return days[date.getDay()];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Notifications */}
      {activeNotifications.map((notification, index) => (
        <Notification
          key={notification.id}
          message={notification.message}
          index={index}
          onClose={() => {
            setDismissedNotifications(prev => new Set([...prev, notification.id]));
            setActiveNotifications(prev => prev.filter(n => n.id !== notification.id));
          }}
          onAcknowledge={() => {
            setAcknowledgedNotifications(prev => new Set([...prev, notification.id]));
            setActiveNotifications(prev => prev.filter(n => n.id !== notification.id));
          }}
        />
      ))}
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold tracking-tight">Randevular</h2>
            <div className="text-lg text-muted-foreground">
              {currentTime.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })} - {currentTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <p className="text-muted-foreground">
            Randevuları görüntüle, düzenle ve yönet
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={viewMode === 'weekly' ? 'default' : 'outline'} 
            onClick={() => setViewMode(viewMode === 'weekly' ? 'list' : 'weekly')}
          >
            {viewMode === 'weekly' ? (
              <>
                <LayoutList className="mr-2 h-4 w-4" />
                Günlük Görünüm
              </>
            ) : (
              <>
                <CalendarDays className="mr-2 h-4 w-4" />
                Haftalık Görünüm
              </>
            )}
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setSelectedAppointment(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button>
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
      </div>

      <div className="flex items-center space-x-2">
        <AppointmentFilters
          searchQuery={searchQuery}
          onSearchChange={(value) => setSearchQuery(value)}
          onFilterClick={() => {}}
        />
      </div>

      {viewMode === 'weekly' ? (
        <div className="bg-white rounded-lg shadow">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px] bg-muted/50">Saat</TableHead>
                  {getWeekDates().map((date) => (
                    <TableHead 
                      key={date.toISOString()} 
                      className={`
                        min-w-[100px] bg-muted/50
                        ${date.toISOString().split('T')[0] === new Date().toISOString().split('T')[0] && 
                        "bg-primary/10"
                      }`}
                    >
                      <div className="font-bold">{getDayAbbreviation(date)}</div>
                      <div>
                        {date.toLocaleDateString('tr-TR', { 
                          day: 'numeric',
                          month: 'short'
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
                      {`${hour.toString().padStart(2, '0')}:00`}
                    </TableCell>
                    {getWeekDates().map((date) => {
                      const dayAppointments = getAppointmentsForDate(date)
                        .filter(apt => {
                          const aptHour = parseInt(apt.time.split(':')[0]);
                          return aptHour === hour;
                        });

                      return (
                        <TableCell 
                          key={date.toISOString()} 
                          className={`
                            p-0.5 h-[70px] align-top
                            ${date.toISOString().split('T')[0] === new Date().toISOString().split('T')[0] && 
                            "bg-primary/5"
                          }`}
                        >
                          {dayAppointments.map((apt) => (
                            <div 
                              key={apt.id}
                              onClick={() => {
                                setSelectedAppointment(apt);
                                setIsDialogOpen(true);
                              }}
                              className={`
                                p-0.5 rounded text-[10px] mb-0.5 cursor-pointer hover:opacity-80 transition-opacity
                                ${apt.status === 'completed' ? 'bg-green-100 hover:bg-green-200' :
                                apt.status === 'in-progress' ? 'bg-yellow-100 hover:bg-yellow-200' :
                                apt.status === 'cancelled' ? 'bg-red-100 hover:bg-red-200' :
                                'bg-blue-100 hover:bg-blue-200'
                              }`}
                            >
                              <div className="font-medium flex justify-between items-center">
                                <span>{formatTime(apt.time)}</span>
                                <span className="text-[9px] text-muted-foreground">
                                  {getDayAbbreviation(new Date(apt.date))}
                                </span>
                              </div>
                              <div className="truncate">{getMemberName(apt.member_id)}</div>
                              <div className="text-muted-foreground truncate">{getServiceName(apt.service_id)}</div>
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
      ) : (
        <div className="space-y-6">
          {/* Devam Eden Randevular */}
          {groupedAppointments['in-progress']?.length > 0 && (
            <div className="bg-yellow-50/50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 text-yellow-800 flex items-center">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2" />
                Devam Eden Randevular
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {groupedAppointments['in-progress'].map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    member={{
                      firstName: members.find((m) => m.id === appointment.member_id)?.first_name || "",
                      lastName: members.find((m) => m.id === appointment.member_id)?.last_name || "",
                    }}
                    trainer={{
                      firstName: trainers.find((t) => t.id === appointment.trainer_id)?.first_name || "",
                      lastName: trainers.find((t) => t.id === appointment.trainer_id)?.last_name || "",
                    }}
                    service={{
                      name: services.find((s) => s.id === appointment.service_id)?.name || "",
                      duration: services.find((s) => s.id === appointment.service_id)?.duration || 0,
                    }}
                    onStatusChange={handleStatusChange}
                    onEdit={(appointment) => {
                      setSelectedAppointment(appointment);
                      setIsDialogOpen(true);
                    }}
                    onDelete={handleDeleteAppointment}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Planlanmış Randevular */}
          {groupedAppointments['scheduled']?.length > 0 && (
            <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 text-blue-800 flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
                Planlanmış Randevular
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {groupedAppointments['scheduled'].map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    member={{
                      firstName: members.find((m) => m.id === appointment.member_id)?.first_name || "",
                      lastName: members.find((m) => m.id === appointment.member_id)?.last_name || "",
                    }}
                    trainer={{
                      firstName: trainers.find((t) => t.id === appointment.trainer_id)?.first_name || "",
                      lastName: trainers.find((t) => t.id === appointment.trainer_id)?.last_name || "",
                    }}
                    service={{
                      name: services.find((s) => s.id === appointment.service_id)?.name || "",
                      duration: services.find((s) => s.id === appointment.service_id)?.duration || 0,
                    }}
                    onStatusChange={handleStatusChange}
                    onEdit={(appointment) => {
                      setSelectedAppointment(appointment);
                      setIsDialogOpen(true);
                    }}
                    onDelete={handleDeleteAppointment}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Tamamlanan Randevular */}
          {groupedAppointments['completed']?.length > 0 && (
            <div className="bg-green-50/50 border border-green-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 text-green-800 flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                Tamamlanan Randevular
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {groupedAppointments['completed'].map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    member={{
                      firstName: members.find((m) => m.id === appointment.member_id)?.first_name || "",
                      lastName: members.find((m) => m.id === appointment.member_id)?.last_name || "",
                    }}
                    trainer={{
                      firstName: trainers.find((t) => t.id === appointment.trainer_id)?.first_name || "",
                      lastName: trainers.find((t) => t.id === appointment.trainer_id)?.last_name || "",
                    }}
                    service={{
                      name: services.find((s) => s.id === appointment.service_id)?.name || "",
                      duration: services.find((s) => s.id === appointment.service_id)?.duration || 0,
                    }}
                    onStatusChange={handleStatusChange}
                    onEdit={(appointment) => {
                      setSelectedAppointment(appointment);
                      setIsDialogOpen(true);
                    }}
                    onDelete={handleDeleteAppointment}
                  />
                ))}
              </div>
            </div>
          )}

          {/* İptal Edilen Randevular */}
          {groupedAppointments['cancelled']?.length > 0 && (
            <div className="bg-red-50/50 border border-red-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 text-red-800 flex items-center">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                İptal Edilen Randevular
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {groupedAppointments['cancelled'].map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    member={{
                      firstName: members.find((m) => m.id === appointment.member_id)?.first_name || "",
                      lastName: members.find((m) => m.id === appointment.member_id)?.last_name || "",
                    }}
                    trainer={{
                      firstName: trainers.find((t) => t.id === appointment.trainer_id)?.first_name || "",
                      lastName: trainers.find((t) => t.id === appointment.trainer_id)?.last_name || "",
                    }}
                    service={{
                      name: services.find((s) => s.id === appointment.service_id)?.name || "",
                      duration: services.find((s) => s.id === appointment.service_id)?.duration || 0,
                    }}
                    onStatusChange={handleStatusChange}
                    onEdit={(appointment) => {
                      setSelectedAppointment(appointment);
                      setIsDialogOpen(true);
                    }}
                    onDelete={handleDeleteAppointment}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Randevu Yoksa */}
          {Object.keys(groupedAppointments).length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Görüntülenecek randevu bulunmamaktadır.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AppointmentsPage;
