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
import type { Database } from "@/types/supabase";
import { useEffect, useState } from "react";

type Member = Database["public"]["Tables"]["members"]["Row"];
type Trainer = Database["public"]["Tables"]["trainers"]["Row"];
type Service = Database["public"]["Tables"]["services"]["Row"];
type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
type AppointmentInput = Omit<Appointment, "id" | "created_at" | "status">;

interface AppointmentFormProps {
  appointment?: Appointment;
  members: Member[];
  trainers: Trainer[];
  services: Service[];
  onSubmit: (data: AppointmentInput) => void;
  onCancel: () => void;
}

export function AppointmentForm({
  appointment,
  members,
  trainers,
  services,
  onSubmit,
  onCancel,
}: AppointmentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AppointmentInput>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      member_id: appointment?.member_id || "",
      trainer_id: appointment?.trainer_id || "",
      service_id: appointment?.service_id || "",
      date: appointment?.date || new Date().toISOString().split("T")[0],
      time: appointment?.time || "",
      notes: appointment?.notes || "",
    },
  });

  // Get the selected member's subscribed services
  const selectedMember = members.find((member) => member.id === form.watch("member_id"));
  const availableServices = services.filter((service) =>
    selectedMember?.subscribed_services?.includes(service.id)
  );

  // Reset service selection when member changes
  useEffect(() => {
    if (form.watch("member_id") && form.watch("service_id")) {
      const isServiceAvailable = selectedMember?.subscribed_services?.includes(
        form.watch("service_id")
      );
      if (!isServiceAvailable) {
        form.setValue("service_id", "");
      }
    }
  }, [form.watch("member_id")]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (data) => {
          setIsSubmitting(true);
          try {
            await onSubmit(data);
          } finally {
            setIsSubmitting(false);
          }
        })}
        className="space-y-4"
      >
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
              <FormLabel>Hizmet</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={!form.watch("member_id")}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={form.watch("member_id") ? "Hizmet seçin" : "Önce üye seçin"}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableServices.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} 
                      {service.isVipOnly ? " (VIP)" : " (Standart)"} - 
                      {service.session_count} Seans
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tarih</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Saat</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notlar</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Randevu ile ilgili notlar..."
                  className="resize-none"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            İptal
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "İşleniyor..." : appointment ? "Güncelle" : "Ekle"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
