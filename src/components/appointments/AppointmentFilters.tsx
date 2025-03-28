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
import {
  Calendar,
  Check,
  ChevronDown,
  FilterX,
  Search,
  User2,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface AppointmentFiltersProps {
  trainers: Trainer[];
  selectedTrainerId: string | null;
  onTrainerChange: (value: string | null) => void;
  activeFilter?: string;
  setActiveFilter?: (
    filter: "today" | "tomorrow" | "weekly" | "monthly" | "all" | "custom"
  ) => void;
  getFilteredCount?: (
    filter: "today" | "tomorrow" | "weekly" | "monthly" | "all" | "custom"
  ) => number;
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
  const [isDateRangeOpen, setIsDateRangeOpen] = useState(false);

  // Tüm filtreleri sıfırlama fonksiyonu
  const resetAllFilters = () => {
    onTrainerChange(null);
    setActiveFilter("all");
    onSearchChange("");
    onDateRangeChange(null, null);
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
        label: `Tarih: ${format(startDate, "d MMM", { locale: tr })} - ${format(
          endDate,
          "d MMM",
          { locale: tr }
        )}`,
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
          } rounded-lg p-1`}
        >
          <Button
            variant={activeFilter === "today" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter("today")}
            className={`flex-1 ${
              isDark && activeFilter !== "today"
                ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                : ""
            }`}
          >
            Bugün
            <span
              className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                isDark ? "bg-primary/30" : "bg-primary/20"
              }`}
            >
              {getFilteredCount("today")}
            </span>
          </Button>
          <Button
            variant={activeFilter === "tomorrow" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter("tomorrow")}
            className={`flex-1 ${
              isDark && activeFilter !== "tomorrow"
                ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                : ""
            }`}
          >
            Yarın
            <span
              className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                isDark ? "bg-primary/30" : "bg-primary/20"
              }`}
            >
              {getFilteredCount("tomorrow")}
            </span>
          </Button>
          <Button
            variant={activeFilter === "weekly" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter("weekly")}
            className={`flex-1 ${
              isDark && activeFilter !== "weekly"
                ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                : ""
            }`}
          >
            Bu Hafta
            <span
              className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                isDark ? "bg-primary/30" : "bg-primary/20"
              }`}
            >
              {getFilteredCount("weekly")}
            </span>
          </Button>
          <Button
            variant={activeFilter === "monthly" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter("monthly")}
            className={`flex-1 ${
              isDark && activeFilter !== "monthly"
                ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                : ""
            }`}
          >
            Bu Ay
            <span
              className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                isDark ? "bg-primary/30" : "bg-primary/20"
              }`}
            >
              {getFilteredCount("monthly")}
            </span>
          </Button>
          <Button
            variant={activeFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter("all")}
            className={`flex-1 ${
              isDark && activeFilter !== "all"
                ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                : ""
            }`}
          >
            Tümü
            <span
              className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                isDark ? "bg-primary/30" : "bg-primary/20"
              }`}
            >
              {getFilteredCount("all")}
            </span>
          </Button>
          {/* Özel Tarih Aralığı Seçici */}
          <div className="flex-1">
            <Popover open={isDateRangeOpen} onOpenChange={setIsDateRangeOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant={activeFilter === "custom" ? "default" : "outline"}
                  size="sm"
                  className={`flex-1 ${
                    isDark && activeFilter !== "custom"
                      ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      : ""
                  }`}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {activeFilter === "custom" && startDate && endDate
                    ? `${format(startDate, "d MMM", { locale: tr })} - ${format(
                        endDate,
                        "d MMM",
                        { locale: tr }
                      )}`
                    : "Özel Tarih Aralığı"}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className={`p-4 ${
                  isDark ? "bg-gray-800 border-gray-700" : "bg-white"
                }`}
                align="center"
                sideOffset={5}
              >
                <div className="grid gap-4 max-w-md">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4
                        className={`font-medium ${
                          isDark ? "text-gray-200" : "text-gray-700"
                        }`}
                      >
                        Tarih Aralığı Seç
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          onDateRangeChange(null, null);
                        }}
                        className={`px-2 h-7 text-xs ${
                          isDark
                            ? "text-gray-400 hover:text-gray-300 hover:bg-gray-700"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        Temizle
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label
                          className={`text-xs ${
                            isDark ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Başlangıç Tarihi
                        </Label>
                        <div className="relative">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={`w-full justify-start text-left font-normal text-sm h-9 ${
                                  isDark
                                    ? "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                                    : "bg-white hover:bg-gray-50"
                                }`}
                              >
                                {startDate
                                  ? format(startDate, "d MMM yyyy", {
                                      locale: tr,
                                    })
                                  : "Tarih seçin"}
                                {startDate && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className={`absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 ${
                                      isDark
                                        ? "text-gray-400 hover:text-gray-300 hover:bg-gray-600"
                                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                    }`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDateRangeChange(null, endDate);
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              className={`w-auto p-0 ${
                                isDark
                                  ? "bg-gray-800 border-gray-700"
                                  : "bg-white"
                              }`}
                              align="start"
                            >
                              <CalendarComponent
                                mode="single"
                                selected={startDate || undefined}
                                onSelect={(date) => {
                                  onDateRangeChange(date, endDate);
                                  if (date && (!endDate || date > endDate)) {
                                    onDateRangeChange(date, date);
                                  }
                                }}
                                locale={tr}
                                className={`rounded-md border-0 shadow-sm ${
                                  isDark ? "bg-gray-800" : "bg-white"
                                }`}
                                showOutsideDays
                                fixedWeeks
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label
                          className={`text-xs ${
                            isDark ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Bitiş Tarihi
                        </Label>
                        <div className="relative">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={`w-full justify-start text-left font-normal text-sm h-9 ${
                                  isDark
                                    ? "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                                    : "bg-white hover:bg-gray-50"
                                }`}
                              >
                                {endDate
                                  ? format(endDate, "d MMM yyyy", {
                                      locale: tr,
                                    })
                                  : "Tarih seçin"}
                                {endDate && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className={`absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 ${
                                      isDark
                                        ? "text-gray-400 hover:text-gray-300 hover:bg-gray-600"
                                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                    }`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDateRangeChange(startDate, null);
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              className={`w-auto p-0 ${
                                isDark
                                  ? "bg-gray-800 border-gray-700"
                                  : "bg-white"
                              }`}
                              align="start"
                            >
                              <CalendarComponent
                                mode="single"
                                selected={endDate || undefined}
                                onSelect={(date) => {
                                  onDateRangeChange(startDate, date);
                                  if (
                                    date &&
                                    (!startDate || date < startDate)
                                  ) {
                                    onDateRangeChange(date, date);
                                  }
                                }}
                                locale={tr}
                                className={`rounded-md border-0 shadow-sm ${
                                  isDark ? "bg-gray-800" : "bg-white"
                                }`}
                                showOutsideDays
                                fixedWeeks
                                fromDate={startDate || undefined}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => {
                      if (startDate && endDate) {
                        setActiveFilter("custom");
                        setIsDateRangeOpen(false);
                      }
                    }}
                    disabled={!startDate || !endDate}
                    className={`w-full ${
                      isDark && (!startDate || !endDate) ? "opacity-50" : ""
                    }`}
                  >
                    Tarihleri Uygula
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
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
