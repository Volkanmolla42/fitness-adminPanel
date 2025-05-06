import React, { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
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
import { addDays, isWithinInterval, parseISO, format } from "date-fns";
import { tr } from "date-fns/locale";

import { X, RefreshCw, Plus, Search, FilterX, CreditCard, Coins, Calculator, ListFilter } from "lucide-react";
import DatePickerWithRange from "@/components/ui/date-picker-with-range";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MemberPaymentsTable } from "@/components/ui/member-payments-table";

type MemberPayment = Database["public"]["Tables"]["member_payments"]["Row"];
type Service = Database["public"]["Tables"]["services"]["Row"];
type Member = Database["public"]["Tables"]["members"]["Row"];

// Component for the payment summary section
const PaymentSummary = ({ summary, setIsAddingPayment }) => {
  return (
    <div className="flex flex-col w-full mb-4 text-[110%]">
      <div className="flex justify-between items-center mb-2">
      <h3 className="text-base font-semibold text-gray-900 dark:text-white">Ödeme Özeti</h3>
        {/* Add Payment Button */}
        <div className="flex justify-end">
          <Button
            onClick={() => setIsAddingPayment(true)}
            className="flex items-center text-[14px]"
          >
            <Plus className="mr-2 h-4 w-4" />
            Yeni Ödeme Ekle
          </Button>
        </div>
      </div>
      
      {summary.dateRange?.from && summary.dateRange?.to && (
        <p className="text-sm text-gray-900 dark:text-white mb-2">
          {format(summary.dateRange.from, "dd MMMM yyyy", { locale: tr })} - {format(summary.dateRange.to, "dd MMMM yyyy", { locale: tr })} tarihleri arasındaki ödemeler
        </p>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-2">
        <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <ListFilter className="h-4 w-4 text-gray-900 dark:text-white" />
            <p className="text-sm font-medium text-gray-900 dark:text-white">İşlem Sayısı</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.count} ödeme</p>
        </div>
        
        <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="h-4 w-4 text-blue-600" />
            <p className="text-sm font-medium text-gray-900 dark:text-white">Kredi Kartı</p>
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">₺{summary.totalCreditCard.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2}).replace('.', ',')}</p>
        </div>
        
        <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Coins className="h-4 w-4 text-amber-600" />
            <p className="text-sm font-medium text-gray-900 dark:text-white">Nakit</p>
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">₺{summary.totalCash.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2}).replace('.', ',')}</p>
        </div>
        <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Calculator className="h-4 w-4 text-gray-900 dark:text-white" />
            <p className="text-sm font-medium text-gray-900 dark:text-white">Toplam Ödeme</p>
          </div>
          <p className="text-2xl font-bold text-green-700 dark:text-green-500">₺{summary.totalAmount.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2}).replace('.', ',')}</p>
        </div>
        
      </div>
    </div>
  );
};

