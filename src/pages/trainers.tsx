import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, Clock, Mail, MapPin, Phone, Plus } from "lucide-react";
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
  createTrainer,
  updateTrainer,
  deleteTrainer,
} from "@/lib/queries";
import { useToast } from "@/components/ui/use-toast";
import { Trainer, Appointment, TrainerInput } from "@/types";
import { TrainerForm } from "@/components/forms/TrainerForm";

const TrainersPage = () => {
  const { toast } = useToast();
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
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
      const [trainersData, appointmentsData] = await Promise.all([
        getTrainers(),
        getAppointments(),
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
    } catch (error) {
      toast({
        title: "Hata",
        description: "Eğitmenler yüklenirken bir hata oluştu.",
        variant: "destructive",
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

  const filteredTrainers = trainers.filter((trainer) => {
    const searchString = searchQuery.toLowerCase();
    return (
      trainer.first_name.toLowerCase().includes(searchString) ||
      trainer.last_name.toLowerCase().includes(searchString) ||
      trainer.email.toLowerCase().includes(searchString) ||
      trainer.phone.toLowerCase().includes(searchString)
    );
  });

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
          placeholder="Eğitmen ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTrainers.map((trainer) => (
          <Card
            key={trainer.id}
            className="p-4 cursor-pointer hover:shadow-md hover:-translate-y-1 hover:shadow-black/50 transition-all bg-white"
            onClick={() => setSelectedTrainer(trainer)}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
                {trainer.avatar_url ? (
                  <img
                    src={trainer.avatar_url}
                    alt={`${trainer.first_name} ${trainer.last_name}`}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <Award className="w-12 h-12 text-muted-foreground" />
                )}
              </div>

              <h3 className="font-semibold text-lg">
                {trainer.first_name} {trainer.last_name}
              </h3>

              <Badge variant="default" className="mt-2">
                {trainer.specialization || "Genel Eğitmen"}
              </Badge>

              <div className="flex items-center text-sm text-muted-foreground mt-2">
                <Mail className="w-4 h-4 mr-1" />
                {trainer.email}
              </div>

              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <Phone className="w-4 h-4 mr-1" />
                {trainer.phone}
              </div>

              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <Clock className="w-4 h-4 mr-1" />
                {trainer.working_hours?.start || "09:00"} - {trainer.working_hours?.end || "17:00"}
              </div>

              {trainer.address && (
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <MapPin className="w-4 h-4 mr-1" />
                  {trainer.address}
                </div>
              )}

              <div className="w-full mt-3">
                <p className="text-xs text-muted-foreground mb-1">Aktif Randevular</p>
                <p className="text-lg font-semibold">
                  {getTrainerAppointments(trainer.id).length}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {selectedTrainer && (
        <Dialog open={!!selectedTrainer} onOpenChange={() => setSelectedTrainer(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
                  {selectedTrainer.avatar_url ? (
                    <img
                      src={selectedTrainer.avatar_url}
                      alt={`${selectedTrainer.first_name} ${selectedTrainer.last_name}`}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <Award className="w-12 h-12 text-muted-foreground" />
                  )}
                </div>

                <DialogTitle>
                  {selectedTrainer.first_name} {selectedTrainer.last_name}
                </DialogTitle>
                <Badge variant="default" className="mt-1">
                  {selectedTrainer.specialization || "Genel Eğitmen"}
                </Badge>
              </div>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-2" />
                  <span>{selectedTrainer.email}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-2" />
                  <span>{selectedTrainer.phone}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>
                    {selectedTrainer.working_hours?.start || "09:00"} -{" "}
                    {selectedTrainer.working_hours?.end || "17:00"}
                  </span>
                </div>
                {selectedTrainer.address && (
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>{selectedTrainer.address}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingTrainer(selectedTrainer);
                    setSelectedTrainer(null);
                  }}
                >
                  Düzenle
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(selectedTrainer.id)}
                >
                  Sil
                </Button>
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
