import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, Clock, Mail, MapPin, Phone, Plus, Calendar, Pencil, Trash2, User2, FileText, CalendarDays } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import {
  getTrainers,
  getAppointments,
  getServices,
  createTrainer,
  updateTrainer,
  deleteTrainer,
} from "@/lib/queries";
import { useToast } from "@/components/ui/use-toast";
import { Trainer, Appointment, TrainerInput } from "@/types";
import { TrainerForm } from "@/components/forms/TrainerForm";
import cn from "classnames";
import { Database } from "@/types/supabase";
type Service = Database["public"]["Tables"]["services"]["Row"];

const TrainersPage = () => {
  const { toast } = useToast();
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
    setupRealtimeSubscription();
    return () => {
      supabase.channel("trainers").unsubscribe();
      supabase.channel("appointments").unsubscribe();
    };
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [trainersData, appointmentsData, servicesData] = await Promise.all([
        getTrainers(),
        getAppointments(),
        getServices(),
      ]);

      if (trainersData) {
        setTrainers(trainersData);
      }
      if (appointmentsData) {
        const validAppointments = appointmentsData.map((appointment) => {
          const validStatus = [
            "scheduled",
            "in-progress",
            "completed",
            "cancelled",
          ].includes(appointment.status)
            ? appointment.status as Appointment["status"]
            : "scheduled";

          return {
            ...appointment,
            status: validStatus,
          };
        });
        setAppointments(validAppointments);
      }
      if (servicesData) {
        setServices(servicesData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch data. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const trainersChannel = supabase
      .channel("trainers")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trainers" },
        fetchData
      )
      .subscribe();

    const appointmentsChannel = supabase
      .channel("appointments")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments" },
        fetchData
      )
      .subscribe();
  };

  const handleCreate = async (data: TrainerInput) => {
    try {
      await createTrainer(data);
      setIsAddDialogOpen(false);
      toast({
        title: "Başarılı",
        description: "Eğitmen başarıyla eklendi.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Eğitmen eklenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async (data: TrainerInput) => {
    if (!editingTrainer) return;

    try {
      await updateTrainer(editingTrainer.id, data);
      setEditingTrainer(null);
      toast({
        title: "Başarılı",
        description: "Eğitmen başarıyla güncellendi.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Eğitmen güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTrainer(id);
      setSelectedTrainer(null);
      toast({
        title: "Başarılı",
        description: "Eğitmen başarıyla silindi.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Eğitmen silinirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const getTrainerAppointments = (trainerId: string) => {
    return appointments.filter((appointment) => appointment.trainer_id === trainerId);
  };

  const calculateEndTime = (startTime: string, durationMinutes: number = 60) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60) % 24; // Ensure hours don't exceed 24
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  };

  const getRemainingMinutes = (startTime: string, durationMinutes: number = 60) => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTotalMinutes = currentHour * 60 + currentMinute;

    const [startHour, startMinute] = startTime.split(':').map(Number);
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = startTotalMinutes + durationMinutes;

    let remainingMinutes;
    if (currentTotalMinutes < startTotalMinutes) {
      // Eğer şu anki zaman başlangıç zamanından küçükse, gün değişmiş demektir
      remainingMinutes = endTotalMinutes - (currentTotalMinutes + 24 * 60);
    } else {
      remainingMinutes = endTotalMinutes - currentTotalMinutes;
    }

    return Math.max(0, remainingMinutes);
  };

  const isTrainerBusy = (trainerId: string) => {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];

    const activeAppointment = appointments.find(
      (appointment) => 
        appointment.trainer_id === trainerId && 
        appointment.date === currentDate && 
        appointment.status === "in-progress"
    );

    return !!activeAppointment;
  };

  const getCurrentAppointment = (trainerId: string) => {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    return appointments.find(
      (appointment) =>
        appointment.trainer_id === trainerId &&
        appointment.date === currentDate &&
        appointment.status === "in-progress"
    );
  };

  const filteredTrainers = trainers.filter((trainer) => {
    const searchString = searchQuery.toLowerCase();
    return (
      trainer.first_name.toLowerCase().includes(searchString) ||
      trainer.last_name.toLowerCase().includes(searchString) ||
      trainer.email.toLowerCase().includes(searchString) ||
      trainer.phone.toLowerCase().includes(searchString)
    );
  });

  const busyTrainers = filteredTrainers.filter((trainer) => isTrainerBusy(trainer.id));
  const availableTrainers = filteredTrainers.filter((trainer) => !isTrainerBusy(trainer.id));

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Eğitmenler</h2>
          <p className="text-muted-foreground">
            Eğitmenleri görüntüle, düzenle ve yönet
          </p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Eğitmen Ekle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Eğitmen</DialogTitle>
            </DialogHeader>
            <TrainerForm
              onSubmit={handleCreate}
              onCancel={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <Input
          placeholder="Eğitmen ara... "
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {busyTrainers.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg text-primary">Randevuda Olan Eğitmenler</h3>
            <Badge variant="secondary">{busyTrainers.length}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {busyTrainers.map((trainer) => (
              <Card
                key={trainer.id}
                className={cn(
                  "p-4 cursor-pointer hover:shadow-md hover:-translate-y-1 hover:shadow-black/50 transition-all bg-white relative group",
                  "animate-pulse-border border-2 border-primary"
                )}
                onClick={() => setSelectedTrainer(trainer)}
              >
                <div className="absolute -top-2 -right-2">
                  <Badge className="bg-primary text-primary-foreground">
                    <Clock className="w-3 h-3 mr-1" />
                    Randevuda
                  </Badge>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-3 text-xl font-semibold text-primary">
                    {trainer.first_name && trainer.last_name ? (
                      <span>
                        {trainer.first_name.charAt(0).toUpperCase()}
                        {trainer.last_name.charAt(0).toUpperCase()}
                      </span>
                    ) : (
                      <Award className="w-10 h-10 text-primary" />
                    )}
                  </div>

                  <h3 className="font-semibold text-lg mb-2">
                    {trainer.first_name} {trainer.last_name}
                  </h3>

                  {(() => {
                    const currentAppointment = getCurrentAppointment(trainer.id);
                    if (currentAppointment) {
                      const service = services.find(service => service.id === currentAppointment.service_id);
                      const duration = service?.duration || 60;
                      const remainingMinutes = getRemainingMinutes(currentAppointment.time, duration);
                      return (
                        <div className="space-y-2 w-full">
                          <div className="flex items-center justify-center gap-2 text-sm">
                            <User2 className="w-4 h-4" />
                            <span className="text-muted-foreground">
                              {currentAppointment.member?.first_name} {currentAppointment.member?.last_name}
                            </span>
                          </div>
                          <div className="flex items-center justify-center gap-2 text-sm">
                            <FileText className="w-4 h-4" />
                            <span className="text-muted-foreground">
                              {currentAppointment.service?.name}
                            </span>
                          </div>
                          <Badge variant="secondary" className="w-full justify-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {remainingMinutes > 0 
                              ? `${remainingMinutes} dakika kaldı` 
                              : 'Randevu süresi doldu'}
                          </Badge>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  <div className="flex flex-wrap gap-1.5 justify-center mb-3 mt-3">
                    {trainer.categories?.map((category) => (
                      <Badge key={category} variant="outline" className="text-xs px-2 py-0.5">
                        {category}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="w-4 h-4 mr-1.5" />
                    {trainer.working_hours?.start || "09:00"} - {trainer.working_hours?.end || "17:00"}
                  </div>
                </div>
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg">Müsait Eğitmenler</h3>
          <Badge variant="secondary">{availableTrainers.length}</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableTrainers.map((trainer) => (
            <Card
              key={trainer.id}
              className="p-4 cursor-pointer hover:shadow-md hover:-translate-y-1 hover:shadow-black/50 transition-all bg-white relative group"
              onClick={() => setSelectedTrainer(trainer)}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-3 text-xl font-semibold text-primary">
                  {trainer.first_name && trainer.last_name ? (
                    <span>
                      {trainer.first_name.charAt(0).toUpperCase()}
                      {trainer.last_name.charAt(0).toUpperCase()}
                    </span>
                  ) : (
                    <Award className="w-10 h-10 text-primary" />
                  )}
                </div>

                <h3 className="font-semibold text-lg mb-2">
                  {trainer.first_name} {trainer.last_name}
                </h3>

                <div className="flex flex-wrap gap-1.5 justify-center mb-3">
                  {trainer.categories?.map((category) => (
                    <Badge key={category} variant="outline" className="text-xs px-2 py-0.5">
                      {category}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="w-4 h-4 mr-1.5" />
                  {trainer.working_hours?.start || "09:00"} - {trainer.working_hours?.end || "17:00"}
                </div>
              </div>
              <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
            </Card>
          ))}
        </div>
      </div>

      {selectedTrainer && (
        <Dialog open={!!selectedTrainer} onOpenChange={() => setSelectedTrainer(null)}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader className="border-b pb-3">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-lg font-semibold text-primary">
                  {selectedTrainer.first_name && selectedTrainer.last_name ? (
                    <span>
                      {selectedTrainer.first_name.charAt(0).toUpperCase()}
                      {selectedTrainer.last_name.charAt(0).toUpperCase()}
                    </span>
                  ) : (
                    <Award className="w-8 h-8 text-primary" />
                  )}
                </div>

                <div className="flex-1">
                  <DialogTitle className="text-lg mb-1">
                    {selectedTrainer.first_name} {selectedTrainer.last_name}
                  </DialogTitle>
                  <div className="flex flex-wrap gap-1">
                    {selectedTrainer.categories?.map((category) => (
                      <Badge key={category} variant="outline" className="text-xs px-1.5 py-0">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </DialogHeader>

            <div className="py-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-2 bg-secondary/20 p-2 rounded-lg">
                  <h4 className="font-medium text-xs uppercase tracking-wider text-secondary-foreground/70 flex items-center gap-1">
                    <User2 className="w-3 h-3" />
                    İletişim
                  </h4>
                  <div className="space-y-1">
                    <div className="flex items-center text-xs">
                      <Mail className="w-3 h-3 mr-1.5 text-blue-500" />
                      <span className="truncate">{selectedTrainer.email}</span>
                    </div>
                    <div className="flex items-center text-xs">
                      <Phone className="w-3 h-3 mr-1.5 text-green-500" />
                      <span>{selectedTrainer.phone}</span>
                    </div>
                    {selectedTrainer.address && (
                      <div className="flex items-center text-xs">
                        <MapPin className="w-3 h-3 mr-1.5 text-orange-500" />
                        <span className="truncate">{selectedTrainer.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2 bg-primary/10 p-2 rounded-lg">
                  <h4 className="font-medium text-xs uppercase tracking-wider text-primary/70 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Çalışma
                  </h4>
                  <div className="space-y-1">
                    <div className="flex items-center text-xs">
                      <Clock className="w-3 h-3 mr-1.5 text-purple-500" />
                      <span>{selectedTrainer.working_hours?.start || "09:00"} - {selectedTrainer.working_hours?.end || "17:00"}</span>
                    </div>
                    <div className="flex items-center text-xs">
                      <CalendarDays className="w-3 h-3 mr-1.5 text-indigo-500" />
                      <span>{new Date(selectedTrainer.start_date).toLocaleDateString('tr-TR')}</span>
                    </div>
                  </div>
                </div>

                {selectedTrainer.bio && (
                  <div className="col-span-2 space-y-1 bg-muted/50 p-2 rounded-lg">
                    <h4 className="font-medium text-xs uppercase tracking-wider text-muted-foreground/70 flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      Biyografi
                    </h4>
                    <p className="text-xs leading-relaxed">{selectedTrainer.bio}</p>
                  </div>
                )}

                <div className="col-span-2 flex justify-between items-center bg-accent/20 p-2 rounded-lg">
                  <div className="space-y-1">
                    <h4 className="font-medium text-xs uppercase tracking-wider text-accent-foreground/70 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Aktif Randevular
                    </h4>
                    <p className="text-lg font-semibold text-accent-foreground">
                      {getTrainerAppointments(selectedTrainer.id).length}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingTrainer(selectedTrainer);
                        setSelectedTrainer(null);
                      }}
                      className="h-8"
                    >
                      <Pencil className="w-3 h-3 mr-1" />
                      Düzenle
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(selectedTrainer.id)}
                      className="h-8"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Sil
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {editingTrainer && (
        <Dialog open={!!editingTrainer} onOpenChange={() => setEditingTrainer(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Eğitmen Düzenle</DialogTitle>
            </DialogHeader>
            <TrainerForm
              trainer={editingTrainer}
              onSubmit={handleEdit}
              onCancel={() => setEditingTrainer(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default TrainersPage;
