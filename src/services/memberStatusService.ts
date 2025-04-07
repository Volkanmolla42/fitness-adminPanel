import { supabase } from "@/lib/supabase";
import { checkPackageStatus } from "@/components/members/MemberList";
import { toast } from "@/components/ui/use-toast";
import type { Database } from "@/types/supabase";

// Tip tanımlaması
type Service = Database["public"]["Tables"]["services"]["Row"];

// Üyeleri otomatik pasife alma servisi
export class MemberStatusService {
  private static instance: MemberStatusService;
  private checkInterval: number | null = null;
  private isRunning = false;
  private passivatedMembersCount = 0;

  // Singleton pattern
  public static getInstance(): MemberStatusService {
    if (!MemberStatusService.instance) {
      MemberStatusService.instance = new MemberStatusService();
    }
    return MemberStatusService.instance;
  }

  // Servisi başlat
  public start(intervalMinutes: number = 5): void {
    if (this.isRunning) {
      console.log("MemberStatusService zaten çalışıyor.");
      return;
    }

    console.log(
      `%cMemberStatusService başlatıldı. Kontrol aralığı: ${intervalMinutes} dakika`,
      "color: blue; font-weight: bold;"
    );

    // Hemen bir kez çalıştır
    this.checkAndUpdateMemberStatuses();

    // Belirtilen aralıklarla çalıştır
    this.checkInterval = window.setInterval(() => {
      console.log(
        `%cMemberStatusService: Periyodik kontrol başlatılıyor... (${new Date().toLocaleTimeString()})`,
        "color: blue;"
      );
      this.checkAndUpdateMemberStatuses();
    }, intervalMinutes * 60 * 1000);

    this.isRunning = true;
  }

  // Servisi durdur
  public stop(): void {
    if (!this.isRunning) {
      console.log("MemberStatusService zaten çalışmıyor.");
      return;
    }

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    this.isRunning = false;
    console.log(
      `%cMemberStatusService durduruldu. Toplam pasife alınan üye sayısı: ${this.passivatedMembersCount}`,
      "color: orange; font-weight: bold;"
    );
  }

  // Üyelerin paket durumlarını kontrol et ve gerekirse pasife al
  private async checkAndUpdateMemberStatuses(): Promise<void> {
    try {
      console.log("%cÜye durumları kontrol ediliyor...", "color: blue;");

      // Tüm aktif üyeleri getir
      const { data: members, error: membersError } = await supabase
        .from("members")
        .select("*")
        .eq("active", true);

      if (membersError || !members) {
        console.error(
          "Üyeler yüklenirken hata:",
          membersError || "Veri bulunamadı"
        );
        return;
      }

      console.log(`Toplam ${members.length} aktif üye kontrol ediliyor...`);

      // Tüm servisleri getir
      const { data: servicesData, error: servicesError } = await supabase
        .from("services")
        .select("*");

      if (servicesError || !servicesData) {
        console.error(
          "Servisler yüklenirken hata:",
          servicesError || "Veri bulunamadı"
        );
        return;
      }

      // Servisleri map'e dönüştür
      const services = servicesData.reduce(
        (acc: { [key: string]: Service }, service) => {
          acc[service.id] = service;
          return acc;
        },
        {}
      );

      // Tüm randevuları getir
      const { data: appointments, error: appointmentsError } = await supabase
        .from("appointments")
        .select("*");

      if (appointmentsError || !appointments) {
        console.error(
          "Randevular yüklenirken hata:",
          appointmentsError || "Veri bulunamadı"
        );
        return;
      }

      // Pasife alınan üyeleri takip etmek için dizi
      interface PassivatedMember {
        id: string;
        name: string;
        packages: string[];
      }
      const passivatedMembers: PassivatedMember[] = [];

      // Her aktif üye için kontrol yap
      for (const member of members) {
        // Üyenin tüm paketleri bitmiş mi kontrol et
        if (
          checkPackageStatus.shouldDeactivateMember(
            member,
            services,
            appointments
          )
        ) {
          try {
            // Üyeyi pasife al
            await supabase
              .from("members")
              .update({ active: false })
              .eq("id", member.id);

            // Pasife alınan üyeyi diziye ekle
            passivatedMembers.push({
              id: member.id,
              name: `${member.first_name} ${member.last_name}`,
              packages: member.subscribed_services.map(
                (serviceId) => services[serviceId]?.name || serviceId
              ),
            });

            this.passivatedMembersCount++;

            console.log(
              `%c${member.first_name} ${member.last_name} üyesinin tüm paketleri bittiği için pasife alındı.`,
              "color: orange;"
            );

            // Kullanıcı üyeler sayfasında ise bildirim göster
            if (window.location.pathname.includes("/members")) {
              toast({
                title: "Üye Pasife Alındı",
                description: `${member.first_name} ${member.last_name} üyesinin tüm paketleri bittiği için pasife alındı.`,
              });
            }
          } catch (error) {
            console.error(`Üye pasife alınırken hata: ${member.id}`, error);
            // Hata logunu daha detaylı hale getirelim
            console.error(
              `Hata detayları: Üye adı: ${member.first_name} ${member.last_name}, Üye ID: ${member.id}`
            );

            // Kritik bir hata olduğunda bildirim gösterelim
            if (window.location.pathname.includes("/members")) {
              toast({
                title: "Hata",
                description: `${member.first_name} ${member.last_name} üyesi pasife alınırken bir hata oluştu.`,
                variant: "destructive",
              });
            }
          }
        }
      }

      // Pasife alınan üyeleri detaylı olarak logla
      if (passivatedMembers.length > 0) {
        console.log(
          `%cBu kontrolde ${passivatedMembers.length} üye pasife alındı:`,
          "color: orange; font-weight: bold;"
        );
        console.table(passivatedMembers);
      } else {
        console.log("Bu kontrolde pasife alınan üye bulunmamaktadır.");
      }

      console.log(
        `%cÜye durumları kontrol edildi. Toplam pasife alınan üye sayısı: ${this.passivatedMembersCount}`,
        "color: green;"
      );
    } catch (error) {
      console.error(
        "%cÜye durumları kontrol edilirken kritik hata:",
        "color: red; font-weight: bold;",
        error
      );

      // Uygulama çökmemesi için hata durumunda bile servisi çalışır durumda tutalım
      // Ancak kullanıcıya bildirim gösterelim
      if (
        window.location.pathname.includes("/members") ||
        window.location.pathname.includes("/dashboard")
      ) {
        toast({
          title: "Sistem Hatası",
          description:
            "Üye durumları kontrol edilirken bir hata oluştu. Lütfen yöneticinize bildirin.",
          variant: "destructive",
        });
      }
    }
  }
}

// Servis instance'ını dışa aktar
export const memberStatusService = MemberStatusService.getInstance();
