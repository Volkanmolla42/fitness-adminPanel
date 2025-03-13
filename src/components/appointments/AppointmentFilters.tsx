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
import { useTheme } from "@/contexts/theme-context";

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
  const { theme } = useTheme();
  const isDark = theme === "dark";

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
          className={`w-full sm:w-[220px] transition-colors duration-200 rounded-lg shadow-sm ${
            isDark 
              ? "border-blue-700 focus:ring-2 focus:ring-blue-700/20 focus:border-blue-600 bg-gray-800 text-gray-100" 
              : "border-blue-500 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white"
          }`}
        >
          <SelectValue 
            placeholder={
              <span className={isDark ? "text-gray-400" : "text-gray-500"}>Antrenör seç</span>
            } 
          />
        </SelectTrigger>
        <SelectContent className={`rounded-lg shadow-lg mt-1 py-1 ${
          isDark 
            ? "border-gray-700 bg-gray-800" 
            : "border-gray-200 bg-white"
        }`}>
          <SelectItem 
            value="all" 
            className={`font-semibold px-4 py-2 ${
              isDark 
                ? "text-gray-100 hover:bg-gray-700 active:bg-gray-600 focus:bg-gray-700" 
                : "text-gray-900 hover:bg-blue-50 active:bg-blue-100 focus:bg-blue-50"
            }`}
          >
            Tüm Antrenörler
          </SelectItem>
          {trainers.map((trainer) => (
            <SelectItem 
              key={trainer.id} 
              value={trainer.id}
              className={`px-4 py-2 transition-colors duration-200 ${
                isDark 
                  ? "text-gray-300 hover:text-gray-100 hover:bg-gray-700 active:bg-gray-600 focus:bg-gray-700" 
                  : "text-gray-700 hover:text-gray-900 hover:bg-blue-50 active:bg-blue-100 focus:bg-blue-50"
              }`}
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
