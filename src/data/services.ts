import { Service } from "@/types/service";

export const defaultServices: Service[] = [
  {
    id: "1",
    name: "Kişisel Antrenman",
    description: "Birebir özel antrenman seansı",
    price: 400,
    duration: 60,
    maxParticipants: 1,
    category: "Fitness",
  },
  {
    id: "2",
    name: "Yoga Dersi",
    description: "Grup yoga dersi",
    price: 200,
    duration: 45,
    maxParticipants: 10,
    category: "Yoga",
  },
  {
    id: "3",
    name: "Fitness Değerlendirmesi",
    description: "Detaylı fitness ve sağlık değerlendirmesi",
    price: 300,
    duration: 90,
    maxParticipants: 1,
    category: "Fitness",
  },
];
