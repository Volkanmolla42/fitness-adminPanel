import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ServiceSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  membershipFilter: "all" | "vip" | "standard";
  onFilterChange: (value: "all" | "vip" | "standard") => void;
}

export const ServiceSearch: React.FC<ServiceSearchProps> = ({
  searchTerm,
  onSearchChange,
  membershipFilter,
  onFilterChange,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Hizmet adı veya üyelik tipi ile ara..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8"
        />
      </div>
      <Select
        value={membershipFilter}
        onValueChange={onFilterChange}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Üyelik tipine göre filtrele" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tümü</SelectItem>
          <SelectItem value="vip">VIP</SelectItem>
          <SelectItem value="standard">Standart</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
