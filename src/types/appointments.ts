import type { Database } from "./supabase";

export type Member = Database["public"]["Tables"]["members"]["Row"];
export type Trainer = Database["public"]["Tables"]["trainers"]["Row"];
export type Service = Database["public"]["Tables"]["services"]["Row"];
export type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
export type FilterType = "all" | "today"| "tomorrow" | "weekly" | "monthly" | "custom";
