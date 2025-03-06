import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trainer } from "@/types/appointments";
import { useState } from "react";
import React from "react";
interface AppointmentFiltersProps {
  trainers: Trainer[];
  selectedTrainerId: string | null;
  onTrainerChange: (value: string | null) => void;
}

export function AppointmentFilters({
  trainers,
  selectedTrainerId,
  onTrainerChange,
}: AppointmentFiltersProps) {
  const [open, setOpen] = useState<boolean>(true);
  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
  <Select
    open={open}
    onOpenChange={setOpen}
    value={selectedTrainerId || "all"}
    onValueChange={(value) =>
      onTrainerChange(value === "all" ? null : value)
    }
  >
    <SelectTrigger 
      autoFocus 
      className="w-full sm:w-[220px]  border-blue-500 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-colors duration-200 bg-white rounded-lg shadow-sm"
    >
      <SelectValue 
        placeholder={
          <span className="text-gray-500">Antrenör seç</span>
        } 
      />
    </SelectTrigger>
    <SelectContent className="rounded-lg shadow-lg border border-gray-200 bg-white mt-1 py-1">
      <SelectItem 
        value="all" 
        className="font-semibold text-gray-900 hover:bg-blue-50 active:bg-blue-100 focus:bg-blue-50 px-4 py-2"
      >
        Tüm Antrenörler
      </SelectItem>
      {trainers.map((trainer) => (
        <SelectItem 
          key={trainer.id} 
          value={trainer.id}
          className="text-gray-700 hover:text-gray-900 hover:bg-blue-50 active:bg-blue-100 focus:bg-blue-50 px-4 py-2 transition-colors duration-200"
        >
          <span className="block truncate">
            {trainer.first_name} {trainer.last_name}
          </span>
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
  );
}
