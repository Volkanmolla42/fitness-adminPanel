import { supabase } from "./supabase";
import type { Database } from "@/types/supabase";

type Tables = Database["public"]["Tables"];

// Members
export const getMembers = async () => {
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

export const getMember = async (id: string) => {
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
};

export const createMember = async (member: Tables["members"]["Insert"]) => {
  const { data, error } = await supabase
    .from("members")
    .insert(member)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateMember = async (
  id: string,
  member: Tables["members"]["Update"]
) => {
  const { data, error } = await supabase
    .from("members")
    .update(member)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteMember = async (id: string) => {
  const { error } = await supabase.from("members").delete().eq("id", id);

  if (error) throw error;
};

// Trainers
export const getTrainers = async () => {
  const { data, error } = await supabase
    .from("trainers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

export const createTrainer = async (trainer: Tables["trainers"]["Insert"]) => {
  const { data, error } = await supabase
    .from("trainers")
    .insert(trainer)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateTrainer = async (
  id: string,
  trainer: Tables["trainers"]["Update"]
) => {
  const { data, error } = await supabase
    .from("trainers")
    .update(trainer)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateTrainerStatus = async (
  id: string,
  status: "active" | "passive"
) => {
  const { data, error } = await supabase
    .from("trainers")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteTrainer = async (id: string) => {
  const { error } = await supabase.from("trainers").delete().eq("id", id);

  if (error) throw error;
};

// Services
export const getServices = async () => {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

export const createService = async (service: Tables["services"]["Insert"]) => {
  const { data, error } = await supabase
    .from("services")
    .insert(service)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateService = async (
  id: string,
  service: Tables["services"]["Update"]
) => {
  const { data, error } = await supabase
    .from("services")
    .update(service)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateServiceStatus = async (id: string, active: boolean) => {
  const { data, error } = await supabase
    .from("services")
    .update({ active })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteService = async (id: string) => {
  const { error } = await supabase.from("services").delete().eq("id", id);

  if (error) throw error;
};

// Member Payments
export const getMemberPayments = async () => {
  const { data, error } = await supabase
    .from("member_payments")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

// Appointments
export const getAppointments = async () => {
  console.log("Fetching appointments...");

  try {
    // First, get all appointments
    const { data: appointmentsData, error: appointmentsError } =
      await supabase.from("appointments").select(`
        *,
        service:services(id, name),
        member:members(id, first_name, last_name),
        trainer:trainers(id, first_name, last_name)
      `);

    if (appointmentsError) {
      console.error("Error fetching appointments:", appointmentsError);
      throw appointmentsError;
    }

    if (!appointmentsData) {
      console.log("No appointments found");
      return [];
    }

    console.log("Appointments fetched:");

    return appointmentsData;
  } catch (error) {
    console.error("Exception in getAppointments:", error);
    throw error;
  }
};

export const createAppointment = async (
  appointment: Tables["appointments"]["Insert"]
) => {
  const { data, error } = await supabase
    .from("appointments")
    .insert(appointment)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateAppointment = async (
  id: string,
  appointment: Tables["appointments"]["Update"],
  isPostpone: boolean = false
) => {
  const { data, error } = await supabase
    .from("appointments")
    .update(appointment)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  if (isPostpone) {
    // Önce ilgili üyeyi getir
    const { data: member, error: memberError } = await supabase
      .from("members")
      .select("postponement_count")
      .eq("id", appointment.member_id)
      .single();

    if (memberError) throw memberError;

    // Sonra postponement_count değerini 1 azalt
    const newCount = (member.postponement_count || 0) - 1;

    const { error: updateError } = await supabase
      .from("members")
      .update({ postponement_count: newCount })
      .eq("id", appointment.member_id);

    if (updateError) throw updateError;
  }

  return data;
};

export const deleteAppointment = async (id: string) => {
  const { error } = await supabase.from("appointments").delete().eq("id", id);

  if (error) throw error;
};

// Delete an appointment by ID
export async function deleteAppointmentById(appointmentId: string) {
  try {
    const { error } = await supabase
      .from("appointments")
      .delete()
      .eq("id", appointmentId);

    if (error) {
      console.error("Error deleting appointment:", error);
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error("Error in deleteAppointmentById:", error);
    return { success: false, error };
  }
}
