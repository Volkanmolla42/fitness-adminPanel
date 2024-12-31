export interface Trainer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  categories: string[];
  bio?: string;
  availability?: string[];
  startDate: string;
  workingHours: {
    start: string;
    end: string;
  };
}
