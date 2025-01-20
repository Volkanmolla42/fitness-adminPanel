import React from "react";
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
  CheckCircle2,
  Activity,
  PackageCheck
} from "lucide-react";

type PackageInfo = {
  name: string;
  totalSessions: number;
  completedSessions: number;
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

export const MemberActivityTable: React.FC<MemberActivityTableProps> = ({ data }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Üye Aktiviteleri
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <div className="flex items-center gap-2">
                  <User2 className="w-4 h-4" />
                  Üye Adı
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Üyelik Başlangıcı
                </div>
              </TableHead>
              <TableHead className="min-w-[300px]">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Paketler
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((activity) => (
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
                  <div className="space-y-2">
                    {activity.packages.map((pkg, index) => (
                      <div key={index} className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/30">
                        <div className="flex items-center gap-2">
                          <PackageCheck className="w-4 h-4 text-primary" />
                          <span className="font-medium">{pkg.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className={`w-4 h-4 ${pkg.completedSessions === pkg.totalSessions ? 'text-green-500' : 'text-muted-foreground'}`} />
                          <span className="text-muted-foreground">
                            {pkg.completedSessions} / {pkg.totalSessions} seans tamamlandı
                          </span>
                        </div>
                      </div>
                    ))}
                    {activity.packages.length === 0 && (
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Package className="w-4 h-4" />
                        <span>Aktif paket yok</span>
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
  );
};
