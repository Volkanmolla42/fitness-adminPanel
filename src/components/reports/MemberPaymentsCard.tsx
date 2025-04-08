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
import { DateRange } from "react-day-picker";
import { addDays, isWithinInterval, parseISO } from "date-fns";

import { X, RefreshCw, Plus, Search, FilterX } from "lucide-react";
import DatePickerWithRange from "@/components/ui/date-picker-with-range";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type MemberPayment = Database["public"]["Tables"]["member_payments"]["Row"];
type Service = Database["public"]["Tables"]["services"]["Row"];
type Member = Database["public"]["Tables"]["members"]["Row"];

export function MemberPaymentsCard() {
  const [editingPayment, setEditingPayment] = useState<MemberPayment | null>(
    null
  );
  const [deletingPayment, setDeletingPayment] = useState<MemberPayment | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [memberPayments, setMemberPayments] = useState<MemberPayment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<MemberPayment[]>([]);
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [tableLoading, setTableLoading] = useState(true);
  const [packages, setPackages] = useState<Service[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMemberPackages, setSelectedMemberPackages] = useState<
    Service[]
  >([]);

  const [newPayment, setNewPayment] = useState({
    member_name: "",
    credit_card_paid: "",
    cash_paid: "",
    created_at: new Date().toISOString().split("T")[0],
    package_name: "",
  });

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
    setFilteredPayments(data);
    setTableLoading(false);
  };

  const fetchPackages = async () => {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("name");

    if (error) {
      toast.error("Paketler yüklenirken bir hata oluştu");
      return;
    }

    setPackages(data || []);
  };

  const fetchMembers = async () => {
    const { data, error } = await supabase
      .from("members")
      .select("*")
      .order("first_name");

    if (error) {
      toast.error("Üyeler yüklenirken bir hata oluştu");
      return;
    }

    setMembers(data || []);
  };

  const fetchMemberPackages = async (memberName: string) => {
    if (!memberName) {
      setSelectedMemberPackages([]);
      return;
    }

    // Üye adını parçalara ayır
    const nameParts = memberName.split(" ");
    if (nameParts.length < 2) {
      toast.error("Geçersiz üye adı formatı");
      setSelectedMemberPackages([]);
      return;
    }

    // Son kelimeyi soyadı, geri kalanını ad olarak kabul et
    const lastName = nameParts.pop() || "";
    const firstName = nameParts.join(" ");

    try {
      // İlk olarak tam eşleşme ile deneyelim
      const { data: memberData, error: memberError } = await supabase
        .from("members")
        .select("subscribed_services, id")
        .eq("first_name", firstName)
        .eq("last_name", lastName)
        .single();

      if (memberError) {
        console.error("Üye arama hatası:", memberError);

        // Tam eşleşme bulunamadıysa, daha esnek bir arama yapalım
        const { data: allMembers, error: allMembersError } = await supabase
          .from("members")
          .select("subscribed_services, id, first_name, last_name");

        if (allMembersError) {
          toast.error("Üye bilgileri alınamadı");
          setSelectedMemberPackages([]);
          return;
        }

        // Tam ad ile eşleşen üyeyi bul
        const matchedMember = allMembers.find(
          (member) =>
            `${member.first_name} ${member.last_name}`.toLowerCase() ===
            memberName.toLowerCase()
        );

        if (!matchedMember) {
          toast.error("Üye bulunamadı");
          setSelectedMemberPackages([]);
          return;
        }

        const subscribedServices = matchedMember.subscribed_services || [];
        const filteredPackages = packages.filter((pkg) =>
          subscribedServices.includes(pkg.id)
        );

        setSelectedMemberPackages(filteredPackages);
        return;
      }

      if (!memberData) {
        toast.error("Üye bulunamadı");
        setSelectedMemberPackages([]);
        return;
      }

      const subscribedServices = memberData.subscribed_services || [];
      const filteredPackages = packages.filter((pkg) =>
        subscribedServices.includes(pkg.id)
      );

      setSelectedMemberPackages(filteredPackages);
    } catch (error) {
      console.error("Üye paketleri alınırken hata:", error);
      toast.error("Üye paketleri alınamadı");
      setSelectedMemberPackages([]);
    }
  };

  useEffect(() => {
    fetchMemberPayments();
    fetchPackages();
    fetchMembers();
  }, []);

  // Filtreleme işlemi
  useEffect(() => {
    let filtered = [...memberPayments];

    // Metin araması
    if (searchTerm) {
      filtered = filtered.filter((payment) => {
        const searchValue = payment.member_name?.toLowerCase() || "";
        return searchValue.includes(searchTerm.toLowerCase());
      });
    }

    // Tarih aralığı filtresi
    if (dateRange?.from) {
      filtered = filtered.filter((payment) => {
        const paymentDate = parseISO(payment.created_at);
        const fromDate = dateRange.from;
        const toDate = dateRange.to || fromDate;

        return isWithinInterval(paymentDate, {
          start: fromDate,
          end: addDays(toDate, 1),
        });
      });
    }

    setFilteredPayments(filtered);
  }, [searchTerm, dateRange, memberPayments]);

  const clearFilters = () => {
    setSearchTerm("");
    setDateRange(undefined);
  };

  const [formData, setFormData] = useState({
    member_name: "",
    credit_card_paid: "",
    cash_paid: "",
    created_at: "",
    package_name: "",
  });

  const handleEdit = (payment: MemberPayment) => {
    setEditingPayment(payment);
    setFormData({
      member_name: payment.member_name,
      package_name: payment.package_name,
      credit_card_paid: payment.credit_card_paid.toString(),
      cash_paid: payment.cash_paid.toString(),
      created_at: payment.created_at.split("T")[0],
    });
    fetchMemberPackages(payment.member_name);
  };

  useEffect(() => {
    if (editingPayment) {
      fetchMemberPackages(editingPayment.member_name);
    }
  }, [editingPayment]);

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
          package_name: formData.package_name,
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
      const { error } = await supabase.from("member_payments").insert({
        member_name: newPayment.member_name,
        credit_card_paid: parseFloat(newPayment.credit_card_paid) || 0,
        cash_paid: parseFloat(newPayment.cash_paid) || 0,
        created_at: newPayment.created_at,
        package_name: newPayment.package_name,
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
        created_at: new Date().toISOString().split("T")[0],
        package_name: "",
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
    <div className="col-span-2 relative">
      <Card className="shadow-md pb-4 dark:bg-gray-800/50 border dark:border-gray-700 overflow-hidden">
        <CardHeader className="bg-muted/30 dark:bg-gray-800 pb-3 border-b dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <CardTitle className="text-xl dark:text-gray-100">
              Üye Ödemeleri
              {filteredPayments.length > 0 && (
                <span className="text-sm font-normal text-muted-foreground ml-2 dark:text-gray-400">
                  ({filteredPayments.length} kayıt)
                </span>
              )}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={() => fetchMemberPayments()}
                variant="outline"
                size="sm"
                className="flex items-center gap-1 hover:bg-muted/50 dark:hover:bg-gray-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Yenile
              </Button>
              <Button
                onClick={() => setIsAddingPayment(true)}
                className="flex items-center gap-1 bg-primary hover:bg-primary/90 text-white dark:bg-primary dark:text-black dark:hover:bg-primary/80 transition-colors"
                size="sm"
              >
                <Plus className="h-4 w-4" />
                Yeni Ödeme
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div>
            {/* Arama ve Filtreleme */}
            <div className="flex items-center gap-3 border-b p-4 dark:border-gray-700 ">
              <div className="flex-1 relative">
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Search className="h-4 w-4" />
                </div>
                <Input
                  placeholder="Üye adı ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 h-8  dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary/20 transition-all"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2 bottom-1/2 translate-y-1/2  text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <div className="w-full sm:w-[220px]">
                  <DatePickerWithRange
                    date={dateRange}
                    setDate={setDateRange}
                    className="dark:border-gray-600 dark:text-gray-200 transition-colors"
                  />
                </div>
                {(searchTerm || dateRange) && (
                  <Button
                    variant="ghost"
                    onClick={clearFilters}
                    className="px-3 h-10 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
                    title="Filtreleri temizle"
                  >
                    <FilterX className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Tablo */}
            <div className="px-1">
              {filteredPayments.length > 0 ? (
                <MemberPaymentsTable
                  columns={columns({
                    onEdit: handleEdit,
                    onDelete: handleDelete,
                  })}
                  data={filteredPayments}
                  isLoading={tableLoading}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="rounded-full bg-muted p-3 mb-3 dark:bg-gray-700">
                    <Search className="h-6 w-6 text-muted-foreground dark:text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-1 dark:text-gray-200">
                    Kayıt bulunamadı
                  </h3>
                  <p className="text-muted-foreground text-sm max-w-md mb-4 dark:text-gray-400">
                    {searchTerm || dateRange
                      ? "Arama kriterlerinize uygun ödeme kaydı bulunamadı. Lütfen farklı bir arama terimi deneyin veya filtreleri temizleyin."
                      : "Henüz hiç ödeme kaydı eklenmemiş. Yeni bir ödeme eklemek için 'Yeni Ödeme' düğmesine tıklayın."}
                  </p>
                  {(searchTerm || dateRange) && (
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      className="flex items-center gap-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <FilterX className="h-4 w-4" />
                      Filtreleri Temizle
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
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
              <Label
                htmlFor="member_name"
                className="text-right dark:text-gray-200"
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
                <SelectTrigger className="col-span-3 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                  <SelectValue placeholder="Üye seçin" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                  {members.map((member) => (
                    <SelectItem
                      key={member.id}
                      value={`${member.first_name} ${member.last_name}`}
                      className="dark:text-gray-200 dark:focus:bg-gray-600 dark:hover:bg-gray-600"
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
                className="text-right dark:text-gray-200"
              >
                Paket Adı
              </Label>
              <Select
                value={formData.package_name}
                onValueChange={(value) =>
                  setFormData({ ...formData, package_name: value })
                }
              >
                <SelectTrigger className="col-span-3 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                  <SelectValue placeholder="Paket seçin" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                  {selectedMemberPackages.map((pkg) => (
                    <SelectItem
                      key={pkg.id}
                      value={pkg.name}
                      className="dark:text-gray-200 dark:focus:bg-gray-600 dark:hover:bg-gray-600"
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
                className="text-right dark:text-gray-200"
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
                className="col-span-3 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label
                htmlFor="cash_paid"
                className="text-right dark:text-gray-200"
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
                className="col-span-3 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label
                htmlFor="created_at"
                className="text-right dark:text-gray-200"
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
                className="col-span-3 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
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
              className="dark:bg-primary dark:hover:bg-primary/90"
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
        <DialogContent className="sm:max-w-[425px] dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-gray-100">
              Yeni Ödeme Ekle
            </DialogTitle>
            <DialogDescription className="dark:text-gray-300 text-gray-500">
              Yeni bir üye ödemesi eklemek için aşağıdaki formu doldurun.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label
                htmlFor="member_name"
                className="text-right dark:text-gray-200"
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
                <SelectTrigger className="col-span-3 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                  <SelectValue placeholder="Üye seçin" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                  {members.map((member) => (
                    <SelectItem
                      key={member.id}
                      value={`${member.first_name} ${member.last_name}`}
                      className="dark:text-gray-200 dark:focus:bg-gray-600 dark:hover:bg-gray-600"
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
                className="text-right dark:text-gray-200"
              >
                Paket Adı
              </Label>
              <Select
                value={newPayment.package_name}
                onValueChange={(value) =>
                  setNewPayment({ ...newPayment, package_name: value })
                }
              >
                <SelectTrigger className="col-span-3 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                  <SelectValue placeholder="Paket seçin" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                  {selectedMemberPackages.map((pkg) => (
                    <SelectItem
                      key={pkg.id}
                      value={pkg.name}
                      className="dark:text-gray-200 dark:focus:bg-gray-600 dark:hover:bg-gray-600"
                    >
                      {pkg.name} -{" "}
                      <span className="text-red-400"> {pkg.price}₺</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label
                htmlFor="credit_card_paid"
                className="text-right dark:text-gray-200"
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
                className="col-span-3 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label
                htmlFor="cash_paid"
                className="text-right dark:text-gray-200"
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
                className="col-span-3 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label
                htmlFor="created_at"
                className="text-right dark:text-gray-200"
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
                className="col-span-3 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              onClick={handleAddPayment}
              disabled={isLoading}
              className="dark:bg-primary dark:hover:bg-primary/90"
            >
              {isLoading ? "Ekleniyor..." : "Ekle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
