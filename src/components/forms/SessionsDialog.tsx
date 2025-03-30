import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, addDays } from "date-fns";
import { tr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Appointment, Service, Member } from "@/types/appointments";
import { Session } from "@/types/sessions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import TIME_SLOTS  from "@/constants/timeSlots";

interface SessionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionCount: number;
  sessions: Session[];
  onSessionsChange: (sessions: Session[]) => void;
  onConfirm: () => void;
  appointments: Appointment[];
  selectedTrainerId: string;
  appointment?: Appointment;
  selectedService: Service | null;
  services: Service[];
  defaultDate?: string;
  defaultTime?: string;
  memberId?: string;
  member?: Member;
}

export function SessionsDialog({
  open,
  onOpenChange,
  sessionCount,
  sessions,
  onSessionsChange,
  onConfirm,
  appointments,
  selectedTrainerId,
  appointment,
  selectedService,
  services = [],
  defaultDate,
  defaultTime,
  memberId,
  member,
}: SessionsDialogProps) {
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);

  const DATE_RESTRICTIONS = {
    excludedDays: [0] as number[], // 0: Pazar
  } as const;

  // Zamanı HH:mm formatına çeviren yardımcı fonksiyon
  const formatTime = React.useCallback((time: string): string => {
    return time.length === 8 ? time.substring(0, 5) : time;
  }, []);

  // Tarih ve saat validasyonu
  const validateDateTime = React.useCallback(
    (date: string, time: string): { isValid: boolean; error?: string } => {
      // Eğer zaman seçilmemişse sadece tarih validasyonunu yap
      if (!time || time === "00:00") {
        const selectedDate = new Date(`${date}T00:00:00`);
        const now = new Date();

        // Geçmiş tarih kontrolü - sadece gün bazında kontrol
        if (selectedDate.setHours(0, 0, 0, 0) < now.setHours(0, 0, 0, 0)) {
          return { isValid: false, error: "Geçmiş tarih seçilemez" };
        }

        // Çalışma günü kontrolü
        if (DATE_RESTRICTIONS.excludedDays.includes(selectedDate.getDay())) {
          return { isValid: false, error: "Bu gün randevu alınamaz" };
        }

        return { isValid: true };
      }

      // Hem tarih hem saat için tam validasyon
      const selectedDateTime = new Date(`${date}T${time}`);
      const now = new Date();

      // Geçmiş zaman kontrolü - tam tarih ve saat kontrolü
      if (selectedDateTime < now) {
        return { isValid: false, error: "Geçmiş zaman seçilemez" };
      }

      // Çalışma günü kontrolü
      if (DATE_RESTRICTIONS.excludedDays.includes(selectedDateTime.getDay())) {
        return { isValid: false, error: "Bu gün randevu alınamaz" };
      }

      return { isValid: true };
    },
    []
  );

  const checkConflict = React.useCallback(
    (date: string, time: string, currentIndex: number): boolean => {
      // 1. Erken Çıkış Koşullarını Optimize Et
      if (!selectedTrainerId || !selectedService?.id || !services?.length)
        return false;

      // 2. Zaman Formatlama İşlemini Merkezileştir
      const normalizedTime = formatTime(time);
      const currentAppointmentId = appointment?.id;

      // 3. Önbelleklenmiş Verileri Kullan
      const serviceIsVip = selectedService.isVipOnly;
      const MAX_STANDARD_CAPACITY = selectedService.max_participants || 4;

      // 4. Çakışan Randevuları Hesapla
      const isConflictingAppointment = (apt: Appointment) => {
        const sameDateTime =
          apt.date === date && formatTime(apt.time) === normalizedTime;
        const sameTrainer = apt.trainer_id === selectedTrainerId;
        const isScheduled = apt.status === "scheduled";
        const isNotCurrent = apt.id !== currentAppointmentId;

        return sameDateTime && sameTrainer && isScheduled && isNotCurrent;
      };

      // 5. Filtreleme İşlemlerini Birleştir
      const conflictingAppointments = appointments.filter(
        isConflictingAppointment
      );
      const conflictingSessions = sessions.filter(
        (session, index) =>
          index !== currentIndex &&
          session.date === date &&
          formatTime(session.time) === normalizedTime
      );

      // 6. VIP Kontrollerini Optimize Et
      const vipServiceIds = new Set(
        services.filter((s) => s.isVipOnly).map((s) => s.id)
      );

      const hasVipConflict = conflictingAppointments.some((apt) =>
        vipServiceIds.has(apt.service_id)
      );

      // 7. Mantığı Basitleştir
      if (serviceIsVip) {
        return (
          conflictingAppointments.length > 0 || conflictingSessions.length > 0
        );
      }

      // 8. Standart Kapasite Hesaplaması
      const totalParticipants =
        conflictingAppointments.length + conflictingSessions.length;
      const hasStandardConflict = totalParticipants >= MAX_STANDARD_CAPACITY;

      return hasVipConflict || hasStandardConflict;
    },
    [
      selectedTrainerId,
      selectedService, // selectedService.id yerine direkt selectedService
      appointments,
      appointment?.id, // Sadece id'yi takip et
      sessions,
      formatTime,
      services,
    ]
  );
  // Önerilen zamanı tutan state
  const [suggestedSlot, setSuggestedSlot] = React.useState<{
    date: Date;
    time: string;
  } | null>(null);

  // Dialog açıldığında ve hiç seans seçilmemişse önerilen zamanı hesapla
  React.useEffect(() => {
    if (open && selectedTrainerId && selectedService) {
      // Hiç seans seçilmemiş mi kontrol et
      const hasNoSelectedSessions = sessions.every(
        (session) => !session.date && !session.time
      );
      if (hasNoSelectedSessions) {
        if (defaultDate && defaultTime) {
          // Eğer varsayılan tarih ve saat varsa, bunları kullan
          setSuggestedSlot({
            date: new Date(defaultDate),
            time: defaultTime,
          });
        } else {
          // Yoksa bir sonraki müsait zamanı bul
          const nextSlot = findNextAvailableSlot();
          setSuggestedSlot(nextSlot);
        }
      } else {
        setSuggestedSlot(null);
      }
    }
  }, [
    open,
    selectedTrainerId,
    selectedService,
    sessions,
    defaultDate,
    defaultTime,
    TIME_SLOTS,
  ]);

  const handleSessionChange = React.useCallback(
    (index: number, field: "date" | "time", value: string) => {
      const newSessions = [...sessions];
      const currentSession = newSessions[index];

      // Zamanı HH:mm formatında tut
      const formattedValue = field === "time" ? formatTime(value) : value;

      // Tarih ve saat validasyonu
      if (field === "date") {
        // Sadece tarih değiştiğinde, saati kontrol etmeden tarih validasyonu yap
        const validation = validateDateTime(formattedValue, "");
        if (!validation.isValid) {
          newSessions[index] = {
            ...currentSession,
            [field]: "",
            hasError: validation.error,
          };
          onSessionsChange(newSessions);
          return;
        }
      } else if (field === "time" && currentSession.date) {
        // Saat değiştiğinde ve tarih varsa tam validasyon yap
        const validation = validateDateTime(
          currentSession.date,
          formattedValue
        );
        if (!validation.isValid) {
          newSessions[index] = {
            ...currentSession,
            [field]: "",
            hasError: validation.error,
          };
          onSessionsChange(newSessions);
          return;
        }
      }

      // Değeri güncelle ve hata mesajını temizle
      newSessions[index] = {
        ...currentSession,
        [field]: formattedValue,
        hasError: undefined,
      };

      // Eğer hem tarih hem saat seçiliyse çakışma kontrolü yap
      if (newSessions[index].date && newSessions[index].time) {
        const conflict = checkConflict(
          newSessions[index].date,
          newSessions[index].time,
          index
        );
        newSessions[index].hasConflict = conflict;
      }

      onSessionsChange(newSessions);
    },
    [sessions, formatTime, validateDateTime, checkConflict, onSessionsChange]
  );

  const handleAutoFill = React.useCallback(() => {
    const selectedSessions = sessions.filter(
      (session) => session.date && session.time
    );
    if (selectedSessions.length === 0) return;

    // Seçilmiş günleri ve saatleri topla
    const selectedDays = selectedSessions.map((session) => ({
      dayOfWeek: new Date(session.date).getDay(),
      time: session.time,
      date: new Date(session.date),
    }));

    // Seçilmemiş seansları bul
    const unselectedIndices = sessions
      .map((session, index) => (!session.date || !session.time ? index : -1))
      .filter((index) => index !== -1);

    // Yeni seansları oluştur
    const newSessions = [...sessions];
    let lastDate = new Date(
      Math.max(...selectedDays.map((d) => d.date.getTime()))
    );

    unselectedIndices.forEach((index) => {
      const targetDayIndex = index % selectedDays.length;
      const targetDay = selectedDays[targetDayIndex];
      const nextDate = new Date(lastDate);
      let attempts = 0;
      const maxAttempts = 30; // Sonsuz döngüyü engellemek için

      // Uygun bir tarih bulana kadar dene
      while (attempts < maxAttempts) {
        nextDate.setDate(nextDate.getDate() + 1);

        // Hedef güne ulaşana kadar ilerle
        while (nextDate.getDay() !== targetDay.dayOfWeek) {
          nextDate.setDate(nextDate.getDate() + 1);
        }

        const dateStr = format(nextDate, "yyyy-MM-dd");

        // Tarih validasyonu yap
        const validation = validateDateTime(dateStr, targetDay.time);
        const hasConflict = checkConflict(dateStr, targetDay.time, index);

        if (validation.isValid) {
          newSessions[index] = {
            date: dateStr,
            time: targetDay.time,
            hasConflict: hasConflict,
            hasError: hasConflict
              ? "Bu tarih ve saatte antrenör müsait değil"
              : undefined,
          };
          lastDate = nextDate;
          break;
        }

        attempts++;
      }

      // Eğer uygun tarih bulunamadıysa, boş bırak
      if (attempts >= maxAttempts) {
        newSessions[index] = { date: "", time: "" };
      }
    });

    onSessionsChange(newSessions);
  }, [sessions, validateDateTime, checkConflict, onSessionsChange]);

  const handleClearSessions = () => {
    setShowConfirmDialog(true);
  };

  const confirmClearSessions = () => {
    const newSessions = sessions.map(() => ({ date: "", time: "" }));
    onSessionsChange(newSessions);
    setShowConfirmDialog(false);
  };

  const handleAddSession = () => {
    if (sessions.length < calculateTotalSessions()) {
      onSessionsChange([...sessions, { date: "", time: "" }]);
    }
  };

  const handleRemoveSession = () => {
    if (sessions.length > 1) {
      const newSessions = [...sessions];
      newSessions.pop();
      onSessionsChange(newSessions);
    }
  };

  // Bir sonraki müsait zaman aralığını bulan fonksiyon
  const findNextAvailableSlot = React.useCallback((): {
    date: Date;
    time: string;
  } | null => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // 30 gün içinde uygun slot ara
    for (let day = 0; day < 30; day++) {
      const date = addDays(now, day);
      const dateStr = format(date, "yyyy-MM-dd");
      const isToday = day === 0;

      // Pazar günü kontrolü
      if (date.getDay() === 0) continue;

      // Her saat için kontrol et
      for (const timeSlot of TIME_SLOTS) {
        // Eğer bugünse ve saat geçmişse, bu saati atla
        const [hour, minute] = timeSlot.split(":").map(Number);
        if (
          isToday &&
          (hour < currentHour ||
            (hour === currentHour && minute <= currentMinute))
        ) {
          continue;
        }

        // Bu slot müsait mi kontrol et
        const isAvailable =
          !sessions.some(
            (session) => session.date === dateStr && session.time === timeSlot
          ) && !checkConflict(dateStr, timeSlot, -1);

        if (isAvailable) {
          return {
            date,
            time: timeSlot,
          };
        }
      }
    }

    return null;
  }, [sessions, checkConflict]);

  const calculateCompletedSessions = React.useCallback(() => {
    // Üye ID'sini appointment'dan veya prop'dan al
    const currentMemberId = appointment?.member_id || memberId;
    if (!currentMemberId || !selectedService?.id || !member) return 0;

    // Bu servis için tamamlanan randevuları bul

    const completedAppointments = appointments.filter(
      (apt) =>
        apt.member_id === currentMemberId &&
        apt.service_id === selectedService.id &&
        (apt.status === "completed" || apt.status === "cancelled")
    );
    // Aktif paketteki tamamlanan seans sayısı
    const currentPackageCompletedSessions = completedAppointments.length;

    // Tamamlanan seanslardan, tamamlanmış paketlerin seans sayısını çıkar
    return currentPackageCompletedSessions;
  }, [
    appointments,
    appointment?.member_id,
    memberId,
    selectedService?.id,
    member,
    services,
  ]);

  const calculateScheduledSessions = React.useCallback(() => {
    // Üye ID'sini appointment'dan veya prop'dan al
    const currentMemberId = appointment?.member_id || memberId;

    if (!currentMemberId || !selectedService?.id) return 0;

    // Bu servis için planlanan randevuları bul
    const scheduledAppointments = appointments.filter(
      (apt) =>
        apt.member_id === currentMemberId &&
        apt.service_id === selectedService.id &&
        apt.status === "scheduled"
    );

    return scheduledAppointments.length;
  }, [appointments, appointment?.member_id, memberId, selectedService?.id]);

  const calculateTotalSessions = React.useCallback(() => {
    if (!selectedService || !member) return sessionCount;

    // Üyenin bu pakete kaç kez kayıt olduğunu bul
    const packageCount = member.subscribed_services.filter(
      (serviceId) => serviceId === selectedService.id
    ).length;

    // Toplam seans sayısı = Paket seans sayısı x Paket adedi
    return selectedService.session_count * (packageCount || 1);
  }, [selectedService, member, sessionCount]);

  const isComplete = sessions.every(
    (session) => session.date && session.time && !session.hasConflict
  );
  const completedSessions = sessions.filter(
    (s) => s.date && s.time && !s.hasConflict
  ).length;

  const [openTimeSelect, setOpenTimeSelect] = React.useState<number | null>(
    null
  );
  const [openDatePicker, setOpenDatePicker] = React.useState<number | null>(
    null
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] flex flex-col p-4 md:p-6">
        <DialogHeader>
          <DialogTitle>
            <span className="flex text-base text-muted-foreground items-center gap-2">
              {appointment ? "Randevu Tarihini Düzenle" : "Seans Tarihlerini Seç"}
              <span className="text-gray-50 mx-2">
                ({member?.first_name} {member?.last_name})
              </span>
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Seans Bilgileri Kartı */}
        <div className="bg-muted/50 rounded-lg px-4 py-2">
          <div className="flex items-center">
            <div className="space-y-1 w-full">
              <h4 className="text-sm text-muted-foreground ">
                {selectedService && member && (
                  <span className="">
                    
                    <span className="text-gray-50 mx-2">
                      {selectedService.name}
                    </span>
                    paketine ait seans bilgileri
                  </span>
                )}
              </h4>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Tamamlanan: <span className="text-green-500">
                      {calculateCompletedSessions()}
                    </span>
                  </span>
                
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Planlanan: <span className="text-blue-400">
                      {calculateScheduledSessions()}
                    </span>
                  </span>
                  
                </div>
                <div className="flex items-center ml-auto gap-2">
                  {(() => {
                    const remainingSessions = calculateTotalSessions() -
                      (calculateCompletedSessions() + calculateScheduledSessions());
                    
                    if (remainingSessions > 0) {
                      return (
                        <div className="flex items-center gap-2 text-green-500 font-medium">
                          <CheckCircle2 className="w-5 h-5" />
                          <span>{remainingSessions} Seans Eklenebilir</span>
                        </div>
                      );
                    } else if (remainingSessions === 0) {
                      return (
                        <div className="flex items-center gap-2 text-orange-500 font-medium">
                          <AlertCircle className="w-5 h-5" />
                          <span>Tüm Seanslar Kullanıldı</span>
                        </div>
                      );
                    } else {
                      return (
                        <div className="flex items-center gap-2 text-red-500 font-medium">
                          <XCircle className="w-5 h-5" />
                          <span>Seans Limiti Aşıldı ({Math.abs(remainingSessions)})</span>
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>

        <ScrollArea className="h-[60vh] md:h-[65vh]">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAutoFill}
              className="shrink-0 text-xs sm:text-sm"
              disabled={!sessions[0]?.date || !sessions[0]?.time}
            >
              Haftalık Otomatik Doldur
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearSessions}
              className="shrink-0 text-xs sm:text-sm"
              disabled={completedSessions === 0}
            >
              Seansları Temizle
            </Button>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveSession}
                className="shrink-0 px-2"
                disabled={sessions.length <= 1}
              >
                -
              </Button>
              <div className="w-20 sm:w-24 text-center text-xs sm:text-sm">
                Seans: {sessions.length} / {calculateTotalSessions()}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddSession}
                className="shrink-0 px-2"
                disabled={sessions.length >= calculateTotalSessions()}
              >
                +
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 p-2">
            {sessions.map((session, index) => {
              const isSessionComplete = session.date && session.time;
              const hasConflict = session.hasConflict;
              const hasError = session.hasError;

              return (
                <div
                  key={index}
                  className={`p-4 border rounded-lg relative transition-all ${
                    hasConflict
                      ? "border-destructive bg-destructive/5"
                      : isSessionComplete
                      ? "border-primary/20 bg-primary/5"
                      : "border-input bg-muted/30"
                  }`}
                >
                  {/* İlk seans için önerilen tarih ve saat */}
                  {index === 0 &&
                    suggestedSlot &&
                    !session.date &&
                    !session.time && (
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">Önerilen:</span>{" "}
                          {format(suggestedSlot.date, "d MMMM yyyy, EEEE", {
                            locale: tr,
                          })}{" "}
                          - {suggestedSlot.time}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => {
                            const newSessions = [...sessions];
                            const dateStr = format(
                              suggestedSlot.date,
                              "yyyy-MM-dd"
                            );

                            // Tarih ve saati aynı anda güncelle
                            newSessions[index] = {
                              ...newSessions[index],
                              date: dateStr,
                              time: suggestedSlot.time,
                              hasError: undefined,
                              hasConflict: checkConflict(
                                dateStr,
                                suggestedSlot.time,
                                index
                              ),
                            };

                            onSessionsChange(newSessions);
                          }}
                        >
                          Seç
                        </Button>
                      </div>
                    )}

                  {/* Seans Numarası */}
                  {!appointment &&
                    calculateTotalSessions() &&
                    calculateTotalSessions() > 1 && (
                      <div className="absolute -top-2 -left-2 w-6 h-6">
                        <div
                          className={`absolute inset-0 rounded-full ${
                            isSessionComplete
                              ? "bg-primary"
                              : "bg-muted-foreground"
                          } text-primary-foreground flex items-center justify-center text-sm font-medium`}
                        >
                          {index + 1}
                        </div>
                      </div>
                    )}

                  <div className="mt-2 space-y-2 sm:space-y-3">
                    <div className="flex flex-col gap-1.5 sm:gap-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CalendarDays className="w-4 h-4" />
                        <span>Tarih</span>
                      </div>
                      <DatePicker
                        selected={
                          session.date
                            ? new Date(
                                `${session.date}T${session.time || "00:00"}`
                              )
                            : null
                        }
                        onChange={(date: Date) => {
                          if (date) {
                            handleSessionChange(
                              index,
                              "date",
                              format(date, "yyyy-MM-dd")
                            );
                            setOpenDatePicker(null);
                            setOpenTimeSelect(index);
                          }
                        }}
                        open={openDatePicker === index}
                        onClickOutside={() => setOpenDatePicker(null)}
                        onInputClick={() => setOpenDatePicker(index)}
                        minDate={new Date()}
                        dateFormat="d MMMM, EEEE"
                        locale={tr}
                        placeholderText={"Tarih seçin"}
                        className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                          hasConflict || hasError
                            ? "border-destructive"
                            : "border-input"
                        }`}
                      />
                      {hasError && (
                        <div className="text-sm text-destructive font-medium mt-1">
                          {hasError}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5 sm:gap-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>Saat</span>
                      </div>
                      <Select
                        value={session.time || ""}
                        onValueChange={(value) => {
                          handleSessionChange(index, "time", value);
                          setOpenTimeSelect(null);
                        }}
                        open={openTimeSelect === index}
                        onOpenChange={(open) => {
                          setOpenTimeSelect(open ? index : null);
                        }}
                        disabled={!session.date}
                      >
                        <SelectTrigger
                          className={`w-full ${
                            hasConflict ? "border-destructive" : ""
                          }`}
                        >
                          <SelectValue placeholder="Saat seçin" />
                        </SelectTrigger>
                        <SelectContent
                          className="max-h-[200px] overflow-y-auto"
                          position="popper"
                          side="bottom"
                          align="start"
                        >
                          {TIME_SLOTS.map((timeSlot) => {
                            const isAvailable = !checkConflict(
                              session.date || "",
                              timeSlot,
                              index
                            );
                            const isSuggested =
                              suggestedSlot && timeSlot === suggestedSlot.time;

                            return (
                              <SelectItem
                                key={timeSlot}
                                value={timeSlot}
                                disabled={!isAvailable}
                                className={`
                                  ${!isAvailable ? "text-muted-foreground" : ""}
                                  ${isSuggested ? "bg-primary/10" : ""}
                                `}
                              >
                                <div className="flex items-center justify-between w-full">
                                  <span>{timeSlot}</span>
                                  {!isAvailable && (
                                    <span className="text-xs text-muted-foreground ml-2">
                                      (Müsait Değil)
                                    </span>
                                  )}
                                  {isSuggested && isAvailable && (
                                    <span className="text-xs text-primary ml-2">
                                      (Önerilen)
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    {hasConflict && (
                      <div className="flex items-center gap-2 text-sm text-destructive font-medium mt-2">
                        <XCircle className="w-4 h-4" />
                        <span>Bu tarih ve saatte antrenör müsait değil</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between gap-4  pt-4 border-t">
          <div className="flex items-center gap-2">
            <Badge variant={isComplete ? "default" : "secondary"}>
              {isComplete ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Tüm seanslar planlandı
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 mr-1" />
                  {completedSessions} / {calculateTotalSessions()} seans
                  planlandı
                </>
              )}
            </Badge>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button onClick={onConfirm} disabled={!isComplete}>
              {appointment ? "Kaydet" : "Onayla"}
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-sm p-4 md:p-4">
          <DialogHeader>
            <DialogTitle>Seansları Temizle</DialogTitle>
            <DialogDescription className="pt-3">
              Tüm seansları temizlemek istediğinizden emin misiniz? Bu işlem
              geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
            >
              İptal
            </Button>
            <Button variant="destructive" onClick={confirmClearSessions}>
              Temizle
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
