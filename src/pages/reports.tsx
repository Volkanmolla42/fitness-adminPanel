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
  Filter,
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
import { getAppointments, getMembers, getServices } from "@/lib/queries";
import type { Database } from "@/types/supabase";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateRange } from "react-day-picker";
import DatePickerWithRange from "@/components/ui/date-picker-with-range";
import { ServiceUsageStats } from "@/components/reports/ServiceUsageStats";
import { AppointmentDistribution } from "@/components/reports/AppointmentDistribution";
import { RevenueChart } from "@/components/reports/RevenueChart";
import { PackageStats } from "@/components/reports/PackageStats";
import { MemberActivityTable } from "@/components/reports/MemberActivityTable";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
];

type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
type Member = Database["public"]["Tables"]["members"]["Row"];
type Service = Database["public"]["Tables"]["services"]["Row"];

const ReportsPage = () => {
  const { toast } = useToast();
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
  const [memberActivities, setMemberActivities] = useState<any[]>([]);

  // Advanced Filtering State
  const [filters, setFilters] = useState({
    serviceType: "all",
    membershipType: "all",
    minRevenue: "",
    maxRevenue: "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      const service = services.find((s) => s.id === appointment.service_id);
      const member = members.find((m) => m.id === appointment.member_id);

      const matchesServiceType =
        filters.serviceType === "all" ||
        appointment.service_id.toString() === filters.serviceType;

      const matchesMembershipType =
        filters.membershipType === "all" ||
        member?.membership_type === filters.membershipType;

      const appointmentRevenue = service?.price || 0;
      const matchesRevenue =
        (!filters.minRevenue ||
          appointmentRevenue >= Number(filters.minRevenue)) &&
        (!filters.maxRevenue ||
          appointmentRevenue <= Number(filters.maxRevenue));

      return (
        withinDateRange &&
        matchesServiceType &&
        matchesMembershipType &&
        matchesRevenue
      );
    });
  }, [
    appointments,
    selectedDateRange,
    customDateRange,
    filters,
    services,
    members,
  ]);

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
    setError(null);
    try {
      const [appointmentsData, membersData, servicesData] = await Promise.all([
        getAppointments(),
        getMembers(),
        getServices(),
      ]);

      setAppointments(appointmentsData);
      setMembers(membersData);
      setServices(servicesData);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Veriler yüklenirken bir hata oluştu.";
      setError(errorMessage);
      toast({
        title: "Hata",
        description: errorMessage,
        variant: "destructive",
      });
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
    const currentMonthStart = startOfMonth(now);
    const previousMonthStart = startOfMonth(
      new Date(now.getFullYear(), now.getMonth() - 1)
    );
    const previousMonthEnd = endOfMonth(
      new Date(now.getFullYear(), now.getMonth() - 1)
    );

    // Bu ayki veriler
    const currentMonthAppointments = filteredData.filter(
      (app) =>
        new Date(app.date) >= currentMonthStart && new Date(app.date) <= now
    );

    const currentMonthMembers = members.filter(
      (member) =>
        new Date(member.created_at) >= currentMonthStart &&
        new Date(member.created_at) <= now &&
        (filters.membershipType === "all" ||
          member.membership_type === filters.membershipType)
    );

    // Geçen ayki veriler
    const previousMonthAppointments = filteredData.filter(
      (app) =>
        new Date(app.date) >= previousMonthStart &&
        new Date(app.date) <= previousMonthEnd
    );

    const previousMonthMembers = members.filter(
      (member) =>
        new Date(member.created_at) >= previousMonthStart &&
        new Date(member.created_at) <= previousMonthEnd &&
        (filters.membershipType === "all" ||
          member.membership_type === filters.membershipType)
    );

    // Toplam üye ve randevu sayıları
    const uniqueMembers = members.length;
    const totalAppointments = appointments.length;

    // Paket ve gelir hesaplamaları
    let currentMonthRevenue = 0;
    let previousMonthRevenue = 0;
    let currentMonthPackages = 0;
    let previousMonthPackages = 0;

    members.forEach((member) => {
      const memberDate = new Date(member.created_at);
      member.subscribed_services?.forEach((serviceId) => {
        const service = services.find((s) => s.id === serviceId);
        if (service) {
          if (memberDate >= currentMonthStart && memberDate <= now) {
            currentMonthRevenue += service.price;
            currentMonthPackages += 1;
          } else if (
            memberDate >= previousMonthStart &&
            memberDate <= previousMonthEnd
          ) {
            previousMonthRevenue += service.price;
            previousMonthPackages += 1;
          }
        }
      });
    });

    // Artış oranları hesaplama
    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const revenueGrowth = calculateGrowth(
      currentMonthRevenue,
      previousMonthRevenue
    );
    const packageGrowth = calculateGrowth(
      currentMonthPackages,
      previousMonthPackages
    );
    const memberGrowth = calculateGrowth(
      currentMonthMembers.length,
      previousMonthMembers.length
    );
    const appointmentGrowth = calculateGrowth(
      currentMonthAppointments.length,
      previousMonthAppointments.length
    );

    // Ortalama gelir hesaplama
    const totalRevenue = currentMonthRevenue;
    const totalPackages = currentMonthPackages;
    const averageRevenuePerPackage =
      totalPackages > 0 ? totalRevenue / totalPackages : 0;
    const previousAverageRevenue =
      previousMonthPackages > 0
        ? previousMonthRevenue / previousMonthPackages
        : 0;
    const averageRevenueGrowth = calculateGrowth(
      averageRevenuePerPackage,
      previousAverageRevenue
    );

    return {
      totalRevenue,
      totalPackages,
      uniqueMembers,
      totalAppointments,
      averageRevenuePerPackage,
      revenueGrowth,
      packageGrowth,
      memberGrowth,
      appointmentGrowth,
      averageRevenueGrowth,
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

      toast({
        title: "Başarılı",
        description: "Rapor başarıyla PDF olarak indirildi.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "PDF oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
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
    const monthlyRevenue = members.reduce(
      (acc: { [key: string]: number }, member) => {
        const memberStartMonth = format(new Date(member.start_date), "MMMM", {
          locale: tr,
        });

        // O ay içinde satın alınan paketlerin fiyatlarını topla
        member.subscribed_services.forEach((serviceId) => {
          const service = services.find((s) => s.id === serviceId);
          if (service) {
            acc[memberStartMonth] =
              (acc[memberStartMonth] || 0) + service.price;
          }
        });

        return acc;
      },
      {}
    );

    return Object.entries(monthlyRevenue).map(([month, gelir]) => ({
      month,
      gelir: Math.round(gelir),
    }));
  }, [members, services]);

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
            const packageAppointments = memberAppointments.filter(
              (app) => app.service_id === serviceId
            ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            const startDate = packageAppointments.length > 0
              ? new Date(packageAppointments[0].date)
              : new Date(member.start_date);

            // Paketin durumunu belirleyelim
            const isCompleted = completedAppointments.length >= service.session_count;
            const status: 'active' | 'completed' = isCompleted ? 'completed' : 'active';

            return {
              name: service.name,
              totalSessions: service.session_count,
              completedSessions: completedAppointments.length,
              startDate,
              status,
              completionCount: completedPackage?.completion_count || 0
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
    <div className="container mt-4 p-0 mx-auto">
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Veriler yükleniyor...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-destructive text-center">
            <p>Bir hata oluştu:</p>
            <p className="font-medium">{error}</p>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-6 gap-4 flex flex-col md:items-center justify-between md:flex-row">
            <h1 className="text-3xl font-bold md:text-left">Raporlar</h1>
            <div className="flex flex-col gap-4 w-full md:flex-row md:items-center md:justify-end">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full md:w-auto">
                    <Filter className="mr-2 h-4 w-4" />
                    Filtrele
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Rapor Filtreleri</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label>Paket Tipi</Label>
                      <Select
                        value={filters.serviceType}
                        onValueChange={(value) =>
                          setFilters((prev) => ({
                            ...prev,
                            serviceType: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Paket seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tümü</SelectItem>
                          {services.map((service) => (
                            <SelectItem
                              key={service.id}
                              value={service.id.toString()}
                            >
                              {service.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Üyelik Tipi</Label>
                      <Select
                        value={filters.membershipType}
                        onValueChange={(value) =>
                          setFilters((prev) => ({
                            ...prev,
                            membershipType: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Üyelik seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tümü</SelectItem>
                          <SelectItem value="monthly">Aylık</SelectItem>
                          <SelectItem value="yearly">Yıllık</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="grid gap-2">
                        <Label>Min. Gelir</Label>
                        <Input
                          type="number"
                          value={filters.minRevenue}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              minRevenue: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Max. Gelir</Label>
                        <Input
                          type="number"
                          value={filters.maxRevenue}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              maxRevenue: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

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
                  <div
                    className={`text-sm ${
                      metrics.revenueGrowth >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {metrics.revenueGrowth >= 0 ? "↑" : "↓"}{" "}
                    {Math.abs(metrics.revenueGrowth).toFixed(1)}%
                    <span className="text-gray-500 ml-1">geçen aya göre</span>
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
                  <div
                    className={`text-sm ${
                      metrics.packageGrowth >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {metrics.packageGrowth >= 0 ? "↑" : "↓"}{" "}
                    {Math.abs(metrics.packageGrowth).toFixed(1)}%
                    <span className="text-gray-500 ml-1">geçen aya göre</span>
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
                  <div
                    className={`text-sm ${
                      metrics.memberGrowth >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {metrics.memberGrowth >= 0 ? "↑" : "↓"}{" "}
                    {Math.abs(metrics.memberGrowth).toFixed(1)}%
                    <span className="text-gray-500 ml-1">geçen aya göre</span>
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
                  <div
                    className={`text-sm ${
                      metrics.appointmentGrowth >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {metrics.appointmentGrowth >= 0 ? "↑" : "↓"}{" "}
                    {Math.abs(metrics.appointmentGrowth).toFixed(1)}%
                    <span className="text-gray-500 ml-1">geçen aya göre</span>
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
                  <div
                    className={`text-sm ${
                      metrics.averageRevenueGrowth >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {metrics.averageRevenueGrowth >= 0 ? "↑" : "↓"}{" "}
                    {Math.abs(metrics.averageRevenueGrowth).toFixed(1)}%
                    <span className="text-gray-500 ml-1">geçen aya göre</span>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="grid  md:grid-cols-2  gap-4">
              <PackageStats
                members={members}
                services={services}
                selectedDateRange={selectedDateRange}
                customDateRange={
                  customDateRange?.from && customDateRange?.to
                    ? { from: customDateRange.from, to: customDateRange.to }
                    : undefined
                }
              />
              <ServiceUsageStats data={serviceUsageData} />
            </div>

            {/* Paket ve Randevu İstatistikleri */}
            <div className="grid gap-4 md:grid-cols-2">
              <AppointmentDistribution appointments={filteredData} />
              {/*  Gelir Analizi */}
              <RevenueChart data={revenueChartData} />
            </div>

            {/* Üye İstatistikleri */}
            <MemberActivityTable data={memberActivities} />
          </div>
        </>
      )}
    </div>
  );
};

export default ReportsPage;
