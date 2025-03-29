import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  User,
  Mail,
  Phone,
  Timer,
  UserCog,
  Package,
  Activity,
  History,
  Loader2,
  MessageCircle,
} from "lucide-react";
import { getStatusText } from "./AppointmentCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface AppointmentDetailsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: {
    id: string;
    date: string;
    time: string;
    status: string;
    notes?: string;
  };
  member: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    membership_type?: string;
    phone_number?: string;
    email?: string;
  };
  trainer: {
    firstName: string;
    lastName: string;
  };
  service: {
    name: string;
    duration: number;
  };
}
const AppointmentDetailsModal = ({
  isOpen,
  onOpenChange,
  appointment,
  member,
  trainer,
  service,
}: AppointmentDetailsModalProps) => {
  const [showHistory, setShowHistory] = useState(false);
  const [appointmentHistory, setAppointmentHistory] = useState<
    Array<{
      id: string;
      date: string;
      time: string;
      status: string;
      service: { name: string; duration: number };
      trainer: { firstName: string; lastName: string };
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const fetchAppointmentHistory = async () => {
    try {
      setIsLoading(true);

      if (!member?.id) {
        console.error("Üye ID'si bulunamadı");
        return;
      }

      // 1. Önce temel randevu verilerini çek
      const { data: appointments, error: appointmentsError } = await supabase
        .from("appointments")
        .select("*")
        .eq("member_id", member.id)
        .order("date", { ascending: false })
        .order("time", { ascending: false });

      if (appointmentsError) {
        console.error(
          "Randevu verileri çekilirken hata oluştu:",
          appointmentsError
        );
        return;
      }

      if (!appointments || appointments.length === 0) {
        console.error("Randevu bulunamadı");
        setAppointmentHistory([]);
        return;
      }

      // 2. Her randevu için detaylı bilgileri çek
      const detailedAppointments = await Promise.all(
        appointments.map(async (apt) => {
          // 2.1 Hizmet bilgilerini çek
          const { data: serviceData } = await supabase
            .from("services")
            .select("name, duration")
            .eq("id", apt.service_id)
            .single();

          // 2.2 Antrenör bilgilerini çek
          const { data: trainerData } = await supabase
            .from("trainers")
            .select("first_name, last_name")
            .eq("id", apt.trainer_id)
            .single();

          // 2.3 Tüm bilgileri birleştir
          return {
            id: apt.id,
            date: apt.date,
            time: apt.time,
            status: apt.status,
            service: {
              name: serviceData?.name ?? "Bilinmeyen Hizmet",
              duration: serviceData?.duration ?? 0,
            },
            trainer: {
              firstName: trainerData?.first_name ?? "Bilinmeyen",
              lastName: trainerData?.last_name ?? "Antrenör",
            },
          };
        })
      );

      setAppointmentHistory(detailedAppointments);
    } catch (error) {
      console.error("Beklenmeyen bir hata oluştu:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // WhatsApp mesajı gönder
  const sendWhatsAppMessage = () => {
    try {
      setIsSendingMessage(true);

      // Telefon numarası kontrolü
      if (!member.phone_number) {
        toast.error("Üyenin telefon numarası bulunamadı.");
        return;
      }

      // Telefon numarasını formatla (başında + olmadan ve boşluklar olmadan)
      const phoneNumber = member.phone_number.replace(/\s+/g, "");

      // Tarih ve saat bilgisini formatla
      const appointmentDate = format(
        new Date(appointment.date),
        "d MMMM yyyy",
        { locale: tr }
      );
      const appointmentTime = appointment.time.slice(0, 5);

      // Mesaj içeriğini hazırla
      const message =
        `Merhaba ${member.firstName} hanım, ${appointmentDate} tarihinde saat ${appointmentTime}'de ${service.name} randevunuz bulunmaktadır. ` +
        `Antrenörünüz ${trainer.firstName} ${trainer.lastName} olacaktır. ` +
        `Randevu süresi ${service.duration} dakikadır. ` +
        `Hatırlatma için teşekkür ederiz.`;

      // WhatsApp linkini oluştur
      const whatsappUrl = `https://wa.me/90${phoneNumber}?text=${encodeURIComponent(
        message
      )}`;

      // Yeni sekmede aç
      window.open(whatsappUrl, "_blank");

      toast.success("WhatsApp mesajı hazırlandı.");
    } catch (error) {
      console.error("WhatsApp mesajı gönderilirken hata oluştu:", error);
      toast.error("Mesaj hazırlanırken bir hata oluştu.");
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Modal açıldığında randevu geçmişini çek
  useEffect(() => {
    if (showHistory) {
      fetchAppointmentHistory();
    }
  }, [showHistory]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogTitle className="flex items-center justify-between pb-4 border-b">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="font-semibold">Randevu Detayları</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setShowHistory(true)}
              >
                <History className="h-4 w-4" />
                Randevu Geçmişi
              </Button>
            </div>
          </DialogTitle>

          <div className="grid gap-6 py-4">
            {/* Üye Bilgileri Bölümü */}
            <div className="space-y-4">
              <h3 className="font-medium text-xs sm:text-sm text-muted-foreground tracking-wide">
                ÜYE BİLGİLERİ
              </h3>
              <div className="flex items-start gap-4">
                {member.avatar ? (
                  <img
                    src={member.avatar}
                    alt={`${member.firstName} ${member.lastName}`}
                    className="h-16 w-16 rounded-full object-cover ring-2 ring-primary/10 hover:ring-primary/30 transition-all"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center ring-2 ring-primary/10">
                    <User className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="space-y-2 flex-1">
                  <h3 className="flex flex-wrap gap-2 items-center font-medium text-base sm:text-lg">
                    {member.firstName} {member.lastName}
                    {member.membership_type && (
                      <Badge
                        className={`text-xs ${
                          member.membership_type === "vip"
                            ? "bg-yellow-500/90 hover:bg-yellow-500"
                            : "bg-gray-400/90 hover:bg-gray-400"
                        } transition-colors cursor-default`}
                      >
                        {member.membership_type === "vip" ? "VIP" : "Standart"}
                      </Badge>
                    )}
                  </h3>
                  <div className="space-y-1.5">
                    {member.email && (
                      <a
                        href={`mailto:${member.email}`}
                        className="text-sm text-muted-foreground hover:text-primary flex items-center gap-2 transition-colors group"
                      >
                        <Mail className="h-4 w-4 group-hover:text-primary transition-colors" />
                        {member.email}
                      </a>
                    )}
                    {member.phone_number && (
                      <div className="flex items-center gap-2">
                        <a
                          href={`tel:${member.phone_number}`}
                          className="text-sm text-muted-foreground hover:text-primary flex items-center gap-2 transition-colors group"
                        >
                          <Phone className="h-4 w-4 group-hover:text-primary transition-colors" />
                          {member.phone_number}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Randevu Detayları Bölümü */}
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-medium text-xs sm:text-sm text-muted-foreground tracking-wide">
                  RANDEVU DETAYLARI
                </h3>
                {member.phone_number && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 py-0 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={sendWhatsAppMessage}
                    disabled={isSendingMessage}
                  >
                    <MessageCircle className="h-3.5 w-3.5 mr-1" />
                    {"WhatsApp'tan Bildir"}
                  </Button>
                )}
              </div>

              <div className="grid gap-3 bg-muted/50 p-4 rounded-lg hover:bg-muted/60 transition-colors">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm">
                      {format(new Date(appointment.date), "d MMMM yyyy", {
                        locale: tr,
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm">
                      {appointment.time.slice(0, 5)}
                    </span>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <UserCog className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm">
                      <span className="text-muted-foreground">Antrenör:</span>{" "}
                      <span className="font-medium">
                        {trainer.firstName} {trainer.lastName}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm">
                      <span className="text-muted-foreground">Hizmet:</span>{" "}
                      <span className="font-medium">{service.name}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Activity className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm">
                    <span className="text-muted-foreground">Durum:</span>{" "}
                    <span>{getStatusText(appointment.status)}</span>
                  </span>
                </div>
              </div>
            </div>
            {/* Notlar Bölümü */}
            {appointment.notes && (
              <div className="space-y-4">
                <h3 className="font-medium text-xs sm:text-sm text-muted-foreground tracking-wide">
                  NOTLAR
                </h3>
                <div className="bg-muted/50 p-4 rounded-lg hover:bg-muted/60 transition-colors">
                  <p className="text-sm leading-relaxed">{appointment.notes}</p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogTitle className="flex items-center justify-between pb-4 border-b">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                <span className="font-semibold">
                  {member.firstName} {member.lastName}
                </span>
                <span className="text-sm text-muted-foreground">
                  Randevu Geçmişi
                </span>
              </div>
              {isLoading && (
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Yükleniyor...
                </div>
              )}
            </div>
          </DialogTitle>

          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {appointmentHistory.length === 0 && !isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Henüz randevu geçmişi bulunmuyor.</p>
                </div>
              ) : (
                appointmentHistory.map((historyItem) => (
                  <div
                    key={historyItem.id}
                    className="bg-card rounded-lg border p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Üst Kısım - Tarih ve Durum */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-primary shrink-0" />
                            <span className="font-medium">
                              {format(
                                new Date(historyItem.date),
                                "d MMMM yyyy",
                                {
                                  locale: tr,
                                }
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <Timer className="h-3.5 w-3.5" />
                            <span>{historyItem.time.slice(0, 5)}</span>
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`
                          ${
                            historyItem.status === "completed"
                              ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                              : historyItem.status === "cancelled"
                              ? "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100"
                              : "bg-sky-50 text-sky-600 border-sky-200 hover:bg-sky-100"
                          }
                          transition-colors font-medium
                        `}
                      >
                        {getStatusText(historyItem.status)}
                      </Badge>
                    </div>

                    {/* Alt Kısım - Hizmet ve Antrenör Bilgileri */}
                    <div className="grid gap-2 text-sm">
                      <div className="flex items-center gap-2 bg-muted/50 p-2 rounded">
                        <Package className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-muted-foreground">Hizmet:</span>
                        <span className="font-medium">
                          {historyItem.service.name}
                        </span>
                        <span className="text-muted-foreground ml-auto">
                          {historyItem.service.duration} dk
                        </span>
                      </div>

                      <div className="flex items-center gap-2 bg-muted/50 p-2 rounded">
                        <UserCog className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-muted-foreground">Antrenör:</span>
                        <span className="font-medium">
                          {historyItem.trainer.firstName}{" "}
                          {historyItem.trainer.lastName}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AppointmentDetailsModal;
