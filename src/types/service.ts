export interface Service {
  id: string;
  name: string;
  description?: string;
  duration?: number; // in minutes
  price?: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
