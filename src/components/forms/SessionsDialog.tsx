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
import { CalendarDays, Clock, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Appointment, Service } from "@/types/appointments";
import { Session } from "@/types/sessions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  services: Service[];  // Tüm servislerin listesi
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
  services = [],  // Default boş array
}: SessionsDialogProps) {
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);

  // Çalışma saatleri ve kısıtlamalar için sabitler
  const WORKING_HOURS = {
    start: 10, // 10:00
    end: 20,   // 19:00
  } as const;

  const DATE_RESTRICTIONS = {
    excludedDays: [0] as number[], // 0: Pazar
  } as const;

  // Sabit randevu saatleri
  const timeSlots = [
    "10:00",
    "11:30",
    "13:00",
    "14:30",
    "16:00",
    "17:00",
    "18:00",
    "19:00"
  ];

  // Zamanı HH:mm formatına çeviren yardımcı fonksiyon
  const formatTime = React.useCallback((time: string): string => {
    return time.length === 8 ? time.substring(0, 5) : time;
  }, []);

  // Tarih ve saat validasyonu
  const validateDateTime = React.useCallback((date: string, time: string): { isValid: boolean; error?: string } => {
    // Eğer zaman seçilmemişse sadece tarih validasyonunu yap
    if (!time || time === "00:00") {
      const selectedDate = new Date(`${date}T00:00:00`);
      const now = new Date();
      
      // Geçmiş tarih kontrolü - sadece gün bazında kontrol
      if (selectedDate.setHours(0,0,0,0) < now.setHours(0,0,0,0)) {
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

    // Çalışma saati kontrolü
    const hour = parseInt(time.split(':')[0]);
    const minute = parseInt(time.split(':')[1]);
    if (hour < WORKING_HOURS.start || hour >= WORKING_HOURS.end) {
      return { isValid: false, error: `Randevular ${WORKING_HOURS.start}:00 - ${WORKING_HOURS.end}:00 arasında olmalıdır` };
    }
    return { isValid: true };
  }, []);

  // Çakışma kontrolü yapan fonksiyon
  const checkConflict = React.useCallback((date: string, time: string, currentIndex: number): boolean => {
    if (!selectedTrainerId || !selectedService || !services) return false;

    // Zamanları HH:mm formatına normalize et
    const normalizedTime = formatTime(time);

    // Seçilen tarih ve saatte başka randevu var mı kontrol et
    const conflictingAppointments = appointments.filter(apt => {
      if (apt.id === appointment?.id) return false;  // Mevcut randevuyu hariç tut

      const sameDateTime = apt.date === date && formatTime(apt.time) === normalizedTime;
      const sameTrainer = apt.trainer_id === selectedTrainerId;
      const isScheduled = apt.status === "scheduled";

      return sameDateTime && sameTrainer && isScheduled;
    });

    // Diğer seanslarda aynı tarih ve saat seçilmiş mi kontrol et
    const conflictingSessions = sessions.filter((session, index) => 
      index !== currentIndex && 
      session.date === date && 
      formatTime(session.time) === normalizedTime
    );

    // VIP randevuları bul
    const vipAppointments = conflictingAppointments.filter(apt => {
      const appointmentService = services.find(s => s.id === apt.service_id);
      return appointmentService?.isVipOnly ?? false;
    });

    // Eğer bu bir VIP randevu ise
    if (selectedService.isVipOnly) {
      // VIP randevular için maksimum 1 kişi kuralı
      // Eğer başka bir VIP randevu varsa veya herhangi bir standart randevu varsa çakışma var
      return vipAppointments.length > 0 || conflictingAppointments.length > 0;
    }

    // Eğer bu standart bir randevu ise
    else {
      // Eğer VIP randevu varsa, çakışma var
      if (vipAppointments.length > 0) {
        return true;
      }

      // Standart randevular için maksimum 3 kişi kontrolü
      const totalStandardAppointments = conflictingAppointments.length + conflictingSessions.length;
      const MAX_STANDARD_APPOINTMENTS = 3;
      
      return totalStandardAppointments >= MAX_STANDARD_APPOINTMENTS;
    }

  }, [selectedTrainerId, selectedService, appointments, appointment, sessions, formatTime, services]);

  // Önerilen zamanı tutan state
  const [suggestedSlot, setSuggestedSlot] = React.useState<{ date: Date; time: string } | null>(null);

  // Dialog açıldığında ve hiç seans seçilmemişse önerilen zamanı hesapla
  React.useEffect(() => {
    if (open && selectedTrainerId && selectedService) {
      // Hiç seans seçilmemiş mi kontrol et
      const hasNoSelectedSessions = sessions.every(session => !session.date && !session.time);
      if (hasNoSelectedSessions) {
        const nextSlot = findNextAvailableSlot();
        setSuggestedSlot(nextSlot);
      } else {
        setSuggestedSlot(null);
      }
    }
  }, [open, selectedTrainerId, selectedService, sessions]);

  const handleSessionChange = React.useCallback((
    index: number,
    field: "date" | "time",
    value: string,
  ) => {
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
          hasError: validation.error
        };
        onSessionsChange(newSessions);
        return;
      }
    } else if (field === "time" && currentSession.date) {
      // Saat değiştiğinde ve tarih varsa tam validasyon yap
      const validation = validateDateTime(currentSession.date, formattedValue);
      if (!validation.isValid) {
        newSessions[index] = {
          ...currentSession,
          [field]: "",
          hasError: validation.error
        };
        onSessionsChange(newSessions);
        return;
      }
    }

    // Değeri güncelle ve hata mesajını temizle
    newSessions[index] = {
      ...currentSession,
      [field]: formattedValue,
      hasError: undefined
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
  }, [sessions, formatTime, validateDateTime, checkConflict, onSessionsChange]);

  const handleAutoFill = React.useCallback(() => {
    const selectedSessions = sessions.filter(session => session.date && session.time);
    if (selectedSessions.length === 0) return;

    // Seçilmiş günleri ve saatleri topla
    const selectedDays = selectedSessions.map(session => ({
      dayOfWeek: new Date(session.date).getDay(),
      time: session.time,
      date: new Date(session.date)
    }));

    // Seçilmemiş seansları bul
    const unselectedIndices = sessions
      .map((session, index) => (!session.date || !session.time ? index : -1))
      .filter(index => index !== -1);

    // Yeni seansları oluştur
    const newSessions = [...sessions];
    let lastDate = new Date(Math.max(...selectedDays.map(d => d.date.getTime())));

    unselectedIndices.forEach((index) => {
      let targetDayIndex = index % selectedDays.length;
      let targetDay = selectedDays[targetDayIndex];
      let nextDate = new Date(lastDate);
      let attempts = 0;
      const maxAttempts = 30; // Sonsuz döngüyü engellemek için

      // Uygun bir tarih bulana kadar dene
      while (attempts < maxAttempts) {
        nextDate.setDate(nextDate.getDate() + 1);
        
        // Hedef güne ulaşana kadar ilerle
        while (nextDate.getDay() !== targetDay.dayOfWeek) {
          nextDate.setDate(nextDate.getDate() + 1);
        }

        const dateStr = format(nextDate, 'yyyy-MM-dd');
        
        // Tarih validasyonu ve çakışma kontrolü
        const validation = validateDateTime(dateStr, targetDay.time);
        const hasConflict = checkConflict(dateStr, targetDay.time, index);

        if (validation.isValid && !hasConflict) {
          newSessions[index] = {
            date: dateStr,
            time: targetDay.time
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
    if (sessions.length < sessionCount) {
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
  const findNextAvailableSlot = React.useCallback((): { date: Date; time: string } | null => {
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
      for (const timeSlot of timeSlots) {
        // Eğer bugünse ve saat geçmişse, bu saati atla
        const [hour, minute] = timeSlot.split(':').map(Number);
        if (isToday && (hour < currentHour || (hour === currentHour && minute <= currentMinute))) {
          continue;
        }

        // Bu slot müsait mi kontrol et
        const isAvailable = !sessions.some(session => 
          session.date === dateStr && session.time === timeSlot
        ) && !checkConflict(dateStr, timeSlot, -1);

        if (isAvailable) {
          return {
            date,
            time: timeSlot
          };
        }
      }
    }

    return null;
  }, [sessions, checkConflict]);

  const isComplete = sessions.every((session) => 
    session.date && session.time && !session.hasConflict
  );
  const completedSessions = sessions.filter(
    (s) => s.date && s.time && !s.hasConflict
  ).length;

  const [openTimeSelect, setOpenTimeSelect] = React.useState<number | null>(null);
  const [openDatePicker, setOpenDatePicker] = React.useState<number | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] flex flex-col p-4 md:p-6">
        <DialogHeader>
          <DialogTitle>
            {appointment ? "Randevu Tarihini Düzenle" : "Seans Tarihlerini Seç"}
          </DialogTitle>
          <DialogDescription>
            {appointment
              ? "Randevunun tarih ve saatini değiştirebilirsiniz."
              : sessionCount && sessionCount > 1
              ? `${sessionCount} seansın tarih ve saatlerini seçin.`
              : "Randevunun tarih ve saatini seçin."}
          </DialogDescription>
        </DialogHeader>

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
                Seans: {sessions.length} / {sessionCount}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddSession}
                className="shrink-0 px-2"
                disabled={sessions.length >= sessionCount}
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
                  {index === 0 && suggestedSlot && !session.date && !session.time && (
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">Önerilen:</span>{" "}
                        {format(suggestedSlot.date, 'd MMMM yyyy, EEEE', { locale: tr })} - {suggestedSlot.time}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => {
                          const newSessions = [...sessions];
                          const dateStr = format(suggestedSlot.date, "yyyy-MM-dd");
                          
                          // Tarih ve saati aynı anda güncelle
                          newSessions[index] = {
                            ...newSessions[index],
                            date: dateStr,
                            time: suggestedSlot.time,
                            hasError: undefined,
                            hasConflict: checkConflict(dateStr, suggestedSlot.time, index)
                          };
                          
                          onSessionsChange(newSessions);
                        }}
                      >
                        Seç
                      </Button>
                    </div>
                  )}

                  {/* Seans Numarası */}
                  {!appointment && sessionCount && sessionCount > 1 && (
                    <div className="absolute -top-2 -left-2 w-6 h-6">
                      <div
                        className={`absolute inset-0 rounded-full ${isSessionComplete ? "bg-primary" : "bg-muted-foreground"} text-primary-foreground flex items-center justify-center text-sm font-medium`}
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
                        selected={session.date ? new Date(`${session.date}T${session.time || '00:00'}`) : null}
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
                          hasConflict || hasError ? "border-destructive" : "border-input"
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
                        <SelectTrigger className={`w-full ${hasConflict ? "border-destructive" : ""}`}>
                          <SelectValue placeholder="Saat seçin" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px] overflow-y-auto" position="popper" side="bottom" align="start">
                          {timeSlots.map((timeSlot) => {
                            const isAvailable = !checkConflict(
                              session.date || "",
                              timeSlot,
                              index
                            );
                            const isSuggested = suggestedSlot && timeSlot === suggestedSlot.time;

                            return (
                              <SelectItem
                                key={timeSlot}
                                value={timeSlot}
                                disabled={!isAvailable}
                                className={`
                                  ${!isAvailable ? 'text-muted-foreground' : ''}
                                  ${isSuggested ? 'bg-primary/10' : ''}
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
                        <span>Bu tarih ve saatte eğitmen müsait değil</span>
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
                  {completedSessions} / {sessionCount} seans planlandı
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
              Tüm seansları temizlemek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
            >
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={confirmClearSessions}
            >
              Temizle
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
