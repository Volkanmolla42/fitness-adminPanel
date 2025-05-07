import React, { useState, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  Package2,
  Users,
  Calendar,
  RefreshCw,
  BarChart3,
  CalendarIcon,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
import { MetricCard } from "./MetricCard";
import { TrainerClassesChart } from "./TrainerClassesChart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRange } from "react-day-picker";
import DatePickerWithRange from "@/components/ui/date-picker-with-range";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Database } from "@/types/supabase";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  isWithinInterval,
  endOfDay,
} from "date-fns";

// Types
type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
type Trainer = Database["public"]["Tables"]["trainers"]["Row"];
type Service = Database["public"]["Tables"]["services"]["Row"];
type Member = Database["public"]["Tables"]["members"]["Row"];
type MemberPayment = Database["public"]["Tables"]["member_payments"]["Row"];
type DateRangeType = "all" | "week" | "month" | "year" | "custom";

// Props type definitions
interface PerformanceMetricsProps {
  metrics?: {
    totalPackages: number;
    uniqueMembers: number;
    totalAppointments: number;
    packageChangeRate: number;
    packageRenewalChangeRate: number;
    memberChangeRate: number;
    appointmentChangeRate: number;
    comparisonLabel: string;
    packageRenewalCount: number;
    membersWithRenewalCount: number;
    membersWithRenewalPercentage: number;
    membersWithRenewalPercentageChangeRate: number;
    uniqueMembersWithAppointments: number;
  };
  appointments: Appointment[];
  trainers: Trainer[];
  services: Service[];
  members?: Member[];
  memberPayments?: MemberPayment[];
  selectedDateRange?: DateRangeType;
  setSelectedDateRange?: (value: DateRangeType) => void;
  customDateRange?: DateRange;
  handleDateRangeChange?: (range: DateRange | undefined) => void;
}

