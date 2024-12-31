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
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus, Pencil, Phone, Mail, Crown, Users } from "lucide-react";
import { memberSchema } from "@/lib/validations";
import * as z from "zod";

import { defaultMembers } from "@/data/members";
import { MemberForm } from "@/components/forms/MemberForm";

type FormData = z.infer<typeof memberSchema>;

interface Member extends FormData {
  id: string;
}

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
  const [members, setMembers] = useState<Member[]>(defaultMembers);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [membershipFilter, setMembershipFilter] = useState<
    Member["membershipType"] | "all"
  >("all");
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [addingMember, setAddingMember] = useState(false);
  // Benzersiz hizmetleri al
  const uniqueServices = Array.from(
    new Set(members.flatMap((member) => member.subscribedServices))
  ).sort();

  // Tüm arama önerilerini oluştur
  const searchSuggestions = [
    {
      group: "Hizmetler",
      items: uniqueServices.map((service) => ({
        type: "service" as const,
        value: service,
        label: service,
      })),
    },
    {
      group: "Üyeler",
      items: members.map((member) => ({
        type: "member" as const,
        value: `${member.firstName} ${member.lastName}`,
        label: `${member.firstName} ${member.lastName}`,
        member,
      })),
    },
  ];
  const filteredMembers = members.filter((member) => {
    const memberName = `${member.firstName} ${member.lastName}`.toLowerCase();
    const matchesSearch =
      memberName.includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
      member.phone?.includes(searchTerm) ||
      member.subscribedServices.some((service) =>
        service.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesMembership =
      membershipFilter === "all" || member.membershipType === membershipFilter;

    return matchesSearch && matchesMembership;
  });

  const handleSearchSelect = (value: string, type: "service" | "member") => {
    setSearchTerm(value);
    setIsSearchOpen(false);
  };
  // Calculate stats
  const stats = {
    total: members.length,
    vip: members.filter((m) => m.membershipType === "vip").length,
    basic: members.filter((m) => m.membershipType === "basic").length,
  };

  const handleAdd = (data: FormData) => {
    const newMember = {
      ...data,
      id: Math.random().toString(),
    };
    setMembers((prev) => [...prev, newMember]);
    setAddingMember(false);
  };

  const handleEdit = (data: FormData) => {
    if (!editingMember) return;

    setMembers((prev) =>
      prev.map((member) =>
        member.id === editingMember.id ? { ...data, id: member.id } : member
      )
    );
    setEditingMember(null);
  };

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
            <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
              <PopoverTrigger asChild>
                <div className="relative flex-1 ">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="İsim, e-posta, telefon veya hizmet ara..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setIsSearchOpen(true);
                    }}
                    className="pl-9"
                    onClick={() => setIsSearchOpen(true)}
                  />
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder="Arama yap..."
                    value={searchTerm}
                    onValueChange={setSearchTerm}
                  />
                  <CommandList>
                    <CommandEmpty>Sonuç bulunamadı.</CommandEmpty>
                    {searchSuggestions.map((group) => (
                      <CommandGroup key={group.group} heading={group.group}>
                        {group.items
                          .filter((item) =>
                            item.label
                              .toLowerCase()
                              .includes(searchTerm.toLowerCase())
                          )
                          .slice(0, 5) // Her gruptan en fazla 5 öneri
                          .map((item) => (
                            <CommandItem
                              key={item.value}
                              value={item.value}
                              onSelect={() =>
                                handleSearchSelect(item.value, item.type)
                              }
                            >
                              {item.type === "service" ? (
                                <>
                                  <div className="mr-2">🎯</div>
                                  {item.label}
                                </>
                              ) : (
                                <>
                                  <div className="mr-2">👤</div>
                                  {item.label}
                                </>
                              )}
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <Select
            value={membershipFilter}
            onValueChange={(value: Member["membershipType"] | "all") =>
              setMembershipFilter(value)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Üyelik Tipi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Üyelikler</SelectItem>
              <SelectItem value="basic">Temel Üyelik</SelectItem>
              <SelectItem value="vip">VIP Üyelik</SelectItem>
            </SelectContent>
          </Select>

          <Dialog
            open={addingMember}
            onOpenChange={(open) => setAddingMember(open)}
          >
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
                onCancel={() => setAddingMember(null)}
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
                  <AvatarImage src={member.avatarUrl} />
                  <AvatarFallback>{member.firstName}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {`${member.firstName} ${member.lastName}`}
                      </h3>
                      <Badge
                        className={`mt-1 ${
                          member.membershipType === "basic"
                            ? "bg-blue-500"
                            : "bg-yellow-500"
                        }`}
                      >
                        {member.membershipType === "basic"
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
                  {member.subscribedServices.map((service) => (
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
        onOpenChange={() => setEditingMember(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Üye Düzenle</DialogTitle>
          </DialogHeader>
          {editingMember && (
            <MemberForm
              member={{
                id: editingMember.id,
                firstName: editingMember.firstName || "",
                lastName: editingMember.lastName || "",
                email: editingMember.email || "",
                phone: editingMember.phone || "",
                membershipType: editingMember.membershipType || "basic",
                subscribedServices: editingMember.subscribedServices || [],
                startDate: editingMember.startDate || "",
                endDate: editingMember.endDate || "",
                avatarUrl: editingMember.avatarUrl || "",
              }}
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
