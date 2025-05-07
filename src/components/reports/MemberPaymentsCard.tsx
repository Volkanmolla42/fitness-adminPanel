import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { columns } from "@/components/member-payments-columns";
import { MemberPaymentsTable } from "@/components/ui/member-payments-table";
import { Database } from "@/types/supabase";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

// Import custom hooks
import { useMemberPayments } from "@/hooks/useMemberPayments";
import { useMemberPackages } from "@/hooks/useMemberPackages";
import { usePaymentFilters } from "@/hooks/usePaymentFilters";

// Import UI components
import { PaymentSummary } from "./PaymentSummary";
import { PaymentFilters } from "./PaymentFilters";
import { 
  EditPaymentDialog, 
  DeletePaymentDialog, 
  AddPaymentDialog 
} from "./PaymentDialogs";

type MemberPayment = Database["public"]["Tables"]["member_payments"]["Row"];

export function MemberPaymentsCard() {
  // Fetch and manage member payments data
  const { 
    memberPayments, 
    isLoading: paymentsLoading, 
    deletePayment,
    fetchMemberPayments
  } = useMemberPayments();
  
  // Fetch and manage member packages data
  const { 
    members, 
    selectedMemberPackages, 
    fetchMemberPackages 
  } = useMemberPackages();
  
  // Filter payments and calculate summary
  const { 
    searchTerm, 
    setSearchTerm, 
    dateRange, 
    setDateRange, 
    filteredPayments, 
    clearFilters, 
    paymentSummary 
  } = usePaymentFilters(memberPayments);
  
  // UI state management
  const [editingPayment, setEditingPayment] = useState<MemberPayment | null>(null);
  const [deletingPayment, setDeletingPayment] = useState<MemberPayment | null>(null);
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form data state
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

  // Initialize form data when editing a payment
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
  }, [editingPayment, fetchMemberPackages]);

  // Event handlers
  const handleEdit = (payment: MemberPayment) => {
    setEditingPayment(payment);
  };

  const handleDelete = (payment: MemberPayment) => {
    setDeletingPayment(payment);
  };

  const handleEditSubmit = async () => {
    if (!editingPayment) return;
    
    setIsSubmitting(true);
    try {
      // Düz güncelleme yerine, düzenlemeyi uygulayalım
      const { error } = await supabase
        .from("member_payments")
        .update({
          member_name: formData.member_name,
          credit_card_paid: formData.credit_card_paid === "" ? 0 : parseFloat(formData.credit_card_paid),
          cash_paid: formData.cash_paid === "" ? 0 : parseFloat(formData.cash_paid),
          created_at: formData.created_at,
          package_name: formData.package_name,
        })
        .eq("id", editingPayment.id);
        
      if (error) {
        throw error;
      }
      
      toast.success("Ödeme başarıyla güncellendi");
      setEditingPayment(null);
      await fetchMemberPayments();
    } catch (error) {
      console.error("Ödeme güncelleme hatası:", error);
      toast.error("Ödeme güncellenirken bir hata oluştu", {
        description: "Lütfen tekrar deneyin",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingPayment) return;
    
    setIsSubmitting(true);
    try {
      const success = await deletePayment(deletingPayment.id);
      
      if (success) {
        setDeletingPayment(null);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddPayment = async () => {
    setIsSubmitting(true);
    try {
      // Tek bir paket için ödeme eklemek yerine, 
      // birden fazla paket seçilebilmesi durumunu göz önüne alalım
      if (!newPayment.member_name || !newPayment.package_name) {
        toast.error("Lütfen üye ve paket bilgilerini doldurun");
        setIsSubmitting(false);
        return;
      }
      
      // Seçilen paket(ler)i bul
      const selectedPackage = selectedMemberPackages.find(
        pkg => pkg.name === newPayment.package_name
      );
      
      if (!selectedPackage) {
        toast.error("Seçilen paket bulunamadı");
        setIsSubmitting(false);
        return;
      }
      
      // Ödeme kaydını oluştur
      const { error } = await supabase
        .from("member_payments")
        .insert({
          member_name: newPayment.member_name,
          credit_card_paid: newPayment.credit_card_paid === "" ? 0 : parseFloat(newPayment.credit_card_paid),
          cash_paid: newPayment.cash_paid === "" ? 0 : parseFloat(newPayment.cash_paid),
          created_at: newPayment.created_at,
          package_name: newPayment.package_name,
        });
        
      if (error) {
        throw error;
      }
      
      toast.success("Ödeme başarıyla eklendi");
      setIsAddingPayment(false);
      setNewPayment({
        member_name: "",
        credit_card_paid: "",
        cash_paid: "",
        created_at: new Date().toISOString().split("T")[0],
        package_name: "",
      });
      await fetchMemberPayments();
    } catch (error) {
      console.error("Ödeme ekleme hatası:", error);
      toast.error("Ödeme eklenirken bir hata oluştu", {
        description: "Lütfen tekrar deneyin",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mb-6 border border-gray-300 dark:border-0 shadow-md text-[110%]">
      <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700">
        <div className="flex flex-col md:flex-row justify-between md:items-center space-y-2 md:space-y-0">
          <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">Üye Ödemeleri</CardTitle>
          <PaymentFilters 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            dateRange={dateRange}
            setDateRange={setDateRange}
            clearFilters={clearFilters}
            hasActiveFilters={!!searchTerm || !!dateRange?.from}
          />
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {/* Payment Summary Section */}
        <PaymentSummary 
          summary={paymentSummary} 
          setIsAddingPayment={setIsAddingPayment} 
        />
        
        {/* Payments Table */}
        <MemberPaymentsTable
          data={filteredPayments}
          columns={columns({
            onEdit: handleEdit,
            onDelete: handleDelete,
          })}
          isLoading={paymentsLoading}
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
        isLoading={isSubmitting}
        members={members}
        selectedMemberPackages={selectedMemberPackages}
        fetchMemberPackages={fetchMemberPackages}
      />

      <DeletePaymentDialog 
        payment={deletingPayment}
        isOpen={!!deletingPayment}
        onClose={() => setDeletingPayment(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isSubmitting}
      />

      <AddPaymentDialog 
        isOpen={isAddingPayment}
        onClose={() => setIsAddingPayment(false)}
        onSubmit={handleAddPayment}
        isLoading={isSubmitting}
        newPayment={newPayment}
        setNewPayment={setNewPayment}
        members={members}
        selectedMemberPackages={selectedMemberPackages}
        fetchMemberPackages={fetchMemberPackages}
      />
    </Card>
  );
}
