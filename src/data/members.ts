import { Member } from "@/types/member";

export const defaultMembers: Member[] = [
  {
    id: "1",
    name: "Ahmet Yılmaz",
    email: "ahmet@example.com",
    phone: "(555) 123-4567",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=ahmet",
    membershipType: "premium",
    subscribedServices: ["Kişisel Antrenman", "Fitness Değerlendirmesi"],
    startDate: "2024-01-15",
    endDate: "2025-01-15",
  },
  {
    id: "2",
    name: "Zeynep Kaya",
    email: "zeynep@example.com",
    phone: "(555) 234-5678",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=zeynep",
    membershipType: "basic",
    subscribedServices: ["Yoga Dersi"],
    startDate: "2024-02-01",
    endDate: "2025-04-22",
  },
  {
    id: "3",
    name: "Volkan Molla",
    email: "vm@example.com",
    phone: "(555) 234-5678",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=volkan",
    membershipType: "basic",
    subscribedServices: ["fitness"],
    startDate: "2024-01-01",
    endDate: "2025-05-2",
  },
];
