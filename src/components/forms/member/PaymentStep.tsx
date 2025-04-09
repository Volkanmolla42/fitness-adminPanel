import { useTheme } from "@/contexts/theme-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FormLabel } from "@/components/ui/form";
import type { Service } from "@/types/index";
import React from "react";

interface PaymentData {
  credit_card_paid: string;
  cash_paid: string;
  payment_date: string;
}

interface PaymentStepProps {
  isSubmitting: boolean;
  selectedServices: Service[];
  paymentData: PaymentData;
  setPaymentData: (data: PaymentData) => void;
  onBack: () => void;
  onSubmit: () => void;
}

export function PaymentStep({
  isSubmitting,
  selectedServices,
  paymentData,
  setPaymentData,
  onBack,
  onSubmit,
}: PaymentStepProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Calculate total and remaining amounts
  const totalAmount = selectedServices.reduce(
    (total, service) => total + (service.price || 0),
    0
  );
  const remainingAmount =
    totalAmount -
    (Number(paymentData.credit_card_paid) + Number(paymentData.cash_paid));

  return (
    <Card className="p-4 space-y-4">
      <div className="space-y-4">
        {/* Selected Packages Summary and Payment Info */}
        <div className="bg-muted/30 p-4 rounded-lg border">
          <div className="flex flex-col space-y-4">
            {/* Selected Packages with Total */}
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">Seçilen Paketler</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Toplam:</span>
                  <span className="font-semibold text-primary">
                    {totalAmount.toLocaleString("tr-TR")} ₺
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                {selectedServices.map((service, index) => (
                  <div
                    key={`${service.id}-${index}`}
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
                    <div className="text-sm font-medium text-primary">
                      {service.price?.toLocaleString("tr-TR")} ₺
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Details */}
            <div className="pt-4 border-t space-y-4">
              <h3 className="text-sm font-semibold">Ödeme Detayları</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <FormLabel
                    className={`text-xs font-medium ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
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
                    className={`border h-9 text-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary ${
                      isDark ? "bg-gray-800 border-gray-700 text-gray-200" : ""
                    }`}
                  />
                </div>

                <div>
                  <FormLabel
                    className={`text-xs font-medium ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Kredi Kartı
                  </FormLabel>
                  <div className="relative">
                    <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                      ₺
                    </div>
                    <Input
                      type="number"
                      value={paymentData.credit_card_paid}
                      onChange={(e) =>
                        setPaymentData({
                          ...paymentData,
                          credit_card_paid: e.target.value,
                        })
                      }
                      className={`border h-9 text-sm pl-7 focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary ${
                        isDark
                          ? "bg-gray-800 border-gray-700 text-gray-200"
                          : ""
                      }`}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <FormLabel
                    className={`text-xs font-medium ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Nakit
                  </FormLabel>
                  <div className="relative">
                    <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                      ₺
                    </div>
                    <Input
                      type="number"
                      value={paymentData.cash_paid}
                      onChange={(e) =>
                        setPaymentData({
                          ...paymentData,
                          cash_paid: e.target.value,
                        })
                      }
                      className={`border h-9 text-sm pl-7 focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary ${
                        isDark
                          ? "bg-gray-800 border-gray-700 text-gray-200"
                          : ""
                      }`}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              <div
                className={`p-3 rounded-md mt-4 ${
                  remainingAmount > 0
                    ? "bg-destructive/10 border border-destructive/30"
                    : "bg-emerald-500/10 border border-emerald-500/30"
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Kalan Tutar
                    </div>
                    <div
                      className={`text-lg font-semibold ${
                        remainingAmount > 0
                          ? "text-destructive"
                          : remainingAmount < 0
                          ? "text-yellow-600"
                          : "text-emerald-600"
                      }`}
                    >
                      {remainingAmount.toLocaleString("tr-TR")} ₺
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {remainingAmount === 0 && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-emerald-500"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between mt-2">
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
          disabled={isSubmitting}
          className="min-w-[120px] flex items-center gap-1"
          onClick={onSubmit}
        >
          {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
          {!isSubmitting && (
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
              <path d="M20 6 9 17l-5-5" />
            </svg>
          )}
        </Button>
      </div>
    </Card>
  );
}
