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
import { useToast } from "@/components/ui/use-toast";
import { MemberForm } from "@/components/forms/MemberForm";
import { MemberStats } from "@/components/members/MemberStats";
import { MemberList } from "@/components/members/MemberList";
import { MemberDetail } from "@/components/members/MemberDetail";

type Member = Database["public"]["Tables"]["members"]["Row"];

const MembersPage = () => {
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [services, setServices] = useState<{ [key: string]: Database["public"]["Tables"]["services"]["Row"] }>({});
  const [trainers, setTrainers] = useState<{ [key: string]: Database["public"]["Tables"]["trainers"]["Row"] }>({});
  const [appointments, setAppointments] = useState<Database["public"]["Tables"]["appointments"]["Row"][]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [membershipFilter, setMembershipFilter] = useState<Member["membership_type"] | "all">("all");
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [addingMember, setAddingMember] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

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
      toast({
        title: "Hata",
        description: "Üyeler yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const servicesData = await getServices();
      const servicesMap = servicesData.reduce((acc: { [key: string]: Database["public"]["Tables"]["services"]["Row"] }, service) => {
        acc[service.id] = service;
        return acc;
      }, {});
      setServices(servicesMap);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Hizmetler yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const fetchTrainers = async () => {
    try {
      const { data: trainersData } = await supabase
        .from("trainers")
        .select("*");
      
      if (trainersData) {
        const trainersMap = trainersData.reduce((acc: { [key: string]: Database["public"]["Tables"]["trainers"]["Row"] }, trainer) => {
          acc[trainer.id] = trainer;
          return acc;
        }, {});
        setTrainers(trainersMap);
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Eğitmenler yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
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
      toast({
        title: "Hata",
        description: "Randevular yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
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

  const handleCreate = async (data: any) => {
    try {
      await createMember(data);
      setAddingMember(false);
      toast({
        title: "Başarılı",
        description: "Üye başarıyla eklendi.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Üye eklenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const handleUpdate = async (data: any) => {
    if (!editingMember?.id) return;

    try {
      await updateMember(editingMember.id, data);
      setEditingMember(null);
      toast({
        title: "Başarılı",
        description: "Üye başarıyla güncellendi.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Üye güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMember(id);
      toast({
        title: "Başarılı",
        description: "Üye başarıyla silindi.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Üye silinirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const stats = {
    total: members.length,
    basic: members.filter((m) => m.membership_type === "basic").length,
    vip: members.filter((m) => m.membership_type === "vip").length,
  };

  if (isLoading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Üyeler</h1>
        <Dialog open={addingMember} onOpenChange={setAddingMember}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Üye
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Üye</DialogTitle>
            </DialogHeader>
            <MemberForm onSubmit={handleCreate} onCancel={() => setAddingMember(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <MemberStats stats={stats} />

      <Dialog open={!!selectedMember} onOpenChange={(open) => !open && setSelectedMember(null)}>
        <MemberList
          members={members}
          services={services}
          searchTerm={searchTerm}
          membershipFilter={membershipFilter}
          onSearch={setSearchTerm}
          onMemberClick={setSelectedMember}
        />

        {selectedMember && (
          <DialogContent>
            
            <MemberDetail
              member={selectedMember}
              services={services}
              trainers={trainers}
              appointments={appointments}
              onEdit={setEditingMember}
              onDelete={handleDelete}
            />
          </DialogContent>
        )}
      </Dialog>

      {editingMember && (
        <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Üye Düzenle</DialogTitle>
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
