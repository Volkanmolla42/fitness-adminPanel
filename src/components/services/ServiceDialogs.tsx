import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { ServiceForm } from "@/components/forms/ServiceForm";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { Database } from "@/types/supabase";

type Service = Database["public"]["Tables"]["services"]["Row"];

interface ServiceDialogsProps {
  showAddDialog: boolean;
  setShowAddDialog: (show: boolean) => void;
  editingService: Service | null;
  setEditingService: (service: Service | null) => void;
  onAdd: (data: Omit<Service, "id" | "created_at">) => Promise<void>;
  onEdit: (data: Omit<Service, "id" | "created_at">) => Promise<void>;
}

export const ServiceDialogs: React.FC<ServiceDialogsProps> = ({
  showAddDialog,
  setShowAddDialog,
  editingService,
  setEditingService,
  onAdd,
  onEdit,
}) => {
  return (
    <>
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Yeni Hizmet Ekle
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Hizmet Ekle</DialogTitle>
          </DialogHeader>
          <ServiceForm onSubmit={onAdd} onCancel={() => setShowAddDialog(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingService} onOpenChange={() => setEditingService(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hizmeti Düzenle</DialogTitle>
          </DialogHeader>
          {editingService && (
            <ServiceForm
              service={editingService}
              onSubmit={onEdit}
              onCancel={() => setEditingService(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
