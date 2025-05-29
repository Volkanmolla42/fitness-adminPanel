import { Input } from "@/components/ui/input";
import {
  Search,
  PackageOpen,
  AlertTriangle,
  UserCheck,
  UserX,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";

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

  // Üyenin tüm paketlerinin bitip bitmediğini kontrol eder ve
  // eğer tüm paketleri bitmişse true döndürür
  shouldDeactivateMember: (
    member: Member,
    services: { [key: string]: Service },
    appointments: Appointment[]
  ): boolean => {
    // Üyenin zaten pasif olup olmadığını kontrol et
    if (!member.active) return false;

    // Üyenin hiç paketi yoksa devre dışı bırakma
    if (member.subscribed_services.length === 0) return false;

    // Tüm paketlerin bitip bitmediğini kontrol et
    return checkPackageStatus.hasCompletedAllPackages(
      member,
      services,
      appointments
    );
  },

  // Bir üyenin hangi antrenörler tarafından ilgilenildiğini belirleyen fonksiyon
  getMemberHandlingTrainers: (
    member: Member,
    appointments: Appointment[],
    trainers: { [key: string]: Trainer } | Trainer[],
    services: { [key: string]: Service }
  ): Trainer[] => {
    // Üye aktif değilse, hiçbir antrenör ilgilenmiyor demektir
    if (!member.active) return [];

    // Üyenin aktif paketlerini kontrol et
    const memberPackageStatus = checkPackageStatus.getMemberPackageStatus(
      member,
      services,
      appointments
    );

    // Eğer üyenin tüm paketleri bitmişse, hiçbir antrenör ilgilenmiyor demektir
    if (memberPackageStatus === "completed") return [];

    // Paket bazlı antrenör bulma (sadece aktif paketlerdeki antrenörler)
    const trainerIds = new Set<string>();

    // Üyenin aldığı paketleri say
    const serviceCount = member.subscribed_services.reduce((acc, serviceId) => {
      acc[serviceId] = (acc[serviceId] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    // Her servis için paket bazlı kontrol yap
    Object.entries(serviceCount).forEach(([serviceId, totalPackages]) => {
      const service = services[serviceId];
      if (!service) return;

      const sessionsPerPackage = service.session_count || 0;
      if (sessionsPerPackage === 0) return;

      // Bu servise ait tüm randevuları tarihe göre sırala
      const serviceAppointments = appointments
        .filter(apt => apt.service_id === serviceId && apt.member_id === member.id)
        .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());

      // Paketleri oluştur
      const remainingAppointments = [...serviceAppointments];
      for (let i = 0; i < totalPackages; i++) {
        const packageAppointments = remainingAppointments.splice(0, sessionsPerPackage);

        const completedSessions = packageAppointments.filter(apt => apt.status === "completed").length;
        const cancelledSessions = packageAppointments.filter(apt => apt.status === "cancelled").length;
        const usedSessions = completedSessions + cancelledSessions;

        // Eğer bu paket tamamlanmışsa (kullanılan seans sayısı toplam seans sayısına eşit veya fazlaysa)
        // bu paketteki antrenörleri sayma
        if (usedSessions >= sessionsPerPackage) {
          continue; // Bu paket tamamlanmış, geç
        }

        // Bu paket aktif, bu paketteki tüm antrenörleri say (tamamlanan + planlanan)
        packageAppointments.forEach(apt => {
          if (apt.trainer_id && (apt.status === "completed" || apt.status === "scheduled")) {
            trainerIds.add(apt.trainer_id);
          }
        });
      }
    });

    // Antrenörleri bul
    const handlingTrainers: Trainer[] = [];

    // trainers bir dizi mi yoksa nesne mi kontrol et
    if (Array.isArray(trainers)) {
      trainerIds.forEach(id => {
        const trainer = trainers.find(t => t.id === id);
        if (trainer) handlingTrainers.push(trainer);
      });
    } else {
      // trainers bir nesneyse (key-value object)
      trainerIds.forEach(id => {
        if (trainers[id]) handlingTrainers.push(trainers[id]);
      });
    }

    return handlingTrainers;
  }
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
  appointmentsLoading?: boolean; // Randevular yüklenirken gösterilecek yükleme durumu
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
  highlightedMemberId,
  appointmentsLoading = false,
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

        // Antrenör filtresini kontrol et (güncellenmiş "şu anda ilgileniyor" mantığı)
        const matchesTrainer =
          selectedTrainerId === "all" ||
          (() => {
            // Eğer antrenör filtrelemesi yapılmıyorsa tüm üyeleri göster
            if (selectedTrainerId === "all") return true;

            // Üye aktif değilse, antrenörle ilgilenme durumu yoktur
            if (!member.active) return false;

            // Üyenin ilgilendiği antrenörleri bul
            const handlingTrainers = checkPackageStatus.getMemberHandlingTrainers(
              member,
              appointments,
              trainers,
              services
            );

            // Seçilen antrenör bu üyeyle ilgileniyor mu?
            return handlingTrainers.some(trainer => trainer.id === selectedTrainerId);
          })();

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
      <div className="flex flex-col md:flex-row gap-4">
        {/* Arama kutusu */}
        <div className="relative flex-1">
          <Search
            className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${
              isDark ? "text-gray-400" : "text-muted-foreground"
            }`}
          />
          <Input
            placeholder="Ad Soyad veya telefon ile ara..."
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
            className="pl-10 h-10"
          />
        </div>

        {/* Paket filtresi */}
        <div className="md:w-[240px]">
          <Select
            value={packageFilter}
            onValueChange={(value: "all" | "completed" | "almostCompleted") =>
              setPackageFilter(value)
            }
          >
            <SelectTrigger
              className={`w-full h-10 ${
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
        </div>
      </div>

      <div className="flex justify-end">
        <p
          className={`text-sm ${
            isDark ? "text-gray-400" : "text-muted-foreground"
          }`}
        >
          {filteredMembers.length} üye listeleniyor
          {searchTerm && ` (${stats.total} üyeden)`}
        </p>
      </div>

      <div className="space-y-6">
        {/* Aktif Üyeler Accordion */}
        <Accordion
          type="single"
          defaultValue="active"
          collapsible
          className="w-full bg-green-300/30 dark:bg-green-900/20 px-4 py-2 rounded-lg"
        >
          <AccordionItem value="active" className="border-none">
            <AccordionTrigger className="py-2 hover:no-underline">
              <div className="flex items-center gap-2">
                <div className="bg-green-100 dark:bg-green-900/30 p-1.5 rounded-full">
                  <UserCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <span className="font-semibold text-base">Aktif Üyeler</span>
                <div className="flex items-center gap-1">
                  <Badge variant="secondary" className="ml-2">
                    {filteredMembers.filter((m) => m.active).length}
                  </Badge>
                  {stats.almostCompletedPackages > 0 && (
                    <Badge
                      variant="outline"
                      className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50"
                    >
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {stats.almostCompletedPackages} üyenin paketi bitmek üzere
                    </Badge>
                  )}
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                {appointmentsLoading ? (
                  // Randevular yüklenirken skeleton göster
                  <>
                    {[...Array(6)].map((_, index) => (
                      <div key={index} className="space-y-2">
                        <Skeleton className="h-[200px] w-full rounded-xl" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  // Randevular yüklendiyse normal içeriği göster
                  filteredMembers
                    .filter((member) => member.active)
                    .sort((a, b) => {
                      // Önce paketi bitmeye yakın olanları göster
                      const aIsAlmostCompleted =
                        checkPackageStatus.hasAlmostCompletedPackages(
                          a,
                          services,
                          appointments
                        );
                      const bIsAlmostCompleted =
                        checkPackageStatus.hasAlmostCompletedPackages(
                          b,
                          services,
                          appointments
                        );

                      if (aIsAlmostCompleted && !bIsAlmostCompleted) return -1;
                      if (!aIsAlmostCompleted && bIsAlmostCompleted) return 1;

                      // Sonra VIP üyeleri göster
                      if (
                        a.membership_type === "vip" &&
                        b.membership_type !== "vip"
                      )
                        return -1;
                      if (
                        a.membership_type !== "vip" &&
                        b.membership_type === "vip"
                      )
                        return 1;
                      // Aynı üyelik tipindeyse isme göre sırala
                      return a.first_name.localeCompare(b.first_name);
                    })
                    .map((member) => (
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
                          trainers={trainers.reduce((acc, trainer) => {
                            acc[trainer.id] = trainer;
                            return acc;
                          }, {} as { [key: string]: Trainer })}
                        />
                      </div>
                    ))
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Pasif Üyeler Accordion */}
        <Accordion
          type="single"
          collapsible
          className="w-full bg-red-300/30 dark:bg-red-900/20 px-4 py-2 rounded-lg"
        >
          <AccordionItem value="inactive" className="border-none">
            <AccordionTrigger className="py-2 hover:no-underline">
              <div className="flex items-center gap-2">
                <div className="bg-red-100 dark:bg-red-900/30 p-1.5 rounded-full">
                  <UserX className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <span className="font-semibold text-base">Pasif Üyeler</span>
                <div className="flex items-center gap-1">
                  <Badge variant="secondary" className="ml-2">
                    {filteredMembers.filter((m) => !m.active).length}
                  </Badge>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                {appointmentsLoading ? (
                  // Randevular yüklenirken skeleton göster
                  <>
                    {[...Array(3)].map((_, index) => (
                      <div key={index} className="space-y-2">
                        <Skeleton className="h-[200px] w-full rounded-xl" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  // Randevular yüklendiyse normal içeriği göster
                  filteredMembers
                    .filter((member) => !member.active)
                    .sort((a, b) => {
                      // Önce paketi bitmeye yakın olanları göster
                      const aIsAlmostCompleted =
                        checkPackageStatus.hasAlmostCompletedPackages(
                          a,
                          services,
                          appointments
                        );
                      const bIsAlmostCompleted =
                        checkPackageStatus.hasAlmostCompletedPackages(
                          b,
                          services,
                          appointments
                        );

                      if (aIsAlmostCompleted && !bIsAlmostCompleted) return -1;
                      if (!aIsAlmostCompleted && bIsAlmostCompleted) return 1;

                      // Sonra VIP üyeleri göster
                      if (
                        a.membership_type === "vip" &&
                        b.membership_type !== "vip"
                      )
                        return -1;
                      if (
                        a.membership_type !== "vip" &&
                        b.membership_type === "vip"
                      )
                        return 1;
                      // Aynı üyelik tipindeyse isme göre sırala
                      return a.first_name.localeCompare(b.first_name);
                    })
                    .map((member) => (
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
                          trainers={trainers.reduce((acc, trainer) => {
                            acc[trainer.id] = trainer;
                            return acc;
                          }, {} as { [key: string]: Trainer })}
                        />
                      </div>
                    ))
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
};
