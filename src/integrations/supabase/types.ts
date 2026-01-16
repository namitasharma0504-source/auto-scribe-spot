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
      blog_articles: {
        Row: {
          author_name: string | null
          category: string | null
          content: string
          created_at: string
          excerpt: string | null
          featured_image: string | null
          id: string
          is_published: boolean | null
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          slug: string
          tags: string[] | null
          title: string
          updated_at: string
          video_url: string | null
          view_count: number | null
        }
        Insert: {
          author_name?: string | null
          category?: string | null
          content: string
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string
          video_url?: string | null
          view_count?: number | null
        }
        Update: {
          author_name?: string | null
          category?: string | null
          content?: string
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          video_url?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      disputes: {
        Row: {
          admin_response: string | null
          created_at: string | null
          gin: string | null
          id: string
          listing_id: string | null
          outcome: string | null
          partner_id: string
          reason: string
          resolution_date: string | null
          status: string | null
          supporting_evidence: string[] | null
        }
        Insert: {
          admin_response?: string | null
          created_at?: string | null
          gin?: string | null
          id?: string
          listing_id?: string | null
          outcome?: string | null
          partner_id: string
          reason: string
          resolution_date?: string | null
          status?: string | null
          supporting_evidence?: string[] | null
        }
        Update: {
          admin_response?: string | null
          created_at?: string | null
          gin?: string | null
          id?: string
          listing_id?: string | null
          outcome?: string | null
          partner_id?: string
          reason?: string
          resolution_date?: string | null
          status?: string | null
          supporting_evidence?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "disputes_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "partner_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      garage_claim_requests: {
        Row: {
          admin_notes: string | null
          business_proof: string | null
          claimant_email: string
          claimant_name: string
          claimant_phone: string
          claimant_user_id: string
          created_at: string
          garage_id: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          business_proof?: string | null
          claimant_email: string
          claimant_name: string
          claimant_phone: string
          claimant_user_id: string
          created_at?: string
          garage_id: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          business_proof?: string | null
          claimant_email?: string
          claimant_name?: string
          claimant_phone?: string
          claimant_user_id?: string
          created_at?: string
          garage_id?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "garage_claim_requests_garage_id_fkey"
            columns: ["garage_id"]
            isOneToOne: false
            referencedRelation: "garages"
            referencedColumns: ["id"]
          },
        ]
      }
      garage_leads: {
        Row: {
          admin_notes: string | null
          contacted_at: string | null
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          garage_id: string
          id: string
          service_required: string
          status: string
          updated_at: string
          vehicle_details: string | null
        }
        Insert: {
          admin_notes?: string | null
          contacted_at?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          garage_id: string
          id?: string
          service_required: string
          status?: string
          updated_at?: string
          vehicle_details?: string | null
        }
        Update: {
          admin_notes?: string | null
          contacted_at?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          garage_id?: string
          id?: string
          service_required?: string
          status?: string
          updated_at?: string
          vehicle_details?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "garage_leads_garage_id_fkey"
            columns: ["garage_id"]
            isOneToOne: false
            referencedRelation: "garages"
            referencedColumns: ["id"]
          },
        ]
      }
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
          subscription_active: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          business_name?: string | null
          contact_phone?: string | null
          created_at?: string
          garage_id?: string | null
          id?: string
          subscription_active?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          business_name?: string | null
          contact_phone?: string | null
          created_at?: string
          garage_id?: string | null
          id?: string
          subscription_active?: boolean
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
          approval_notes: string | null
          city: string | null
          country: string | null
          created_at: string
          has_discounts: boolean | null
          id: string
          is_approved: boolean | null
          is_certified: boolean | null
          is_recommended: boolean | null
          is_verified: boolean | null
          listing_type: string | null
          location_link: string | null
          name: string
          owner_id: string | null
          partner_id: string | null
          phone: string | null
          photo_url: string | null
          pricing: string | null
          rating: number | null
          referral_source: string | null
          response_time: string | null
          review_count: number | null
          services: string[] | null
          slug: string | null
          special_offers: string | null
          state: string | null
          submitted_by: string | null
          updated_at: string
          walk_in_welcome: boolean | null
        }
        Insert: {
          address?: string | null
          approval_notes?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          has_discounts?: boolean | null
          id?: string
          is_approved?: boolean | null
          is_certified?: boolean | null
          is_recommended?: boolean | null
          is_verified?: boolean | null
          listing_type?: string | null
          location_link?: string | null
          name: string
          owner_id?: string | null
          partner_id?: string | null
          phone?: string | null
          photo_url?: string | null
          pricing?: string | null
          rating?: number | null
          referral_source?: string | null
          response_time?: string | null
          review_count?: number | null
          services?: string[] | null
          slug?: string | null
          special_offers?: string | null
          state?: string | null
          submitted_by?: string | null
          updated_at?: string
          walk_in_welcome?: boolean | null
        }
        Update: {
          address?: string | null
          approval_notes?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          has_discounts?: boolean | null
          id?: string
          is_approved?: boolean | null
          is_certified?: boolean | null
          is_recommended?: boolean | null
          is_verified?: boolean | null
          listing_type?: string | null
          location_link?: string | null
          name?: string
          owner_id?: string | null
          partner_id?: string | null
          phone?: string | null
          photo_url?: string | null
          pricing?: string | null
          rating?: number | null
          referral_source?: string | null
          response_time?: string | null
          review_count?: number | null
          services?: string[] | null
          slug?: string | null
          special_offers?: string | null
          state?: string | null
          submitted_by?: string | null
          updated_at?: string
          walk_in_welcome?: boolean | null
        }
        Relationships: []
      }
      partner_applications: {
        Row: {
          admin_notes: string | null
          city: string | null
          created_at: string
          education: string
          email: string
          full_name: string
          id: string
          occupation: string | null
          phone: string
          reviewed_at: string | null
          reviewed_by: string | null
          state: string
          status: string
          updated_at: string
          webinar_booked_at: string | null
          webinar_slot: string | null
          why_join: string
        }
        Insert: {
          admin_notes?: string | null
          city?: string | null
          created_at?: string
          education: string
          email: string
          full_name: string
          id?: string
          occupation?: string | null
          phone: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          state: string
          status?: string
          updated_at?: string
          webinar_booked_at?: string | null
          webinar_slot?: string | null
          why_join: string
        }
        Update: {
          admin_notes?: string | null
          city?: string | null
          created_at?: string
          education?: string
          email?: string
          full_name?: string
          id?: string
          occupation?: string | null
          phone?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          state?: string
          status?: string
          updated_at?: string
          webinar_booked_at?: string | null
          webinar_slot?: string | null
          why_join?: string
        }
        Relationships: []
      }
      partner_feedback: {
        Row: {
          created_at: string | null
          earning_potential_rating: number | null
          ease_of_use_rating: number | null
          id: string
          overall_rating: number | null
          partner_id: string
          payment_transparency_rating: number | null
          suggestions: string | null
          support_quality_rating: number | null
          written_feedback: string | null
        }
        Insert: {
          created_at?: string | null
          earning_potential_rating?: number | null
          ease_of_use_rating?: number | null
          id?: string
          overall_rating?: number | null
          partner_id: string
          payment_transparency_rating?: number | null
          suggestions?: string | null
          support_quality_rating?: number | null
          written_feedback?: string | null
        }
        Update: {
          created_at?: string | null
          earning_potential_rating?: number | null
          ease_of_use_rating?: number | null
          id?: string
          overall_rating?: number | null
          partner_id?: string
          payment_transparency_rating?: number | null
          suggestions?: string | null
          support_quality_rating?: number | null
          written_feedback?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_feedback_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_listings: {
        Row: {
          approved_at: string | null
          base_earning: number | null
          created_at: string | null
          gin: string | null
          gms_earning: number | null
          gms_payment_id: string | null
          gms_upsell: boolean | null
          id: string
          listing_id: string | null
          partner_id: string
          payout_date: string | null
          payout_status: string | null
          payout_transaction_id: string | null
          rejection_reason: string | null
          reputation_earning: number | null
          reputation_payment_id: string | null
          reputation_upsell: boolean | null
          status: string | null
          submitted_at: string | null
          total_earning: number | null
        }
        Insert: {
          approved_at?: string | null
          base_earning?: number | null
          created_at?: string | null
          gin?: string | null
          gms_earning?: number | null
          gms_payment_id?: string | null
          gms_upsell?: boolean | null
          id?: string
          listing_id?: string | null
          partner_id: string
          payout_date?: string | null
          payout_status?: string | null
          payout_transaction_id?: string | null
          rejection_reason?: string | null
          reputation_earning?: number | null
          reputation_payment_id?: string | null
          reputation_upsell?: boolean | null
          status?: string | null
          submitted_at?: string | null
          total_earning?: number | null
        }
        Update: {
          approved_at?: string | null
          base_earning?: number | null
          created_at?: string | null
          gin?: string | null
          gms_earning?: number | null
          gms_payment_id?: string | null
          gms_upsell?: boolean | null
          id?: string
          listing_id?: string | null
          partner_id?: string
          payout_date?: string | null
          payout_status?: string | null
          payout_transaction_id?: string | null
          rejection_reason?: string | null
          reputation_earning?: number | null
          reputation_payment_id?: string | null
          reputation_upsell?: boolean | null
          status?: string | null
          submitted_at?: string | null
          total_earning?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_listings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "garages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_listings_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          aadhaar_document: string | null
          aadhaar_number: string | null
          account_holder_name: string | null
          account_number: string | null
          bank_name: string | null
          bank_verified: boolean | null
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          ifsc_code: string | null
          kyc_status: string | null
          last_login: string | null
          pan_document: string | null
          pan_number: string | null
          phone: string
          profile_photo: string | null
          status: string | null
          user_id: string | null
          username: string
        }
        Insert: {
          aadhaar_document?: string | null
          aadhaar_number?: string | null
          account_holder_name?: string | null
          account_number?: string | null
          bank_name?: string | null
          bank_verified?: boolean | null
          created_at?: string | null
          email?: string | null
          full_name: string
          id: string
          ifsc_code?: string | null
          kyc_status?: string | null
          last_login?: string | null
          pan_document?: string | null
          pan_number?: string | null
          phone: string
          profile_photo?: string | null
          status?: string | null
          user_id?: string | null
          username: string
        }
        Update: {
          aadhaar_document?: string | null
          aadhaar_number?: string | null
          account_holder_name?: string | null
          account_number?: string | null
          bank_name?: string | null
          bank_verified?: boolean | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          ifsc_code?: string | null
          kyc_status?: string | null
          last_login?: string | null
          pan_document?: string | null
          pan_number?: string | null
          phone?: string
          profile_photo?: string | null
          status?: string | null
          user_id?: string | null
          username?: string
        }
        Relationships: []
      }
      payouts: {
        Row: {
          amount: number
          created_at: string | null
          data_collection_count: number | null
          data_collection_earnings: number | null
          gms_earnings: number | null
          gms_sales_count: number | null
          id: string
          partner_id: string
          payout_date: string
          processed_at: string | null
          reputation_earnings: number | null
          reputation_sales_count: number | null
          status: string | null
          transaction_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          data_collection_count?: number | null
          data_collection_earnings?: number | null
          gms_earnings?: number | null
          gms_sales_count?: number | null
          id?: string
          partner_id: string
          payout_date: string
          processed_at?: string | null
          reputation_earnings?: number | null
          reputation_sales_count?: number | null
          status?: string | null
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          data_collection_count?: number | null
          data_collection_earnings?: number | null
          gms_earnings?: number | null
          gms_sales_count?: number | null
          id?: string
          partner_id?: string
          payout_date?: string
          processed_at?: string | null
          reputation_earnings?: number | null
          reputation_sales_count?: number | null
          status?: string | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payouts_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
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
          customer_display_name: string | null
          dispute_reason: string | null
          disputed_at: string | null
          garage_id: string | null
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
          customer_display_name?: string | null
          dispute_reason?: string | null
          disputed_at?: string | null
          garage_id?: string | null
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
          customer_display_name?: string | null
          dispute_reason?: string | null
          disputed_at?: string | null
          garage_id?: string | null
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
      verification_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          garage_id: string
          id: string
          request_message: string | null
          requested_by: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          garage_id: string
          id?: string
          request_message?: string | null
          requested_by: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          garage_id?: string
          id?: string
          request_message?: string | null
          requested_by?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_requests_garage_id_fkey"
            columns: ["garage_id"]
            isOneToOne: false
            referencedRelation: "garages"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_email_role_conflict: {
        Args: { check_email: string }
        Returns: {
          existing_role: string
          has_conflict: boolean
        }[]
      }
      generate_garage_slug: { Args: { garage_name: string }; Returns: string }
      generate_gin: { Args: never; Returns: string }
      generate_partner_id: { Args: never; Returns: string }
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
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      app_role: "admin" | "customer" | "garage_owner" | "partner"
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
      app_role: ["admin", "customer", "garage_owner", "partner"],
    },
  },
} as const
