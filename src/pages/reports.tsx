import React, { useState, useMemo, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Download } from "lucide-react";
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

type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
type Member = Database["public"]["Tables"]["members"]["Row"];
type Service = Database["public"]["Tables"]["services"]["Row"];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

const ReportsPage = () => {
  const { toast } = useToast();
  const reportRef = useRef<HTMLDivElement>(null);
  const [selectedDateRange, setSelectedDateRange] = useState<
    "week" | "month" | "year"
  >("month");

  const [isLoading, setIsLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [services, setServices] = useState<Service[]>([]);

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
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase.channel("reports");

    // Appointments subscription
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
                : appointment,
            ),
          );
        } else if (payload.eventType === "DELETE") {
          setAppointments((prev) =>
            prev.filter((appointment) => appointment.id !== payload.old.id),
          );
        }
      },
    );

    channel.subscribe();
  };

  // Tarih aralığını hesapla
  const dateRange = useMemo(() => {
    const now = new Date();
    switch (selectedDateRange) {
      case "week":
        return {
          start: startOfWeek(now, { locale: tr }),
          end: endOfWeek(now, { locale: tr }),
        };
      case "month":
        return {
          start: startOfMonth(now),
          end: endOfMonth(now),
        };
      case "year":
        return {
          start: startOfYear(now),
          end: endOfYear(now),
        };
    }
  }, [selectedDateRange]);

  // Filtrelenmiş randevular
  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const appointmentDate = new Date(appointment.date);
      return isWithinInterval(appointmentDate, {
        start: dateRange.start,
        end: dateRange.end,
      });
    });
  }, [appointments, dateRange]);

  // Gelir verileri
  const revenueData = useMemo(() => {
    const data = new Map();
    filteredAppointments.forEach((appointment) => {
      const service = services.find((s) => s.id === appointment.service_id);
      if (service) {
        const date = new Date(appointment.date);
        const key = format(date, "MMM", { locale: tr });
        data.set(key, (data.get(key) || 0) + service.price);
      }
    });
    return Array.from(data, ([month, gelir]) => ({ month, gelir }));
  }, [filteredAppointments, services]);

  // Üyelik tipleri dağılımı
  const membershipData = useMemo(
    () => [
      {
        name: "Temel",
        value: members.filter((m) => m.membership_type === "basic").length,
      },
      {
        name: "VIP",
        value: members.filter((m) => m.membership_type === "vip").length,
      },
    ],
    [members],
  );

  // Hizmet kullanım istatistikleri
  const serviceUsageData = useMemo(
    () =>
      services.map((service) => ({
        name: service.name,
        kullanim: filteredAppointments.filter(
          (a) => a.service_id === service.id,
        ).length,
      })),
    [filteredAppointments, services],
  );

  // Günlük randevu dağılımı
  const appointmentsByHour = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        saat: `${i + 8}:00`,
        randevu: filteredAppointments.filter((a) => {
          const hour = parseInt(a.time.split(":")[0]);
          return hour === i + 8;
        }).length,
      })),
    [filteredAppointments],
  );

  // PDF rapor oluşturma ve indirme fonksiyonu
  const handleDownloadReport = async () => {
    if (!reportRef.current) return;

    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 10;

      // Başlık ve tarih bilgisi
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.text("Spor Salonu Raporu", margin, margin + 10);

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      pdf.text(
        `Rapor Dönemi: ${format(dateRange.start, "dd.MM.yyyy")} - ${format(
          dateRange.end,
          "dd.MM.yyyy",
        )}`,
        margin,
        margin + 20,
      );

      // Özet bilgiler
      const totalRevenue = revenueData.reduce(
        (sum, item) => sum + item.gelir,
        0,
      );
      pdf.setFontSize(11);
      pdf.text(
        [
          `Toplam Gelir: ₺${totalRevenue.toLocaleString("tr-TR")}`,
          `Aktif Üye Sayısı: ${members.length}`,
          `Tamamlanan Randevu: ${
            filteredAppointments.filter((a) => a.status === "completed").length
          }`,
          `Doluluk Oranı: ${Math.round(
            (filteredAppointments.length / (12 * 7)) * 100,
          )}%`,
        ],
        margin,
        margin + 35,
      );

      // Grafikleri ekle
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", margin, margin + 70, imgWidth, imgHeight);
      pdf.save(`spor-salonu-rapor-${format(new Date(), "dd-MM-yyyy")}.pdf`);
    } catch (error) {
      console.error("PDF oluşturma hatası:", error);
      toast({
        title: "Hata",
        description: "Rapor oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6 px-2 md:px-4 pb-8">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold">Raporlar</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Detaylı performans ve istatistik raporları
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Select
          value={selectedDateRange}
          onValueChange={(value: "week" | "month" | "year") =>
            setSelectedDateRange(value)
          }
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Tarih aralığı seçin" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">
              Bu Hafta ({format(dateRange.start, "dd.MM")} -{" "}
              {format(dateRange.end, "dd.MM")})
            </SelectItem>
            <SelectItem value="month">
              Bu Ay ({format(dateRange.start, "MMMM", { locale: tr })})
            </SelectItem>
            <SelectItem value="year">
              Bu Yıl ({format(dateRange.start, "yyyy")})
            </SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={handleDownloadReport}
          className="w-full sm:w-auto"
        >
          <Download className="mr-2 h-4 w-4" />
          PDF İndir
        </Button>
      </div>

      <div ref={reportRef}>
        <ScrollArea className="w-full">
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="w-full sm:w-auto inline-flex h-auto flex-wrap justify-start p-1 gap-2">
              <TabsTrigger value="overview" className="text-sm">
                Genel Bakış
              </TabsTrigger>
              <TabsTrigger value="revenue" className="text-sm">
                Gelir Analizi
              </TabsTrigger>
              <TabsTrigger value="membership" className="text-sm">
                Üyelik İstatistikleri
              </TabsTrigger>
              <TabsTrigger value="services" className="text-sm">
                Hizmet Kullanımı
              </TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" />

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Toplam Gelir
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl md:text-2xl font-bold">
                      ₺
                      {revenueData
                        .reduce((sum, item) => sum + item.gelir, 0)
                        .toLocaleString("tr-TR")}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Seçili dönem
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Aktif Üyeler
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl md:text-2xl font-bold">
                      {members.length}
                    </div>
                    <p className="text-xs text-muted-foreground">Toplam</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Tamamlanan Randevular
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl md:text-2xl font-bold">
                      {
                        filteredAppointments.filter(
                          (a) => a.status === "completed",
                        ).length
                      }
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Seçili dönem
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Doluluk Oranı
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl md:text-2xl font-bold">
                      {Math.round(
                        (filteredAppointments.length / (12 * 7)) * 100,
                      )}
                      %
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Seçili dönem
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
                <Card className="lg:col-span-4">
                  <CardHeader>
                    <CardTitle className="text-base md:text-lg">
                      Gelir Grafiği
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[200px] md:h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={revenueData}
                        margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} width={60} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="gelir"
                          stroke="#8884d8"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-3">
                  <CardHeader>
                    <CardTitle className="text-base md:text-lg">
                      Üyelik Dağılımı
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[200px] md:h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart
                        margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                      >
                        <Pie
                          data={membershipData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={60}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {membershipData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="revenue" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Gelir Detayları</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="gelir" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="membership" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Üyelik Tipleri Dağılımı</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={membershipData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label
                        >
                          {membershipData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Üye Aktivitesi</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {membershipData.map((type, index) => (
                        <div key={type.name} className="flex items-center">
                          <div
                            className="w-4 h-4 rounded-full mr-2"
                            style={{
                              backgroundColor: COLORS[index % COLORS.length],
                            }}
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium">
                              {type.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {type.value} üye (
                              {Math.round((type.value / members.length) * 100)}
                              %)
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="services" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Hizmet Kullanım İstatistikleri</CardTitle>
                </CardHeader>
                <CardContent className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={serviceUsageData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="kullanim" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Günlük Randevu Dağılımı</CardTitle>
                </CardHeader>
                <CardContent className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={appointmentsByHour}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="saat" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="randevu" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </div>
    </div>
  );
};

export default ReportsPage;
