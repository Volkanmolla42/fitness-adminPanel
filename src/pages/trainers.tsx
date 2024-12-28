import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
import { Search, Plus, Pencil, Trash2, Phone, Mail } from "lucide-react";

export interface Trainer {
  id: string;
  name: string;
  specialization: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  experience: number; // years
}

export const defaultTrainers: Trainer[] = [
  {
    id: "1",
    name: "Mehmet Öztürk",
    specialization: "Kişisel Antrenman, Fitness",
    email: "mehmet@fitadmin.com",
    phone: "(555) 123-4567",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=mehmet",
    experience: 5,
  },
  {
    id: "2",
    name: "Zeynep Yıldız",
    specialization: "Yoga, Pilates",
    email: "zeynep@fitadmin.com",
    phone: "(555) 234-5678",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=zeynep",
    experience: 3,
  },
  {
    id: "3",
    name: "Ali Can",
    specialization: "Fitness, Beslenme",
    email: "ali@fitadmin.com",
    phone: "(555) 345-6789",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=ali",
    experience: 4,
  },
];

const TrainerForm = ({
  trainer,
  onSubmit,
  onCancel,
}: {
  trainer?: Trainer;
  onSubmit: (trainer: Omit<Trainer, "id">) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState<Omit<Trainer, "id">>(
    trainer
      ? { ...trainer }
      : {
          name: "",
          specialization: "",
          email: "",
          phone: "",
          experience: 0,
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`,
        },
  );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Ad Soyad</label>
        <Input
          value={formData.name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
          }
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Uzmanlık Alanları</label>
        <Input
          value={formData.specialization}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, specialization: e.target.value }))
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">E-posta</label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, email: e.target.value }))
            }
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Telefon</label>
          <Input
            value={formData.phone}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, phone: e.target.value }))
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Deneyim (Yıl)</label>
        <Input
          type="number"
          value={formData.experience}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              experience: Number(e.target.value),
            }))
          }
        />
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          İptal
        </Button>
        <Button onClick={() => onSubmit(formData)}>
          {trainer ? "Güncelle" : "Ekle"}
        </Button>
      </DialogFooter>
    </div>
  );
};

const TrainersPage = () => {
  const [trainers, setTrainers] = useState<Trainer[]>(defaultTrainers);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null);

  const filteredTrainers = trainers.filter(
    (trainer) =>
      trainer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trainer.specialization.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleAdd = (newTrainer: Omit<Trainer, "id">) => {
    setTrainers((prev) => [
      ...prev,
      { ...newTrainer, id: Math.random().toString() },
    ]);
  };

  const handleEdit = (updatedTrainer: Omit<Trainer, "id">) => {
    setTrainers((prev) =>
      prev.map((trainer) =>
        trainer.id === editingTrainer?.id
          ? { ...updatedTrainer, id: trainer.id }
          : trainer,
      ),
    );
    setEditingTrainer(null);
  };

  const handleDelete = (id: string) => {
    setTrainers((prev) => prev.filter((trainer) => trainer.id !== id));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Eğitmenler</h1>
        <p className="text-muted-foreground mt-2">
          Spor salonu eğitmenlerini yönet
        </p>
      </div>

      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="İsim veya uzmanlık alanı ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> Yeni Eğitmen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yeni Eğitmen Ekle</DialogTitle>
              </DialogHeader>
              <TrainerForm
                onSubmit={handleAdd}
                onCancel={() => setEditingTrainer(null)}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTrainers.map((trainer) => (
            <div
              key={trainer.id}
              className="flex flex-col p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-all"
            >
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={trainer.avatarUrl} />
                  <AvatarFallback>{trainer.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{trainer.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {trainer.specialization}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingTrainer(trainer)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Eğitmen Düzenle</DialogTitle>
                          </DialogHeader>
                          <TrainerForm
                            trainer={trainer}
                            onSubmit={handleEdit}
                            onCancel={() => setEditingTrainer(null)}
                          />
                        </DialogContent>
                      </Dialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Eğitmeni silmek istediğinize emin misiniz?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Bu işlem geri alınamaz. Eğitmen kalıcı olarak
                              silinecektir.
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
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{trainer.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{trainer.phone}</span>
                </div>
                <p className="font-medium">{trainer.experience} yıl deneyim</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default TrainersPage;
