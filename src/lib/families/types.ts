export interface Family {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}

export interface FamilyMember {
  family_id: string;
  user_id: string;
  role: "admin" | "member";
  display_name: string | null;
  joined_at: string;
}

export interface FamilyInvite {
  id: string;
  family_id: string;
  invite_code: string;
  created_by: string;
  expires_at: string | null;
  used_by: string | null;
  used_at: string | null;
  created_at: string;
}

export interface Queue {
  id: string;
  family_id: string;
  name: string;
  type: "solo" | "group";
  owner_id: string | null;
  share_code: string | null;
  created_at: string;
}

export interface QueueWithMemberCount extends Queue {
  member_count: number;
}

export interface QueueMember {
  queue_id: string;
  user_id: string;
  display_name: string | null;
}

export interface FamilySubscription {
  family_id: string;
  provider_id: number;
  provider_name: string;
  logo_path: string;
}
