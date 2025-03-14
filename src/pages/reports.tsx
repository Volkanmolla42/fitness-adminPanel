import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Download,
  RefreshCw,
} from "lucide-react";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  isWithinInterval,
  format,
} from "date-fns";
import { tr } from "date-fns/locale";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  getAppointments,
  getMembers,
  getServices,
  getMemberPayments,
  getTrainers,
} from "@/lib/queries";
import type { Database } from "@/types/supabase";
import { toast } from "sonner";

import { DateRange } from "react-day-picker";
import DatePickerWithRange from "@/components/ui/date-picker-with-range";
import { ServiceUsageStats } from "@/components/reports/ServiceUsageStats";
import { AppointmentDistribution } from "@/components/reports/AppointmentDistribution";
import { RevenueChart } from "@/components/reports/RevenueChart";
import { MemberPaymentsCard } from "@/components/reports/MemberPaymentsCard";
import { PackageIncomeCard } from "@/components/reports/PackageIncomeCard";
import { TrainerClassesChart } from "@/components/reports/TrainerClassesChart";
import { PerformanceMetrics } from "@/components/reports/PerformanceMetrics";
import { LoadingSpinner } from "@/App";

type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
type Member = Database["public"]["Tables"]["members"]["Row"];
type Service = Database["public"]["Tables"]["services"]["Row"];
type MemberPayment = Database["public"]["Tables"]["member_payments"]["Row"];
type Trainer = Database["public"]["Tables"]["trainers"]["Row"];

