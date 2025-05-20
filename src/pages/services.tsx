import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  getServices,
  createService,
  updateService,
  deleteService,
} from "@/lib/queries";
import type { Database } from "@/types/supabase";
import { toast } from "sonner";
import { ServiceHeader } from "@/components/services/ServiceHeader";
import { ServiceSearch } from "@/components/services/ServiceSearch";
import { ServiceList } from "@/components/services/ServiceList";
import { ServiceDialogs } from "@/components/services/ServiceDialogs";
import { LoadingSpinner } from "@/App";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type Service = Database["public"]["Tables"]["services"]["Row"];

const ServicesPage = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [membershipFilter, setMembershipFilter] = useState<
    "all" | "vip" | "standard"
  >("all");
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
      toast.error("Paketler yüklenirken bir hata oluştu.");
      console.error(error);
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
                  : service
              )
            );
          } else if (payload.eventType === "DELETE") {
            setServices((prev) =>
              prev.filter((service) => service.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();
  };

  const filteredServices = services
    .filter((service) => {
      const searchTermLower = searchTerm.toLowerCase();
      return (
        (service.name.toLowerCase().includes(searchTermLower) ||
          (service.isVipOnly && "vip".includes(searchTermLower)) ||
          (!service.isVipOnly && "standart".includes(searchTermLower)) ||
          (service.isVipOnly ? "vip üye" : "standart üye").includes(
            searchTermLower
          )) &&
        (membershipFilter === "all"
          ? true
          : membershipFilter === "vip"
            ? service.isVipOnly
            : membershipFilter === "standard"
              ? !service.isVipOnly
              : true)
      );
    })
    .sort((a, b) => {
      // Sort active services first
      if (a.active && !b.active) return -1;
      if (!a.active && b.active) return 1;
      // Then sort VIP services first within each group
      if (a.isVipOnly && !b.isVipOnly) return -1;
      if (!a.isVipOnly && b.isVipOnly) return 1;
      return a.name.localeCompare(b.name, "tr");
    });

  const handleAdd = async (data: Omit<Service, "id" | "created_at">) => {
    try {
      await createService(data);
      setShowAddDialog(false);
      toast.success("Yeni paket başarıyla eklendi.");
    } catch (error) {
      toast.error("Paket eklenirken bir hata oluştu.");
      console.error(error);
    }
  };

  const handleEdit = async (data: Omit<Service, "id" | "created_at">) => {
    if (!editingService) return;

    try {
      await updateService(editingService.id, data);
      setEditingService(null);
      toast.success("Paket başarıyla güncellendi.");
    } catch (error) {
      toast.error("Paket güncellenirken bir hata oluştu.");
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteService(id);
      toast.success("Paket başarıyla silindi.");
    } catch (error) {
      toast.error("Paket silinirken bir hata oluştu.");
      console.error(error);
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Paketler yükleniyor..." />;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Alert variant="destructive" className="text-red-500">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Dikkat</AlertTitle>
        <AlertDescription>
          <>
            <p>Paket silme işlemi geri alınamaz ve sistemde beklenmedik sorunlara yol açabilir. Silinen pakete bağlı tüm randevular, üyelikler ve kayıtlar da silinecektir.</p>
            <p>Bir paketi silmeden önce: Hiçbir üyeye atanmadığından, Aktif bir randevusunun bulunmadığından emin olun.</p>
            <p><strong>Silmek yerine, paketi pasif duruma getirmeniz önerilir.</strong></p>
          </>

        </AlertDescription>
      </Alert>

      <ServiceHeader />
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <ServiceSearch
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          membershipFilter={membershipFilter}
          onFilterChange={setMembershipFilter}
        />
        <ServiceDialogs
          showAddDialog={showAddDialog}
          setShowAddDialog={setShowAddDialog}
          editingService={editingService}
          setEditingService={setEditingService}
          onAdd={handleAdd}
          onEdit={handleEdit}
        />
      </div>

      <ServiceList
        services={filteredServices}
        onEdit={setEditingService}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default ServicesPage;
