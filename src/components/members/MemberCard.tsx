import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown } from "lucide-react";
import type { Database } from "@/types/supabase";
import React, { useMemo } from "react";
import cn from "classnames";
import { ServiceProgress } from "./ServiceProgress";
import { useTheme } from "@/contexts/theme-context";

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
        totalPackages: count,
      };
    });
  }, [member, services, appointments]);

  return (
    <div
      className={`rounded-xl p-4 sm:p-5 hover:shadow-md transition-all cursor-pointer relative group ${
        theme === "dark"
          ? "bg-gray-800 border border-gray-700 hover:border-primary/40"
          : "bg-card border border-border/60 hover:border-primary/40"
      }`}
      onClick={() => onClick(member)}
    >
      <div className="absolute top-3 right-3 flex items-center justify-center gap-2 z-10">
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
              theme === "dark"
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

        <div className={`w-full mt-2`}>
          <p className="text-xs text-muted-foreground mb-2 font-medium">
            Aldığı Paketler
          </p>
          <div className="flex flex-col gap-2.5 w-full">
            {memberServices.map(
              ({ serviceId, service, completedSessions, totalPackages }) => (
                <ServiceProgress
                  key={serviceId}
                  service={service}
                  completedSessions={completedSessions}
                  totalPackages={totalPackages}
                />
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
