import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle2, Crown, Phone } from "lucide-react";
import type { Database } from "@/types/supabase";
import React, { useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import cn from "classnames";

type Member = Database["public"]["Tables"]["members"]["Row"];
type Service = Database["public"]["Tables"]["services"]["Row"];
type Appointment = Database["public"]["Tables"]["appointments"]["Row"];

interface MemberCardProps {
  member: Member;
  services: { [key: string]: Service };
  onClick: (member: Member) => void;
  appointments: Appointment[];
}

interface ServiceProgressProps {
  service: Service;
  completedSessions: number;
  totalPackages: number;
}

// Service İlerleme Komponenti
const ServiceProgress = ({ service, completedSessions, totalPackages }: ServiceProgressProps) => {
  const sessionsPerPackage = service?.session_count || 0;
  
  // Eğer üye bu paketten sadece 1 tane almışsa ve seans sayısını aşmışsa
  // gerçek tamamlanan seans sayısını göster
  if (totalPackages === 1 && completedSessions > sessionsPerPackage) {
    return (
      <div className="w-full bg-primary/5 p-2.5 rounded-lg shadow-sm border border-primary/10 hover:bg-primary/10 transition-colors">
        <Badge
          variant="outline"
          className="px-3 py-1 flex items-center gap-2 mb-1.5 bg-background/80 font-medium"
        >
          <span className="mr-auto">
            {service?.name || "Yükleniyor..."}
          </span>
        </Badge>
        <div className="flex items-center gap-2.5">
          <Progress
            value={100}
            className="h-2.5 rounded-full bg-green-100/70 [&>div]:bg-green-600"
          />
          <span className="text-xs whitespace-nowrap flex items-center gap-1.5 font-medium">
            {completedSessions}/{sessionsPerPackage}
            <CheckCircle2 className="text-green-600 size-4 ml-0.5" />
          </span>
        </div>
      </div>
    );
  }
  
  // Tamamlanan seansların kaç pakete denk geldiğini hesapla
  const completedPackages = Math.floor(completedSessions / sessionsPerPackage);
  
  // Son paketteki tamamlanan seans sayısı
  const currentPackageCompletedSessions = completedSessions % sessionsPerPackage || 
    (completedSessions > 0 && completedSessions === completedPackages * sessionsPerPackage ? sessionsPerPackage : 0);
  
  // İlerleme yüzdesi (son paket için)
  const progress = (currentPackageCompletedSessions / sessionsPerPackage) * 100;
  
  const isCompleted = progress >= 100;
  
  return (
    <div className="w-full bg-primary/5 p-2.5 rounded-lg shadow-sm border border-primary/10 hover:bg-primary/10 transition-colors">
      <Badge
        variant="outline"
        className="px-3 py-1 flex items-center gap-2 mb-1.5 bg-background/80 font-medium"
      >
        {totalPackages > 1 && (
          <span className="text-red-500 font-semibold">{totalPackages} ×</span>
        )}
        <span className="mr-auto">
          {service?.name || "Yükleniyor..."}
        </span>
      </Badge>
      <div className="flex items-center gap-2.5">
        <Progress
          value={progress}
          className={cn(
            "h-2.5 rounded-full",
            isCompleted ? "bg-green-100/70 [&>div]:bg-green-600" : "bg-primary/10 [&>div]:bg-primary"
          )}
        />
        <span className="text-xs whitespace-nowrap flex items-center gap-1.5 font-medium">
          {currentPackageCompletedSessions}/{sessionsPerPackage}
          {(completedPackages > 0 || isCompleted) && (
            <span className="ml-1.5 flex items-center">
              {isCompleted ? (
                <CheckCircle2 className="text-green-600 size-4 ml-0.5" />
              ) : (
                <span className="text-xs text-muted-foreground italic">({completedPackages} kez tamamlandı)</span>
              )}
            </span>
          )}
        </span>
      </div>
    </div>
  );
};

export const MemberCard = ({
  member,
  services,
  onClick,
  appointments,
}: MemberCardProps) => {
  // Hesaplamaları useMemo ile optimize et
  const memberServices = useMemo(() => {
    // Üyenin aldığı paketleri ve sayılarını hesapla
    const serviceCount = member.subscribed_services.reduce((acc, serviceId) => {
      acc[serviceId] = (acc[serviceId] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
    
    // Her bir servis için tamamlanan randevuları bul
    return Object.entries(serviceCount).map(([serviceId, count]) => {
      const service = services[serviceId];
      
      const serviceAppointments = appointments.filter(
        (apt) =>
          apt.service_id === serviceId &&
          apt.member_id === member.id &&
          (apt.status === "completed" || apt.status === "cancelled")
      );
      
      // Tamamlanan seans sayısı
      const completedSessions = serviceAppointments.length;
      
      return {
        serviceId,
        service,
        completedSessions,
        totalPackages: count
      };
    });
  }, [member, services, appointments]);
  
  return (
    <div
      className="bg-card rounded-xl p-4 sm:p-5 hover:shadow-md transition-all cursor-pointer border border-border/60 hover:border-primary/40 relative group"
      onClick={() => onClick(member)}
    >
      <div className="absolute top-3 right-3 flex items-center justify-center gap-2 z-10">
        <Badge
          variant={
            member.membership_type === "vip" ? "destructive" : "secondary"
          }
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 font-medium shadow-sm",
            member.membership_type === "vip" ? "bg-red-500/90 hover:bg-red-500 text-white" : ""
          )}
        >
          {member.membership_type === "vip" ? (
            <>
              VIP
              <Crown className="h-3.5 w-3.5 text-yellow-300" />
            </>
          ) : (
            "Standart"
          )}
        </Badge>
      </div>

      <div className="flex flex-col items-center text-center">
        <div className="relative">
          <Avatar className="size-20 ring-2 ring-primary/20 ring-offset-2 ring-offset-background group-hover:ring-primary/40 transition-all">
            <AvatarImage src={member.avatar_url || ""} alt={`${member.first_name} ${member.last_name}`} className="object-cover" />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {member.first_name[0]}
              {member.last_name[0]}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="mt-4 sm:mt-5">
          <h3 className="font-semibold text-sm sm:text-base tracking-tight">
            {member.first_name} {member.last_name}
          </h3>
          <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm text-muted-foreground mt-1">
            <Phone className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary/70" />
            <span>{member.phone}</span>
          </div>
        </div>

        <div className="w-full mt-4 pt-3 border-t border-border/50">
          <p className="text-xs text-muted-foreground mb-2 font-medium">Aldığı Paketler</p>
          <div className="flex flex-col gap-2.5 w-full">
            {memberServices.map(({ serviceId, service, completedSessions, totalPackages }) => (
              <ServiceProgress 
                key={serviceId}
                service={service}
                completedSessions={completedSessions}
                totalPackages={totalPackages}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
