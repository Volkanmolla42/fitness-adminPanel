import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trainer } from "@/types/appointments";

interface AppointmentFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  trainers: Trainer[];
  selectedTrainerId: string | null;
  onTrainerChange: (value: string | null) => void;
}

export function AppointmentFilters({
  searchQuery,
  onSearchChange,
  trainers,
  selectedTrainerId,
  onTrainerChange,
}: AppointmentFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          placeholder="Ara..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 w-full"
        />
      </div>
      <Select
        value={selectedTrainerId || "all"}
        onValueChange={(value) => onTrainerChange(value === "all" ? null : value)}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Eğitmen seç" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tüm Eğitmenler</SelectItem>
          {trainers.map((trainer) => (
            <SelectItem key={trainer.id} value={trainer.id}>
              {trainer.first_name} {trainer.last_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
