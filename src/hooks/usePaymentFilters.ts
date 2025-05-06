import { useState, useEffect, useMemo } from "react";
import { DateRange } from "react-day-picker";
import { 
  parseISO, 
  isWithinInterval, 
  startOfMonth,
  endOfMonth,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
  format
} from "date-fns";
import { tr } from "date-fns/locale";
import { Database } from "@/types/supabase";

type MemberPayment = Database["public"]["Tables"]["member_payments"]["Row"];

export const usePaymentFilters = (allPayments: MemberPayment[]) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [filteredPayments, setFilteredPayments] = useState<MemberPayment[]>(allPayments);

  // Apply filters when dependencies change
  useEffect(() => {
    let filtered = [...allPayments];

    // Text search filter
    if (searchTerm) {
      filtered = filtered.filter((payment) => {
        const searchValue = payment.member_name?.toLowerCase() || "";
        return searchValue.includes(searchTerm.toLowerCase());
      });
    }

    // Date range filter
    if (dateRange?.from) {
      filtered = filtered.filter((payment) => {
        const paymentDate = parseISO(payment.created_at);
        const fromDate = setHours(setMinutes(setSeconds(setMilliseconds(dateRange.from, 0), 0), 0), 0); // Start of day: 00:00:00.000
        const toDate = dateRange.to 
          ? setHours(setMinutes(setSeconds(setMilliseconds(dateRange.to, 999), 59), 59), 23) // End of day: 23:59:59.999
          : setHours(setMinutes(setSeconds(setMilliseconds(fromDate, 999), 59), 59), 23);    // Same day end if no toDate

        return isWithinInterval(paymentDate, {
          start: fromDate,
          end: toDate,
        });
      });
    }

    setFilteredPayments(filtered);
  }, [searchTerm, dateRange, allPayments]);

  // Reset all filters
  const clearFilters = () => {
    setSearchTerm("");
    setDateRange(undefined);
  };

  // Calculate payment summary
  const paymentSummary = useMemo(() => {
    let totalCreditCard = 0;
    let totalCash = 0;
    let totalAmount = 0;
    let currentMonthTotal = 0;
    
    // Calculate current month date range
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    
    // Set times to start and end of day
    const monthStart = setHours(setMinutes(setSeconds(currentMonthStart, 0), 0), 0);
    const monthEnd = setHours(setMinutes(setSeconds(currentMonthEnd, 59), 59), 23);
    
    // Calculate totals for filtered payments
    filteredPayments.forEach(payment => {
      const paymentAmount = payment.credit_card_paid + payment.cash_paid;
      totalCreditCard += payment.credit_card_paid;
      totalCash += payment.cash_paid;
      totalAmount += paymentAmount;
    });
    
    // Calculate current month revenue from all payments
    allPayments.forEach(payment => {
      const paymentDate = parseISO(payment.created_at);
      const paymentAmount = payment.credit_card_paid + payment.cash_paid;
      
      if (isWithinInterval(paymentDate, { start: monthStart, end: monthEnd })) {
        currentMonthTotal += paymentAmount;
      }
    });
    
    return {
      totalCreditCard,
      totalCash,
      totalAmount,
      currentMonthTotal,
      count: filteredPayments.length,
      dateRange,
      currentMonth: format(now, 'MMMM yyyy', { locale: tr })
    };
  }, [filteredPayments, dateRange, allPayments]);

  return {
    searchTerm,
    setSearchTerm,
    dateRange,
    setDateRange,
    filteredPayments,
    clearFilters,
    paymentSummary,
  };
}; 