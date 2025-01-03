export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  maxParticipants: number;
  category: string;
  type: "monthly" | "session";
}
