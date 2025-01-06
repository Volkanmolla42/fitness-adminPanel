import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, addDays } from "date-fns";
import { tr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, CheckCircle2, AlertCircle } from "lucide-react";

interface Session {
  date: string;
  time: string;
}

interface SessionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionCount: number;
  sessions: Session[];
  onSessionsChange: (sessions: Session[]) => void;
  onConfirm: () => void;
}

export function SessionsDialog({
  open,
  onOpenChange,
  sessionCount,
  sessions,
  onSessionsChange,
  onConfirm,
}: SessionsDialogProps) {
  const handleSessionChange = (
    index: number,
    field: "date" | "time",
    value: string,
  ) => {
    const newSessions = [...sessions];
    newSessions[index] = { ...newSessions[index], [field]: value };
    onSessionsChange(newSessions);
  };

  const isComplete = sessions.every((session) => session.date && session.time);
  const completedSessions = sessions.filter((s) => s.date && s.time).length;

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
    const newSessions = sessions.map(() => ({ date: "", time: "" }));
    onSessionsChange(newSessions);
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Seans Tarihleri</DialogTitle>
              <DialogDescription className="mt-1.5">
                {completedSessions} / {sessions.length} seans planlandı
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAutoFill}
                className="shrink-0"
                disabled={!sessions[0]?.date || !sessions[0]?.time}
              >
                Haftalık Otomatik Doldur
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
                <div className="w-24 text-center text-sm">
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
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearSessions}
                className="shrink-0"
                disabled={completedSessions === 0}
              >
                Seansları Temizle
              </Button>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[60vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-2">
            {sessions.map((session, index) => {
              const isSessionComplete = session.date && session.time;

              return (
                <div
                  key={index}
                  className={`p-4 border rounded-lg relative transition-all ${isSessionComplete ? "bg-primary/5 border-primary/20" : "bg-muted/30"}`}
                >
                  <div className="absolute -top-2 -left-2 w-6 h-6">
                    <div
                      className={`absolute inset-0 rounded-full ${isSessionComplete ? "bg-primary" : "bg-muted-foreground"} text-primary-foreground flex items-center justify-center text-sm font-medium`}
                    >
                      {index + 1}
                    </div>
                  </div>

                  <div className="mt-2 space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <CalendarDays className="w-4 h-4" />
                        <span>Tarih</span>
                      </div>
                      <Input
                        type="date"
                        value={session.date || ""}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) =>
                          handleSessionChange(index, "date", e.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Clock className="w-4 h-4" />
                        <span>Saat</span>
                      </div>
                      <Input
                        type="time"
                        value={session.time || ""}
                        onChange={(e) =>
                          handleSessionChange(index, "time", e.target.value)
                        }
                      />
                    </div>

                    {isSessionComplete ? (
                      <div className="flex items-center gap-2 text-primary font-medium">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          {format(
                            new Date(`${session.date}T${session.time}`),
                            "d MMMM yyyy, EEEE HH:mm",
                            { locale: tr },
                          )}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <AlertCircle className="w-4 h-4" />
                        <span>Tarih ve saat seçilmedi</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between gap-4 mt-4 pt-4 border-t">
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
              Onayla
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
