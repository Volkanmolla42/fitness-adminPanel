import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown } from "lucide-react";
import type { Database } from "@/types/supabase";

type Member = Database["public"]["Tables"]["members"]["Row"];
type Service = Database["public"]["Tables"]["services"]["Row"];

interface MemberCardProps {
  member: Member;
  services: { [key: string]: Service };
  onClick: (member: Member) => void;
}

export const MemberCard = ({ member, services, onClick }: MemberCardProps) => {
  return (
    <div
      className="bg-card rounded-lg p-4 hover:shadow-lg transition-all cursor-pointer border border-border hover:border-primary/50 relative"
      onClick={() => onClick(member)}
    >
      <div className="absolute top-2 right-2 flex items-center justify-center gap-2">
        <Badge
          variant={member.membership_type === "vip" ? "destructive" : "secondary"}
          className="flex items-center gap-1.5 px-2.5 py-1"
        >
          {member.membership_type === "vip" ? (
            <>
              VIP
              <Crown className="h-3.5 w-3.5 text-yellow-400" />
            </>
          ) : (
            "Standart"
          )}
        </Badge>
      </div>

      <div className="flex flex-col items-center text-center">
        <Avatar className="h-20 w-20">
          <AvatarImage src={member.avatar_url || ""} />
          <AvatarFallback>
            {member.first_name[0]}
            {member.last_name[0]}
          </AvatarFallback>
        </Avatar>
        <div className="mt-4">
          <h3 className="font-semibold">
            {member.first_name} {member.last_name}
          </h3>
          <p className="text-sm text-muted-foreground">{member.email}</p>
          <p className="text-sm text-muted-foreground">{member.phone}</p>
        </div>
        
        <div className="w-full mt-3">
          <p className="text-xs text-muted-foreground mb-1">Aldığı Hizmetler</p>
          <div className="flex flex-wrap justify-center gap-1">
            {member.subscribed_services.map((serviceId) => {
              const service = services[serviceId];
              return (
                <Badge 
                  key={serviceId} 
                  variant="outline" 
                  className="px-3 py-1 flex items-center gap-2"
                >
                  <span>{service?.name || "Yükleniyor..."}</span>
                  
                </Badge>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
