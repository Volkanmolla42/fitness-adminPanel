import { Appointment } from '@/types';

export const defaultAppointments: Appointment[] = [
  {
    id: "1",
    memberId: "1",
    trainerId: "1",
    serviceId: "1",
    date: new Date().toISOString().split('T')[0],
    time: "09:00",
    status: "completed",
    notes: "İlk seans tamamlandı"
  },
  {
    id: "2",
    memberId: "2",
    trainerId: "2",
    serviceId: "2",
    date: new Date().toISOString().split('T')[0],
    time: "10:30",
    status: "in-progress",
    notes: "Devam eden seans"
  },
  {
    id: "3",
    memberId: "3",
    trainerId: "1",
    serviceId: "3",
    date: new Date().toISOString().split('T')[0],
    time: "11:00",
    status: "scheduled",
    notes: ""
  },
  {
    id: "4",
    memberId: "1",
    trainerId: "2",
    serviceId: "1",
    date: new Date().toISOString().split('T')[0],
    time: "14:00",
    status: "scheduled",
    notes: "İkinci seans"
  },
  {
    id: "5",
    memberId: "2",
    trainerId: "1",
    serviceId: "2",
    date: new Date().toISOString().split('T')[0],
    time: "15:30",
    status: "cancelled",
    notes: "Üye iptal etti"
  }
];
