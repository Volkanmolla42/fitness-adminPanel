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
import { Search, Plus, Pencil, Trash2, Timer, User2, Calendar } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  getServices,
  createService,
  updateService,
  deleteService,
} from "@/lib/queries";
import type { Database } from "@/types/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Service = Database["public"]["Tables"]["services"]["Row"];

const ServicesPage = () => {
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [membershipFilter, setMembershipFilter] = useState<"all" | "vip" | "standard">("all");
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

  const filteredServices = services
    .filter((service) => {
      const searchTermLower = searchTerm.toLowerCase();
      return (
        service.name.toLowerCase().includes(searchTermLower) ||
        (service.isVipOnly && "vip".includes(searchTermLower)) ||
        (!service.isVipOnly && "standart".includes(searchTermLower)) ||
        (service.isVipOnly ? "vip üye" : "standart üye").includes(searchTermLower)
      ) && (
        membershipFilter === "all" ? true :
        membershipFilter === "vip" ? service.isVipOnly :
        membershipFilter === "standard" ? !service.isVipOnly :
        true
      );
    })
    .sort((a, b) => {
      // VIP hizmetleri başa al
      if (a.isVipOnly && !b.isVipOnly) return -1;
      if (!a.isVipOnly && b.isVipOnly) return 1;
      // VIP durumu aynıysa isme göre sırala
      return a.name.localeCompare(b.name, 'tr');
    });

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
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">Hizmetler</h2>
        <p className="text-muted-foreground">
          Hizmetleri görüntüle, düzenle ve yönet
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Hizmet adı veya üyelik tipi ile ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select
          value={membershipFilter}
          onValueChange={(value: "all" | "vip" | "standard") => setMembershipFilter(value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Üyelik tipine göre filtrele" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="vip">Sadece VIP</SelectItem>
            <SelectItem value="standard">Sadece Standart</SelectItem>
          </SelectContent>
        </Select>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service) => (
          <Card 
            key={service.id} 
            className={`relative overflow-hidden group hover:shadow-lg transition-all duration-200 ${
              service.isVipOnly ? 'border-2 border-destructive/50' : ''
            }`}
          >
            <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2 z-10">
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8"
                onClick={() => setEditingService(service)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="secondary" size="icon" className="h-8 w-8">
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

            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-xl font-semibold flex-1">{service.name}</h3>
                <Badge variant={service.isVipOnly ? "destructive" : "secondary"} className="uppercase text-xs font-bold">
                  {service.isVipOnly ? "VIP" : "Standart"}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground mb-6 line-clamp-2">
                {service.description}
              </p>

              <div className="flex flex-col gap-3">
                <div className={`flex items-center justify-between py-2 px-3 rounded-lg ${
                  service.isVipOnly ? 'bg-destructive/10' : 'bg-secondary/70'
                }`}>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="font-medium">{service.session_count} Seans</span>
                  </div>
                  <div className="text-lg font-bold">₺{service.price}</div>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Timer className="h-4 w-4" />
                    {service.duration} dk
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User2 className="h-4 w-4" />
                    {service.max_participants} kişi
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={!!editingService} onOpenChange={(open) => !open && setEditingService(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Hizmeti Düzenle</DialogTitle>
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
