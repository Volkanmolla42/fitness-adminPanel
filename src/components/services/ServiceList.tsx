import React from "react";
import type { Database } from "@/types/supabase";
import { ServiceCard } from "./ServiceCard";

type Service = Database["public"]["Tables"]["services"]["Row"];

interface ServiceListProps {
  services: Service[];
  onEdit: (service: Service) => void;
  onDelete: (id: string) => void;
}

export const ServiceList: React.FC<ServiceListProps> = ({
  services,
  onEdit,
  onDelete,
}) => {
  if (services.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Hiç paket bulunamadı.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {services.map((service) => (
        <ServiceCard
          key={service.id}
          service={service}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};
