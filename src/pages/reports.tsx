import React, { useState, useMemo, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Calendar,
  DollarSign,
  Package2,
  Users,
  Calculator,
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
} from "@/lib/queries";
import type { Database } from "@/types/supabase";
import { toast } from "sonner";

import { DateRange } from "react-day-picker";
import DatePickerWithRange from "@/components/ui/date-picker-with-range";
import { ServiceUsageStats } from "@/components/reports/ServiceUsageStats";
import { AppointmentDistribution } from "@/components/reports/AppointmentDistribution";
import { RevenueChart } from "@/components/reports/RevenueChart";
import { MemberActivityTable } from "@/components/reports/MemberActivityTable";
import { MemberPaymentsCard } from "@/components/reports/MemberPaymentsCard";
import { PackageIncomeCard } from "@/components/reports/PackageIncomeCard";

type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
type Member = Database["public"]["Tables"]["members"]["Row"];
type Service = Database["public"]["Tables"]["services"]["Row"];
type MemberPayment = Database["public"]["Tables"]["member_payments"]["Row"];
interface MemberActivity {
  memberId: string;
  memberName: string;
  startDate: Date;
  packages: {
    name: string;
    totalSessions: number;
    completedSessions: number;
    startDate: Date;
    status: "completed" | "active";
    completionCount: number;
  }[];
}

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
  const [memberActivities, setMemberActivities] = useState<MemberActivity[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);

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

  // İlk veri yüklemesi
  useEffect(() => {
    fetchInitialData();
  }, []); // Sadece component mount olduğunda çalışsın

  // Filtreleme değiştiğinde verileri yeniden hesapla
  useEffect(() => {
    calculateMemberActivities();
  }, [appointments, members, selectedDateRange, customDateRange]);

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

  // Verileri yeniden yükle
  const refreshData = () => {
    fetchInitialData();
  };

  const calculateMetrics = () => {
    const now = new Date();
    // Tarih aralığı hesaplama
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
        end: now,
      };
    }

    // Filtreleme fonksiyonu
    const isInDateRange = (date: Date) => {
      if (!dateRange) return true;
      return isWithinInterval(date, {
        start: dateRange.start,
        end: dateRange.end,
      });
    };

    let totalRevenue = 0;
    let totalPackages = 0;

    // Üye ödemelerinden gelir hesaplama
    memberPayments.forEach((payment) => {
      const paymentDate = new Date(payment.created_at);
      if (isInDateRange(paymentDate)) {
        const revenue =
          Number(payment.credit_card_paid) + Number(payment.cash_paid);
        totalRevenue += revenue;
        totalPackages += 1;
      }
    });

    // Ortalama gelir/paket hesapla
    const averageRevenuePerPackage =
      totalPackages > 0 ? totalRevenue / totalPackages : 0;

    return {
      totalRevenue,
      totalPackages,
      uniqueMembers: members.length,
      totalAppointments: appointments.length,
      averageRevenuePerPackage,
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

  // Prepare data for ServiceUsageStats
  const serviceUsageData = useMemo(() => {
    return services.map((service) => ({
      name: service.name,
      kullanim: filteredData.filter((app) => app.service_id === service.id)
        .length,
    }));
  }, [services, filteredData]);

  // Prepare data for RevenueChart
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

  const calculateMemberActivities = () => {
    const activities = members.map((member) => {
      const memberAppointments = appointments.filter(
        (app) => app.member_id === member.id
      );

      // Üyenin tüm paketlerini bulalım
      const memberPackages =
        member.subscribed_services
          ?.map((serviceId) => {
            const service = services.find((s) => s.id === serviceId);
            if (!service) return null;

            // Bu paket için tamamlanan seansları bulalım
            const completedAppointments = memberAppointments.filter(
              (app) =>
                app.service_id === serviceId && app.status === "completed"
            );

            // Paketin tamamlanma sayısını bulalım
            const completedPackage = member.completed_packages?.find(
              (cp) => cp.package_id === serviceId
            );

            // Paketin başlangıç tarihini bulalım (ilk randevu tarihi veya üyelik başlangıç tarihi)
            const packageAppointments = memberAppointments
              .filter((app) => app.service_id === serviceId)
              .sort(
                (a, b) =>
                  new Date(a.date).getTime() - new Date(b.date).getTime()
              );

            const startDate =
              packageAppointments.length > 0
                ? new Date(packageAppointments[0].date)
                : new Date(member.start_date);

            // Paketin durumunu belirleyelim
            const isCompleted =
              completedAppointments.length >= service.session_count;
            const status: "active" | "completed" = isCompleted
              ? "completed"
              : "active";

            return {
              name: service.name,
              totalSessions: service.session_count,
              completedSessions: completedAppointments.length,
              startDate,
              status,
              completionCount: completedPackage?.completion_count || 0,
            };
          })
          .filter((pkg): pkg is NonNullable<typeof pkg> => pkg !== null) || [];

      return {
        memberId: member.id,
        memberName: `${member.first_name} ${member.last_name}`,
        startDate: new Date(member.start_date),
        packages: memberPackages,
      };
    });

    setMemberActivities(activities);
  };

  return (
    <div className="container my-4 p-0 mx-auto">
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Veriler yükleniyor...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-6 gap-4 flex flex-col md:items-center justify-between md:flex-row">
            <h1 className="text-3xl font-bold md:text-left">Raporlar</h1>
            <div className="flex flex-col gap-4 w-full md:flex-row md:items-center md:justify-end">
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
            {/* Metrics Overview */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Toplam Gelir
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {metrics.totalRevenue.toLocaleString("tr-TR", {
                      style: "currency",
                      currency: "TRY",
                    })}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Toplam Satılan Paket
                  </CardTitle>
                  <Package2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {metrics.totalPackages}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Üye Sayısı
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {metrics.uniqueMembers}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Randevu Sayısı
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {metrics.totalAppointments}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Ortalama Gelir/Paket
                  </CardTitle>
                  <Calculator className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {metrics.averageRevenuePerPackage.toLocaleString("tr-TR", {
                      style: "currency",
                      currency: "TRY",
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PackageIncomeCard />
              <ServiceUsageStats data={serviceUsageData} />
              <AppointmentDistribution appointments={filteredData} />
              <RevenueChart data={revenueChartData} />
            </div>
            <MemberPaymentsCard />
            <MemberActivityTable data={memberActivities} />
          </div>
        </>
      )}
    </div>
  );
};

export default ReportsPage;
