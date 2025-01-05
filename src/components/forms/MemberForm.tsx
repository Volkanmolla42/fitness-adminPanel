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
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}&options[style]=female`,
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
              <FormLabel>Paketler</FormLabel>
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
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Paket seçin">
                      {field.value?.length > 0 ? `${field.value.length} paket seçildi` : "Paket seçin"}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
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
                          <div className="flex items-center justify-between w-full">
                            <span>{service.name}</span>
                            {service.isVipOnly && (
                              <Badge variant="destructive" className="ml-2">VIP</Badge>
                            )}
                          </div>
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
              <div className="mt-2 flex flex-wrap gap-2">
                {field.value?.map((serviceId) => {
                  const service = services.find((s) => s.id === serviceId);
                  if (!service) return null;
                  return (
                    <Badge
                      key={serviceId}
                      variant="secondary"
                      className="px-2 py-1"
                    >
                      {service.name}
                      <button
                        type="button"
                        className="ml-2 hover:text-destructive"
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
