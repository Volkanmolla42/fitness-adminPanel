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
  >("year");
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
    let comparisonDateRange; 
    let comparisonLabel = ""; 
    
    if (selectedDateRange === "all") {
      dateRange = null;
      comparisonDateRange = null;
      comparisonLabel = "Tüm zamana göre";
    } else if (
      selectedDateRange === "custom" &&
      customDateRange?.from &&
      customDateRange?.to
    ) {
      const from = customDateRange.from;
      const to = customDateRange.to;
      const dayDiff = Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
      
      dateRange = {
        start: from,
        end: to,
      };
      
      const comparisonStart = new Date(from);
      comparisonStart.setDate(comparisonStart.getDate() - dayDiff - 1);
      const comparisonEnd = new Date(from);
      comparisonEnd.setDate(comparisonEnd.getDate() - 1);
      
      comparisonDateRange = {
        start: comparisonStart,
        end: comparisonEnd
      };
      
      comparisonLabel = "Önceki döneme göre";
    } else {
      if (selectedDateRange === "week") {
        dateRange = {
          start: startOfWeek(now, { locale: tr }),
          end: endOfWeek(now, { locale: tr }),
        };
        
        const lastWeekStart = new Date(dateRange.start);
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);
        const lastWeekEnd = new Date(dateRange.end);
        lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);
        
        comparisonDateRange = {
          start: lastWeekStart,
          end: lastWeekEnd
        };
        
        comparisonLabel = "Önceki haftaya göre";
      } else if (selectedDateRange === "month") {
        dateRange = {
          start: startOfMonth(now),
          end: endOfMonth(now),
        };
        
        const lastMonthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1));
        const lastMonthEnd = endOfMonth(new Date(now.getFullYear(), now.getMonth() - 1));
        
        comparisonDateRange = {
          start: lastMonthStart,
          end: lastMonthEnd
        };
        
        comparisonLabel = "Önceki aya göre";
      } else { 
        dateRange = {
          start: startOfYear(now),
          end: endOfYear(now),
        };
        
        const lastYearStart = startOfYear(new Date(now.getFullYear() - 1));
        const lastYearEnd = endOfYear(new Date(now.getFullYear() - 1));
        
        comparisonDateRange = {
          start: lastYearStart,
          end: lastYearEnd
        };
        
        comparisonLabel = "Önceki yıla göre";
      }
    }

    const isInDateRange = (date: Date) => {
      if (!dateRange) return true;
      return isWithinInterval(date, {
        start: dateRange.start,
        end: dateRange.end,
      });
    };
    
    const isInComparisonDateRange = (date: Date) => {
      if (!comparisonDateRange) return false;
      return isWithinInterval(date, {
        start: comparisonDateRange.start,
        end: comparisonDateRange.end,
      });
    };

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
    
    let comparisonRevenue = 0;
    let comparisonPackages = 0;
    
    const comparisonAppointments = comparisonDateRange ? appointments.filter((appointment) => {
      const appointmentDate = new Date(appointment.date);
      return isInComparisonDateRange(appointmentDate);
    }).length : 0;
    
    const comparisonMembers = comparisonDateRange ? members.filter((member) => {
      const memberCreationDate = new Date(member.created_at);
      return isInComparisonDateRange(memberCreationDate);
    }).length : 0;

    memberPayments.forEach((payment) => {
      const paymentDate = new Date(payment.created_at);
      const revenue = Number(payment.credit_card_paid) + Number(payment.cash_paid);
      
      if (isInDateRange(paymentDate)) {
        totalRevenue += revenue;
        totalPackages += 1;
      }
      
      if (isInComparisonDateRange(paymentDate)) {
        comparisonRevenue += revenue;
        comparisonPackages += 1;
      }
      
      if (isInCurrentMonth(paymentDate)) {
        currentMonthRevenue += revenue;
      }
    });

    const filteredMembers = members.filter((member) => {
      const memberCreationDate = new Date(member.created_at);
      return isInDateRange(memberCreationDate);
    });
    
    const calculateChangeRate = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0; 
      return ((current - previous) / previous) * 100;
    };
    
    const packageChangeRate = calculateChangeRate(totalPackages, comparisonPackages);
    const memberChangeRate = calculateChangeRate(filteredMembers.length, comparisonMembers);
    const appointmentChangeRate = calculateChangeRate(filteredData.length, comparisonAppointments);
    const revenueChangeRate = calculateChangeRate(totalRevenue, comparisonRevenue);
    
    const lastMonthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1));
    const lastMonthEnd = endOfMonth(new Date(now.getFullYear(), now.getMonth() - 1));
    
    let lastMonthRevenue = 0;
    
    memberPayments.forEach((payment) => {
      const paymentDate = new Date(payment.created_at);
      if (isWithinInterval(paymentDate, { start: lastMonthStart, end: lastMonthEnd })) {
        lastMonthRevenue += Number(payment.credit_card_paid) + Number(payment.cash_paid);
      }
    });
    
    const currentMonthRevenueChangeRate = calculateChangeRate(currentMonthRevenue, lastMonthRevenue);
   
    return {
      totalRevenue,
      totalPackages,
      uniqueMembers: filteredMembers.length,
      totalAppointments: filteredData.length,
      currentMonthRevenue,
      packageChangeRate,
      memberChangeRate,
      appointmentChangeRate,
      revenueChangeRate,
      currentMonthRevenueChangeRate,
      comparisonLabel
    };
  };

  const generatePDF = async () => {
    if (!reportRef.current) return;

    try {
      toast.info("PDF oluşturuluyor, lütfen bekleyin...");
      
      const scale = 2;
      const options = {
        scale: scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff"
      };
      
      const canvas = await html2canvas(reportRef.current, options);
      const imgData = canvas.toDataURL("image/jpeg", 1.0);
      
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const margin = 10;
      const contentWidth = pdfWidth - (margin * 2);
      const contentHeight = (canvas.height * contentWidth) / canvas.width;
      
      pdf.setFontSize(18);
      pdf.setTextColor(44, 62, 80); 
      pdf.text("Fitness Merkezi Raporu", pdfWidth / 2, margin + 5, { align: "center" });
      
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100); 
      const currentDate = format(new Date(), "dd MMMM yyyy", { locale: tr });
      pdf.text(`Oluşturulma Tarihi: ${currentDate}`, pdfWidth / 2, margin + 12, { align: "center" });
      
      let dateRangeText = "Tarih Aralığı: Tüm Zamanlar";
      if (selectedDateRange === "week") {
        dateRangeText = "Tarih Aralığı: Bu Hafta";
      } else if (selectedDateRange === "month") {
        dateRangeText = "Tarih Aralığı: Bu Ay";
      } else if (selectedDateRange === "year") {
        dateRangeText = "Tarih Aralığı: Bu Yıl";
      } else if (selectedDateRange === "custom" && customDateRange.from && customDateRange.to) {
        const fromDate = format(customDateRange.from, "dd.MM.yyyy");
        const toDate = format(customDateRange.to, "dd.MM.yyyy");
        dateRangeText = `Tarih Aralığı: ${fromDate} - ${toDate}`;
      }
      
      pdf.text(dateRangeText, pdfWidth / 2, margin + 18, { align: "center" });
      
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, margin + 22, pdfWidth - margin, margin + 22);
      
      const yPos = margin + 25;
      pdf.addImage(imgData, "JPEG", margin, yPos, contentWidth, contentHeight);
      
      const footerY = pdfHeight - 10;
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(" Fitness Merkezi Yönetim Sistemi", margin, footerY);
      pdf.text("Sayfa 1/1", pdfWidth - margin, footerY, { align: "right" });

      pdf.save(`fitness-raporu-${format(new Date(), "yyyy-MM-dd")}.pdf`);

      toast.success("Rapor başarıyla PDF olarak indirildi.");
    } catch (error) {
      console.error("PDF oluşturma hatası:", error);
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
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Performans Metrikleri</h3>
                <div className="flex flex-col md:flex-row md:items-center gap-2">
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
                
                {selectedDateRange === "custom" && (
                  <DatePickerWithRange
                    date={customDateRange}
                    setDate={setCustomDateRange}
                  />
                )}
              </div>
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
