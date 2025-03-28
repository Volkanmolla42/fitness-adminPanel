import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown, ChevronDown, Package, AlertCircle } from "lucide-react";
import type { Database } from "@/types/supabase";
import React, { useMemo, useState } from "react";
import cn from "classnames";
import { ServiceProgress } from "./ServiceProgress";
import { useTheme } from "@/contexts/theme-context";
import { Button } from "@/components/ui/button";

type Member = Database["public"]["Tables"]["members"]["Row"];
type Service = Database["public"]["Tables"]["services"]["Row"];
type Appointment = Database["public"]["Tables"]["appointments"]["Row"];

interface MemberCardProps {
  member: Member;
  services: { [key: string]: Service };
  onClick: (member: Member) => void;
  appointments: Appointment[];
}

export const MemberCard = ({
  member,
  services,
  onClick,
  appointments,
}: MemberCardProps) => {
  const { theme } = useTheme();
  const [showPackages, setShowPackages] = useState(false);

  // Hesaplamaları useMemo ile optimize et
  const memberServices = useMemo(() => {
    // Üyenin aldığı paketleri ve sayılarını hesapla
    const serviceCount = member.subscribed_services.reduce((acc, serviceId) => {
      acc[serviceId] = (acc[serviceId] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    // Her bir servis için ilgili randevuları bul
    return Object.entries(serviceCount).map(([serviceId, count]) => {
      const service = services[serviceId];

      // Bu üyenin bu servise ait tüm randevuları
      const serviceAppointments = appointments.filter(
        (apt) =>
          apt.service_id === serviceId &&
          apt.member_id === member.id
      );

      return {
        serviceId,
        service,
        appointments: serviceAppointments,
        totalPackages: count,
      };
    });
  }, [member, services, appointments]);

  // Paket butonuna tıklandığında event'in yayılmasını engelle
  const handlePackageToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); // Üye kartına tıklama olayının tetiklenmesini engelle
    setShowPackages(!showPackages);
  };

  // Üyenin tüm paketlerini bitirip bitirmediğini kontrol et
  const hasCompletedAllPackages = useMemo(() => {
    // Eğer üyenin hiç paketi yoksa false döndür
    if (memberServices.length === 0) return false;
    
    // Her bir paket için kontrol yap
    return memberServices.every(({ service, appointments, totalPackages }) => {
      const sessionsPerPackage = service?.session_count || 0;
      const totalSessionsAvailable = totalPackages * sessionsPerPackage;
      
      // Tamamlanan ve iptal edilen randevuları say
      const completedAppointments = appointments.filter(apt => apt.status === "completed");
      const cancelledAppointments = appointments.filter(apt => apt.status === "cancelled");
      const usedSessions = completedAppointments.length + cancelledAppointments.length;
      
      // Planlanan randevuları say
      const plannedAppointments = appointments.filter(apt => apt.status === "scheduled");
      
      // Eğer kullanılan seans sayısı toplam seans sayısına eşit veya fazlaysa
      // VE planlanan randevu yoksa, bu paket bitmiş demektir
      return usedSessions >= totalSessionsAvailable && plannedAppointments.length === 0;
    });
  }, [memberServices]);

  return (
    <div
      className={`rounded-xl p-4 sm:p-5 hover:shadow-md transition-all cursor-pointer relative group ${
        hasCompletedAllPackages
          ? theme === "dark"
            ? "bg-gray-800 border-2 border-red-500/70 hover:border-red-500"
            : "bg-card border-2 border-red-500/60 hover:border-red-500"
          : theme === "dark"
          ? "bg-gray-800 border border-gray-700 hover:border-primary/40"
          : "bg-card border border-border/60 hover:border-primary/40"
      }`}
      onClick={() => onClick(member)}
    >
      <div className="absolute top-3 right-3 flex items-center justify-center gap-2 z-10">
        {hasCompletedAllPackages && (
          <Badge
            variant="destructive"
            className="flex items-center gap-1.5 px-2.5 py-1 font-medium shadow-sm bg-red-500/90 hover:bg-red-500 text-white"
          >
            <AlertCircle className="h-3.5 w-3.5" />
            <span className="text-xs">Paket Bitti</span>
          </Badge>
        )}
        <Badge
          variant={
            member.membership_type === "vip" ? "destructive" : "secondary"
          }
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 font-medium shadow-sm",
            member.membership_type === "vip"
              ? "bg-red-500/90 hover:bg-red-500 text-white"
              : theme === "dark"
              ? "bg-gray-700 text-gray-200"
              : ""
          )}
        >
          {member.membership_type === "vip" ? (
            <>
              <Crown className="h-3.5 w-3.5 text-yellow-300" />
            </>
          ) : (
            "Standart"
          )}
        </Badge>
      </div>

      <div className="flex flex-col items-center text-center">
        <div className="relative">
          <Avatar
            className={`size-20 ring-2 ring-offset-2 transition-all ${
              hasCompletedAllPackages
                ? "ring-red-500/70 ring-offset-background"
                : theme === "dark"
                ? "ring-primary/30 ring-offset-gray-800 group-hover:ring-primary/50"
                : "ring-primary/20 ring-offset-background group-hover:ring-primary/40"
            }`}
          >
            <AvatarImage
              src={member.avatar_url || ""}
              alt={`${member.first_name} ${member.last_name}`}
              className="object-cover"
            />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {member.first_name[0]}
              {member.last_name[0]}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="mt-4 sm:mt-5">
          <h3
            className={`font-semibold text-sm sm:text-base tracking-tight ${
              theme === "dark" ? "text-gray-100" : ""
            }`}
          >
            {member.first_name} {member.last_name}
          </h3>
        </div>

        <div className={`w-full mt-3`}>
          <Button 
            variant="secondary" 
            size="sm" 
            className={`w-full flex items-center justify-between mb-2 py-3 px-1 ${
              hasCompletedAllPackages
                ? theme === "dark"
                  ? "bg-red-500/20 hover:bg-red-500/30 text-red-100"
                  : "bg-red-100 hover:bg-red-200 text-red-700"
                : theme === "dark" 
                ? "hover:bg-gray-700/60" 
                : "hover:bg-gray-100/80"
            }`}
            onClick={handlePackageToggle}
          >
            <div className="flex items-center gap-1.5">
              <Package className={`h-3.5 w-3.5 ${hasCompletedAllPackages ? "text-red-500" : "text-primary"}`} />
              <span className="text-xs font-medium">
                Aldığı Paketler ({memberServices.length})
              </span>
            </div>
            <ChevronDown 
              className={`h-4 w-4 transition-transform duration-300 ${
                showPackages ? "rotate-180" : ""
              } ${
                hasCompletedAllPackages ? "text-red-500" : "text-muted-foreground"
              }`} 
            />
          </Button>
          
          <div 
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              showPackages 
                ? "max-h-96 opacity-100" 
                : "max-h-0 opacity-0"
            }`}
          >
            <div className="flex flex-col gap-2.5 w-full pt-1 pb-2">
              {memberServices.map(
                ({ serviceId, service, appointments, totalPackages }) => (
                  <ServiceProgress
                    key={serviceId}
                    service={service}
                    appointments={appointments}
                    totalPackages={totalPackages}
                  />
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
