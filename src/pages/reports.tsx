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
  subMonths,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";

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
  const [customDateRange, setCustomDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    "revenue",
    "appointments",
    "members",
  ]);

  const [isLoading, setIsLoading] = useState(true);
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
    } finally {
      setIsLoading(false);
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

  const calculateMetrics = () => {
    const totalRevenue = filteredData.reduce(
      (sum, app) => {
        const service = services.find(s => s.id === app.service_id);
        return sum + (service?.price || 0);
      },
      0
    );
    const totalAppointments = filteredData.length;
    const uniqueMembers = new Set(filteredData.map((app) => app.member_id)).size;
    const averageRevenuePerAppointment =
      totalAppointments > 0 ? totalRevenue / totalAppointments : 0;

    return {
      totalRevenue,
      totalAppointments,
      uniqueMembers,
      averageRevenuePerAppointment,
    };
  };

  const metrics = calculateMetrics();

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
                  <Label>Hizmet Tipi</Label>
                  <Select
                    value={filters.serviceType}
                    onValueChange={(value) =>
                      setFilters((prev) => ({ ...prev, serviceType: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Hizmet seçin" />
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
                Toplam Randevu
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
                Ortalama Gelir/Randevu
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.averageRevenuePerAppointment.toLocaleString("tr-TR", {
                  style: "currency",
                  currency: "TRY",
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Gelir Grafiği</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={filteredData.map((appointment) => {
                    const service = services.find(
                      (s) => s.id === appointment.service_id
                    );
                    return {
                      date: format(new Date(appointment.date), "dd.MM.yyyy"),
                      revenue: service?.price || 0,
                    };
                  })}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" fill="#8884d8" name="Gelir" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Randevu Trendi</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={filteredData.reduce((acc: any[], appointment) => {
                    const date = format(new Date(appointment.date), "dd.MM.yyyy");
                    const existingDate = acc.find((item) => item.date === date);
                    if (existingDate) {
                      existingDate.count += 1;
                    } else {
                      acc.push({ date, count: 1 });
                    }
                    return acc;
                  }, [])}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#82ca9d"
                    name="Randevu Sayısı"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hizmet Dağılımı</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={services.map((service) => ({
                      name: service.name,
                      value: filteredData.filter(
                        (app) => app.service_id === service.id
                      ).length,
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {services.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Üye Aktivite Trendi</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart
                  data={filteredData.reduce((acc: any[], appointment) => {
                    const date = format(new Date(appointment.date), "dd.MM.yyyy");
                    const member = members.find((m) => m.id === appointment.member_id);
                    const memberName = member
                      ? `${member.first_name} ${member.last_name}`
                      : "N/A";

                    const existingDate = acc.find((item) => item.date === date);
                    if (existingDate) {
                      if (!existingDate.members[memberName]) {
                        existingDate.members[memberName] = 0;
                      }
                      existingDate.members[memberName] += 1;
                      existingDate[memberName] = existingDate.members[memberName];
                    } else {
                      const newEntry = {
                        date,
                        members: { [memberName]: 1 },
                        [memberName]: 1,
                      };
                      acc.push(newEntry);
                    }
                    return acc;
                  }, [])}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {members
                    .slice(0, 5)
                    .map((member, index) => (
                      <Area
                        key={member.id}
                        type="monotone"
                        dataKey={`${member.first_name} ${member.last_name}`}
                        stackId="1"
                        stroke={COLORS[index % COLORS.length]}
                        fill={COLORS[index % COLORS.length]}
                        name={`${member.first_name} ${member.last_name}`}
                      />
                    ))}
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Reports Table */}
        <Card>
          <CardHeader>
            <CardTitle>Detaylı Randevu Raporu</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Üye</TableHead>
                    <TableHead>Hizmet</TableHead>
                    <TableHead className="text-right">Gelir</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((appointment) => {
                    const member = members.find(
                      (m) => m.id === appointment.member_id
                    );
                    const service = services.find(
                      (s) => s.id === appointment.service_id
                    );

                    return (
                      <TableRow key={appointment.id}>
                        <TableCell>
                          {format(new Date(appointment.date), "dd.MM.yyyy")}
                        </TableCell>
                        <TableCell>
                          {member
                            ? `${member.first_name} ${member.last_name}`
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          {service ? service.name : "N/A"}
                        </TableCell>
                        <TableCell className="text-right">
                          {service?.price?.toLocaleString("tr-TR", {
                            style: "currency",
                            currency: "TRY",
                          })}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportsPage;
