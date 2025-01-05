import { Input } from "@/components/ui/input";
import { Search} from "lucide-react";

interface AppointmentFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export function AppointmentFilters({
  searchQuery,
  onSearchChange,
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
      
    </div>
  );
}
