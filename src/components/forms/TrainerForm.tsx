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
import { WORKING_HOURS } from "@/constants/timeSlots";
import type { Database } from "@/types/supabase";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

type Trainer = Database["public"]["Tables"]["trainers"]["Row"];
type TrainerInput = Omit<Trainer, "id" | "created_at">;
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
interface TrainerFormProps {
  trainer?: Trainer;
  onSubmit: (data: TrainerInput) => void;
  onCancel: () => void;
}

export const formatPhoneNumber = (value: string) => {
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
      email: trainer?.email || "",
      phone: trainer?.phone || "",
      bio: trainer?.bio || "",
      categories: trainer?.categories || [],
      start_date: trainer?.start_date || new Date().toISOString().split("T")[0],
      working_hours: trainer?.working_hours || {
        start: WORKING_HOURS.start,
        end: WORKING_HOURS.end,
      },
    },
  });

  const selectedCategories = form.watch("categories");

  const handleSubmit = async (data: TrainerInput) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-2  overflow-y-auto " >
        <Card className="px-4 space-y-2">
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Ad</FormLabel>
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
                    <FormLabel className="text-base font-semibold">Soyad</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold after:content-['(opsiyonel)'] after:ml-1 after:text-gray-500">E-posta</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="email" 
                        value={field.value || ''} 
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value || null);
                        }}
                      />
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
                    <FormLabel className="text-base font-semibold">Telefon</FormLabel>
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

            <div>
              <FormField
                control={form.control}
                name="categories"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Uzmanlık Alanları</FormLabel>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {categories.map((category) => (
                        <Badge
                          key={category}
                          variant={
                            selectedCategories?.includes(category)
                              ? "default"
                              : "outline"
                          }
                          className="cursor-pointer hover:opacity-80 transition-opacity text-sm py-1 px-2"
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

            <div>
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Biyografi</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Antrenör hakkında kısa bir biyografi..."
                        className="h-10 resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Başlangıç Tarihi</FormLabel>
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
                    <FormLabel className="text-base font-semibold">Mesai Başlangıç</FormLabel>
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
                    <FormLabel className="text-base font-semibold">Mesai bitiş </FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </Card>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={onCancel} 
            type="button"
            disabled={isSubmitting} 
            className="min-w-[100px]"
          >
            İptal
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting} 
            className="min-w-[100px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Kaydediliyor...
              </>
            ) : (
              'Kaydet'
            )}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
