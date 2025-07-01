import { Card } from "@/components/ui/card";
import { Users} from "lucide-react";
import React, { useMemo } from "react";
import { useTheme } from "@/contexts/theme-context";
import type { Database } from "@/types/supabase";
import { Avatar, AvatarFallback} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

import { checkPackageStatus } from "./MemberList";
import { cn } from "@/lib/utils";

type Member = Database["public"]["Tables"]["members"]["Row"];
type Trainer = Database["public"]["Tables"]["trainers"]["Row"];
type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
type Service = Database["public"]["Tables"]["services"]["Row"];

interface TrainerStatsProps {
  trainers: { [key: string]: Trainer } | Trainer[];
  members: Member[];
  appointments: Appointment[];
  services: { [key: string]: Service };
  selectedTrainerId: string | "all";
  onTrainerSelect: (trainerId: string) => void;
}

export const TrainerStats = ({
  trainers,
  members,
  appointments,
  services, // <-- eksikti, eklendi
  selectedTrainerId,
  onTrainerSelect,
}: TrainerStatsProps) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Antrenörleri bir diziye dönüştür
  const trainersArray = useMemo(() => {
    if (Array.isArray(trainers)) return trainers;
    return Object.values(trainers);
  }, [trainers]);

  // Enhanced trainer statistics with more detailed metrics
  const trainerStats = useMemo(() => {
    // Sadece aktif üyeleri filtrele
    const activeMembers = members.filter(member => member.active);

    // Her antrenör için ilgilendiği üye ID'lerini tutan bir map
    const trainerToMemberSet: Record<string, Set<string>> = {};
    const trainerAppointmentCounts: Record<string, { completed: number; scheduled: number; total: number }> = {};

    trainersArray.forEach(trainer => {
      trainerToMemberSet[trainer.id] = new Set();
      trainerAppointmentCounts[trainer.id] = { completed: 0, scheduled: 0, total: 0 };
    });

    // Calculate appointment statistics for each trainer
    appointments.forEach(appointment => {
      if (appointment.trainer_id && trainerAppointmentCounts[appointment.trainer_id]) {
        trainerAppointmentCounts[appointment.trainer_id].total++;
        if (appointment.status === 'completed') {
          trainerAppointmentCounts[appointment.trainer_id].completed++;
        } else if (appointment.status === 'scheduled') {
          trainerAppointmentCounts[appointment.trainer_id].scheduled++;
        }
      }
    });

    // Her aktif üye için ilgilenen antrenörleri bul (MemberList.tsx ile aynı mantık)
    activeMembers.forEach(member => {
      // Üyenin ilgilendiği antrenörleri bul
      const handlingTrainers = checkPackageStatus.getMemberHandlingTrainers(
        member,
        appointments,
        trainersArray,
        services
      );

      // Bu antrenörleri üyeyle eşleştir
      handlingTrainers.forEach(trainer => {
        if (trainerToMemberSet[trainer.id]) {
          trainerToMemberSet[trainer.id].add(member.id);
        }
      });
    });

    // Sonuçları oluştur
    const trainerStatsResult = trainersArray.map(trainer => {
      // Bu antrenörün ilgilendiği üyelerin id'leri
      const memberIds = Array.from(trainerToMemberSet[trainer.id] || []);
      const appointmentStats = trainerAppointmentCounts[trainer.id] || { completed: 0, scheduled: 0, total: 0 };

      return {
        trainer,
        handledMemberCount: memberIds.length,
        appointmentStats,
        isSelected: trainer.id === selectedTrainerId,
        efficiency: appointmentStats.total > 0 ? (appointmentStats.completed / appointmentStats.total) * 100 : 0
      };
    });
    return trainerStatsResult.sort((a, b) => b.handledMemberCount - a.handledMemberCount);
  }, [trainersArray, members, appointments, selectedTrainerId, services]);



  return (
    <div className="space-y-6">
      {/* Trainer Selection Cards */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-4">
          {/* All Trainers Card */}
          <Card
            onClick={() => onTrainerSelect("all")}
            className={cn(
              "group relative overflow-hidden cursor-pointer transition-all duration-300",
              "hover:scale-[1.02] hover:-translate-y-1",
              selectedTrainerId === "all"
                ? cn(
                    "ring-2 ring-primary border-primary/30",
                    isDark
                      ? "ring-offset-2 ring-offset-gray-900 bg-primary/5 hover:shadow-lg hover:shadow-primary/20"
                      : "ring-offset-2 ring-offset-background bg-primary/3 hover:shadow-lg hover:shadow-primary/10"
                  )
                : cn(
                    "hover:border-primary/20",
                    isDark
                      ? "bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 hover:shadow-lg hover:shadow-gray-900/20"
                      : "bg-white border-gray-200 hover:bg-gray-50 hover:shadow-lg hover:shadow-gray-900/10"
                  )
            )}
            role="button"
            tabIndex={0}
            aria-label="Select all trainers"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onTrainerSelect("all");
              }
            }}
          >
            {/* Selection Indicator */}
            <div className={cn(
              "h-1 w-full transition-colors",
              selectedTrainerId === "all" ? "bg-primary" : "bg-transparent"
            )} />

            <div className="p-5">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "p-3 rounded-xl transition-colors",
                  selectedTrainerId === "all"
                    ? "bg-primary text-primary-foreground"
                    : cn(
                        "text-primary group-hover:bg-primary/20",
                        isDark ? "bg-primary/20" : "bg-primary/10"
                      )
                )}>
                  <Users className="h-6 w-6" />
                </div>

                <div className="flex-1">
                  <h4 className={cn(
                    "font-semibold mb-1",
                    isDark ? "text-white" : "text-foreground"
                  )}>
                    Tüm Antrenörler
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-2xl font-bold",
                      isDark ? "text-white" : "text-foreground"
                    )}>
                      {trainersArray.length}
                    </span>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-xs",
                        isDark ? "bg-gray-700 text-gray-300" : ""
                      )}
                    >
                      Antrenör
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Individual Trainer Cards */}
          {trainerStats.map(({ trainer, handledMemberCount, appointmentStats, isSelected, efficiency }) => (
            <Card
              key={trainer.id}
              onClick={() => onTrainerSelect(trainer.id)}
              className={cn(
                "group relative overflow-hidden cursor-pointer transition-all duration-300",
                "hover:scale-[1.02] hover:-translate-y-1",
                isSelected
                  ? cn(
                      "ring-2 ring-primary border-primary/30",
                      isDark
                        ? "ring-offset-2 ring-offset-gray-900 bg-primary/5 hover:shadow-lg hover:shadow-primary/20"
                        : "ring-offset-2 ring-offset-background bg-primary/3 hover:shadow-lg hover:shadow-primary/10"
                    )
                  : cn(
                      "hover:border-primary/20",
                      isDark
                        ? "bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 hover:shadow-lg hover:shadow-gray-900/20"
                        : "bg-white border-gray-200 hover:bg-gray-50 hover:shadow-lg hover:shadow-gray-900/10"
                    )
              )}
              role="button"
              tabIndex={0}
              aria-label={`Select trainer ${trainer.first_name} ${trainer.last_name}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onTrainerSelect(trainer.id);
                }
              }}
            >
              {/* Selection Indicator */}
              <div className={cn(
                "h-1 w-full transition-colors",
                isSelected ? "bg-primary" : "bg-transparent"
              )} />

              <div className="p-5">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <Avatar className={cn(
                      "h-12 w-12 ring-2 ring-offset-2 transition-all",
                      isSelected
                        ? "ring-primary/30"
                        : "ring-transparent group-hover:ring-primary/20",
                      isDark && "ring-offset-gray-800"
                    )}>
                      <AvatarFallback className={cn(
                        "font-semibold",
                        isDark ? "bg-primary/20 text-primary" : "bg-primary/10 text-primary"
                      )}>
                        {trainer.first_name[0]}{trainer.last_name[0]}
                      </AvatarFallback>
                    </Avatar>

                    {/* Performance Indicator */}
                    <div className={cn(
                      "absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 flex items-center justify-center",
                      isDark ? "border-gray-800" : "border-background",
                      efficiency >= 80 ? "bg-green-500" :
                      efficiency >= 60 ? "bg-amber-500" :
                      efficiency >= 40 ? "bg-orange-500" : "bg-red-500"
                    )}>
                      <div className="h-1.5 w-1.5 rounded-full bg-white" />
                    </div>
                  </div>

                  {/* Trainer Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className={cn(
                      "font-semibold truncate mb-1",
                      isDark ? "text-white" : "text-foreground"
                    )}>
                      {trainer.first_name} {trainer.last_name}
                    </h4>

                    <div className="space-y-2">
                      {/* Member Count */}
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          "text-sm",
                          isDark ? "text-gray-400" : "text-muted-foreground"
                        )}>
                          Aktif Üyeler
                        </span>
                        <div className="flex items-center gap-1">
                          <span className={cn(
                            "text-lg font-bold",
                            isDark ? "text-white" : "text-foreground"
                          )}>
                            {handledMemberCount}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              isDark ? "border-gray-600 text-gray-300" : ""
                            )}
                          >
                            üye
                          </Badge>
                        </div>
                      </div>

                      {/* Appointment Stats */}
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          "text-sm",
                          isDark ? "text-gray-400" : "text-muted-foreground"
                        )}>
                          Randevular
                        </span>
                        <div className="flex items-center gap-1">
                          <span className={cn(
                            "text-sm font-medium",
                            isDark ? "text-green-400" : "text-green-600"
                          )}>
                            {appointmentStats.completed}
                          </span>
                          <span className={cn(
                            "text-xs",
                            isDark ? "text-gray-500" : "text-muted-foreground"
                          )}>
                            /
                          </span>
                          <span className={cn(
                            "text-sm font-medium",
                            isDark ? "text-white" : "text-foreground"
                          )}>
                            {appointmentStats.total}
                          </span>
                        </div>
                      </div>

                      {/* Efficiency */}
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          "text-sm",
                          isDark ? "text-gray-400" : "text-muted-foreground"
                        )}>
                          Verimlilik
                        </span>
                        <Badge
                          variant={efficiency >= 80 ? "default" : efficiency >= 60 ? "secondary" : "outline"}
                          className={cn(
                            "text-xs",
                            efficiency >= 80 && "bg-green-500 hover:bg-green-600 text-white",
                            efficiency >= 60 && efficiency < 80 && "bg-amber-500 hover:bg-amber-600 text-white",
                            efficiency < 60 && isDark && "border-gray-600 text-gray-300"
                          )}
                        >
                          %{Math.round(efficiency)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};