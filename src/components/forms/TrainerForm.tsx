import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { trainerSchema } from "@/lib/validations";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DialogFooter } from "@/components/ui/dialog";
import { categories } from "@/components/forms/ServiceForm";
import type { Database } from "@/types/supabase";

type Trainer = Database["public"]["Tables"]["trainers"]["Row"];
type TrainerInput = Omit<Trainer, "id" | "created_at">;

interface TrainerFormProps {
  trainer?: Trainer;
  onSubmit: (data: TrainerInput) => void;
  onCancel: () => void;
}

export function TrainerForm({ trainer, onSubmit, onCancel }: TrainerFormProps) {
  const form = useForm<TrainerInput>({
    resolver: zodResolver(trainerSchema),
    defaultValues: {
      first_name: trainer?.first_name || "",
      last_name: trainer?.last_name || "",
      email: trainer?.email || "",
      phone: trainer?.phone || "",
      categories: trainer?.categories || [],
      bio: trainer?.bio || "",
      start_date: trainer?.start_date || new Date().toISOString().split("T")[0],
      working_hours: {
        start: trainer?.working_hours?.start || "09:00",
        end: trainer?.working_hours?.end || "17:00",
      },
    },
  });

  const selectedCategories = form.watch("categories");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-0">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ad</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Soyad</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-posta</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefon</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="555 123 45 67" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="categories"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Uzmanlık Alanları</FormLabel>
              <Select
                value=""
                onValueChange={(value) => {
                  if (!field.value.includes(value)) {
                    field.onChange([...field.value, value]);
                  }
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Uzmanlık alanı seçin" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex flex-wrap gap-2 mt-2">
                {selectedCategories.map((category) => (
                  <Badge
                    key={category}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => {
                      form.setValue(
                        "categories",
                        selectedCategories.filter((c) => c !== category),
                        { shouldValidate: true }
                      );
                    }}
                  >
                    {category} ×
                  </Badge>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Biyografi</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="start_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Başlangıç Tarihi</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="working_hours.start"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Çalışma Saati Başlangıç</FormLabel>
                <FormControl>
                  <Input
                    type="time"
                    {...field}
                    value={field.value.toString()}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="working_hours.end"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Çalışma Saati Bitiş</FormLabel>
                <FormControl>
                  <Input
                    type="time"
                    {...field}
                    value={field.value.toString()}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            İptal
          </Button>
          <Button type="submit">{trainer ? "Güncelle" : "Ekle"}</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
