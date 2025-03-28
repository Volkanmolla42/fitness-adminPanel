import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown, ChevronDown, Package, AlertCircle, AlertTriangle, Calendar, MessageCircle } from "lucide-react";
import type { Database } from "@/types/supabase";
import React, { useMemo, useState } from "react";
import cn from "classnames";
import { ServiceProgress } from "./ServiceProgress";
import { useTheme } from "@/contexts/theme-context";
import { Button } from "@/components/ui/button";
import { checkPackageStatus, PackageStatus } from "./MemberList";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

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

  // Üyenin paket durumunu kontrol et
  const packageStatus = useMemo((): PackageStatus => {
    return checkPackageStatus.getMemberPackageStatus(member, services, appointments);
  }, [member, services, appointments]);

  // Son randevu tarihini bul
  const lastAppointmentDate = useMemo(() => {
    // Üyenin tüm randevularını al
    const memberAppointments = appointments.filter(apt => apt.member_id === member.id);
    
    if (memberAppointments.length === 0) return null;
    
    // Randevuları tarihe göre sırala (yeniden eskiye)
    const sortedAppointments = [...memberAppointments].sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateB.getTime() - dateA.getTime(); // Yeniden eskiye sıralama
    });
    
    // Tamamlanmış veya iptal edilmiş son randevu
    const lastCompletedOrCancelled = sortedAppointments.find(
      apt => apt.status === "completed" || apt.status === "cancelled"
    );
    
    // Planlanan son randevu
    const lastPlanned = sortedAppointments.find(apt => apt.status === "scheduled");
    
    // Eğer paket bitmişse, son tamamlanan veya iptal edilen randevuyu göster
    if (packageStatus === "completed" && lastCompletedOrCancelled) {
      return {
        date: lastCompletedOrCancelled.date,
        time: lastCompletedOrCancelled.time,
        status: lastCompletedOrCancelled.status,
        isLast: true
      };
    }
    
    // Eğer paket bitmeye yakınsa ve planlanan randevu varsa, son planlanan randevuyu göster
    if (packageStatus === "almostCompleted" && lastPlanned) {
      return {
        date: lastPlanned.date,
        time: lastPlanned.time,
        status: lastPlanned.status,
        isLast: true
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
      chevronIconClass
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
    const message = packageStatus === "completed"
      ? `Merhaba ${member.first_name} hanım, paketiniz sona ermiştir. Yeni paket almak için bize ulaşabilirsiniz.`
      : `Merhaba ${member.first_name} hanım, paketiniz bitmek üzere. Yeni paket almak için bize ulaşabilirsiniz.`;
    
    // WhatsApp linkini oluştur
    const whatsappUrl = `https://wa.me/90${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    // Yeni sekmede aç
    window.open(whatsappUrl, "_blank");
  };

  return (
    <div
      className={`rounded-xl p-4 sm:p-5 hover:shadow-md transition-all cursor-pointer relative group ${
        getPackageStatusClasses.cardBorderClass
      }`}
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
            className={`size-20 ring-2 ring-offset-2 transition-all ${
              getPackageStatusClasses.avatarRingClass
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
          
          {/* Son randevu tarihi */}
          {lastAppointmentDate && (packageStatus === "completed" || packageStatus === "almostCompleted") && (
            <div className="flex flex-col items-center gap-1 mt-1">
              <div className={`flex items-center justify-center gap-1 ${
                packageStatus === "completed" 
                  ? "text-red-500" 
                  : "text-amber-500"
              }`}>
                <Calendar className="h-3 w-3" />
                <span className="text-xs font-medium">
                  {packageStatus === "completed" ? "Bitiş Tarihi: " : "Son Randevu: "}
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
          <Button 
            variant="secondary" 
            size="sm" 
            className={`w-full flex items-center justify-between mb-2 py-3 px-1 ${
              getPackageStatusClasses.packageButtonClass
            }`}
            onClick={handlePackageToggle}
          >
            <div className="flex items-center gap-1.5">
              <Package className={`h-3.5 w-3.5 ${getPackageStatusClasses.packageIconClass}`} />
              <span className="text-xs font-medium">
                Aldığı Paketler ({memberServices.length})
              </span>
            </div>
            <ChevronDown 
              className={`h-4 w-4 transition-transform duration-300 ${
                showPackages ? "rotate-180" : ""
              } ${
                getPackageStatusClasses.chevronIconClass
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
