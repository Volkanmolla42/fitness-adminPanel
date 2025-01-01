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
import { Search, Plus, Pencil, Phone, Mail, Crown, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  getMembers,
  createMember,
  updateMember,
  deleteMember,
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
  <Card className="p-6 px-8 shadow-lg hover:shadow-xl border border-gray-300 rounded-lg">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-lg font-semibold text-gray-700">{title}</p>
        <h3 className="text-3xl font-bold mt-2">{value}</h3>
      </div>
      <Icon className={`h-8 w-8 ${iconColor || "text-gray-500"}`} />
    </div>
  </Card>
);

const MembersPage = () => {
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [membershipFilter, setMembershipFilter] = useState<
    Member["membership_type"] | "all"
  >("all");
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [addingMember, setAddingMember] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Üyeler</h1>
        <p className="text-muted-foreground mt-2">
          Spor salonu üyelerini yönet
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

      <Card className="p-6">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              className="flex flex-col p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-all"
            >
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={member.avatar_url} />
                  <AvatarFallback>{member.first_name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {`${member.first_name} ${member.last_name}`}
                      </h3>
                      <Badge
                        className={`mt-1 ${
                          member.membership_type === "basic"
                            ? "bg-blue-500"
                            : "bg-yellow-500"
                        }`}
                      >
                        {member.membership_type === "basic"
                          ? "Temel Üyelik"
                          : "VIP Üyelik"}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingMember(member)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{member.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{member.phone}</span>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Aldığı Hizmetler:</p>
                <div className="flex flex-wrap gap-2">
                  {member.subscribed_services.map((service) => (
                    <Badge key={service} variant="outline">
                      {service}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Edit Member Dialog */}
      <Dialog
        open={!!editingMember}
        onOpenChange={(open) => !open && setEditingMember(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Üye Düzenle</DialogTitle>
          </DialogHeader>
          {editingMember && (
            <MemberForm
              member={editingMember}
              onSubmit={handleEdit}
              onCancel={() => setEditingMember(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MembersPage;
