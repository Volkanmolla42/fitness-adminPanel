import { Service } from '@/types/service';

export const defaultServices: Service[] = [
  {
    id: "1",
    name: "Kişisel Antrenman",
    description: "1 saatlik birebir antrenman seansı",
    duration: 60,
    price: 300
  },
  {
    id: "2",
    name: "Pilates",
    description: "Grup pilates dersi",
    duration: 45,
    price: 200
  },
  {
    id: "3",
    name: "Yoga",
    description: "Grup yoga dersi",
    duration: 60,
    price: 200
  }
];
