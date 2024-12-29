export type MembershipType = "basic" | "premium" | "vip";

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  membershipType: MembershipType;
  subscribedServices: string[];
  startDate: string;
  endDate: string;
  avatarUrl: string;
}
