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
}: SessionsDialogProps) {
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);

  // Zamanı HH:mm formatına çeviren yardımcı fonksiyon
  const formatTime = (time: string): string => {
    // Eğer zaman HH:mm:ss formatındaysa HH:mm'e çevir
    if (time.length === 8) {
      return time.substring(0, 5);
    }
    return time;
  };

  // Çakışma kontrolü yapan fonksiyon
  const checkConflict = (date: string, time: string, currentIndex: number): boolean => {
    if (!selectedTrainerId || !selectedService) return false;

    // Zamanları HH:mm formatına normalize et
    const normalizedTime = time.length === 8 ? time.substring(0, 5) : time;

    console.log('Checking conflict for:', {
      date,
      time: normalizedTime,
      selectedTrainerId,
      currentIndex,
      currentAppointmentId: appointment?.id,
      isVIP: selectedService.isVipOnly,
      maxParticipants: selectedService.max_participants
    });

    // Seçilen tarih ve saatte başka randevu var mı kontrol et
    const conflictingAppointments = appointments.filter(apt => {
      // Eğer bu bir düzenleme ise ve aynı randevuysa çakışma yok
      if (apt.id === appointment?.id) {
        console.log('Skipping same appointment:', apt.id);
        return false;
      }

      const appointmentTime = apt.time.substring(0, 5); // HH:mm:ss -> HH:mm
      const isSameDateTime = 
        apt.date === date && 
        appointmentTime === normalizedTime &&
        apt.trainer_id === selectedTrainerId &&
        apt.status === "scheduled"; // Sadece "scheduled" durumundaki randevuları kontrol et
      
      if (isSameDateTime) {
        console.log('Found conflicting appointment:', {
          id: apt.id,
          date: apt.date,
          time: appointmentTime,
          trainer_id: apt.trainer_id,
          status: apt.status
        });
      }
      
      return isSameDateTime;
    });

    // VIP hizmet için çakışma kontrolü
    if (selectedService.isVipOnly) {
      const hasConflict = conflictingAppointments.length > 0;
      console.log('VIP service conflict check result:', { hasConflict });
      return hasConflict;
    }

    // Standart hizmet için maksimum katılımcı sayısı kontrolü
    const sameServiceAppointments = conflictingAppointments.filter(apt => apt.service_id === selectedService.id);
    const hasReachedMaxParticipants = sameServiceAppointments.length >= selectedService.max_participants;

    // Diğer seanslarda aynı tarih ve saat seçilmiş mi kontrol et
    const conflictingSessions = sessions.filter((session, index) => {
      const sessionTime = formatTime(session.time);
      const conflict = index !== currentIndex && 
                      session.date === date && 
                      sessionTime === normalizedTime;
      
      if (conflict) {
        console.log('Found conflicting session:', {
          index,
          date: session.date,
          time: sessionTime
        });
      }
      
      return conflict;
    });

    const hasConflict = hasReachedMaxParticipants || conflictingSessions.length > 0;
    console.log('Standard service conflict check result:', { 
      hasConflict,
      hasReachedMaxParticipants,
      currentParticipants: sameServiceAppointments.length,
      maxParticipants: selectedService.max_participants,
      conflictingSessionsCount: conflictingSessions.length
    });

    return hasConflict;
  };

  // En yakın müsait zamanı bulan fonksiyon
  const findNextAvailableSlot = (startDate: Date = new Date()): { date: Date; time: string } | null => {
    if (!selectedTrainerId || !selectedService) return null;

    const workingHours = {
      start: 9, // 09:00
      end: 21,  // 21:00
    };

    let currentDate = startDate;
    const maxDaysToCheck = 30; // En fazla 30 gün ileriye bakacak
    let daysChecked = 0;

    while (daysChecked < maxDaysToCheck) {
      // Pazar günlerini atla
      if (currentDate.getDay() !== 0) {
        // Çalışma saatlerini kontrol et
        for (let hour = workingHours.start; hour < workingHours.end; hour++) {
          for (let minute = 0; minute < 60; minute += 30) { // 30'ar dakikalık slotlar
            const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            const dateStr = format(currentDate, 'yyyy-MM-dd');
            
            // Çakışma kontrolü
            const hasConflict = checkConflict(dateStr, time, -1);
            if (!hasConflict) {
              return {
                date: currentDate,
                time: time
              };
            }
          }
        }
      }
      
      // Sonraki güne geç
      currentDate = addDays(currentDate, 1);
      daysChecked++;
    }

    return null; // Müsait zaman bulunamadı
  };

  // Önerilen zamanı tutan state
  const [suggestedSlot, setSuggestedSlot] = React.useState<{ date: Date; time: string } | null>(null);

  // Dialog açıldığında önerilen zamanı hesapla
  React.useEffect(() => {
    if (open && selectedTrainerId && selectedService) {
      const nextSlot = findNextAvailableSlot();
      setSuggestedSlot(nextSlot);
    }
  }, [open, selectedTrainerId, selectedService]);

  const handleSessionChange = (
    index: number,
    field: "date" | "time",
    value: string,
  ) => {
    console.log('Session change:', { index, field, value });

    const newSessions = [...sessions];
    
    // Zamanı HH:mm formatında tut
    const formattedValue = field === "time" ? formatTime(value) : value;

    // Pazar günü kontrolü
    if (field === "date") {
      const selectedDate = new Date(value);
      if (selectedDate.getDay() === 0) {
        // Pazar günü seçilirse hata göster ve değeri sıfırla
        newSessions[index] = { 
          ...newSessions[index], 
          [field]: "",
          hasError: "Pazar günleri randevu alınamaz"
        };
        onSessionsChange(newSessions);
        return;
      } else {
        // Pazar günü değilse hata mesajını temizle
        newSessions[index].hasError = undefined;
      }
    }
    
    newSessions[index] = { 
      ...newSessions[index], 
      [field]: formattedValue,
    };

    // Eğer hem tarih hem saat seçiliyse çakışma kontrolü yap
    if (newSessions[index].date && newSessions[index].time) {
      const conflict = checkConflict(
        newSessions[index].date,
        newSessions[index].time,
        index
      );
      
      // Çakışma durumunu güncelle
      newSessions[index].hasConflict = conflict;
      
      console.log('Updated session:', {
        session: newSessions[index],
        conflict
      });
    }

    onSessionsChange(newSessions);
  };

  const isComplete = sessions.every((session) => 
    session.date && session.time && !session.hasConflict
  );
  const completedSessions = sessions.filter(
    (s) => s.date && s.time && !s.hasConflict
  ).length;

  const handleAutoFill = () => {
    // Seçilmiş seansları bul
    const selectedSessions = sessions.filter(session => session.date && session.time);
    if (selectedSessions.length === 0) return;

    // Seçilmiş günleri ve saatleri topla
    const selectedDays = selectedSessions.map(session => {
      const date = new Date(session.date);
      return {
        dayOfWeek: date.getDay(),
        time: session.time,
        date: new Date(session.date) // Orijinal tarihi de saklayalım
      };
    });

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
      
      // Bir sonraki uygun tarihi bul
      let nextDate = new Date(lastDate);
      nextDate.setDate(nextDate.getDate() + 1); // En az bir gün sonrası olsun

      // Hedef güne ulaşana kadar ilerle
      while (nextDate.getDay() !== targetDay.dayOfWeek) {
        nextDate.setDate(nextDate.getDate() + 1);
      }

      // Yeni seansı ayarla
      newSessions[index] = {
        date: format(nextDate, 'yyyy-MM-dd'),
        time: targetDay.time
      };

      lastDate = nextDate;
    });

    onSessionsChange(newSessions);
  };

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
                          }
                        }}
                        minDate={new Date()} // Bugünden önceki tarihleri seçilemez yap
                        dateFormat="d MMMM, EEEE"
                        locale={tr}
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
                      <DatePicker
                        selected={session.time ? new Date(`${session.date || '2000-01-01'}T${session.time}`) : null}
                        onChange={(date: Date) => {
                          if (date) {
                            handleSessionChange(
                              index,
                              "time",
                              format(date, "HH:mm")
                            );
                          }
                        }}
                        showTimeSelect
                        showTimeSelectOnly
                        timeIntervals={15}
                        timeCaption="Saat"
                        dateFormat="HH:mm"
                        locale={tr}
                        className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                          hasConflict ? "border-destructive" : "border-input"
                        }`}
                      />
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

        {suggestedSlot && (
          <div className="p-2 bg-yellow-200 rounded-lg">
            <div className="text-sm font-medium mb-1">Önerilen İlk Müsait Zaman:</div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarDays className="w-4 h-4" />
              <span>{format(suggestedSlot.date, 'd MMMM yyyy, EEEE', { locale: tr })}</span>
              <Clock className="w-4 h-4 ml-2" />
              <span>{suggestedSlot.time}</span>
            </div>
            <Button 
              variant="secondary" 
              size="sm" 
              className="mt-2 w-full"
              onClick={() => {
                const newSession: Session = {
                  date: format(suggestedSlot.date, 'yyyy-MM-dd'),
                  time: suggestedSlot.time,
                };
                onSessionsChange([newSession]); // Replace all sessions with just this one
              }}
            >
              Bu Zamanı Seç
            </Button>
          </div>
        )}

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
