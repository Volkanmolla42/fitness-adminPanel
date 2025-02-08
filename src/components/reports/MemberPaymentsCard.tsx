import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MemberPaymentsTable } from "@/components/ui/member-payments-table";
import { columns } from "@/components/member-payments-columns";
import { Database } from "@/types/supabase";
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
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
type MemberPayment = Database["public"]["Tables"]["member_payments"]["Row"];

export function MemberPaymentsCard() {
  const [editingPayment, setEditingPayment] = useState<MemberPayment | null>(
    null
  );
  const [deletingPayment, setDeletingPayment] = useState<MemberPayment | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [memberPayments, setMemberPayments] = useState<MemberPayment[]>([]);
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [newPayment, setNewPayment] = useState({
    member_name: "",
    credit_card_paid: "",
    cash_paid: "",
    created_at: new Date().toISOString().split('T')[0],
  });
  const [tableLoading, setTableLoading] = useState(true);

  const fetchMemberPayments = async () => {
    setTableLoading(true);
    const { data, error } = await supabase
      .from("member_payments")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching member payments:", error);
      return;
    }

    setMemberPayments(data);
    setTableLoading(false);
  };

  useEffect(() => {
    fetchMemberPayments();
  }, []);

  const [formData, setFormData] = useState({
    member_name: "",
    credit_card_paid: "",
    cash_paid: "",
    created_at: "",
  });

  const handleEdit = (payment: MemberPayment) => {
    setEditingPayment(payment);
    setFormData({
      member_name: payment.member_name,
      credit_card_paid: payment.credit_card_paid.toString(),
      cash_paid: payment.cash_paid.toString(),
      created_at: payment.created_at.split('T')[0],
    });
  };

  const handleDelete = (payment: MemberPayment) => {
    setDeletingPayment(payment);
  };

  const handleEditSubmit = async () => {
    if (!editingPayment) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("member_payments")
        .update({
          member_name: formData.member_name,
          credit_card_paid: parseFloat(formData.credit_card_paid),
          cash_paid: parseFloat(formData.cash_paid),
          created_at: formData.created_at,
        })
        .eq("id", editingPayment.id);

      if (error) throw error;

      toast.success("Ödeme başarıyla güncellendi", {
        description: "Üye ödemesi güncellendi",
      });
      fetchMemberPayments();
    } catch (error) {
      toast.error("Ödeme güncellenirken bir hata oluştu", {
        description: "Lütfen tekrar deneyin",
      });
      console.error(error);
    } finally {
      setIsLoading(false);
      setEditingPayment(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingPayment) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("member_payments")
        .delete()
        .eq("id", deletingPayment.id);

      if (error) throw error;

      toast.success("Ödeme başarıyla silindi");
      fetchMemberPayments();
    } catch (error) {
      toast.error("Ödeme silinirken bir hata oluştu");
      console.error(error);
    } finally {
      setIsLoading(false);
      setDeletingPayment(null);
    }
  };

  const handleAddPayment = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("member_payments")
        .insert({
          member_name: newPayment.member_name,
          credit_card_paid: parseFloat(newPayment.credit_card_paid) || 0,
          cash_paid: parseFloat(newPayment.cash_paid) || 0,
          created_at: newPayment.created_at,
        });

      if (error) throw error;

      toast.success("Ödeme başarıyla eklendi", {
        description: "Yeni üye ödemesi eklendi",
      });
      fetchMemberPayments();
      setIsAddingPayment(false);
      setNewPayment({
        member_name: "",
        credit_card_paid: "",
        cash_paid: "",
        created_at: new Date().toISOString().split('T')[0],
      });
    } catch (error) {
      toast.error("Ödeme eklenirken bir hata oluştu", {
        description: "Lütfen tekrar deneyin",
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card className="col-span-2">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Üye Ödemeleri</CardTitle>
            <Button onClick={() => setIsAddingPayment(true)}>
              Yeni Ödeme Ekle
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <MemberPaymentsTable
            columns={columns({
              onEdit: handleEdit,
              onDelete: handleDelete,
            })}
            data={memberPayments}
            isLoading={tableLoading}
          />
        </CardContent>
      </Card>

      <Dialog
        open={!!editingPayment}
        onOpenChange={() => setEditingPayment(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ödeme Düzenle</DialogTitle>
            <DialogDescription>
              Ödeme bilgilerini düzenlemek için aşağıdaki formu doldurun
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="member_name" className="text-right">
                Üye Adı
              </Label>
              <Input
                id="member_name"
                value={formData.member_name}
                onChange={(e) =>
                  setFormData({ ...formData, member_name: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="credit_card_paid" className="text-right">
                Kredi Kartı
              </Label>
              <Input
                id="credit_card_paid"
                type="number"
                value={formData.credit_card_paid}
                onChange={(e) =>
                  setFormData({ ...formData, credit_card_paid: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cash_paid" className="text-right">
                Nakit
              </Label>
              <Input
                id="cash_paid"
                type="number"
                value={formData.cash_paid}
                onChange={(e) =>
                  setFormData({ ...formData, cash_paid: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="created_at" className="text-right">
                Ödeme Tarihi
              </Label>
              <Input
                id="created_at"
                type="date"
                value={formData.created_at}
                onChange={(e) =>
                  setFormData({ ...formData, created_at: e.target.value })
                }
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setEditingPayment(null)} variant="outline">
              İptal
            </Button>
            <Button
              type="submit"
              onClick={handleEditSubmit}
              disabled={isLoading}
            >
              {isLoading ? "Güncelleniyor..." : "Güncelle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deletingPayment}
        onOpenChange={() => setDeletingPayment(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ödemeyi Sil</DialogTitle>
            <DialogDescription>
              Bu ödemeyi silmek istediğinizden emin misiniz? Bu işlem geri
              alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingPayment(null)}
              disabled={isLoading}
            >
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isLoading}
            >
              {isLoading ? "Siliniyor..." : "Sil"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddingPayment} onOpenChange={setIsAddingPayment}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Ödeme Ekle</DialogTitle>
            <DialogDescription>
              Üye ödemesi eklemek için aşağıdaki formu doldurun
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="member_name" className="text-right">
                Üye adı
              </Label>
              <Input
                id="member_name"
                value={newPayment.member_name}
                onChange={(e) =>
                  setNewPayment({ ...newPayment, member_name: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="credit_card_paid" className="text-right">
                Kredi Kartı
              </Label>
              <Input
                id="credit_card_paid"
                type="number"
                value={newPayment.credit_card_paid}
                onChange={(e) =>
                  setNewPayment({
                    ...newPayment,
                    credit_card_paid: e.target.value,
                  })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cash_paid" className="text-right">
                Nakit
              </Label>
              <Input
                id="cash_paid"
                type="number"
                value={newPayment.cash_paid}
                onChange={(e) =>
                  setNewPayment({ ...newPayment, cash_paid: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="created_at" className="text-right">
                Ödeme Tarihi
              </Label>
              <Input
                id="created_at"
                type="date"
                value={newPayment.created_at}
                onChange={(e) =>
                  setNewPayment({ ...newPayment, created_at: e.target.value })
                }
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              onClick={handleAddPayment}
              disabled={isLoading}
            >
              {isLoading ? "Ekleniyor..." : "Ekle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
