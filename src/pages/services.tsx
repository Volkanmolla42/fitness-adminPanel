import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  getServices,
  createService,
  updateService,
  deleteService,
} from "@/lib/queries";
import type { Database } from "@/types/supabase";
import { useToast } from "@/components/ui/use-toast";
import { ServiceHeader } from "@/components/services/ServiceHeader";
import { ServiceSearch } from "@/components/services/ServiceSearch";
import { ServiceList } from "@/components/services/ServiceList";
import { ServiceDialogs } from "@/components/services/ServiceDialogs";

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
        description: "Paketler yüklenirken bir hata oluştu.",
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
      if (a.isVipOnly && !b.isVipOnly) return -1;
      if (!a.isVipOnly && b.isVipOnly) return 1;
      return a.name.localeCompare(b.name, 'tr');
    });

  const handleAdd = async (data: Omit<Service, "id" | "created_at">) => {
    try {
      await createService(data);
      setShowAddDialog(false);
      toast({
        title: "Başarılı",
        description: "Yeni paket başarıyla eklendi.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Paket eklenirken bir hata oluştu.",
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
        description: "Paket başarıyla güncellendi.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Paket güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteService(id);
      toast({
        title: "Başarılı",
        description: "Paket başarıyla silindi.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Paket silinirken bir hata oluştu.",
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
