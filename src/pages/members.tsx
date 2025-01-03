import React, { useState, useEffect } from "react";
import { MemberForm } from "@/components/forms/MemberForm";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search, Plus, Pencil, Phone, Mail, Crown, Users, User2, Calendar, ListChecks } from "lucide-react";
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

type Member = Database["public"]["Tables"]["members"]["Row"];

const StatsCard = ({
  title,
  value,
  icon: Icon,
  iconColor,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  iconColor?: string;
}) => (
  <Card className="p-6 px-8 hover:shadow-xl rounded-lg transition-all">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-lg font-semibold text-foreground">{title}</p>
        <h3 className="text-3xl font-bold mt-2 text-foreground">{value}</h3>
      </div>
      <Icon className={`h-8 w-8 ${iconColor || "text-muted-foreground"}`} />
    </div>
  </Card>
);

const MembersPage = () => {
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [services, setServices] = useState<{ [key: string]: string }>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [membershipFilter, setMembershipFilter] = useState<
    Member["membership_type"] | "all"
  >("all");
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [addingMember, setAddingMember] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  useEffect(() => {
    fetchMembers();
    fetchServices();
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
      const servicesMap = servicesData.reduce((acc: { [key: string]: string }, service) => {
        acc[service.id] = service.name;
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

  const setupRealtimeSubscription = () => {
    supabase
      .channel("members")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "members" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setMembers((prev) => [payload.new as Member, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setMembers((prev) =>
              prev.map((member) =>
                member.id === payload.new.id ? (payload.new as Member) : member
              )
            );
          } else if (payload.eventType === "DELETE") {
            setMembers((prev) =>
              prev.filter((member) => member.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();
  };

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      `${member.first_name} ${member.last_name}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone.includes(searchTerm);

    const matchesMembership =
      membershipFilter === "all" || member.membership_type === membershipFilter;

    return matchesSearch && matchesMembership;
  });

  const handleAdd = async (data: Omit<Member, "id" | "created_at">) => {
    try {
      await createMember(data);
      setAddingMember(false);
      toast({
        title: "Başarılı",
        description: "Yeni üye başarıyla eklendi.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Üye eklenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async (data: Omit<Member, "id" | "created_at">) => {
    if (!editingMember) return;

    try {
      await updateMember(editingMember.id, data);
      setEditingMember(null);
      toast({
        title: "Başarılı",
        description: "Üye bilgileri güncellendi.",
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
      setSelectedMember(null);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Üye silinirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  // Calculate stats
  const stats = {
    total: members.length,
    vip: members.filter((m) => m.membership_type === "vip").length,
    basic: members.filter((m) => m.membership_type === "basic").length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">Üyeler</h2>
        <p className="text-muted-foreground">
          Üyeleri görüntüle, düzenle ve yönet
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard title="Toplam Üye" value={stats.total} icon={Users} />
        <StatsCard
          title="Temel Üyeler"
          value={stats.basic}
          icon={Users}
          iconColor="text-blue-500"
        />
        <StatsCard
          title="VIP Üyeler"
          value={stats.vip}
          icon={Crown}
          iconColor="text-yellow-500"
        />
      </div>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="İsim, e-posta, telefon veya hizmet ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Dialog open={addingMember} onOpenChange={setAddingMember}>
            <DialogTrigger asChild>
              <Button onClick={() => setAddingMember(true)}>
                <Plus className="mr-2 h-4 w-4" /> Yeni Üye
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yeni Üye Ekle</DialogTitle>
              </DialogHeader>
              <MemberForm
                onSubmit={handleAdd}
                onCancel={() => setAddingMember(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      <Card className="p-6">
        

        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredMembers.map((member) => (
            <Card
              key={member.id}
              className="p-4 cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all"
              onClick={() => setSelectedMember(member)}
            >
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-16 w-16 mb-2">
                  <AvatarImage src={member.avatar_url || ""} />
                  <AvatarFallback className="bg-primary/10">
                    {member.first_name[0]}
                    {member.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                
                <h3 className="font-medium text-foreground">
                  {member.first_name} {member.last_name}
                </h3>
                
                <Badge
                  variant={member.membership_type === "vip" ? "destructive" : "default"}
                  className="mt-2"
                >
                  {member.membership_type === "vip" ? "VIP Üye" : "Standart Üye"}
                </Badge>
                
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  {member.phone}
                </div>

                <div className="w-full mt-3">
                  <p className="text-xs text-muted-foreground mb-1">Aldığı Hizmetler</p>
                  <div className="flex flex-wrap justify-center gap-1">
                    {member.subscribed_services.map((serviceId) => (
                      <Badge 
                        key={serviceId} 
                        variant="outline" 
                        className="text-xs"
                      >
                        {services[serviceId] || "Yükleniyor..."}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* Combined Member Details and Edit Dialog */}
      <Dialog
        open={selectedMember !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedMember(null);
            setEditingMember(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          {selectedMember && !editingMember && (
            <div className="space-y-6">
              <DialogHeader>
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={selectedMember.avatar_url || ""} />
                    <AvatarFallback className="text-xl bg-primary/10">
                      {selectedMember.first_name[0]}
                      {selectedMember.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <DialogTitle className="text-2xl">
                      {selectedMember.first_name} {selectedMember.last_name}
                    </DialogTitle>
                    <Badge
                      variant={selectedMember.membership_type === "vip" ? "destructive" : "default"}
                      className="mt-1"
                    >
                      {selectedMember.membership_type === "vip" ? "VIP Üye" : "Standart Üye"}
                    </Badge>
                  </div>
                </div>
              </DialogHeader>

              <div className="grid gap-6">
                {/* İletişim Bilgileri */}
                <div className="bg-muted/30 rounded-lg p-4">
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <User2 className="w-4 h-4" />
                    İletişim Bilgileri
                  </h3>
                  <div className="grid gap-2 text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <Phone className="w-4 h-4 mr-2" />
                      {selectedMember.phone}
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Mail className="w-4 h-4 mr-2" />
                      {selectedMember.email}
                    </div>
                  </div>
                </div>

                {/* Üyelik Detayları */}
                <div className="bg-muted/30 rounded-lg p-4">
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Üyelik Detayları
                  </h3>
                  <div className="grid gap-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Başlangıç Tarihi</span>
                      <span className="font-medium">
                        {new Date(selectedMember.start_date).toLocaleDateString("tr-TR", {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Bitiş Tarihi</span>
                      <span className="font-medium">
                        {new Date(selectedMember.end_date).toLocaleDateString("tr-TR", {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Aldığı Hizmetler */}
                <div className="bg-muted/30 rounded-lg p-4">
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <ListChecks className="w-4 h-4" />
                    Aldığı Hizmetler
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedMember.subscribed_services.map((serviceId) => (
                      <Badge key={serviceId} variant="outline" className="px-3 py-1">
                        {services[serviceId] || "Yükleniyor..."}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setEditingMember(selectedMember)}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Düzenle
                </Button>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (selectedMember.id) {
                      try {
                        await handleDelete(selectedMember.id);
                        setSelectedMember(null);
                      } catch (error) {
                        console.error("Error deleting member:", error);
                      }
                    }
                  }}
                >
                  Sil
                </Button>
              </div>
            </div>
          )}

          {editingMember && (
            <>
              <DialogHeader>
                <DialogTitle>Üye Düzenle</DialogTitle>
              </DialogHeader>
              <MemberForm
                member={editingMember}
                onSubmit={(data) => handleEdit(data)}
                onCancel={() => setEditingMember(null)}
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MembersPage;
