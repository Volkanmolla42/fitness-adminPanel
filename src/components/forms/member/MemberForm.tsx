import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { memberSchema } from "@/lib/validations";
import { Form } from "@/components/ui/form";
import { getServices } from "@/lib/queries";
import type { Database } from "@/types/supabase";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useTheme } from "@/contexts/theme-context";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { MemberFormStepIndicator } from "./MemberFormStepIndicator";
import { MemberInfoStep } from "./MemberInfoStep";
import { PackageSelectionStep } from "./PackageSelectionStep";
import { PaymentStep } from "./PaymentStep";

type Member = Database["public"]["Tables"]["members"]["Row"];
type Service = Database["public"]["Tables"]["services"]["Row"];
type MemberInput = Omit<Member, "id" | "created_at">;

interface MemberFormProps {
  member?: Member;
  onSubmit: (data: MemberInput) => Promise<Member | void>;
  onCancel: () => void;
  isEditing?: boolean;
}

export function MemberForm({
  member,
  onSubmit,
  onCancel,
  isEditing = false,
}: MemberFormProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [packageToDelete, setPackageToDelete] = useState<Service | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [existingServices, setExistingServices] = useState<Service[]>([]);
  const [paymentData, setPaymentData] = useState<{
    credit_card_paid: string;
    cash_paid: string;
    payment_date: string;
  }>({
    credit_card_paid: "",
    cash_paid: "",
    payment_date: new Date().toISOString().split("T")[0],
  });
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [currentStep, setCurrentStep] = useState<number>(1);

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

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const servicesData = await getServices();
        setServices(servicesData || []);

        if (
          member &&
          member.subscribed_services &&
          member.subscribed_services.length > 0
        ) {
          const memberExistingServices = member.subscribed_services
            .map((serviceId) => servicesData?.find((s) => s.id === serviceId))
            .filter((service) => service !== undefined) as Service[];
          setExistingServices(memberExistingServices);
        }
      } catch (error) {
        console.error("Error fetching services:", error);
        toast.error("Paketler yüklenirken bir hata oluştu", {
          description: "Lütfen sayfayı yenileyip tekrar deneyin.",
        });
      }
    };

    fetchServices();
  }, [member]);

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "subscribed_services" && services.length > 0) {
        const subscribedServices = value.subscribed_services as string[];
        if (subscribedServices && subscribedServices.length > 0) {
          const existingServiceIds = existingServices.map((s) => s.id);
          const newServiceIds = subscribedServices.filter(
            (id) => !existingServiceIds.includes(id)
          );

          const newSelectedServices = newServiceIds
            .map((id) => services.find((s) => s.id === id))
            .filter((service) => service !== undefined) as Service[];

          if (newSelectedServices.length > 0) {
            setSelectedServices(newSelectedServices);
          }
        } else {
          setSelectedServices([]);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [form, services, existingServices]);

  const handleFormSubmit = async () => {
    setIsSubmitting(true);

    try {
      const isValid = await form.trigger();
      if (!isValid) {
        toast.error("Form bilgilerini kontrol ediniz", {
          description: "Eksik veya hatalı alanlar var.",
        });
        setIsSubmitting(false);
        return;
      }

      const formData = form.getValues();

      // Düzenleme modunda kaydet
      if (isEditing) {
        // Mevcut paketler ve yeni seçilen paketleri birleştir
        const updatedServices = [
          ...existingServices.map((service) => service.id),
          ...selectedServices.map((service) => service.id),
        ];

        await onSubmit({
          ...formData,
          notes: formData.notes,
          subscribed_services: updatedServices,
        });

        if (selectedServices.length > 0) {
          try {
            // Toplam paket tutarını hesapla
            const totalAmount = selectedServices.reduce(
              (sum, service) => sum + (service.price || 0), 
              0
            );
            
            // Kredi kartı ve nakit ödemelerini toplam tutara oranlı olarak dağıt
            const creditCardPaid = Number(paymentData.credit_card_paid) || 0;
            const cashPaid = Number(paymentData.cash_paid) || 0;
            
            // Her yeni eklenen paket için ayrı bir ödeme kaydı oluştur
            const paymentPromises = selectedServices.map(async (service) => {
              // Her paketin toplam tutara oranını hesapla
              const ratio = service.price ? service.price / totalAmount : 0;
              
              // Bu orana göre ödeme miktarlarını dağıt
              const packageCreditCardPaid = creditCardPaid * ratio;
              const packageCashPaid = cashPaid * ratio;
              
              // Ödeme yoksa veya çok düşükse, kayıt oluşturma
              const totalPackagePayment = packageCreditCardPaid + packageCashPaid;
              if (totalPackagePayment < 1) return { error: null };
              
              return supabase
                .from("member_payments")
                .insert({
                  member_name: `${formData.first_name} ${formData.last_name}`,
                  credit_card_paid: Number(packageCreditCardPaid.toFixed(2)),
                  cash_paid: Number(packageCashPaid.toFixed(2)),
                  created_at: paymentData.payment_date,
                  package_name: service.name,
                });
            });
            
            // Tüm ödeme işlemlerini bekle
            const results = await Promise.all(paymentPromises);
            
            // Hata kontrolü
            const errors = results.filter(result => result.error);
            
            if (errors.length > 0) {
              console.error("Payment errors:", errors);
              toast.error("Bazı ödeme kayıtları oluşturulurken hatalar oluştu", {
                description: "Lütfen ödeme kayıtlarını kontrol edin",
              });
            } else if (selectedServices.length > 0) {
              toast.success("Yeni paketler başarıyla eklendi ve ödemeler kaydedildi");
            }
          } catch (paymentError) {
            console.error("Ödeme kaydı oluşturma hatası:", paymentError);
            toast.error("Ödeme kaydı oluşturulurken bir hata oluştu", {
              description: "Lütfen tekrar deneyin",
            });
          }
        }
        setIsSubmitting(false);
        return;
      }

      // Yeni üye veya paket ekleme durumu
      if (currentStep === 2) {
        if (selectedServices.length === 0) {
          toast.error("Lütfen en az bir paket seçiniz");
          setIsSubmitting(false);
          return;
        }
        setCurrentStep(3);
        setIsSubmitting(false);
        return;
      }

      // Ödeme adımındayken
      if (currentStep === 3) {
        if (
          selectedServices.length > 0 &&
          !paymentData.credit_card_paid &&
          !paymentData.cash_paid
        ) {
          toast.error("Lütfen nakit veya kredi kartı ile ödeme alınız.", {
            description: "Ödeme bilgileri boş bırakılamaz.",
          });
          setIsSubmitting(false);
          return;
        }

        // Önce üye bilgilerini kaydet
        await onSubmit({
          ...formData,
          notes: formData.notes,
          subscribed_services: selectedServices.map((s) => s.id),
        });

        // Varsa ödeme kaydını oluştur
        if (selectedServices.length > 0) {
          try {
            // Her paket için toplam tutarı hesapla
            const totalAmount = selectedServices.reduce(
              (sum, service) => sum + (service.price || 0),
              0
            );

            // Kredi kartı ve nakit ödemelerini toplam tutara oranlı olarak dağıt
            const creditCardPaid = Number(paymentData.credit_card_paid) || 0;
            const cashPaid = Number(paymentData.cash_paid) || 0;
            
            // Her paket için ayrı bir ödeme kaydı oluştur
            const paymentPromises = selectedServices.map(async (service) => {
              // Her paketin toplam tutara oranını hesapla
              const ratio = service.price ? service.price / totalAmount : 0;
              
              // Bu orana göre ödeme miktarlarını dağıt
              const packageCreditCardPaid = creditCardPaid * ratio;
              const packageCashPaid = cashPaid * ratio;
              
              return supabase
                .from("member_payments")
                .insert({
                  member_name: `${formData.first_name} ${formData.last_name}`,
                  credit_card_paid: Number(packageCreditCardPaid.toFixed(2)),
                  cash_paid: Number(packageCashPaid.toFixed(2)),
                  created_at: paymentData.payment_date,
                  package_name: service.name,
                });
            });
            
            // Tüm ödeme işlemlerini bekle
            const results = await Promise.all(paymentPromises);
            
            // Hata kontrolü
            const errors = results.filter(result => result.error);
            
            if (errors.length > 0) {
              console.error("Payment errors:", errors);
              toast.error("Bazı ödeme kayıtları oluşturulurken hatalar oluştu", {
                description: "Lütfen ödeme kayıtlarını kontrol edin",
              });
            } else {
              toast.success("Üye ve paketleri başarıyla kaydedildi");
            }
          } catch (paymentError) {
            console.error("Ödeme kaydı oluşturma hatası:", paymentError);
            toast.error("Ödeme kaydı oluşturulurken bir hata oluştu", {
              description: "Lütfen tekrar deneyin",
            });
          }
        }
      }
    } catch (error) {
      console.error("Form gönderme hatası:", error);
      toast.error("Bir hata oluştu", {
        description: "Lütfen tekrar deneyin",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePackage = () => {
    if (!packageToDelete || !member) {
      setShowDeleteConfirm(false);
      setPackageToDelete(null);
      return;
    }

    try {
      const currentPackages = [...(form.getValues().subscribed_services || [])];

      if (currentPackages.length === 0) {
        toast.error("Silinecek paket bulunamadı");
        setShowDeleteConfirm(false);
        setPackageToDelete(null);
        return;
      }

      const indexToRemove = currentPackages.findIndex(
        (id) => id === packageToDelete.id
      );

      if (indexToRemove !== -1) {
        const updatedPackages = [...currentPackages];
        updatedPackages.splice(indexToRemove, 1);

        form.setValue("subscribed_services", updatedPackages);

        const updatedExistingServices = [...existingServices];
        const serviceIndexToRemove = updatedExistingServices.findIndex(
          (service) => service.id === packageToDelete.id
        );

        if (serviceIndexToRemove !== -1) {
          updatedExistingServices.splice(serviceIndexToRemove, 1);
          setExistingServices(updatedExistingServices);
        }

        toast.success("Paket listeden kaldırıldı.");
      } else {
        toast.error("Paket bulunamadı", {
          description: "Silinecek paket listede bulunamadı.",
        });
      }
    } catch (error) {
      console.error("Paket silme hatası:", error);
      toast.error("Paket silinirken bir hata oluştu", {
        description: "Lütfen tekrar deneyin.",
      });
    } finally {
      setShowDeleteConfirm(false);
      setPackageToDelete(null);
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      form
        .trigger([
          "first_name",
          "last_name",
          "email",
          "phone",
          "membership_type",
          "start_date",
        ])
        .then((isValid) => {
          if (isValid) {
            setCurrentStep(2);
          }
        });
    } else if (currentStep === 2) {
      if (selectedServices.length === 0) {
        toast.error("Lütfen en az bir paket seçiniz");
        return;
      }
      setCurrentStep(3);
    }
  };

  return (
    <Form {...form}>
      <div className={`space-y-6 ${isDark ? "text-gray-200" : ""}`}>
        {/* Paket Silme Onay Diyaloğu */}
        <AlertDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Paketi silmek istediğinize emin misiniz?
              </AlertDialogTitle>
              <AlertDialogDescription>
                {packageToDelete?.name} paketi listeden kaldırılacaktır.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSubmitting}>
                Vazgeç
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeletePackage}
                className="bg-destructive hover:bg-destructive/90"
              >
                Listeden Kaldır
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Adım Göstergesi */}
        <MemberFormStepIndicator
          currentStep={currentStep}
          isEditing={isEditing}
        />

        {/* Form Adımları */}
        {currentStep === 1 ? (
          <MemberInfoStep
            form={form}
            isEditing={isEditing}
            isSubmitting={isSubmitting}
            existingServices={existingServices}
            onCancel={onCancel}
            onNext={handleNext}
            onSubmit={handleFormSubmit}
            setCurrentStep={setCurrentStep}
            setShowDeleteConfirm={setShowDeleteConfirm}
            setPackageToDelete={setPackageToDelete}
          />
        ) : currentStep === 2 ? (
          <PackageSelectionStep
            form={form}
            isEditing={isEditing}
            isSubmitting={isSubmitting}
            services={services}
            selectedServices={selectedServices}
            existingServices={existingServices}
            setSelectedServices={setSelectedServices}
            onBack={() => setCurrentStep(1)}
            onNext={handleNext}
          />
        ) : (
          <PaymentStep
            isSubmitting={isSubmitting}
            selectedServices={selectedServices}
            paymentData={paymentData}
            setPaymentData={setPaymentData}
            onBack={() => setCurrentStep(2)}
            onSubmit={handleFormSubmit}
          />
        )}
      </div>
    </Form>
  );
}
