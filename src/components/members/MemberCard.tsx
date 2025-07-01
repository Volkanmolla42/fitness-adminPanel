import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Crown,
  ChevronDown,
  Package,
  AlertCircle,
  AlertTriangle,
  Calendar,
  UserX,
  Users,
  Phone,
  Activity,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import type { Database } from "@/types/supabase";
import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/theme-context";
import { Button } from "@/components/ui/button";
import { checkPackageStatus, PackageStatus } from "./MemberList";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

type Member = Database["public"]["Tables"]["members"]["Row"];
type Service = Database["public"]["Tables"]["services"]["Row"];
type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
type Trainer = Database["public"]["Tables"]["trainers"]["Row"];

interface Package {
  id: string;
  serviceId: string;
  serviceName: string;
  appointments: Appointment[];
  totalSessions: number;
  completedSessions: number;
  scheduledSessions: number;
  cancelledSessions: number;
  remainingSessions: number;
  startDate: Date | null;
  endDate: Date | null;
  isActive: boolean;
  packageNumber: number;
  progressPercentage: number;
}

interface MemberCardProps {
  member: Member;
  services: { [key: string]: Service };
  onClick: (member: Member) => void;
  appointments: Appointment[];
  trainers?: { [key: string]: Trainer };
}

export const MemberCard = ({
  member,
  services,
  onClick,
  appointments,
  trainers,
}: MemberCardProps) => {
  const { theme } = useTheme();
  const [showTrainers, setShowTrainers] = useState(false);


  // Üyenin paket durumunu kontrol et
  const packageStatus = useMemo((): PackageStatus => {
    return checkPackageStatus.getMemberPackageStatus(
      member,
      services,
      appointments
    );
  }, [member, services, appointments]);

  // Son randevu tarihini bul
  const lastAppointmentDate = useMemo(() => {
    // Üyenin tüm randevularını al
    const memberAppointments = appointments.filter(
      (apt) => apt.member_id === member.id
    );

    if (memberAppointments.length === 0) return null;

    // Randevuları tarihe göre sırala (yeniden eskiye)
    const sortedAppointments = [...memberAppointments].sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateB.getTime() - dateA.getTime(); // Yeniden eskiye sıralama
    });

    // Tamamlanmış veya iptal edilmiş son randevu
    const lastCompletedOrCancelled = sortedAppointments.find(
      (apt) => apt.status === "completed" || apt.status === "cancelled"
    );

    // Planlanan son randevu
    const lastPlanned = sortedAppointments.find(
      (apt) => apt.status === "scheduled"
    );

    // Eğer paket bitmişse, son tamamlanan veya iptal edilen randevuyu göster
    if (packageStatus === "completed" && lastCompletedOrCancelled) {
      return {
        date: lastCompletedOrCancelled.date,
        time: lastCompletedOrCancelled.time,
        status: lastCompletedOrCancelled.status,
        isLast: true,
      };
    }

    // Eğer paket bitmeye yakınsa ve planlanan randevu varsa, son planlanan randevuyu göster
    if (packageStatus === "almostCompleted" && lastPlanned) {
      return {
        date: lastPlanned.date,
        time: lastPlanned.time,
        status: lastPlanned.status,
        isLast: true,
      };
    }

    // Diğer durumlarda null döndür
    return null;
  }, [appointments, member.id, packageStatus]);

  // Paket durumuna göre UI sınıflarını belirle
  const getPackageStatusClasses = useMemo(() => {
    // Kart border rengi
    const cardBorderClass =
      packageStatus === "completed"
        ? theme === "dark"
          ? "bg-gray-800 border-2 border-red-500/70 hover:border-red-500"
          : "bg-card border-2 border-red-500/60 hover:border-red-500"
        : packageStatus === "almostCompleted"
        ? theme === "dark"
          ? "bg-gray-800 border-2 border-amber-500/70 hover:border-amber-500"
          : "bg-card border-2 border-amber-500/60 hover:border-amber-500"
        : theme === "dark"
        ? "bg-gray-800 border border-gray-700 hover:border-primary/40"
        : "bg-card border border-border/60 hover:border-primary/40";

    // Avatar halka rengi
    const avatarRingClass =
      packageStatus === "completed"
        ? "ring-red-500/70 ring-offset-background"
        : packageStatus === "almostCompleted"
        ? "ring-amber-500/70 ring-offset-background"
        : theme === "dark"
        ? "ring-primary/30 ring-offset-gray-800 group-hover:ring-primary/50"
        : "ring-primary/20 ring-offset-background group-hover:ring-primary/40";

    // Paket butonu rengi
    const packageButtonClass =
      packageStatus === "completed"
        ? theme === "dark"
          ? "bg-red-500/20 hover:bg-red-500/30 text-red-100"
          : "bg-red-100 hover:bg-red-200 text-red-700"
        : packageStatus === "almostCompleted"
        ? theme === "dark"
          ? "bg-amber-500/20 hover:bg-amber-500/30 text-amber-100"
          : "bg-amber-100 hover:bg-amber-200 text-amber-700"
        : theme === "dark"
        ? "hover:bg-gray-700/60"
        : "hover:bg-gray-100/80";

    // Paket ikonu rengi
    const packageIconClass =
      packageStatus === "completed"
        ? "text-red-500"
        : packageStatus === "almostCompleted"
        ? "text-amber-500"
        : "text-primary";

    // Chevron ikonu rengi
    const chevronIconClass =
      packageStatus === "completed"
        ? "text-red-500"
        : packageStatus === "almostCompleted"
        ? "text-amber-500"
        : "text-muted-foreground";

    return {
      cardBorderClass,
      avatarRingClass,
      packageButtonClass,
      packageIconClass,
      chevronIconClass,
    };
  }, [packageStatus, theme]);

  // Tarihi formatla
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, "d MMM yyyy", { locale: tr });
    } catch (error) {
      console.error("Tarih formatlama hatası:", error);
      return dateStr;
    }
  };

  // WhatsApp mesajı gönder
  const sendWhatsAppMessage = (e: React.MouseEvent) => {
    e.stopPropagation(); // Üye kartına tıklama olayının tetiklenmesini engelle

    // Telefon numarasını formatla (başında + olmadan ve boşluklar olmadan)
    const phoneNumber = member.phone.replace(/\s+/g, "");

    // Mesaj içeriğini hazırla
    const message =
      packageStatus === "completed"
        ? `Merhaba ${member.first_name} hanım, paketiniz sona ermiştir. Yeni paket almak için bize ulaşabilirsiniz.`
        : `Merhaba ${member.first_name} hanım, paketiniz bitmek üzere. Yeni paket almak için bize ulaşabilirsiniz.`;

    // WhatsApp linkini oluştur
    const whatsappUrl = `https://wa.me/90${phoneNumber}?text=${encodeURIComponent(
      message
    )}`;

    // Yeni sekmede aç
    window.open(whatsappUrl, "_blank");
  };

  // Üye ile ilgilenen antrenörleri bul
  const handlingTrainers = useMemo(() => {
    // trainers tanımlanmamışsa boş dizi döndür
    if (!trainers) return [];

    // checkPackageStatus.getMemberHandlingTrainers fonksiyonunu kullan
    return checkPackageStatus.getMemberHandlingTrainers(
      member,
      appointments,
      trainers,
      services
    );
  }, [member, appointments, trainers, services]);

  // Antrenör butonuna tıklandığında event'in yayılmasını engelle
  const handleTrainersToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); // Üye kartına tıklama olayının tetiklenmesini engelle
    setShowTrainers(!showTrainers);
  };

  // Paketleri MemberDetail'daki gibi grupla
  const groupAppointmentsIntoPackages = React.useCallback(
    (
      appointments: Appointment[],
      services: { [key: string]: Service },
      member: Member
    ) => {
      const packages: Package[] = [];
      const appointmentsByService: Record<string, Appointment[]> = {};
      appointments.forEach((appointment) => {
        const serviceId = appointment.service_id;
        if (!appointmentsByService[serviceId]) {
          appointmentsByService[serviceId] = [];
        }
        appointmentsByService[serviceId].push(appointment);
      });
      // Also check for services that member has subscribed to but has no appointments yet
      const allSubscribedServices = [...new Set(member.subscribed_services)];
      allSubscribedServices.forEach(serviceId => {
        if (!appointmentsByService[serviceId]) {
          appointmentsByService[serviceId] = [];
        }
      });

      Object.entries(appointmentsByService).forEach(
        ([serviceId, serviceAppointments]) => {
          const service = services[serviceId];
          if (!service) {
            return;
          }
          const sessionsPerPackage = service.session_count || 0;
          if (sessionsPerPackage === 0) {
            return;
          }
          const serviceCount = member.subscribed_services.filter(
            (id) => id === serviceId
          ).length;
          if (serviceCount === 0) return;
          const sortedAppointments = [...serviceAppointments].sort((a, b) => {
            const dateA = new Date(`${a.date} ${a.time}`);
            const dateB = new Date(`${b.date} ${b.time}`);
            return dateA.getTime() - dateB.getTime();
          });
          const remainingAppointments = [...sortedAppointments];
          for (let i = 0; i < serviceCount; i++) {
            const packageId = `${serviceId}-package-${i + 1}`;
            const packageAppointments = remainingAppointments.splice(
              0,
              sessionsPerPackage
            );
            // Calculate package stats (even if no appointments yet)
            const completedSessions = packageAppointments.filter(
              (apt) => apt.status === "completed"
            ).length;
            const scheduledSessions = packageAppointments.filter(
              (apt) => apt.status === "scheduled"
            ).length;
            const cancelledSessions = packageAppointments.filter(
              (apt) => apt.status === "cancelled"
            ).length;
            const totalSessions = sessionsPerPackage;
            const remainingSessions =
              totalSessions -
              completedSessions -
              scheduledSessions -
              cancelledSessions;
            const isActive =
              completedSessions + cancelledSessions < totalSessions;
            let startDate = null;
            let endDate = null;
            if (packageAppointments.length > 0) {
              const firstAppointment = packageAppointments[0];
              const lastAppointment = packageAppointments[packageAppointments.length - 1];

              // Start date is the first appointment
              if (firstAppointment?.date && firstAppointment?.time) {
                startDate = new Date(
                  `${firstAppointment.date}T${firstAppointment.time}`
                );
              }

              // End date is the last appointment
              if (lastAppointment?.date && lastAppointment?.time) {
                endDate = new Date(
                  `${lastAppointment.date}T${lastAppointment.time}`
                );
              }
            }
            const progressPercentage =
              ((completedSessions + scheduledSessions) / totalSessions) * 100;

            const packageData = {
              id: packageId,
              serviceId,
              serviceName: service.name,
              appointments: packageAppointments,
              totalSessions,
              completedSessions,
              scheduledSessions,
              cancelledSessions,
              remainingSessions,
              startDate,
              endDate,
              isActive,
              packageNumber: i + 1,
              progressPercentage,
            };

            packages.push(packageData);
          }
        }
      );
      return packages;
    },
    [services]
  );

  // Üyenin tüm randevularını al
  const memberAppointments = React.useMemo(
    () => appointments.filter((apt) => apt.member_id === member.id),
    [appointments, member.id]
  );

  // Paketleri grupla ve sırala
  const memberPackages = React.useMemo(() => {
    const allPackages = groupAppointmentsIntoPackages(
      memberAppointments,
      services,
      member
    );
    return allPackages.sort((a, b) => {
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;
      const dateA = a.startDate ? a.startDate.getTime() : 0;
      const dateB = b.startDate ? b.startDate.getTime() : 0;
      return dateB - dateA;
    });
  }, [memberAppointments, services, member, groupAppointmentsIntoPackages]);

  // Aktif paketleri ayır
  const activePackages = React.useMemo(() => {
    return memberPackages.filter((pkg) => pkg.isActive);
  }, [memberPackages]);



  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-card transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 cursor-pointer",
        getPackageStatusClasses.cardBorderClass
      )}
      onClick={() => onClick(member)}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${member.first_name} ${member.last_name}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(member);
        }
      }}
    >
      {/* Status Indicator Bar */}
      <div className={cn(
        "h-1 w-full",
        packageStatus === "completed" ? "bg-destructive" :
        packageStatus === "almostCompleted" ? "bg-amber-500" :
        "bg-primary/20"
      )} />

      {/* Header Section with Badges */}
      <div className="relative p-4 pb-2">
        <div className="flex items-start justify-between gap-2 mb-3">
          {/* Status Badges */}
          <div className="flex flex-wrap gap-1.5">
            {packageStatus === "completed" && (
              <Badge variant="destructive" className="text-xs font-medium">
                <AlertCircle className="h-3 w-3 mr-1" />
                Paket Bitti
              </Badge>
            )}
            {packageStatus === "almostCompleted" && (
              <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Bitiyor
              </Badge>
            )}
            {!member.active && (
              <Badge variant="destructive" className="text-xs font-medium">
                <UserX className="h-3 w-3 mr-1" />
                Pasif
              </Badge>
            )}
          </div>

          {/* Membership Type Badge */}
          <Badge
            variant={member.membership_type === "vip" ? "default" : "secondary"}
            className={cn(
              "text-xs font-medium shrink-0",
              member.membership_type === "vip" && "bg-gradient-to-r from-purple-600 to-purple-600 text-white border-0"
            )}
          >
            {member.membership_type === "vip" ? (
              <>
                <Crown className="h-3 w-3 mr-1" />
                VIP
              </>
            ) : (
              "Standart"
            )}
          </Badge>
        </div>

        {/* Main Content Area */}
        <div className="flex items-start gap-4">
          {/* Avatar Section */}
          <div className="relative shrink-0">
            <Avatar
              className={cn(
                "h-16 w-16 ring-2 ring-offset-2 transition-all duration-300",
                getPackageStatusClasses.avatarRingClass
              )}
            >
              <AvatarImage
                src={member.avatar_url || ""}
                alt={`${member.first_name} ${member.last_name}`}
                className="object-cover"
              />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                {member.first_name?.[0] || '?'}
                {member.last_name?.[0] || '?'}
              </AvatarFallback>
            </Avatar>

            {/* Activity Indicator */}
            <div className={cn(
              "absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-background flex items-center justify-center",
              member.active ? "bg-green-500" : "bg-gray-400"
            )}>
              <Activity className="h-2.5 w-2.5 text-white" />
            </div>
          </div>

          {/* Member Info Section */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1 flex-1 min-w-0">
                <h3 className="font-semibold text-lg leading-tight text-foreground truncate">
                  {member.first_name} {member.last_name}
                </h3>

                {/* Contact Info */}
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    <span className="truncate">{member.phone}</span>
                  </div>
                </div>

                {/* Last Appointment Info */}
                {lastAppointmentDate &&
                  (packageStatus === "completed" || packageStatus === "almostCompleted") && (
                    <div className={cn(
                      "flex items-center gap-1.5 text-xs font-medium mt-1",
                      packageStatus === "completed" ? "text-destructive" : "text-amber-600"
                    )}>
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        {packageStatus === "completed" ? "Bitiş: " : "Son Randevu: "}
                        {formatDate(lastAppointmentDate.date)}
                      </span>
                    </div>
                  )}
              </div>

              {/* WhatsApp Message Button - Moved to top right */}
              {lastAppointmentDate &&
                (packageStatus === "completed" || packageStatus === "almostCompleted") && (
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "shrink-0 h-8 px-3 text-xs",
                      packageStatus === "completed"
                        ? "border-destructive/50 text-destructive hover:bg-destructive/10"
                        : "bg-primary/10"
                    )}
                    onClick={sendWhatsAppMessage}
                  >
                    <WhatsAppIcon className="h-3.5 w-3.5 mr-1.5" />
                    Haber ver
                  </Button>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Package Information Section */}
      <div className="px-4 pb-4">
        <div className="space-y-3">
          {/* Package Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className={cn(
                "h-4 w-4",
                getPackageStatusClasses.packageIconClass
              )} />
              <span className="text-sm font-medium text-foreground">
                Aktif Paketler
              </span>
              <Badge variant="secondary" className="text-xs">
                {activePackages.length}
              </Badge>
            </div>
          </div>

          {/* Package List */}
          <div className="space-y-2">
            {activePackages.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground bg-muted/30 rounded-lg">
                Aktif paket bulunmamaktadır
              </div>
            ) : (
              activePackages.map((packageData) => (
                <div
                  key={packageData.id}
                  className={cn(
                    "p-3 rounded-lg border bg-background/50 transition-colors hover:bg-accent/50",
                    packageData.isActive && "border-primary/20 bg-primary/5"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm text-foreground truncate">
                      {packageData.serviceName}
                    </h4>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="text-xs">
                        {packageData.completedSessions + packageData.scheduledSessions + packageData.cancelledSessions}
                        /{packageData.totalSessions}
                      </Badge>
                    </div>
                  </div>

                  {/* Package Date Range */}
                  {(packageData.startDate || packageData.endDate) && (
                    <div className="flex items-center gap-1 mb-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {packageData.startDate && formatDate(packageData.startDate.toISOString().split('T')[0])}
                        {packageData.startDate && packageData.endDate && " - "}
                        {packageData.endDate && formatDate(packageData.endDate.toISOString().split('T')[0])}
                      </span>
                    </div>
                  )}

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
                      {packageData.completedSessions > 0 && (
                        <div
                          className="bg-green-500 transition-all duration-300"
                          style={{ width: `${(packageData.completedSessions / packageData.totalSessions) * 100}%` }}
                        />
                      )}
                      {packageData.scheduledSessions > 0 && (
                        <div
                          className="bg-blue-500 transition-all duration-300"
                          style={{ width: `${(packageData.scheduledSessions / packageData.totalSessions) * 100}%` }}
                        />
                      )}
                      {packageData.cancelledSessions > 0 && (
                        <div
                          className="bg-destructive transition-all duration-300"
                          style={{ width: `${(packageData.cancelledSessions / packageData.totalSessions) * 100}%` }}
                        />
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-3">
                        {packageData.completedSessions > 0 && (
                          <span className="text-green-600">
                            {packageData.completedSessions} tamamlanan
                          </span>
                        )}
                        {packageData.scheduledSessions > 0 && (
                          <span className="text-blue-600">
                            {packageData.scheduledSessions} planlanan
                          </span>
                        )}
                        {packageData.remainingSessions > 0 && (
                          <span>
                            {packageData.remainingSessions} kalan
                          </span>
                        )}
                      </div>
                      <span className="font-medium">
                        %{Math.round(packageData.progressPercentage)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <div className="px-4 pb-4 space-y-3">
        {/* Trainers Section */}
        {member.active && handlingTrainers.length > 0 && (
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full flex items-center justify-between p-2 h-auto"
              onClick={handleTrainersToggle}
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium">
                  İlgilenen Antrenörler ({handlingTrainers.length})
                </span>
              </div>
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  showTrainers && "rotate-180"
                )}
              />
            </Button>

            <div
              className={cn(
                "overflow-hidden transition-all duration-200 ease-in-out",
                showTrainers ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
              )}
            >
              <div className="space-y-1 pt-1">
                {handlingTrainers.map((trainer) => (
                  <div
                    key={trainer.id}
                    className="flex items-center gap-2 p-2 rounded-md bg-muted/50"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {trainer.first_name?.[0] || '?'}
                        {trainer.last_name?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">
                      {trainer.first_name} {trainer.last_name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Deactivate Member Button */}
        {packageStatus === "completed" && member.active && (
          <Button
            variant="destructive"
            size="sm"
            className="w-full flex items-center justify-center gap-2"
            onClick={async (e) => {
              e.stopPropagation();
              const { setMemberPassive } = await import("@/services/setMemberPassive");
              const res = await setMemberPassive(member.id);
              if (res.success) {
                window.location.reload();
              } else {
                alert("Üye pasife alınamadı: " + (res.error || "Bilinmeyen hata"));
              }
            }}
          >
            <UserX className="h-4 w-4" />
            Pasife Al
          </Button>
        )}
      </div>

    </div>
  );
};
