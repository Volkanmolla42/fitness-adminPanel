import React, { useState, useEffect } from "react";
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
import { supabase } from "@/lib/supabase";
import {
  getServices,
  createService,
  updateService,
  deleteService,
} from "@/lib/queries";
import type { Database } from "@/types/supabase";
import { useToast } from "@/components/ui/use-toast";

type Service = Database["public"]["Tables"]["services"]["Row"];

const ServicesPage = () => {
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchServices();
    setupRealtimeSubscription();
    return () => {
      supabase.channel("services").unsubscribe();
    };
  }, []);

  const fetchServices = async () => {
    try {
      const data = await getServices();
      setServices(data);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Hizmetler yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    supabase
      .channel("services")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "services" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setServices((prev) => [payload.new as Service, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setServices((prev) =>
              prev.map((service) =>
                service.id === payload.new.id
                  ? (payload.new as Service)
                  : service,
              ),
            );
          } else if (payload.eventType === "DELETE") {
            setServices((prev) =>
              prev.filter((service) => service.id !== payload.old.id),
            );
          }
        },
      )
      .subscribe();
  };

  const filteredServices = services.filter(
    (service) =>
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.category.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleAdd = async (data: Omit<Service, "id" | "created_at">) => {
    try {
      await createService(data);
      setShowAddDialog(false);
      toast({
        title: "Başarılı",
        description: "Yeni hizmet başarıyla eklendi.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Hizmet eklenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async (data: Omit<Service, "id" | "created_at">) => {
    if (!editingService) return;

    try {
      await updateService(editingService.id, data);
      setEditingService(null);
      toast({
        title: "Başarılı",
        description: "Hizmet başarıyla güncellendi.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Hizmet güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteService(id);
      toast({
        title: "Başarılı",
        description: "Hizmet başarıyla silindi.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Hizmet silinirken bir hata oluştu.",
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
        <h1 className="text-3xl font-bold">Hizmetler</h1>
        <p className="text-muted-foreground mt-2">
          Spor salonu hizmetlerini yönet
        </p>
      </div>
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
            <ServiceForm
              onSubmit={handleAdd}
              onCancel={() => setShowAddDialog(false)}
            />
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
                        Bu hizmeti silmek istediğinizden emin misiniz? Bu işlem
                        geri alınamaz.
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

            <p className="text-sm text-muted-foreground">
              {service.description}
            </p>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-4">
                <div className="flex items-center text-muted-foreground">
                  <Timer className="mr-2 h-4 w-4" />
                  {service.duration} dk
                </div>
                <div className="flex items-center text-muted-foreground">
                  <User2 className="mr-2 h-4 w-4" />
                  {service.max_participants} kişi
                </div>
              </div>
              <div className="text-lg font-semibold">₺{service.price}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Edit Service Dialog */}
      <Dialog
        open={!!editingService}
        onOpenChange={(open) => !open && setEditingService(null)}
      >
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
