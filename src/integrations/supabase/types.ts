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
      equipment: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          quantity_total: number
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          quantity_total?: number
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          quantity_total?: number
          updated_at?: string
        }
        Relationships: []
      }
      equipment_checkouts: {
        Row: {
          checkout_date: string
          created_at: string
          equipment_id: string
          id: string
          notes: string | null
          quantity: number
          return_date: string
          status: Database["public"]["Enums"]["checkout_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          checkout_date: string
          created_at?: string
          equipment_id: string
          id?: string
          notes?: string | null
          quantity?: number
          return_date: string
          status?: Database["public"]["Enums"]["checkout_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          checkout_date?: string
          created_at?: string
          equipment_id?: string
          id?: string
          notes?: string | null
          quantity?: number
          return_date?: string
          status?: Database["public"]["Enums"]["checkout_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_checkouts_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_checkouts_user_profile_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      event_checkins: {
        Row: {
          checked_in_at: string
          checked_in_by: string | null
          created_at: string
          event_id: string
          id: string
          method: string
          registration_id: string
        }
        Insert: {
          checked_in_at?: string
          checked_in_by?: string | null
          created_at?: string
          event_id: string
          id?: string
          method?: string
          registration_id: string
        }
        Update: {
          checked_in_at?: string
          checked_in_by?: string | null
          created_at?: string
          event_id?: string
          id?: string
          method?: string
          registration_id?: string
        }
        Relationships: []
      }
      event_certificates: {
        Row: {
          certificate_url: string | null
          created_at: string
          event_id: string
          id: string
          issued_at: string
          registration_id: string
        }
        Insert: {
          certificate_url?: string | null
          created_at?: string
          event_id: string
          id?: string
          issued_at?: string
          registration_id: string
        }
        Update: {
          certificate_url?: string | null
          created_at?: string
          event_id?: string
          id?: string
          issued_at?: string
          registration_id?: string
        }
        Relationships: []
      }
      event_gallery: {
        Row: {
          alt_text: string | null
          caption: string | null
          created_at: string
          event_id: string
          id: string
          image_url: string
          is_cover: boolean
          is_public_approved: boolean
          photo_release_status: string | null
          photographer_or_source: string | null
          sort_order: number
          source: string
          uploaded_by: string | null
        }
        Insert: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string
          event_id: string
          id?: string
          image_url: string
          is_cover?: boolean
          is_public_approved?: boolean
          photo_release_status?: string | null
          photographer_or_source?: string | null
          sort_order?: number
          source?: string
          uploaded_by?: string | null
        }
        Update: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string
          event_id?: string
          id?: string
          image_url?: string
          is_cover?: boolean
          is_public_approved?: boolean
          photo_release_status?: string | null
          photographer_or_source?: string | null
          sort_order?: number
          source?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      event_grants: {
        Row: {
          event_id: string
          grant_id: string
          sort_order: number
        }
        Insert: {
          event_id: string
          grant_id: string
          sort_order?: number
        }
        Update: {
          event_id?: string
          grant_id?: string
          sort_order?: number
        }
        Relationships: []
      }
      event_partners: {
        Row: {
          event_id: string
          partner_id: string
          sort_order: number
          sponsorship_level: string | null
        }
        Insert: {
          event_id: string
          partner_id: string
          sort_order?: number
          sponsorship_level?: string | null
        }
        Update: {
          event_id?: string
          partner_id?: string
          sort_order?: number
          sponsorship_level?: string | null
        }
        Relationships: []
      }
      event_podcast_episodes: {
        Row: {
          event_id: string
          podcast_episode_id: string
          sort_order: number
        }
        Insert: {
          event_id: string
          podcast_episode_id: string
          sort_order?: number
        }
        Update: {
          event_id?: string
          podcast_episode_id?: string
          sort_order?: number
        }
        Relationships: []
      }
      event_registrations: {
        Row: {
          checked_in_at: string | null
          confirmation_sent_at: string | null
          created_at: string
          event_id: string
          id: string
          notes: string | null
          reminder_sent_at: string | null
          status: Database["public"]["Enums"]["event_registration_record_status"]
          ticket_code: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          checked_in_at?: string | null
          confirmation_sent_at?: string | null
          created_at?: string
          event_id: string
          id?: string
          notes?: string | null
          reminder_sent_at?: string | null
          status?: Database["public"]["Enums"]["event_registration_record_status"]
          ticket_code?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          checked_in_at?: string | null
          confirmation_sent_at?: string | null
          created_at?: string
          event_id?: string
          id?: string
          notes?: string | null
          reminder_sent_at?: string | null
          status?: Database["public"]["Enums"]["event_registration_record_status"]
          ticket_code?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_user_profile_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_sessions: {
        Row: {
          created_at: string
          description: string | null
          ends_at: string | null
          event_id: string
          id: string
          location: string | null
          sort_order: number
          starts_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          ends_at?: string | null
          event_id: string
          id?: string
          location?: string | null
          sort_order?: number
          starts_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          ends_at?: string | null
          event_id?: string
          id?: string
          location?: string | null
          sort_order?: number
          starts_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      event_speakers: {
        Row: {
          bio: string | null
          created_at: string
          event_id: string
          id: string
          name: string
          photo_url: string | null
          sort_order: number
          title: string | null
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          event_id: string
          id?: string
          name: string
          photo_url?: string | null
          sort_order?: number
          title?: string | null
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          event_id?: string
          id?: string
          name?: string
          photo_url?: string | null
          sort_order?: number
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      event_surveys: {
        Row: {
          created_at: string
          event_id: string
          id: string
          is_active: boolean
          qualtrics_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          is_active?: boolean
          qualtrics_url?: string | null
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          is_active?: boolean
          qualtrics_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          capacity: number | null
          category_id: string | null
          created_at: string
          description: string | null
          description_html: string | null
          ends_at: string | null
          external_url: string | null
          id: string
          image_url: string | null
          invite_code: string | null
          is_active: boolean
          is_featured: boolean
          lat: number | null
          lng: number | null
          location: string | null
          location_address: string | null
          metadata: Json
          registration_open: boolean
          registration_status: Database["public"]["Enums"]["event_registration_status"]
          slug: string | null
          starts_at: string
          status: Database["public"]["Enums"]["event_status"]
          timezone: string | null
          title: string
          updated_at: string
        }
        Insert: {
          capacity?: number | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          description_html?: string | null
          ends_at?: string | null
          external_url?: string | null
          id?: string
          image_url?: string | null
          invite_code?: string | null
          is_active?: boolean
          is_featured?: boolean
          lat?: number | null
          lng?: number | null
          location?: string | null
          location_address?: string | null
          metadata?: Json
          registration_open?: boolean
          registration_status?: Database["public"]["Enums"]["event_registration_status"]
          slug?: string | null
          starts_at: string
          status?: Database["public"]["Enums"]["event_status"]
          timezone?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          capacity?: number | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          description_html?: string | null
          ends_at?: string | null
          external_url?: string | null
          id?: string
          image_url?: string | null
          invite_code?: string | null
          is_active?: boolean
          is_featured?: boolean
          lat?: number | null
          lng?: number | null
          location?: string | null
          location_address?: string | null
          metadata?: Json
          registration_open?: boolean
          registration_status?: Database["public"]["Enums"]["event_registration_status"]
          slug?: string | null
          starts_at?: string
          status?: Database["public"]["Enums"]["event_status"]
          timezone?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "event_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      grants: {
        Row: {
          amount: string | null
          created_at: string
          deadline: string | null
          description: string | null
          funder: string | null
          id: string
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          amount?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          funder?: string | null
          id?: string
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          amount?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          funder?: string | null
          id?: string
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      internship_applications: {
        Row: {
          academic_level: Database["public"]["Enums"]["academic_level"] | null
          cohort_id: string | null
          cover_letter: string | null
          created_at: string
          emergency_contact: Json
          graduation_year: number | null
          id: string
          institution_id: string | null
          institution_type: Database["public"]["Enums"]["institution_type"] | null
          internship_id: string
          is_1890_land_grant: boolean | null
          major: string | null
          resume_url: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          school_name: string | null
          status: Database["public"]["Enums"]["application_status"]
          submitted_at: string | null
          track: Database["public"]["Enums"]["twofas_track"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          academic_level?: Database["public"]["Enums"]["academic_level"] | null
          cohort_id?: string | null
          cover_letter?: string | null
          created_at?: string
          emergency_contact?: Json
          graduation_year?: number | null
          id?: string
          institution_id?: string | null
          institution_type?: Database["public"]["Enums"]["institution_type"] | null
          internship_id: string
          is_1890_land_grant?: boolean | null
          major?: string | null
          resume_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          school_name?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          submitted_at?: string | null
          track?: Database["public"]["Enums"]["twofas_track"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          academic_level?: Database["public"]["Enums"]["academic_level"] | null
          cohort_id?: string | null
          cover_letter?: string | null
          created_at?: string
          emergency_contact?: Json
          graduation_year?: number | null
          id?: string
          institution_id?: string | null
          institution_type?: Database["public"]["Enums"]["institution_type"] | null
          internship_id?: string
          is_1890_land_grant?: boolean | null
          major?: string | null
          resume_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          school_name?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          submitted_at?: string | null
          track?: Database["public"]["Enums"]["twofas_track"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "internship_applications_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "twofas_cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internship_applications_internship_id_fkey"
            columns: ["internship_id"]
            isOneToOne: false
            referencedRelation: "internships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internship_applications_user_profile_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      internships: {
        Row: {
          cohort_id: string | null
          created_at: string
          deadline: string | null
          department: string | null
          description: string | null
          id: string
          is_2fas: boolean
          is_open: boolean
          max_applicants: number | null
          program_id: string | null
          requirements_html: string | null
          slug: string | null
          title: string
          track: Database["public"]["Enums"]["twofas_track"] | null
          updated_at: string
        }
        Insert: {
          cohort_id?: string | null
          created_at?: string
          deadline?: string | null
          department?: string | null
          description?: string | null
          id?: string
          is_2fas?: boolean
          is_open?: boolean
          max_applicants?: number | null
          program_id?: string | null
          requirements_html?: string | null
          slug?: string | null
          title: string
          track?: Database["public"]["Enums"]["twofas_track"] | null
          updated_at?: string
        }
        Update: {
          cohort_id?: string | null
          created_at?: string
          deadline?: string | null
          department?: string | null
          description?: string | null
          id?: string
          is_2fas?: boolean
          is_open?: boolean
          max_applicants?: number | null
          program_id?: string | null
          requirements_html?: string | null
          slug?: string | null
          title?: string
          track?: Database["public"]["Enums"]["twofas_track"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "internships_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "twofas_cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internships_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      markets: {
        Row: {
          accepts_credit: boolean
          accepts_snap_ebt: boolean
          address: string | null
          city: string | null
          contact_name: string | null
          created_at: string
          description: string | null
          email: string | null
          hours: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_featured: boolean
          lat: number | null
          lng: number | null
          metadata: Json
          name: string
          parking_info: string | null
          payment_notes: string | null
          phone: string | null
          season: string | null
          slug: string | null
          state: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          accepts_credit?: boolean
          accepts_snap_ebt?: boolean
          address?: string | null
          city?: string | null
          contact_name?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          hours?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          lat?: number | null
          lng?: number | null
          metadata?: Json
          name: string
          parking_info?: string | null
          payment_notes?: string | null
          phone?: string | null
          season?: string | null
          slug?: string | null
          state?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          accepts_credit?: boolean
          accepts_snap_ebt?: boolean
          address?: string | null
          city?: string | null
          contact_name?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          hours?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          lat?: number | null
          lng?: number | null
          metadata?: Json
          name?: string
          parking_info?: string | null
          payment_notes?: string | null
          phone?: string | null
          season?: string | null
          slug?: string | null
          state?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      market_announcements: {
        Row: {
          announcement_type: Database["public"]["Enums"]["market_announcement_type"]
          body: string | null
          created_at: string
          ends_at: string | null
          id: string
          is_active: boolean
          market_id: string
          starts_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          announcement_type?: Database["public"]["Enums"]["market_announcement_type"]
          body?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          market_id: string
          starts_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          announcement_type?: Database["public"]["Enums"]["market_announcement_type"]
          body?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          market_id?: string
          starts_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_announcements_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      market_events: {
        Row: {
          event_id: string
          market_id: string
          sort_order: number
        }
        Insert: {
          event_id: string
          market_id: string
          sort_order?: number
        }
        Update: {
          event_id?: string
          market_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "market_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_events_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      market_hours: {
        Row: {
          closes_at: string | null
          created_at: string
          day_of_week: number
          id: string
          is_closed: boolean
          market_id: string
          opens_at: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          closes_at?: string | null
          created_at?: string
          day_of_week: number
          id?: string
          is_closed?: boolean
          market_id: string
          opens_at?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          closes_at?: string | null
          created_at?: string
          day_of_week?: number
          id?: string
          is_closed?: boolean
          market_id?: string
          opens_at?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_hours_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      market_images: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          image_url: string
          market_id: string
          sort_order: number
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          market_id: string
          sort_order?: number
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          market_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "market_images_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      market_products: {
        Row: {
          available_today: boolean
          category: Database["public"]["Enums"]["market_product_category"]
          created_at: string
          description: string | null
          id: string
          is_local: boolean
          is_organic: boolean
          name: string
          season: string | null
          sort_order: number
          updated_at: string
          vendor_id: string
        }
        Insert: {
          available_today?: boolean
          category?: Database["public"]["Enums"]["market_product_category"]
          created_at?: string
          description?: string | null
          id?: string
          is_local?: boolean
          is_organic?: boolean
          name: string
          season?: string | null
          sort_order?: number
          updated_at?: string
          vendor_id: string
        }
        Update: {
          available_today?: boolean
          category?: Database["public"]["Enums"]["market_product_category"]
          created_at?: string
          description?: string | null
          id?: string
          is_local?: boolean
          is_organic?: boolean
          name?: string
          season?: string | null
          sort_order?: number
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_products_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "market_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      market_programs: {
        Row: {
          market_id: string
          program_id: string
          sort_order: number
        }
        Insert: {
          market_id: string
          program_id: string
          sort_order?: number
        }
        Update: {
          market_id?: string
          program_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "market_programs_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_programs_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      market_vendors: {
        Row: {
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          market_id: string
          name: string
          seasonal_availability: string | null
          slug: string
          social_url: string | null
          sort_order: number
          updated_at: string
          website_url: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          market_id: string
          name: string
          seasonal_availability?: string | null
          slug: string
          social_url?: string | null
          sort_order?: number
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          market_id?: string
          name?: string
          seasonal_availability?: string | null
          slug?: string
          social_url?: string | null
          sort_order?: number
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "market_vendors_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          market_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          market_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          market_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets: {
        Row: {
          alt_text: string | null
          asset_type: Database["public"]["Enums"]["media_asset_type"]
          bucket: string | null
          caption: string | null
          created_at: string
          created_by: string | null
          file_size: number | null
          id: string
          is_active: boolean
          metadata: Json
          mime_type: string | null
          module_context: string | null
          name: string
          storage_path: string | null
          tags: string[]
          updated_at: string
          url: string
        }
        Insert: {
          alt_text?: string | null
          asset_type?: Database["public"]["Enums"]["media_asset_type"]
          bucket?: string | null
          caption?: string | null
          created_at?: string
          created_by?: string | null
          file_size?: number | null
          id?: string
          is_active?: boolean
          metadata?: Json
          mime_type?: string | null
          module_context?: string | null
          name: string
          storage_path?: string | null
          tags?: string[]
          updated_at?: string
          url: string
        }
        Update: {
          alt_text?: string | null
          asset_type?: Database["public"]["Enums"]["media_asset_type"]
          bucket?: string | null
          caption?: string | null
          created_at?: string
          created_by?: string | null
          file_size?: number | null
          id?: string
          is_active?: boolean
          metadata?: Json
          mime_type?: string | null
          module_context?: string | null
          name?: string
          storage_path?: string | null
          tags?: string[]
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      content_tags: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      content_tag_links: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          tag_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_tag_links_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "content_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      notification_reads: {
        Row: {
          id: string
          notification_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          id?: string
          notification_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          id?: string
          notification_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_reads_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      news_articles: {
        Row: {
          author: string | null
          category: string | null
          content_html: string | null
          cover_image_url: string | null
          created_at: string
          id: string
          is_featured: boolean
          is_published: boolean
          published_at: string | null
          reading_time_minutes: number | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          sort_order: number
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author?: string | null
          category?: string | null
          content_html?: string | null
          cover_image_url?: string | null
          created_at?: string
          id?: string
          is_featured?: boolean
          is_published?: boolean
          published_at?: string | null
          reading_time_minutes?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          sort_order?: number
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author?: string | null
          category?: string | null
          content_html?: string | null
          cover_image_url?: string | null
          created_at?: string
          id?: string
          is_featured?: boolean
          is_published?: boolean
          published_at?: string | null
          reading_time_minutes?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          sort_order?: number
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      news_events: {
        Row: {
          event_id: string
          news_article_id: string
          sort_order: number
        }
        Insert: {
          event_id: string
          news_article_id: string
          sort_order?: number
        }
        Update: {
          event_id?: string
          news_article_id?: string
          sort_order?: number
        }
        Relationships: []
      }
      news_partners: {
        Row: {
          news_article_id: string
          partner_id: string
          sort_order: number
        }
        Insert: {
          news_article_id: string
          partner_id: string
          sort_order?: number
        }
        Update: {
          news_article_id?: string
          partner_id?: string
          sort_order?: number
        }
        Relationships: []
      }
      news_programs: {
        Row: {
          news_article_id: string
          program_id: string
          sort_order: number
        }
        Insert: {
          news_article_id: string
          program_id: string
          sort_order?: number
        }
        Update: {
          news_article_id?: string
          program_id?: string
          sort_order?: number
        }
        Relationships: []
      }
      news_publications: {
        Row: {
          news_article_id: string
          publication_id: string
          sort_order: number
        }
        Insert: {
          news_article_id: string
          publication_id: string
          sort_order?: number
        }
        Update: {
          news_article_id?: string
          publication_id?: string
          sort_order?: number
        }
        Relationships: []
      }
      news_tags: {
        Row: {
          news_article_id: string
          tag: string
        }
        Insert: {
          news_article_id: string
          tag: string
        }
        Update: {
          news_article_id?: string
          tag?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          audience: Database["public"]["Enums"]["notification_audience"]
          body: string | null
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json
          notification_type: Database["public"]["Enums"]["notification_type"] | null
          priority: Database["public"]["Enums"]["notification_priority"]
          read_at: string | null
          status: Database["public"]["Enums"]["notification_status"]
          title: string
          user_id: string | null
        }
        Insert: {
          action_url?: string | null
          audience?: Database["public"]["Enums"]["notification_audience"]
          body?: string | null
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json
          notification_type?: Database["public"]["Enums"]["notification_type"] | null
          priority?: Database["public"]["Enums"]["notification_priority"]
          read_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          title: string
          user_id?: string | null
        }
        Update: {
          action_url?: string | null
          audience?: Database["public"]["Enums"]["notification_audience"]
          body?: string | null
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json
          notification_type?: Database["public"]["Enums"]["notification_type"] | null
          priority?: Database["public"]["Enums"]["notification_priority"]
          read_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      program_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      program_events: {
        Row: {
          event_id: string
          program_id: string
          sort_order: number
        }
        Insert: {
          event_id: string
          program_id: string
          sort_order?: number
        }
        Update: {
          event_id?: string
          program_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "program_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_events_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      program_grants: {
        Row: {
          grant_id: string
          program_id: string
          sort_order: number
        }
        Insert: {
          grant_id: string
          program_id: string
          sort_order?: number
        }
        Update: {
          grant_id?: string
          program_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "program_grants_grant_id_fkey"
            columns: ["grant_id"]
            isOneToOne: false
            referencedRelation: "grants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_grants_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      program_images: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          image_url: string
          program_id: string
          sort_order: number
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          program_id: string
          sort_order?: number
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          program_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "program_gallery_images_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      program_partners: {
        Row: {
          partner_id: string
          program_id: string
          sort_order: number
        }
        Insert: {
          partner_id: string
          program_id: string
          sort_order?: number
        }
        Update: {
          partner_id?: string
          program_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "program_partners_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_partners_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      program_podcast_episodes: {
        Row: {
          podcast_episode_id: string
          program_id: string
          sort_order: number
        }
        Insert: {
          podcast_episode_id: string
          program_id: string
          sort_order?: number
        }
        Update: {
          podcast_episode_id?: string
          program_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "program_podcast_episodes_podcast_episode_id_fkey"
            columns: ["podcast_episode_id"]
            isOneToOne: false
            referencedRelation: "podcast_episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_podcast_episodes_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      program_publications: {
        Row: {
          program_id: string
          publication_id: string
          sort_order: number
        }
        Insert: {
          program_id: string
          publication_id: string
          sort_order?: number
        }
        Update: {
          program_id?: string
          publication_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "program_publications_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_publications_publication_id_fkey"
            columns: ["publication_id"]
            isOneToOne: false
            referencedRelation: "publications"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          category_id: string | null
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          cover_image_url: string | null
          created_at: string
          description_html: string | null
          id: string
          is_active: boolean
          is_featured: boolean
          logo_url: string | null
          metadata: Json
          name: string
          objectives_html: string | null
          program_director: string | null
          registration_url: string | null
          short: string | null
          slug: string
          sort_order: number
          tagline: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          category_id?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          cover_image_url?: string | null
          created_at?: string
          description_html?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          logo_url?: string | null
          metadata?: Json
          name: string
          objectives_html?: string | null
          program_director?: string | null
          registration_url?: string | null
          short?: string | null
          slug: string
          sort_order?: number
          tagline?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          category_id?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          cover_image_url?: string | null
          created_at?: string
          description_html?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          logo_url?: string | null
          metadata?: Json
          name?: string
          objectives_html?: string | null
          program_director?: string | null
          registration_url?: string | null
          short?: string | null
          slug?: string
          sort_order?: number
          tagline?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "programs_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "program_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          address: string | null
          category: string | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          is_featured: boolean
          is_published: boolean
          logo_url: string | null
          mission: string | null
          name: string
          notes: string | null
          partnership_areas: string[]
          phone: string | null
          short_description: string | null
          slug: string
          social_links: Json
          sort_order: number
          updated_at: string
          website_url: string | null
        }
        Insert: {
          address?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          logo_url?: string | null
          mission?: string | null
          name: string
          notes?: string | null
          partnership_areas?: string[]
          phone?: string | null
          short_description?: string | null
          slug: string
          social_links?: Json
          sort_order?: number
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          address?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          logo_url?: string | null
          mission?: string | null
          name?: string
          notes?: string | null
          partnership_areas?: string[]
          phone?: string | null
          short_description?: string | null
          slug?: string
          social_links?: Json
          sort_order?: number
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      partner_publications: {
        Row: {
          partner_id: string
          publication_id: string
          sort_order: number
        }
        Insert: {
          partner_id: string
          publication_id: string
          sort_order?: number
        }
        Update: {
          partner_id?: string
          publication_id?: string
          sort_order?: number
        }
        Relationships: []
      }
      partner_podcast_episodes: {
        Row: {
          partner_id: string
          podcast_episode_id: string
          sort_order: number
        }
        Insert: {
          partner_id: string
          podcast_episode_id: string
          sort_order?: number
        }
        Update: {
          partner_id?: string
          podcast_episode_id?: string
          sort_order?: number
        }
        Relationships: []
      }
      podcast_episodes: {
        Row: {
          audio_url: string | null
          category: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          duration_seconds: number | null
          embed_url: string | null
          guest: string | null
          id: string
          is_featured: boolean
          is_published: boolean
          published_at: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          audio_url?: string | null
          category?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          embed_url?: string | null
          guest?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          audio_url?: string | null
          category?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          embed_url?: string | null
          guest?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          academic_level: Database["public"]["Enums"]["academic_level"] | null
          affiliation: string | null
          created_at: string
          email: string | null
          expected_graduation_year: number | null
          full_name: string | null
          id: string
          institution_id: string | null
          institution_type: Database["public"]["Enums"]["institution_type"] | null
          is_1890_land_grant: boolean | null
          major_or_interest: string | null
          phone: string | null
          school_name: string | null
          updated_at: string
        }
        Insert: {
          academic_level?: Database["public"]["Enums"]["academic_level"] | null
          affiliation?: string | null
          created_at?: string
          email?: string | null
          expected_graduation_year?: number | null
          full_name?: string | null
          id: string
          institution_id?: string | null
          institution_type?: Database["public"]["Enums"]["institution_type"] | null
          is_1890_land_grant?: boolean | null
          major_or_interest?: string | null
          phone?: string | null
          school_name?: string | null
          updated_at?: string
        }
        Update: {
          academic_level?: Database["public"]["Enums"]["academic_level"] | null
          affiliation?: string | null
          created_at?: string
          email?: string | null
          expected_graduation_year?: number | null
          full_name?: string | null
          id?: string
          institution_id?: string | null
          institution_type?: Database["public"]["Enums"]["institution_type"] | null
          is_1890_land_grant?: boolean | null
          major_or_interest?: string | null
          phone?: string | null
          school_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      publication_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      publication_events: {
        Row: {
          event_id: string
          publication_id: string
          sort_order: number
        }
        Insert: {
          event_id: string
          publication_id: string
          sort_order?: number
        }
        Update: {
          event_id?: string
          publication_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "publication_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publication_events_publication_id_fkey"
            columns: ["publication_id"]
            isOneToOne: false
            referencedRelation: "publications"
            referencedColumns: ["id"]
          },
        ]
      }
      publication_podcast_episodes: {
        Row: {
          podcast_episode_id: string
          publication_id: string
          sort_order: number
        }
        Insert: {
          podcast_episode_id: string
          publication_id: string
          sort_order?: number
        }
        Update: {
          podcast_episode_id?: string
          publication_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "publication_podcast_episodes_podcast_episode_id_fkey"
            columns: ["podcast_episode_id"]
            isOneToOne: false
            referencedRelation: "podcast_episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publication_podcast_episodes_publication_id_fkey"
            columns: ["publication_id"]
            isOneToOne: false
            referencedRelation: "publications"
            referencedColumns: ["id"]
          },
        ]
      }
      publication_tags: {
        Row: {
          publication_id: string
          tag: string
        }
        Insert: {
          publication_id: string
          tag: string
        }
        Update: {
          publication_id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "publication_tags_publication_id_fkey"
            columns: ["publication_id"]
            isOneToOne: false
            referencedRelation: "publications"
            referencedColumns: ["id"]
          },
        ]
      }
      publications: {
        Row: {
          author: string | null
          category: string | null
          category_id: string | null
          content_type: Database["public"]["Enums"]["publication_content_type"] | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          external_url: string | null
          file_url: string | null
          id: string
          is_active: boolean
          is_featured: boolean
          metadata: Json
          published_at: string | null
          slug: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author?: string | null
          category?: string | null
          category_id?: string | null
          content_type?: Database["public"]["Enums"]["publication_content_type"] | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          external_url?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          metadata?: Json
          published_at?: string | null
          slug?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author?: string | null
          category?: string | null
          category_id?: string | null
          content_type?: Database["public"]["Enums"]["publication_content_type"] | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          external_url?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          metadata?: Json
          published_at?: string | null
          slug?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "publications_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "publication_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      surveys: {
        Row: {
          created_at: string
          description: string | null
          id: string
          qualtrics_url: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          qualtrics_url: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          qualtrics_url?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      twofas_cohort_milestones: {
        Row: {
          cohort_id: string
          created_at: string
          description: string | null
          due_offset_days: number | null
          id: string
          is_required: boolean
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          cohort_id: string
          created_at?: string
          description?: string | null
          due_offset_days?: number | null
          id?: string
          is_required?: boolean
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          cohort_id?: string
          created_at?: string
          description?: string | null
          due_offset_days?: number | null
          id?: string
          is_required?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "twofas_cohort_milestones_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "twofas_cohorts"
            referencedColumns: ["id"]
          },
        ]
      }
      twofas_cohorts: {
        Row: {
          created_at: string
          description: string | null
          ends_on: string | null
          id: string
          is_active: boolean
          name: string
          sort_order: number
          starts_on: string | null
          track: Database["public"]["Enums"]["twofas_track"]
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          ends_on?: string | null
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          starts_on?: string | null
          track: Database["public"]["Enums"]["twofas_track"]
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          description?: string | null
          ends_on?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          starts_on?: string | null
          track?: Database["public"]["Enums"]["twofas_track"]
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      twofas_documents: {
        Row: {
          application_id: string
          created_at: string
          doc_type: Database["public"]["Enums"]["twofas_document_type"]
          file_path: string
          id: string
          label: string | null
          user_id: string
        }
        Insert: {
          application_id: string
          created_at?: string
          doc_type?: Database["public"]["Enums"]["twofas_document_type"]
          file_path: string
          id?: string
          label?: string | null
          user_id: string
        }
        Update: {
          application_id?: string
          created_at?: string
          doc_type?: Database["public"]["Enums"]["twofas_document_type"]
          file_path?: string
          id?: string
          label?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "twofas_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "internship_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      twofas_mentor_assignments: {
        Row: {
          application_id: string
          assigned_at: string
          assigned_by: string | null
          created_at: string
          id: string
          mentor_id: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          application_id: string
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          id?: string
          mentor_id: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          application_id?: string
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          id?: string
          mentor_id?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "twofas_mentor_assignments_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "internship_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "twofas_mentor_assignments_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "twofas_mentors"
            referencedColumns: ["id"]
          },
        ]
      }
      twofas_mentors: {
        Row: {
          bio: string | null
          created_at: string
          email: string | null
          expertise: string[]
          full_name: string
          id: string
          is_active: boolean
          updated_at: string
          user_id: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          email?: string | null
          expertise?: string[]
          full_name: string
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          email?: string | null
          expertise?: string[]
          full_name?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      twofas_student_milestones: {
        Row: {
          application_id: string
          completed_at: string | null
          created_at: string
          id: string
          milestone_id: string
          notes: string | null
          status: Database["public"]["Enums"]["milestone_status"]
          updated_at: string
        }
        Insert: {
          application_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          milestone_id: string
          notes?: string | null
          status?: Database["public"]["Enums"]["milestone_status"]
          updated_at?: string
        }
        Update: {
          application_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          milestone_id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["milestone_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "twofas_student_milestones_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "internship_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "twofas_student_milestones_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "twofas_cohort_milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      event_attendance: {
        Row: {
          attendance_method: Database["public"]["Enums"]["attendance_method"] | null
          checked_in_at: string | null
          checked_in_by: string | null
          created_at: string
          evaluation_completed_at: string | null
          event_id: string
          id: string
          notes: string | null
          registration_id: string | null
          status: Database["public"]["Enums"]["attendance_status"]
          updated_at: string
          walk_in_id: string | null
        }
        Insert: {
          attendance_method?: Database["public"]["Enums"]["attendance_method"] | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string
          evaluation_completed_at?: string | null
          event_id: string
          id?: string
          notes?: string | null
          registration_id?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          updated_at?: string
          walk_in_id?: string | null
        }
        Update: {
          attendance_method?: Database["public"]["Enums"]["attendance_method"] | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string
          evaluation_completed_at?: string | null
          event_id?: string
          id?: string
          notes?: string | null
          registration_id?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          updated_at?: string
          walk_in_id?: string | null
        }
        Relationships: []
      }
      event_evaluation_answers: {
        Row: {
          created_at: string
          id: string
          question_id: string
          response_id: string
          value_json: Json | null
          value_number: number | null
          value_text: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          question_id: string
          response_id: string
          value_json?: Json | null
          value_number?: number | null
          value_text?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          question_id?: string
          response_id?: string
          value_json?: Json | null
          value_number?: number | null
          value_text?: string | null
        }
        Relationships: []
      }
      event_evaluation_questions: {
        Row: {
          created_at: string
          evaluation_id: string
          help_text: string | null
          id: string
          is_default: boolean
          is_demographic: boolean
          is_required: boolean
          options: Json | null
          prompt: string
          question_type: Database["public"]["Enums"]["evaluation_question_type"]
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          evaluation_id: string
          help_text?: string | null
          id?: string
          is_default?: boolean
          is_demographic?: boolean
          is_required?: boolean
          options?: Json | null
          prompt: string
          question_type: Database["public"]["Enums"]["evaluation_question_type"]
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          evaluation_id?: string
          help_text?: string | null
          id?: string
          is_default?: boolean
          is_demographic?: boolean
          is_required?: boolean
          options?: Json | null
          prompt?: string
          question_type?: Database["public"]["Enums"]["evaluation_question_type"]
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      event_evaluation_responses: {
        Row: {
          access_token_hash: string | null
          attendance_id: string | null
          created_at: string
          evaluation_id: string
          event_id: string
          id: string
          is_complete: boolean
          registration_id: string | null
          submitted_at: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          access_token_hash?: string | null
          attendance_id?: string | null
          created_at?: string
          evaluation_id: string
          event_id: string
          id?: string
          is_complete?: boolean
          registration_id?: string | null
          submitted_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          access_token_hash?: string | null
          attendance_id?: string | null
          created_at?: string
          evaluation_id?: string
          event_id?: string
          id?: string
          is_complete?: boolean
          registration_id?: string | null
          submitted_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      event_evaluations: {
        Row: {
          closes_at: string | null
          created_at: string
          event_id: string
          id: string
          is_active: boolean
          is_required: boolean
          opens_at: string | null
          qualtrics_url: string | null
          reminder_sent_at: string | null
          response_mode: Database["public"]["Enums"]["evaluation_response_mode"]
          title: string
          updated_at: string
          use_native_form: boolean
        }
        Insert: {
          closes_at?: string | null
          created_at?: string
          event_id: string
          id?: string
          is_active?: boolean
          is_required?: boolean
          opens_at?: string | null
          qualtrics_url?: string | null
          reminder_sent_at?: string | null
          response_mode?: Database["public"]["Enums"]["evaluation_response_mode"]
          title?: string
          updated_at?: string
          use_native_form?: boolean
        }
        Update: {
          closes_at?: string | null
          created_at?: string
          event_id?: string
          id?: string
          is_active?: boolean
          is_required?: boolean
          opens_at?: string | null
          qualtrics_url?: string | null
          reminder_sent_at?: string | null
          response_mode?: Database["public"]["Enums"]["evaluation_response_mode"]
          title?: string
          updated_at?: string
          use_native_form?: boolean
        }
        Relationships: []
      }
      event_gallery_submissions: {
        Row: {
          alt_text: string | null
          caption: string | null
          created_at: string
          event_id: string
          gallery_id: string | null
          has_permission_confirmed: boolean
          id: string
          image_url: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["gallery_submission_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string
          event_id: string
          gallery_id?: string | null
          has_permission_confirmed?: boolean
          id?: string
          image_url: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["gallery_submission_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string
          event_id?: string
          gallery_id?: string | null
          has_permission_confirmed?: boolean
          id?: string
          image_url?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["gallery_submission_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      event_walk_ins: {
        Row: {
          attendance_type: Database["public"]["Enums"]["attendance_status"]
          county: string | null
          created_at: string
          created_by: string | null
          email: string | null
          event_id: string
          full_name: string
          id: string
          organization_or_school: string | null
          phone: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          attendance_type?: Database["public"]["Enums"]["attendance_status"]
          county?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          event_id: string
          full_name: string
          id?: string
          organization_or_school?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          attendance_type?: Database["public"]["Enums"]["attendance_status"]
          county?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          event_id?: string
          full_name?: string
          id?: string
          organization_or_school?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      inquiries: {
        Row: {
          assigned_to: string | null
          city: string | null
          consent_contact: boolean
          county: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          inquiry_type: Database["public"]["Enums"]["inquiry_type"]
          institution_id: string | null
          institution_type: Database["public"]["Enums"]["institution_type"] | null
          last_name: string
          message: string | null
          newsletter_opt_in: boolean
          organization_or_school: string | null
          phone: string | null
          preferred_contact: Database["public"]["Enums"]["preferred_contact_method"]
          program_id: string | null
          state: string | null
          status: Database["public"]["Enums"]["inquiry_status"]
          submitted_at: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          city?: string | null
          consent_contact?: boolean
          county?: string | null
          created_at?: string
          email: string
          first_name: string
          id?: string
          inquiry_type: Database["public"]["Enums"]["inquiry_type"]
          institution_id?: string | null
          institution_type?: Database["public"]["Enums"]["institution_type"] | null
          last_name: string
          message?: string | null
          newsletter_opt_in?: boolean
          organization_or_school?: string | null
          phone?: string | null
          preferred_contact?: Database["public"]["Enums"]["preferred_contact_method"]
          program_id?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["inquiry_status"]
          submitted_at?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          city?: string | null
          consent_contact?: boolean
          county?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          inquiry_type?: Database["public"]["Enums"]["inquiry_type"]
          institution_id?: string | null
          institution_type?: Database["public"]["Enums"]["institution_type"] | null
          last_name?: string
          message?: string | null
          newsletter_opt_in?: boolean
          organization_or_school?: string | null
          phone?: string | null
          preferred_contact?: Database["public"]["Enums"]["preferred_contact_method"]
          program_id?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["inquiry_status"]
          submitted_at?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      inquiry_notes: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          inquiry_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          inquiry_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          inquiry_id?: string
        }
        Relationships: []
      }
      institutions: {
        Row: {
          created_at: string
          id: string
          institution_type: Database["public"]["Enums"]["institution_type"]
          is_1890_land_grant: boolean
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          state: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          institution_type?: Database["public"]["Enums"]["institution_type"]
          is_1890_land_grant?: boolean
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          state?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          institution_type?: Database["public"]["Enums"]["institution_type"]
          is_1890_land_grant?: boolean
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          state?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      participant_demographics: {
        Row: {
          academic_level: Database["public"]["Enums"]["academic_level"] | null
          age_range: string | null
          beginning_farmer: boolean | null
          consent_demographics: boolean
          county: string | null
          created_at: string
          disability_status: string | null
          ethnicity: string | null
          farmer_producer_status: string | null
          gender: string | null
          id: string
          institution_id: string | null
          limited_resource_producer: boolean | null
          race: string | null
          rural_urban: string | null
          source_id: string
          source_type: Database["public"]["Enums"]["demographic_source_type"]
          state: string | null
          updated_at: string
          user_id: string | null
          veteran_status: string | null
        }
        Insert: {
          academic_level?: Database["public"]["Enums"]["academic_level"] | null
          age_range?: string | null
          beginning_farmer?: boolean | null
          consent_demographics?: boolean
          county?: string | null
          created_at?: string
          disability_status?: string | null
          ethnicity?: string | null
          farmer_producer_status?: string | null
          gender?: string | null
          id?: string
          institution_id?: string | null
          limited_resource_producer?: boolean | null
          race?: string | null
          rural_urban?: string | null
          source_id: string
          source_type: Database["public"]["Enums"]["demographic_source_type"]
          state?: string | null
          updated_at?: string
          user_id?: string | null
          veteran_status?: string | null
        }
        Update: {
          academic_level?: Database["public"]["Enums"]["academic_level"] | null
          age_range?: string | null
          beginning_farmer?: boolean | null
          consent_demographics?: boolean
          county?: string | null
          created_at?: string
          disability_status?: string | null
          ethnicity?: string | null
          farmer_producer_status?: string | null
          gender?: string | null
          id?: string
          institution_id?: string | null
          limited_resource_producer?: boolean | null
          race?: string | null
          rural_urban?: string | null
          source_id?: string
          source_type?: Database["public"]["Enums"]["demographic_source_type"]
          state?: string | null
          updated_at?: string
          user_id?: string | null
          veteran_status?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      publication_programs: {
        Row: {
          program_id: string
          publication_id: string
          sort_order: number
        }
        Relationships: [
          {
            foreignKeyName: "program_publications_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_publications_publication_id_fkey"
            columns: ["publication_id"]
            isOneToOne: false
            referencedRelation: "publications"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      create_program_category: {
        Args: {
          p_name: string
        }
        Returns: Database["public"]["Tables"]["program_categories"]["Row"]
      }
      create_publication_category: {
        Args: {
          p_name: string
        }
        Returns: Database["public"]["Tables"]["publication_categories"]["Row"]
      }
      get_event_registration_count: {
        Args: {
          p_event_id: string
        }
        Returns: number
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
      academic_level: "high_school" | "undergraduate" | "graduate" | "recent_graduate" | "other"
      app_role: "admin" | "user"
      application_status:
        | "pending"
        | "reviewed"
        | "under_review"
        | "accepted"
        | "waitlisted"
        | "rejected"
        | "active"
        | "completed"
        | "withdrawn"
      attendance_method: "qr" | "manual" | "csv_import" | "walk_in"
      attendance_status:
        | "registered"
        | "checked_in"
        | "attended"
        | "virtual"
        | "no_show"
        | "cancelled"
      milestone_status: "pending" | "in_progress" | "completed" | "waived"
      twofas_document_type: "resume" | "transcript" | "portfolio" | "other"
      twofas_track: "high_school" | "undergraduate" | "graduate" | "fellow"
      checkout_status:
        | "pending"
        | "approved"
        | "denied"
        | "checked_out"
        | "returned"
      demographic_source_type: "registration" | "walk_in" | "evaluation" | "attendance"
      evaluation_question_type:
        | "rating"
        | "single_choice"
        | "multi_choice"
        | "short_text"
        | "long_text"
        | "yes_no"
        | "number"
        | "demographic"
        | "consent"
      evaluation_response_mode: "anonymous" | "identified"
      event_registration_record_status: "registered" | "waiting_list" | "cancelled"
      event_registration_status: "open" | "closed" | "waiting_list" | "sold_out" | "invite_only"
      event_status: "draft" | "published" | "archived"
      gallery_submission_status: "pending" | "approved" | "rejected"
      inquiry_status: "new" | "contacted" | "in_progress" | "resolved" | "closed"
      inquiry_type:
        | "join_program"
        | "request_info"
        | "partnership"
        | "student_opportunity"
        | "farmer_producer"
        | "volunteer"
        | "general"
      institution_type:
        | "land_grant_1890"
        | "four_year"
        | "community_college"
        | "high_school"
        | "technical_school"
        | "recent_graduate"
        | "not_enrolled"
        | "other"
      market_announcement_type: "general" | "closure" | "weather" | "seasonal"
      market_product_category:
        | "fruit"
        | "vegetables"
        | "meat"
        | "eggs"
        | "dairy"
        | "honey"
        | "plants"
        | "flowers"
        | "value_added"
        | "prepared_foods"
        | "crafts"
      media_asset_type:
        | "image"
        | "video"
        | "pdf"
        | "magazine_cover"
        | "factsheet"
        | "audio"
        | "logo"
        | "document"
      notification_audience: "admin" | "user"
      notification_channel: "in_app" | "email" | "sms" | "push"
      notification_priority: "low" | "normal" | "high" | "urgent"
      notification_status: "pending" | "sent" | "failed" | "read"
      notification_type:
        | "twofas_application"
        | "event_registration"
        | "event_near_capacity"
        | "publication_added"
        | "equipment_request"
        | "grant_deadline"
        | "inquiry_received"
        | "evaluation_submitted"
      preferred_contact_method: "email" | "phone" | "either"
      publication_content_type:
        | "factsheet"
        | "report"
        | "magazine"
        | "newsletter"
        | "video"
        | "external_link"
        | "research_publication"
        | "extension_bulletin"
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
      academic_level: ["high_school", "undergraduate", "graduate", "recent_graduate", "other"],
      app_role: ["admin", "user"],
      application_status: [
        "pending",
        "reviewed",
        "under_review",
        "accepted",
        "waitlisted",
        "rejected",
        "active",
        "completed",
        "withdrawn",
      ],
      attendance_method: ["qr", "manual", "csv_import", "walk_in"],
      attendance_status: ["registered", "checked_in", "attended", "virtual", "no_show", "cancelled"],
      milestone_status: ["pending", "in_progress", "completed", "waived"],
      twofas_document_type: ["resume", "transcript", "portfolio", "other"],
      twofas_track: ["high_school", "undergraduate", "graduate", "fellow"],
      checkout_status: [
        "pending",
        "approved",
        "denied",
        "checked_out",
        "returned",
      ],
      demographic_source_type: ["registration", "walk_in", "evaluation", "attendance"],
      evaluation_question_type: [
        "rating",
        "single_choice",
        "multi_choice",
        "short_text",
        "long_text",
        "yes_no",
        "number",
        "demographic",
        "consent",
      ],
      evaluation_response_mode: ["anonymous", "identified"],
      event_registration_record_status: ["registered", "waiting_list", "cancelled"],
      event_registration_status: ["open", "closed", "waiting_list", "sold_out", "invite_only"],
      event_status: ["draft", "published", "archived"],
      gallery_submission_status: ["pending", "approved", "rejected"],
      inquiry_status: ["new", "contacted", "in_progress", "resolved", "closed"],
      inquiry_type: [
        "join_program",
        "request_info",
        "partnership",
        "student_opportunity",
        "farmer_producer",
        "volunteer",
        "general",
      ],
      institution_type: [
        "land_grant_1890",
        "four_year",
        "community_college",
        "high_school",
        "technical_school",
        "recent_graduate",
        "not_enrolled",
        "other",
      ],
      market_announcement_type: ["general", "closure", "weather", "seasonal"],
      market_product_category: [
        "fruit",
        "vegetables",
        "meat",
        "eggs",
        "dairy",
        "honey",
        "plants",
        "flowers",
        "value_added",
        "prepared_foods",
        "crafts",
      ],
      media_asset_type: [
        "image",
        "video",
        "pdf",
        "magazine_cover",
        "factsheet",
        "audio",
        "logo",
        "document",
      ],
      notification_audience: ["admin", "user"],
      notification_channel: ["in_app", "email", "sms", "push"],
      notification_priority: ["low", "normal", "high", "urgent"],
      notification_status: ["pending", "sent", "failed", "read"],
      notification_type: [
        "twofas_application",
        "event_registration",
        "event_near_capacity",
        "publication_added",
        "equipment_request",
        "grant_deadline",
        "inquiry_received",
        "evaluation_submitted",
      ],
      preferred_contact_method: ["email", "phone", "either"],
      publication_content_type: [
        "factsheet",
        "report",
        "magazine",
        "newsletter",
        "video",
        "external_link",
        "research_publication",
        "extension_bulletin",
      ],
    },
  },
} as const
