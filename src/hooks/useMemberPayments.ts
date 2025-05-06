import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Database } from "@/types/supabase";

type MemberPayment = Database["public"]["Tables"]["member_payments"]["Row"];

export const useMemberPayments = () => {
  const [memberPayments, setMemberPayments] = useState<MemberPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all member payments
  const fetchMemberPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("member_payments")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setMemberPayments(data || []);
    } catch (error) {
      console.error("Error fetching member payments:", error);
      toast.error("Ödemeler yüklenirken bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Add a new payment
  const addPayment = useCallback(async (newPayment: Omit<MemberPayment, "id">) => {
    try {
      const { error } = await supabase
        .from("member_payments")
        .insert(newPayment);

      if (error) {
        throw error;
      }

      toast.success("Ödeme başarıyla eklendi", {
        description: "Yeni üye ödemesi eklendi",
      });
      await fetchMemberPayments();
      return true;
    } catch (error) {
      console.error("Error adding payment:", error);
      toast.error("Ödeme eklenirken bir hata oluştu", {
        description: "Lütfen tekrar deneyin",
      });
      return false;
    }
  }, [fetchMemberPayments]);

  // Update an existing payment
  const updatePayment = useCallback(async (id: string, updatedPayment: Partial<MemberPayment>) => {
    try {
      const { error } = await supabase
        .from("member_payments")
        .update(updatedPayment)
        .eq("id", id);

      if (error) {
        throw error;
      }

      toast.success("Ödeme başarıyla güncellendi", {
        description: "Üye ödemesi güncellendi",
      });
      await fetchMemberPayments();
      return true;
    } catch (error) {
      console.error("Error updating payment:", error);
      toast.error("Ödeme güncellenirken bir hata oluştu", {
        description: "Lütfen tekrar deneyin",
      });
      return false;
    }
  }, [fetchMemberPayments]);

  // Delete a payment
  const deletePayment = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from("member_payments")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }

      toast.success("Ödeme başarıyla silindi");
      await fetchMemberPayments();
      return true;
    } catch (error) {
      console.error("Error deleting payment:", error);
      toast.error("Ödeme silinirken bir hata oluştu");
      return false;
    }
  }, [fetchMemberPayments]);

  // Load data on component mount
  useEffect(() => {
    fetchMemberPayments();
  }, [fetchMemberPayments]);

  return {
    memberPayments,
    isLoading,
    fetchMemberPayments,
    addPayment,
    updatePayment,
    deletePayment,
  };
}; 