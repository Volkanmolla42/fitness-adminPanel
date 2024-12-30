import * as z from "zod";

// Common validation patterns
const phoneRegex =
  /^(\+90|0)?\s*([0-9]{3})\s*([0-9]{3})\s*([0-9]{2})\s*([0-9]{2})$/;
const nameRegex = /^[a-zA-ZğüşıöçĞÜŞİÖÇ]{2,}$/;

// Common validation messages
export const validationMessages = {
  required: "Bu alan zorunludur",
  email: "Geçerli bir e-posta adresi giriniz",
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
  firstName: z
    .string()
    .min(2, validationMessages.minLength("Ad", 2))
    .regex(nameRegex, "Geçerli bir ad giriniz"),
  lastName: z
    .string()
    .min(2, validationMessages.minLength("Soyad", 2))
    .regex(nameRegex, "Geçerli bir soyad giriniz"),
  email: z.string().email(validationMessages.email),
  phone: z.string().regex(phoneRegex, validationMessages.phone),
  membershipType: z.enum(["basic", "premium", "vip"]),
  subscribedServices: z
    .array(z.string())
    .min(1, "En az bir hizmet seçilmelidir"),
  avatarUrl: z.string().optional(),
  startDate: z.string().min(1, validationMessages.required),
  endDate: z.string().min(1, validationMessages.required),
});

// Trainer validation schema
export const trainerSchema = z.object({
  name: z
    .string()
    .min(2, validationMessages.minLength("İsim", 2))
    .regex(nameRegex, validationMessages.name),
  email: z.string().email(validationMessages.email),
  phone: z.string().regex(phoneRegex, validationMessages.phone),
  categories: z
    .array(z.string())
    .min(1, "En az bir uzmanlık alanı seçilmelidir"),
  bio: z.string().min(10, "Biyografi en az 10 karakter olmalıdır"),
  startDate: z.string().min(1, validationMessages.required),
  workingHours: z.object({
    start: z.string().min(1, "Başlangıç saati zorunludur"),
    end: z.string().min(1, "Bitiş saati zorunludur"),
  }),
});

// Service validation schema
export const serviceSchema = z.object({
  name: z.string().min(2, validationMessages.minLength("Hizmet adı", 2)),
  description: z.string().min(10, "Açıklama en az 10 karakter olmalıdır"),
  price: z
    .number()
    .min(0, "Fiyat 0'dan büyük olmalıdır")
    .nonnegative("Fiyat negatif olamaz"),
  duration: z
    .number()
    .min(1, "Süre 1'den büyük olmalıdır")
    .max(480, "Süre 8 saatten fazla olamaz"),
  maxParticipants: z
    .number()
    .min(1, "Katılımcı sayısı 1'den büyük olmalıdır")
    .max(50, "Katılımcı sayısı 50'den fazla olamaz"),
  category: z
    .string({
      required_error: "Kategori seçimi zorunludur",
      invalid_type_error: "Geçerli bir kategori seçmelisiniz",
    })
    .min(1, "Kategori seçimi zorunludur"),
});

// Appointment validation schema
export const appointmentFormSchema = z
  .object({
    memberId: z.string().min(1, { message: "Üye seçimi zorunludur" }),
    trainerId: z.string().min(1, { message: "Eğitmen seçimi zorunludur" }),
    serviceId: z.string().min(1, { message: "Hizmet seçimi zorunludur" }),
    date: z.string().min(1, { message: "Tarih seçimi zorunludur" }),
    time: z.string().min(1, { message: "Saat seçimi zorunludur" }),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      const appointmentDate = new Date(`${data.date}T${data.time}`);
      const now = new Date();

      // Set the seconds and milliseconds to 0 for both dates to compare only hours and minutes
      appointmentDate.setSeconds(0, 0);
      now.setSeconds(0, 0);

      return appointmentDate >= now;
    },
    {
      message: "Geçmiş bir saat için randevu oluşturamazsınız",
      path: ["time"],
    },
  );
