import * as z from "zod";

// Common validation patterns
const phoneRegex =
  /^(\+90|0)?\s*([0-9]{3})\s*([0-9]{3})\s*([0-9]{2})\s*([0-9]{2})$/;
const nameRegex = /^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]{2,}$/;

// Common validation messages
export const validationMessages = {
  required: "Bu alan zorunludur",
 
  phone: "Geçerli bir telefon numarası giriniz (örn: 555 123 45 67)",
  name: "Geçerli bir isim giriniz (en az 2 karakter)",
  minLength: (field: string, length: number) =>
    `${field} en az ${length} karakter olmalıdır`,
  maxLength: (field: string, length: number) =>
    `${field} en fazla ${length} karakter olmalıdır`,
  date: "Geçerli bir tarih giriniz",
  price: "Geçerli bir fiyat giriniz",
  duration: "Geçerli bir süre giriniz",
};

// Member validation schema
export const memberSchema = z.object({
  first_name: z
    .string()
    .min(2, validationMessages.minLength("Ad", 2))
    .regex(nameRegex, "Geçerli bir ad giriniz"),
  last_name: z
    .string()
    .min(2, validationMessages.minLength("Soyad", 2))
    .regex(nameRegex, "Geçerli bir soyad giriniz"),
  email:  z.string().optional(),
  phone: z.string().regex(phoneRegex, validationMessages.phone),
  membership_type: z.enum(["basic", "vip"]),
  subscribed_services: z
    .array(z.string())
    .min(1, "En az bir paket seçilmelidir"),
  avatar_url: z.string().optional(),
  start_date: z.string().min(1, validationMessages.required),
  notes: z.string().optional(),
});

// Trainer validation schema
export const trainerSchema = z.object({
  first_name: z
    .string()
    .min(2, validationMessages.minLength("Ad", 2))
    .regex(nameRegex, "Geçerli bir ad giriniz"),
  last_name: z
    .string()
    .min(2, validationMessages.minLength("Soyad", 2))
    .regex(nameRegex, "Geçerli bir soyad giriniz"),
  name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().regex(phoneRegex, validationMessages.phone),
  bio: z.string().min(10, "Biyografi en az 10 karakter olmalıdır"),
  categories: z.array(z.string()),
  start_date: z.string().min(1, validationMessages.required),
  working_hours: z.object({
    start: z.string().min(1, "Mesai başlangıç saati zorunludur"),
    end: z.string().min(1, "Mesai bitiş saati zorunludur"),
  }),
});

// Service validation schema
export const serviceSchema = z.object({
  name: z.string().min(2, validationMessages.minLength("Paket adı", 2)),
  description: z.string().min(10, "Açıklama en az 10 karakter olmalıdır"),
  price: z
    .number()
    .min(0, "Fiyat 0'dan büyük olmalıdır")
    .nonnegative("Fiyat negatif olamaz"),
  duration: z
    .number()
    .min(1, "Süre 1'den büyük olmalıdır")
    .max(480, "Süre 8 saatten fazla olamaz"),
  max_participants: z
    .number()
    .min(1, "Katılımcı sayısı 1'den büyük olmalıdır")
    .max(50, "Katılımcı sayısı 50'den fazla olamaz"),
  session_count: z.number().min(1, "Seans sayısı en az 1 olmalıdır"),
  isVipOnly: z.boolean().default(false),
});

// Appointment validation schema
export const appointmentFormSchema = z.object({
  member_id: z.string().min(1, { message: "Üye seçimi zorunludur" }),
  trainer_id: z.string().min(1, { message: "Eğitmen seçimi zorunludur" }),
  service_id: z.string().min(1, { message: "Paket seçimi zorunludur" }),
  status: z.enum(["scheduled", "in-progress", "completed", "cancelled"]),
  date: z.string().min(1, { message: "Tarih seçimi zorunludur" }),
  time: z.string().min(1, { message: "Saat seçimi zorunludur" }),
  notes: z.string().optional(),
});

// Multi-session appointment validation schema
export const multiSessionAppointmentSchema = z.object({
  member_id: z.string().min(1, { message: "Üye seçimi zorunludur" }),
  trainer_id: z.string().min(1, { message: "Eğitmen seçimi zorunludur" }),
  service_id: z.string().min(1, { message: "Paket seçimi zorunludur" }),
  sessions: z
    .array(
      z.object({
        date: z.string().min(1, { message: "Tarih seçimi zorunludur" }),
        time: z.string().min(1, { message: "Saat seçimi zorunludur" }),
      }),
    )
    .min(1, { message: "En az bir seans tarihi belirlenmelidir" }),
  notes: z.string().optional(),
});
