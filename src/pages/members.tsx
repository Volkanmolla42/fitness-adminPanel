import { useState } from "react";
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

import { Search, Plus, Pencil, Phone, Mail, Users, Crown, Calendar } from "lucide-react";
import { defaultServices } from "@/pages/services";
import memberData from "@/data/members";
import { MembershipType, Member } from "@/types/member";


// Constants
const MEMBERSHIP_CONFIG = {
  basic: {
    color: "bg-blue-500",
    label: "Temel Üyelik",
    icon: Users,
  },
  premium: {
    color: "bg-purple-500",
    label: "Premium Üyelik",
    icon: Crown,
  },
  vip: {
    color: "bg-yellow-500",
    label: "VIP Üyelik",
    icon: Crown,
  },
} as const;

// Components
const StatsCard = ({ title, value, Icon, iconColor }: {
  title: string;
  value: number;
  Icon: typeof Users | typeof Crown;
  iconColor?: string;
}) => (
  <Card className="p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <h3 className="text-2xl font-bold">{value}</h3>
      </div>
      <Icon className={`h-8 w-8 ${iconColor || "text-muted-foreground"}`} />
    </div>
  </Card>
);

const MemberCard = ({ 
  member, 
  onEdit 
}: { 
  member: Member; 
  onEdit: (member: Member) => void;
}) => (
  <Card className="p-4 space-y-4">
    <div className="flex items-center space-x-3">
      <Avatar>
        <AvatarImage src={member.avatarUrl} />
        <AvatarFallback>{member.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
      </Avatar>
      <div className="font-medium">{member.name}</div>
    </div>

    <Badge className={MEMBERSHIP_CONFIG[member.membershipType].color}>
      {MEMBERSHIP_CONFIG[member.membershipType].label}
    </Badge>

    <div className="space-y-2 text-sm">
      <div className="flex items-center">
        <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
        {member.email}
      </div>
      <div className="flex items-center">
        <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
        {member.phone}
      </div>
      <div className="flex items-center">
        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
        {new Date(member.startDate).toLocaleDateString('tr-TR')}
      </div>
    </div>

    <div className="flex flex-wrap gap-1">
      {member.subscribedServices.map((service) => (
        <Badge key={service} variant="outline" className="text-xs">
          {service}
        </Badge>
      ))}
    </div>

    <div className="text-right">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onEdit(member)}
      >
        <Pencil className="h-4 w-4" />
      </Button>
    </div>
  </Card>
);

const MemberForm = ({
  member,
  onSubmit,
  onCancel,
}: {
  member?: Member;
  onSubmit: (member: Omit<Member, "id">) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState({
    name: member?.name || "",
    email: member?.email || "",
    phone: member?.phone || "",
    membershipType: member?.membershipType || "basic" as MembershipType,
    subscribedServices: member?.subscribedServices || [],
    startDate: member?.startDate || new Date().toISOString().split("T")[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      avatarUrl: member?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Ad Soyad</label>
        <Input
          value={formData.name}
          onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">E-posta</label>
          <Input
            type="email"
            value={formData.email}
            onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Telefon</label>
          <Input
            value={formData.phone}
            onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="555 123 45 67"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Üyelik Tipi</label>
        <Select
          value={formData.membershipType}
          onValueChange={(value: MembershipType) =>
            setFormData(prev => ({ ...prev, membershipType: value }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Üyelik tipi seçin" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(MEMBERSHIP_CONFIG).map(([value, { label }]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Aldığı Hizmetler</label>
        <Select
          value=""
          onValueChange={(value) => {
            if (!formData.subscribedServices.includes(value)) {
              setFormData(prev => ({
                ...prev,
                subscribedServices: [...prev.subscribedServices, value]
              }));
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Hizmet seçin" />
          </SelectTrigger>
          <SelectContent>
            {defaultServices.map((service) => (
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
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  subscribedServices: prev.subscribedServices.filter(s => s !== service)
                }));
              }}
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
          onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
          required
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          İptal
        </Button>
        <Button type="submit">Kaydet</Button>
      </DialogFooter>
    </form>
  );
};

const MembersPage = () => {
  const [members, setMembers] = useState<Member[]>(memberData);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMembershipType, setSelectedMembershipType] = useState<MembershipType | "all">("all");
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  const filteredMembers = members.filter((member) => {
    const matchesSearch = 
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone.includes(searchTerm);
    const matchesMembership = selectedMembershipType === "all" || member.membershipType === selectedMembershipType;
    return matchesSearch && matchesMembership;
  });

  const stats = {
    total: members.length,
    premium: members.filter(m => m.membershipType === "premium").length,
    vip: members.filter(m => m.membershipType === "vip").length,
    basic: members.filter(m => m.membershipType === "basic").length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard title="Toplam Üye" value={stats.total} Icon={Users} />
        <StatsCard title="Premium Üyeler" value={stats.premium} Icon={Crown} iconColor="text-purple-500" />
        <StatsCard title="VIP Üyeler" value={stats.vip} Icon={Crown} iconColor="text-yellow-500" />
        <StatsCard title="Temel Üyeler" value={stats.basic} Icon={Users} iconColor="text-blue-500" />
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="İsim, e-posta veya telefon ile ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <Select
          value={selectedMembershipType}
          onValueChange={(value: MembershipType | "all") => setSelectedMembershipType(value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Üyelik Tipi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Üyelikler</SelectItem>
            {Object.entries(MEMBERSHIP_CONFIG).map(([value, { label }]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
          <DialogTrigger asChild>
            <Button className="whitespace-nowrap">
              <Plus className="mr-2 h-4 w-4" /> Yeni Üye
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Yeni Üye Ekle</DialogTitle>
            </DialogHeader>
            <MemberForm
              onSubmit={(data) => {
                setMembers(prev => [...prev, { ...data, id: Math.random().toString() }]);
                setShowAddMemberDialog(false);
              }}
              onCancel={() => setShowAddMemberDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredMembers.map((member) => (
          <MemberCard
            key={member.id}
            member={member}
            onEdit={setEditingMember}
          />
        ))}
      </div>

      {/* Edit Member Dialog */}
      <Dialog open={!!editingMember} onOpenChange={() => setEditingMember(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Üye Düzenle</DialogTitle>
          </DialogHeader>
          {editingMember && (
            <MemberForm
              member={editingMember}
              onSubmit={(data) => {
                setMembers(prev =>
                  prev.map(m =>
                    m.id === editingMember.id ? { ...data, id: m.id } : m
                  )
                );
                setEditingMember(null);
              }}
              onCancel={() => setEditingMember(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MembersPage;