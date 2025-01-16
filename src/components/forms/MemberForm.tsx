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

import { formatPhoneNumber } from "./TrainerForm";

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const servicesData = await getServices();
        setServices(servicesData || []);
      } catch (error) {
        console.error("Error fetching services:", error);
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
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random().toString(36).substring(2)}&options[style]=female&options[top]=longHair&options[accessories]=none`,
      membership_type: member?.membership_type || "basic",
      subscribed_services: member?.subscribed_services || [],
      start_date: member?.start_date || new Date().toISOString().split("T")[0],
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
        className="space-y-4 p-2"
      >
        {/* Kişisel Bilgiler */}
        <div className="space-y-2 mb-4">
          <div className="text-xs font-medium text-muted-foreground px-1">Kişisel Bilgiler</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-sm">
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input 
                      placeholder="Ad" 
                      {...field}
                      className="border-2 focus-visible:border-primary" 
                    />
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
                  <FormControl>
                    <Input 
                      placeholder="Soyad" 
                      {...field}
                      onChange={(e) => {
                        field.onChange(e.target.value.toUpperCase());
                      }}
                      className="border-2 focus-visible:border-primary" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-sm">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input 
                      placeholder="E-posta" 
                      type="email" 
                      {...field}
                      className="border-2 focus-visible:border-primary" 
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
                  <FormControl>
                    <Input 
                      placeholder="Telefon"
                      {...field} 
                      onChange={(e) => {
                        const formatted = formatPhoneNumber(e.target.value);
                        field.onChange(formatted);
                      }}
                      className="border-2 focus-visible:border-primary" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Üyelik Bilgileri */}
        <div className="space-y-2">
      
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-sm">
            <FormField
              control={form.control}
              name="membership_type"
              render={({ field }) => (
                <FormItem>
                   <FormLabel className="text-xs text-muted-foreground">Üyelik Tipi</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="border-2 focus-visible:border-primary">
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

            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-muted-foreground">Başlangıç Tarihi</FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      {...field}
                      className="border-2 focus-visible:border-primary" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Paket Seçimi */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground px-1">Paket Seçimi</div>
          <FormField
            control={form.control}
            name="subscribed_services"
            render={({ field }) => (
              <FormItem className="max-w-sm">
                <Select
                  onValueChange={(value) => {
                    const currentServices = field.value || [];
                    const newValue = currentServices.includes(value)
                      ? currentServices.filter((id) => id !== value)
                      : [...currentServices, value];
                    field.onChange(newValue);
                  }}
                  value={field.value?.[field.value.length - 1] || ""}
                >
                  <FormControl>
                    <SelectTrigger className="w-full border-2 focus-visible:border-primary">
                      <SelectValue placeholder="Paket seçin">
                        {field.value?.length > 0 ? `${field.value.length} paket seçildi` : "Paket seçin"}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-[280px]">
                    {services
                      .sort((a, b) => {
                        if (a.isVipOnly && !b.isVipOnly) return -1;
                        if (!a.isVipOnly && b.isVipOnly) return 1;
                        return a.name.localeCompare(b.name);
                      })
                      .map((service) => {
                        const isSelected = field.value?.includes(service.id);
                        const isDisabled = service.isVipOnly && form.watch("membership_type") !== "vip";
                        
                        return (
                          <SelectItem
                            key={service.id}
                            value={service.id}
                            disabled={isDisabled}
                            className={`${isSelected ? 'bg-primary/10' : ''} ${
                              service.isVipOnly ? 'border-l-2 border-rose-500' : ''
                            } ${isDisabled ? 'opacity-50' : ''}`}
                          >
                            <div className="flex items-center justify-between gap-2 w-full">
                              <span>{service.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground text-sm">
                                  {service.price?.toLocaleString('tr-TR')} ₺
                                </span>
                                {service.isVipOnly && (
                                  <Badge variant="destructive" className="ml-2">VIP</Badge>
                                )}
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>

                <div className="mt-2 space-y-2">
                  {/* Seçili Paketler */}
                  <div className="flex flex-wrap gap-2">
                    {field.value?.map((serviceId) => {
                      const service = services.find((s) => s.id === serviceId);
                      if (!service) return null;
                      return (
                        <Badge
                          key={serviceId}
                          variant="secondary"
                          className="px-2 py-1 flex items-center gap-1.5"
                        >
                          <span>{service.name}</span>
                          <span className="text-muted-foreground text-sm">
                            {service.price?.toLocaleString('tr-TR')} ₺
                          </span>
                          <button
                            type="button"
                            className="ml-1 hover:text-destructive"
                            onClick={() => {
                              field.onChange(field.value.filter((id) => id !== serviceId));
                            }}
                          >
                            ×
                          </button>
                        </Badge>
                      );
                    })}
                  </div>

                  {/* Toplam Tutar */}
                  {field.value?.length > 0 && (
                    <div className="flex justify-end text-sm">
                      <div className="bg-muted/30 px-2 py-1 rounded flex items-center gap-1">
                        <span className="text-muted-foreground">Toplam:</span>
                        <span className="font-medium">
                          {field.value.reduce((total, serviceId) => {
                            const service = services.find((s) => s.id === serviceId);
                            return total + (service?.price || 0);
                          }, 0).toLocaleString('tr-TR')} ₺
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Notlar */}
        <div>
          <div className="text-xs font-medium text-muted-foreground pb-2">Ek Bilgiler</div>
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem className="max-w-sm">
                <FormControl>
                  <Input 
                    placeholder="Ödeme yöntemi, notlar..." 
                    {...field}
                    className="border-2 focus-visible:border-primary" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
