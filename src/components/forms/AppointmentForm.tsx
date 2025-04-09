import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { appointmentFormSchema } from "@/lib/validations";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/supabase";
import React, { useEffect, useState, useRef } from "react";
import { SessionsDialog } from "./SessionsDialog";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Session } from "@/types/sessions";
import { WORKING_HOURS } from "@/constants/timeSlots";
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
  defaultDate?: string;
  defaultTime?: string;
  defaultTrainerId?: string;
  defaultMemberId?: string;
  defaultServiceId?: string;
}

export function AppointmentForm({
  appointment,
  members,
  trainers,
  services,
  appointments,
  onSubmit,
  onCancel,
  defaultDate,
  defaultTime,
  defaultTrainerId,
  defaultMemberId,
  defaultServiceId,
}: AppointmentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSessionsDialog, setShowSessionsDialog] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [searchMembers, setSearchMembers] = useState("");
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [showPassiveWarning, setShowPassiveWarning] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowMemberDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const form = useForm<AppointmentInput>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      member_id: appointment?.member_id || defaultMemberId || "",
      trainer_id: appointment?.trainer_id || defaultTrainerId || "",
      service_id: appointment?.service_id || defaultServiceId || "",
      notes: appointment?.notes || "",
      status: appointment?.status || "scheduled",
      date: appointment?.date || defaultDate || "",
      time: appointment?.time || defaultTime || "",
    },
  });

  const [watchedFields] = useWatch({
    control: form.control,
    name: ["date", "time", "trainer_id"],
  });

  const handleServiceChange = (serviceId: string) => {
    const service = services.find((s) => s.id === serviceId);
    setSelectedService(service || null);
    form.setValue("service_id", serviceId);

    // Paket seçimi değiştiğinde seans bilgilerini sıfırla
    if (!serviceId) {
      setSessions([]);
      return;
    }

    if (!appointment) {
      setSessions([
        {
          date: defaultDate || "",
          time: defaultTime || "",
          hasConflict: false,
        },
      ]);
    }
  };

  const handleSessionsConfirm = () => {
    if (sessions.length > 0 && sessions.every((s) => s.date && s.time)) {
      form.setValue("date", sessions[0].date);
      form.setValue("time", sessions[0].time);
      setShowSessionsDialog(false);
    }
  };

  const checkBusinessHours = (time: string): boolean => {
    const [hours] = time.split(":").map(Number);
    return hours >= 10 && hours < 20;
  };

  const checkConflict = (date: string, time: string): boolean => {
    if (!form.watch("trainer_id")) return false;

    if (!checkBusinessHours(time)) {
      return true;
    }

    const selectedDate = new Date(date);
    if (selectedDate.getDay() === 0) {
      return true;
    }

    return appointments.some((apt) => {
      if (apt.id === appointment?.id) return false;

      const isSameDateTime =
        apt.date === date &&
        apt.time === time &&
        apt.trainer_id === form.watch("trainer_id") &&
        apt.status === "scheduled";

      return isSameDateTime;
    });
  };

  useEffect(() => {
    if (watchedFields[0] && watchedFields[1]) {
      const hasConflict = checkConflict(watchedFields[0], watchedFields[1]);

      if (hasConflict) {
        form.setError("time", {
          type: "manual",
          message:
            "Seçilen tarih ve saatte bir çakışma var. Lütfen başka bir zaman seçin.",
        });
      } else {
        form.clearErrors("time");
      }

      if (!checkBusinessHours(watchedFields[1])) {
        form.setError("time", {
          type: "manual",
          message: `Randevular ${WORKING_HOURS.start} - ${WORKING_HOURS.end} saatleri arasında olmalıdır`,
        });
      } else if (!hasConflict) {
        form.clearErrors("time");
      }

      const selectedDate = new Date(watchedFields[0]);
      if (selectedDate.getDay() === 0) {
        form.setError("date", {
          type: "manual",
          message: "Pazar günleri randevu alınamaz",
        });
      } else {
        form.clearErrors("date");
      }
    }
  }, [watchedFields]);

  useEffect(() => {
    if (appointment) {
      setSessions([
        {
          date: appointment.date,
          time: appointment.time,
          hasConflict: false,
        },
      ]);
      setSelectedService(
        services.find((s) => s.id === appointment.service_id) || null
      );
    }
  }, [appointment, services]);

  // Varsayılan servis ID'sini saklamak için bir state
  const [pendingServiceId, setPendingServiceId] = useState<string | null>(null);

  useEffect(() => {
    // Randevu düzenleniyorsa veya varsayılan üye ID'si varsa üye adını doldur
    if (appointment?.member_id || defaultMemberId) {
      const memberId = appointment?.member_id || defaultMemberId;
      const member = members.find((m) => m.id === memberId);
      if (member) {
        setSearchMembers(`${member.first_name} ${member.last_name}`);
      }
    }

    // Varsayılan servis ID'si varsa ve üye seçiliyse, bunu bekleyen servis olarak kaydet
    if (defaultServiceId && form.watch("member_id") && !pendingServiceId) {
      setPendingServiceId(defaultServiceId);
    }
  }, [
    appointment,
    members,
    defaultMemberId,
    defaultServiceId,
    form.watch("member_id"),
    pendingServiceId,
    services,
  ]);

  // Antrenör seçildiğinde ve bekleyen servis varsa, servisi otomatik seç
  useEffect(() => {
    if (
      pendingServiceId &&
      form.watch("trainer_id") &&
      form.watch("member_id")
    ) {
      const service = services.find((s) => s.id === pendingServiceId);
      if (service) {
        handleServiceChange(pendingServiceId);
        // Servisi seçtikten sonra bekleyen servisi temizle
        setPendingServiceId(null);
      }
    }
  }, [
    pendingServiceId,
    form.watch("trainer_id"),
    form.watch("member_id"),
    services,
  ]);

  const selectedMember = members.find(
    (member) => member.id === form.watch("member_id")
  );
  const availableServices = services.filter((service) =>
    selectedMember?.subscribed_services?.includes(service.id)
  );

  const handleSubmit = async (data: AppointmentInput) => {
    setIsSubmitting(true);
    try {
      if (sessions.length > 1) {
        for (const session of sessions) {
          await onSubmit({ ...data, date: session.date, time: session.time });
        }
      } else {
        await onSubmit(data);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Üye değiştiğinde kontroller
  useEffect(() => {
    // Üye değiştiğinde paket ve seans bilgilerini sıfırla
    if (!appointment) {
      setSelectedService(null);
      setSessions([]);
      form.setValue("service_id", "");
    }

    // Seçilen üyenin aboneliklerini kontrol et
    if (form.watch("member_id") && form.watch("service_id")) {
      const isServiceAvailable = selectedMember?.subscribed_services?.includes(
        form.watch("service_id")
      );
      if (!isServiceAvailable) {
        form.setValue("service_id", "");
        setSelectedService(null);
        setSessions([]);
      }
    }
  }, [form.watch("member_id"), appointment]);

  // Paket seçimi değiştiğinde veya kaldırıldığında seans bilgilerini kontrol et
  useEffect(() => {
    if (!selectedService && sessions.length > 0) {
      setSessions([]);
    }
  }, [selectedService]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-4 max-w-full"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="member_id"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Üye</FormLabel>
                {showPassiveWarning && (
                  <Alert className="mb-2 py-2 bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-900/30">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Pasif üyeler için randevu oluşturulamaz
                    </AlertDescription>
                  </Alert>
                )}
                <div className="relative" ref={dropdownRef}>
                  <div className="relative">
                    <Input
                      placeholder="Üye ara veya seç..."
                      value={searchMembers}
                      onChange={(e) => setSearchMembers(e.target.value)}
                      onFocus={() => setShowMemberDropdown(true)}
                      className="w-full"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowMemberDropdown(!showMemberDropdown)}
                    >
                      <CaretSortIcon className="h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </div>

                  {showMemberDropdown && (
                    <div className="absolute z-50 mt-1 w-[110%] rounded-md border bg-popover text-popover-foreground shadow-md outline-none">
                      <div className="max-h-[200px] overflow-y-auto py-1">
                        {members.length === 0 && (
                          <div className="relative flex select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none text-muted-foreground">
                            Üye bulunamadı
                          </div>
                        )}
                        {members
                          .filter((member) =>
                            `${member.first_name} ${member.last_name}`
                              .toLowerCase()
                              .includes(searchMembers.toLowerCase())
                          )
                          // Aktif üyeleri önce, pasif üyeleri sonra göster
                          .sort((a, b) => {
                            // Önce aktif/pasif durumuna göre sırala
                            if (a.active && !b.active) return -1;
                            if (!a.active && b.active) return 1;
                            // Aynı durumdaki üyeleri isme göre sırala
                            return `${a.first_name} ${a.last_name}`.localeCompare(
                              `${b.first_name} ${b.last_name}`
                            );
                          })
                          .map((member) => (
                            <div
                              key={member.id}
                              onClick={() => {
                                // Pasif üyeler seçilemez
                                if (!member.active) {
                                  // Pasif üye seçilmeye çalışıldığında uyarı göster
                                  setShowPassiveWarning(true);
                                  // 3 saniye sonra uyarıyı kapat
                                  setTimeout(
                                    () => setShowPassiveWarning(false),
                                    3000
                                  );
                                  // Form hata mesajı göster
                                  form.setError("member_id", {
                                    type: "manual",
                                    message:
                                      "Pasif üyeler için randevu oluşturulamaz",
                                  });
                                  return;
                                }

                                // Hata mesajını temizle
                                form.clearErrors("member_id");

                                // Üye değiştiğinde paket ve seans bilgilerini sıfırla
                                if (form.watch("member_id") !== member.id) {
                                  setSelectedService(null);
                                  setSessions([]);
                                  form.setValue("service_id", "");
                                }

                                form.setValue("member_id", member.id);
                                setSearchMembers(
                                  `${member.first_name} ${member.last_name}`
                                );
                                setShowMemberDropdown(false);
                              }}
                              className={cn(
                                "relative flex select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
                                // Pasif üyeler için cursor-not-allowed ve soluk görünüm
                                member.active
                                  ? "cursor-pointer hover:bg-accent hover:text-accent-foreground"
                                  : "cursor-not-allowed opacity-60",
                                member.id === field.value &&
                                  "bg-accent text-accent-foreground"
                              )}
                            >
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                  <CheckIcon
                                    className={cn(
                                      "h-4 w-4",
                                      member.id === field.value
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  <span>
                                    {member.first_name} {member.last_name}
                                  </span>
                                </div>

                                {/* Pasif üyeler için etiket */}
                                {!member.active && (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                    Pasif
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="trainer_id"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Antrenör</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Antrenör seçin" />
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
        </div>

        <FormField
          control={form.control}
          name="service_id"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Paket</FormLabel>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <Select
                    onValueChange={handleServiceChange}
                    value={field.value}
                    disabled={
                      !form.watch("member_id") || !form.watch("trainer_id")
                    }
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            !form.watch("member_id") ||
                            !form.watch("trainer_id")
                              ? "Önce üye ve antrenör seçin"
                              : "Paket seçin"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableServices.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          <span className="truncate">{service.name}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedService &&
                sessions.length > 0 &&
                form.watch("service_id") && (
                  <div className="flex items-center justify-evenly outline outline-2  outline-green-400 p-2">
                    {sessions[0].date && sessions[0].time && (
                      <div className="text-sm text-muted-foreground break-words">
                        {appointment ? "Randevu" : "İlk seans"}:{" "}
                        {format(
                          new Date(`${sessions[0].date}T${sessions[0].time}`),
                          "d MMMM, EEEE HH:mm",
                          { locale: tr }
                        )}
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      className="shrink-0 h-10"
                      onClick={() => setShowSessionsDialog(true)}
                    >
                      {sessions[0].date && sessions[0].time
                        ? "Düzenle"
                        : "Tarih Seç"}
                    </Button>
                  </div>
                )}
            </FormItem>
          )}
        />

        {appointment && (
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Durum</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full border-gray-600">
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
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormControl>
                <Textarea
                  {...field}
                  className="min-h-min border-gray-600"
                  placeholder="Notlar.."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            İptal
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !sessions[0]?.date || !sessions[0]?.time}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? "İşleniyor..." : appointment ? "Güncelle" : "Ekle"}
          </Button>
        </DialogFooter>
      </form>

      <SessionsDialog
        open={showSessionsDialog}
        onOpenChange={setShowSessionsDialog}
        sessionCount={selectedService?.session_count || 0}
        sessions={sessions}
        onSessionsChange={setSessions}
        onConfirm={handleSessionsConfirm}
        appointments={appointments}
        selectedTrainerId={form.watch("trainer_id")}
        appointment={appointment}
        selectedService={selectedService}
        services={services}
        memberId={form.watch("member_id")}
        member={selectedMember}
      />
    </Form>
  );
}
