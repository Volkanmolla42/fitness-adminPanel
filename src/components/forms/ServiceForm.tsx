import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { serviceSchema } from "@/lib/validations";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DialogFooter } from "@/components/ui/dialog";
import type { Database } from "@/types/supabase";

type Service = Database["public"]["Tables"]["services"]["Row"];
type ServiceInput = Omit<Service, "id" | "created_at">;

export const categories = [
  "Fitness",
  "Yoga",
  "Pilates",
  "Cardio",
  "Crossfit",
  "Kickbox",
  "Yüzme",
  "Beslenme Danışmanlığı",
];

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
      category: service?.category || "",
      type: service?.type || "session",
      session_count: service?.session_count || 1,
    },
  });

  const serviceType = form.watch("type");

  const handleSubmit = async (data: ServiceInput) => {
    setIsSubmitting(true);
    try {
      // Eğer aylık üyelikse session_count'u kaldır
      if (data.type === "monthly") {
        delete data.session_count;
      }
      await onSubmit(data);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={form.handleSubmit(handleSubmit)}
      className="space-y-4"
    >
      <div className="space-y-2">
        <label className="text-sm font-medium">Hizmet Adı</label>
        <Input {...form.register("name")} />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Açıklama</label>
        <Textarea {...form.register("description")} />
        {form.formState.errors.description && (
          <p className="text-sm text-destructive">
            {form.formState.errors.description.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
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
          <label className="text-sm font-medium">Süre (Dakika)</label>
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
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Maksimum Katılımcı</label>
          <Input
            type="number"
            {...form.register("max_participants", { valueAsNumber: true })}
          />
          {form.formState.errors.max_participants && (
            <p className="text-sm text-destructive">
              {form.formState.errors.max_participants.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Kategori</label>
          <Select
            value={form.watch("category")}
            onValueChange={(value) =>
              form.setValue("category", value, { shouldValidate: true })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Kategori seçin" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.category && (
            <p className="text-sm text-destructive">
              {form.formState.errors.category.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Hizmet Tipi</label>
        <Select
          value={form.watch("type")}
          onValueChange={(value: "session" | "monthly") =>
            form.setValue("type", value, { shouldValidate: true })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Hizmet tipi seçin" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">Aylık Üyelik</SelectItem>
            <SelectItem value="session">Seans Bazlı</SelectItem>
          </SelectContent>
        </Select>
        {form.formState.errors.type && (
          <p className="text-sm text-destructive">
            {form.formState.errors.type.message}
          </p>
        )}
      </div>

      {serviceType === "session" && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Seans Sayısı</label>
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
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          İptal
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "İşleniyor..." : service ? "Güncelle" : "Ekle"}
        </Button>
      </DialogFooter>
    </form>
  );
}
