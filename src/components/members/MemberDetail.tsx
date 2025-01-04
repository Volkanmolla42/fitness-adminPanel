import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, Pencil, Phone, Mail, Calendar, ListChecks, History } from "lucide-react";
import type { Database } from "@/types/supabase";
import { useState } from "react";
import { AppointmentHistory } from "./AppointmentHistory";

type Member = Database["public"]["Tables"]["members"]["Row"];
type Service = Database["public"]["Tables"]["services"]["Row"];
type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
type Trainer = Database["public"]["Tables"]["trainers"]["Row"];

interface MemberDetailProps {
  member: Member;
  services: { [key: string]: Service };
  trainers: { [key: string]: Trainer };
  appointments: Appointment[];
  onEdit: (member: Member) => void;
  onDelete: (id: string) => Promise<void>;
}

export const MemberDetail = ({ 
  member, 
  services, 
  trainers,
  appointments, 
  onEdit, 
  onDelete 
}: MemberDetailProps) => {
  const [showAppointments, setShowAppointments] = useState(false);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Badge
            variant={member.membership_type === "vip" ? "destructive" : "secondary"}
          >
            {member.membership_type === "vip" ? "VIP Üye" : "Standart Üye"}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="w-4 h-4" />
            <span>{member.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="w-4 h-4" />
            <span>{member.email}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>
              {new Date(member.start_date).toLocaleDateString("tr-TR")} -{" "}
              {new Date(member.end_date).toLocaleDateString("tr-TR")}
            </span>
          </div>
        </div>

        {/* Aldığı Hizmetler */}
        <div className="bg-muted/30 rounded-lg p-4">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <ListChecks className="w-4 h-4" />
            Aldığı Hizmetler
          </h3>
          <div className="flex flex-wrap gap-2">
            {member.subscribed_services.map((serviceId) => {
              const service = services[serviceId];
              return (
                <Badge key={serviceId} variant="outline" className="px-3 py-1 flex items-center gap-2">
                  <span>{service?.name || "Yükleniyor..."}</span>
                  {service && (
                    <>
                      <span className="text-xs text-muted-foreground">
                        ({service.session_count} Seans)
                      </span>
                      {service.isVipOnly && (
                        <Crown className="w-3 h-3 text-red-500" />
                      )}
                    </>
                  )}
                </Badge>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex justify-between gap-2 pt-4 border-t">
        <Button
          variant="outline"
          onClick={() => setShowAppointments(true)}
        >
          <History className="h-4 w-4 mr-2" />
          Randevu Geçmişi
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onEdit(member)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Düzenle
          </Button>
          <Button
            variant="destructive"
            onClick={async () => {
              if (member.id) {
                try {
                  await onDelete(member.id);
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

      <AppointmentHistory
        open={showAppointments}
        onOpenChange={setShowAppointments}
        appointments={appointments.filter(apt => apt.member_id === member.id)}
        services={services}
        trainers={trainers}
      />
    </div>
  );
};
