import { useTheme } from "@/contexts/theme-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Service } from "@/types/index";
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import type { Database } from "@/types/supabase";
import { formatDate } from "@/lib/utils";
import { PackageCheckIcon, Table2, Wallet} from "lucide-react";

type Member = Database["public"]["Tables"]["members"]["Row"];
type MemberInput = Omit<Member, "id" | "created_at">;

interface PaymentData {
  credit_card_paid: string;
  cash_paid: string;
  payment_date: string;
}

interface ReviewStepProps {
  form: UseFormReturn<MemberInput>;
  isSubmitting: boolean;
  selectedServices: Service[];
  paymentData: PaymentData;
  commissionAmount?: number;
  onBack: () => void;
  onSubmit: () => void;
}



export function ReviewStep({
  form,
  isSubmitting,
  selectedServices,
  paymentData,
  commissionAmount = 0,
  onBack,
  onSubmit,
}: ReviewStepProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const formValues = form.getValues();
  const [showDatabasePreview, setShowDatabasePreview] = useState<boolean>(false);

  const totalPackageAmount = selectedServices.reduce(
    (total, service) => total + (service.price || 0),
    0
  );
  
  const creditCardPaid = parseFloat(paymentData.credit_card_paid) || 0;
  const cashPaid = parseFloat(paymentData.cash_paid) || 0;
  
  // Kredi kartı ödeme tutarına komisyon ekle
  const creditCardWithCommission = creditCardPaid + (commissionAmount || 0);
  
  // Toplam ödeme = Kredi kartı (komisyon dahil) + Nakit
  const totalPaidWithCommission = creditCardWithCommission + cashPaid;
  
  // Pakete uygulanan miktar (komisyonsuz)
  const totalAppliedToPackage = creditCardPaid + cashPaid;
  
  const remainingAmount = totalPackageAmount - totalAppliedToPackage;
  
  // Veritabanına kaydedilecek ödeme kayıtlarını hesapla
  const databaseRecords = selectedServices.map(service => {
    // Her paketin toplam tutara oranını hesapla
    const ratio = service.price ? service.price / totalPackageAmount : 0;
    
    // Komisyon hesapla (toplam komisyonun paket için olan kısmı)
    const packageCommission = Number((commissionAmount * ratio).toFixed(2));
    
    // Bu orana göre ödeme miktarlarını dağıt
    const packageCreditCardPaid = Number((creditCardPaid * ratio).toFixed(2));
    // Kredi kartına komisyonu ekle
    const packageCreditCardWithCommission = packageCreditCardPaid + packageCommission;
    const packageCashPaid = Number((cashPaid * ratio).toFixed(2));
    
    return {
      credit_card_paid: packageCreditCardWithCommission,
      cash_paid: packageCashPaid,
      package_name: service.name
    };
  });

  return (
    <Card className="p-5 space-y-6 shadow-md">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-primary">Üyelik Özeti</h2>
        <div className="px-3 py-1.5 bg-primary/10 rounded-full text-xs font-medium text-primary">
          Son Adım
        </div>
      </div>
      
      <div className="space-y-5">
        
        {/* Üye Bilgileri */}
        <div className={`p-0 rounded-xl overflow-hidden border border-gray-400 ${isDark ? "bg-gray-800/30" : "bg-white"} shadow-sm`}>
          <div className={`px-4 py-3 flex items-center justify-between ${isDark ? "bg-gray-800/80" : "bg-gray-50"}`}>
            <h3 className="text-base font-semibold flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              Üye Bilgileri
            </h3>
            <div className={`text-xs font-medium px-2 py-1 rounded-full ${formValues.membership_type === "vip" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"}`}>
              {formValues.membership_type === "vip" ? "VIP Üyelik" : "Standart Üyelik"}
            </div>
          </div>
          
          <div className="p-4">
            <div className="flex items-center space-x-4 mb-4">
              <img src={formValues.avatar_url} alt="üye avatarı" className="h-12 w-12 rounded-full bg-primary/10" />
              <div>
                <h4 className="text-lg font-bold">{formValues.first_name} {formValues.last_name}</h4>
                <p className="text-sm text-muted-foreground">Üyelik Başlangıç: {formatDate(formValues.start_date)}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-3 border-t">
              <div className="flex items-start">
                <div className="mr-2 mt-0.5 text-muted-foreground">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Telefon</p>
                  <p className="text-sm">{formValues.phone || "Belirtilmedi"}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="mr-2 mt-0.5 text-muted-foreground">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">E-posta</p>
                  <p className="text-sm">{formValues.email || "Belirtilmedi"}</p>
                </div>
              </div>
            </div>
            
            {formValues.notes && (
              <div className="mt-4 pt-3 border-t">
                <div className="flex items-start">
                  <div className="mr-2 mt-0.5 text-muted-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 3v4a1 1 0 0 0 1 1h4"></path>
                      <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z"></path>
                      <line x1="9" y1="9" x2="10" y2="9"></line>
                      <line x1="9" y1="13" x2="15" y2="13"></line>
                      <line x1="9" y1="17" x2="15" y2="17"></line>
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Notlar</p>
                    <p className="text-sm">{formValues.notes}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Seçilen Paketler */}
        <div className={`p-0 rounded-xl overflow-hidden  border border-gray-400 ${isDark ? "bg-gray-800/30" : "bg-white"} shadow-sm`}>
          <div className={`px-4 py-3 flex items-center justify-between ${isDark ? "bg-gray-800/80" : "bg-gray-50"}`}>
            <h3 className="text-base font-semibold flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                <line x1="7" y1="7" x2="7.01" y2="7"></line>
              </svg>
              Seçilen Paketler
            </h3>
            <div className="text-sm font-bold text-primary flex items-center gap-1">
              <span>{selectedServices.length}</span>
              <span className="text-xs">Paket</span>
            </div>
          </div>
          
          <div className="p-4">
            <div className="space-y-3 mb-4">
              {selectedServices.map((service, index) => (
                <div
                  key={`review-${service.id}-${index}`}
                  className={`flex justify-between items-center p-3 rounded-lg ${isDark ? "bg-gray-800/50" : "bg-gray-50"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? "bg-gray-700" : "bg-primary/10"}`}>
                      <PackageCheckIcon className="w-5 h-5 text-primary"/>
                    </div>
                    <div>
                      <div className="font-semibold">{service.name}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                            <path d="M7 10h5"></path>
                            <path d="M7 14h3"></path>
                          </svg>
                          {service.session_count} Seans
                        </span>
                        <span className="flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                          </svg>
                          {service.duration} Dk
                        </span>
                        <span className="flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                          </svg>
                          {service.max_participants} Kişi
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-base font-bold text-primary">
                    {service.price?.toLocaleString("tr-TR")} ₺
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-between items-center px-4 py-3 rounded-lg bg-primary/10 text-primary">
              <span className="font-semibold">Toplam Paket Tutarı</span>
              <span className="text-lg font-bold">{totalPackageAmount.toLocaleString("tr-TR")} ₺</span>
            </div>
          </div>
        </div>
        
        {/* Ödeme Bilgileri */}
        <div className={`p-0 rounded-xl overflow-hidden  border border-gray-400 ${isDark ? "bg-gray-800/30" : "bg-white"} shadow-sm`}>
          <div className={`px-4 py-3 flex items-center justify-between ${isDark ? "bg-gray-800/80" : "bg-gray-50"}`}>
            <h3 className="text-base font-semibold flex items-center gap-2">
              <Wallet className="h-4 w-4"/>
              Ödeme Bilgileri
            </h3>
            <div className="text-xs px-2 py-1 rounded bg-primary/10 font-medium text-primary">
              {formatDate(paymentData.payment_date)}
            </div>
          </div>
          
          <div className="p-4">
            {/* Ödeme Yöntemleri */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className={`p-3 rounded-lg ${isDark ? "bg-gray-800/50" : "bg-gray-50"}`}>
                <div className="flex items-center gap-2 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={creditCardPaid > 0 ? "text-primary" : "text-muted-foreground"}>
                    <rect width="20" height="14" x="2" y="5" rx="2"></rect>
                    <line x1="2" x2="22" y1="10" y2="10"></line>
                  </svg>
                  <span className="font-medium">Kredi Kartı</span>
                </div>
                <div className="mb-1">
                  <span className={`text-lg font-bold ${creditCardPaid > 0 ? "text-primary" : "text-muted-foreground"}`}>
                    {creditCardPaid > 0 ? creditCardWithCommission.toLocaleString("tr-TR") + " ₺" : "-"}
                  </span>
                </div>
                {commissionAmount > 0 && creditCardPaid > 0 && (
                  <div className="flex text-xs text-muted-foreground gap-2">
                    <span>Net: {creditCardPaid.toLocaleString("tr-TR")} ₺</span>
                    <span>+</span>
                    <span>Komisyon: {commissionAmount.toFixed(2)} ₺</span>
                  </div>
                )}
              </div>
              
              <div className={`p-3 rounded-lg ${isDark ? "bg-gray-800/50" : "bg-gray-50"}`}>
                <div className="flex items-center gap-2 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cashPaid > 0 ? "text-primary" : "text-muted-foreground"}>
                    <rect width="20" height="12" x="2" y="6" rx="2"></rect>
                    <circle cx="12" cy="12" r="2"></circle>
                    <path d="M6 12h.01M18 12h.01"></path>
                  </svg>
                  <span className="font-medium">Nakit</span>
                </div>
                <div>
                  <span className={`text-lg font-bold ${cashPaid > 0 ? "text-primary" : "text-muted-foreground"}`}>
                    {cashPaid > 0 ? cashPaid.toLocaleString("tr-TR") + " ₺" : "-"}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Toplam Ödeme */}
            <div className="mt-2 p-4 rounded-lg bg-primary/10">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-medium text-primary mb-1">Toplam Ödenen</h4>
                  <p className="text-xs text-primary/80">{remainingAmount > 0 ? `Kalan: ${remainingAmount.toLocaleString("tr-TR")} ₺` : "Tam ödeme yapıldı"}</p>
                </div>
                <div className="text-xl font-bold text-primary">
                  {totalPaidWithCommission.toLocaleString("tr-TR")} ₺
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ödeme Dağılım Detayları */}
      <div className={`p-0 rounded-xl overflow-hidden  border border-gray-400 ${isDark ? "bg-gray-800/30" : "bg-white"} shadow-sm mt-6`}>
        <div className={`px-4 py-3 flex items-center justify-between ${isDark ? "bg-gray-800/80" : "bg-gray-50"}`}>
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Table2/>
            Ödeme Dağılımı
          </h3>
          <Button 
            type="button" 
            variant="ghost"
            size="sm"
            className="h-8 text-xs flex items-center gap-1"
            onClick={() => setShowDatabasePreview(!showDatabasePreview)}
          >
            {showDatabasePreview ? "Gizle" : "Göster"}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {showDatabasePreview ? (
                <path d="m18 15-6-6-6 6" />
              ) : (
                <path d="m6 9 6 6 6-6" />
              )}
            </svg>
          </Button>
        </div>
        
        {showDatabasePreview && (
          <div className="p-4">
            <p className="text-xs text-muted-foreground mb-3">Her paket için ödeme bilgileri aşağıdaki şekilde ayrılacaktır. Tüm ödemeler komisyon dahil olarak kaydedilecektir.</p>
            <div className="overflow-x-auto">
              <table className={`w-full text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                <thead>
                  <tr className={`${isDark ? "bg-gray-800/70" : "bg-gray-100"}`}>
                    <th className="text-left p-2 text-xs font-medium rounded-l-md">Paket Adı</th>
                    <th className="text-right p-2 text-xs font-medium">Kredi Kartı</th>
                    <th className="text-right p-2 text-xs font-medium">Nakit</th>
                    <th className="text-right p-2 text-xs font-medium rounded-r-md">Toplam</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {databaseRecords.map((record, index) => {
                    const packageTotal = record.credit_card_paid + record.cash_paid;
                    return (
                      <tr 
                        key={`db-record-${index}`} 
                        className={`hover:bg-gray-50 dark:hover:bg-gray-800/40`}
                      >
                        <td className="p-2 text-xs font-medium">{record.package_name}</td>
                        <td className="p-2 text-xs text-right">{record.credit_card_paid.toLocaleString("tr-TR")} ₺</td>
                        <td className="p-2 text-xs text-right">{record.cash_paid.toLocaleString("tr-TR")} ₺</td>
                        <td className="p-2 text-xs font-medium text-primary text-right">{packageTotal.toLocaleString("tr-TR")} ₺</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className={`${isDark ? "bg-primary/20" : "bg-primary/10"} font-medium`}>
                    <td className="p-2 text-xs rounded-l-md">TOPLAM</td>
                    <td className="p-2 text-xs text-right">{databaseRecords.reduce((sum, record) => sum + record.credit_card_paid, 0).toLocaleString("tr-TR")} ₺</td>
                    <td className="p-2 text-xs text-right">{databaseRecords.reduce((sum, record) => sum + record.cash_paid, 0).toLocaleString("tr-TR")} ₺</td>
                    <td className="p-2 text-xs font-semibold text-primary text-right rounded-r-md">{databaseRecords.reduce((sum, record) => sum + record.credit_card_paid + record.cash_paid, 0).toLocaleString("tr-TR")} ₺</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
      
      {/* Eylem Butonları */}
      <div className="flex justify-between gap-4 mt-8">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex-1 flex items-center justify-center gap-2 h-12"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
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
          Ödeme Adımına Geri Dön
        </Button>
        <Button
          type="button"
          disabled={isSubmitting}
          className="flex-1 flex items-center justify-center gap-2 h-12 text-base"
          onClick={onSubmit}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Kaydediliyor
            </>
          ) : (
            <>
              Üyeyi Kaydet
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </>
          )}
        </Button>
      </div>
    </Card>
  );
} 