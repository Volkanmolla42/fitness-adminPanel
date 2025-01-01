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

export const deleteService = async (id: string) => {
  const { error } = await supabase.from("services").delete().eq("id", id);

  if (error) throw error;
};

// Appointments
export const getAppointments = async () => {
  const { data, error } = await supabase
    .from("appointments")
    .select("*, member:members(*), trainer:trainers(*), service:services(*)")
    .order("date", { ascending: true });

  if (error) throw error;
  return data;
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
  appointment: Tables["appointments"]["Update"]
) => {
  const { data, error } = await supabase
    .from("appointments")
    .update(appointment)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteAppointment = async (id: string) => {
  const { error } = await supabase.from("appointments").delete().eq("id", id);

  if (error) throw error;
};
