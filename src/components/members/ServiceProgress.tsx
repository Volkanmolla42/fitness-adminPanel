import React from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2 } from "lucide-react";
import cn from "classnames";
import type { Database } from "@/types/supabase";
import { useTheme } from "@/contexts/theme-context";

type Service = Database["public"]["Tables"]["services"]["Row"];

export interface ServiceProgressProps {
  service: Service;
  completedSessions: number;
  totalPackages: number;
}

export const ServiceProgress = ({ service, completedSessions, totalPackages }: ServiceProgressProps) => {
  const { theme } = useTheme();
  const sessionsPerPackage = service?.session_count || 0;
  
  // Eğer üye bu paketten sadece 1 tane almışsa ve seans sayısını aşmışsa
  // gerçek tamamlanan seans sayısını göster
  if (totalPackages === 1 && completedSessions > sessionsPerPackage) {
    return (
      <div className={`w-full p-2.5 rounded-lg shadow-sm border transition-colors ${
        theme === 'dark'
          ? 'bg-gray-800/80 border-primary/20 hover:bg-gray-800'
          : 'bg-primary/5 border-primary/10 hover:bg-primary/10'
      }`}>
        <Badge
          variant="outline"
          className={`px-3 py-1 flex items-center gap-2 mb-1.5 font-medium ${
            theme === 'dark'
              ? 'bg-gray-700/80 text-gray-200 border-gray-600'
              : 'bg-background/80'
          }`}
        >
          <span className="mr-auto">
            {service?.name || "Yükleniyor..."}
          </span>
        </Badge>
        <div className="flex items-center gap-2.5">
          <Progress
            value={100}
            className={`h-2.5 rounded-full ${
              theme === 'dark'
                ? 'bg-green-800/40 [&>div]:bg-green-500'
                : 'bg-green-100/70 [&>div]:bg-green-600'
            }`}
          />
          <span className={`text-xs whitespace-nowrap flex items-center gap-1.5 font-medium ${
            theme === 'dark' ? 'text-gray-300' : ''
          }`}>
            {completedSessions}/{sessionsPerPackage}
            <CheckCircle2 className={`size-4 ml-0.5 ${
              theme === 'dark' ? 'text-green-500' : 'text-green-600'
            }`} />
          </span>
        </div>
      </div>
    );
  }
  
  // Tamamlanan seansların kaç pakete denk geldiğini hesapla
  const completedPackages = Math.floor(completedSessions / sessionsPerPackage);
  
  // Son paketteki tamamlanan seans sayısı
  const currentPackageCompletedSessions = completedSessions % sessionsPerPackage || 
    (completedSessions > 0 && completedSessions === completedPackages * sessionsPerPackage ? sessionsPerPackage : 0);
  
  // İlerleme yüzdesi (son paket için)
  const progress = (currentPackageCompletedSessions / sessionsPerPackage) * 100;
  
  const isCompleted = progress >= 100;
  
  return (
    <div className={`w-full p-2.5 rounded-lg shadow-sm border transition-colors ${
      theme === 'dark'
        ? 'bg-gray-800/80 border-primary/20 hover:bg-gray-800'
        : 'bg-primary/5 border-primary/10 hover:bg-primary/10'
    }`}>
      <Badge
        variant="outline"
        className={`px-3 py-1 flex items-center gap-2 mb-1.5 font-medium ${
          theme === 'dark'
            ? 'bg-gray-700/80 text-gray-200 border-gray-600'
            : 'bg-background/80'
        }`}
      >
        {totalPackages > 1 && (
          <span className="text-red-500 font-semibold">{totalPackages} ×</span>
        )}
        <span className="mr-auto">
          {service?.name || "Yükleniyor..."}
        </span>
      </Badge>
      <div className="flex items-center gap-2.5">
        <Progress
          value={progress}
          className={cn(
            "h-2.5 rounded-full",
            isCompleted 
              ? theme === 'dark'
                ? "bg-green-800/40 [&>div]:bg-green-500" 
                : "bg-green-100/70 [&>div]:bg-green-600"
              : theme === 'dark'
                ? "bg-gray-700 [&>div]:bg-primary" 
                : "bg-primary/10 [&>div]:bg-primary"
          )}
        />
        <span className={`text-xs whitespace-nowrap flex items-center gap-1.5 font-medium ${
          theme === 'dark' ? 'text-gray-300' : ''
        }`}>
          {currentPackageCompletedSessions}/{sessionsPerPackage}
          {(completedPackages > 0 || isCompleted) && (
            <span className="ml-1.5 flex items-center">
              {isCompleted ? (
                <CheckCircle2 className={`size-4 ml-0.5 ${
                  theme === 'dark' ? 'text-green-500' : 'text-green-600'
                }`} />
              ) : (
                <span className={`text-xs italic ${
                  theme === 'dark' ? 'text-gray-400' : 'text-muted-foreground'
                }`}>
                  ({completedPackages} kez tamamlandı)
                </span>
              )}
            </span>
          )}
        </span>
      </div>
    </div>
  );
};
