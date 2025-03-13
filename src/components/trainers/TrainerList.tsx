import { Badge } from "@/components/ui/badge";
import { Trainer } from "@/types";
import { TrainerCard } from "./TrainerCard";
import React from "react";
import { useTheme } from "@/contexts/theme-context";
interface TrainerListProps {
  title: string;
  trainers: Trainer[];
  isBusy?: boolean;
  services?: any[];
  getCurrentAppointment?: (trainerId: string) => any;
  getRemainingMinutes?: (startTime: string, durationMinutes?: number) => number;
  onTrainerSelect: (trainer: Trainer) => void;
}

export const TrainerList: React.FC<TrainerListProps> = ({
  title,
  trainers,
  isBusy,
  services,
  getCurrentAppointment,
  getRemainingMinutes,
  onTrainerSelect,
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3
          className={`font-semibold text-lg ${isBusy ? "text-primary" : ""} ${
            isDark ? "text-gray-200" : ""
          }`}
        >
          {title}
        </h3>
        <Badge variant="secondary" className={isDark ? "bg-gray-700 text-gray-300" : ""}>
          {trainers.length}
        </Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {trainers.map((trainer) => (
          <TrainerCard
            key={trainer.id}
            trainer={trainer}
            isBusy={isBusy}
            currentAppointment={getCurrentAppointment?.(trainer.id)}
            services={services}
            getRemainingMinutes={getRemainingMinutes}
            onClick={() => onTrainerSelect(trainer)}
          />
        ))}
      </div>
    </div>
  );
};

export default TrainerList;
