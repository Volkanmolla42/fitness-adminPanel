import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Database } from "@/types/supabase";

type MemberPayment = Database["public"]["Tables"]["member_payments"]["Row"];
type Member = Database["public"]["Tables"]["members"]["Row"];
type Service = Database["public"]["Tables"]["services"]["Row"];

// Props type for EditPaymentDialog
interface EditPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  payment: MemberPayment | null;
  onSubmit: () => void;
  formData: {
    member_name: string;
    credit_card_paid: string;
    cash_paid: string;
    created_at: string;
    package_name: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    member_name: string;
    credit_card_paid: string;
    cash_paid: string;
    created_at: string;
    package_name: string;
  }>>;
  isLoading: boolean;
  members: Member[];
  selectedMemberPackages: Service[];
  fetchMemberPackages: (memberName: string) => void;
}

// Props type for DeletePaymentDialog
interface DeletePaymentDialogProps {
  payment: MemberPayment | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

// Props type for AddPaymentDialog
interface AddPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  isLoading: boolean;
  newPayment: {
    member_name: string;
    credit_card_paid: string;
    cash_paid: string;
    created_at: string;
    package_name: string;
  };
  setNewPayment: React.Dispatch<React.SetStateAction<{
    member_name: string;
    credit_card_paid: string;
    cash_paid: string;
    created_at: string;
    package_name: string;
  }>>;
  members: Member[];
  selectedMemberPackages: Service[];
  fetchMemberPackages: (memberName: string) => void;
}