const ReportsPage = () => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [selectedDateRange, setSelectedDateRange] = useState<
    "all" | "week" | "month" | "year" | "custom"
  >("all");
  const [customDateRange, setCustomDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [memberPayments, setMemberPayments] = useState<MemberPayment[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [
          appointmentsData,
          membersData,
          servicesData,
          memberPaymentsData,
          trainersData,
        ] = await Promise.all([
          getAppointments(),
          getMembers(),
          getServices(),
          getMemberPayments(),
          getTrainers(),
        ]);

        setAppointments(appointmentsData);
        setMembers(membersData);
        setServices(servicesData);
        setMemberPayments(memberPaymentsData);
        setTrainers(trainersData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Veri yüklenirken bir hata oluştu");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    let dateRange;
    if (selectedDateRange === "all") {
      dateRange = null;
    } else if (
      selectedDateRange === "custom" &&
      customDateRange?.from &&
      customDateRange?.to
    ) {
      dateRange = {
        start: customDateRange.from,
        end: customDateRange.to,
      };
    } else {
      const now = new Date();
      dateRange = {
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

    return appointments.filter((appointment) => {
      const appointmentDate = new Date(appointment.date);
      const withinDateRange = dateRange
        ? isWithinInterval(appointmentDate, {
            start: dateRange.start,
            end: dateRange.end,
          })
        : true;

      return withinDateRange;
    });
  }, [appointments, selectedDateRange, customDateRange]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [appointmentsData, membersData, servicesData, memberPaymentsData] =
        await Promise.all([
          getAppointments(),
          getMembers(),
          getServices(),
          getMemberPayments(),
        ]);

      setAppointments(appointmentsData);
      setMembers(membersData);
      setServices(servicesData);
      setMemberPayments(memberPaymentsData);
    } catch {
      toast.error("Veriler yüklenirken bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = () => {
    fetchInitialData();
  };

  const calculateMetrics = () => {
    const now = new Date();
    let dateRange;
    if (selectedDateRange === "all") {
      dateRange = null;
    } else if (
      selectedDateRange === "custom" &&
      customDateRange?.from &&
      customDateRange?.to
    ) {
      dateRange = {
        start: customDateRange.from,
        end: customDateRange.to,
      };
    } else {
      dateRange = {
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

    const isInDateRange = (date: Date) => {
      if (!dateRange) return true;
      return isWithinInterval(date, {
        start: dateRange.start,
        end: dateRange.end,
      });
    };

    // Bu ayki gelir için tarih aralığı
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    
    const isInCurrentMonth = (date: Date) => {
      return isWithinInterval(date, {
        start: currentMonthStart,
        end: currentMonthEnd,
      });
    };

    let totalRevenue = 0;
    let totalPackages = 0;
    let currentMonthRevenue = 0;

    memberPayments.forEach((payment) => {
      const paymentDate = new Date(payment.created_at);
      if (isInDateRange(paymentDate)) {
        const revenue =
          Number(payment.credit_card_paid) + Number(payment.cash_paid);
        totalRevenue += revenue;
        totalPackages += 1;
      }
      
      // Bu ayki gelir hesaplaması
      if (isInCurrentMonth(paymentDate)) {
        const revenue =
          Number(payment.credit_card_paid) + Number(payment.cash_paid);
        currentMonthRevenue += revenue;
      }
    });

   
    return {
      totalRevenue,
      totalPackages,
      uniqueMembers: members.length,
      totalAppointments: filteredData.length,
      currentMonthRevenue,
    };
  };

  const generatePDF = async () => {
    if (!reportRef.current) return;

    try {
      const canvas = await html2canvas(reportRef.current);
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`fitness-report-${format(new Date(), "yyyy-MM-dd")}.pdf`);

      toast.success("Rapor başarıyla PDF olarak indirildi.");
    } catch {
      toast.error("PDF oluşturulurken bir hata oluştu.");
    }
  };

  const metrics = calculateMetrics();

  const serviceUsageData = useMemo(() => {
    return services.map((service) => ({
      name: service.name,
      kullanim: filteredData.filter((app) => app.service_id === service.id)
        .length,
    }));
  }, [services, filteredData]);

  const revenueChartData = useMemo(() => {
    const monthlyRevenue = memberPayments.reduce(
      (acc: { [key: string]: number }, payment) => {
        const paymentMonth = format(new Date(payment.created_at), "MMMM", {
          locale: tr,
        });

        acc[paymentMonth] =
          (acc[paymentMonth] || 0) +
          payment.credit_card_paid +
          payment.cash_paid;
        return acc;
      },
      {}
    );

    return Object.entries(monthlyRevenue)
      .map(([month, gelir]) => ({
        month,
        gelir: Math.round(gelir),
      }))
      .sort((a, b) => {
        const months = [
          "Ocak",
          "Şubat",
          "Mart",
          "Nisan",
          "Mayıs",
          "Haziran",
          "Temmuz",
          "Ağustos",
          "Eylül",
          "Ekim",
          "Kasım",
          "Aralık",
        ];
        return months.indexOf(a.month) - months.indexOf(b.month);
      });
  }, [memberPayments]);

  return (
    <div className="container my-0 p-0 mx-auto">
      {isLoading ? (
        <LoadingSpinner text="Veriler yükleniyor..." />
      ) : (
        <>
          <div className="mb-6 gap-4 flex flex-col md:items-center justify-between md:flex-row">
            <h1 className="text-3xl font-bold md:text-left">Raporlar</h1>
            <div className="flex flex-col gap-4 w-full md:flex-row md:items-center md:justify-end">
             

              {selectedDateRange === "custom" && (
                <DatePickerWithRange
                  date={customDateRange}
                  setDate={setCustomDateRange}
                />
              )}

              <Button onClick={generatePDF} className="w-full md:w-auto">
                <Download className="mr-2 h-4 w-4" />
                PDF İndir
              </Button>
              <Button
                onClick={refreshData}
                variant="outline"
                className="w-full md:w-auto"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Yenile
              </Button>
            </div>
          </div>

          <div ref={reportRef} className="space-y-6">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Performans Metrikleri</h3>

                <Select
                  value={selectedDateRange}
                  onValueChange={(
                    value: "all" | "week" | "month" | "year" | "custom"
                  ) => setSelectedDateRange(value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Tarih aralığı seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Zamanlar</SelectItem>
                    <SelectItem value="week">Bu Hafta</SelectItem>
                    <SelectItem value="month">Bu Ay</SelectItem>
                    <SelectItem value="year">Bu Yıl</SelectItem>
                    <SelectItem value="custom">Özel Aralık</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <PerformanceMetrics metrics={metrics} />
              <div className="mt-6">
                <TrainerClassesChart appointments={filteredData} trainers={trainers} services={services} />
              </div>
            </div>
            <MemberPaymentsCard />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PackageIncomeCard />
              <ServiceUsageStats data={serviceUsageData} />
              <RevenueChart data={revenueChartData} />
              <AppointmentDistribution appointments={appointments} />
            </div>
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 mb-4">
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ReportsPage;
