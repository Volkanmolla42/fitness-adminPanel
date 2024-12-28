import React, { useState } from "react";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { defaultServices } from "@/pages/services";
import { Search, Plus, Pencil, Phone, Mail } from "lucide-react";

interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  membershipType: "basic" | "premium" | "vip";
  subscribedServices: string[];
  startDate: string;
}

const defaultMembers: Member[] = [
  {
    id: "1",
    name: "Ahmet Yılmaz",
    email: "ahmet@example.com",
    phone: "(555) 123-4567",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=ahmet",
    membershipType: "premium",
    subscribedServices: ["Kişisel Antrenman", "Fitness Değerlendirmesi"],
    startDate: "2024-01-15",
  },
  {
    id: "2",
    name: "Zeynep Kaya",
    email: "zeynep@example.com",
    phone: "(555) 234-5678",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=zeynep",
    membershipType: "basic",
    subscribedServices: ["Yoga Dersi"],
    startDate: "2024-02-01",
  },
];

const getMembershipColor = (type: Member["membershipType"]) => {
  const colors = {
    basic: "bg-blue-500",
    premium: "bg-purple-500",
    vip: "bg-yellow-500",
  };
  return colors[type];
};

const getMembershipLabel = (type: Member["membershipType"]) => {
  const labels = {
    basic: "Temel Üyelik",
    premium: "Premium Üyelik",
    vip: "VIP Üyelik",
  };
  return labels[type];
};

const MemberForm = ({
  member,
  onSubmit,
  onCancel,
}: {
  member?: Member;
  onSubmit: (member: Omit<Member, "id">) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState<Omit<Member, "id">>({
    name: member?.name || "",
    email: member?.email || "",
    phone: member?.phone || "",
    avatarUrl:
      member?.avatarUrl ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`,
    membershipType: member?.membershipType || "basic",
    subscribedServices: member?.subscribedServices || [],
    startDate: member?.startDate || new Date().toISOString().split("T")[0],
  });

  const sortedServices = [...defaultServices].sort((a, b) => {
    const aCount = defaultMembers.filter((m) =>
      m.subscribedServices.includes(a.name),
    ).length;
    const bCount = defaultMembers.filter((m) =>
      m.subscribedServices.includes(b.name),
    ).length;
    return bCount - aCount;
  });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Ad Soyad</label>
        <Input
          value={formData.name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">E-posta</label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, email: e.target.value }))
            }
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Telefon</label>
          <Input
            value={formData.phone}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, phone: e.target.value }))
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Üyelik Tipi</label>
        <Select
          value={formData.membershipType}
          onValueChange={(value: Member["membershipType"]) =>
            setFormData((prev) => ({ ...prev, membershipType: value }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Üyelik tipi seçin" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="basic">Temel Üyelik</SelectItem>
            <SelectItem value="premium">Premium Üyelik</SelectItem>
            <SelectItem value="vip">VIP Üyelik</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Aldığı Hizmetler</label>
        <Select
          value={formData.subscribedServices[0] || ""}
          onValueChange={(value) =>
            setFormData((prev) => ({
              ...prev,
              subscribedServices: [...prev.subscribedServices, value],
            }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Hizmet seçin" />
          </SelectTrigger>
          <SelectContent>
            {sortedServices.map((service) => (
              <SelectItem key={service.id} value={service.name}>
                {service.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex flex-wrap gap-2 mt-2">
          {formData.subscribedServices.map((service) => (
            <Badge
              key={service}
              variant="secondary"
              className="cursor-pointer"
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  subscribedServices: prev.subscribedServices.filter(
                    (s) => s !== service,
                  ),
                }))
              }
            >
              {service} ×
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Başlangıç Tarihi</label>
        <Input
          type="date"
          value={formData.startDate}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, startDate: e.target.value }))
          }
        />
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          İptal
        </Button>
        <Button onClick={() => onSubmit(formData)}>
          {member ? "Güncelle" : "Ekle"}
        </Button>
      </DialogFooter>
    </div>
  );
};
const MembersPage = () => {
  const [members, setMembers] = useState<Member[]>(defaultMembers);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  const filteredMembers = members.filter(
    (member) =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone.includes(searchTerm),
  );

  const handleAddMember = (newMember: Omit<Member, "id">) => {
    const newMemberWithId = { ...newMember, id: (Date.now() + "").toString() };
    setMembers((prev) => [...prev, newMemberWithId]);
  };

  const handleEditMember = (updatedMember: Omit<Member, "id">) => {
    setMembers((prev) =>
      prev.map((member) =>
        member.id === editingMember?.id
          ? { ...member, ...updatedMember }
          : member,
      ),
    );
    setEditingMember(null);
  };

  const handleDeleteMember = (id: string) => {
    setMembers((prev) => prev.filter((member) => member.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder="Üye arayın..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2" />
              Yeni Üye
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Üye Ekle</DialogTitle>
            </DialogHeader>
            <MemberForm onSubmit={handleAddMember} onCancel={() => {}} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.map((member) => (
          <Card key={member.id} className="p-4 space-y-4">
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarImage src={member.avatarUrl} />
                <AvatarFallback>{member.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">{member.name}</h3>
                <Badge className={getMembershipColor(member.membershipType)}>
                  {getMembershipLabel(member.membershipType)}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Phone size={16} />
                <span>{member.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={16} />
                <span>{member.email}</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Aldığı Hizmetler:</p>
              {member.subscribedServices.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {member.subscribedServices.map((service) => (
                    <Badge key={service}>{service}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Hizmet yok</p>
              )}
            </div>

            <div className="flex items-center gap-2 justify-between">
              <p className="text-sm text-gray-500">
                Başlangıç: {member.startDate}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingMember(member)}
                >
                  <Pencil size={16} />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteMember(member.id)}
                >
                  Sil
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {editingMember && (
        <Dialog open={true} onOpenChange={() => setEditingMember(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Üye Güncelle</DialogTitle>
            </DialogHeader>
            <MemberForm
              member={editingMember}
              onSubmit={handleEditMember}
              onCancel={() => setEditingMember(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default MembersPage;
