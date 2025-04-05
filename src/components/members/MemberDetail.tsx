import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Crown,
  Pencil,
  Phone,
  History,
  Trash2,
  Package2,
  Calendar,
  UserX,
  UserCheck,
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

import { ServiceProgress } from "./ServiceProgress";

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
  onAppointmentDeleted?: (appointmentId: string) => void;
  onToggleActive?: (member: Member) => Promise<void>;
}

export const MemberDetail = ({
  member,
  services,
  trainers,
  appointments,
  onEdit,
  onDelete,
  onAppointmentDeleted,
  onUpdate,
}: MemberDetailProps) => {
  const [showAppointments, setShowAppointments] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPackagesDialog, setShowPackagesDialog] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [showActivateDialog, setShowActivateDialog] = useState(false);
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

  // Hesaplamaları useMemo ile optimize et
  const memberServices = useMemo(() => {
    // Üyenin aldığı paketleri ve sayılarını hesapla
    const serviceCount = member.subscribed_services.reduce((acc, serviceId) => {
      acc[serviceId] = (acc[serviceId] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    // Her bir servis için ilgili randevuları bul
    return Object.entries(serviceCount).map(([serviceId, count]) => {
      const service = services[serviceId];

      // Bu üyenin bu servise ait tüm randevuları
      const serviceAppointments = appointments.filter(
        (apt) => apt.service_id === serviceId && apt.member_id === member.id
      );

      return {
        serviceId,
        service,
        appointments: serviceAppointments,
        totalPackages: count,
      };
    });
  }, [member, services, appointments]);

  const handleDelete = async () => {
    if (member.id) {
      await onDelete(member.id);
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="p-2 relative">
      {/* Services Summary */}
      <div className="space-y-2">
        {/* Üst Bilgi Kartı */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border overflow-hidden">
          {/* Üst Kısım */}
          <div className="p-2 flex items-center gap-3">
            <Avatar className="h-16 w-16 border-2 border-primary/10">
              <AvatarImage src={member.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-base font-medium">
                {member.first_name[0]}
                {member.last_name[0]}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <h2 className="font-medium truncate">
                  {member.first_name} {member.last_name}
                </h2>
                {isVip && (
                  <Badge
                    variant="secondary"
                    className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 shrink-0"
                  >
                    VIP
                    <Crown className="w-3 h-3 ml-1" />
                  </Badge>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(member.start_date).toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {member.phone}
                  </span>
                </div>
                <div>
                  {/* Sadece pasif üyelerde badge göster */}
                  {!member.active && (
                    <Badge
                      variant="destructive"
                      className="h-6 p-2 gap-1 cursor-pointer hover:bg-red-600"
                    >
                      <UserX className="h-3 w-3" />
                      <span className="text-xs">Pasif</span>
                    </Badge>
                  )}
                  {/* Aktif/Pasif durumu değiştirme butonu */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      member.active
                        ? setShowDeactivateDialog(true)
                        : setShowActivateDialog(true)
                    }
                    className={`"h-6 p-2   ${
                      member.active
                        ? " text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                        : "text-green-600 hover:bg-green-50 hover:text-green-700 hover:border-green-300"
                    }`}
                  >
                    {member.active ? (
                      <UserX className="h-3 w-3 mr-1" />
                    ) : (
                      <UserCheck className="h-3 w-3 mr-1" />
                    )}
                    <span className="text-xs">
                      {member.active ? "Pasife Al" : "Aktife Al"}
                    </span>
                  </Button>
                </div>
              </div>
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

        {member.notes ? (
          <div className="bg-white px-4 dark:bg-gray-800 rounded-lg shadow-sm border overflow-hidden">
            <div className="text-xs font-medium mb-2 text-muted-foreground flex items-center gap-1">
              Not
            </div>
            <p className="text-xs">{member.notes}</p>
          </div>
        ) : (
          ""
        )}

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
            {memberServices.map(
              ({ serviceId, service, appointments, totalPackages }) => (
                <ServiceProgress
                  key={serviceId}
                  service={service}
                  appointments={appointments}
                  totalPackages={totalPackages}
                />
              )
            )}
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
                {memberServices.map(
                  ({ serviceId, service, appointments, totalPackages }) => (
                    <ServiceProgress
                      key={serviceId}
                      service={service}
                      appointments={appointments}
                      totalPackages={totalPackages}
                    />
                  )
                )}
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

      {/* Aktif/Pasif Durumu Değiştirme Onay Dialogu */}
      {(showDeactivateDialog || showActivateDialog) && (
        <Dialog
          open={showDeactivateDialog || showActivateDialog}
          onOpenChange={(open) => {
            if (!open) {
              setShowDeactivateDialog(false);
              setShowActivateDialog(false);
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Üye {showDeactivateDialog ? "Pasife" : "Aktife"} Alma Onayı
              </DialogTitle>
              <DialogDescription>
                {member.first_name} {member.last_name} isimli üyeyi{" "}
                {showDeactivateDialog ? "pasife" : "aktife"} almak istediğinize
                emin misiniz?{" "}
                {showDeactivateDialog
                  ? 'Pasif üyeler listelerde görünmeye devam edecek ancak "Pasif" olarak işaretlenecektir.'
                  : 'Aktif üyeler normal olarak listelerde görünecek ve "Pasif" işareti kaldırılacaktır.'}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeactivateDialog(false);
                  setShowActivateDialog(false);
                }}
              >
                İptal
              </Button>
              <Button
                variant={showDeactivateDialog ? "destructive" : "default"}
                className={
                  showActivateDialog ? "bg-green-600 hover:bg-green-700" : ""
                }
                onClick={() => {
                  if (onUpdate) {
                    onUpdate({
                      ...member,
                      active: !member.active,
                    });
                    setShowDeactivateDialog(false);
                    setShowActivateDialog(false);
                  }
                }}
              >
                {showDeactivateDialog ? "Pasife Al" : "Aktife Al"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Appointment History Modal */}
      {showAppointments && (
        <AppointmentHistory
          open={showAppointments}
          onOpenChange={setShowAppointments}
          appointments={memberAppointments}
          services={services}
          trainers={trainers}
          member={member}
          onAppointmentDeleted={onAppointmentDeleted}
        />
      )}
    </div>
  );
};
