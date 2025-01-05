import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trainer } from "@/types";

interface DeleteTrainerDialogProps {
  trainer: Trainer | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string) => void;
}

export const DeleteTrainerDialog = ({
  trainer,
  isOpen,
  onClose,
  onConfirm,
}: DeleteTrainerDialogProps) => {
  if (!trainer) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eğitmeni Sil</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-medium text-primary">
              {trainer.first_name} {trainer.last_name}
            </span>{" "}
            isimli eğitmeni silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve
            eğitmenin tüm randevu geçmişi silinecektir.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>İptal</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onConfirm(trainer.id);
              onClose();
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Sil
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
