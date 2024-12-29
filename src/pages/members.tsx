import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { defaultServices } from "@/data/services";
import { Search, Plus, Pencil, Phone, Mail, Crown, Users } from "lucide-react";
import { memberSchema } from "@/lib/validations";
import * as z from "zod";
import { defaultMembers } from "@/data/members";

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

const MemberForm = ({
  member,
  onSubmit,
  onCancel,
}: {
  member?: Member;
  onSubmit: (member: FormData) => void;
  onCancel: () => void;
}) => {
  const form = useForm<FormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      name: member?.name || "",
      email: member?.email || "",
      phone: member?.phone || "",
      avatarUrl:
        member?.avatarUrl ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`,
      membershipType: member?.membershipType || "basic",
      subscribedServices: member?.subscribedServices || [],
      startDate: member?.startDate || new Date().toISOString().split("T")[0],
      endDate: member?.endDate || new Date().toISOString().split("T")[0],
    },
  });

  const sortedServices = [...defaultServices].sort((a, b) => {
    const aCount = defaultMembers.filter((m) =>
      m.subscribedServices.includes(a.name)
    ).length;
    const bCount = defaultMembers.filter((m) =>
      m.subscribedServices.includes(b.name)
    ).length;
    return bCount - aCount;
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ad Soyad</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-posta</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefon</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="(555) 123-4567" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="membershipType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Üyelik Tipi</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Üyelik tipi seçin" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="basic">Temel Üyelik</SelectItem>
                  <SelectItem value="premium">Premium Üyelik</SelectItem>
                  <SelectItem value="vip">VIP Üyelik</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="subscribedServices"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Aldığı Hizmetler</FormLabel>
              <Select
                value=""
                onValueChange={(value) => {
                  if (!field.value.includes(value)) {
                    field.onChange([...field.value, value]);
                  }
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Hizmet seçin" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {sortedServices.map((service) => (
                    <SelectItem key={service.id} value={service.name}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex flex-wrap gap-2 mt-2">
                {field.value.map((service) => (
                  <Badge
                    key={service}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() =>
                      field.onChange(field.value.filter((s) => s !== service))
                    }
                  >
                    {service} ×
                  </Badge>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Başlangıç Tarihi</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="endDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bitiş Tarihi</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            İptal
          </Button>
          <Button type="submit">{member ? "Güncelle" : "Ekle"}</Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

const MembersPage = () => {
  const [members, setMembers] = useState<Member[]>(defaultMembers);
  const [searchTerm, setSearchTerm] = useState("");
  const [membershipFilter, setMembershipFilter] = useState<
    Member["membershipType"] | "all"
  >("all");
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone.includes(searchTerm);

    const matchesMembership =
      membershipFilter === "all" || member.membershipType === membershipFilter;

    return matchesSearch && matchesMembership;
  });

  // Calculate stats
  const stats = {
    total: members.length,
    premium: members.filter((m) => m.membershipType === "premium").length,
    vip: members.filter((m) => m.membershipType === "vip").length,
    basic: members.filter((m) => m.membershipType === "basic").length,
  };

  const handleAdd = (data: FormData) => {
    const newMember = {
      ...data,
      id: Math.random().toString(),
    };
    setMembers((prev) => [...prev, newMember]);
    setEditingMember(null);
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard title="Toplam Üye" value={stats.total} icon={Users} />
        <StatsCard
          title="Temel Üyeler"
          value={stats.basic}
          icon={Users}
          iconColor="text-blue-500"
        />

        <StatsCard
          title="Premium Üyeler"
          value={stats.premium}
          icon={Crown}
          iconColor="text-purple-500"
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
              placeholder="İsim, e-posta veya telefon ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
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
              <SelectItem value="premium">Premium Üyelik</SelectItem>
              <SelectItem value="vip">VIP Üyelik</SelectItem>
            </SelectContent>
          </Select>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="whitespace-nowrap">
                <Plus className="mr-2 h-4 w-4" /> Yeni Üye
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yeni Üye Ekle</DialogTitle>
              </DialogHeader>
              <MemberForm
                onSubmit={handleAdd}
                onCancel={() => setEditingMember(null)}
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
                  <AvatarFallback>{member.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{member.name}</h3>
                      <Badge
                        className={`mt-1 ${
                          member.membershipType === "premium"
                            ? "bg-purple-500"
                            : member.membershipType === "vip"
                            ? "bg-yellow-500"
                            : "bg-blue-500"
                        }`}
                      >
                        {member.membershipType === "premium"
                          ? "Premium Üyelik"
                          : member.membershipType === "vip"
                          ? "VIP Üyelik"
                          : "Temel Üyelik"}
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
