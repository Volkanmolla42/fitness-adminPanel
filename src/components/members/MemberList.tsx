import { Input } from "@/components/ui/input";
import { Search, PackageOpen, AlertTriangle } from "lucide-react";
import type { Database } from "@/types/supabase";
import { MemberCard } from "./MemberCard";
import React, { useMemo, useEffect, useState } from "react";
import { useTheme } from "@/contexts/theme-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Member = Database["public"]["Tables"]["members"]["Row"];
type Service = Database["public"]["Tables"]["services"]["Row"];
type Trainer = Database["public"]["Tables"]["trainers"]["Row"];
type Appointment = Database["public"]["Tables"]["appointments"]["Row"];

// Paket durumu için tip tanımı
export type PackageStatus = "completed" | "almostCompleted" | "active";

// Paket durumunu kontrol eden yardımcı fonksiyonlar
export const checkPackageStatus = {
  /**
   * Bir üyenin tüm paketlerinin durumunu kontrol eder
   * @param member Üye
   * @param services Servisler
   * @param appointments Randevular
   * @returns Paket durumu: completed (bitmiş), almostCompleted (bitmeye yakın), active (aktif)
   */
  getMemberPackageStatus: (
    member: Member,
    services: { [key: string]: Service },
    appointments: Appointment[]
  ): PackageStatus => {
    // Eğer üyenin hiç paketi yoksa "active" döndür
    if (member.subscribed_services.length === 0) return "active";

    // Üyenin aldığı paketleri ve sayılarını hesapla
    const serviceCount = member.subscribed_services.reduce((acc, serviceId) => {
      acc[serviceId] = (acc[serviceId] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    // Her bir paket için durum kontrolü yap
    const packageStatuses = Object.entries(serviceCount).map(
      ([serviceId, totalPackages]) => {
        return checkPackageStatus.getServicePackageStatus(
          serviceId,
          totalPackages,
          member.id,
          services,
          appointments
        );
      }
    );

    // Eğer tüm paketler bitmişse "completed" döndür
    if (packageStatuses.every((status) => status === "completed")) {
      return "completed";
    }

    // Eğer en az bir paket bitmeye yakınsa "almostCompleted" döndür
    if (packageStatuses.some((status) => status === "almostCompleted")) {
      return "almostCompleted";
    }

    // Diğer durumlarda "active" döndür
    return "active";
  },

  getServicePackageStatus: (
    serviceId: string,
    totalPackages: number,
    memberId: string,
    services: { [key: string]: Service },
    appointments: Appointment[]
  ): PackageStatus => {
    const service = services[serviceId];
    if (!service) return "active";

    const sessionsPerPackage = service?.session_count || 0;
    const totalSessionsAvailable = totalPackages * sessionsPerPackage;

    // Bu üyenin bu servise ait tüm randevuları
    const serviceAppointments = appointments.filter(
      (apt) => apt.service_id === serviceId && apt.member_id === memberId
    );

    // Tamamlanan ve iptal edilen randevuları say
    const completedAppointments = serviceAppointments.filter(
      (apt) => apt.status === "completed"
    );
    const cancelledAppointments = serviceAppointments.filter(
      (apt) => apt.status === "cancelled"
    );
    const usedSessions =
      completedAppointments.length + cancelledAppointments.length;

    // Planlanan randevuları say
    const plannedAppointments = serviceAppointments.filter(
      (apt) => apt.status === "scheduled"
    );

    // Kalan seans sayısını hesapla (planlananlar dahil değil)
    const remainingSessions = totalSessionsAvailable - usedSessions;

    // Eğer kullanılan seans sayısı toplam seans sayısına eşit veya fazlaysa
    // VE planlanan randevu yoksa, bu paket bitmiş demektir
    if (
      usedSessions >= totalSessionsAvailable &&
      plannedAppointments.length === 0
    ) {
      return "completed";
    }

    // Eğer kalan seans sayısı 3 veya daha azsa ve planlanan randevu sayısı 3 veya daha azsa
    // bu paket bitmeye yakın demektir
    if (remainingSessions <= 3 && plannedAppointments.length <= 3) {
      return "almostCompleted";
    }

    // Diğer durumlarda paket aktif demektir
    return "active";
  },

  hasCompletedAllPackages: (
    member: Member,
    services: { [key: string]: Service },
    appointments: Appointment[]
  ): boolean => {
    return (
      checkPackageStatus.getMemberPackageStatus(
        member,
        services,
        appointments
      ) === "completed"
    );
  },

  hasAlmostCompletedPackages: (
    member: Member,
    services: { [key: string]: Service },
    appointments: Appointment[]
  ): boolean => {
    return (
      checkPackageStatus.getMemberPackageStatus(
        member,
        services,
        appointments
      ) === "almostCompleted"
    );
  },
};

interface MemberListProps {
  members: Member[];
  services: { [key: string]: Service };
  trainers: Trainer[];
  appointments: Appointment[];
  searchTerm: string;
  membershipFilter: Member["membership_type"] | "all";
  activeFilter: "all" | "active" | "inactive";
  selectedTrainerId: string | "all";
  onSearch: (term: string) => void;
  onMemberClick: (member: Member) => void;
  onTrainerFilterChange: (trainerId: string) => void;
  onActiveFilterChange: (filter: "all" | "active" | "inactive") => void;
  highlightedMemberId?: string | null; // Highlight edilecek üye ID'si
  onStatsChange?: (stats: {
    total: number;
    basic: number;
    vip: number;
    active: number;
    inactive: number;
  }) => void; // İstatistikleri üst bileşene iletmek için
}

export const MemberList = ({
  members,
  services,
  trainers,
  appointments,
  searchTerm,
  membershipFilter,
  activeFilter,
  selectedTrainerId,
  onSearch,
  onMemberClick,
  onTrainerFilterChange,
  highlightedMemberId,
  onStatsChange,
}: MemberListProps) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [packageFilter, setPackageFilter] = useState<
    "all" | "completed" | "almostCompleted"
  >("all");

  // Filtreleme ve istatistik hesaplamalarını useMemo ile optimize ediyoruz
  const { filteredMembers, stats } = useMemo(() => {
    // Tüm filtreleme mantığını burada topladık
    const filtered = members
      .filter((member) => {
        const matchesSearch =
          member.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.phone.includes(searchTerm);

        // Üyelik tipi filtresini kontrol et (basic, vip)
        const matchesFilter =
          membershipFilter === "all" ||
          member.membership_type === membershipFilter;

        // Aktif/pasif üye filtresini kontrol et
        const matchesActiveFilter =
          activeFilter === "all" ||
          (activeFilter === "active" && member.active) ||
          (activeFilter === "inactive" && !member.active);

        const matchesTrainer =
          selectedTrainerId === "all" ||
          appointments.some(
            (appointment) =>
              appointment.member_id === member.id &&
              appointment.trainer_id === selectedTrainerId
          );

        // Paket filtresini kontrol et
        const matchesPackageFilter =
          packageFilter === "all" ||
          (packageFilter === "completed" &&
            checkPackageStatus.hasCompletedAllPackages(
              member,
              services,
              appointments
            )) ||
          (packageFilter === "almostCompleted" &&
            checkPackageStatus.hasAlmostCompletedPackages(
              member,
              services,
              appointments
            ));

        return (
          matchesSearch &&
          matchesFilter &&
          matchesActiveFilter &&
          matchesTrainer &&
          matchesPackageFilter
        );
      })
      .sort((a, b) => {
        // Paketi bitenler veya bitmeye yakın olanlar önce gösterilsin
        if (
          packageFilter === "completed" ||
          packageFilter === "almostCompleted"
        )
          return 0;

        // VIP üyeleri önce göster
        if (a.membership_type === "vip" && b.membership_type !== "vip")
          return -1;
        if (a.membership_type !== "vip" && b.membership_type === "vip")
          return 1;

        // Aynı üyelik tipindeyse isme göre sırala
        return a.first_name.localeCompare(b.first_name);
      });

    // Filtreleme istatistiklerini hesaplıyoruz
    const memberStats = {
      total: members.length,
      filtered: filtered.length,
      basic: members.filter((m) => m.membership_type === "basic").length,
      vip: members.filter((m) => m.membership_type === "vip").length,
      active: members.filter((m) => m.active).length,
      inactive: members.filter((m) => !m.active).length,
      filteredBasic: filtered.filter((m) => m.membership_type === "basic")
        .length,
      filteredVip: filtered.filter((m) => m.membership_type === "vip").length,
      filteredActive: filtered.filter((m) => m.active).length,
      filteredInactive: filtered.filter((m) => !m.active).length,
      completedPackages: members.filter((m) =>
        checkPackageStatus.hasCompletedAllPackages(m, services, appointments)
      ).length,
      almostCompletedPackages: members.filter((m) =>
        checkPackageStatus.hasAlmostCompletedPackages(m, services, appointments)
      ).length,
    };

    return { filteredMembers: filtered, stats: memberStats };
  }, [
    members,
    appointments,
    searchTerm,
    membershipFilter,
    activeFilter,
    selectedTrainerId,
    packageFilter,
    services,
  ]);

  // İstatistikleri üst bileşene iletiyoruz
  useEffect(() => {
    if (onStatsChange) {
      onStatsChange({
        total: stats.total,
        basic: stats.basic,
        vip: stats.vip,
        active: stats.active,
        inactive: stats.inactive,
      });
    }
  }, [stats, onStatsChange]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search
          className={`absolute left-2 top-2.5 h-4 w-4 ${
            isDark ? "text-gray-400" : "text-muted-foreground"
          }`}
        />
        <Input
          placeholder="Ad Soyad veya telefon ile ara..."
          value={searchTerm}
          onChange={(e) => onSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      <div className="flex flex-col md:flex-row gap-2 md:items-center md:space-x-2">
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:space-x-2 w-full">
          <Select
            value={packageFilter}
            onValueChange={(value: "all" | "completed" | "almostCompleted") =>
              setPackageFilter(value)
            }
          >
            <SelectTrigger
              className={`w-full md:w-[220px] ${
                isDark ? "bg-gray-800 text-gray-200 border-gray-700" : ""
              }`}
            >
              <SelectValue placeholder="Paket Durumu" />
            </SelectTrigger>
            <SelectContent
              className={
                isDark
                  ? "dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700"
                  : ""
              }
            >
              <SelectItem value="all">Tüm Paketler</SelectItem>
              <SelectItem value="completed" className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <PackageOpen className="h-4 w-4 text-red-500" />
                  <span>Paketi Bitenler ({stats.completedPackages})</span>
                </div>
              </SelectItem>
              <SelectItem
                value="almostCompleted"
                className="flex items-center gap-2"
              >
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span>
                    Paketi Bitmeye Yakın ({stats.almostCompletedPackages})
                  </span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <select
            value={selectedTrainerId}
            onChange={(e) => onTrainerFilterChange(e.target.value)}
            className={`w-full p-2 border rounded-md ${
              isDark
                ? "bg-gray-800 text-gray-200 border-gray-700"
                : "bg-white text-gray-900 border-gray-300"
            }`}
          >
            <option value="all">Tüm Antrenörler</option>
            {trainers.map((trainer) => (
              <option key={trainer.id} value={trainer.id}>
                {trainer.first_name} {trainer.last_name}
              </option>
            ))}
          </select>
        </div>
        <p
          className={`text-sm whitespace-nowrap ${
            isDark ? "text-gray-400" : "text-muted-foreground"
          }`}
        >
          {filteredMembers.length} üye listeleniyor
          {searchTerm && ` (${stats.total} üyeden)`}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.map((member) => (
          <div
            key={member.id}
            className={`transition-all duration-500 ${
              highlightedMemberId === member.id
                ? "scale-105 ring-2 ring-primary ring-offset-2 shadow-lg"
                : ""
            }`}
          >
            <MemberCard
              member={member}
              services={services}
              appointments={appointments}
              onClick={onMemberClick}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
