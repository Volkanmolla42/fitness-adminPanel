import React from "react";
import { Badge } from "@/components/ui/badge";
import type { Database } from "@/types/supabase";
import { useTheme } from "@/contexts/theme-context";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

type Service = Database["public"]["Tables"]["services"]["Row"];
type Appointment = Database["public"]["Tables"]["appointments"]["Row"];

export interface ServiceProgressProps {
  service: Service;
  appointments: Appointment[];
  totalPackages: number;
}

export const ServiceProgress = ({
  service,
  appointments,
  totalPackages,
}: ServiceProgressProps) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const sessionsPerPackage = service?.session_count || 0;

  // Randevuları tarihe göre sırala (eskiden yeniye)
  const sortedAppointments = [...appointments].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}`);
    const dateB = new Date(`${b.date}T${b.time}`);
    return dateA.getTime() - dateB.getTime();
  });

  // Paketleri oluştur
  const packages = [];
  let remainingAppointments = [...sortedAppointments];

  for (let i = 0; i < totalPackages; i++) {
    const packageAppointments = remainingAppointments.slice(
      0,
      sessionsPerPackage
    );
    remainingAppointments = remainingAppointments.slice(sessionsPerPackage);

    // Bu paket için durumlarına göre randevuları ayır
    const packageCompletedAppointments = packageAppointments.filter(
      (apt) => apt.status === "completed"
    );
    const packagePlannedAppointments = packageAppointments.filter(
      (apt) => apt.status === "scheduled"
    );
    const packageCancelledAppointments = packageAppointments.filter(
      (apt) => apt.status === "cancelled"
    );

    // Bu paketteki toplam randevu sayısı
    const packageTotalAppointments = packageAppointments.length;

    // Bu paketteki boş randevu sayısı
    const packageEmptySlots = sessionsPerPackage - packageTotalAppointments;

    // Paket için başlangıç ve bitiş tarihlerini hesapla
    let startDate = null;
    let endDate = null;

    if (packageAppointments.length > 0) {
      // Başlangıç tarihi: İlk randevunun tarihi
      startDate = new Date(`${packageAppointments[0].date}T${packageAppointments[0].time}`);
      
      // Bitiş tarihi: Son planlanan randevunun tarihi
      // Önce tamamlanmamış ve iptal edilmemiş randevuları filtrele
      const activeAppointments = packageAppointments.filter(
        apt => apt.status === "scheduled" || apt.status === "in-progress"
      );
      
      if (activeAppointments.length > 0) {
        // Aktif randevular varsa, son aktif randevunun tarihini al
        const lastActiveAppointment = activeAppointments[activeAppointments.length - 1];
        endDate = new Date(`${lastActiveAppointment.date}T${lastActiveAppointment.time}`);
      } else if (packageCompletedAppointments.length > 0) {
        // Aktif randevu yoksa ve tamamlanan randevular varsa, son tamamlanan randevunun tarihini al
        const lastCompletedAppointment = packageCompletedAppointments[packageCompletedAppointments.length - 1];
        endDate = new Date(`${lastCompletedAppointment.date}T${lastCompletedAppointment.time}`);
      }
    }

    packages.push({
      completed: packageCompletedAppointments.length,
      planned: packagePlannedAppointments.length,
      cancelled: packageCancelledAppointments.length,
      empty: packageEmptySlots,
      total: sessionsPerPackage,
      isComplete:
        packageTotalAppointments === sessionsPerPackage &&
        packageEmptySlots === 0,
      startDate,
      endDate,
      appointments: packageAppointments,
      isActive: packagePlannedAppointments.length > 0,
    });
  }

  // Aktif paketi bul (planlanan randevusu olan ilk paket)
  const activePackage = packages.find(pkg => pkg.isActive);

  // Aktif paket yoksa, tamamlanmamış son paketi al
  const incompletePackage = !activePackage 
    ? packages.find(pkg => pkg.completed + pkg.planned + pkg.cancelled < pkg.total)
    : null;
    
  // Gösterilecek paket (aktif veya tamamlanmamış)
  const displayPackage = activePackage || incompletePackage || packages[packages.length - 1];

  // Tarih formatını düzenleyen yardımcı fonksiyon
  const formatDate = (date: Date | null) => {
    if (!date) return "Belirsiz";
    return format(date, "d MMM yyyy", { locale: tr });
  };

  return (
    <div
      className={`w-full p-2.5 rounded-lg shadow-sm border transition-colors ${
        isDark
          ? "bg-gray-800/80 border-primary/20 hover:bg-gray-800"
          : "bg-primary/5 border-primary/10 hover:bg-primary/10"
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <Badge
          variant="outline"
          className={`px-3 py-1 flex items-center gap-2 font-medium ${
            isDark
              ? "bg-gray-700/80 text-gray-200 border-gray-600"
              : "bg-background/80"
          }`}
        >
          <span className="mr-auto">{service?.name || "Yükleniyor..."}</span>
          {totalPackages > 1 && (
            <span
              className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                isDark
                  ? "bg-gray-600 text-gray-200"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {totalPackages}x
            </span>
          )}
        </Badge>
      </div>

      {/* Aktif veya tamamlanmamış paket için tarih aralığı gösterimi */}
      {displayPackage && (displayPackage.startDate || displayPackage.endDate) && (
        <div className="flex items-center gap-1 mb-2 px-1">
          <Calendar className={`h-3.5 w-3.5 ${isDark ? "text-gray-400" : "text-gray-500"}`} />
          <span className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            {formatDate(displayPackage.startDate)} - {formatDate(displayPackage.endDate)}
          </span>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {packages.map((pkg, index) => (
          <div key={index} className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-medium ${
                  isDark ? "text-gray-300" : ""
                } ${pkg.isActive ? "text-blue-500" : ""}`}
              >
                {index + 1}. Paket {pkg.isActive && "(Aktif)"}
              </span>
              <span
                className={`text-xs font-medium ${
                  isDark ? "text-gray-300" : ""
                }`}
              >
                {pkg.completed + pkg.planned + pkg.cancelled}/{pkg.total}
              </span>
            </div>

            <div className="h-2.5 w-full rounded-full overflow-hidden flex">
              {/* Tamamlanan randevular (yeşil) */}
              {pkg.completed > 0 && (
                <div
                  className={`h-full ${
                    isDark ? "bg-green-500" : "bg-green-600"
                  }`}
                  style={{ width: `${(pkg.completed / pkg.total) * 100}%` }}
                />
              )}

              {/* Planlanan randevular (mavi) */}
              {pkg.planned > 0 && (
                <div
                  className={`h-full ${isDark ? "bg-blue-500" : "bg-blue-600"}`}
                  style={{ width: `${(pkg.planned / pkg.total) * 100}%` }}
                />
              )}

              {/* İptal edilen randevular (kırmızı) */}
              {pkg.cancelled > 0 && (
                <div
                  className={`h-full ${isDark ? "bg-red-500" : "bg-red-600"}`}
                  style={{ width: `${(pkg.cancelled / pkg.total) * 100}%` }}
                />
              )}

              {/* Boş randevular (gri) */}
              {pkg.empty > 0 && (
                <div
                  className={`h-full ${
                    isDark ? "bg-gray-600/50" : "bg-gray-300"
                  }`}
                  style={{ width: `${(pkg.empty / pkg.total) * 100}%` }}
                />
              )}
            </div>

            <div className="flex flex-wrap gap-2 text-xs mt-0.5">
              {pkg.completed > 0 && (
                <span
                  className={`${isDark ? "text-green-400" : "text-green-600"}`}
                >
                  {pkg.completed} tamamlanan
                </span>
              )}
              {pkg.planned > 0 && (
                <span
                  className={`${isDark ? "text-blue-400" : "text-blue-600"}`}
                >
                  {pkg.planned} planlanan
                </span>
              )}
              {pkg.cancelled > 0 && (
                <span className={`${isDark ? "text-red-400" : "text-red-600"}`}>
                  {pkg.cancelled} iptal
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
