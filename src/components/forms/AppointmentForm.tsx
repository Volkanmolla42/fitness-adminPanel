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

import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/supabase";
import React,{ useEffect, useState, useRef } from "react";
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
  defaultDate?: string;
  defaultTime?: string;
  defaultTrainerId?: string;
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
}: AppointmentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSessionsDialog, setShowSessionsDialog] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [hasConflict, setHasConflict] = useState(false);
  const [searchMembers, setSearchMembers] = useState("");
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowMemberDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const form = useForm<AppointmentInput>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      member_id: appointment?.member_id || "",
      trainer_id: appointment?.trainer_id || defaultTrainerId || "",
      service_id: appointment?.service_id || "",
      notes: appointment?.notes || "",
      status: appointment?.status || "scheduled",
      date: appointment?.date || defaultDate || "",
      time: appointment?.time || defaultTime || "",
    },
  });

  const handleServiceChange = (serviceId: string) => {
    const service = services.find((s) => s.id === serviceId);
    setSelectedService(service || null);
    form.setValue("service_id", serviceId);

    if (!appointment) {
      setSessions([{ 
        date: defaultDate || "", 
        time: defaultTime || "", 
        hasConflict: false 
      }]);
      setShowSessionsDialog(true);
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
    const [hours] = time.split(':').map(Number);
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

    return appointments.some(apt => {
      if (apt.id === appointment?.id) return false;

      const isSameDateTime = apt.date === date && 
                           apt.time === time &&
                           apt.trainer_id === form.watch("trainer_id") &&
                           apt.status === "scheduled";
                           
      return isSameDateTime;
    });
  };

  useEffect(() => {
    const date = form.watch("date");
    const time = form.watch("time");
    
    if (date && time) {
      const conflict = checkConflict(date, time);
      setHasConflict(conflict);

      if (!checkBusinessHours(time)) {
        form.setError("time", {
          type: "manual",
          message: "Randevular 10:00 - 20:00 saatleri arasında olmalıdır"
        });
      } else {
        form.clearErrors("time");
      }

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

  useEffect(() => {
    if (appointment) {
      setSessions([{ 
        date: appointment.date, 
        time: appointment.time,
        hasConflict: false
      }]);
      setSelectedService(services.find(s => s.id === appointment.service_id) || null);
    }
  }, [appointment, services]);

  useEffect(() => {
    if (appointment?.member_id) {
      const member = members.find(m => m.id === appointment.member_id);
      if (member) {
        setSearchMembers(`${member.first_name} ${member.last_name}`);
      }
    }
  }, [appointment, members]);

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
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 max-w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="member_id"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Üye</FormLabel>
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
                    <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none">
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
                          .map((member) => (
                            <div
                              key={member.id}
                              onClick={() => {
                                form.setValue("member_id", member.id);
                                setSearchMembers(`${member.first_name} ${member.last_name}`);
                                setShowMemberDropdown(false);
                              }}
                              className={cn(
                                "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                                member.id === field.value && "bg-accent text-accent-foreground"
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <CheckIcon className={cn(
                                  "h-4 w-4",
                                  member.id === field.value ? "opacity-100" : "opacity-0"
                                )} />
                                <span>{member.first_name} {member.last_name}</span>
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
                <FormLabel>Eğitmen</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
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
                <FormDescription className="mt-1 text-sm text-muted-foreground">
                  Eğitmenin müsait saatlerini kontrol edin
                </FormDescription>
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
                    disabled={!form.watch("member_id") || !form.watch("trainer_id")}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            !form.watch("member_id") || !form.watch("trainer_id")
                              ? "Önce üye ve eğitmen seçin"
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
                {selectedService && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0 h-10"
                    onClick={() => setShowSessionsDialog(true)}
                  >
                    {sessions.length > 0 && sessions[0].date && sessions[0].time
                      ? "Düzenle"
                      : "Tarih Seç"}
                  </Button>
                )}
              </div>
              {selectedService && (
                <div className="mt-2 space-y-1">
                  <div className="text-sm font-medium text-muted-foreground truncate">
                    {selectedService.session_count > 1
                      ? `${selectedService.session_count} Seanslık Paket`
                      : "Tek Seanslık Paket"}
                  </div>
                  {sessions.length > 0 && sessions[0].date && sessions[0].time && (
                    <div className="text-sm text-muted-foreground break-words">
                      {appointment ? "Randevu" : "İlk seans"}: {format(new Date(`${sessions[0].date}T${sessions[0].time}`), "d MMMM, EEEE HH:mm", { locale: tr })}
                    </div>
                  )}
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
                    <SelectTrigger className="w-full">
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
              <FormLabel>Notlar</FormLabel>
              <FormControl>
                <Textarea {...field} className="min-h-min" />
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
        defaultDate={defaultDate}
        defaultTime={defaultTime}
        memberId={form.watch("member_id")}
      />
    </Form>
  );
}
