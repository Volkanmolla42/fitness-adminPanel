import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { appointmentFormSchema } from "@/lib/validations";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { XCircle } from "lucide-react";
import { CalendarDays } from "lucide-react";
import type { Database } from "@/types/supabase";
import { useEffect, useState } from "react";
import { SessionsDialog } from "./SessionsDialog";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Session } from "@/types/sessions";

type Member = Database["public"]["Tables"]["members"]["Row"];
type Trainer = Database["public"]["Tables"]["trainers"]["Row"];
type Service = Database["public"]["Tables"]["services"]["Row"];
type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
type AppointmentInput = Omit<Appointment, "id" | "created_at">;

interface AppointmentFormProps {
  appointment?: Appointment;
  members: Member[];
  trainers: Trainer[];
  services: Service[];
  appointments: Appointment[];
  onSubmit: (data: AppointmentInput) => Promise<void>;
  onCancel: () => void;
}

export function AppointmentForm({
  appointment,
  members,
  trainers,
  services,
  appointments,
  onSubmit,
  onCancel,
}: AppointmentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSessionsDialog, setShowSessionsDialog] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [hasConflict, setHasConflict] = useState(false);

  const form = useForm<AppointmentInput>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      member_id: appointment?.member_id || "",
      trainer_id: appointment?.trainer_id || "",
      service_id: appointment?.service_id || "",
      notes: appointment?.notes || "",
      status: appointment?.status || "scheduled",
      date: appointment?.date || "",
      time: appointment?.time || "",
    },
  });

  const handleServiceChange = (serviceId: string) => {
    const service = services.find((s) => s.id === serviceId);
    setSelectedService(service || null);
    form.setValue("service_id", serviceId);

    // Yeni randevu eklerken seans dialogunu göster
    if (!appointment) {
      setSessions([{ date: "", time: "", hasConflict: false }]);
      setShowSessionsDialog(true);
    }
  };

  const handleSessionsConfirm = () => {
    if (sessions.length > 0 && sessions.every((s) => s.date && s.time)) {
      // Set the first session's date and time to the main form
      form.setValue("date", sessions[0].date);
      form.setValue("time", sessions[0].time);
      setShowSessionsDialog(false);
    }
  };

  // Çakışma kontrolü yapan fonksiyon
  const checkConflict = (date: string, time: string): boolean => {
    if (!form.watch("trainer_id")) return false;

    // Pazar günü kontrolü
    const selectedDate = new Date(date);
    if (selectedDate.getDay() === 0) {
      return true; // Pazar günü seçilemez
    }

    // Seçilen tarih ve saatte başka randevu var mı kontrol et
    return appointments.some(apt => {
      // Eğer bu bir düzenleme ise ve aynı randevuysa çakışma yok
      if (apt.id === appointment?.id) return false;

      const isSameDateTime = apt.date === date && 
                           apt.time === time &&
                           apt.trainer_id === form.watch("trainer_id") &&
                           apt.status === "scheduled";
                           
      // Aynı eğitmenin aynı tarih ve saatte başka randevusu varsa çakışma var
      return isSameDateTime;
    });
  };

  // Tarih veya saat değiştiğinde çakışma kontrolü yap
  useEffect(() => {
    const date = form.watch("date");
    const time = form.watch("time");
    
    if (date && time) {
      const conflict = checkConflict(date, time);
      setHasConflict(conflict);

      // Eğer pazar günü seçildiyse uyarı göster
      const selectedDate = new Date(date);
      if (selectedDate.getDay() === 0) {
        form.setError("date", {
          type: "manual",
          message: "Pazar günleri randevu alınamaz"
        });
      } else {
        form.clearErrors("date");
      }
    } else {
      setHasConflict(false);
    }
  }, [form.watch("date"), form.watch("time"), form.watch("trainer_id")]);

  // Mevcut randevunun tarih ve saatini sessions'a ekle
  useEffect(() => {
    if (appointment) {
      setSessions([{ 
        date: appointment.date, 
        time: appointment.time,
        hasConflict: false
      }]);
    }
  }, [appointment]);

  // Get the selected member's subscribed services
  const selectedMember = members.find(
    (member) => member.id === form.watch("member_id"),
  );
  const availableServices = services.filter((service) =>
    selectedMember?.subscribed_services?.includes(service.id),
  );

  const handleSubmit = async (data: AppointmentInput) => {
    setIsSubmitting(true);
    try {
      if (sessions.length > 1) {
        // Submit multiple appointments
        for (const session of sessions) {
          await onSubmit({ ...data, date: session.date, time: session.time });
        }
      } else {
        // Submit single appointment
        await onSubmit(data);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset service selection when member changes
  useEffect(() => {
    if (form.watch("member_id") && form.watch("service_id")) {
      const isServiceAvailable = selectedMember?.subscribed_services?.includes(
        form.watch("service_id"),
      );
      if (!isServiceAvailable) {
        form.setValue("service_id", "");
      }
    }
  }, [form.watch("member_id")]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="member_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Üye</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Üye seçin" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {`${member.first_name} ${member.last_name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="trainer_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Eğitmen</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Eğitmen seçin" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {trainers.map((trainer) => (
                    <SelectItem key={trainer.id} value={trainer.id}>
                      {`${trainer.first_name} ${trainer.last_name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="service_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Paket</FormLabel>
              <Select
                onValueChange={handleServiceChange}
                value={field.value}
                disabled={!form.watch("member_id")}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        form.watch("member_id")
                          ? "Paket seçin"
                          : "Önce üye seçin"
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableServices.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                      {service.isVipOnly ? " (VIP)" : " (Standart)"} -{" "}
                      {service.session_count > 1
                        ? `${service.session_count} Seans`
                        : "Tek Seans"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedService && (
          <div className="flex items-center justify-between gap-4 p-4 border rounded-lg bg-muted/30">
            <div className="space-y-1">
              <div className="text-sm font-medium">
                {selectedService.session_count > 1
                  ? `${selectedService.session_count} Seanslık Paket`
                  : "Tek Seanslık Paket"}
              </div>
              {sessions.length > 0 && sessions[0].date && sessions[0].time ? (
                <div className="text-sm text-muted-foreground">
                  {appointment ? "Randevu" : "İlk seans"}: {format(new Date(`${sessions[0].date}T${sessions[0].time}`), "d MMMM, EEEE HH:mm", { locale: tr })}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Henüz seans tarihi seçilmedi
                </div>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowSessionsDialog(true)}
            >
              {sessions.length > 0 && sessions[0].date && sessions[0].time
                ? "Randevu Tarihini Düzenle"
                : "Randevu Tarihi Seç"}
            </Button>
          </div>
        )}

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notlar</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {appointment && (
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Durum</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Durum seçin" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="scheduled">Planlandı</SelectItem>
                    <SelectItem value="completed">Tamamlandı</SelectItem>
                    <SelectItem value="cancelled">İptal Edildi</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setShowSessionsDialog(true)}
            disabled={!appointment && !form.watch("service_id")}
          >
            <CalendarDays className="w-4 h-4 mr-2" />
            {sessions[0]?.date && sessions[0]?.time 
              ? `${format(new Date(sessions[0].date), "d MMMM yyyy", { locale: tr })} - ${sessions[0].time.substring(0, 5)}`
              : "Tarih ve Saat Seç"}
          </Button>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            İptal
          </Button>
          <Button type="submit" disabled={isSubmitting || !sessions[0]?.date || !sessions[0]?.time}>
            {isSubmitting ? "İşleniyor..." : appointment ? "Güncelle" : "Ekle"}
          </Button>
        </DialogFooter>
      </form>

      <SessionsDialog
        open={showSessionsDialog}
        onOpenChange={setShowSessionsDialog}
        sessionCount={selectedService?.session_count || 1}
        sessions={sessions}
        onSessionsChange={setSessions}
        onConfirm={handleSessionsConfirm}
        appointments={appointments}
        selectedTrainerId={form.watch("trainer_id")}
        appointment={appointment}
        selectedService={selectedService}
      />
    </Form>
  );
}
