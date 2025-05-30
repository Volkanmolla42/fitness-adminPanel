import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { serviceSchema } from "@/lib/validations";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import type { Database } from "@/types/supabase";

type Service = Database["public"]["Tables"]["services"]["Row"];
type ServiceInput = Omit<Service, "id" | "created_at">;

interface ServiceFormProps {
  service?: Service;
  onSubmit: (data: ServiceInput) => void;
  onCancel: () => void;
}

export function ServiceForm({ service, onSubmit, onCancel }: ServiceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ServiceInput>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: service?.name || "",
      description: service?.description || "",
      price: service?.price || 0,
      duration: service?.duration || 60,
      max_participants: service?.max_participants || 1,
      session_count: service?.session_count || 1,
      isVipOnly: service?.isVipOnly || false,
      active: service?.active ?? true,
    },
  });

  const isVipOnly = form.watch("isVipOnly");
  const isActive = form.watch("active");

  // VIP durumu değiştiğinde maksimum katılımcı sayısını güncelle
  React.useEffect(() => {
    if (isVipOnly) {
      form.setValue("max_participants", 1);
    }
  }, [isVipOnly, form]);

  const handleSubmit = async (data: ServiceInput) => {
    setIsSubmitting(true);
    try {
      // Clean the existing name by removing session count and VIP/Standart suffix
      const cleanName = data.name.replace(/ \(\d+ Ders\)( - (VIP|Standart))?$/, '');
      
      const modifiedData = {
        ...data,
        name: `${cleanName} (${data.session_count} Ders)${data.isVipOnly ? ' - VIP' : ' - Standart'}`
      };
      await onSubmit(modifiedData);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={form.handleSubmit(handleSubmit)}
      className="space-y-3"
    >
      <div className="space-y-2">
        <label className="text-sm font-medium">Paket Adı</label>
        <Input {...form.register("name")} className="max-w-xl" />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Açıklama</label>
        <Textarea {...form.register("description")} className="h-20 max-w-xl" />
        {form.formState.errors.description && (
          <p className="text-sm text-destructive">
            {form.formState.errors.description.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Fiyat (₺)</label>
          <Input
            type="number"
            {...form.register("price", { valueAsNumber: true })}
          />
          {form.formState.errors.price && (
            <p className="text-sm text-destructive">
              {form.formState.errors.price.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Süre (dakika)</label>
          <Input
            type="number"
            {...form.register("duration", { valueAsNumber: true })}
          />
          {form.formState.errors.duration && (
            <p className="text-sm text-destructive">
              {form.formState.errors.duration.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Maksimum Katılımcı</label>
          <Input
            type="number"
            {...form.register("max_participants", { valueAsNumber: true })}
            disabled={isVipOnly}
          />
          {form.formState.errors.max_participants && (
            <p className="text-sm text-destructive">
              {form.formState.errors.max_participants.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Ders Sayısı</label>
          <Input
            type="number"
            {...form.register("session_count", { valueAsNumber: true })}
          />
          {form.formState.errors.session_count && (
            <p className="text-sm text-destructive">
              {form.formState.errors.session_count.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between space-x-2">
          <div className="space-y-0.5">
            <label className="text-sm font-medium">VIP Üyelere Özel</label>
            <p className="text-sm text-muted-foreground">Bu paket sadece VIP üyeler için geçerli olacak</p>
          </div>
          <Switch
            checked={isVipOnly}
            onCheckedChange={(checked) => form.setValue("isVipOnly", checked)}
          />
        </div>

        <div className="flex items-center justify-between space-x-2">
          <div className="space-y-0.5">
            <label className="text-sm font-medium">Aktif Paket</label>
            <p className="text-sm text-muted-foreground">Bu paket sistemde görünür ve satın alınabilir olacak</p>
          </div>
          <Switch
            checked={isActive}
            onCheckedChange={(checked) => form.setValue("active", checked)}
          />
        </div>
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          İptal
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {service ? "Güncelle" : "Oluştur"}
        </Button>
      </DialogFooter>
    </form>
  );
}
