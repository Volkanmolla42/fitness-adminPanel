import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter } from "lucide-react";

interface AppointmentFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onFilterClick: () => void;
}

export function AppointmentFilters({
  searchQuery,
  onSearchChange,
  onFilterClick,
}: AppointmentFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          placeholder="Üye, eğitmen, hizmet, not, tarih, veya saat ara... "
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 w-full"
        />
      </div>
      <Button
        variant="outline"
        onClick={onFilterClick}
        className="w-full sm:w-auto"
      >
        <Filter className="mr-2 h-4 w-4" />
        Filtrele
      </Button>
    </div>
  );
}
