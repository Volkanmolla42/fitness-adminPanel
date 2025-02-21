import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle2, Crown, Mail, Phone } from "lucide-react";
import type { Database } from "@/types/supabase";
import React from "react";
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

export const MemberCard = ({
  member,
  services,
  onClick,
  appointments,
}: MemberCardProps) => {
  return (
    <div
      className="bg-card rounded-lg p-4 hover:shadow-lg transition-all cursor-pointer border border-border hover:border-primary/50 relative"
      onClick={() => onClick(member)}
    >
      <div className="absolute top-2 right-2 flex items-center justify-center gap-2">
        <Badge
          variant={
            member.membership_type === "vip" ? "destructive" : "secondary"
          }
          className="flex items-center gap-1.5 px-2.5 py-1"
        >
          {member.membership_type === "vip" ? (
            <>
              VIP
              <Crown className="h-3.5 w-3.5 text-yellow-400" />
            </>
          ) : (
            "Standart"
          )}
        </Badge>
      </div>

      <div className="flex flex-col items-center text-center">
        <Avatar className="h-20 w-20">
          <AvatarImage src={member.avatar_url || ""} />
          <AvatarFallback>
            {member.first_name[0]}
            {member.last_name[0]}
          </AvatarFallback>
        </Avatar>
        <div className="mt-4">
          <h3 className="font-semibold">
            {member.first_name} {member.last_name}
          </h3>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Phone className="h-3.5 w-3.5" />
            <span>{member.phone}</span>
          </div>
          {member.email && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              <span>{member.email}</span>
            </div>
          )}
        </div>

        <div className="w-full mt-3">
          <p className="text-xs text-muted-foreground mb-1">Aldığı Paketler</p>
          <div className="flex flex-col gap-2 w-full">
            {Object.entries(
              member.subscribed_services.reduce((acc, serviceId) => {
                acc[serviceId] = (acc[serviceId] || 0) + 1;
                return acc;
              }, {} as { [key: string]: number })
            ).map(([serviceId, count]) => {
              const service = services[serviceId];

              // Bu servis için tamamlanan randevuları bul
              const serviceAppointments = appointments.filter(
                (apt) =>
                  apt.service_id === serviceId &&
                  apt.member_id === member.id &&
                  (apt.status === "completed" || apt.status === "cancelled")
              );

              // Tamamlanan seans sayısı
              const completedSessions = serviceAppointments.length;

              // Bir paketin seans sayısı
              const sessionsPerPackage = service?.session_count || 0;

              // Eğer üye bu paketten sadece 1 tane almışsa ve seans sayısını aşmışsa
              // gerçek tamamlanan seans sayısını göster
              if (count === 1 && completedSessions > sessionsPerPackage) {
                return (
                  <div
                    key={serviceId}
                    className="w-full bg-primary/10 p-2 rounded-md"
                  >
                    <Badge
                      variant="outline"
                      className="px-3 py-1 flex items-center gap-2 mb-1"
                    >
                      <span className="mr-auto">
                        {service?.name || "Yükleniyor..."}
                      </span>
                    </Badge>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={100}
                        className="h-2 bg-green-100 [&>div]:bg-green-500"
                      />
                      <span className="text-xs flex items-center gap-1 whitespace-nowrap">
                        {completedSessions}/{sessionsPerPackage}
                        <CheckCircle2 className="text-green-600 size-4" />
                      </span>
                    </div>
                  </div>
                );
              }

              // Tamamlanan seansların kaç pakete denk geldiğini hesapla
              const completedPackages = Math.floor(
                completedSessions / sessionsPerPackage
              );
              console.log(completedPackages);

              // Son paketteki tamamlanan seans sayısı
              const currentPackageCompletedSessions =
                completedSessions % sessionsPerPackage ||
                (completedSessions > 0 &&
                completedSessions === completedPackages * sessionsPerPackage
                  ? sessionsPerPackage
                  : 0);

              // İlerleme yüzdesi (son paket için)
              const progress =
                (currentPackageCompletedSessions / sessionsPerPackage) * 100;

              return (
                <div
                  key={serviceId}
                  className="w-full bg-primary/10 p-2 rounded-md"
                >
                  <Badge
                    variant="outline"
                    className="px-3 py-1 flex items-center gap-2 mb-1"
                  >
                    {count > 1 && (
                      <span className="text-red-500">{count} ×</span>
                    )}
                    <span className="mr-auto">
                      {service?.name || "Yükleniyor..."}
                    </span>
                  </Badge>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={progress}
                      className={cn(
                        "h-2",
                        progress >= 100
                          ? "bg-green-100 [&>div]:bg-green-600"
                          : ""
                      )}
                    />
                    <span className="text-xs whitespace-nowrap flex items-center gap-1">
                      {currentPackageCompletedSessions}/{sessionsPerPackage}
                      {(completedPackages > 0 || progress >= 100) && (
                        <span className="ml-1 ">
                          {progress >= 100 ? (
                            <CheckCircle2 className="text-green-600  size-4" />
                          ) : (
                            <span>({completedPackages} kez tamamlandı)</span>
                          )}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
