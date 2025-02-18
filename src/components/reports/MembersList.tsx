import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User2, Calendar, Package, CheckCircle2, Search, Filter, Users } from "lucide-react";
import type { Database } from "@/types/supabase";
import { cn } from "@/lib/utils";

type Member = Database["public"]["Tables"]["members"]["Row"];
type Service = Database["public"]["Tables"]["services"]["Row"];
type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
type Trainer = Database["public"]["Tables"]["trainers"]["Row"];

interface MembersListProps {
  members: Member[];
  services: Service[];
  appointments: Appointment[];
  trainers: Trainer[];
}

export const MembersList: React.FC<MembersListProps> = ({ 
  members, 
  services,
  appointments,
  trainers
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed">("all");
  const [trainerFilter, setTrainerFilter] = useState<string>("all");

  const filteredMembers = useMemo(() => {
    return members.filter(member => {
      const fullName = `${member.first_name} ${member.last_name}`.toLowerCase();
      const phone = member.phone?.toLowerCase() || "";
      const searchMatch = !searchQuery || 
        fullName.includes(searchQuery.toLowerCase()) || 
        phone.includes(searchQuery.toLowerCase());

      if (!searchMatch) return false;

      // Antrenör filtresi
      if (trainerFilter !== "all") {
        const hasAppointmentWithTrainer = appointments.some(
          appointment => 
            appointment.member_id === member.id && 
            appointment.trainer_id === trainerFilter
        );
        if (!hasAppointmentWithTrainer) return false;
      }

      if (statusFilter === "all") return true;

      const memberServices = member.subscribed_services.map(serviceId => {
        const service = services.find(s => s.id === serviceId);
        if (!service) return null;

        const completedSessions = appointments.filter(
          a => a.member_id === member.id && 
               a.service_id === serviceId && 
               a.status === "completed"
        ).length;

        const totalSessions = service.session_count;
        const progress = (completedSessions / totalSessions) * 100;

        return { completedSessions, totalSessions, progress };
      }).filter((s): s is NonNullable<typeof s> => s !== null);

      if (memberServices.length === 0) return false;

      const hasActivePackage = memberServices.some(service => 
        service.completedSessions < service.totalSessions
      );

      const hasCompletedPackage = memberServices.some(service => 
        service.completedSessions >= service.totalSessions
      );

      if (statusFilter === "active" && !hasActivePackage) return false;
      if (statusFilter === "completed" && !hasCompletedPackage) return false;

      return true;
    });
  }, [members, searchQuery, statusFilter, trainerFilter, services, appointments]);

  return (
    <Card className="col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <User2 className="w-6 h-6 text-primary" />
          Üye Listesi ve Paket Bilgileri
        </CardTitle>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Üyelerin aktif paketleri ve seans ilerleme durumları
          </p>
          <p className="text-sm font-medium">
            Toplam: {filteredMembers.length} üye
          </p>
        </div>
      </CardHeader>
      <CardContent className="h-[calc(100vh-6rem)] flex flex-col">
        <div className="flex gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="İsim veya telefon ile ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="w-[180px]">
            <Select
              value={statusFilter}
              onValueChange={(value: typeof statusFilter) => setStatusFilter(value)}
            >
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  <SelectValue placeholder="Durum Filtresi" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">Tüm Üyeler</SelectItem>
                  <SelectItem value="active">Aktif Paketler</SelectItem>
                  <SelectItem value="completed">Tamamlanan Paketler</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="w-[180px]">
            <Select
              value={trainerFilter}
              onValueChange={setTrainerFilter}
            >
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <SelectValue placeholder="Antrenör Filtresi" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">Tüm Antrenörler</SelectItem>
                  {trainers.map(trainer => (
                    <SelectItem key={trainer.id} value={trainer.id}>
                      {trainer.first_name} {trainer.last_name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-md border flex-1 overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[200px]">
                  <div className="flex items-center gap-2 font-semibold">
                    <User2 className="w-4 h-4 text-primary/70" />
                    Üye Adı
                  </div>
                </TableHead>
                <TableHead className="w-[150px]">
                  <div className="flex items-center gap-2 font-semibold">
                    <Calendar className="w-4 h-4 text-primary/70" />
                    Başlangıç Tarihi
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2 font-semibold">
                    <Package className="w-4 h-4 text-primary/70" />
                    Aktif Paketler ve İlerleme Durumu
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="overflow-y-auto">
              {filteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Search className="w-6 h-6" />
                      <p>Arama kriterlerine uygun üye bulunamadı</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredMembers.map((member) => {
                  const serviceCount = member.subscribed_services.reduce((acc, serviceId) => {
                    acc[serviceId] = (acc[serviceId] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>);

                  const completedAppointments = appointments.reduce((acc, appointment) => {
                    if (
                      appointment.member_id === member.id && 
                      (appointment.status === "completed" || appointment.status === "cancelled")
                    ) {
                      acc[appointment.service_id] = (acc[appointment.service_id] || 0) + 1;
                    }
                    return acc;
                  }, {} as Record<string, number>);

                  const uniqueServiceIds = [...new Set(member.subscribed_services)];
                  const memberServices = uniqueServiceIds
                    .map(id => {
                      const service = services.find(s => s.id === id);
                      if (!service) return null;
                      
                      const count = serviceCount[id];
                      const totalSessions = service.session_count * count;
                      const completedSessions = completedAppointments[id] || 0;
                      
                      return { 
                        ...service, 
                        count,
                        totalSessions,
                        completedSessions
                      };
                    })
                    .filter((s): s is (Service & { 
                      count: number;
                      totalSessions: number;
                      completedSessions: number;
                    }) => s !== null);

                  return (
                    <TableRow key={member.id} className="hover:bg-muted/50 border-zinc-300">
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 font-medium">
                            <User2 className="w-4 h-4 text-primary/70" />
                            {`${member.first_name} ${member.last_name}`}
                          </div>
                          <span className="text-sm text-muted-foreground pl-6">
                            {member.phone}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-primary/70" />
                            <span className="font-medium">
                              {new Date(member.start_date).toLocaleDateString("tr-TR")}
                            </span>
                          </div>
                         
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2.5">
                          {memberServices.map((service) => {
                            const progress = (service.completedSessions / service.totalSessions) * 100;
                            const isCompleted = service.completedSessions >= service.totalSessions;
                            
                            return (
                              <div 
                                key={service.id} 
                                className={cn(
                                  "rounded-lg p-3 transition-colors",
                                  isCompleted ? "bg-green-300/40" : "bg-muted"
                                )}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <Badge 
                                    variant={isCompleted ? "default" : "secondary"}
                                    className={cn(
                                      "text-sm font-medium",
                                      isCompleted && "bg-primary/20"
                                    )}
                                  >
                                    {service.name}
                                  </Badge>
                                  {isCompleted && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-medium text-primary">
                                        Tamamlandı
                                      </span>
                                      <CheckCircle2 className="w-4 h-4 text-primary" />
                                    </div>
                                  )}
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-center gap-3">
                                    <div className="flex-1">
                                      <Progress 
                                        value={progress}
                                        className={cn(
                                          "h-2",
                                          isCompleted && "bg-primary/20 [&>div]:bg-primary"
                                        )}
                                      />
                                    </div>
                                    {service.count > 1 && (
                                      <span className="text-xs font-medium px-1.5 py-0.5 rounded-md bg-background">
                                        {service.count - 1} Kez tamamlandı
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Seans İlerlemesi</span>
                                    <div className="flex items-center gap-1.5">
                                      <span className={cn(
                                        "font-medium tabular-nums",
                                        isCompleted && "text-primary"
                                      )}>
                                        {service.completedSessions}
                                      </span>
                                      <span className="text-muted-foreground">/</span>
                                      <span className="font-medium text-muted-foreground tabular-nums">
                                        {service.totalSessions}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          {memberServices.length === 0 && (
                            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                              <Package className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground font-medium">
                                Aktif paket bulunmuyor
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
