import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, FilterX } from "lucide-react";
import DatePickerWithRange from "@/components/ui/date-picker-with-range";
import { DateRange } from "react-day-picker";

interface PaymentFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  dateRange: DateRange | undefined;
  setDateRange: (value: DateRange | undefined) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
}

export const PaymentFilters: React.FC<PaymentFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  dateRange,
  setDateRange,
  clearFilters,
  hasActiveFilters,
}) => {
  return (
    <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-900 dark:text-white" />
        <Input
          placeholder="Üye ara..."
          className="pl-8 w-full md:w-[180px] text-[14px] text-gray-900 dark:text-white"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <DatePickerWithRange date={dateRange} setDate={setDateRange} />
      <Button
        variant="outline"
        className="md:h-10 text-[14px]"
        onClick={clearFilters}
        disabled={!hasActiveFilters}
      >
        <FilterX className="mr-2 h-4 w-4" /> Filtreleri Temizle
      </Button>
    </div>
  );
}; 