// Payment Edit Dialog Component
const EditPaymentDialog = ({ 
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
const DeletePaymentDialog = ({ payment, isOpen, onClose, onConfirm, isLoading }) => {
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
const AddPaymentDialog = ({ isOpen, onClose, onSubmit, isLoading, newPayment, setNewPayment, members, selectedMemberPackages, fetchMemberPackages }) => {
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

export function MemberPaymentsCard() {
  // State Management
  const [editingPayment, setEditingPayment] = useState<MemberPayment | null>(null);
  const [deletingPayment, setDeletingPayment] = useState<MemberPayment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [memberPayments, setMemberPayments] = useState<MemberPayment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<MemberPayment[]>([]);
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [tableLoading, setTableLoading] = useState(true);
  const [packages, setPackages] = useState<Service[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMemberPackages, setSelectedMemberPackages] = useState<Service[]>([]);

  const [formData, setFormData] = useState({
    member_name: "",
    credit_card_paid: "",
    cash_paid: "",
    created_at: "",
    package_name: "",
  });

  const [newPayment, setNewPayment] = useState({
    member_name: "",
    credit_card_paid: "",
    cash_paid: "",
    created_at: new Date().toISOString().split("T")[0],
    package_name: "",
  });

  // Data Fetching Functions
  const fetchMemberPayments = async () => {
    setTableLoading(true);
    const { data, error } = await supabase
      .from("member_payments")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching member payments:", error);
      toast.error("Ödemeler yüklenirken bir hata oluştu");
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

  // Initial Data Loading
  useEffect(() => {
    fetchMemberPayments();
    fetchPackages();
    fetchMembers();
  }, []);

  // Filtering Logic
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

  // Clear all active filters
  const clearFilters = () => {
    setSearchTerm("");
    setDateRange(undefined);
  };

  // Update member packages when editing a payment
  useEffect(() => {
    if (editingPayment) {
      setFormData({
        member_name: editingPayment.member_name,
        package_name: editingPayment.package_name,
        credit_card_paid: editingPayment.credit_card_paid.toString(),
        cash_paid: editingPayment.cash_paid.toString(),
        created_at: editingPayment.created_at.split("T")[0],
      });
      fetchMemberPackages(editingPayment.member_name);
    }
  }, [editingPayment]);

  // Event Handlers
  const handleEdit = (payment: MemberPayment) => {
    setEditingPayment(payment);
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

  // Payment Summary Calculation
  const paymentSummary = useMemo(() => {
    let totalCreditCard = 0;
    let totalCash = 0;
    let totalAmount = 0;
    
    filteredPayments.forEach(payment => {
      totalCreditCard += payment.credit_card_paid;
      totalCash += payment.cash_paid;
      totalAmount += payment.credit_card_paid + payment.cash_paid;
    });
    
    return {
      totalCreditCard,
      totalCash,
      totalAmount,
      count: filteredPayments.length,
      dateRange
    };
  }, [filteredPayments, dateRange]);

  return (
    <Card className="mb-6 border border-gray-300 dark:border-0 shadow-md text-[110%]">
      <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700">
        <div className="flex flex-col md:flex-row justify-between md:items-center space-y-2 md:space-y-0">
          <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">Üye Ödemeleri</CardTitle>
          <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-900 dark:text-white" />
              <Input
                placeholder="Üye ara..."
                className="pl-8 w-full md:w-[180px] text-[14px] text-gray-900 dark:text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <DatePickerWithRange date={dateRange} setDate={setDateRange} />
            <Button
              variant="outline"
              className="md:h-10 text-[14px]"
              onClick={clearFilters}
              disabled={!searchTerm && !dateRange?.from}
            >
              <FilterX className="mr-2 h-4 w-4" /> Filtreleri Temizle
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {/* Payment Summary Section */}
        
        <PaymentSummary summary={paymentSummary} setIsAddingPayment={setIsAddingPayment} />

        
        {/* Payments Table */}
        <MemberPaymentsTable
          data={filteredPayments}
          columns={columns({
            onEdit: handleEdit,
            onDelete: handleDelete,
          })}
          isLoading={tableLoading}
        />
      </CardContent>

      {/* Dialogs */}
      <EditPaymentDialog 
        isOpen={!!editingPayment}
        onClose={() => setEditingPayment(null)}
        payment={editingPayment}
        onSubmit={handleEditSubmit}
        formData={formData}
        setFormData={setFormData}
        isLoading={isLoading}
        members={members}
        selectedMemberPackages={selectedMemberPackages}
        fetchMemberPackages={fetchMemberPackages}
      />

      <DeletePaymentDialog 
        payment={deletingPayment}
        isOpen={!!deletingPayment}
        onClose={() => setDeletingPayment(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isLoading}
      />

      <AddPaymentDialog 
        isOpen={isAddingPayment}
        onClose={() => setIsAddingPayment(false)}
        onSubmit={handleAddPayment}
        isLoading={isLoading}
        newPayment={newPayment}
        setNewPayment={setNewPayment}
        members={members}
        selectedMemberPackages={selectedMemberPackages}
        fetchMemberPackages={fetchMemberPackages}
      />
    </Card>
  );
}
