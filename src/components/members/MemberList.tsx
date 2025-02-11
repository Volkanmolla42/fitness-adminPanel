import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import type { Database } from "@/types/supabase";
import { MemberCard } from "./MemberCard";
import React from "react";
type Member = Database["public"]["Tables"]["members"]["Row"];
type Service = Database["public"]["Tables"]["services"]["Row"];
type Trainer = Database["public"]["Tables"]["trainers"]["Row"];
type Appointment = Database["public"]["Tables"]["appointments"]["Row"];

interface MemberListProps {
  members: Member[];
  services: { [key: string]: Service };
  trainers: Trainer[];
  appointments: Appointment[];
  searchTerm: string;
  membershipFilter: Member["membership_type"] | "all";
  selectedTrainerId: string | "all";
  onSearch: (term: string) => void;
  onMemberClick: (member: Member) => void;
  onTrainerFilterChange: (trainerId: string) => void;
}

export const MemberList = ({
  members,
  services,
  trainers,
  appointments,
  searchTerm,
  membershipFilter,
  selectedTrainerId,
  onSearch,
  onMemberClick,
  onTrainerFilterChange,
}: MemberListProps) => {
  const filteredMembers = members
    .filter((member) => {
      const matchesSearch =
        member.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.phone.includes(searchTerm);

      const matchesFilter =
        membershipFilter === "all" || member.membership_type === membershipFilter;

      const matchesTrainer =
        selectedTrainerId === "all" ||
        appointments.some(
          (appointment) =>
            appointment.member_id === member.id &&
            appointment.trainer_id === selectedTrainerId
        );

      return matchesSearch && matchesFilter && matchesTrainer;
    })
    .sort((a, b) => {
      // VIP üyeleri önce göster
      if (a.membership_type === "vip" && b.membership_type !== "vip") return -1;
      if (a.membership_type !== "vip" && b.membership_type === "vip") return 1;
      
      // Aynı üyelik tipindeyse isme göre sırala
      return a.first_name.localeCompare(b.first_name);
    });

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="İsim, email veya telefon ile ara..."
          value={searchTerm}
          onChange={(e) => onSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      <div className="flex items-center space-x-2">
        <select
          value={selectedTrainerId}
          onChange={(e) => onTrainerFilterChange(e.target.value)}
          className="w-full p-2 border rounded-md"
        >
          <option value="all">Tüm Antrenörler</option>
          {trainers.map((trainer) => (
            <option key={trainer.id} value={trainer.id}>
              {trainer.first_name} {trainer.last_name}
            </option>
          ))}
        </select>
        <p className="text-sm text-muted-foreground whitespace-nowrap">
          {filteredMembers.length} üye listeleniyor
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.map((member) => (
          <MemberCard
            key={member.id}
            member={member}
            services={services}
            onClick={onMemberClick}
          />
        ))}
      </div>
    </div>
  );
};
