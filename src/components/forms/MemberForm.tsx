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
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

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
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [paymentData, setPaymentData] = useState({
    credit_card_paid: "",
    cash_paid: "",
    payment_date: new Date().toISOString().split("T")[0],
  });

  // Seçili paketlerin toplam tutarını hesapla
  const totalAmount = selectedServices.reduce(
    (total, service) => total + (service.price || 0),
    0
  );
  const remainingAmount =
    totalAmount -
    (Number(paymentData.credit_card_paid) + Number(paymentData.cash_paid));

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
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()
          .toString(36)
          .substring(
            2
          )}&options[style]=female&options[top]=longHair&options[accessories]=none`,
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

          // Ödeme bilgilerini kontrol et
          if (
            !paymentData.credit_card_paid &&
            !paymentData.cash_paid &&
            selectedServices.length > 0
          ) {
            toast.error("Lütfen nakit veya kredi kartı ile ödeme alınız.", {
              description: "Ödeme bilgileri boş bırakılamaz.",
            });
            setIsSubmitting(false);
            return;
          }

          try {
            // Notlara ödeme bilgilerini ekle
            const paymentInfo =
              selectedServices.length > 0
                ? `\nPaket: ${selectedServices
                    .map((service) => service.name)
                    .join(", ")} \nKredi Kartı: ${Number(
                    paymentData.credit_card_paid
                  ).toLocaleString("tr-TR")}₺ \nNakit: ${Number(
                    paymentData.cash_paid
                  ).toLocaleString("tr-TR")}₺`
                : "";

            // Üye kaydını oluştur
            await onSubmit({
              ...data,
              notes: data.notes + paymentInfo,
            });

            // Ödeme kaydını oluştur
            if (selectedServices.length > 0) {
              const { error: paymentError } = await supabase
                .from("member_payments")
                .insert({
                  member_name: `${data.first_name} ${data.last_name}`,
                  credit_card_paid: Number(paymentData.credit_card_paid) || 0,
                  cash_paid: Number(paymentData.cash_paid) || 0,
                  created_at: paymentData.payment_date,
                  package_name: selectedServices
                    .map((service) => service.name)
                    .join(", "),
                });

              if (paymentError) {
                toast.error("Ödeme kaydı oluşturulurken bir hata oluştu", {
                  description: "Lütfen tekrar deneyin",
                });
                console.error(paymentError);
              }
            }
          } finally {
            setIsSubmitting(false);
          }
        })}
        className="space-y-4 p-2"
      >
        {/* Kişisel Bilgiler */}
        <div className="space-y-2 mb-4">
          <div className="text-xs font-medium text-muted-foreground px-1">
            Kişisel Bilgiler
          </div>
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
                  <FormLabel className="text-xs text-muted-foreground">
                    Üyelik Tipi
                  </FormLabel>
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
                  <FormLabel className="text-xs text-muted-foreground">
                    Başlangıç Tarihi
                  </FormLabel>
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
          <div className="text-xs font-medium text-muted-foreground px-1">
            Paket Seçimi
          </div>
          <FormField
            control={form.control}
            name="subscribed_services"
            render={({ field }) => (
              <FormItem className="max-w-sm">
                <Select
                  onValueChange={(value) => {
                    const service = services.find((s) => s.id === value);
                    if (service) {
                      const currentServices = [...selectedServices];
                      currentServices.push(service);
                      setSelectedServices(currentServices);
                      const currentValues = field.value || [];
                      field.onChange([...currentValues, value]);
                    }
                  }}
                  value=""
                >
                  <FormControl>
                    <SelectTrigger className="w-full border-2 focus-visible:border-primary">
                      <SelectValue placeholder="Paket seçin">
                        {field.value?.length > 0
                          ? `${field.value.length} paket seçildi`
                          : "Paket seçin"}
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
                        const isDisabled =
                          service.isVipOnly &&
                          form.watch("membership_type") !== "vip";

                        return (
                          <SelectItem
                            key={service.id}
                            value={service.id}
                            disabled={isDisabled}
                            className={`${
                              service.isVipOnly
                                ? "border-l-2 border-rose-500"
                                : ""
                            } ${isDisabled ? "opacity-50" : ""}`}
                          >
                            <div className="flex items-center justify-between gap-2 w-full">
                              <span>{service.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground text-sm">
                                  {service.price?.toLocaleString("tr-TR")} ₺
                                </span>
                                {service.isVipOnly && (
                                  <Badge variant="destructive" className="ml-2">
                                    VIP
                                  </Badge>
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
                    {field.value?.map((serviceId, index) => {
                      const service = services.find((s) => s.id === serviceId);
                      if (!service) return null;
                      return (
                        <Badge
                          key={`${serviceId}-${index}`}
                          variant="secondary"
                          className="px-2 py-1 flex items-center gap-1.5"
                        >
                          <span>{service.name}</span>
                          <span className="text-muted-foreground text-sm">
                            {service.price?.toLocaleString("tr-TR")} ₺
                          </span>
                          <button
                            type="button"
                            className="ml-1  text-destructive"
                            onClick={() => {
                              const newServices = [...field.value];
                              const newSelectedServices = [...selectedServices];
                              newServices.splice(index, 1);
                              newSelectedServices.splice(index, 1);
                              field.onChange(newServices);
                              setSelectedServices(newSelectedServices);
                            }}
                          >
                            x
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Ödeme Bilgileri */}
        {selectedServices.length > 0 && (
          <div className="flex flex-col">
            <div className="border-t border-blue-600 pt-2 font-bold">
              <div className="flex justify-between items-center">
                <span className="text-xs">Toplam Kalan Tutar:</span>
                <span
                  className={`text-xs ${
                    remainingAmount > 0
                      ? "text-destructive"
                      : remainingAmount < 0
                      ? "text-yellow-600"
                      : "text-green-600"
                  }`}
                >
                  {remainingAmount.toLocaleString("tr-TR")} ₺
                </span>
              </div>
            </div>
            
            {/* Ödeme Formu - Kompakt Tasarım */}
            <div className="grid grid-cols-2 gap-1 mt-2">
              <div className="col-span-3">
                <FormLabel className="text-xs text-muted-foreground mb-0">
                  Ödeme Tarihi
                </FormLabel>
                <Input
                  type="date"
                  value={paymentData.payment_date}
                  onChange={(e) =>
                    setPaymentData({
                      ...paymentData,
                      payment_date: e.target.value,
                    })
                  }
                  className="border h-8 text-xs focus-visible:border-primary"
                />
              </div>
              
              <div>
                <FormLabel className="text-xs text-muted-foreground mb-0">
                  Kredi Kartı
                </FormLabel>
                <Input
                  type="number"
                  value={paymentData.credit_card_paid}
                  onChange={(e) =>
                    setPaymentData({
                      ...paymentData,
                      credit_card_paid: e.target.value,
                    })
                  }
                  className="border h-8 text-xs focus-visible:border-primary"
                  placeholder="0"
                />
              </div>
              
              <div>
                <FormLabel className="text-xs text-muted-foreground mb-0">
                  Nakit
                </FormLabel>
                <Input
                  type="number"
                  value={paymentData.cash_paid}
                  onChange={(e) =>
                    setPaymentData({
                      ...paymentData,
                      cash_paid: e.target.value,
                    })
                  }
                  className="border h-8 text-xs focus-visible:border-primary"
                  placeholder="0"
                />
              </div>
             
            </div>
          </div>
        )}

        {/* Notlar */}
        <div>
          <div className="text-xs font-medium text-muted-foreground pb-2">
            Ek Bilgiler
          </div>
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
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            İptal
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
