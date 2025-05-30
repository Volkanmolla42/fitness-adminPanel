export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      settings: {
        Row: {
          id: number;
          key: string;
          value: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          key: string;
          value: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          key?: string;
          value?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      appointments: {
        Row: {
          created_at: string;
          date: string;
          id: string;
          member_id: string;
          notes: string | null;
          service_id: string;
          status: string;
          time: string;
          trainer_id: string;
        };
        Insert: {
          created_at?: string;
          date: string;
          id?: string;
          member_id: string;
          notes?: string | null;
          service_id: string;
          status: string;
          time: string;
          trainer_id: string;
        };
        Update: {
          created_at?: string;
          date?: string;
          id?: string;
          member_id?: string;
          notes?: string | null;
          service_id?: string;
          status?: string;
          time?: string;
          trainer_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "appointments_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_trainer_id_fkey";
            columns: ["trainer_id"];
            isOneToOne: false;
            referencedRelation: "trainers";
            referencedColumns: ["id"];
          }
        ];
      };
      contact_messages: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          phone: string;
          message: string;
          status: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          name: string;
          phone: string;
          message: string;
          status?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          name?: string;
          phone?: string;
          message?: string;
          status?: string;
        };
        Relationships: [];
      };
      members: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          email: string;
          first_name: string;
          id: string;
          last_name: string;
          membership_type: string;
          phone: string;
          start_date: string;
          subscribed_services: string[];
          notes: string | null;
          active: boolean;
          postponement_count: number;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          email: string;
          first_name: string;
          id?: string;
          last_name: string;
          membership_type: string;
          phone: string;
          start_date: string;
          subscribed_services?: string[];
          notes?: string | null;
          active?: boolean;
          postponement_count?: number;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string;
          first_name?: string;
          id?: string;
          last_name?: string;
          membership_type?: string;
          phone?: string;
          start_date?: string;
          subscribed_services?: string[];
          notes?: string | null;
          active?: boolean;
          postponement_count?: number;
        };
        Relationships: [];
      };
      member_payments: {
        Row: {
          id: string;
          member_name: string;
          created_at: string;
          credit_card_paid: number;
          cash_paid: number;
          package_name: string;
        };
        Insert: {
          id?: string;
          member_name: string;
          created_at?: string;
          credit_card_paid?: number;
          cash_paid?: number;
          package_name: string;
        };
        Update: {
          id?: string;
          member_name?: string;
          created_at?: string;
          credit_card_paid?: number;
          cash_paid?: number;
          package_name?: string;
        };
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          description: string;
          price: number;
          duration: number;
          max_participants: number;
          session_count: number;
          isVipOnly: boolean;
          active: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          name: string;
          description: string;
          price: number;
          duration: number;
          max_participants: number;
          session_count: number;
          isVipOnly: boolean;
          active?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          name?: string;
          description?: string;
          price?: number;
          duration?: number;
          max_participants?: number;
          session_count?: number;
          isVipOnly?: boolean;
          active?: boolean;
        };
        Relationships: [];
      };
      trainers: {
        Row: {
          bio: string;
          categories: string[];
          created_at: string;
          email: string;
          first_name: string;
          id: string;
          last_name: string;
          name: string;
          phone: string;
          start_date: string;
          working_hours: {
            start: string;
            end: string;
          };
        };
        Insert: {
          bio: string;
          categories?: string[];
          created_at?: string;
          email: string;
          first_name: string;
          id?: string;
          last_name: string;
          name: string;
          phone: string;
          start_date: string;
          working_hours?: {
            start: string;
            end: string;
          };
        };
        Update: {
          bio?: string;
          categories?: string[];
          created_at?: string;
          email?: string;
          first_name?: string;
          id?: string;
          last_name?: string;
          name?: string;
          phone?: string;
          start_date?: string;
          working_hours?: {
            start: string;
            end: string;
          };
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
      PublicSchema["Views"])
  ? (PublicSchema["Tables"] &
      PublicSchema["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
  ? PublicSchema["Enums"][PublicEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
  ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;
