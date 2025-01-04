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

  const isComplete =
    sessions.length === sessionCount &&
    sessions.every((session) => session.date && session.time);

  const handleAutoFill = () => {
    const firstSession = sessions[0];
    if (!firstSession?.date || !firstSession?.time) return;

    const newSessions = sessions.map((session, index) => {
      if (index === 0) return session;
      const date = format(
        addDays(new Date(firstSession.date), index * 7),
        "yyyy-MM-dd",
      );
      return { date, time: firstSession.time };
    });
    onSessionsChange(newSessions);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Seans Tarihleri</DialogTitle>
              <DialogDescription className="mt-1.5">
                Lütfen {sessionCount} seans için tarih ve saat belirleyin
              </DialogDescription>
            </div>
            {sessions[0]?.date && sessions[0]?.time && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAutoFill}
                className="shrink-0"
              >
                Haftalık Otomatik Doldur
              </Button>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
            {Array.from({ length: sessionCount }).map((_, index) => {
              const isComplete = sessions[index]?.date && sessions[index]?.time;

              return (
                <div
                  key={index}
                  className={`p-4 border rounded-lg relative transition-all ${isComplete ? "bg-primary/5 border-primary/20" : "bg-muted/30"}`}
                >
                  <div className="absolute -top-2 -left-2 w-6 h-6">
                    <div
                      className={`absolute inset-0 rounded-full ${isComplete ? "bg-primary" : "bg-muted-foreground"} text-primary-foreground flex items-center justify-center text-sm font-medium`}
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
                        value={sessions[index]?.date || ""}
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
                        value={sessions[index]?.time || ""}
                        onChange={(e) =>
                          handleSessionChange(index, "time", e.target.value)
                        }
                      />
                    </div>

                    {isComplete ? (
                      <div className="flex items-center gap-2 text-sm text-primary">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          {format(
                            new Date(
                              `${sessions[index].date}T${sessions[index].time}`,
                            ),
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
                  {sessions.filter((s) => s.date && s.time).length} /{" "}
                  {sessionCount} seans planlandı
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
