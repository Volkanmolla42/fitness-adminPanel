export interface Appointment {
  id: string;
  memberId: string;
  trainerId: string;
  serviceId: string;
  date: string;
  time: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  notes?: string;
}
