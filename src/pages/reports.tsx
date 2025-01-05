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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Download, Filter, Calendar, TrendingUp } from "lucide-react";
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
import { supabase } from "@/lib/supabase";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { ServiceUsageStats } from "@/components/reports/ServiceUsageStats";
import { AppointmentDistribution } from "@/components/reports/AppointmentDistribution";
import { MembershipDistribution } from "@/components/reports/MembershipDistribution";
import { RevenueChart } from "@/components/reports/RevenueChart";
import { TrendAnalysis } from "@/components/reports/TrendAnalysis";
import { PackageStats } from "@/components/reports/PackageStats";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
type Member = Database["public"]["Tables"]["members"]["Row"];
type Service = Database["public"]["Tables"]["services"]["Row"];

const ReportsPage = () => {
  const { toast } = useToast();
  const reportRef = useRef<HTMLDivElement>(null);
  const [selectedDateRange, setSelectedDateRange] = useState<
    "week" | "month" | "year" | "custom"
  >("month");
  const [customDateRange, setCustomDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });


  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  // Advanced Filtering State
  const [filters, setFilters] = useState({
    serviceType: "all",
    membershipType: "all",
    minRevenue: "",
    maxRevenue: "",
  });

  useEffect(() => {
    fetchData();
    setupRealtimeSubscription();
    return () => {
      supabase.channel("reports").unsubscribe();
    };
  }, []);

  const fetchData = async () => {
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
      toast({
        title: "Hata",
        description: "Veriler yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } 
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase.channel("reports");
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "appointments" },
      (payload) => {
        if (payload.eventType === "INSERT") {
          setAppointments((prev) => [payload.new as Appointment, ...prev]);
        } else if (payload.eventType === "UPDATE") {
          setAppointments((prev) =>
            prev.map((appointment) =>
              appointment.id === payload.new.id
                ? (payload.new as Appointment)
                : appointment
            )
          );
        } else if (payload.eventType === "DELETE") {
          setAppointments((prev) =>
            prev.filter((appointment) => appointment.id !== payload.old.id)
          );
        }
      }
    ).subscribe();
  };

  const filteredData = useMemo(() => {
    let dateRange;
    if (selectedDateRange === "custom" && customDateRange) {
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
      const withinDateRange = isWithinInterval(appointmentDate, {
        start: dateRange.start,
        end: dateRange.end,
      });

      const matchesServiceType =
        filters.serviceType === "all" ||
        appointment.service_id.toString() === filters.serviceType;

      // Get the price from the related service
      const service = services.find(s => s.id === appointment.service_id);
      const appointmentRevenue = service?.price || 0;
      const matchesRevenue =
        (!filters.minRevenue || appointmentRevenue >= Number(filters.minRevenue)) &&
        (!filters.maxRevenue || appointmentRevenue <= Number(filters.maxRevenue));

      return withinDateRange && matchesServiceType && matchesRevenue;
    });
  }, [appointments, selectedDateRange, customDateRange, filters, services]);

  const calculateMetrics = () => {
    // Seçili tarih aralığındaki üyeleri filtrele
    const filteredMembers = members.filter((member) => {
      const memberStartDate = new Date(member.start_date);
      let dateRange;
      if (selectedDateRange === "custom" && customDateRange?.from && customDateRange?.to) {
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
      return isWithinInterval(memberStartDate, dateRange);
    });

    // Paket satın alımlarını hesapla
    let totalRevenue = 0;
    let totalPackages = 0;
    const uniqueMemberIds = new Set<string>();

    filteredMembers.forEach((member) => {
      member.subscribed_services.forEach((serviceId) => {
        const service = services.find((s) => s.id === serviceId);
        if (service) {
          totalRevenue += service.price;
          totalPackages += 1;
          uniqueMemberIds.add(member.id);
        }
      });
    });

    const uniqueMembers = uniqueMemberIds.size;
    const averageRevenuePerPackage = totalPackages > 0 ? totalRevenue / totalPackages : 0;

    return {
      totalRevenue,
      totalPackages,
      uniqueMembers,
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
    return services.map(service => ({
      name: service.name,
      kullanim: filteredData.filter(app => app.service_id === service.id).length
    }));
  }, [services, filteredData]);

  // Prepare data for AppointmentDistribution
  const appointmentDistributionData = useMemo(() => {
    const hourlyDistribution = filteredData.reduce((acc: { [key: string]: number }, appointment) => {
      const hour = new Date(appointment.date).getHours();
      const hourStr = `${hour}:00`;
      acc[hourStr] = (acc[hourStr] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(hourlyDistribution).map(([saat, randevu]) => ({
      saat,
      randevu
    })).sort((a, b) => parseInt(a.saat) - parseInt(b.saat));
  }, [filteredData]);

  // Prepare data for MembershipDistribution
  const membershipDistributionData = useMemo(() => {
    return services.map(service => ({
      name: service.name,
      value: filteredData.filter(app => app.service_id === service.id).length
    }));
  }, [services, filteredData]);

  // Prepare data for RevenueChart
  const revenueChartData = useMemo(() => {
    const monthlyRevenue = filteredData.reduce((acc: { [key: string]: number }, appointment) => {
      const month = format(new Date(appointment.date), "MMMM", { locale: tr });
      const service = services.find(s => s.id === appointment.service_id);
      acc[month] = (acc[month] || 0) + (service?.price || 0);
      return acc;
    }, {});

    return Object.entries(monthlyRevenue).map(([month, gelir]) => ({
      month,
      gelir
    }));
  }, [filteredData, services]);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Raporlar</h1>
        <div className="flex gap-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
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
                      setFilters((prev) => ({ ...prev, serviceType: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Paket seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tümü</SelectItem>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id.toString()}>
                          {service.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
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
            onValueChange={(value: "week" | "month" | "year" | "custom") =>
              setSelectedDateRange(value)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tarih aralığı seçin" />
            </SelectTrigger>
            <SelectContent>
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

          <Button onClick={generatePDF}>
            <Download className="mr-2 h-4 w-4" />
            PDF İndir
          </Button>
        </div>
      </div>

      <div ref={reportRef} className="space-y-6">
        {/* Metrics Overview */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Gelir</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
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
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.totalPackages}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktif Üyeler</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.uniqueMembers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Ortalama Gelir/Paket
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
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

        {/* Trend Analysis */}
        <TrendAnalysis 
          appointments={appointments}
          members={members}
          selectedDateRange={selectedDateRange === "custom" ? "month" : selectedDateRange}
        />

        {/* Charts Grid */}
        <div className="grid gap-4">
          {/* Paket ve Randevu İstatistikleri */}
          <div className="grid gap-4 md:grid-cols-2">
            <ServiceUsageStats data={serviceUsageData} />
            <MembershipDistribution data={membershipDistributionData} />
          </div>

          {/* Randevu ve Gelir Analizi */}
          <div className="grid gap-4 md:grid-cols-2">
            <AppointmentDistribution appointments={appointments} />
            <RevenueChart data={revenueChartData} />
          </div>

          {/* Paket İstatistikleri */}
          <PackageStats 
            members={members}
            services={services}
            selectedDateRange={selectedDateRange}
            customDateRange={customDateRange?.from && customDateRange?.to ? { from: customDateRange.from, to: customDateRange.to } : undefined}
          />
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
