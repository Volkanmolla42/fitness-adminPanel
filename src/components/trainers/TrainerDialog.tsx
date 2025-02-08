import {
  Award,
  Calendar,
  CalendarDays,
  Clock,
  FileText,
  Mail,
  Phone,
  Pencil,
  Trash2,
  User2,
  History,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trainer } from "@/types";
import React,{ useState } from "react";
import { DeleteTrainerDialog } from "./DeleteTrainerDialog";
import { TrainerAppointmentHistoryDialog } from "./TrainerAppointmentHistoryDialog";

interface TrainerDialogProps {
  trainer: Trainer | null;
  onClose: () => void;
  onEdit: (trainer: Trainer) => void;
  onDelete: (id: string) => void;
  getTrainerAppointments: (trainerId: string) => any[];
}

export const TrainerDialog = ({
  trainer,
  onClose,
  onEdit,
  onDelete,
  getTrainerAppointments,
}: TrainerDialogProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);

  if (!trainer) return null;

  const appointments = getTrainerAppointments(trainer.id);

  return (
    <>
      <Dialog open={!!trainer} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader className="border-b pb-3">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-lg font-semibold text-primary">
                {trainer.first_name && trainer.last_name ? (
                  <span>
                    {trainer.first_name.charAt(0).toUpperCase()}
                    {trainer.last_name.charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <Award className="w-8 h-8 text-primary" />
                )}
              </div>

              <div className="flex-1">
                <DialogTitle className="text-lg mb-1">
                  {trainer.first_name} {trainer.last_name}
                </DialogTitle>
                <div className="flex flex-wrap gap-1">
                  {trainer.categories?.map((category) => (
                    <Badge
                      key={category}
                      variant="outline"
                      className="text-xs px-1.5 py-0"
                    >
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="py-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="space-y-2 bg-secondary/20 p-2 rounded-lg">
                <h4 className="font-medium text-xs uppercase tracking-wider text-secondary-foreground/70 flex items-center gap-1">
                  <User2 className="w-3 h-3" />
                  İletişim
                </h4>
                <div className="space-y-1">
                  <div className="flex items-center text-xs">
                    <Mail className="w-3 h-3 mr-1.5 text-blue-500" />
                    <span className="truncate">{trainer.email}</span>
                  </div>
                  <div className="flex items-center text-xs">
                    <Phone className="w-3 h-3 mr-1.5 text-green-500" />
                    <span>{trainer.phone}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 bg-primary/10 p-2 rounded-lg">
                <h4 className="font-medium text-xs uppercase tracking-wider text-primary/70 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Çalışma
                </h4>
                <div className="space-y-1">
                  <div className="flex items-center text-xs">
                    <Clock className="w-3 h-3 mr-1.5 text-purple-500" />
                    <span>
                      {trainer.working_hours?.start || "10:00"} -{" "}
                      {trainer.working_hours?.end || "19:00"}
                    </span>
                  </div>
                  <div className="flex items-center text-xs">
                    <CalendarDays className="w-3 h-3 mr-1.5 text-indigo-500" />
                    <span>
                      {new Date(trainer.start_date).toLocaleDateString("tr-TR")}
                    </span>
                  </div>
                </div>
              </div>

              {trainer.bio && (
                <div className="col-span-2 space-y-1 bg-muted/50 p-2 rounded-lg">
                  <h4 className="font-medium text-xs uppercase tracking-wider text-muted-foreground/70 flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    Biyografi
                  </h4>
                  <p className="text-xs leading-relaxed">{trainer.bio}</p>
                </div>
              )}

              <div className="col-span-2 flex justify-between items-center bg-accent/20 p-2 rounded-lg">
                <div className="space-y-1">
                  <h4 className="font-medium text-xs uppercase tracking-wider text-accent-foreground/70 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Aktif Randevular
                  </h4>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-semibold text-accent-foreground">
                      {
                        appointments.filter(
                          (a) =>
                            a.status === "scheduled" ||
                            a.status === "in-progress"
                        ).length
                      }
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsHistoryDialogOpen(true);
                      }}
                      className="h-8 text-xs"
                    >
                      <History className="w-3 h-3 mr-1" />
                      Geçmiş
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(trainer)}
                    className="h-8"
                  >
                    <Pencil className="w-3 h-3 mr-1" />
                    Düzenle
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="h-8"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Sil
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteTrainerDialog
        trainer={trainer}
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={onDelete}
      />

      <TrainerAppointmentHistoryDialog
        trainer={trainer}
        appointments={appointments}
        isOpen={isHistoryDialogOpen}
        onClose={() => setIsHistoryDialogOpen(false)}
      />
    </>
  );
};
