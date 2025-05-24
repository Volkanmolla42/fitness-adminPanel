import { Card } from "@/components/ui/card";
import { Users, HelpCircle } from "lucide-react";
import React, { useMemo } from "react";
import { useTheme } from "@/contexts/theme-context";
import type { Database } from "@/types/supabase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

  // Her antrenörün ilgilendiği üye sayısını hesapla
  const trainerStats = useMemo(() => {
    // Sadece aktif üyeleri filtrele
    const activeMembers = members.filter(member => member.active);
    
    return trainersArray.map(trainer => {
      // Bu antrenörle ilgilenen üyeleri bul
      const handledMembers = activeMembers.filter(member => {
        // Üyenin tamamlanan randevuları
        const completedAppointments = appointments.filter(
          apt => apt.member_id === member.id && 
                apt.status === "completed" && 
                apt.trainer_id === trainer.id
        );
        
        // Üyenin planlanan randevuları
        const scheduledAppointments = appointments.filter(
          apt => apt.member_id === member.id && 
                apt.status === "scheduled" && 
                apt.trainer_id === trainer.id
        );
        
        // Eğer üyenin bu antrenörle tamamlanan veya planlanan randevusu varsa
        return completedAppointments.length > 0 || scheduledAppointments.length > 0;
      });
      
      return {
        trainer,
        handledMemberCount: handledMembers.length,
        isSelected: trainer.id === selectedTrainerId
      };
    }).sort((a, b) => b.handledMemberCount - a.handledMemberCount); // Üye sayısına göre azalan sırada sırala
  }, [trainersArray, members, appointments, selectedTrainerId]);

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <h2 className={`text-base font-semibold flex items-center gap-2 ${isDark ? "text-gray-200" : "text-gray-700"}`}>
          <Users className="h-5 w-5" />
          Antrenörlerin İlgilendiği Üyeler
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className={`h-4 w-4 ${isDark ? "text-gray-400" : "text-gray-500"}`} />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-sm">
                  Bir antrenörün bir üyeyle ilgileniyor sayılması için:
                  <br />
                  1. Üyenin durumu &quot;aktif&quot; olmalıdır.
                  <br />
                  2. Üyenin bu antrenörle tamamlanmış randevusu olmalı VEYA
                  <br />
                  3. Üyenin bu antrenörle planlanan randevusu olmalıdır.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </h2>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <Card
          onClick={() => onTrainerSelect("all")}
          className={`transition-all cursor-pointer hover:shadow-md ${
            selectedTrainerId === "all" 
              ? isDark 
                ? "bg-gradient-to-r from-blue-900/40 to-gray-800 border-2 border-blue-700 shadow-lg" 
                : "bg-gradient-to-r from-blue-100 to-white border-2 border-blue-300 shadow-lg"
              : isDark 
                ? "bg-gray-800/60 hover:bg-blue-950/20 border border-gray-700" 
                : "bg-white hover:bg-blue-50 border border-gray-200"
          }`}
        >
          <div className="p-4 flex items-center gap-3">
            <div className={`p-2.5 rounded-full ${
              isDark ? "bg-blue-950" : "bg-blue-100"
            }`}>
              <Users className={`h-5 w-5 ${
                isDark ? "text-blue-400" : "text-blue-600"
              }`} />
            </div>
            <div>
              <p className={`text-sm font-medium ${isDark ? "text-gray-300" : ""}`}>
                Tüm Antrenörler
              </p>
              <p className={`text-lg font-bold ${isDark ? "text-white" : ""}`}>
                {trainersArray.length} Antrenör
              </p>
            </div>
          </div>
        </Card>
        
        {trainerStats.map(({ trainer, handledMemberCount, isSelected }) => (
          <Card
            key={trainer.id}
            onClick={() => onTrainerSelect(trainer.id)}
            className={`transition-all cursor-pointer hover:shadow-md ${
              isSelected 
                ? isDark 
                  ? "bg-gradient-to-r from-blue-900/40 to-gray-800 border-2 border-blue-700 shadow-lg" 
                  : "bg-gradient-to-r from-blue-100 to-white border-2 border-blue-300 shadow-lg"
                : isDark 
                  ? "bg-gray-800/60 hover:bg-blue-950/20 border border-gray-700" 
                  : "bg-white hover:bg-blue-50 border border-gray-200"
            }`}
          >
            <div className="p-4 flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-10 w-10 border border-gray-200">
                  <AvatarFallback className={`${isDark ? "bg-blue-900 text-blue-100" : "bg-blue-100 text-blue-700"}`}>
                    {trainer.first_name[0]}{trainer.last_name[0]}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div>
                <p className={`text-sm font-medium ${isDark ? "text-gray-300" : ""}`}>
                  {trainer.first_name} {trainer.last_name}
                </p>
                <p className={`text-lg font-bold ${isDark ? "text-white" : ""}`}>
                  {handledMemberCount} Üye
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      <div className={`text-xs italic mt-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
        * Bir üyenin bir antrenör tarafından ilgilenilmesi için, o antrenörle tamamlanmış veya planlanan randevusu olmalıdır.
      </div>
    </div>
  );
}; 