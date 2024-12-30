import { Trainer } from "@/types/trainer";
import { defaultTrainers } from "@/data/trainers";
import React, { useState } from "react";
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
      ? {
          name: trainer.name,
          email: trainer.email,
          phone: trainer.phone || "",
          categories: trainer.categories || "",
          bio: trainer.bio || "",
          availability: trainer.availability || [],
        }
      : {
          name: "",
          email: "",
          phone: "",
          categories: "",
          bio: "",
          availability: [],
        }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      alert("Lütfen zorunlu alanları doldurun (Ad, E-posta)");
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Ad<span className="text-red-500">*</span>
          </label>
          <Input
            required
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">
          E-posta<span className="text-red-500">*</span>
        </label>
        <Input
          type="email"
          required
          value={formData.email}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, email: e.target.value }))
          }
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Telefon</label>
        <Input
          type="tel"
          value={formData.phone}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, phone: e.target.value }))
          }
          placeholder="555-0000"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Uzmanlık Alanı</label>
        <Input
          value={formData.categories}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, categories: e.target.value }))
          }
          placeholder="Örn: Fitness, Pilates, Yoga"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Hakkında</label>
        <Input
          value={formData.bio}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, bio: e.target.value }))
          }
          placeholder="Eğitmen hakkında kısa bilgi"
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          İptal
        </Button>
        <Button type="submit">{trainer ? "Güncelle" : "Ekle"}</Button>
      </DialogFooter>
    </form>
  );
};

const TrainersPage = () => {
  const [trainers, setTrainers] = useState<Trainer[]>(defaultTrainers);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredTrainers = trainers.filter((trainer) =>
    `${trainer.name} ${trainer.categories || ""}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const handleAdd = (newTrainer: Omit<Trainer, "id">) => {
    const currentDate = new Date().toISOString();
    const trainerWithId = {
      ...newTrainer,
      id: Math.random().toString(),
    };
    setTrainers((prev) => [...prev, trainerWithId]);
    setIsDialogOpen(false);
  };

  const handleEdit = (id: string, updatedTrainer: Omit<Trainer, "id">) => {
    setTrainers((prev) =>
      prev.map((trainer) =>
        trainer.id === id
          ? {
              ...updatedTrainer,
              id: trainer.id,
            }
          : trainer
      )
    );
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setTrainers((prev) => prev.filter((trainer) => trainer.id !== id));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Eğitmenler</h1>
        <p className="text-muted-foreground mt-2">
          Spor salonu eğitmenlerini yönet.
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
                    <AvatarFallback>{trainer.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{trainer.name}</h3>
                    {trainer.categories && (
                      <p className="text-sm text-muted-foreground">
                        {trainer.categories}
                      </p>
                    )}
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
                          handleEdit(trainer.id, updatedTrainer)
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
                {trainer.phone && (
                  <div className="flex items-center text-sm">
                    <Phone className="mr-2 h-4 w-4" />
                    {trainer.phone}
                  </div>
                )}
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
