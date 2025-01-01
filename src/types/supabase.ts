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
      members: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          email: string;
          end_date: string;
          first_name: string;
          id: string;
          last_name: string;
          membership_type: string;
          phone: string;
          start_date: string;
          subscribed_services: string[];
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          email: string;
          end_date: string;
          first_name: string;
          id?: string;
          last_name: string;
          membership_type: string;
          phone: string;
          start_date: string;
          subscribed_services?: string[];
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string;
          end_date?: string;
          first_name?: string;
          id?: string;
          last_name?: string;
          membership_type?: string;
          phone?: string;
          start_date?: string;
          subscribed_services?: string[];
        };
        Relationships: [];
      };
      services: {
        Row: {
          category: string;
          created_at: string;
          description: string;
          duration: number;
          id: string;
          max_participants: number;
          name: string;
          price: number;
        };
        Insert: {
          category: string;
          created_at?: string;
          description: string;
          duration: number;
          id?: string;
          max_participants: number;
          name: string;
          price: number;
        };
        Update: {
          category?: string;
          created_at?: string;
          description?: string;
          duration?: number;
          id?: string;
          max_participants?: number;
          name?: string;
          price?: number;
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
          working_hours: Json;
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
          working_hours?: Json;
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
          working_hours?: Json;
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
