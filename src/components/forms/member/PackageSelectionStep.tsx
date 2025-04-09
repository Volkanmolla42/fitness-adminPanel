import { useTheme } from "@/contexts/theme-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UseFormReturn } from "react-hook-form";
import type { Database } from "@/types/supabase";
import type { Service } from "@/types/index";
import React from "react";

type Member = Database["public"]["Tables"]["members"]["Row"];
type MemberInput = Omit<Member, "id" | "created_at">;

interface PackageSelectionStepProps {
  form: UseFormReturn<MemberInput>;
  isEditing: boolean;
  isSubmitting: boolean;
  services: Service[];
  selectedServices: Service[];
  existingServices: Service[];
  setSelectedServices: (services: Service[]) => void;
  onBack: () => void;
  onNext: () => void;
}

export function PackageSelectionStep({
  form,
  isEditing,
  isSubmitting,
  services,
  selectedServices,
  existingServices,
  setSelectedServices,
  onBack,
  onNext,
}: PackageSelectionStepProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const handlePackageSelect = (service: Service) => {
    const currentServices = form.getValues().subscribed_services || [];
    const isAlreadySelected = currentServices.includes(service.id);

    if (isAlreadySelected) {
      // Paketi kaldır
      const updatedServices = currentServices.filter((id) => id !== service.id);
      form.setValue("subscribed_services", updatedServices);
      setSelectedServices(selectedServices.filter((s) => s.id !== service.id));
    } else {
      // Paketi ekle
      const updatedServices = [...currentServices, service.id];
      form.setValue("subscribed_services", updatedServices);
      setSelectedServices([...selectedServices, service]);
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="space-y-4">
        <div className="bg-muted/30 p-4 rounded-lg border">
          <div className="flex flex-col space-y-4">
            {/* Selected Packages with Total */}
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">Paket Seçimi</h3>
                {selectedServices.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      Toplam:
                    </span>
                    <span className="font-semibold text-primary">
                      {selectedServices
                        .reduce(
                          (total, service) => total + (service.price || 0),
                          0
                        )
                        .toLocaleString("tr-TR")}{" "}
                      ₺
                    </span>
                  </div>
                )}
              </div>

              {/* Mevcut Paketler */}
              {isEditing && existingServices.length > 0 && (
                <div className="mb-2">
                  <div className="text-xs font-medium mb-2 text-muted-foreground">
                    Mevcut Paketler
                  </div>
                  <div className="space-y-1.5">
                    {existingServices.map((service, index) => (
                      <div
                        key={`existing-payment-${service.id}-${index}`}
                        className={`flex justify-between items-center py-2 px-3 rounded-md border ${
                          isDark
                            ? "bg-gray-800/50 border-gray-700"
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span
                            className={`font-medium ${
                              isDark ? "text-gray-200" : ""
                            }`}
                          >
                            {service.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {service.session_count} Seans | {service.duration}{" "}
                            Dakika | {service.max_participants} Kişi
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-medium text-primary">
                            {service.price?.toLocaleString("tr-TR")} ₺
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs border-green-500 text-green-500 hover:bg-green-500/10"
                            onClick={() => {
                              // Paketi yeni eklenecek paketlere ekle
                              const isAlreadySelected = selectedServices.some(
                                (s) => s.id === service.id
                              );
                              if (!isAlreadySelected) {
                                const updatedServices = [
                                  ...selectedServices,
                                  service,
                                ];
                                setSelectedServices(updatedServices);

                                // Form değerlerini güncelle
                                const currentServices =
                                  form.getValues().subscribed_services || [];
                                const updatedFormServices = [
                                  ...currentServices,
                                  service.id,
                                ];
                                form.setValue(
                                  "subscribed_services",
                                  updatedFormServices
                                );
                              }
                            }}
                          >
                            Seç
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Yeni Seçilen Paketler */}
              <div>
                <div className="text-xs font-medium mb-2 text-muted-foreground">
                  {isEditing ? "Yeni Eklenecek Paketler" : "Seçilen Paketler"}
                </div>
                <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                  {selectedServices.length > 0 ? (
                    selectedServices.map((service, index) => (
                      <div
                        key={`payment-${service.id}-${index}`}
                        className={`flex border-green-500 justify-between items-center py-2 px-3 rounded-md border ${
                          isDark
                            ? "bg-gray-800/50 border-gray-700"
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1">
                            <span
                              className={`font-medium text-sm ${
                                isDark ? "text-gray-200" : ""
                              }`}
                            >
                              {service.name}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {service.session_count} Seans | {service.duration}{" "}
                            Dakika | {service.max_participants} Kişi
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium text-primary">
                            {service.price?.toLocaleString("tr-TR")} ₺
                          </div>
                          <button
                            type="button"
                            className="ml-1 text-destructive hover:text-destructive/80"
                            onClick={() => {
                              const newSelectedServices = [...selectedServices];
                              const newFieldValues = [
                                ...form.getValues().subscribed_services,
                              ];

                              // Find index of service to remove
                              const fieldIndex = newFieldValues.findIndex(
                                (id) => id === service.id
                              );

                              // Remove service from selectedServices and field value
                              newSelectedServices.splice(index, 1);
                              if (fieldIndex !== -1) {
                                newFieldValues.splice(fieldIndex, 1);
                              }

                              setSelectedServices(newSelectedServices);
                              form.setValue(
                                "subscribed_services",
                                newFieldValues
                              );
                            }}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M18 6 6 18" />
                              <path d="m6 6 12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground w-full text-center py-3 border rounded-md bg-muted/10">
                      Henüz paket seçilmedi
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Paket Seçim Listesi */}
            <div className="mt-4 text-xs">
              <div className="text-xs font-medium mb-2 text-muted-foreground">
                Paket Listesi
              </div>
              <div className="max-h-[200px] overflow-y-auto border rounded-md">
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
                    const isSelected = selectedServices.some(
                      (s) => s.id === service.id
                    );

                    return (
                      <div
                        key={service.id}
                        className={`flex items-center justify-between p-3 border-b cursor-pointer transition-all ${
                          isDisabled ? "opacity-50 cursor-not-allowed" : ""
                        } ${
                          isSelected
                            ? `bg-primary/10 border-l-4 border-primary ${
                                isDark ? "text-white" : ""
                              }`
                            : `hover:bg-muted ${isDark ? "text-gray-200" : ""}`
                        } ${
                          service.isVipOnly
                            ? "border-r-4 border-r-rose-500"
                            : ""
                        }`}
                        onClick={() => {
                          if (isDisabled) return;
                          handlePackageSelect(service);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center ${
                              isSelected
                                ? "bg-primary"
                                : "border-2 border-gray-400"
                            }`}
                          >
                            {isSelected && (
                              <div className="w-2 h-2 rounded-full bg-white"></div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{service.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {service.session_count} Seans | {service.duration}{" "}
                              Dakika | {service.max_participants} Kişi
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className="font-semibold">
                              {service.price?.toLocaleString("tr-TR")} ₺
                            </div>
                            {service.isVipOnly && (
                              <Badge
                                variant="destructive"
                                className="ml-auto mt-1"
                              >
                                VIP
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex items-center gap-1"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
          </svg>
          Geri
        </Button>
        <Button
          type="button"
          disabled={isSubmitting || selectedServices.length === 0}
          className="flex items-center gap-1"
          onClick={onNext}
        >
          Ödemeye Geç
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </Button>
      </div>
    </Card>
  );
}
