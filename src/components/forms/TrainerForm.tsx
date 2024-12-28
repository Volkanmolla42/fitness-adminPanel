import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { trainerSchema } from "@/lib/validations";
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
import { Badge } from "@/components/ui/badge";
import { DialogFooter } from "@/components/ui/dialog";

const specializations = [
  "Fitness",
  "Yoga",
  "Pilates",
  "Cardio",
  "Crossfit",
  "Kickbox",
  "Yüzme",
  "Beslenme",
];

interface TrainerFormProps {
  trainer?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    specialization: string[];
    bio: string;
    startDate: string;
    workingHours: {
      start: string;
      end: string;
    };
  };
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export function TrainerForm({ trainer, onSubmit, onCancel }: TrainerFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(trainerSchema),
    defaultValues: {
      name: trainer?.name || "",
      email: trainer?.email || "",
      phone: trainer?.phone || "",
      specialization: trainer?.specialization || [],
      bio: trainer?.bio || "",
      startDate: trainer?.startDate || new Date().toISOString().split("T")[0],
      workingHours: {
        start: trainer?.workingHours?.start || "09:00",
        end: trainer?.workingHours?.end || "17:00",
      },
    },
  });

  const selectedSpecializations = watch("specialization");

  const handleFormSubmit = handleSubmit((data) => {
    onSubmit(data);
  });

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Ad Soyad</label>
        <Input {...register("name")} />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">E-posta</label>
          <Input type="email" {...register("email")} />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Telefon</label>
          <Input {...register("phone")} placeholder="555 123 45 67" />
          {errors.phone && (
            <p className="text-sm text-destructive">{errors.phone.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Uzmanlık Alanları</label>
        <Select
          value=""
          onValueChange={(value) => {
            if (!selectedSpecializations.includes(value)) {
              setValue(
                "specialization",
                [...selectedSpecializations, value],
                { shouldValidate: true }
              );
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Uzmanlık alanı seçin" />
          </SelectTrigger>
          <SelectContent>
            {specializations.map((spec) => (
              <SelectItem key={spec} value={spec}>
                {spec}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex flex-wrap gap-2 mt-2">
          {selectedSpecializations.map((spec) => (
            <Badge
              key={spec}
              variant="secondary"
              className="cursor-pointer"
              onClick={() => {
                setValue(
                  "specialization",
                  selectedSpecializations.filter((s) => s !== spec),
                  { shouldValidate: true }
                );
              }}
            >
              {spec} ×
            </Badge>
          ))}
        </div>
        {errors.specialization && (
          <p className="text-sm text-destructive">
            {errors.specialization.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Biyografi</label>
        <Textarea {...register("bio")} />
        {errors.bio && (
          <p className="text-sm text-destructive">{errors.bio.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Başlangıç Tarihi</label>
        <Input type="date" {...register("startDate")} />
        {errors.startDate && (
          <p className="text-sm text-destructive">{errors.startDate.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Çalışma Saati Başlangıç</label>
          <Input type="time" {...register("workingHours.start")} />
          {errors.workingHours?.start && (
            <p className="text-sm text-destructive">
              {errors.workingHours.start.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Çalışma Saati Bitiş</label>
          <Input type="time" {...register("workingHours.end")} />
          {errors.workingHours?.end && (
            <p className="text-sm text-destructive">
              {errors.workingHours.end.message}
            </p>
          )}
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          İptal
        </Button>
        <Button type="submit">{trainer ? "Güncelle" : "Ekle"}</Button>
      </DialogFooter>
    </form>
  );
}
