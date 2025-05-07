import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPhoneForWhatsApp(phone: string): string {
  // Boşlukları kaldır ve başına 90 ekle
  return `90${phone.replace(/\s+/g, "")}`;
}

export function openWhatsApp(phone: string): void {
  const formattedPhone = formatPhoneForWhatsApp(phone);
  window.open(`https://wa.me/${formattedPhone}`, "_blank");
}

// Tarih formatını değiştiren yardımcı fonksiyon
export function formatDate(dateStr: string): string {
  if (!dateStr) return "Belirtilmedi";
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr; // Geçersiz tarih ise orijinal değeri döndür
    
    // Ay isimleri Türkçe olarak
    const months = [
      "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
      "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
    ];
    
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day} ${month} ${year}`;
  } catch (error) {
    console.error("Tarih formatlanırken hata oluştu:", error);
    return dateStr; // Hata durumunda orijinal değeri döndür
  }
}