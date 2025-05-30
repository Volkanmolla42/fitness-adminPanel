import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import {
  getMembers,
  createMember,
  updateMember,
  deleteMember,
  getServices,
} from "@/lib/queries";
import type { Database } from "@/types/supabase";
import { toast } from "sonner";
import { MemberForm } from "@/components/forms/member/MemberForm";
import { MemberStats } from "@/components/members/MemberStats";
import { MemberList } from "@/components/members/MemberList";
import { MemberDetail } from "@/components/members/MemberDetail";
import { LoadingSpinner } from "@/App";
import { useTheme } from "@/contexts/theme-context";
import { useAppointments } from "@/hooks/useAppointments";
import { TrainerStats } from "@/components/members/TrainerStats";

type Member = Database["public"]["Tables"]["members"]["Row"];

type MemberFormData = Omit<Member, "id" | "created_at">;

const MembersPage = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [services, setServices] = useState<{
    [key: string]: Database["public"]["Tables"]["services"]["Row"];
  }>({});
  const [trainers, setTrainers] = useState<{
    [key: string]: Database["public"]["Tables"]["trainers"]["Row"];
  }>({});
  const [appointments, setAppointments] = useState<
    Database["public"]["Tables"]["appointments"]["Row"][]
  >([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [membershipFilter, setMembershipFilter] = useState<
    "all" | "basic" | "vip" | "active" | "inactive"
  >("all");
  const [activeFilter, setActiveFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [selectedTrainerId, setSelectedTrainerId] = useState<string>("all");
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [addingMember, setAddingMember] = useState(false);
  const [membersLoading, setMembersLoading] = useState(true);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [trainersLoading, setTrainersLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const [memberStats, setMemberStats] = useState({
    total: 0,
    basic: 0,
    vip: 0,
    active: 0,
    inactive: 0,
  });
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Son güncellenen üyeyi takip etmek için ref
  const lastUpdatedMemberId = useRef<string | null>(null);
  // Animasyon için state
  const [highlightedMemberId, setHighlightedMemberId] = useState<string | null>(
    null
  );

  // Antrenör nesnesini dizi haline getiren yardımcı fonksiyon
  const getTrainersArray = () => Object.values(trainers);

  useEffect(() => {
    fetchMembers();
    fetchServices();
    fetchTrainers();
    const cleanup = setupRealtimeSubscription();

    // Komponent unmount olduğunda cleanup fonksiyonunu çağır
    return cleanup;
  }, []);

  // useAppointments hook'unu kullan
  const { appointments: allAppointments, isLoading: appointmentsApiLoading } =
    useAppointments();

  // allAppointments ve appointmentsApiLoading değiştiğinde appointments state'ini güncelle
  useEffect(() => {
    // API'den gelen loading durumunu kullan
    setAppointmentsLoading(appointmentsApiLoading);

    if (allAppointments && allAppointments.length > 0) {
      setAppointments(allAppointments);
      // Randevular yüklendiyse loading durumunu kapat
      if (!appointmentsApiLoading) {
        // Kullanıcının yükleme animasyonunu görebilmesi için kısa bir gecikme
        setTimeout(() => {
          setAppointmentsLoading(false);
        }, 500);
      }
    }
  }, [allAppointments, appointmentsApiLoading]);

  useEffect(() => {
    // Tüm veriler yüklendiğinde genel loading state'i güncelle
    if (!membersLoading && !servicesLoading && !trainersLoading) {
      setIsLoading(false);
    }
  }, [membersLoading, servicesLoading, trainersLoading]);

  // Highlight animasyonu için useEffect
  useEffect(() => {
    if (lastUpdatedMemberId.current) {
      setHighlightedMemberId(lastUpdatedMemberId.current);

      // 2 saniye sonra highlight'ı kaldır
      const timer = setTimeout(() => {
        setHighlightedMemberId(null);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [members]);

  // Veri çekme işlemlerini optimize etmek için useCallback kullanımı
  const fetchMembers = useCallback(async () => {
    setMembersLoading(true);
    try {
      const data = await getMembers();
      setMembers(data);
    } catch (error) {
      console.error("Üyeler yüklenirken hata:", error);
      toast.error("Üyeler yüklenirken bir hata oluştu.");
    } finally {
      setMembersLoading(false);
    }
  }, []);

  const fetchServices = useCallback(async () => {
    setServicesLoading(true);
    try {
      const servicesData = await getServices();
      const servicesMap = servicesData.reduce(
        (
          acc: {
            [key: string]: Database["public"]["Tables"]["services"]["Row"];
          },
          service
        ) => {
          acc[service.id] = service;
          return acc;
        },
        {}
      );
      setServices(servicesMap);
    } catch (error) {
      console.error("Paketler yüklenirken hata:", error);
      toast.error("Paketler yüklenirken bir hata oluştu.");
    } finally {
      setServicesLoading(false);
    }
  }, []);

  const fetchTrainers = useCallback(async () => {
    setTrainersLoading(true);
    try {
      const { data: trainersData } = await supabase
        .from("trainers")
        .select("*")
        .order("first_name", { ascending: true });

      if (trainersData) {
        const trainersMap = trainersData.reduce(
          (
            acc: {
              [key: string]: Database["public"]["Tables"]["trainers"]["Row"];
            },
            trainer
          ) => {
            acc[trainer.id] = trainer;
            return acc;
          },
          {}
        );
        setTrainers(trainersMap);
      }
    } catch (error) {
      console.error("Antrenörler yüklenirken hata:", error);
      toast.error("Antrenörler yüklenirken bir hata oluştu.");
    } finally {
      setTrainersLoading(false);
    }
  }, []);

  const setupRealtimeSubscription = useCallback(() => {
    // Members tablosu için realtime subscription
    const membersChannel = supabase
      .channel("members-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "members",
        },
        (payload) => {
          // Yeni üye eklendiğinde, state'e ekle
          setMembers((currentMembers) => [
            ...currentMembers,
            payload.new as Member,
          ]);
          // Yeni eklenen üyeyi highlight etmek için ID'sini kaydet
          lastUpdatedMemberId.current = payload.new.id;
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "members",
        },
        (payload) => {
          // Üye güncellendiğinde, state'i güncelle
          setMembers((currentMembers) =>
            currentMembers.map((member) =>
              member.id === payload.new.id ? (payload.new as Member) : member
            )
          );

          // Güncellenen üyeyi highlight etmek için ID'sini kaydet
          lastUpdatedMemberId.current = payload.new.id;

          // Seçili üye güncellendiyse, seçili üyeyi de güncelle
          if (selectedMember?.id === payload.new.id) {
            setSelectedMember(payload.new as Member);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "members",
        },
        (payload) => {
          // Üye silindiğinde, state'den kaldır
          setMembers((currentMembers) =>
            currentMembers.filter((member) => member.id !== payload.old.id)
          );

          // Silinen üye seçili ise, seçimi kaldır
          if (selectedMember?.id === payload.old.id) {
            setSelectedMember(null);
          }
        }
      )
      .subscribe();

    // Services tablosu için realtime subscription
    const servicesChannel = supabase
      .channel("services-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "services",
        },
        (payload) => {
          // Yeni servis eklendiğinde, state'e ekle
          setServices((currentServices) => ({
            ...currentServices,
            [payload.new.id]: payload.new,
          }));
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "services",
        },
        (payload) => {
          // Servis güncellendiğinde, state'i güncelle
          setServices((currentServices) => ({
            ...currentServices,
            [payload.new.id]: payload.new,
          }));
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "services",
        },
        (payload) => {
          // Servis silindiğinde, state'den kaldır
          setServices((currentServices) => {
            const updatedServices = { ...currentServices };
            delete updatedServices[payload.old.id];
            return updatedServices;
          });
        }
      )
      .subscribe();

    // Appointments tablosu için realtime subscription
    const appointmentsChannel = supabase
      .channel("appointments-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "appointments",
        },
        (payload) => {
          // Yeni randevu eklendiğinde, state'e ekle
          setAppointments((currentAppointments) => [
            ...currentAppointments,
            payload.new as Database["public"]["Tables"]["appointments"]["Row"],
          ]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "appointments",
        },
        async (payload) => {
          // Randevu güncellendiğinde, state'i güncelle
          setAppointments((currentAppointments) =>
            currentAppointments.map((appointment) =>
              appointment.id === payload.new.id
                ? (payload.new as Database["public"]["Tables"]["appointments"]["Row"])
                : appointment
            )
          );

          // Ancak seçili üyeyi güncellemek için burada da kontrol ediyoruz
          const updatedAppointment =
            payload.new as Database["public"]["Tables"]["appointments"]["Row"];
          if (updatedAppointment.status === "completed" && selectedMember) {
            // Seçili üye güncellendiyse state'i güncelle
            if (updatedAppointment.member_id === selectedMember.id) {
              // Veritabanından güncel üye bilgisini al
              const { data: updatedMember } = await supabase
                .from("members")
                .select("*")
                .eq("id", selectedMember.id)
                .single();

              if (updatedMember) {
                setSelectedMember(updatedMember);
              }
            }
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "appointments",
        },
        (payload) => {
          // Randevu silindiğinde, state'den kaldır
          setAppointments((currentAppointments) =>
            currentAppointments.filter(
              (appointment) => appointment.id !== payload.old.id
            )
          );
        }
      )
      .subscribe();

    // Trainers tablosu için realtime subscription
    const trainersChannel = supabase
      .channel("trainers-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "trainers",
        },
        (payload) => {
          // Yeni eğitmen eklendiğinde, state'e ekle
          setTrainers((currentTrainers) => ({
            ...currentTrainers,
            [payload.new.id]: payload.new,
          }));
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "trainers",
        },
        (payload) => {
          // Eğitmen güncellendiğinde, state'i güncelle
          setTrainers((currentTrainers) => ({
            ...currentTrainers,
            [payload.new.id]: payload.new,
          }));
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "trainers",
        },
        (payload) => {
          // Eğitmen silindiğinde, state'den kaldır
          setTrainers((currentTrainers) => {
            const updatedTrainers = { ...currentTrainers };
            delete updatedTrainers[payload.old.id];
            return updatedTrainers;
          });
        }
      )
      .subscribe();

    // Cleanup fonksiyonu
    return () => {
      membersChannel.unsubscribe();
      servicesChannel.unsubscribe();
      appointmentsChannel.unsubscribe();
      trainersChannel.unsubscribe();
    };
  }, []); // selectedMember bağımlılığını kaldırdım, böylece abonelikler yalnızca bileşen mount olduğunda kurulacak

  const handleCreate = async (data: MemberFormData) => {
    try {
    
      const memberData = {
        ...data,
        active: true, // Varsayılan olarak aktif
      };
      const newMember = await createMember(memberData);
      setAddingMember(false);
      toast.success("Üye başarıyla eklendi.");

      // Highlight the new member
      if (newMember && newMember.id) {
        lastUpdatedMemberId.current = newMember.id;
        setHighlightedMemberId(newMember.id);

        // Clear highlight after 2 seconds
        setTimeout(() => {
          setHighlightedMemberId(null);
        }, 2000);
      }
    } catch (error) {
      console.error("Üye eklenirken hata:", error);
      toast.error("Üye eklenirken bir hata oluştu.");
    }
  };

  const handleUpdate = async (data: MemberFormData) => {
    if (!editingMember?.id) return;

    try {
      // Mevcut aktif durumunu koru ve postponement_count değerini 2 olarak ayarla
      const memberData = {
        ...data,
        active: editingMember.active, // Mevcut aktif durumunu koru
        postponement_count: 2, // Her zaman 2 olarak ayarla
      };
      const updatedMember = await updateMember(editingMember.id, memberData);
      setEditingMember(null);

      // Eğer güncellenen üye aynı zamanda seçili üye ise, seçili üyeyi de güncelle
      if (selectedMember?.id === editingMember.id) {
        setSelectedMember(updatedMember);
      }

      toast.success("Üye başarıyla güncellendi.");
    } catch (error) {
      console.error("Üye güncellenirken hata:", error);
      toast.error("Üye güncellenirken bir hata oluştu.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMember(id);
      setSelectedMember(null);
      toast.success("Üye başarıyla silindi.");
    } catch (error) {
      console.error("Üye silinirken hata:", error);
      toast.error("Üye silinirken bir hata oluştu.");
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Üyeler yükleniyor..." />;
  }

  return (
    <div
      className={`container p-0 mx-auto py-6 space-y-6 ${
        isDark ? "text-gray-100" : ""
      }`}
    >
      <div className="flex justify-between items-center">
        <h1 className={`text-3xl font-bold ${isDark ? "text-white" : ""}`}>
          Üyeler
        </h1>
        <Dialog open={addingMember} onOpenChange={setAddingMember}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Üye
            </Button>
          </DialogTrigger>
          <DialogContent
            className={isDark ? "dark:bg-gray-800 dark:text-gray-100" : ""}
          >
            <MemberForm
              onSubmit={handleCreate}
              onCancel={() => setAddingMember(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <MemberStats
        stats={memberStats}
        activeFilter={
          activeFilter === "active" || activeFilter === "inactive"
            ? activeFilter
            : membershipFilter
        }
        onFilterChange={(filter) => {
          // Aktif/pasif filtresi seçildiğinde, hem membershipFilter hem de activeFilter'i güncelle
          if (filter === "active") {
            setMembershipFilter("all"); // Membership filtresi sıfırla
            setActiveFilter("active"); // Sadece aktif filtresini ayarla
          } else if (filter === "inactive") {
            setMembershipFilter("all"); // Membership filtresi sıfırla
            setActiveFilter("inactive"); // Sadece pasif filtresini ayarla
          } else {
            setMembershipFilter(filter); // basic, vip veya all
            setActiveFilter("all"); // Aktif filtresini sıfırla
          }
        }}
      />

      {/* Antrenör İstatistikleri */}
      <TrainerStats
        trainers={trainers}
        members={members}
        appointments={appointments}
        services={services}
        selectedTrainerId={selectedTrainerId}
        onTrainerSelect={setSelectedTrainerId}
      />

      <Dialog
        open={!!selectedMember}
        onOpenChange={(open) => !open && setSelectedMember(null)}
      >
        <MemberList
          members={members}
          services={services}
          trainers={getTrainersArray()}
          appointments={appointments}
          searchTerm={searchTerm}
          membershipFilter={membershipFilter}
          activeFilter={activeFilter}
          selectedTrainerId={selectedTrainerId}
          onSearch={setSearchTerm}
          onMemberClick={setSelectedMember}
          onTrainerFilterChange={setSelectedTrainerId}
          onActiveFilterChange={setActiveFilter}
          highlightedMemberId={highlightedMemberId}
          appointmentsLoading={appointmentsLoading}
          onStatsChange={setMemberStats}
        />

        {selectedMember && (
          <DialogContent
            className={isDark ? "dark:bg-gray-800 dark:text-gray-100" : ""}
          >
            <MemberDetail
              member={selectedMember}
              services={services}
              trainers={trainers}
              appointments={appointments}
              onEdit={setEditingMember}
              onDelete={handleDelete}
              onAppointmentDeleted={(appointmentId) => {
                // Randevu silindiğinde appointments state'ini güncelle
                setAppointments((currentAppointments) =>
                  currentAppointments.filter((apt) => apt.id !== appointmentId)
                );
                toast.success("Randevu başarıyla silindi");
              }}
              onUpdate={async (updatedMember) => {
                try {
                  await updateMember(updatedMember.id, updatedMember);
                  setSelectedMember(updatedMember);
                  // Ancak UI'da güncel durumu göstermek için veritabanından güncel üye bilgisini alalım
                  setTimeout(async () => {
                    // Veritabanından güncel üye bilgisini al
                    const { data: refreshedMember } = await supabase
                      .from("members")
                      .select("*")
                      .eq("id", updatedMember.id)
                      .single();

                    if (refreshedMember) {
                      setSelectedMember(refreshedMember);
                    }
                  }, 500); 
                } catch (error) {
                  console.error("Paket tamamlanırken hata:", error);
                  toast.error("Paket tamamlanırken bir hata oluştu.");
                }
              }}
            />
          </DialogContent>
        )}
      </Dialog>

      {editingMember && (
        <Dialog
          open={!!editingMember}
          onOpenChange={(open) => !open && setEditingMember(null)}
        >
          <DialogContent
            className={isDark ? "dark:bg-gray-800 dark:text-gray-100" : ""}
          >
            <MemberForm
              member={editingMember}
              onSubmit={handleUpdate}
              onCancel={() => setEditingMember(null)}
              isEditing={true}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default MembersPage;
