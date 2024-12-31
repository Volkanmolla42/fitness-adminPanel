export type MembershipType = "basic" | "vip";

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  membershipType: MembershipType;
  subscribedServices: string[];
  startDate: string;
  endDate: string;
  avatarUrl?: string;
}
