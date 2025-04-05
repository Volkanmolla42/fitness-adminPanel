import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trainer } from "@/types/appointments";
import React, { useState } from "react";
import { useTheme } from "@/contexts/theme-context";
import { Button } from "@/components/ui/button";
import { Check, FilterX, Search, User2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { Badge } from "@/components/ui/badge";
import DatePickerWithRange from "@/components/ui/date-picker-with-range";

// Filtre tipini tanımla
type FilterType =
  | "today"
  | "tomorrow"
  | "weekly"
  | "monthly"
  | "all"
  | "custom";

interface AppointmentFiltersProps {
  trainers: Trainer[];
  selectedTrainerId: string | null;
  onTrainerChange: (value: string | null) => void;
  activeFilter?: string;
  setActiveFilter?: (filter: FilterType) => void;
  getFilteredCount?: (filter: FilterType) => number;
  viewMode: "list" | "weekly" | "table";
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  startDate?: Date | null;
  endDate?: Date | null;
  onDateRangeChange?: (startDate: Date | null, endDate: Date | null) => void;
}

export function AppointmentFilters({
  trainers,
  selectedTrainerId,
  onTrainerChange,
  activeFilter = "all",
  setActiveFilter = () => {},
  getFilteredCount = () => 0,
  viewMode,
  searchQuery = "",
  onSearchChange = () => {},
  startDate = null,
  endDate = null,
  onDateRangeChange = () => {},
}: AppointmentFiltersProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  // Tarih aralığı için DateRange state'i
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    startDate && endDate
      ? {
          from: startDate,
          to: endDate,
        }
      : undefined
  );

  // Tarih aralığı değiştiğinde state'i güncelle
  React.useEffect(() => {
    if (startDate && endDate) {
      setDateRange({
        from: startDate,
        to: endDate,
      });
    } else {
      setDateRange(undefined);
    }
  }, [startDate, endDate]);

  // Tüm filtreleri sıfırlama fonksiyonu
  const resetAllFilters = () => {
    onTrainerChange(null);
    setActiveFilter("all");
    onSearchChange("");
    onDateRangeChange(null, null);
    setDateRange(undefined);
  };

  // Aktif filtrelerin listesini oluştur
  const activeFilters = [];

  if (selectedTrainerId) {
    const selectedTrainer = trainers.find((t) => t.id === selectedTrainerId);
    if (selectedTrainer) {
      activeFilters.push({
        type: "trainer",
        label: `Antrenör: ${selectedTrainer.first_name} ${selectedTrainer.last_name}`,
      });
    }
  }

  if (searchQuery) {
    activeFilters.push({
      type: "search",
      label: `Arama: ${searchQuery}`,
    });
  }

  if (activeFilter !== "all") {
    const filterLabels = {
      today: "Bugün",
      tomorrow: "Yarın",
      weekly: "Bu Hafta",
      monthly: "Bu Ay",
      custom: "Özel Tarih Aralığı",
    };

    if (activeFilter === "custom" && startDate && endDate) {
      activeFilters.push({
        type: "date",
        label: `Tarih: ${format(startDate, "d MMMM", {
          locale: tr,
        })} - ${format(endDate, "d MMMM", { locale: tr })}`,
      });
    } else {
      activeFilters.push({
        type: "date",
        label: `Tarih: ${
          filterLabels[activeFilter as keyof typeof filterLabels]
        }`,
      });
    }
  }

  return (
    <div className="w-full space-y-3">
      <div className="flex gap-2">
        {/* Antrenör Seçimi */}
        <Select
          defaultOpen
          value={selectedTrainerId || "all"}
          onValueChange={(value) =>
            onTrainerChange(value === "all" ? null : value)
          }
        >
          <SelectTrigger
            className={`transition-colors duration-200 rounded-lg shadow-sm ${
              isDark
                ? "border-gray-700 focus:ring-2 focus:ring-blue-700/20 focus:border-blue-600 bg-gray-700/50 text-gray-100"
                : "border-gray-200 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white"
            }`}
          >
            <SelectValue
              placeholder={
                <div className="flex items-center gap-2">
                  <User2
                    className={`h-4 w-4 ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                  />
                  <span className={isDark ? "text-gray-400" : "text-gray-500"}>
                    Antrenör seç
                  </span>
                </div>
              }
            />
          </SelectTrigger>
          <SelectContent
            className={`flex-1 rounded-lg shadow-lg mt-1 py-1 ${
              isDark
                ? "bg-gray-800 border-gray-700 text-gray-200"
                : "bg-white border-gray-200"
            }`}
          >
            <SelectItem
              value="all"
              className={`${
                isDark
                  ? "focus:bg-gray-700 focus:text-gray-100 data-[state=checked]:bg-gray-700"
                  : "focus:bg-blue-50 focus:text-blue-800 data-[state=checked]:bg-blue-50"
              }`}
            >
              <div className="flex items-center gap-2">
                <User2
                  className={`h-4 w-4 ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                />
                <span>Tüm Antrenörler</span>
                {selectedTrainerId === null && (
                  <Check
                    className={`ml-auto h-4 w-4 ${
                      isDark ? "text-blue-400" : "text-blue-600"
                    }`}
                  />
                )}
              </div>
            </SelectItem>

            {trainers.map((trainer) => (
              <SelectItem
                key={trainer.id}
                value={trainer.id}
                className={`${
                  isDark
                    ? "focus:bg-gray-700 focus:text-gray-100 data-[state=checked]:bg-gray-700"
                    : "focus:bg-blue-50 focus:text-blue-800 data-[state=checked]:bg-blue-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <User2
                    className={`h-4 w-4 ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                  />
                  <span>
                    {trainer.first_name} {trainer.last_name}
                  </span>
                  {selectedTrainerId === trainer.id && (
                    <Check
                      className={`ml-auto h-4 w-4 ${
                        isDark ? "text-blue-400" : "text-blue-600"
                      }`}
                    />
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* Arama Kutusu */}
        {viewMode !== "weekly" && (
          <div className="relative w-full">
            <Search
              className={`absolute left-3 top-2.5 h-4 w-4 ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            />
            <Input
              placeholder="Üye Adı ile Ara.."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className={`pl-9 ${
                isDark
                  ? "bg-gray-700/50 placeholder:italic border-gray-600 text-gray-200 "
                  : "bg-white border-gray-200 "
              }`}
            />
          </div>
        )}
      </div>

      {/* Tarih Filtreleri */}
      {viewMode !== "weekly" && (
        <div
          className={`flex flex-wrap gap-2 ${
            isDark ? "bg-gray-700/50" : "bg-gray-100/70"
          } rounded-lg p-2`}
        >
          {/* Standart filtre butonları */}
          {[
            { id: "today" as FilterType, label: "Bugün" },
            { id: "tomorrow" as FilterType, label: "Yarın" },
            { id: "weekly" as FilterType, label: "Bu Hafta" },
            { id: "monthly" as FilterType, label: "Bu Ay" },
            { id: "all" as FilterType, label: "Tümü" },
          ].map((filter) => (
            <Button
              key={filter.id}
              variant={activeFilter === filter.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter(filter.id)}
              className={`flex-1 ${
                isDark && activeFilter !== filter.id
                  ? "bg-gray-800 py-4 text-gray-300 hover:bg-gray-700"
                  : ""
              }`}
            >
              {filter.label}
              <span
                className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                  isDark ? "bg-primary/30" : "bg-primary/20"
                }`}
              >
                {getFilteredCount(filter.id)}
              </span>
            </Button>
          ))}

          {/* Özel Tarih Aralığı Seçici */}
          <div className="flex-1">
            <DatePickerWithRange
              date={dateRange}
              setDate={(range) => {
                setDateRange(range);
                if (range?.from && range?.to) {
                  onDateRangeChange(range.from, range.to);
                  setActiveFilter("custom");
                }
              }}
              className={`${isDark ? "dark" : ""}`}
            />
          </div>
        </div>
      )}
      {/* Aktif Filtreler ve Temizleme Butonu */}
      {activeFilters.length > 0 && viewMode !== "weekly" && (
        <div
          className={`flex flex-wrap items-center justify-between gap-2 mt-3 p-2 rounded-lg ${
            isDark ? "bg-gray-800/50" : "bg-gray-50"
          }`}
        >
          <div className="flex flex-wrap gap-2 items-center">
            <span
              className={`text-xs font-medium ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Aktif Filtreler:
            </span>
            {activeFilters.map((filter, index) => (
              <Badge
                key={index}
                variant="outline"
                className={`flex items-center gap-1 px-2 py-1 ${
                  isDark
                    ? "bg-gray-700 text-gray-200 border-gray-600"
                    : "bg-white text-gray-700 border-gray-200"
                }`}
              >
                {filter.label}
                <button
                  onClick={() => {
                    if (filter.type === "trainer") onTrainerChange(null);
                    if (filter.type === "search") onSearchChange("");
                    if (filter.type === "date") {
                      setActiveFilter("all");
                      onDateRangeChange(null, null);
                    }
                  }}
                  className={`ml-1 rounded-full p-0.5 hover:bg-gray-200 ${
                    isDark ? "hover:bg-gray-600" : ""
                  }`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={resetAllFilters}
            className={`flex items-center gap-1 ${
              isDark
                ? "bg-gray-700 text-gray-300 hover:bg-gray-600 border-gray-600"
                : "bg-white hover:bg-gray-100"
            }`}
          >
            <FilterX className="h-3.5 w-3.5" />
            <span className="text-xs">Tüm Filtreleri Temizle</span>
          </Button>
        </div>
      )}
    </div>
  );
}
