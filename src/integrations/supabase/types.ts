export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      campaign_creatives: {
        Row: {
          body: string | null
          campaign_id: string
          created_at: string
          headline: string | null
          id: string
          image_url: string | null
          model: string | null
        }
        Insert: {
          body?: string | null
          campaign_id: string
          created_at?: string
          headline?: string | null
          id?: string
          image_url?: string | null
          model?: string | null
        }
        Update: {
          body?: string | null
          campaign_id?: string
          created_at?: string
          headline?: string | null
          id?: string
          image_url?: string | null
          model?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_creatives_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          ad_type: string
          brand: string
          budget_pi: number
          created_at: string
          ends_at: string
          id: string
          owner_id: string
          pitch: string
          regions: string[]
          spent_pi: number
          starts_at: string
          status: string
          updated_at: string
          venues: string[]
        }
        Insert: {
          ad_type: string
          brand: string
          budget_pi: number
          created_at?: string
          ends_at: string
          id?: string
          owner_id: string
          pitch: string
          regions?: string[]
          spent_pi?: number
          starts_at: string
          status?: string
          updated_at?: string
          venues?: string[]
        }
        Update: {
          ad_type?: string
          brand?: string
          budget_pi?: number
          created_at?: string
          ends_at?: string
          id?: string
          owner_id?: string
          pitch?: string
          regions?: string[]
          spent_pi?: number
          starts_at?: string
          status?: string
          updated_at?: string
          venues?: string[]
        }
        Relationships: []
      }
      contract_events: {
        Row: {
          amount_pi: number | null
          contract_id: string
          created_at: string
          event_type: string
          id: string
          payload: Json
          tx_hash: string | null
        }
        Insert: {
          amount_pi?: number | null
          contract_id: string
          created_at?: string
          event_type: string
          id?: string
          payload?: Json
          tx_hash?: string | null
        }
        Update: {
          amount_pi?: number | null
          contract_id?: string
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
          tx_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_events_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          campaign_id: string
          created_at: string
          escrow_public_key: string
          funding_tx_hash: string | null
          id: string
          network: string
          state: string
          terms_hash: string
          terms_json: Json
          updated_at: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          escrow_public_key: string
          funding_tx_hash?: string | null
          id?: string
          network?: string
          state?: string
          terms_hash: string
          terms_json: Json
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          escrow_public_key?: string
          funding_tx_hash?: string | null
          id?: string
          network?: string
          state?: string
          terms_hash?: string
          terms_json?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: true
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_slots: {
        Row: {
          campaign_id: string
          cost_pi: number
          created_at: string
          duration_sec: number
          id: string
          impressions_est: number
          played: boolean
          played_at: string | null
          region: string | null
          slot_start: string
          venue_id: string
          venue_name: string
        }
        Insert: {
          campaign_id: string
          cost_pi: number
          created_at?: string
          duration_sec: number
          id?: string
          impressions_est?: number
          played?: boolean
          played_at?: string | null
          region?: string | null
          slot_start: string
          venue_id: string
          venue_name: string
        }
        Update: {
          campaign_id?: string
          cost_pi?: number
          created_at?: string
          duration_sec?: number
          id?: string
          impressions_est?: number
          played?: boolean
          played_at?: string | null
          region?: string | null
          slot_start?: string
          venue_id?: string
          venue_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_slots_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
