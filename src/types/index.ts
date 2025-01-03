export interface Trainer {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  email: string;
  phone: string;
  bio: string;
  start_date: string;
  avatar_url?: string;
  specialization?: string;
  address?: string;
  working_hours: {
    start: string;
    end: string;
  };
  categories: string[];
  created_at: string;
  hasOngoingAppointment?: boolean;
}

export interface Service {
  id: string;
  name: string;
}

export interface Member {
  id: string;
  first_name: string;
  last_name: string;
}

export interface AppointmentTrainer {
  id: string;
  first_name: string;
  last_name: string;
}

export interface Appointment {
  id: string;
  trainer_id: string;
  member_id: string;
  service_id: string;
  date: string;
  time: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  created_at?: string;
  service?: Service;
  member?: Member;
  trainer?: AppointmentTrainer;
}

export type TrainerInput = Omit<Trainer, 'id' | 'created_at' | 'hasOngoingAppointment'>;