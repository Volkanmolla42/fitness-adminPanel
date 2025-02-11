import { Badge } from "@/components/ui/badge";
import { Trainer } from "@/types";
import { TrainerCard } from "./TrainerCard";
import React from "react";
interface TrainerListProps {
  title: string;
  trainers: Trainer[];
  isBusy?: boolean;
  services?: any[];
  getCurrentAppointment?: (trainerId: string) => any;
  getRemainingMinutes?: (startTime: string, durationMinutes?: number) => number;
  onTrainerSelect: (trainer: Trainer) => void;
}

export const TrainerList = ({
  title,
  trainers,
  isBusy,
  services,
  getCurrentAppointment,
  getRemainingMinutes,
  onTrainerSelect,
}: TrainerListProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className={`font-semibold text-lg ${isBusy ? "text-primary" : ""}`}>
          {title}
        </h3>
        <Badge variant="secondary">{trainers.length}</Badge>
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
