import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { ServiceForm } from "@/components/forms/ServiceForm";
import { Search, Plus, Pencil, Trash2, Timer, User2 } from "lucide-react";

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  maxParticipants: number;
  category: string;
}

export const defaultServices: Service[] = [
  {
    id: "1",
    name: "Kişisel Antrenman",
    description: "Birebir özel antrenman seansı",
    price: 400,
    duration: 60,
    maxParticipants: 1,
    category: "Fitness",
  },
  {
    id: "2",
    name: "Yoga Dersi",
    description: "Grup yoga dersi",
    price: 200,
    duration: 45,
    maxParticipants: 10,
    category: "Yoga",
  },
  {
    id: "3",
    name: "Fitness Değerlendirmesi",
    description: "Detaylı fitness ve sağlık değerlendirmesi",
    price: 300,
    duration: 90,
    maxParticipants: 1,
    category: "Fitness",
  },
];

const ServicesPage = () => {
  const [services, setServices] = useState<Service[]>(defaultServices);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const filteredServices = services.filter(
    (service) =>
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.category.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleAdd = (newService: Omit<Service, "id">) => {
    setServices((prev) => [
      ...prev,
      { ...newService, id: Math.random().toString() },
    ]);
    setShowAddDialog(false);
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
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Hizmet adı veya kategori ile ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Hizmet
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Yeni Hizmet Ekle</DialogTitle>
            </DialogHeader>
            <ServiceForm onSubmit={handleAdd} onCancel={() => setShowAddDialog(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.map((service) => (
          <Card key={service.id} className="p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">{service.name}</h3>
                <Badge variant="secondary" className="mt-1">
                  {service.category}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditingService(service)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Hizmeti Sil</AlertDialogTitle>
                      <AlertDialogDescription>
                        Bu hizmeti silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>İptal</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(service.id)}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Sil
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">{service.description}</p>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-4">
                <div className="flex items-center text-muted-foreground">
                  <Timer className="mr-2 h-4 w-4" />
                  {service.duration} dk
                </div>
                <div className="flex items-center text-muted-foreground">
                  <User2 className="mr-2 h-4 w-4" />
                  {service.maxParticipants} kişi
                </div>
              </div>
              <div className="text-lg font-semibold">₺{service.price}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Edit Service Dialog */}
      <Dialog open={!!editingService} onOpenChange={() => setEditingService(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Hizmet Düzenle</DialogTitle>
          </DialogHeader>
          {editingService && (
            <ServiceForm
              service={editingService}
              onSubmit={handleEdit}
              onCancel={() => setEditingService(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServicesPage;
