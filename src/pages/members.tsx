import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { MemberForm } from "@/components/forms/MemberForm";
import { MemberStats } from "@/components/members/MemberStats";
import { MemberList } from "@/components/members/MemberList";
import { MemberDetail } from "@/components/members/MemberDetail";
import { LoadingSpinner } from "@/App";
import { useTheme } from "@/contexts/theme-context";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [membershipFilter, setMembershipFilter] = useState<
    "all" | "basic" | "vip"
  >("all");
  const [selectedTrainerId, setSelectedTrainerId] = useState<string>("all");
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [addingMember, setAddingMember] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    fetchMembers();
    fetchServices();
    fetchTrainers();
    fetchAppointments();
    setupRealtimeSubscription();
    return () => {
      supabase.channel("members").unsubscribe();
    };
  }, []);

  const fetchMembers = async () => {
    try {
      const data = await getMembers();
      setMembers(data);
    } catch (error) {
      console.error("Üyeler yüklenirken hata:", error);
      toast.error("Üyeler yüklenirken bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchServices = async () => {
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
    }
  };

  const fetchTrainers = async () => {
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
    }
  };

  const fetchAppointments = async () => {
    try {
      const { data: appointmentsData } = await supabase
        .from("appointments")
        .select("*")
        .order("date", { ascending: true });

      if (appointmentsData) {
        setAppointments(appointmentsData);
      }
    } catch (error) {
      console.error("Randevular yüklenirken hata:", error);
      toast.error("Randevular yüklenirken bir hata oluştu.");
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel("members")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "members",
        },
        () => {
          fetchMembers();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  };

  const handleCreate = async (data: MemberFormData) => {
    try {
      await createMember(data);
      setAddingMember(false);
      toast.success("Üye başarıyla eklendi.");
    } catch (error) {
      console.error("Üye eklenirken hata:", error);
      toast.error("Üye eklenirken bir hata oluştu.");
    }
  };

  const handleUpdate = async (data: MemberFormData) => {
    if (!editingMember?.id) return;

    try {
      await updateMember(editingMember.id, data);
      setEditingMember(null);
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

  const stats = {
    total: members.length,
    basic: members.filter((m) => m.membership_type === "basic").length,
    vip: members.filter((m) => m.membership_type === "vip").length,
  };

  if (isLoading) {
    return <LoadingSpinner text="Üyeler yükleniyor..." />;
  }

  return (
    <div className={`container p-0 mx-auto py-6 space-y-6 ${isDark ? "text-gray-100" : ""}`}>
        <div className="flex justify-between items-center">
        <h1 className={`text-3xl font-bold ${isDark ? "text-white" : ""}`}>Üyeler</h1>
          <Dialog open={addingMember} onOpenChange={setAddingMember}>
            <DialogTrigger asChild>
              <Button>
              <Plus className="h-4 w-4 mr-2" />
                Yeni Üye
              </Button>
            </DialogTrigger>
            <DialogContent className={isDark ? "dark:bg-gray-800 dark:text-gray-100" : ""}>
              <DialogHeader>
              <DialogTitle className={isDark ? "dark:text-white" : ""}>Yeni Üye</DialogTitle>
              </DialogHeader>
              <MemberForm
                onSubmit={handleCreate}
              onCancel={() => setAddingMember(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

      <MemberStats
        stats={stats}
        activeFilter={membershipFilter}
        onFilterChange={setMembershipFilter}
      />

      <Dialog
        open={!!selectedMember}
        onOpenChange={(open) => !open && setSelectedMember(null)}
      >
            <MemberList
              members={members}
              services={services}
              trainers={Object.values(trainers)}
              appointments={appointments}
              searchTerm={searchTerm}
              membershipFilter={membershipFilter}
              selectedTrainerId={selectedTrainerId}
              onSearch={setSearchTerm}
              onMemberClick={setSelectedMember}
              onTrainerFilterChange={setSelectedTrainerId}
            />

          {selectedMember && (
            <DialogContent className={isDark ? "dark:bg-gray-800 dark:text-gray-100" : ""}>
              <MemberDetail
                member={selectedMember}
                services={services}
                trainers={trainers}
                appointments={appointments}
                onEdit={setEditingMember}
                onDelete={handleDelete}
                onUpdate={async (updatedMember) => {
                  try {
                    await updateMember(updatedMember.id, updatedMember);
                    setSelectedMember(updatedMember);
                    toast.success("Paket başarıyla tamamlandı.");
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
            <DialogContent className={isDark ? "dark:bg-gray-800 dark:text-gray-100" : ""}>
              <DialogHeader>
                <DialogTitle className={isDark ? "dark:text-white" : ""}>Üye Düzenle</DialogTitle>
              </DialogHeader>
              <MemberForm
                member={editingMember}
                onSubmit={handleUpdate}
                onCancel={() => setEditingMember(null)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
  );
};

export default MembersPage;
