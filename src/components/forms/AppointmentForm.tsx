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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Hizmet seçin" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
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
          <Button type="button" variant="outline" onClick={onCancel}>
            İptal
          </Button>
          <Button type="submit">{appointment ? "Güncelle" : "Ekle"}</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
