export interface Trainer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  specialization?: string;
  bio?: string;
  availability?: string[];
}
