import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { memberSchema } from "@/lib/validations";
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
import { getServices } from "@/lib/queries";
import type { Database } from "@/types/supabase";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Member = Database["public"]["Tables"]["members"]["Row"];
type Service = Database["public"]["Tables"]["services"]["Row"];
type MemberInput = Omit<Member, "id" | "created_at">;

interface MemberFormProps {
  member?: Member;
  onSubmit: (data: MemberInput) => void;
  onCancel: () => void;
}

export function MemberForm({ member, onSubmit, onCancel }: MemberFormProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const servicesData = await getServices();
        setServices(servicesData || []);
      } catch (error) {
        console.error("Error fetching services:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
  }, []);

  const form = useForm<MemberInput>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      first_name: member?.first_name || "",
      last_name: member?.last_name || "",
      email: member?.email || "",
      phone: member?.phone || "",
      avatar_url:
        member?.avatar_url ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`,
      membership_type: member?.membership_type || "basic",
      subscribed_services: member?.subscribed_services || [],
      start_date: member?.start_date || new Date().toISOString().split("T")[0],
      end_date: member?.end_date || new Date().toISOString().split("T")[0],
      notes: member?.notes || "",
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (data) => {
          setIsSubmitting(true);
          try {
            await onSubmit(data);
          } finally {
            setIsSubmitting(false);
          }
        })}
        className="space-y-3"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
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
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="max-w-xl">
          <FormField
            control={form.control}
            name="membership_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Üyelik Tipi</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Üyelik tipi seçin" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="basic">Standart Üye</SelectItem>
                    <SelectItem value="vip">VIP Üye</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="subscribed_services"
          render={({ field }) => (
            <FormItem className="max-w-xl">
              <FormLabel>Hizmetler</FormLabel>
              <div className="flex flex-wrap gap-3 p-6 border-2 rounded-xl bg-muted/30">
                {services
                  .sort((a, b) => {
                    // Önce VIP durumuna göre sırala
                    if (a.isVipOnly && !b.isVipOnly) return -1;
                    if (!a.isVipOnly && b.isVipOnly) return 1;
                    // VIP durumu aynıysa isme göre sırala
                    return a.name.localeCompare(b.name);
                  })
                  .map((service) => (
                    <TooltipProvider key={service.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={`relative ${
                              service.isVipOnly && form.watch("membership_type") !== "vip"
                                ? "cursor-not-allowed"
                                : "cursor-pointer hover:opacity-80"
                            }`}
                          >
                            <Badge
                              variant={
                                field.value.includes(service.id)
                                  ? "default"
                                  : "secondary"
                              }
                              className={`px-4 py-2 text-sm font-medium shadow-sm transition-all duration-200 ${
                                field.value.includes(service.id)
                                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                  : "bg-secondary hover:bg-secondary/80"
                              } ${
                                service.isVipOnly ? "border-2 border-rose-500" : ""
                              } ${
                                service.isVipOnly && form.watch("membership_type") !== "vip"
                                  ? "opacity-40"
                                  : ""
                              }`}
                              onClick={() => {
                                if (service.isVipOnly && form.watch("membership_type") !== "vip") {
                                  return;
                                }
                                const newValue = field.value.includes(service.id)
                                  ? field.value.filter((id) => id !== service.id)
                                  : [...field.value, service.id];
                                field.onChange(newValue);
                              }}
                            >
                              {service.name}
                              {service.isVipOnly && (
                                <span className="ml-2 text-xs font-bold text-rose-500 bg-rose-100 px-1.5 py-0.5 rounded-full">(VIP)</span>
                              )}
                            </Badge>
                          </div>
                        </TooltipTrigger>
                        {service.isVipOnly && form.watch("membership_type") !== "vip" && (
                          <TooltipContent>
                            <p>Bu hizmet sadece VIP üyeler için geçerlidir</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
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
            name="end_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bitiş Tarihi</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem className="max-w-xl">
              <FormLabel>Notlar</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onCancel}>
            İptal
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Kaydediliyor..." : member ? "Güncelle" : "Ekle"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
