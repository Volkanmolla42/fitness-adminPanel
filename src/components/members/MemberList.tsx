import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import type { Database } from "@/types/supabase";
import { MemberCard } from "./MemberCard";
import React, { useMemo, useEffect } from "react";
import { useTheme } from "@/contexts/theme-context";

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
  highlightedMemberId?: string | null; // Highlight edilecek üye ID'si
  onStatsChange?: (stats: { total: number; basic: number; vip: number }) => void; // İstatistikleri üst bileşene iletmek için
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
  highlightedMemberId,
  onStatsChange,
}: MemberListProps) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Filtreleme ve istatistik hesaplamalarını useMemo ile optimize ediyoruz
  const { filteredMembers, stats } = useMemo(() => {
    // Tüm filtreleme mantığını burada topladık
    const filtered = members
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

    // Filtreleme istatistiklerini hesaplıyoruz
    const memberStats = {
      total: members.length,
      filtered: filtered.length,
      basic: members.filter((m) => m.membership_type === "basic").length,
      vip: members.filter((m) => m.membership_type === "vip").length,
      filteredBasic: filtered.filter((m) => m.membership_type === "basic").length,
      filteredVip: filtered.filter((m) => m.membership_type === "vip").length
    };

    return { filteredMembers: filtered, stats: memberStats };
  }, [members, appointments, searchTerm, membershipFilter, selectedTrainerId]);

  // İstatistikleri üst bileşene iletiyoruz
  useEffect(() => {
    if (onStatsChange) {
      onStatsChange({
        total: stats.total,
        basic: stats.basic,
        vip: stats.vip
      });
    }
  }, [stats, onStatsChange]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className={`absolute left-2 top-2.5 h-4 w-4 ${isDark ? "text-gray-400" : "text-muted-foreground"}`} />
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
          className={`w-full p-2 border rounded-md ${
            isDark 
              ? "bg-gray-800 text-gray-200 border-gray-700" 
              : "bg-white text-gray-900 border-gray-300"
          }`}
        >
          <option value="all">Tüm Antrenörler</option>
          {trainers.map((trainer) => (
            <option key={trainer.id} value={trainer.id}>
              {trainer.first_name} {trainer.last_name}
            </option>
          ))}
        </select>
        <p className={`text-sm whitespace-nowrap ${isDark ? "text-gray-400" : "text-muted-foreground"}`}>
          {filteredMembers.length} üye listeleniyor
          {searchTerm && ` (${stats.total} üyeden)`}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.map((member) => (
          <div 
            key={member.id}
            className={`transition-all duration-500 ${
              highlightedMemberId === member.id 
                ? 'scale-105 ring-2 ring-primary ring-offset-2 shadow-lg' 
                : ''
            }`}
          >
            <MemberCard
              member={member}
              services={services}
              appointments={appointments}
              onClick={onMemberClick}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
