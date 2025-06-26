import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Crown,
  ChevronDown,
  Package,
  AlertCircle,
  AlertTriangle,
  Calendar,
  MessageCircle,
  UserX,
  Users,
} from "lucide-react";
import type { Database } from "@/types/supabase";
import React, { useMemo, useState } from "react";
import cn from "classnames";
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

  // Paket kartı (MemberDetail'daki gibi)
  const PackageCard = React.useMemo(() =>
    ({ packageData }: { packageData: Package }) => {
      const totalSessions = packageData.totalSessions;
      const completedPercentage = totalSessions > 0 ? (packageData.completedSessions / totalSessions) * 100 : 0;
      const scheduledPercentage = totalSessions > 0 ? (packageData.scheduledSessions / totalSessions) * 100 : 0;
      const cancelledPercentage = totalSessions > 0 ? (packageData.cancelledSessions / totalSessions) * 100 : 0;
      const isDark = theme === "dark";
      const packageStyle = React.useMemo(() => {
        if (packageData.isActive) {
          return isDark
            ? "border-l-4 border-blue-500 pl-2 bg-primary/5"
            : "border-l-4 border-blue-500 pl-2 bg-primary/5";
        }
        const completionRate = packageData.progressPercentage;
        if (completionRate >= 90) {
          return isDark
            ? "border-l-4 border-green-600 pl-2 bg-green-900/5"
            : "border-l-4 border-green-600 pl-2 bg-green-50/50";
        }
        return isDark
          ? "border-l-4 border-gray-700 pl-2"
          : "border-l-4 border-gray-200 pl-2";
      }, [packageData.isActive, packageData.progressPercentage, isDark]);
      const getProgressColor = () => {
        const completionRate =
          ((packageData.completedSessions +
            packageData.scheduledSessions +
            packageData.cancelledSessions) /
            packageData.totalSessions) *
          100;
        if (packageData.isActive) {
          return isDark ? "bg-primary/20" : "bg-primary/20";
        }
        if (completionRate >= 90) {
          return isDark ? "bg-green-900/20" : "bg-green-100";
        }
        if (completionRate >= 50) {
          return isDark ? "bg-amber-900/20" : "bg-amber-100";
        }
        return isDark ? "bg-gray-800/50" : "bg-gray-100";
      };
      const formatDateShort = (date: Date | null) => {
        if (!date) return "Belirsiz";
        return format(date, "d MMM yyyy", { locale: tr });
      };
      return (
        <div className="mb-2 pt-2">
          <div
            className={cn(
              `flex items-center gap-3 p-4 rounded-lg transition-all duration-200 border hover:shadow-md relative ${
                isDark ? "hover:bg-gray-800/70" : "hover:bg-accent/70"
              }`,
              packageStyle
            )}
          >
            {packageData.isActive && (
              <Badge className="bg-gradient-to-r absolute -top-3 left-2 from-blue-500 to-blue-600 text-white text-xs px-2 py-0.5 shrink-0">
                Aktif
              </Badge>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <h3 className={`text-base font-semibold truncate ${isDark ? "text-gray-200" : "text-gray-900"}`}>
                    {packageData.serviceName}
                  </h3>
                </div>
                <div
                  className={`text-sm font-medium px-2 py-1 rounded-md shrink-0 ${
                    packageData.isActive
                      ? isDark
                        ? "bg-primary/10 text-primary"
                        : "bg-primary/10 text-primary"
                      : isDark
                      ? "bg-gray-800 text-gray-300"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {packageData.completedSessions + packageData.scheduledSessions + packageData.cancelledSessions}
                  /{packageData.totalSessions}
                </div>
              </div>
              <div className="flex items-center gap-1 mb-3 text-xs">
                <Calendar className={`h-3 w-3 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                <span className={isDark ? "text-gray-500" : "text-gray-400"}>
                  {formatDateShort(packageData.startDate)} - {formatDateShort(packageData.endDate)}
                </span>
              </div>
              <div className="space-y-2">
                <div className={`relative h-2 w-full flex overflow-hidden rounded-full ${getProgressColor()}`}>
                  {completedPercentage > 0 && (
                    <div
                      className="h-full bg-green-500 transition-all duration-300"
                      style={{ width: `${completedPercentage}%` }}
                      title={`Tamamlandı: ${packageData.completedSessions}`}
                    />
                  )}
                  {scheduledPercentage > 0 && (
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${scheduledPercentage}%` }}
                      title={`Planlanmış: ${packageData.scheduledSessions}`}
                    />
                  )}
                  {cancelledPercentage > 0 && (
                    <div
                      className="h-full bg-red-500 transition-all duration-300"
                      style={{ width: `${cancelledPercentage}%` }}
                      title={`İptal Edildi: ${packageData.cancelledSessions}`}
                    />
                  )}
                  {packageData.remainingSessions > 0 && (
                    <div
                      className={`h-full ${isDark ? "bg-gray-600" : "bg-gray-300"} transition-all duration-300`}
                      style={{
                        width: `${(packageData.remainingSessions / packageData.totalSessions) * 100}%`,
                      }}
                      title={`Kalan: ${packageData.remainingSessions}`}
                    />
                  )}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium flex flex-wrap gap-2">
                    {packageData.completedSessions > 0 && (
                      <span className="text-green-600 dark:text-green-400">
                        {packageData.completedSessions} tamamlanan
                      </span>
                    )}
                    {packageData.scheduledSessions > 0 && (
                      <span className="text-blue-600 dark:text-blue-400">
                        {packageData.scheduledSessions} planlanan
                      </span>
                    )}
                    {packageData.cancelledSessions > 0 && (
                      <span className="text-red-600 dark:text-red-400">
                        {packageData.cancelledSessions} iptal
                      </span>
                    )}
                    {packageData.remainingSessions > 0 && (
                      <span className="text-gray-500 dark:text-gray-300">
                        {packageData.remainingSessions} kalan
                      </span>
                    )}
                  </span>
                  <span className="font-medium">
                    %{Math.round(packageData.progressPercentage)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    },
  [theme]);

  return (
    <div
      className={`rounded-xl p-4 sm:p-5 hover:shadow-md transition-all cursor-pointer relative group ${getPackageStatusClasses.cardBorderClass}`}
      onClick={() => onClick(member)}
    >
      <div className="absolute top-3 left-3 flex w-full z-10 tracking-wide ">
        {packageStatus === "completed" && (
          <Badge
            variant="destructive"
            className="flex items-center gap-1.5 px-2.5 py-1  shadow-sm bg-red-500/90 hover:bg-red-500 text-white"
          >
            <AlertCircle className="h-3.5 w-3.5" />
            <span className="text-xs">Paket Bitti</span>
          </Badge>
        )}
        {packageStatus === "almostCompleted" && (
          <Badge
            variant="outline"
            className="flex items-center gap-1.5 px-2.5 py-1 font-medium shadow-sm bg-amber-600/90 hover:bg-amber-500 text-white"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span className="text-xs">Bitiyor</span>
          </Badge>
        )}
        {/* Sadece pasif üyelerde badge göster */}
        {!member.active && (
          <Badge
            variant="destructive"
            className={cn(
              "flex absolute top-8 right-6 items-center gap-1.5 px-2.5 py-1 font-medium shadow-sm",
              "bg-red-500/90 hover:bg-red-500 text-white"
            )}
          >
            <UserX className="h-3.5 w-3.5" />
            <span className="text-xs">Pasif</span>
          </Badge>
        )}
        <Badge
          variant={member.membership_type === "vip" ? "default" : "outline"}
          className={cn(
            "flex absolute top-0 right-6 items-center gap-1.5 px-2.5 py-1 font-medium shadow-sm",
            member.membership_type === "vip"
              ? "bg-amber-500/90 hover:bg-amber-500 border-amber-500"
              : theme === "dark"
              ? "bg-gray-700 text-gray-200"
              : ""
          )}
        >
          {member.membership_type === "vip" ? (
            <>
              <Crown className="h-3.5 w-3.5 text-white" />
            </>
          ) : (
            "Standart"
          )}
        </Badge>
      </div>

      <div className="flex flex-col items-center text-center">
        <div className="relative">
          <Avatar
            className={`size-20 ring-2 ring-offset-2 transition-all ${getPackageStatusClasses.avatarRingClass}`}
          >
            <AvatarImage
              src={member.avatar_url || ""}
              alt={`${member.first_name} ${member.last_name}`}
              className="object-cover"
            />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {member.first_name?.[0] || '?'}
              {member.last_name?.[0] || '?'}
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

          {/* Son randevu tarihi */}
          {lastAppointmentDate &&
            (packageStatus === "completed" ||
              packageStatus === "almostCompleted") && (
              <div className="flex flex-col items-center gap-1 mt-1">
                <div
                  className={`flex items-center justify-center gap-1 ${
                    packageStatus === "completed"
                      ? "text-red-500"
                      : "text-amber-500"
                  }`}
                >
                  <Calendar className="h-3 w-3" />
                  <span className="text-xs font-medium">
                    {packageStatus === "completed"
                      ? "Bitiş Tarihi: "
                      : "Son Randevu: "}
                    {formatDate(lastAppointmentDate.date)}
                  </span>
                </div>

                {/* WhatsApp Mesaj Butonu */}
                <Button
                  variant="ghost"
                  size="sm"
                  className={`mt-1 h-7 px-2 py-0 flex items-center gap-1 text-xs ${
                    packageStatus === "completed"
                      ? "text-red-600 hover:text-red-700 hover:bg-red-100"
                      : "text-amber-600 hover:text-amber-700 hover:bg-amber-100"
                  }`}
                  onClick={sendWhatsAppMessage}
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>WhatsApp Mesaj Gönder</span>
                </Button>
              </div>
            )}
        </div>

        <div className={`w-full mt-3`}>
          <div className="flex items-center gap-1.5 mb-2">
            <Package className={`h-3.5 w-3.5 ${getPackageStatusClasses.packageIconClass}`} />
            <span className="text-xs font-medium">
              Aktif Paketler ({activePackages.length})
            </span>
          </div>
          <div className="flex flex-col gap-2.5 w-full pt-1 pb-2">
            {/* Sadece aktif paketler */}
            {activePackages.length === 0 && (
              <div className="text-center text-xs text-muted-foreground py-2">Aktif paket bulunmamaktadır</div>
            )}
            {activePackages.map((packageData) => (
              <PackageCard key={packageData.id} packageData={packageData} />
            ))}
          </div>

          {/* Antrenör butonu - sadece üye aktivse ve ilgilenen antrenörler varsa göster */}
          {member.active && handlingTrainers.length > 0 && (
            <>
              <Button
                variant="secondary"
                size="sm"
                className={`w-full flex items-center justify-between mt-2 py-3 px-1 ${
                  theme === "dark"
                    ? "bg-blue-500/20 hover:bg-blue-500/30 text-blue-100"
                    : "bg-blue-100 hover:bg-blue-200 text-blue-700"
                }`}
                onClick={handleTrainersToggle}
              >
                <div className="flex items-center gap-1.5">
                  <Users
                    className={`h-3.5 w-3.5 ${
                      theme === "dark" ? "text-blue-400" : "text-blue-600"
                    }`}
                  />
                  <span className="text-xs font-medium">
                    İlgilenen Antrenörler ({handlingTrainers.length})
                  </span>
                </div>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-300 ${
                    showTrainers ? "rotate-180" : ""
                  } ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`}
                />
              </Button>

              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  showTrainers ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="flex flex-col gap-2 w-full pt-2 pb-2">
                  {handlingTrainers.map((trainer) => (
                    <div
                      key={trainer.id}
                      className={`flex items-center gap-2 p-2 rounded-md ${
                        theme === "dark"
                          ? "bg-gray-700/50"
                          : "bg-gray-100"
                      }`}
                    >
                      <Avatar className="h-6 w-6">

                        <AvatarFallback className="text-xs bg-blue-500/20 text-blue-700">
                          {trainer.first_name?.[0] || '?'}
                          {trainer.last_name?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs">
                        {trainer.first_name} {trainer.last_name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Pasife Al butonu - sadece paketi biten ve üye aktifse göster */}
      {packageStatus === "completed" && member.active && (
        <Button
          variant="destructive"
          size="sm"
          className="flex items-center gap-1 px-2 py-1 ml-2 text-xs"
          onClick={async (e) => {
            e.stopPropagation();
            const { setMemberPassive } = await import("@/services/setMemberPassive");
            const res = await setMemberPassive(member.id);
            if (res.success) {
              window.location.reload(); // veya bir state güncellemesi yapılabilir
            } else {
              alert("Üye pasife alınamadı: " + (res.error || "Bilinmeyen hata"));
            }
          }}
          title="Üyeyi pasife al"
        >
          <UserX className="h-3.5 w-3.5" />
          <span>Pasife Al</span>
        </Button>
      )}
    </div>
  );
};
