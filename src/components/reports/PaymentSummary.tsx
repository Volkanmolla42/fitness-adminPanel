import React from "react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  Plus,
  ListFilter,
  CreditCard,
  Coins,
  Calculator,
  Calendar,
} from "lucide-react";
import { DateRange } from "react-day-picker";

type PaymentSummaryProps = {
  summary: {
    totalCreditCard: number;
    totalCash: number;
    totalAmount: number;
    currentMonthTotal: number;
    count: number;
    dateRange: DateRange | undefined;
    currentMonth: string;
  };
  setIsAddingPayment: (value: boolean) => void;
};

export const PaymentSummary: React.FC<PaymentSummaryProps> = ({
  summary,
  setIsAddingPayment,
}) => {
  return (
    <div className="flex flex-col w-full mb-4 text-[110%]">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          Ödeme Özeti
        </h3>
        {/* Add Payment Button */}
        <div className="flex justify-end">
          <Button
            onClick={() => setIsAddingPayment(true)}
            className="flex items-center text-[14px]"
          >
            <Plus className="mr-2 h-4 w-4" />
            Yeni Ödeme Ekle
          </Button>
        </div>
      </div>

      {summary.dateRange?.from && summary.dateRange?.to && (
        <p className="text-sm text-gray-900 dark:text-white mb-2">
          {format(summary.dateRange.from, "dd MMMM yyyy", { locale: tr })} -{" "}
          {format(summary.dateRange.to, "dd MMMM yyyy", { locale: tr })}{" "}
          tarihleri arasındaki ödemeler
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 my-2">
        <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <ListFilter className="h-4 w-4 text-gray-900 dark:text-white" />
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              İşlem Sayısı
            </p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {summary.count} ödeme
          </p>
        </div>

        <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="h-4 w-4 text-blue-600" />
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Kredi Kartı
            </p>
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            ₺
            {summary.totalCreditCard
              .toLocaleString("tr-TR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
              .replace(".", ",")}
          </p>
        </div>

        <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Coins className="h-4 w-4 text-amber-600" />
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Nakit
            </p>
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            ₺
            {summary.totalCash
              .toLocaleString("tr-TR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
              .replace(".", ",")}
          </p>
        </div>

        <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Calculator className="h-4 w-4 text-gray-900 dark:text-white" />
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Toplam Ödeme
            </p>
          </div>
          <p className="text-2xl font-bold text-green-700 dark:text-green-500">
            ₺
            {summary.totalAmount
              .toLocaleString("tr-TR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
              .replace(".", ",")}
          </p>
        </div>

        <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="h-4 w-4 text-violet-600" />
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {summary.currentMonth.split(" ")[0]} Ayı Geliri
            </p>
          </div>
          <p className="text-2xl font-bold text-violet-700 dark:text-violet-500">
            ₺
            {summary.currentMonthTotal
              .toLocaleString("tr-TR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
              .replace(".", ",")}
          </p>
        </div>
      </div>
    </div>
  );
};
