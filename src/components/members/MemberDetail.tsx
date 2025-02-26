import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Crown,
  Pencil,
  Phone,
  Mail,
  Calendar,
  History,
  Trash2,
  CheckCircle2,
  Notebook,
  Package2,
  ChevronDown,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Database } from "@/types/supabase";
import React, { useState, useMemo } from "react";
import { AppointmentHistory } from "./AppointmentHistory";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Progress } from "../ui/progress";

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
  onUpdate?: (member: Member) => Promise<void>;
}

export const MemberDetail = ({
  member,
  services,
  trainers,
  appointments,
  onEdit,
  onDelete,

}: MemberDetailProps) => {
  const [showAppointments, setShowAppointments] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPackagesDialog, setShowPackagesDialog] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const isVip = member.membership_type === "vip";

  // Filter appointments for this member
  const memberAppointments = appointments.filter(
    (apt) => apt.member_id === member.id
  );

  // Calculate total package amount
  const totalPackageAmount = member.subscribed_services.reduce(
    (total, serviceId) => {
      const service = services[serviceId];
      return total + (service?.price || 0);
    },
    0
  );

  // Paketleri grupla ve say
  const groupedServices = useMemo(() => {
    return member.subscribed_services.reduce(
      (acc: { [key: string]: number }, serviceId) => {
        acc[serviceId] = (acc[serviceId] || 0) + 1;
        return acc;
      },
      {}
    );
  }, [member.subscribed_services]);

  // Calculate used sessions for each service
  const usedSessions = member.subscribed_services.reduce((acc, serviceId) => {
    // Bu servis için tamamlanan randevuları bul
    const serviceAppointments = memberAppointments.filter(
      (apt) => apt.service_id === serviceId && (apt.status === "completed" || apt.status === "cancelled")
    );

    // Aktif paketteki tamamlanan seans sayısı
    const currentPackageCompletedSessions = serviceAppointments.length;

    acc[serviceId] = currentPackageCompletedSessions;

    return acc;
  }, {} as { [key: string]: number });

  const handleDelete = async () => {
    if (member.id) {
      await onDelete(member.id);
      setShowDeleteDialog(false);
    }
  };
  return (
    <div className="p-3 relative">
      {/* Services Summary */}
      <div className="space-y-3">
        {/* Üst Bilgi Kartı */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border overflow-hidden">
          {/* Üst Kısım */}
          <div className="p-4 flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-primary/10">
              <AvatarImage src={member.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-base font-medium">
                {member.first_name[0]}
                {member.last_name[0]}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold truncate">
                  {member.first_name} {member.last_name}
                </h2>
                {isVip && (
                  <Badge
                    variant="secondary"
                    className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 shrink-0"
                  >
                    <Crown className="w-3 h-3 mr-1" />
                    VIP
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {member.membership_type === "vip" ? "VIP Üye" : "Standart Üye"}
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(member)}
                className="h-8"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                className="h-8"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* İletişim ve Not Kartı */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* İletişim Bilgileri */}
          <Collapsible
            open={isContactOpen}
            onOpenChange={setIsContactOpen}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border overflow-hidden"
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Phone className="w-4 h-4" />
                İletişim Bilgileri
              </div>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  isContactOpen ? "transform rotate-180" : ""
                }`}
              />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-4 pt-0 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-primary" />
                  <span>{member.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="flex items-center gap-2">
                    <Mail className="size-4"/>
                    {member.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>
                    {new Date(member.start_date).toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Notlar */}
          <Collapsible
            open={isNotesOpen}
            onOpenChange={setIsNotesOpen}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border overflow-hidden"
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Notebook className="w-4 h-4" />
                Notlar
              </div>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  isNotesOpen ? "transform rotate-180" : ""
                }`}
              />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-4 pt-0">
                <p className="text-sm text-muted-foreground">
                  {member.notes || "Not bulunmuyor"}
                </p>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Paketler Kartı */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Package2 className="w-4 h-4 text-primary" />
              <h3 className="font-medium">Satın Alınan Paketler</h3>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Toplam: </span>
              <span className="font-medium">
                {totalPackageAmount.toLocaleString("tr-TR")} ₺
              </span>
            </div>
          </div>

          <div className="grid gap-2">
            {Object.entries(groupedServices).map(([serviceId, count]) => {
              const service = services[serviceId];
              if (!service) return null;
              const totalSessions = service.session_count * count;
              const completedSessions = usedSessions[serviceId] || 0;
              const progress = (completedSessions / totalSessions) * 100;

              return (
                <div
                  key={serviceId}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-md">
                      <Package2 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">
                        {service.name}
                        {count > 1 && (
                          <span className="ml-1 text-muted-foreground">
                            x{count}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-0.5">
                        {service.price.toLocaleString("tr-TR")} ₺
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge
                      variant="outline"
                      className="bg-primary/5 border-primary/10"
                      title="Tamamlanan Seans Sayısı"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary mr-1" />
                      {completedSessions} / {totalSessions} Seans
                    </Badge>
                    <Progress value={progress} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Randevu Geçmişi Butonu */}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setShowAppointments(true)}
        >
          <History className="mr-2 h-4 w-4" />
          Randevu Geçmişi
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Üye Silme Onayı</DialogTitle>
            <DialogDescription>
              {member.first_name} {member.last_name} isimli üyeyi silmek
              istediğinize emin misiniz? Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              İptal
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Packages Dialog */}
      <Dialog open={showPackagesDialog} onOpenChange={setShowPackagesDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Paket Detayları</DialogTitle>
            <DialogDescription>
              {member.first_name} {member.last_name} üyesinin aktif paketleri
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Aktif Paketler */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground mb-1">
                Aktif Paketler
              </h4>
              <div className="grid gap-2">
                {Object.entries(groupedServices).map(([serviceId, count]) => {
                  const service = services[serviceId];
                  if (!service) return null;
                  const totalSessions = service.session_count * count;
                  return (
                    <div
                      key={serviceId}
                      className="flex items-center justify-between rounded-lg border p-2 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Package2 className="h-4 w-4 text-primary" />
                        <span>
                          {service.name}
                          {count > 1 && (
                            <span className="ml-1 text-muted-foreground">
                              x{count}
                            </span>
                          )}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className="ml-auto flex items-center gap-1"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                        <span>
                          {usedSessions[serviceId] || 0} / {totalSessions} Seans
                          Tamamlandı
                        </span>
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPackagesDialog(false)}
            >
              Kapat
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
          services={services}
          trainers={trainers}
          member={member}
        />
      )}
    </div>
  );
};
