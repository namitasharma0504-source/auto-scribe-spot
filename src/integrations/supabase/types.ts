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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      garage_meta_credentials: {
        Row: {
          created_at: string
          garage_id: string
          id: string
          is_verified: boolean | null
          last_verified_at: string | null
          meta_access_token: string | null
          meta_ad_account_id: string | null
          meta_app_id: string | null
          meta_app_secret: string | null
          meta_page_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          garage_id: string
          id?: string
          is_verified?: boolean | null
          last_verified_at?: string | null
          meta_access_token?: string | null
          meta_ad_account_id?: string | null
          meta_app_id?: string | null
          meta_app_secret?: string | null
          meta_page_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          garage_id?: string
          id?: string
          is_verified?: boolean | null
          last_verified_at?: string | null
          meta_access_token?: string | null
          meta_ad_account_id?: string | null
          meta_app_id?: string | null
          meta_app_secret?: string | null
          meta_page_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "garage_meta_credentials_garage_id_fkey"
            columns: ["garage_id"]
            isOneToOne: true
            referencedRelation: "garages"
            referencedColumns: ["id"]
          },
        ]
      }
      garage_offers: {
        Row: {
          created_at: string
          description: string | null
          discount_value: string | null
          garage_id: string
          id: string
          is_active: boolean | null
          is_promoted_to_meta: boolean | null
          meta_ad_id: string | null
          template_type: string
          title: string
          updated_at: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          discount_value?: string | null
          garage_id: string
          id?: string
          is_active?: boolean | null
          is_promoted_to_meta?: boolean | null
          meta_ad_id?: string | null
          template_type: string
          title: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          discount_value?: string | null
          garage_id?: string
          id?: string
          is_active?: boolean | null
          is_promoted_to_meta?: boolean | null
          meta_ad_id?: string | null
          template_type?: string
          title?: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "garage_offers_garage_id_fkey"
            columns: ["garage_id"]
            isOneToOne: false
            referencedRelation: "garages"
            referencedColumns: ["id"]
          },
        ]
      }
      garage_owners: {
        Row: {
          business_name: string | null
          contact_phone: string | null
          created_at: string
          garage_id: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          business_name?: string | null
          contact_phone?: string | null
          created_at?: string
          garage_id?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          business_name?: string | null
          contact_phone?: string | null
          created_at?: string
          garage_id?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "garage_owners_garage_id_fkey"
            columns: ["garage_id"]
            isOneToOne: false
            referencedRelation: "garages"
            referencedColumns: ["id"]
          },
        ]
      }
      garage_photos: {
        Row: {
          created_at: string
          display_order: number | null
          garage_id: string
          id: string
          photo_url: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          garage_id: string
          id?: string
          photo_url: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          garage_id?: string
          id?: string
          photo_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "garage_photos_garage_id_fkey"
            columns: ["garage_id"]
            isOneToOne: false
            referencedRelation: "garages"
            referencedColumns: ["id"]
          },
        ]
      }
      garages: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          has_discounts: boolean | null
          id: string
          is_certified: boolean | null
          is_recommended: boolean | null
          is_verified: boolean | null
          location_link: string | null
          name: string
          owner_id: string | null
          phone: string | null
          photo_url: string | null
          pricing: string | null
          rating: number | null
          response_time: string | null
          review_count: number | null
          services: string[] | null
          special_offers: string | null
          state: string | null
          updated_at: string
          walk_in_welcome: boolean | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          has_discounts?: boolean | null
          id?: string
          is_certified?: boolean | null
          is_recommended?: boolean | null
          is_verified?: boolean | null
          location_link?: string | null
          name: string
          owner_id?: string | null
          phone?: string | null
          photo_url?: string | null
          pricing?: string | null
          rating?: number | null
          response_time?: string | null
          review_count?: number | null
          services?: string[] | null
          special_offers?: string | null
          state?: string | null
          updated_at?: string
          walk_in_welcome?: boolean | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          has_discounts?: boolean | null
          id?: string
          is_certified?: boolean | null
          is_recommended?: boolean | null
          is_verified?: boolean | null
          location_link?: string | null
          name?: string
          owner_id?: string | null
          phone?: string | null
          photo_url?: string | null
          pricing?: string | null
          rating?: number | null
          response_time?: string | null
          review_count?: number | null
          services?: string[] | null
          special_offers?: string | null
          state?: string | null
          updated_at?: string
          walk_in_welcome?: boolean | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          total_points: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          total_points?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          total_points?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      redemptions: {
        Row: {
          created_at: string
          garage_name: string | null
          id: string
          points_spent: number
          reward_name: string
          status: string | null
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          garage_name?: string | null
          id?: string
          points_spent: number
          reward_name: string
          status?: string | null
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          garage_name?: string | null
          id?: string
          points_spent?: number
          reward_name?: string
          status?: string | null
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      rewards_history: {
        Row: {
          created_at: string
          id: string
          points: number
          reason: string
          review_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          points: number
          reason: string
          review_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          points?: number
          reason?: string
          review_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rewards_history_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "user_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      user_reviews: {
        Row: {
          created_at: string
          garage_location: string | null
          garage_name: string
          id: string
          is_verified: boolean | null
          points_earned: number | null
          rating: number
          review_text: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          garage_location?: string | null
          garage_name: string
          id?: string
          is_verified?: boolean | null
          points_earned?: number | null
          rating: number
          review_text?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          garage_location?: string | null
          garage_name?: string
          id?: string
          is_verified?: boolean | null
          points_earned?: number | null
          rating?: number
          review_text?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_public_reviews: {
        Args: never
        Returns: {
          created_at: string
          garage_location: string
          garage_name: string
          id: string
          is_verified: boolean
          rating: number
          review_text: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "customer" | "garage_owner"
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
    Enums: {
      app_role: ["admin", "customer", "garage_owner"],
    },
  },
} as const
