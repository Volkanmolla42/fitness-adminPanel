import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { defaultTrainers } from "./trainers";
import { Search, Plus, Pencil, Trash2 } from "lucide-react";

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  trainer: string;
  duration: number; // minutes
}

export const defaultServices: Service[] = [
  {
    id: "1",
    name: "Kişisel Antrenman",
    description: "Birebir özel antrenman seansı",
    price: 400,
    trainer: "Mehmet Öztürk",
    duration: 60,
  },
  {
    id: "2",
    name: "Yoga Dersi",
    description: "Grup yoga dersi",
    price: 200,
    trainer: "Zeynep Yıldız",
    duration: 45,
  },
  {
    id: "3",
    name: "Fitness Değerlendirmesi",
    description: "Detaylı fitness ve sağlık değerlendirmesi",
    price: 300,
    trainer: "Ali Can",
    duration: 90,
  },
];

const ServiceForm = ({
  service,
  onSubmit,
  onCancel,
}: {
  service?: Service;
  onSubmit: (service: Omit<Service, "id">) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState<Omit<Service, "id">>({
    name: service?.name || "",
    description: service?.description || "",
    price: service?.price || 0,
    trainer: service?.trainer || "",
    duration: service?.duration || 30,
  });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Hizmet Adı</label>
        <Input
          value={formData.name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
          }
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Açıklama</label>
        <Input
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Fiyat (₺)</label>
          <Input
            type="number"
            value={formData.price}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                price: Number(e.target.value),
              }))
            }
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Süre (Dakika)</label>
          <Input
            type="number"
            value={formData.duration}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                duration: Number(e.target.value),
              }))
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Eğitmen</label>
        <Select
          value={formData.trainer}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, trainer: value }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Eğitmen seçin" />
          </SelectTrigger>
          <SelectContent>
            {defaultTrainers.map((trainer) => (
              <SelectItem key={trainer.id} value={trainer.name}>
                {trainer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          İptal
        </Button>
        <Button onClick={() => onSubmit(formData)}>
          {service ? "Güncelle" : "Ekle"}
        </Button>
      </DialogFooter>
    </div>
  );
};

const ServicesPage = () => {
  const [services, setServices] = useState<Service[]>(defaultServices);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingService, setEditingService] = useState<Service | null>(null);

  const filteredServices = services.filter(
    (service) =>
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.trainer.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleAdd = (newService: Omit<Service, "id">) => {
    setServices((prev) => [
      ...prev,
      { ...newService, id: Math.random().toString() },
    ]);
  };

  const handleEdit = (updatedService: Omit<Service, "id">) => {
    setServices((prev) =>
      prev.map((service) =>
        service.id === editingService?.id
          ? { ...updatedService, id: service.id }
          : service,
      ),
    );
    setEditingService(null);
  };

  const handleDelete = (id: string) => {
    setServices((prev) => prev.filter((service) => service.id !== id));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Hizmetler</h1>
        <p className="text-muted-foreground mt-2">
          Spor salonu hizmetlerini yönet
        </p>
      </div>

      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Hizmet adı veya eğitmen ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> Yeni Hizmet
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yeni Hizmet Ekle</DialogTitle>
              </DialogHeader>
              <ServiceForm
                onSubmit={handleAdd}
                onCancel={() => setEditingService(null)}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="flex flex-col p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-all"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{service.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {service.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingService(service)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Hizmet Düzenle</DialogTitle>
                      </DialogHeader>
                      <ServiceForm
                        service={service}
                        onSubmit={handleEdit}
                        onCancel={() => setEditingService(null)}
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
                          Hizmeti silmek istediğinize emin misiniz?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Bu işlem geri alınamaz. Hizmet kalıcı olarak
                          silinecektir.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(service.id)}
                        >
                          Sil
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              <div className="mt-auto flex items-center justify-between text-sm">
                <div className="space-y-1">
                  <p className="text-muted-foreground">{service.trainer}</p>
                  <p className="font-medium">{service.duration} dakika</p>
                </div>
                <p className="text-lg font-semibold">₺{service.price}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default ServicesPage;
