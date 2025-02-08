import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { 
  User2, 
  Calendar,
  Package, 
  Activity,
  PackageCheck,
  AlertCircle,
  ArrowUpDown,
  Search
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type PackageInfo = {
  name: string;
  totalSessions: number;
  completedSessions: number;
  startDate: Date;
  status: 'active' | 'completed';
  completionCount?: number; // Paketin kaç kez tamamlandığı
};

type MemberActivity = {
  memberId: string;
  memberName: string;
  startDate: Date;
  packages: PackageInfo[];
};

interface MemberActivityTableProps {
  data: MemberActivity[];
}

const getStatusColor = (status: PackageInfo['status']) => {
  switch (status) {
    case 'active':
      return 'bg-green-500/10 text-green-500 border-green-500/20';
    case 'completed':
      return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
  }
};

const getStatusText = (status: PackageInfo['status']) => {
  switch (status) {
    case 'active':
      return 'Devam Ediyor';
    case 'completed':
      return 'Tamamlandı';
  }
};

type SortConfig = {
  key: 'memberName' | 'startDate' | null;
  direction: 'asc' | 'desc';
};

export const MemberActivityTable: React.FC<MemberActivityTableProps> = ({ data }) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: null,
    direction: "asc",
  });
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAndSortedData = useMemo(() => {
    // Önce arama filtresini uygula
    let filteredData = data;
    if (searchQuery) {
      filteredData = data.filter((item) =>
        item.memberName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sonra sıralama yap
    if (sortConfig.key) {
      return [...filteredData].sort((a, b) => {
        const multiplier = sortConfig.direction === 'asc' ? 1 : -1;
        
        if (sortConfig.key === 'memberName') {
          return multiplier * a.memberName.localeCompare(b.memberName);
        }
        
        if (sortConfig.key === 'startDate') {
          return multiplier * (new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        }
        
        return 0;
      });
    }

    return filteredData;
  }, [data, sortConfig, searchQuery]);

  const sortData = (field: 'memberName' | 'startDate') => {
    if (field === sortConfig.key) {
      setSortConfig({ key: field, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' });
    } else {
      setSortConfig({ key: field, direction: 'asc' });
    }
  };

  return (
    <div className="space-y-4">
     

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Üye Aktiviteleri
          </CardTitle>
        </CardHeader>
        
        <CardContent>
           {/* Arama kutusu */}
      <div className="relative">
        <Search className="absolute  left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Üye ara..."
          className="pl-8 bg-zinc-200/60"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => sortData('memberName')}
                    className="flex items-center gap-2 font-semibold"
                  >
                    <User2 className="w-4 h-4" />
                    Üye Adı
                    <ArrowUpDown className="w-4 h-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => sortData('startDate')}
                    className="flex items-center gap-2 font-semibold"
                  >
                    <Calendar className="w-4 h-4" />
                    Üyelik Başlangıcı
                    <ArrowUpDown className="w-4 h-4" />
                  </Button>
                </TableHead>
                <TableHead className="min-w-[400px]">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Paketler
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedData.map((activity) => (
                <TableRow key={activity.memberId}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <User2 className="w-4 h-4 text-muted-foreground" />
                      {activity.memberName}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      {format(new Date(activity.startDate), "d MMMM yyyy", { locale: tr })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-3">
                      {activity.packages.map((pkg, index) => {
                        return (
                          <div key={index} className="space-y-2 p-3 rounded-md bg-muted/30">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <PackageCheck className="w-4 h-4 text-primary" />
                                <span className="font-medium">
                                  {pkg.name}
                                  {pkg.completionCount > 0 && (
                                    <span className="ml-2 text-sm text-primary">
                                      ({pkg.completionCount} kez tamamlandı)
                                    </span>
                                  )}
                                </span>
                              </div>
                              <Badge className={getStatusColor(pkg.status)}>
                                {getStatusText(pkg.status)}
                              </Badge>
                            </div>
                            
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm text-muted-foreground">
                                <span>{pkg.completedSessions} / {pkg.totalSessions} seans</span>
                                <span>{Math.round((pkg.completedSessions / pkg.totalSessions) * 100)}%</span>
                              </div>
                              <Progress value={(pkg.completedSessions / pkg.totalSessions) * 100} className="h-2" />
                            </div>
                          </div>
                        );
                      })}
                      {activity.packages.length === 0 && (
                        <div className="flex items-center gap-2 text-muted-foreground text-sm p-3 rounded-md bg-muted/30">
                          <AlertCircle className="w-4 h-4" />
                          <span>Aktif paket bulunmuyor</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
