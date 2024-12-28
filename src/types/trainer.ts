export interface Trainer {
    name: any;
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    specialization?: string;
    bio?: string;
    availability?: string[];
    createdAt?: string;
    updatedAt?: string;
}
