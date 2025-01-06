import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, Pencil, Phone, Mail, Calendar, ListChecks, History, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Database } from "@/types/supabase";
import { useState } from "react";
import { AppointmentHistory } from "./AppointmentHistory";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const isVip = member.membership_type === "vip";

  // Filter appointments for this member
  const memberAppointments = appointments.filter(apt => apt.member_id === member.id);

  // Calculate total package amount
  const totalPackageAmount = member.subscribed_services.reduce((total, serviceId) => {
    const service = services[serviceId];
    return total + (service?.price || 0);
  }, 0);

  const handleDelete = async () => {
    if (member.id) {
      await onDelete(member.id);
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="py-6 px-4 relative">
      {/* VIP Crown */}
      {isVip && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Crown className="w-8 h-8 text-yellow-400 animate-pulse" />
        </div>
      )}

      {/* Profile Header */}
      <div className="flex flex-col items-center space-y-4 mb-6">
        <Avatar className="w-24 h-24">
          <AvatarImage src={member.avatar_url || ""} />
          <AvatarFallback className="bg-primary/10">
            {`${member.first_name[0]}${member.last_name[0]}`}
          </AvatarFallback>
        </Avatar>
        <div className="text-center">
          <h2 className="text-2xl font-bold">{`${member.first_name} ${member.last_name}`}</h2>
          <Badge
            className="mt-2"
            variant={isVip ? "destructive" : "secondary"}
          >
            {isVip ? "VIP Üye" : "Standart Üye"}
          </Badge>
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-3 bg-muted/30 rounded-lg p-4 mb-4">
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
            Başlangıç: {new Date(member.start_date).toLocaleDateString("tr-TR")}
          </span>
        </div>
      </div>

      {/* Services */}
      <div className="bg-muted/30 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-medium flex items-center gap-2">
            <ListChecks className="w-4 h-4" />
            Aldığı Paketler
          </h3>
          <div className="text-sm">
            <span className="text-muted-foreground mr-2">Toplam:</span>
            <span className="font-medium">{totalPackageAmount.toLocaleString('tr-TR')} ₺</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {member.subscribed_services.map((serviceId) => {
            const service = services[serviceId];
            return (
              <Badge
                key={serviceId}
                variant="outline"
                className="px-3 py-1 flex items-center gap-2"
              >
                <span>{service?.name || "Yükleniyor..."}</span>
                <span className="text-muted-foreground">
                  {service?.price?.toLocaleString('tr-TR')} ₺
                </span>
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Actions */}
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
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Sil
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Üye Silme Onayı</DialogTitle>
            <DialogDescription>
              {member.first_name} {member.last_name} isimli üyeyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              İptal
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Appointment History Modal */}
      {showAppointments && (
        <AppointmentHistory
          open={showAppointments}
          onOpenChange={setShowAppointments}
          appointments={memberAppointments}
          trainers={trainers}
          services={services}
        />
      )}
    </div>
  );
};
