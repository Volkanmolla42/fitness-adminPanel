import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  User2,
  Calendar,
  Package,
  PackageCheck,
  AlertCircle,
  ArrowUpDown,
  Search,
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
  status: "active" | "completed";
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

const getStatusColor = (status: PackageInfo["status"]) => {
  switch (status) {
    case "active":
      return "bg-green-500/10 text-green-500 border-green-500/20";
    case "completed":
      return "bg-blue-500/10 text-blue-500 border-blue-500/20";
  }
};

const getStatusText = (status: PackageInfo["status"]) => {
  switch (status) {
    case "active":
      return "Devam Ediyor";
    case "completed":
      return "Tamamlandı";
  }
};

type SortConfig = {
  key: "memberName" | "startDate" | null;
  direction: "asc" | "desc";
};

export const MemberActivityTable: React.FC<MemberActivityTableProps> = ({
  data,
}) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: null,
    direction: "asc",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [showMemberActivities, setShowMemberActivities] = useState(false);

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
        const multiplier = sortConfig.direction === "asc" ? 1 : -1;

        if (sortConfig.key === "memberName") {
          return multiplier * a.memberName.localeCompare(b.memberName);
        }

        if (sortConfig.key === "startDate") {
          return (
            multiplier *
            (new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
          );
        }

        return 0;
      });
    }

    return filteredData;
  }, [data, sortConfig, searchQuery]);

  const sortData = (field: "memberName" | "startDate") => {
    if (field === sortConfig.key) {
      setSortConfig({
        key: field,
        direction: sortConfig.direction === "asc" ? "desc" : "asc",
      });
    } else {
      setSortConfig({ key: field, direction: "asc" });
    }
  };

  return (
    <Card className="col-span-2 ">
      <div>
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center gap-2">
            <PackageCheck className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">Üye Aktiviteleri</h2>
          </div>
          <Button
            onClick={() => setShowMemberActivities(!showMemberActivities)}
            variant="default"
            size="sm"
          >
            {showMemberActivities ? "Gizle" : "Göster"}
          </Button>
        </div>
        {showMemberActivities && (
          <CardContent className="p-6">
            {/* Arama kutusu */}
            <div className="relative mb-6">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Üye ara..."
                className="pl-8 max-w-sm bg-background border-border"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="rounded-md border">
              <Table className="bg-background">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => sortData("memberName")}
                        className="flex items-center gap-2 font-semibold -ml-4"
                      >
                        <User2 className="w-4 h-4" />
                        Üye Adı
                        <ArrowUpDown className="w-4 h-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => sortData("startDate")}
                        className="flex items-center gap-2 font-semibold -ml-4"
                      >
                        <Calendar className="w-4 h-4" />
                        Üyelik Başlangıcı
                        <ArrowUpDown className="w-4 h-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="min-w-[500px]">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Paketler
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedData.map((activity) => (
                    <TableRow
                      key={activity.memberId}
                      className="hover:bg-muted/50"
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <User2 className="w-4 h-4 text-muted-foreground" />
                          {activity.memberName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {format(new Date(activity.startDate), "d MMMM yyyy", {
                            locale: tr,
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-3">
                          {activity.packages.map((pkg, index) => {
                            return (
                              <div
                                key={index}
                                className="space-y-2 p-4 rounded-lg border bg-card shadow-sm"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <PackageCheck className="w-4 h-4 text-primary" />
                                    <span className="font-medium">
                                      {pkg.name}
                                      {pkg.completionCount > 0 && (
                                        <Badge
                                          variant="secondary"
                                          className="ml-2 bg-primary/10 text-primary hover:bg-primary/20"
                                        >
                                          ({pkg.completionCount} kez tamamlandı)
                                        </Badge>
                                      )}
                                    </span>
                                  </div>
                                  <Badge className={getStatusColor(pkg.status)}>
                                    {getStatusText(pkg.status)}
                                  </Badge>
                                </div>

                                <div className="space-y-1">
                                  <div className="flex justify-between items-center">
                                    <span>
                                      <span className="text-lg font-semibold">
                                        {pkg.completedSessions}
                                      </span>
                                      <span className="text-sm text-muted-foreground">
                                        / {pkg.totalSessions} seans
                                      </span>
                                    </span>
                                    <span className="text-sm font-medium">
                                      {Math.round(
                                        (pkg.completedSessions /
                                          pkg.totalSessions) *
                                          100
                                      )}
                                      %
                                    </span>
                                  </div>
                                  <Progress
                                    value={
                                      (pkg.completedSessions /
                                        pkg.totalSessions) *
                                      100
                                    }
                                    className="h-2 bg-primary/20"
                                  />
                                </div>
                              </div>
                            );
                          })}
                          {activity.packages.length === 0 && (
                            <div className="flex items-center gap-2 text-muted-foreground text-sm p-4 rounded-lg border bg-card/50">
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
            </div>
          </CardContent>
        )}
      </div>
    </Card>
  );
};