// Date filter component
const DateRangeFilter: React.FC<{
  selectedDateRange: DateRangeType;
  setSelectedDateRange: (value: DateRangeType) => void;
  customDateRange?: DateRange;
  handleDateRangeChange: (range: DateRange | undefined) => void;
  dateRangeText: string;
}> = ({ 
  selectedDateRange, 
  setSelectedDateRange, 
  customDateRange, 
  handleDateRangeChange,
  dateRangeText
}) => {
  const dateRangeOptions = [
    { value: "all", label: "Tüm Zamanlar" },
    { value: "week", label: "Bu Hafta" },
    { value: "month", label: "Bu Ay" },
    { value: "year", label: "Bu Yıl" },
    { value: "custom", label: "Özel Tarih Aralığı" },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 h-9 px-3 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <CalendarIcon className="h-4 w-4 text-gray-900 dark:text-white" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">{dateRangeText}</span>
          <ChevronDown className="h-4 w-4 text-gray-900 dark:text-white ml-1" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-0" align="end">
        <div className="border-b border-gray-200 dark:border-gray-700 p-3">
          <h4 className="font-medium text-[15px] text-gray-900 dark:text-white">Tarih Aralığı</h4>
          <p className="text-[13px] text-gray-900 dark:text-white mt-1">
            Raporları filtrelemek için bir tarih aralığı seçin
          </p>
        </div>
        <div className="p-3 space-y-3">
          <Select
            value={selectedDateRange}
            onValueChange={(value: DateRangeType) => setSelectedDateRange(value)}
          >
            <SelectTrigger className="h-9 w-full text-[14px]">
              <SelectValue placeholder="Tarih aralığı seçin" />
            </SelectTrigger>
            <SelectContent>
              {dateRangeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value} className="text-[14px]">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedDateRange === "custom" && (
            <div className="mt-2">
              <DatePickerWithRange date={customDateRange} setDate={handleDateRangeChange} />
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

/**
 * Main PerformanceMetrics component
 */
export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({
  metrics: initialMetrics,
  appointments,
  trainers,
  services,
  members = [],
  memberPayments = [],
  selectedDateRange: propSelectedDateRange,
  setSelectedDateRange: propSetSelectedDateRange,
  customDateRange: propCustomDateRange,
  handleDateRangeChange: propHandleDateRangeChange
}) => {
  // Internal state if props aren't provided
  const [internalSelectedDateRange, setInternalSelectedDateRange] = useState<DateRangeType>("year");
  const [internalCustomDateRange, setInternalCustomDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });
  const [internalValidDateRange, setInternalValidDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });

  // Use props if provided, otherwise use internal state
  const selectedDateRange = propSelectedDateRange ?? internalSelectedDateRange;
  const setSelectedDateRange = propSetSelectedDateRange ?? setInternalSelectedDateRange;
  const customDateRange = propCustomDateRange ?? internalCustomDateRange;

  // Internal handler if prop isn't provided
  const handleInternalDateRangeChange = useCallback((range: DateRange | undefined) => {
    setInternalCustomDateRange(range || { from: undefined, to: undefined });
    
    if (range?.from && range?.to) {
      setInternalValidDateRange(range);
    }
  }, []);

  const handleDateRangeChange = propHandleDateRangeChange ?? handleInternalDateRangeChange;

  // Date range calculation
  const dateRange = useMemo(() => {
    if (selectedDateRange === "all") {
      return null;
    } else if (
      selectedDateRange === "custom" &&
      (propCustomDateRange?.from || internalValidDateRange?.from) &&
      (propCustomDateRange?.to || internalValidDateRange?.to)
    ) {
      const validRange = propCustomDateRange?.from ? propCustomDateRange : internalValidDateRange;
      return {
        start: validRange.from!,
        end: endOfDay(validRange.to!),
      };
    } else {
      const now = new Date();
      return {
        start:
          selectedDateRange === "week"
            ? startOfWeek(now, { locale: tr })
            : selectedDateRange === "month"
            ? startOfMonth(now)
            : startOfYear(now),
        end:
          selectedDateRange === "week"
            ? endOfWeek(now, { locale: tr })
            : selectedDateRange === "month"
            ? endOfMonth(now)
            : endOfYear(now),
      };
    }
  }, [selectedDateRange, propCustomDateRange, internalValidDateRange]);

  // Helper function to format date range for display
  const formattedDateRange = useMemo(() => {
    if (!dateRange) return "Tüm Zamanlar";
    
    return `${format(dateRange.start, 'dd MMM yyyy', { locale: tr })} - ${format(dateRange.end, 'dd MMM yyyy', { locale: tr })}`;
  }, [dateRange]);

  // Comparison date range for trend calculation
  const comparisonDateRange = useMemo(() => {
    if (selectedDateRange === "all" || !dateRange) return null;

    if (selectedDateRange === "custom" && dateRange) {
      const dayDiff = Math.round(
        (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)
      );
      const comparisonStart = new Date(dateRange.start);
      comparisonStart.setDate(comparisonStart.getDate() - dayDiff - 1);
      const comparisonEnd = new Date(dateRange.start);
      comparisonEnd.setDate(comparisonEnd.getDate() - 1);

      return {
        start: comparisonStart,
        end: comparisonEnd,
      };
    } else {
      if (selectedDateRange === "week") {
        const lastWeekStart = new Date(dateRange.start);
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);
        const lastWeekEnd = new Date(dateRange.end);
        lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);

        return {
          start: lastWeekStart,
          end: lastWeekEnd,
        };
      } else if (selectedDateRange === "month") {
        const now = new Date();
        const lastMonthStart = startOfMonth(
          new Date(now.getFullYear(), now.getMonth() - 1)
        );
        const lastMonthEnd = endOfMonth(
          new Date(now.getFullYear(), now.getMonth() - 1)
        );

        return {
          start: lastMonthStart,
          end: lastMonthEnd,
        };
      } else { // year
        const now = new Date();
        const lastYearStart = startOfYear(new Date(now.getFullYear() - 1));
        const lastYearEnd = endOfYear(new Date(now.getFullYear() - 1));

        return {
          start: lastYearStart,
          end: lastYearEnd,
        };
      }
    }
  }, [selectedDateRange, dateRange]);

  // Helper function to check if a date is within the selected range
  const isInDateRange = useCallback((date: Date) => {
    if (!dateRange) return true;
    return isWithinInterval(date, {
      start: dateRange.start,
      end: dateRange.end,
    });
  }, [dateRange]);

  // Helper function to check if a date is within the comparison range
  const isInComparisonDateRange = useCallback((date: Date) => {
    if (!comparisonDateRange) return false;
    return isWithinInterval(date, {
      start: comparisonDateRange.start,
      end: comparisonDateRange.end,
    });
  }, [comparisonDateRange]);

  // Filter appointments based on selected date range
  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const appointmentDate = new Date(appointment.date);
      return isInDateRange(appointmentDate);
    });
  }, [appointments, isInDateRange]);

  // Calculate comparison metrics
  const comparisonAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const appointmentDate = new Date(appointment.date);
      return isInComparisonDateRange(appointmentDate);
    });
  }, [appointments, isInComparisonDateRange]);

  // Calculate filtered members and payments
  const filteredMembers = useMemo(() => {
    if (members.length === 0) return [];
    return members.filter((member) => {
      const memberCreationDate = new Date(member.created_at);
      return isInDateRange(memberCreationDate);
    });
  }, [members, isInDateRange]);

  const comparisonMembers = useMemo(() => {
    if (members.length === 0) return [];
    return members.filter((member) => {
      const memberCreationDate = new Date(member.created_at);
      return isInComparisonDateRange(memberCreationDate);
    });
  }, [members, isInComparisonDateRange]);

  const filteredPayments = useMemo(() => {
    if (memberPayments.length === 0) return [];
    return memberPayments.filter((payment) => {
      const paymentDate = new Date(payment.created_at);
      return isInDateRange(paymentDate);
    });
  }, [memberPayments, isInDateRange]);

  const comparisonPayments = useMemo(() => {
    if (memberPayments.length === 0) return [];
    return memberPayments.filter((payment) => {
      const paymentDate = new Date(payment.created_at);
      return isInComparisonDateRange(paymentDate);
    });
  }, [memberPayments, isInComparisonDateRange]);

  // Calculate metrics based on filtered data
  const calculatedMetrics = useMemo(() => {
    // Count unique members with appointments
    const membersWithAppointments = new Set<string>();
    filteredAppointments.forEach(appointment => {
      if (appointment.member_id) {
        membersWithAppointments.add(appointment.member_id.toString());
      }
    });
    const uniqueMembersWithAppointments = membersWithAppointments.size;

    // Package renewals
    const packageRenewalDetails = new Map<string, {
      memberName: string;
      packageName: string;
      firstPurchaseDate: Date;
      renewalDates: Date[];
    }>();

    // We'll use all payments to determine first purchase vs renewal
    if (memberPayments.length > 0) {
      const sortedPayments = [...memberPayments].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      sortedPayments.forEach((payment) => {
        const paymentDate = new Date(payment.created_at);
        const memberPackageKey = `${payment.member_name}-${payment.package_name}`;

        if (!packageRenewalDetails.has(memberPackageKey)) {
          packageRenewalDetails.set(memberPackageKey, {
            memberName: payment.member_name,
            packageName: payment.package_name,
            firstPurchaseDate: paymentDate,
            renewalDates: []
          });
        } else {
          const details = packageRenewalDetails.get(memberPackageKey)!;
          details.renewalDates.push(paymentDate);
        }
      });
    }

    // Count renewals in the selected date range
    let packageRenewalCount = 0;
    const membersWithRenewals = new Set<string>();

    packageRenewalDetails.forEach((details) => {
      details.renewalDates.forEach(renewalDate => {
        if (isInDateRange(renewalDate)) {
          packageRenewalCount++;
          membersWithRenewals.add(details.memberName);
        }
      });
    });

    // Count renewals in the comparison date range
    let comparisonPackageRenewalCount = 0;
    packageRenewalDetails.forEach((details) => {
      details.renewalDates.forEach(renewalDate => {
        if (isInComparisonDateRange(renewalDate)) {
          comparisonPackageRenewalCount++;
        }
      });
    });

    const membersWithRenewalCount = membersWithRenewals.size;
    const membersWithRenewalPercentage = 
      filteredMembers.length > 0 
        ? (membersWithRenewalCount / filteredMembers.length) * 100 
        : initialMetrics?.membersWithRenewalPercentage || 0;

    // Calculate change rates
    const calculateChangeRate = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const totalPackages = filteredPayments.length;
    const comparisonPackages = comparisonPayments.length;

    const packageChangeRate = calculateChangeRate(
      totalPackages,
      comparisonPackages
    );
    
    const packageRenewalChangeRate = calculateChangeRate(
      packageRenewalCount,
      comparisonPackageRenewalCount
    );
    
    const memberChangeRate = calculateChangeRate(
      filteredMembers.length,
      comparisonMembers.length
    );
    
    const appointmentChangeRate = calculateChangeRate(
      filteredAppointments.length,
      comparisonAppointments.length
    );

    const comparisonLabel = selectedDateRange === "week" 
      ? "Önceki haftaya göre" 
      : selectedDateRange === "month" 
      ? "Önceki aya göre" 
      : selectedDateRange === "year" 
      ? "Önceki yıla göre" 
      : selectedDateRange === "custom" 
      ? "Önceki döneme göre"
      : "Tüm zamana göre";

    return {
      totalPackages,
      uniqueMembers: filteredMembers.length > 0 ? filteredMembers.length : initialMetrics?.uniqueMembers || 0,
      totalAppointments: filteredAppointments.length,
      packageChangeRate,
      packageRenewalChangeRate,
      memberChangeRate,
      appointmentChangeRate,
      comparisonLabel,
      packageRenewalCount,
      membersWithRenewalCount,
      membersWithRenewalPercentage,
      membersWithRenewalPercentageChangeRate: 0, // We're not calculating this for now
      uniqueMembersWithAppointments,
    };
  }, [
    filteredAppointments, 
    comparisonAppointments, 
    filteredMembers, 
    comparisonMembers, 
    filteredPayments, 
    comparisonPayments, 
    isInDateRange, 
    isInComparisonDateRange, 
    memberPayments, 
    selectedDateRange, 
    initialMetrics
  ]);

  // Use calculated metrics if we have enough data, otherwise fall back to initialMetrics
  const metrics = memberPayments.length > 0 ? calculatedMetrics : initialMetrics || {
    totalPackages: 0,
    uniqueMembers: 0,
    totalAppointments: 0,
    packageChangeRate: 0,
    packageRenewalChangeRate: 0,
    memberChangeRate: 0,
    appointmentChangeRate: 0,
    comparisonLabel: "Tüm zamana göre",
    packageRenewalCount: 0,
    membersWithRenewalCount: 0,
    membersWithRenewalPercentage: 0,
    membersWithRenewalPercentageChangeRate: 0,
    uniqueMembersWithAppointments: 0,
  };

  const metricsData = [
    {
      title: "Toplam Satılan Paket",
      value: metrics.totalPackages,
      icon: Package2,
      color: "blue",
      iconColor: "text-blue-600 dark:text-blue-400",
      changeRate: metrics.packageChangeRate,
      changeLabel: metrics.comparisonLabel,
      subInfo: `Üye başı ortalama  ${(metrics.uniqueMembers > 0
        ? metrics.totalPackages / metrics.uniqueMembers
        : 0
      ).toFixed(1)} paket`,
    },
    {
      title: "Yenilenen Paket Sayısı",
      value: metrics.packageRenewalCount,
      icon: RefreshCw,
      color: "cyan",
      iconColor: "text-cyan-600 dark:text-cyan-400",
      changeRate: metrics.packageRenewalChangeRate,
      changeLabel: metrics.comparisonLabel,
      subInfo: `Üyelerin %${metrics.membersWithRenewalPercentage.toFixed(
        1
      )}'i yenileme yapmış`,
    },
    {
      title: "Üye Sayısı",
      value: metrics.uniqueMembers,
      icon: Users,
      color: "purple",
      iconColor: "text-purple-600 dark:text-purple-400",
      changeRate: metrics.memberChangeRate,
      changeLabel: metrics.comparisonLabel,
      subInfo: `${metrics.membersWithRenewalCount} üye yenileme yapmış`,
    },
    {
      title: "Randevu Sayısı",
      value: metrics.totalAppointments,
      icon: Calendar,
      color: "orange",
      iconColor: "text-orange-600 dark:text-orange-400",
      changeRate: metrics.appointmentChangeRate,
      changeLabel: metrics.comparisonLabel,
      subInfo: `Üye başı ortalama  ${(metrics.uniqueMembersWithAppointments > 0
        ? metrics.totalAppointments / metrics.uniqueMembersWithAppointments
        : 0
      ).toFixed(1)} randevu`,
    },
  ];

  return (
    <div className="space-y-4 text-[110%] border border-gray-300 rounded-md dark:border-0 p-4 bg-white dark:bg-gray-800 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-700" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Performans Metrikleri</h2>
        </div>
        <DateRangeFilter
          selectedDateRange={selectedDateRange}
          setSelectedDateRange={setSelectedDateRange}
          customDateRange={customDateRange}
          handleDateRangeChange={handleDateRangeChange}
          dateRangeText={formattedDateRange}
        />
      </div>

      <Card className="bg-white dark:bg-gray-800 overflow-hidden">
        <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700">
          <CardDescription className="text-[13px] text-gray-900 dark:text-white mt-1">
            {formattedDateRange}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-6 border-none">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {metricsData.map((item, index) => (
              <MetricCard
                key={index}
                title={item.title}
                value={item.value}
                icon={item.icon}
                color={item.color}
                iconColor={item.iconColor}
                changeRate={item.changeRate}
                changeLabel={item.changeLabel}
                subInfo={item.subInfo}
              />
            ))}
          </div>
        </CardContent>
      </Card>
      
      <div className="mt-4">
        <TrainerClassesChart
          appointments={filteredAppointments}
          trainers={trainers}
          services={services}
        />
      </div>
    </div>
  );
};
