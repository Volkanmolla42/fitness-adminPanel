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
import { addDays, format, isWithinInterval, parseISO } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  const [editingPayment, setEditingPayment] = useState<MemberPayment | null>(null);
  const [deletingPayment, setDeletingPayment] = useState<MemberPayment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [memberPayments, setMemberPayments] = useState<MemberPayment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<MemberPayment[]>([]);
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchField, setSearchField] = useState<"member_name" | "package_name">("member_name");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [tableLoading, setTableLoading] = useState(true);
  const [packages, setPackages] = useState<Service[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMemberPackages, setSelectedMemberPackages] = useState<Service[]>([]);

  const [newPayment, setNewPayment] = useState({
    member_name: "",
    credit_card_paid: "",
    cash_paid: "",
    created_at: new Date().toISOString().split('T')[0],
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

    const [firstName, lastName] = memberName.split(" ");
    
    const { data: memberData, error: memberError } = await supabase
      .from("members")
      .select("subscribed_services")
      .eq("first_name", firstName)
      .eq("last_name", lastName)
      .single();

    if (memberError || !memberData) {
      toast.error("Üye bilgileri alınamadı");
      return;
    }

    const subscribedServices = memberData.subscribed_services || [];
    
    const filteredPackages = packages.filter(pkg => 
      subscribedServices.includes(pkg.id)
    );

    setSelectedMemberPackages(filteredPackages);
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
        const searchValue = payment[searchField]?.toLowerCase() || "";
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
  }, [searchTerm, searchField, dateRange, memberPayments]);

  const clearFilters = () => {
    setSearchTerm("");
    setSearchField("member_name");
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
      created_at: payment.created_at.split('T')[0],
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
      const { error } = await supabase
        .from("member_payments")
        .insert({
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
        created_at: new Date().toISOString().split('T')[0],
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
    <div className="col-span-2">
      <Card >
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Üye Ödemeleri</CardTitle>
            <Button onClick={() => setIsAddingPayment(true)}>
              Yeni Ödeme Ekle
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Arama ve Filtreleme */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 flex gap-2">
                <Select
                  value={searchField}
                  onValueChange={(value: "member_name" | "package_name") =>
                    setSearchField(value)
                  }
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Arama alanı" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member_name">Üye Adı</SelectItem>
                    <SelectItem value="package_name">Paket Adı</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex-1 relative">
                  <Input
                    placeholder={searchField === "member_name" ? "Üye adı ara..." : "Paket adı ara..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal w-[220px]",
                        !dateRange && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "dd.MM.yyyy")} -{" "}
                            {format(dateRange.to, "dd.MM.yyyy")}
                          </>
                        ) : (
                          format(dateRange.from, "dd.MM.yyyy")
                        )
                      ) : (
                        "Tarih seç"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
                {(searchTerm || dateRange) && (
                  <Button
                    variant="ghost"
                    onClick={clearFilters}
                    className="px-3"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Tablo */}
            <MemberPaymentsTable
              columns={columns({
                onEdit: handleEdit,
                onDelete: handleDelete,
              })}
              data={filteredPayments}
              isLoading={tableLoading}
            />
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
              <Label htmlFor="member_name" className="text-right">
                Üye Adı
              </Label>
              <Select
                value={formData.member_name}
                onValueChange={(value) => {
                  setFormData({ ...formData, member_name: value, package_name: "" });
                  fetchMemberPackages(value);
                }}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Üye seçin" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem 
                      key={member.id} 
                      value={`${member.first_name} ${member.last_name}`}
                    >
                      {`${member.first_name} ${member.last_name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="package_name" className="text-right">
                Paket Adı
              </Label>
              <Select
                value={formData.package_name}
                onValueChange={(value) =>
                  setFormData({ ...formData, package_name: value })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Paket seçin" />
                </SelectTrigger>
                <SelectContent>
                  {selectedMemberPackages.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.name}>
                      {pkg.name} - {pkg.price}₺
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="credit_card_paid" className="text-right">
                Kredi Kartı
              </Label>
              <Input
                id="credit_card_paid"
                type="number"
                placeholder="Kredi Kartı"
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
                placeholder="Nakit"
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
                placeholder="Ödeme Tarihi"
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
              <Select
                value={newPayment.member_name}
                onValueChange={(value) => {
                  setNewPayment({ ...newPayment, member_name: value, package_name: "" });
                  fetchMemberPackages(value);
                }}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Üye seçin" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem 
                      key={member.id} 
                      value={`${member.first_name} ${member.last_name}`}
                    >
                      {`${member.first_name} ${member.last_name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="package_name" className="text-right">
                Paket Adı
              </Label>
              <Select
                value={newPayment.package_name}
                onValueChange={(value) =>
                  setNewPayment({ ...newPayment, package_name: value })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Paket seçin" />
                </SelectTrigger>
                <SelectContent>
                  {selectedMemberPackages.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.name}>
                      {pkg.name} - {pkg.price}₺
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="credit_card_paid" className="text-right">
                Kredi Kartı
              </Label>
              <Input
                id="credit_card_paid"
                type="number"
                placeholder="Kredi Kartı"
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
                placeholder="Nakit"
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
                placeholder="Ödeme Tarihi"
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
    </div>
  );
}
