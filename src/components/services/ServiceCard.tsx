import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Timer, User2, Calendar, Pencil, Trash2 } from "lucide-react";
import type { Database } from "@/types/supabase";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/theme-context";

type Service = Database["public"]["Tables"]["services"]["Row"];

interface ServiceCardProps {
  service: Service;
  onEdit: (service: Service) => void;
  onDelete: (id: string) => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onEdit,
  onDelete,
}) => {
  const { theme } = useTheme();

  return (
    <Card className={`border ${!service.active
        ? 'opacity-60'
        : ''
      } ${theme === 'dark' ? 'border-gray-800 hover:border-destructive/70' : 'border-gray-100 hover:border-destructive/50'} transition-all hover:shadow-md group relative p-5`}>
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className={`text-xl tracking-tight font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                {service.name}
              </h3>
              {!service.active && (
                <Badge variant="secondary" className="text-[11px] font-medium">
                  Pasif
                </Badge>
              )}
            </div>

            {service.isVipOnly && (
              <Badge variant="destructive" className="opacity-90 absolute top-3 right-3 text-[11px] font-medium uppercase tracking-wider">
                VIP
              </Badge>
            )}
            <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} pr-4`}>{service.description}</p>
          </div>
        </div>

        <div className={`flex items-center gap-2.5 text-destructive border-t border-b ${theme === 'dark' ? 'border-gray-800' : 'border-gray-100'} py-3 my-1`}>
          <Calendar className="h-4 w-4" />
          <span className="text-sm font-medium">{service.session_count} Ders</span>
          <span className="font-semibold text-xl tracking-tight ml-auto">₺{service.price.toLocaleString('tr-TR')}</span>
        </div>

        <div className={`flex items-center gap-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4" />
            <span className="text-sm font-medium">{service.duration} dk</span>
          </div>
          <div className="flex items-center gap-2">
            <User2 className="h-4 w-4" />
            <span className="text-sm font-medium">{service.max_participants} kişi</span>
          </div>
        </div>

        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(service)}
            className={`h-8 w-8 p-0 ${theme === 'dark' ? 'hover:bg-destructive/20' : 'hover:text-green-500 hover:bg-destructive/10'}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 w-8 p-0 text-destructive ${theme === 'dark' ? 'hover:bg-destructive/20' : 'hover:bg-destructive/10'}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Paketi Sil</AlertDialogTitle>
                <AlertDialogDescription className="text-sm text-red-500">
                  {service.name} paketini silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve sistemde ciddi aksaklıklara neden olabilir. Lütfen silme işlemi öncesinde pakete bağlı randevu ve üyelikleri kontrol ettiğinizden emin olun.
                  <br />
                  Silmek yerine pasife almanız önerilir.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(service.id)}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Sil
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </Card>
  );
};
