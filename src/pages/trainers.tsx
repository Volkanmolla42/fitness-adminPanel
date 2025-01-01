import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { TrainerForm } from "@/components/forms/TrainerForm";
import { Search, Plus, Pencil, Trash2, Phone, Mail, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  getTrainers,
  createTrainer,
  updateTrainer,
  deleteTrainer,
} from "@/lib/queries";
import type { Database } from "@/types/supabase";
import { useToast } from "@/components/ui/use-toast";

type Trainer = Database["public"]["Tables"]["trainers"]["Row"];

const TrainersPage = () => {
  const { toast } = useToast();
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTrainers();
    setupRealtimeSubscription();
    return () => {
      supabase.channel("trainers").unsubscribe();
    };
  }, []);

  const fetchTrainers = async () => {
    try {
      const data = await getTrainers();
      setTrainers(data);
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
    supabase
      .channel("trainers")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trainers" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setTrainers((prev) => [payload.new as Trainer, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setTrainers((prev) =>
              prev.map((trainer) =>
                trainer.id === payload.new.id
                  ? (payload.new as Trainer)
                  : trainer
              )
            );
          } else if (payload.eventType === "DELETE") {
            setTrainers((prev) =>
              prev.filter((trainer) => trainer.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();
  };

  const filteredTrainers = trainers.filter((trainer) =>
    `${trainer.first_name} ${trainer.last_name} ${trainer.categories.join(" ")}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const handleAdd = async (data: Omit<Trainer, "id" | "created_at">) => {
    try {
      await createTrainer(data);
      setIsDialogOpen(false);
      toast({
        title: "Başarılı",
        description: "Yeni eğitmen başarıyla eklendi.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Eğitmen eklenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async (data: Omit<Trainer, "id" | "created_at">) => {
    if (!editingTrainer) return;

    try {
      await updateTrainer(editingTrainer.id, data);
      setEditingTrainer(null);
      toast({
        title: "Başarılı",
        description: "Eğitmen bilgileri güncellendi.",
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Eğitmenler</h1>
        <p className="text-muted-foreground mt-2">
          Spor salonu eğitmenlerini yönet
        </p>
      </div>

      <Card className="px-2 py-6 md:p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Eğitmen ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Eğitmen Ekle
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yeni Eğitmen</DialogTitle>
              </DialogHeader>
              <TrainerForm
                onSubmit={handleAdd}
                onCancel={() => setIsDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTrainers.map((trainer) => (
            <Card key={trainer.id} className="px-4 py-6 md:p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarFallback>{trainer.first_name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">
                      {trainer.first_name} {trainer.last_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {trainer.categories.join(", ")}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Eğitmen Düzenle</DialogTitle>
                      </DialogHeader>
                      <TrainerForm
                        trainer={trainer}
                        onSubmit={(updatedTrainer) =>
                          handleEdit(updatedTrainer)
                        }
                        onCancel={() => setIsDialogOpen(false)}
                      />
                    </DialogContent>
                  </Dialog>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Eğitmeni Sil</AlertDialogTitle>
                        <AlertDialogDescription>
                          Bu eğitmeni silmek istediğinize emin misiniz? Bu işlem
                          geri alınamaz.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(trainer.id)}
                        >
                          Sil
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center text-sm">
                  <Mail className="mr-2 h-4 w-4" />
                  {trainer.email}
                </div>
                <div className="flex items-center text-sm">
                  <Phone className="mr-2 h-4 w-4" />
                  {trainer.phone}
                </div>
                <div className="flex items-center text-sm">
                  <Clock className="mr-2 h-4 w-4" />
                  {JSON.stringify(
                    trainer.working_hours.start
                      .toLocaleString()
                      .replace(",", " - ")
                  )}
                  ~{" "}
                  {JSON.stringify(
                    trainer.working_hours.end
                      .toLocaleString()
                      .replace(",", " - ")
                  )}
                </div>
                {trainer.bio && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {trainer.bio}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default TrainersPage;
