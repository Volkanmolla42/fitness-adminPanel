import { useTheme } from "@/contexts/theme-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FormLabel } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import type { Service } from "@/types/index";
import { useState, useEffect } from "react";
import { CreditCard, Banknote, ArrowRight, Wallet, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  setCommissionAmount: (amount: number) => void;
  onBack: () => void;
  onSubmit: () => void;
}

export function PaymentStep({
  isSubmitting,
  selectedServices,
  paymentData,
  setPaymentData,
  setCommissionAmount,
  onBack,
  onSubmit,
}: PaymentStepProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [totalWithCommission, setTotalWithCommission] = useState<number>(0);
  
  const totalPackageAmount = selectedServices.reduce(
    (total, service) => total + (service.price || 0),
    0
  );
  
  const netCreditCardPaid = parseFloat(paymentData.credit_card_paid.replace(/[^\d.-]/g, '')) || 0;
  const cashPaid = parseFloat(paymentData.cash_paid.replace(/[^\d.-]/g, '')) || 0;
  
  const calculatedCommission = netCreditCardPaid > 0 ? netCreditCardPaid * 0.1 : 0;

  // This is what's applied to the package
  const totalAmountAppliedToPackage = netCreditCardPaid + cashPaid;
  // This is what the member pays including commission
  const totalPaidByMember = cashPaid + netCreditCardPaid + calculatedCommission;
  const remainingAmount = totalPackageAmount - totalAmountAppliedToPackage;

  useEffect(() => {
    if (netCreditCardPaid > 0) {
      const commission = netCreditCardPaid * 0.1;
      setCommissionAmount(parseFloat(commission.toFixed(2)));
      setTotalWithCommission(netCreditCardPaid + commission);
    } else {
      setCommissionAmount(0);
      setTotalWithCommission(0);
    }
  }, [netCreditCardPaid, setCommissionAmount]);

  const setFullCashPayment = (): void => {
    if (totalPackageAmount === 0) {
      toast.error("Lütfen önce paket seçin.");
      return;
    }
    setPaymentData({
      ...paymentData,
      cash_paid: totalPackageAmount.toString(),
      credit_card_paid: ""
    });
    setCommissionAmount(0);
    setTotalWithCommission(0);
    toast.success("Tüm tutar nakit ödeme olarak ayarlandı");
  };

  const setRemainingCashPayment = (): void => {
    const remainingAmount = Math.max(0, totalPackageAmount - netCreditCardPaid);
    if (remainingAmount <= 0) {
      toast.info("Kalan ödeme tutarı yok.");
      return;
    }
    setPaymentData({
      ...paymentData,
      cash_paid: remainingAmount.toString()
    });
    toast.success(`Kalan tutar nakit ödeme olarak ayarlandı: ${remainingAmount.toFixed(2)} ₺`);
  };
  
  const handleCreditCardNetAmountChange = (value: string): void => {
    // Store the raw input value in the state
    setPaymentData({
      ...paymentData,
      credit_card_paid: value,
    });
    
    // Process for calculations
    const netAmount = parseFloat(value.replace(/[^\d.-]/g, '')) || 0;
    
    if (netAmount > 0) {
      const commission = netAmount * 0.1;
      setCommissionAmount(parseFloat(commission.toFixed(2)));
      setTotalWithCommission(netAmount + commission);
    } else {
      setCommissionAmount(0);
      setTotalWithCommission(0);
    }
  };

  const setFullCardPayment = (): void => {
    if (totalPackageAmount === 0) {
      toast.error("Lütfen önce paket seçin.");
      return;
    }

    // Set the net amount as the full package price
    const netAmount = totalPackageAmount;
    const commission = netAmount * 0.1;
    const grossAmount = netAmount + commission;
    
    setPaymentData({
      ...paymentData,
      credit_card_paid: netAmount.toString(),
      cash_paid: ""
    });
    setCommissionAmount(parseFloat(commission.toFixed(2)));
    setTotalWithCommission(grossAmount);

    toast.success("Kredi kartı için tam ödeme hesaplandı");
  };

  const setRemainingCardPayment = (): void => {
    const remainingForCard = Math.max(0, totalPackageAmount - cashPaid);
    if (remainingForCard <= 0) {
      toast.info("Kalan ödeme tutarı yok.");
      setPaymentData({ ...paymentData, credit_card_paid: "" });
      setCommissionAmount(0);
      setTotalWithCommission(0);
      return;
    }

    // Set the net amount as the remaining package price
    const netAmount = remainingForCard;
    const commission = netAmount * 0.1;
    const grossAmount = netAmount + commission;
    
    setPaymentData({
      ...paymentData,
      credit_card_paid: netAmount.toString(),
    });
    setCommissionAmount(parseFloat(commission.toFixed(2)));
    setTotalWithCommission(grossAmount);

    toast.success("Kredi kartı için kalan tutar hesaplandı");
  };

  const handleContinue = () => {
    if (totalAmountAppliedToPackage === 0 && totalPackageAmount > 0 && selectedServices.length > 0) {
      toast.error("Ödeme bilgisi girilmedi", {
        description: "Lütfen nakit veya kredi kartı ile ödeme alınız."
      });
      return;
    }
    
    if (remainingAmount > 0.01 && totalPackageAmount > 0) {
      toast.warning("Eksik ödeme var!", {
        description: "Devam etmek için tekrar tıklayın veya ödemeyi tamamlayın",
        action: {
          label: "Devam Et",
          onClick: () => onSubmit()
        }
      });
      return;
    }    
    onSubmit();
  };

  return (
    <Card className={`p-4 space-y-4 ${isDark ? "bg-gray-900/40" : "bg-white"}`}>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Ödeme Adımı</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Paket Tutarı:</span>
            <span className="text-lg font-bold text-primary">
              {totalPackageAmount.toLocaleString("tr-TR")} ₺
            </span>
          </div>
        </div>
        
        <Separator />
        <div className="grid grid-cols-1 gap-4 items-end">
          <div>
            <FormLabel htmlFor="payment_date" className="text-sm font-medium">Ödeme Tarihi</FormLabel>
            <Input
              id="payment_date"
              type="date"
              value={paymentData.payment_date}
              onChange={(e) =>
                setPaymentData({ ...paymentData, payment_date: e.target.value })
              }
              className={cn("h-10", isDark ? "bg-gray-800 border-gray-700" : "bg-white")}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-4">
            <Card className={cn("p-4", isDark ? "bg-gray-800/70 border-gray-700" : "bg-gray-50 border-gray-200")}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Banknote className={cn("h-5 w-5", isDark ? "text-green-400" : "text-green-600")} />
                  <FormLabel htmlFor="cash_paid" className="text-sm font-medium m-0">Nakit Ödeme</FormLabel>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs px-2"
                    onClick={setRemainingCashPayment}
                    disabled={totalPackageAmount === 0}
                    title="Kalan tutarı nakit olarak öde"
                  >
                    Kalanı Öde
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs px-2"
                    onClick={setFullCashPayment}
                    disabled={totalPackageAmount === 0}
                    title="Tüm paket tutarını nakit olarak ayarla"
                  >
                    Tamamını Öde
                  </Button>
                </div>
              </div>
              <Input
                id="cash_paid"
                type="text"
                inputMode="decimal"
                placeholder="Miktar giriniz"
                value={paymentData.cash_paid}
                onChange={(e) =>
                  setPaymentData({ ...paymentData, cash_paid: e.target.value })
                }
                className={cn("h-10 text-base", isDark ? "bg-gray-700 border-gray-600" : "bg-white")}
              />
            </Card>

            <Card className={cn("p-4", isDark ? "bg-gray-800/70 border-gray-700" : "bg-gray-50 border-gray-200")}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CreditCard className={cn("h-5 w-5", isDark ? "text-blue-400" : "text-blue-600")} />
                  <FormLabel htmlFor="credit_card_paid" className="text-sm font-medium m-0">Kredi Kartı ile Ödeme</FormLabel>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs px-2"
                    onClick={setRemainingCardPayment}
                    disabled={totalPackageAmount === 0}
                    title="Kalan tutarı komisyon dahil kredi kartı ile ödemek için hesapla"
                  >
                    Kalanı Öde
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs px-2"
                    onClick={setFullCardPayment}
                    disabled={totalPackageAmount === 0}
                    title="Tüm tutarı komisyon dahil kredi kartı ile ödemek için hesapla"
                  >
                    Tamamını Öde
                  </Button>
                </div>
              </div>

              <div>
                <FormLabel htmlFor="credit_card_paid" className="text-xs text-muted-foreground">Net Tutar (Komisyon Hariç)</FormLabel>
                <Input
                  id="credit_card_paid"
                  type="text"
                  inputMode="decimal"
                  placeholder="Miktar giriniz"
                  value={paymentData.credit_card_paid}
                  onChange={(e) => handleCreditCardNetAmountChange(e.target.value)}
                  className={cn("h-10 text-base mb-2", isDark ? "bg-gray-700 border-gray-600" : "bg-white")}
                />
              </div>

              {netCreditCardPaid > 0 && (
                <div className="space-y-1 mt-2 text-xs">
                  <div className={`flex justify-between p-1.5 rounded-sm ${isDark ? "bg-gray-700/50" : "bg-gray-100"}`}>
                    <span className="text-muted-foreground">Hesaplanan Komisyon (%10):</span>
                    <span className={isDark ? "text-amber-400" : "text-amber-600"}>
                      {calculatedCommission.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                    </span>
                  </div>
                  <div className={`flex justify-between p-1.5 rounded-sm ${isDark ? "bg-gray-700/50" : "bg-gray-100"}`}>
                    <span className="text-muted-foreground">Komisyon Dahil Toplam:</span>
                    <span className={isDark ? "text-sky-400" : "text-sky-600 font-medium"}>
                      {totalWithCommission.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                    </span>
                  </div>
                </div>
              )}
            </Card>
          </div>

          <Card className={cn("p-4 space-y-3", isDark ? "bg-gray-800/70 border-gray-700" : "bg-gray-50 border-gray-200")}>
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Wallet className={cn("h-5 w-5", isDark ? "text-primary" : "text-primary")} />
              Ödeme Özeti
            </h4>
            <div className="space-y-2 text-sm">
              {/* Combined payment summary and total section */}
              <div className={cn(
                "rounded-md border-2 mt-3 mb-2 overflow-hidden",
                isDark 
                  ? "border-blue-700" 
                  : "border-blue-200"
              )}>
                
                
                {/* Payment details */}
                <div className={cn(
                  "p-3",
                  isDark ? "bg-blue-900/20" : "bg-blue-50/50"
                )}>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1">
                      <CreditCard className={cn("h-4 w-4", isDark ? "text-blue-400" : "text-blue-600")} />
                      <span className="font-medium">K.K. Toplam:</span>
                    </span>
                      <span className={cn(isDark ? "text-sky-400" : "text-sky-600", "font-medium")}>
                        {totalWithCommission.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                      </span>
                    </div>
                    
                    {/* Cash Total */}
                    <div className="flex justify-between items-center mt-1">
                      <span className="flex items-center gap-1">
                        <Banknote className={cn("h-4 w-4", isDark ? "text-green-400" : "text-green-600")} />
                        <span className="font-medium">Nakit Toplam:</span>
                      </span>
                      <span className="font-medium">{cashPaid.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺</span>
                    </div>
                    
                    {/* General Total */}
                    <div className={cn(
                      "flex justify-between items-center pt-2 mt-2 border-t",
                      isDark ? "border-blue-800" : "border-blue-200"
                    )}>
                      <span className="text-base font-bold">Genel Toplam:</span>
                      <span className="text-xl font-bold">
                        {totalPaidByMember.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Less prominent remaining amount section */}
              {remainingAmount !== 0 && (
              <div className="flex justify-between text-sm mt-2 px-1">
                <span className={cn(
                  "font-medium",
                  remainingAmount > 0.01 
                    ? (isDark ? "text-red-400" : "text-red-600") 
                    : remainingAmount < -0.01 
                      ? (isDark ? "text-yellow-400" : "text-yellow-600") 
                      : (isDark ? "text-green-400" : "text-green-600")
                )}>
                  {remainingAmount > 0.01 ? "Kalan Tutar:" :
                   remainingAmount < -0.01 ? "Fazla Ödeme:" :
                   ""}
                </span>
                <span className={cn(
                  "font-medium",
                  remainingAmount > 0.01 
                    ? (isDark ? "text-red-400" : "text-red-600") 
                    : remainingAmount < -0.01 
                      ? (isDark ? "text-yellow-400" : "text-yellow-600") 
                      : (isDark ? "text-green-400" : "text-green-600")
                )}>
                  {Math.abs(remainingAmount).toLocaleString("tr-TR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })} ₺
                </span>
              </div>
              )}
            </div>
          </Card>
        </div>

        <div className="flex justify-between mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isSubmitting}
            className="flex items-center gap-1.5"
          >
            <ArrowLeft className="h-4 w-4"/>
             Geri
          </Button>
          <Button
            type="button"
            disabled={isSubmitting || (totalPackageAmount > 0 && totalAmountAppliedToPackage < 0.01 && selectedServices.length > 0) }
            className="min-w-[130px] flex items-center gap-1.5 bg-green-900 hover:bg-green-800 text-white"
            onClick={handleContinue}
          >
            {isSubmitting ? "İşleniyor..." : "Ödemeyi aldım. Önizleme yap"}
            {!isSubmitting && <ArrowRight className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </Card>
  );
}