// Edit Payment Dialog Component
export const EditPaymentDialog: React.FC<EditPaymentDialogProps> = ({ 
  isOpen, 
  onClose, 
  payment, 
  onSubmit, 
  formData, 
  setFormData, 
  isLoading, 
  members, 
  selectedMemberPackages,
  fetchMemberPackages 
}) => {
  if (!payment) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="text-[110%]">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">Ödeme Düzenle</DialogTitle>
          <DialogDescription className="text-gray-900 dark:text-white">
            Ödeme bilgilerini düzenlemek için aşağıdaki formu doldurun
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label
              htmlFor="member_name"
              className="text-right text-gray-900 dark:text-white"
            >
              Üye Adı
            </Label>
            <Select
              value={formData.member_name}
              onValueChange={(value) => {
                setFormData({
                  ...formData,
                  member_name: value,
                  package_name: "",
                });
                fetchMemberPackages(value);
              }}
            >
              <SelectTrigger className="col-span-3 text-gray-900 dark:text-white">
                <SelectValue placeholder="Üye seçin" />
              </SelectTrigger>
              <SelectContent>
                {members.map((member) => (
                  <SelectItem
                    key={member.id}
                    value={`${member.first_name} ${member.last_name}`}
                    className="text-[14px]"
                  >
                    {`${member.first_name} ${member.last_name}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label
              htmlFor="package_name"
              className="text-right text-gray-900 dark:text-white"
            >
              Paket Adı
            </Label>
            <Select
              value={formData.package_name}
              onValueChange={(value) =>
                setFormData({ ...formData, package_name: value })
              }
            >
              <SelectTrigger className="col-span-3 text-gray-900 dark:text-white">
                <SelectValue placeholder="Paket seçin" />
              </SelectTrigger>
              <SelectContent>
                {selectedMemberPackages.map((pkg) => (
                  <SelectItem
                    key={pkg.id}
                    value={pkg.name}
                    className="text-[14px]"
                  >
                    {pkg.name} - {pkg.price}₺
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label
              htmlFor="credit_card_paid"
              className="text-right text-gray-900 dark:text-white"
            >
              Kredi Kartı
            </Label>
            <Input
              id="credit_card_paid"
              type="number"
              min="0"
              placeholder="Kredi Kartı"
              value={formData.credit_card_paid}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  credit_card_paid:
                    e.target.value === "" ? "0" : e.target.value,
                })
              }
              className="col-span-3 text-gray-900 dark:text-white"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label
              htmlFor="cash_paid"
              className="text-right text-gray-900 dark:text-white"
            >
              Nakit
            </Label>
            <Input
              id="cash_paid"
              type="number"
              min="0"
              placeholder="Nakit"
              value={formData.cash_paid}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  cash_paid: e.target.value === "" ? "0" : e.target.value,
                })
              }
              className="col-span-3 text-gray-900 dark:text-white"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label
              htmlFor="created_at"
              className="text-right text-gray-900 dark:text-white"
            >
              Ödeme Tarihi
            </Label>
            <Input
              id="created_at"
              type="date"
              placeholder="Ödeme Tarihi"
              value={formData.created_at}
              onChange={(e) =>
                setFormData({ ...formData, created_at: e.target.value })
              }
              className="col-span-3 text-gray-900 dark:text-white"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose} variant="outline" className="text-[14px]">
            İptal
          </Button>
          <Button
            type="submit"
            onClick={onSubmit}
            disabled={isLoading}
            className="text-[14px]"
          >
            {isLoading ? "Güncelleniyor..." : "Güncelle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Delete Payment Dialog Component
export const DeletePaymentDialog: React.FC<DeletePaymentDialogProps> = ({ 
  payment, 
  isOpen, 
  onClose, 
  onConfirm, 
  isLoading 
}) => {
  if (!payment) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="text-[110%]">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">Ödemeyi Sil</DialogTitle>
          <DialogDescription className="text-gray-900 dark:text-white">
            Bu ödemeyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="text-[14px]"
          >
            İptal
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
            className="text-[14px]"
          >
            {isLoading ? "Siliniyor..." : "Sil"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Add Payment Dialog Component
export const AddPaymentDialog: React.FC<AddPaymentDialogProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isLoading, 
  newPayment, 
  setNewPayment, 
  members, 
  selectedMemberPackages, 
  fetchMemberPackages 
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] text-[110%]">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">
            Yeni Ödeme Ekle
          </DialogTitle>
          <DialogDescription className="text-gray-900 dark:text-white">
            Yeni bir üye ödemesi eklemek için aşağıdaki formu doldurun.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label
              htmlFor="member_name"
              className="text-right text-gray-900 dark:text-white"
            >
              Üye adı
            </Label>
            <Select
              value={newPayment.member_name}
              onValueChange={(value) => {
                setNewPayment({
                  ...newPayment,
                  member_name: value,
                  package_name: "",
                });
                fetchMemberPackages(value);
              }}
            >
              <SelectTrigger className="col-span-3 text-gray-900 dark:text-white">
                <SelectValue placeholder="Üye seçin" />
              </SelectTrigger>
              <SelectContent>
                {members.map((member) => (
                  <SelectItem
                    key={member.id}
                    value={`${member.first_name} ${member.last_name}`}
                    className="text-[14px]"
                  >
                    {`${member.first_name} ${member.last_name}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label
              htmlFor="package_name"
              className="text-right text-gray-900 dark:text-white"
            >
              Paket Adı
            </Label>
            <Select
              value={newPayment.package_name}
              onValueChange={(value) =>
                setNewPayment({ ...newPayment, package_name: value })
              }
            >
              <SelectTrigger className="col-span-3 text-gray-900 dark:text-white">
                <SelectValue placeholder="Paket seçin" />
              </SelectTrigger>
              <SelectContent>
                {selectedMemberPackages.map((pkg) => (
                  <SelectItem
                    key={pkg.id}
                    value={pkg.name}
                    className="text-[14px]"
                  >
                    {pkg.name} -{" "}
                    <span className="text-red-600"> {pkg.price}₺</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label
              htmlFor="credit_card_paid"
              className="text-right text-gray-900 dark:text-white"
            >
              Kredi Kartı
            </Label>
            <Input
              id="credit_card_paid"
              type="number"
              min="0"
              placeholder="Kredi Kartı"
              value={newPayment.credit_card_paid}
              onChange={(e) =>
                setNewPayment({
                  ...newPayment,
                  credit_card_paid:
                    e.target.value === "" ? "0" : e.target.value,
                })
              }
              className="col-span-3 text-gray-900 dark:text-white"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label
              htmlFor="cash_paid"
              className="text-right text-gray-900 dark:text-white"
            >
              Nakit
            </Label>
            <Input
              id="cash_paid"
              type="number"
              min="0"
              placeholder="Nakit"
              value={newPayment.cash_paid}
              onChange={(e) =>
                setNewPayment({
                  ...newPayment,
                  cash_paid: e.target.value === "" ? "0" : e.target.value,
                })
              }
              className="col-span-3 text-gray-900 dark:text-white"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label
              htmlFor="created_at"
              className="text-right text-gray-900 dark:text-white"
            >
              Ödeme Tarihi
            </Label>
            <Input
              id="created_at"
              type="date"
              placeholder="Ödeme Tarihi"
              value={newPayment.created_at}
              onChange={(e) =>
                setNewPayment({ ...newPayment, created_at: e.target.value })
              }
              className="col-span-3 text-gray-900 dark:text-white"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={onSubmit}
            disabled={isLoading}
            className="text-[14px]"
          >
            {isLoading ? "Ekleniyor..." : "Ekle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 