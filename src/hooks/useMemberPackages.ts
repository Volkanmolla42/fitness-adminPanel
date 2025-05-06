import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Database } from "@/types/supabase";

type Member = Database["public"]["Tables"]["members"]["Row"];
type Service = Database["public"]["Tables"]["services"]["Row"];

export const useMemberPackages = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedMemberPackages, setSelectedMemberPackages] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all members
  const fetchMembers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .order("first_name");

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error("Error fetching members:", error);
      toast.error("Üyeler yüklenirken bir hata oluştu");
    }
  }, []);

  // Fetch all services (packages)
  const fetchServices = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("name");

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error("Error fetching services:", error);
      toast.error("Paketler yüklenirken bir hata oluştu");
    }
  }, []);

  // Fetch member-specific packages
  const fetchMemberPackages = useCallback(async (memberName: string) => {
    if (!memberName) {
      setSelectedMemberPackages([]);
      return [];
    }

    // Parse the member name
    const nameParts = memberName.split(" ");
    if (nameParts.length < 2) {
      toast.error("Geçersiz üye adı formatı");
      setSelectedMemberPackages([]);
      return [];
    }

    // Last word is last name, the rest is first name
    const lastName = nameParts.pop() || "";
    const firstName = nameParts.join(" ");

    try {
      // Try exact match first
      const { data: memberData, error: memberError } = await supabase
        .from("members")
        .select("subscribed_services, id")
        .eq("first_name", firstName)
        .eq("last_name", lastName)
        .single();

      if (memberError) {
        // If exact match fails, try a more flexible search
        const { data: allMembers, error: allMembersError } = await supabase
          .from("members")
          .select("subscribed_services, id, first_name, last_name");

        if (allMembersError) {
          toast.error("Üye bilgileri alınamadı");
          setSelectedMemberPackages([]);
          return [];
        }

        // Find member with matching full name
        const matchedMember = allMembers.find(
          (member) =>
            `${member.first_name} ${member.last_name}`.toLowerCase() ===
            memberName.toLowerCase()
        );

        if (!matchedMember) {
          toast.error("Üye bulunamadı");
          setSelectedMemberPackages([]);
          return [];
        }

        const subscribedServices = matchedMember.subscribed_services || [];
        const filteredPackages = services.filter((pkg) =>
          subscribedServices.includes(pkg.id)
        );

        setSelectedMemberPackages(filteredPackages);
        return filteredPackages;
      }

      if (!memberData) {
        toast.error("Üye bulunamadı");
        setSelectedMemberPackages([]);
        return [];
      }

      const subscribedServices = memberData.subscribed_services || [];
      const filteredPackages = services.filter((pkg) =>
        subscribedServices.includes(pkg.id)
      );

      setSelectedMemberPackages(filteredPackages);
      return filteredPackages;
    } catch (error) {
      console.error("Error fetching member packages:", error);
      toast.error("Üye paketleri alınamadı");
      setSelectedMemberPackages([]);
      return [];
    }
  }, [services]);

  // Initialize data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchMembers(), fetchServices()]);
      setIsLoading(false);
    };
    
    loadData();
  }, [fetchMembers, fetchServices]);

  return {
    members,
    services,
    selectedMemberPackages,
    isLoading,
    fetchMembers,
    fetchServices,
    fetchMemberPackages,
  };
}; 