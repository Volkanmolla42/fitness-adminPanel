import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Database } from "@/types/supabase";
import { TrainerList } from "@/components/trainers/TrainerList";
import { TrainerDialog } from "@/components/trainers/TrainerDialog";

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
    // Find the trainer
    const trainer = trainers.find(t => t.id === trainerId);
    if (!trainer) return false;

    // Check both hasOngoingAppointment status and active appointments
    return trainer.hasOngoingAppointment || appointments.some(
      (appointment) => 
        appointment.trainer_id === trainerId && 
        appointment.status === "in-progress"
    );
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
        <TrainerList
          title="Randevuda Olan Eğitmenler"
          trainers={busyTrainers}
          isBusy={true}
          services={services}
          getCurrentAppointment={getCurrentAppointment}
          getRemainingMinutes={getRemainingMinutes}
          onTrainerSelect={setSelectedTrainer}
        />
      )}

      <TrainerList
        title="Müsait Eğitmenler"
        trainers={availableTrainers}
        onTrainerSelect={setSelectedTrainer}
      />

      <TrainerDialog
        trainer={selectedTrainer}
        onClose={() => setSelectedTrainer(null)}
        onEdit={(trainer) => {
          setEditingTrainer(trainer);
          setSelectedTrainer(null);
        }}
        onDelete={handleDelete}
        getTrainerAppointments={getTrainerAppointments}
      />

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
