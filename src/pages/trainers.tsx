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
import { toast } from "sonner";
import { Trainer, Appointment, TrainerInput } from "@/types";
import { TrainerForm } from "@/components/forms/TrainerForm";
import { Database } from "@/types/supabase";
import { TrainerList } from "@/components/trainers/TrainerList";
import { TrainerDialog } from "@/components/trainers/TrainerDialog";
import { LoadingSpinner } from "@/App";

type Service = Database["public"]["Tables"]["services"]["Row"];

const TrainersPage = () => {
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
            ? (appointment.status as Appointment["status"])
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
      toast.error("Failed to fetch data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    supabase
      .channel("trainers")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trainers" },
        fetchData
      )
      .subscribe();

    supabase
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
      toast.success("Antrenör başarıyla eklendi.");
    } catch (error) {
      console.error("Antrenör eklenirken hata:", error);
      toast.error("Antrenör eklenirken bir hata oluştu.");
    }
  };

  const handleEdit = async (data: TrainerInput) => {
    if (!editingTrainer) return;

    try {
      await updateTrainer(editingTrainer.id, data);
      setEditingTrainer(null);
      toast.success("Antrenör başarıyla güncellendi.");
    } catch (error) {
      console.error("Antrenör güncellenirken hata:", error);
      toast.error("Antrenör güncellenirken bir hata oluştu.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTrainer(id);
      setSelectedTrainer(null);
      toast.success("Antrenör başarıyla silindi.");
    } catch (error) {
      console.error("Antrenör silinirken hata:", error);
      toast.error("Antrenör silinirken bir hata oluştu.");
    }
  };

  const getTrainerAppointments = (trainerId: string) => {
    return appointments.filter(
      (appointment) => appointment.trainer_id === trainerId
    );
  };
  const getRemainingMinutes = (
    startTime: string,
    durationMinutes: number = 60
  ) => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTotalMinutes = currentHour * 60 + currentMinute;

    const [startHour, startMinute] = startTime.split(":").map(Number);
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
    const trainer = trainers.find((t) => t.id === trainerId);
    if (!trainer) return false;

    // Check both hasOngoingAppointment status and active appointments
    return (
      trainer.hasOngoingAppointment ||
      appointments.some(
        (appointment) =>
          appointment.trainer_id === trainerId &&
          appointment.status === "in-progress"
      )
    );
  };

  const getCurrentAppointment = (trainerId: string) => {
    const now = new Date();
    const currentDate = now.toISOString().split("T")[0];
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

  const busyTrainers = filteredTrainers.filter((trainer) =>
    isTrainerBusy(trainer.id)
  );
  const availableTrainers = filteredTrainers.filter(
    (trainer) => !isTrainerBusy(trainer.id)
  );

  if (isLoading) {
    return <LoadingSpinner text="Antrenörler yükleniyor..." />;
  }

  return (
    <div className="space-y-4 mt-4 container p-0">
      <div className="flex flex-col md:flex-row gap-4 md:justify-between md:items-center">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Antrenörler</h2>
          <p className="text-muted-foreground">
            Antrenörleri görüntüle, düzenle ve yönet
          </p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Antrenör Ekle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Antrenör</DialogTitle>
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
          placeholder="Antrenör ara... "
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {busyTrainers.length > 0 && (
        <TrainerList
          title="Randevuda Olan Antrenörler"
          trainers={busyTrainers}
          isBusy={true}
          services={services}
          getCurrentAppointment={getCurrentAppointment}
          getRemainingMinutes={getRemainingMinutes}
          onTrainerSelect={setSelectedTrainer}
        />
      )}

      <TrainerList
        title="Müsait Antrenörler"
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
        <Dialog
          open={!!editingTrainer}
          onOpenChange={() => setEditingTrainer(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Antrenör Düzenle</DialogTitle>
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
