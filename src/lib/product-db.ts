import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";

type ProductTables = {
  jesup_wallet_passes: {
    Row: {
      id: string;
      user_id: string;
      event_id: string | null;
      registration_id: string | null;
      kind:
        | "event_ticket"
        | "meal"
        | "parking"
        | "certificate"
        | "badge"
        | "membership"
        | "voucher"
        | "vip"
        | "donor";
      title: string;
      subtitle: string | null;
      token: string;
      status: "active" | "used" | "expired" | "revoked";
      valid_from: string | null;
      valid_until: string | null;
      uses_allowed: number | null;
      apple_pass_id: string | null;
      google_pass_id: string | null;
      metadata: Json;
      issued_at: string;
      updated_at: string;
    };
    Insert: {
      user_id: string;
      kind: ProductTables["jesup_wallet_passes"]["Row"]["kind"];
      title: string;
      id?: string;
      event_id?: string | null;
      registration_id?: string | null;
      subtitle?: string | null;
      token?: string;
      status?: ProductTables["jesup_wallet_passes"]["Row"]["status"];
      valid_from?: string | null;
      valid_until?: string | null;
      uses_allowed?: number | null;
      apple_pass_id?: string | null;
      google_pass_id?: string | null;
      metadata?: Json;
      issued_at?: string;
      updated_at?: string;
    };
    Update: Partial<ProductTables["jesup_wallet_passes"]["Insert"]>;
    Relationships: [];
  };
  jesup_preferences: {
    Row: {
      user_id: string;
      role: string | null;
      institution_id: string | null;
      interests: string[];
      county_name: string | null;
      state_code: string | null;
      onboarding_completed_at: string | null;
      updated_at: string;
    };
    Insert: {
      user_id: string;
      role?: string | null;
      institution_id?: string | null;
      interests?: string[];
      county_name?: string | null;
      state_code?: string | null;
      onboarding_completed_at?: string | null;
      updated_at?: string;
    };
    Update: Partial<ProductTables["jesup_preferences"]["Insert"]>;
    Relationships: [];
  };
  event_map_points: {
    Row: {
      id: string;
      event_id: string;
      label: string;
      category: string;
      description: string | null;
      latitude: number | null;
      longitude: number | null;
      building: string | null;
      floor_label: string | null;
      indoor_reference: string | null;
      sort_order: number;
      is_public: boolean;
      created_at: string;
    };
    Insert: {
      event_id: string;
      label: string;
      category: string;
      id?: string;
      description?: string | null;
      latitude?: number | null;
      longitude?: number | null;
      building?: string | null;
      floor_label?: string | null;
      indoor_reference?: string | null;
      sort_order?: number;
      is_public?: boolean;
      created_at?: string;
    };
    Update: Partial<ProductTables["event_map_points"]["Insert"]>;
    Relationships: [];
  };
  program_replication_guides: {
    Row: {
      program_id: string;
      is_published: boolean;
      impact_metrics: Json;
      curriculum: Json;
      resources: Json;
      budget: Json;
      timeline: Json;
      evaluation_methodology: string | null;
      outcome_measures: Json;
      contact_name: string | null;
      contact_email: string | null;
      updated_at: string;
    };
    Insert: {
      program_id: string;
      is_published?: boolean;
      impact_metrics?: Json;
      curriculum?: Json;
      resources?: Json;
      budget?: Json;
      timeline?: Json;
      evaluation_methodology?: string | null;
      outcome_measures?: Json;
      contact_name?: string | null;
      contact_email?: string | null;
      updated_at?: string;
    };
    Update: Partial<ProductTables["program_replication_guides"]["Insert"]>;
    Relationships: [];
  };
  extension_links: {
    Row: {
      id: string;
      source_type: string;
      source_id: string;
      target_type: string;
      target_id: string;
      relationship: string;
      is_public: boolean;
      created_at: string;
    };
    Insert: {
      source_type: string;
      source_id: string;
      target_type: string;
      target_id: string;
      relationship: string;
      id?: string;
      is_public?: boolean;
      created_at?: string;
    };
    Update: Partial<ProductTables["extension_links"]["Insert"]>;
    Relationships: [];
  };
  jesup_achievements: {
    Row: {
      id: string;
      user_id: string;
      event_id: string | null;
      code: string;
      title: string;
      description: string | null;
      xp: number;
      awarded_at: string;
    };
    Insert: {
      user_id: string;
      code: string;
      title: string;
      id?: string;
      event_id?: string | null;
      description?: string | null;
      xp?: number;
      awarded_at?: string;
    };
    Update: Partial<ProductTables["jesup_achievements"]["Insert"]>;
    Relationships: [];
  };
  jesup_challenges: {
    Row: {
      id: string;
      event_id: string | null;
      title: string;
      description: string | null;
      kind: string;
      xp: number;
      target_count: number;
      is_published: boolean;
      starts_at: string | null;
      ends_at: string | null;
      metadata: Json;
      created_at: string;
    };
    Insert: {
      title: string;
      kind: string;
      id?: string;
      event_id?: string | null;
      description?: string | null;
      xp?: number;
      target_count?: number;
      is_published?: boolean;
      starts_at?: string | null;
      ends_at?: string | null;
      metadata?: Json;
      created_at?: string;
    };
    Update: Partial<ProductTables["jesup_challenges"]["Insert"]>;
    Relationships: [];
  };
  jesup_challenge_progress: {
    Row: {
      challenge_id: string;
      user_id: string;
      current_count: number;
      completed_at: string | null;
      updated_at: string;
    };
    Insert: {
      challenge_id: string;
      user_id: string;
      current_count?: number;
      completed_at?: string | null;
      updated_at?: string;
    };
    Update: Partial<ProductTables["jesup_challenge_progress"]["Insert"]>;
    Relationships: [];
  };
  event_scan_events: {
    Row: {
      id: string;
      event_id: string;
      registration_id: string;
      pass_id: string | null;
      purpose: string;
      target_id: string | null;
      scanned_by: string;
      scanned_at: string;
      metadata: Json;
    };
    Insert: {
      event_id: string;
      registration_id: string;
      purpose: string;
      scanned_by: string;
      id?: string;
      pass_id?: string | null;
      target_id?: string | null;
      scanned_at?: string;
      metadata?: Json;
    };
    Update: Partial<ProductTables["event_scan_events"]["Insert"]>;
    Relationships: [];
  };
};

type ProductDatabase = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Tables" | "Functions"> & {
    Tables: Database["public"]["Tables"] & ProductTables;
    Functions: Database["public"]["Functions"] & {
      scan_jesup_credential: {
        Args: {
          p_event_id: string;
          p_code: string;
          p_purpose: string;
          p_target_id?: string | null;
        };
        Returns: {
          registration_id: string;
          attendee_name: string;
          scan_id: string;
          scanned_at: string;
        }[];
      };
    };
  };
};

// Kept separate until Supabase types are regenerated after the migration lands.
export const productDb = supabase as unknown as SupabaseClient<ProductDatabase>;
