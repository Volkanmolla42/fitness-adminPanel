import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, Pencil, Phone, Mail, Calendar, ListChecks, History, Trash2, CheckCircle2, CalendarHeart, Notebook } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Database } from "@/types/supabase";
import React, { useState } from "react";
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
  onUpdate?: (member: Member) => Promise<void>;
}

export const MemberDetail = ({
  member,
  services,
  trainers,
  appointments,
  onEdit,
  onDelete,
  onUpdate
}: MemberDetailProps) => {
  const [showAppointments, setShowAppointments] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPackagesDialog, setShowPackagesDialog] = useState(false);
  const [completingPackage, setCompletingPackage] = useState<string | null>(null);
  const isVip = member.membership_type === "vip";

  // Filter appointments for this member
  const memberAppointments = appointments.filter(apt => apt.member_id === member.id);

  // Calculate total package amount
  const totalPackageAmount = member.subscribed_services.reduce((total, serviceId) => {
    const service = services[serviceId];
    return total + (service?.price || 0);
  }, 0) + (member.completed_packages || []).reduce((total, completedPackage) => {
    const service = services[completedPackage.package_id];
    return total + ((service?.price || 0) * completedPackage.completion_count);
  }, 0);

  // Calculate used sessions for each service
  const usedSessions = member.subscribed_services.reduce((acc, serviceId) => {
    // Bu servis için tamamlanan randevuları bul
    const serviceAppointments = memberAppointments.filter(
      apt => apt.service_id === serviceId && apt.status === 'completed'
    );

    // Bu servisin tamamlanmış paket sayısını bul
    const completedPackageInfo = member.completed_packages?.find(
      pkg => pkg.package_id === serviceId
    );
    
    // Tamamlanmış paketlerin toplam seans sayısını hesapla
    const completedPackageSessionCount = completedPackageInfo 
      ? (services[serviceId]?.session_count || 0) * completedPackageInfo.completion_count
      : 0;

    // Aktif paketteki tamamlanan seans sayısı
    const currentPackageCompletedSessions = serviceAppointments.length;

    // Tamamlanan seanslardan, tamamlanmış paketlerin seans sayısını çıkar
    acc[serviceId] = Math.max(0, currentPackageCompletedSessions - completedPackageSessionCount);
    
    return acc;
  }, {} as { [key: string]: number });

  const handleDelete = async () => {
    if (member.id) {
      await onDelete(member.id);
      setShowDeleteDialog(false);
    }
  };

  const handleCompletePackage = async (serviceId: string) => {
    if (!onUpdate) return;

    // Mevcut completed_packages'ı kopyala veya boş array oluştur
    const currentCompletedPackages = member.completed_packages || [];
    
    // Bu paket daha önce tamamlanmış mı kontrol et
    const existingPackageIndex = currentCompletedPackages.findIndex(
      pkg => pkg.package_id === serviceId
    );

    let newCompletedPackages;
    if (existingPackageIndex !== -1) {
      // Paket daha önce tamamlanmışsa sayısını artır
      newCompletedPackages = [...currentCompletedPackages];
      newCompletedPackages[existingPackageIndex] = {
        ...newCompletedPackages[existingPackageIndex],
        completion_count: newCompletedPackages[existingPackageIndex].completion_count + 1
      };
    } else {
      // Paket ilk kez tamamlanıyorsa yeni ekle
      newCompletedPackages = [
        ...currentCompletedPackages,
        { package_id: serviceId, completion_count: 1 }
      ];
    }

    // subscribed_services'den paketi kaldır
    const newSubscribedServices = member.subscribed_services.filter(
      id => id !== serviceId
    );

    // Üyeyi güncelle
    const updatedMember = {
      ...member,
      completed_packages: newCompletedPackages,
      subscribed_services: newSubscribedServices
    };

    await onUpdate(updatedMember);
  };

  return (
    <div className="p-3 relative">
      {/* Profile Header & Contact Info */}
      <div className="flex flex-col gap-2 mb-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="w-14 h-14 shrink-0">
              <AvatarImage src={member.avatar_url || ""} />
              <AvatarFallback className="bg-primary/10">
                {`${member.first_name[0]}${member.last_name[0]}`}
              </AvatarFallback>
            </Avatar>
            {isVip && (
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                <Crown className="w-6 h-6 text-yellow-400 animate-pulse" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-lg font-bold">{`${member.first_name} ${member.last_name}`}</h2>
              <Badge
                variant={isVip ? "destructive" : "secondary"}
                className="shrink-0"
              >
                {isVip ? "VIP Üye" : "Standart Üye"}
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* İletişim Bilgileri */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground mb-1">İletişim Bilgileri</h4>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="bg-muted/50 p-1.5 rounded-md">
                      <Phone className="w-3.5 h-3.5 text-primary/70" />
                    </div>
                    <span>{member.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="bg-muted/50 p-1.5 rounded-md">
                      <Mail className="w-3.5 h-3.5 text-primary/70" />
                    </div>
                    <span>{member.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="bg-muted/50 p-1.5 rounded-md">
                      <Calendar className="w-3.5 h-3.5 text-primary/70" />
                    </div>
                    <span>{new Date(member.start_date).toLocaleDateString("tr-TR")}</span>
                  </div>
                </div>
              </div>

              {/* Notlar */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground mb-1">Notlar</h4>
                <div className="bg-muted/30 p-2.5 rounded-lg min-h-[80px] text-sm">
                  <div className="flex gap-2">
                    <Notebook className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary/70" />
                    <span className="text-muted-foreground">{member.notes || "Not bulunmuyor"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Services Summary */}
      <div className="bg-muted/30 rounded-lg p-2.5 mb-3">
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <h3 className="font-medium flex items-center gap-1.5 text-sm mb-1">
              <ListChecks className="w-3.5 h-3.5" />
              Aldığı Paketler
            </h3>
            <div className="text-sm text-muted-foreground">
              {member.subscribed_services.length} aktif, {member.completed_packages?.length || 0} tamamlanan paket
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm">
              <span className="text-muted-foreground mr-1">Toplam:</span>
              <span className="font-medium">{totalPackageAmount.toLocaleString('tr-TR')} ₺</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPackagesDialog(true)}
              className="mt-2"
            >
              <CalendarHeart className="w-3.5 h-3.5 mr-1.5" />
              Paketleri Görüntüle
            </Button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between gap-2 pt-2 border-t">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAppointments(true)}
          className="h-7"
        >
          <History className="h-3 w-3 mr-1.5" />
          Randevu Geçmişi
        </Button>
        <div className="flex gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(member)}
            className="h-7"
          >
            <Pencil className="h-3 w-3 mr-1.5" />
            Düzenle
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            className="h-7"
          >
            <Trash2 className="h-3 w-3 mr-1.5" />
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

      {/* Package Completion Dialog */}
      <Dialog open={!!completingPackage} onOpenChange={() => setCompletingPackage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Paket Tamamlama Onayı</DialogTitle>
            <DialogDescription>
              {completingPackage && services[completingPackage]?.name} paketini tamamlamak istediğinize emin misiniz? 
              Bu işlem geri alınamaz ve paket tamamlanan paketler listesine taşınacaktır.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setCompletingPackage(null)}>
              İptal
            </Button>
            <Button 
              variant="default"
              onClick={() => {
                if (completingPackage) {
                  handleCompletePackage(completingPackage);
                  setCompletingPackage(null);
                }
              }}
            >
              Tamamla
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
              {member.first_name} {member.last_name} üyesinin aktif ve tamamlanmış paketleri
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Aktif Paketler */}
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <div className="bg-primary/10 p-1.5 rounded">
                  <CalendarHeart className="w-4 h-4 text-primary" />
                </div>
                Aktif Paketler
              </h4>
              <div className="space-y-2">
                {member.subscribed_services.map((serviceId) => {
                  const service = services[serviceId];
                  return (
                    <div
                      key={serviceId}
                      className="flex items-center justify-between gap-4 bg-muted/30 p-2.5 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{service?.name || "Yükleniyor..."}</div>
                        <div className="text-sm text-muted-foreground mt-0.5">
                          {service?.price?.toLocaleString('tr-TR')} ₺
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="px-2.5">
                          {usedSessions[serviceId] || 0}/{service?.session_count} Seans
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50 transition-colors duration-200"
                          onClick={() => setCompletingPackage(serviceId)}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1.5" />
                          Tamamla
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {member.subscribed_services.length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    Aktif paket bulunmuyor
                  </div>
                )}
              </div>
            </div>

            {/* Tamamlanan Paketler */}
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <div className="bg-green-100 p-1.5 rounded">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </div>
                Tamamlanan Paketler
              </h4>
              <div className="space-y-2">
                {member.completed_packages && member.completed_packages.length > 0 ? (
                  member.completed_packages.map((completedPackage) => {
                    const service = services[completedPackage.package_id];
                    return (
                      <div
                        key={`${completedPackage.package_id}-${completedPackage.completion_count}`}
                        className="flex items-center justify-between gap-4 bg-muted/30 p-2.5 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{service?.name || "Yükleniyor..."}</div>
                          <div className="text-sm text-muted-foreground mt-0.5">
                            {(service?.price || 0) * completedPackage.completion_count} ₺
                          </div>
                        </div>
                        <Badge variant="secondary" className="px-2.5">
                          {completedPackage.completion_count} kez tamamlandı
                        </Badge>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    Henüz tamamlanan paket bulunmuyor
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPackagesDialog(false)}>
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
