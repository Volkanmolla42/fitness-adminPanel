import { Trainer } from "@/types/trainer";

export const defaultTrainers: Trainer[] = [
  {
    id: "1",
    name: "Can Yılmaz",
    email: "can@example.com",
    phone: "555-0201",
    categories: ["Fitness"],
    bio: "5 yıllık fitness eğitmeni",
    startDate: "2024-01-01",
    workingHours: {
      start: "09:00",
      end: "17:00",
    },
  },
  {
    id: "2",
    name: "Zeynep Yılmaz",
    email: "zeynep@example.com",
    phone: "555-0202",
    categories: ["Pilates", "Yoga"],
    bio: "3 yıllık pilates eğitmeni",
    startDate: "2024-01-01",
    workingHours: {
      start: "10:00",
      end: "18:00",
    },
  },
];
