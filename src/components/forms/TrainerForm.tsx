import React, { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DialogFooter } from "@/components/ui/dialog";
import { categories } from "@/components/forms/ServiceForm";
import type { Database } from "@/types/supabase";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

type Trainer = Database["public"]["Tables"]["trainers"]["Row"];
type TrainerInput = Omit<Trainer, "id" | "created_at">;

interface TrainerFormProps {
  trainer?: Trainer;
  onSubmit: (data: TrainerInput) => void;
  onCancel: () => void;
}

const formatPhoneNumber = (value: string) => {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return numbers.slice(0, 3) + " " + numbers.slice(3);
  if (numbers.length <= 8)
    return (
      numbers.slice(0, 3) + " " + numbers.slice(3, 6) + " " + numbers.slice(6)
    );
  return (
    numbers.slice(0, 3) +
    " " +
    numbers.slice(3, 6) +
    " " +
    numbers.slice(6, 8) +
    " " +
    numbers.slice(8, 10)
  );
};

export function TrainerForm({ trainer, onSubmit, onCancel }: TrainerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TrainerInput>({
    resolver: zodResolver(trainerSchema),
    defaultValues: {
      first_name: trainer?.first_name || "",
      last_name: trainer?.last_name || "",
      name: trainer?.name || "",
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

  const handleSubmit = async (data: TrainerInput) => {
    setIsSubmitting(true);
    try {
      const updatedData = {
        ...data,
        name: `${data.first_name} ${data.last_name}`.trim(),
      };
      await onSubmit(updatedData);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <Card className="p-4">
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

          <div className="grid grid-cols-2 gap-4 mt-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-posta</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" />
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
                    <Input
                      {...field}
                      onChange={(e) => {
                        const formatted = formatPhoneNumber(e.target.value);
                        field.onChange(formatted);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="mt-4">
            <FormField
              control={form.control}
              name="categories"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Uzmanlık Alanları</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <Badge
                        key={category}
                        variant={
                          selectedCategories?.includes(category)
                            ? "default"
                            : "outline"
                        }
                        className="cursor-pointer"
                        onClick={() => {
                          const current = field.value || [];
                          const updated = current.includes(category)
                            ? current.filter((c) => c !== category)
                            : [...current, category];
                          field.onChange(updated);
                        }}
                      >
                        {category}
                      </Badge>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="mt-4">
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Biyografi</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Eğitmen hakkında kısa bir biyografi..."
                      className="h-20"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4">
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

            <FormField
              control={form.control}
              name="working_hours.start"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Başlangıç Saati</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
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
                  <FormLabel>Bitiş Saati</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Card>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            İptal
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Kaydet
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
