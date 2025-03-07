import React from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2 } from "lucide-react";
import cn from "classnames";
import type { Database } from "@/types/supabase";

type Service = Database["public"]["Tables"]["services"]["Row"];

export interface ServiceProgressProps {
  service: Service;
  completedSessions: number;
  totalPackages: number;
}

export const ServiceProgress = ({ service, completedSessions, totalPackages }: ServiceProgressProps) => {
  const sessionsPerPackage = service?.session_count || 0;
  
  // Eğer üye bu paketten sadece 1 tane almışsa ve seans sayısını aşmışsa
  // gerçek tamamlanan seans sayısını göster
  if (totalPackages === 1 && completedSessions > sessionsPerPackage) {
    return (
      <div className="w-full bg-primary/5 p-2.5 rounded-lg shadow-sm border border-primary/10 hover:bg-primary/10 transition-colors">
        <Badge
          variant="outline"
          className="px-3 py-1 flex items-center gap-2 mb-1.5 bg-background/80 font-medium"
        >
          <span className="mr-auto">
            {service?.name || "Yükleniyor..."}
          </span>
        </Badge>
        <div className="flex items-center gap-2.5">
          <Progress
            value={100}
            className="h-2.5 rounded-full bg-green-100/70 [&>div]:bg-green-600"
          />
          <span className="text-xs whitespace-nowrap flex items-center gap-1.5 font-medium">
            {completedSessions}/{sessionsPerPackage}
            <CheckCircle2 className="text-green-600 size-4 ml-0.5" />
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
    <div className="w-full bg-primary/5 p-2.5 rounded-lg shadow-sm border border-primary/10 hover:bg-primary/10 transition-colors">
      <Badge
        variant="outline"
        className="px-3 py-1 flex items-center gap-2 mb-1.5 bg-background/80 font-medium"
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
            isCompleted ? "bg-green-100/70 [&>div]:bg-green-600" : "bg-primary/10 [&>div]:bg-primary"
          )}
        />
        <span className="text-xs whitespace-nowrap flex items-center gap-1.5 font-medium">
          {currentPackageCompletedSessions}/{sessionsPerPackage}
          {(completedPackages > 0 || isCompleted) && (
            <span className="ml-1.5 flex items-center">
              {isCompleted ? (
                <CheckCircle2 className="text-green-600 size-4 ml-0.5" />
              ) : (
                <span className="text-xs text-muted-foreground italic">({completedPackages} kez tamamlandı)</span>
              )}
            </span>
          )}
        </span>
      </div>
    </div>
  );
};
