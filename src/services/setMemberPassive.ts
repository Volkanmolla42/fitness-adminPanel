import { supabase } from "@/lib/supabase";

export async function setMemberPassive(memberId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("members")
      .update({ active: false })
      .eq("id", memberId);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
