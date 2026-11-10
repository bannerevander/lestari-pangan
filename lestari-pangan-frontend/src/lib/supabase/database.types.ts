// Dibuat otomatis dari skema Supabase (generate_typescript_types). Jangan diedit manual.
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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      appreciation_materials: {
        Row: {
          approved_at: string | null
          caption: string
          created_at: string
          created_by: number | null
          id: number
          image_path: string | null
          note: string | null
          profile_id: number
          status: string
          version: number
        }
        Insert: {
          approved_at?: string | null
          caption: string
          created_at?: string
          created_by?: number | null
          id?: never
          image_path?: string | null
          note?: string | null
          profile_id: number
          status?: string
          version: number
        }
        Update: {
          approved_at?: string | null
          caption?: string
          created_at?: string
          created_by?: number | null
          id?: never
          image_path?: string | null
          note?: string | null
          profile_id?: number
          status?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "appreciation_materials_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appreciation_materials_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_id: number | null
          after: string | null
          at: string
          before: string | null
          code: string | null
          id: number
          reason: string
          target: string
        }
        Insert: {
          action: string
          actor_id?: number | null
          after?: string | null
          at?: string
          before?: string | null
          code?: string | null
          id?: never
          reason: string
          target: string
        }
        Update: {
          action?: string
          actor_id?: number | null
          after?: string | null
          at?: string
          before?: string | null
          code?: string | null
          id?: never
          reason?: string
          target?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_participants: {
        Row: {
          challenge_id: number
          code: string | null
          id: number
          joined_at: string
          period_end: string
          period_start: string
          points: number
          profile_id: number
          reason: string | null
          status: string
          verified_at: string | null
          verified_by: number | null
        }
        Insert: {
          challenge_id: number
          code?: string | null
          id?: never
          joined_at?: string
          period_end: string
          period_start: string
          points?: number
          profile_id: number
          reason?: string | null
          status?: string
          verified_at?: string | null
          verified_by?: number | null
        }
        Update: {
          challenge_id?: number
          code?: string | null
          id?: never
          joined_at?: string
          period_end?: string
          period_start?: string
          points?: number
          profile_id?: number
          reason?: string | null
          status?: string
          verified_at?: string | null
          verified_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_participants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_participants_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          code: string | null
          created_at: string
          description: string
          id: number
          metric: string
          period_end: string
          period_start: string
          points: number
          roles: string[]
          status: string
          target_count: number
          title: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          description?: string
          id?: never
          metric: string
          period_end: string
          period_start: string
          points?: number
          roles: string[]
          status?: string
          target_count: number
          title: string
        }
        Update: {
          code?: string | null
          created_at?: string
          description?: string
          id?: never
          metric?: string
          period_end?: string
          period_start?: string
          points?: number
          roles?: string[]
          status?: string
          target_count?: number
          title?: string
        }
        Relationships: []
      }
      contents: {
        Row: {
          author: string
          body: Json
          category: string
          created_at: string
          id: number
          kind: string
          minutes: number | null
          photo_path: string | null
          reviewed_at: string | null
          reviewed_by: number | null
          slug: string
          status: string
          summary: string
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          author?: string
          body?: Json
          category: string
          created_at?: string
          id?: never
          kind: string
          minutes?: number | null
          photo_path?: string | null
          reviewed_at?: string | null
          reviewed_by?: number | null
          slug: string
          status?: string
          summary?: string
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          author?: string
          body?: Json
          category?: string
          created_at?: string
          id?: never
          kind?: string
          minutes?: number | null
          photo_path?: string | null
          reviewed_at?: string | null
          reviewed_by?: number | null
          slug?: string
          status?: string
          summary?: string
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "contents_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      courier_tasks: {
        Row: {
          code: string | null
          cost: number
          courier_id: number | null
          created_at: string
          delivered: number | null
          fail_reason: string | null
          id: number
          payer: string
          picked: number | null
          program_id: number | null
          status: string
          transfer_id: number
        }
        Insert: {
          code?: string | null
          cost?: number
          courier_id?: number | null
          created_at?: string
          delivered?: number | null
          fail_reason?: string | null
          id?: never
          payer?: string
          picked?: number | null
          program_id?: number | null
          status?: string
          transfer_id: number
        }
        Update: {
          code?: string | null
          cost?: number
          courier_id?: number | null
          created_at?: string
          delivered?: number | null
          fail_reason?: string | null
          id?: never
          payer?: string
          picked?: number | null
          program_id?: number | null
          status?: string
          transfer_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "courier_tasks_courier_id_fkey"
            columns: ["courier_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courier_tasks_program_fk"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courier_tasks_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: true
            referencedRelation: "transfers"
            referencedColumns: ["id"]
          },
        ]
      }
      food_records: {
        Row: {
          category: string
          client_id: string | null
          code: string | null
          created_at: string
          estimate: boolean
          id: number
          name: string
          owner_id: number
          quantity: number
          source_transfer_id: number | null
          status: string
          storage: string
          unit: string
        }
        Insert: {
          category: string
          client_id?: string | null
          code?: string | null
          created_at?: string
          estimate?: boolean
          id?: never
          name: string
          owner_id: number
          quantity: number
          source_transfer_id?: number | null
          status?: string
          storage?: string
          unit: string
        }
        Update: {
          category?: string
          client_id?: string | null
          code?: string | null
          created_at?: string
          estimate?: boolean
          id?: never
          name?: string
          owner_id?: number
          quantity?: number
          source_transfer_id?: number | null
          status?: string
          storage?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_records_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_records_source_transfer_fk"
            columns: ["source_transfer_id"]
            isOneToOne: false
            referencedRelation: "transfers"
            referencedColumns: ["id"]
          },
        ]
      }
      in_kind_supports: {
        Row: {
          amount_text: string
          client_id: string | null
          code: string | null
          created_at: string
          id: number
          kind: string
          profile_id: number
          reason: string | null
          status: string
        }
        Insert: {
          amount_text: string
          client_id?: string | null
          code?: string | null
          created_at?: string
          id?: never
          kind: string
          profile_id: number
          reason?: string | null
          status?: string
        }
        Update: {
          amount_text?: string
          client_id?: string | null
          code?: string | null
          created_at?: string
          id?: never
          kind?: string
          profile_id?: number
          reason?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "in_kind_supports_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      issue_events: {
        Row: {
          actor_id: number | null
          at: string
          id: number
          issue_id: number
          label: string
          note: string | null
        }
        Insert: {
          actor_id?: number | null
          at?: string
          id?: never
          issue_id: number
          label: string
          note?: string | null
        }
        Update: {
          actor_id?: number | null
          at?: string
          id?: never
          issue_id?: number
          label?: string
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "issue_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issue_events_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
      issues: {
        Row: {
          category: string
          client_id: string | null
          code: string | null
          created_at: string
          description: string
          id: number
          priority: string
          reporter_id: number
          resolution: string | null
          status: string
          transfer_id: number
        }
        Insert: {
          category: string
          client_id?: string | null
          code?: string | null
          created_at?: string
          description: string
          id?: never
          priority?: string
          reporter_id: number
          resolution?: string | null
          status?: string
          transfer_id: number
        }
        Update: {
          category?: string
          client_id?: string | null
          code?: string | null
          created_at?: string
          description?: string
          id?: never
          priority?: string
          reporter_id?: number
          resolution?: string | null
          status?: string
          transfer_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "issues_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "transfers"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_entries: {
        Row: {
          amount: number
          at: string
          code: string | null
          fund: string
          id: number
          kind: string
          note: string | null
          program_id: number | null
          provider_ref: string | null
          recorded_by: number | null
          reverses_id: number | null
          source: string
          support_id: number | null
          transfer_id: number | null
        }
        Insert: {
          amount: number
          at?: string
          code?: string | null
          fund: string
          id?: never
          kind: string
          note?: string | null
          program_id?: number | null
          provider_ref?: string | null
          recorded_by?: number | null
          reverses_id?: number | null
          source: string
          support_id?: number | null
          transfer_id?: number | null
        }
        Update: {
          amount?: number
          at?: string
          code?: string | null
          fund?: string
          id?: never
          kind?: string
          note?: string | null
          program_id?: number | null
          provider_ref?: string | null
          recorded_by?: number | null
          reverses_id?: number | null
          source?: string
          support_id?: number | null
          transfer_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_reverses_id_fkey"
            columns: ["reverses_id"]
            isOneToOne: true
            referencedRelation: "ledger_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_support_id_fkey"
            columns: ["support_id"]
            isOneToOne: true
            referencedRelation: "supports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "transfers"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          cta: string | null
          id: number
          kind: string
          link: string | null
          profile_id: number
          read_at: string | null
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          cta?: string | null
          id?: never
          kind: string
          link?: string | null
          profile_id: number
          read_at?: string | null
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          cta?: string | null
          id?: never
          kind?: string
          link?: string | null
          profile_id?: number
          read_at?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          allergens: string | null
          area: string
          available: number
          category: string
          client_id: string | null
          code: string | null
          created_at: string
          description: string | null
          donor_id: number
          estimate: boolean
          handed_over: number
          id: number
          initial: number
          label_date: string | null
          max_per_recipient: number | null
          methods: string[]
          name: string
          photo_path: string | null
          pickup_end: string
          pickup_start: string
          prepared_at: string | null
          record_id: number | null
          reserved: number
          status: string
          storage: string
          unit: string
        }
        Insert: {
          allergens?: string | null
          area: string
          available: number
          category: string
          client_id?: string | null
          code?: string | null
          created_at?: string
          description?: string | null
          donor_id: number
          estimate?: boolean
          handed_over?: number
          id?: never
          initial: number
          label_date?: string | null
          max_per_recipient?: number | null
          methods: string[]
          name: string
          photo_path?: string | null
          pickup_end: string
          pickup_start: string
          prepared_at?: string | null
          record_id?: number | null
          reserved?: number
          status?: string
          storage: string
          unit: string
        }
        Update: {
          allergens?: string | null
          area?: string
          available?: number
          category?: string
          client_id?: string | null
          code?: string | null
          created_at?: string
          description?: string | null
          donor_id?: number
          estimate?: boolean
          handed_over?: number
          id?: never
          initial?: number
          label_date?: string | null
          max_per_recipient?: number | null
          methods?: string[]
          name?: string
          photo_path?: string | null
          pickup_end?: string
          pickup_start?: string
          prepared_at?: string | null
          record_id?: number | null
          reserved?: number
          status?: string
          storage?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "food_records"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_contacts: {
        Row: {
          address: string
          created_at: string
          phone: string
          pic: string
          profile_id: number
        }
        Insert: {
          address: string
          created_at?: string
          phone: string
          pic: string
          profile_id: number
        }
        Update: {
          address?: string
          created_at?: string
          phone?: string
          pic?: string
          profile_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "profile_contacts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          admin_scope: string | null
          area: string
          capacity: string | null
          code: string | null
          created_at: string
          hours: string | null
          id: number
          org_name: string
          org_type: string
          prefs: Json
          role: string
          storage: string | null
          user_id: string
          verification_status: string
        }
        Insert: {
          admin_scope?: string | null
          area: string
          capacity?: string | null
          code?: string | null
          created_at?: string
          hours?: string | null
          id?: never
          org_name: string
          org_type: string
          prefs?: Json
          role: string
          storage?: string | null
          user_id: string
          verification_status?: string
        }
        Update: {
          admin_scope?: string | null
          area?: string
          capacity?: string | null
          code?: string | null
          created_at?: string
          hours?: string | null
          id?: never
          org_name?: string
          org_type?: string
          prefs?: Json
          role?: string
          storage?: string | null
          user_id?: string
          verification_status?: string
        }
        Relationships: []
      }
      programs: {
        Row: {
          budget: number
          code: string | null
          created_at: string
          id: number
          period_end: string
          period_start: string
          sponsor: string
          status: string
          title: string
        }
        Insert: {
          budget?: number
          code?: string | null
          created_at?: string
          id?: never
          period_end: string
          period_start: string
          sponsor: string
          status?: string
          title: string
        }
        Update: {
          budget?: number
          code?: string | null
          created_at?: string
          id?: never
          period_end?: string
          period_start?: string
          sponsor?: string
          status?: string
          title?: string
        }
        Relationships: []
      }
      promotions: {
        Row: {
          active: boolean
          area: string | null
          code: string | null
          created_at: string
          ends_on: string | null
          id: number
          image_path: string
          link: string | null
          placement: string
          sort: number
          starts_on: string | null
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          area?: string | null
          code?: string | null
          created_at?: string
          ends_on?: string | null
          id?: never
          image_path: string
          link?: string | null
          placement: string
          sort?: number
          starts_on?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          area?: string | null
          code?: string | null
          created_at?: string
          ends_on?: string | null
          id?: never
          image_path?: string
          link?: string | null
          placement?: string
          sort?: number
          starts_on?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      record_movements: {
        Row: {
          actor_id: number | null
          at: string
          client_id: string | null
          delta: number
          id: number
          kind: string
          label: string
          note: string | null
          record_id: number
        }
        Insert: {
          actor_id?: number | null
          at?: string
          client_id?: string | null
          delta: number
          id?: never
          kind: string
          label: string
          note?: string | null
          record_id: number
        }
        Update: {
          actor_id?: number | null
          at?: string
          client_id?: string | null
          delta?: number
          id?: never
          kind?: string
          label?: string
          note?: string | null
          record_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "record_movements_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "record_movements_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "food_records"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_supports: {
        Row: {
          amount: number
          day: number
          fund: string
          profile_id: number
          updated_at: string
        }
        Insert: {
          amount: number
          day: number
          fund?: string
          profile_id: number
          updated_at?: string
        }
        Update: {
          amount?: number
          day?: number
          fund?: string
          profile_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_supports_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      requests: {
        Row: {
          client_id: string | null
          code: string | null
          created_at: string
          id: number
          method: string
          note: string | null
          offer_id: number
          pickup_at: string
          proposal_at: string | null
          proposal_quantity: number | null
          proposal_reason: string | null
          quantity: number
          reason: string | null
          recipient_id: number
          status: string
          unit: string
        }
        Insert: {
          client_id?: string | null
          code?: string | null
          created_at?: string
          id?: never
          method: string
          note?: string | null
          offer_id: number
          pickup_at: string
          proposal_at?: string | null
          proposal_quantity?: number | null
          proposal_reason?: string | null
          quantity: number
          reason?: string | null
          recipient_id: number
          status?: string
          unit: string
        }
        Update: {
          client_id?: string | null
          code?: string | null
          created_at?: string
          id?: never
          method?: string
          note?: string | null
          offer_id?: number
          pickup_at?: string
          proposal_at?: string | null
          proposal_quantity?: number | null
          proposal_reason?: string | null
          quantity?: number
          reason?: string | null
          recipient_id?: number
          status?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "requests_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "v_offer_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_claims: {
        Row: {
          client_id: string | null
          code: string | null
          created_at: string
          id: number
          pack_id: number
          participant_id: number | null
          points: number
          profile_id: number
          reason: string | null
          status: string
        }
        Insert: {
          client_id?: string | null
          code?: string | null
          created_at?: string
          id?: never
          pack_id: number
          participant_id?: number | null
          points?: number
          profile_id: number
          reason?: string | null
          status?: string
        }
        Update: {
          client_id?: string | null
          code?: string | null
          created_at?: string
          id?: never
          pack_id?: number
          participant_id?: number | null
          points?: number
          profile_id?: number
          reason?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_claims_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "reward_packs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_claims_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "challenge_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_claims_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "v_challenge_progress"
            referencedColumns: ["participant_id"]
          },
          {
            foreignKeyName: "reward_claims_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_packs: {
        Row: {
          active: boolean
          claimed: number
          code: string | null
          cost: number
          created_at: string
          detail: string
          eligible_roles: string[]
          id: number
          quota: number
          sponsor: string
          title: string
        }
        Insert: {
          active?: boolean
          claimed?: number
          code?: string | null
          cost?: number
          created_at?: string
          detail?: string
          eligible_roles: string[]
          id?: never
          quota: number
          sponsor: string
          title: string
        }
        Update: {
          active?: boolean
          claimed?: number
          code?: string | null
          cost?: number
          created_at?: string
          detail?: string
          eligible_roles?: string[]
          id?: never
          quota?: number
          sponsor?: string
          title?: string
        }
        Relationships: []
      }
      saved_contents: {
        Row: {
          content_id: number
          created_at: string
          profile_id: number
        }
        Insert: {
          content_id: number
          created_at?: string
          profile_id: number
        }
        Update: {
          content_id?: number
          created_at?: string
          profile_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "saved_contents_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_contents_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          client_id: string | null
          code: string | null
          created_at: string
          id: number
          kind: string
          message: string
          profile_id: number
          related: string | null
          reply: string | null
          status: string
          topic: string
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          code?: string | null
          created_at?: string
          id?: never
          kind: string
          message?: string
          profile_id: number
          related?: string | null
          reply?: string | null
          status?: string
          topic: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          code?: string | null
          created_at?: string
          id?: never
          kind?: string
          message?: string
          profile_id?: number
          related?: string | null
          reply?: string | null
          status?: string
          topic?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      supports: {
        Row: {
          allocation: string
          amount: number
          client_id: string | null
          code: string | null
          created_at: string
          decided_at: string | null
          decided_by: number | null
          fund: string
          id: number
          note: string | null
          profile_id: number
          program_id: number | null
          status: string
        }
        Insert: {
          allocation: string
          amount: number
          client_id?: string | null
          code?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: number | null
          fund: string
          id?: never
          note?: string | null
          profile_id: number
          program_id?: number | null
          status?: string
        }
        Update: {
          allocation?: string
          amount?: number
          client_id?: string | null
          code?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: number | null
          fund?: string
          id?: never
          note?: string | null
          profile_id?: number
          program_id?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "supports_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supports_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supports_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      transfer_events: {
        Row: {
          actor_id: number | null
          at: string
          id: number
          label: string
          note: string | null
          transfer_id: number
        }
        Insert: {
          actor_id?: number | null
          at?: string
          id?: never
          label: string
          note?: string | null
          transfer_id: number
        }
        Update: {
          actor_id?: number | null
          at?: string
          id?: never
          label?: string
          note?: string | null
          transfer_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "transfer_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfer_events_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "transfers"
            referencedColumns: ["id"]
          },
        ]
      }
      transfers: {
        Row: {
          agreed: number
          code: string | null
          created_at: string
          distributed: number | null
          distribution_reported_at: string | null
          donor_id: number
          fee_payer: string
          fee_request: boolean
          handed_over: number | null
          id: number
          method: string
          offer_id: number
          overdue_notified_at: string | null
          pending_receipt: Json | null
          pending_schedule: Json | null
          pickup_at: string
          prep: string[]
          received: number | null
          recipient_id: number
          rejected: number | null
          request_id: number
          status: string
          unit: string
          used: number | null
          wasted: number | null
          window_end: string
          window_start: string
        }
        Insert: {
          agreed: number
          code?: string | null
          created_at?: string
          distributed?: number | null
          distribution_reported_at?: string | null
          donor_id: number
          fee_payer?: string
          fee_request?: boolean
          handed_over?: number | null
          id?: never
          method: string
          offer_id: number
          overdue_notified_at?: string | null
          pending_receipt?: Json | null
          pending_schedule?: Json | null
          pickup_at: string
          prep?: string[]
          received?: number | null
          recipient_id: number
          rejected?: number | null
          request_id: number
          status?: string
          unit: string
          used?: number | null
          wasted?: number | null
          window_end: string
          window_start: string
        }
        Update: {
          agreed?: number
          code?: string | null
          created_at?: string
          distributed?: number | null
          distribution_reported_at?: string | null
          donor_id?: number
          fee_payer?: string
          fee_request?: boolean
          handed_over?: number | null
          id?: never
          method?: string
          offer_id?: number
          overdue_notified_at?: string | null
          pending_receipt?: Json | null
          pending_schedule?: Json | null
          pickup_at?: string
          prep?: string[]
          received?: number | null
          recipient_id?: number
          rejected?: number | null
          request_id?: number
          status?: string
          unit?: string
          used?: number | null
          wasted?: number | null
          window_end?: string
          window_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfers_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "v_offer_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: true
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      verifications: {
        Row: {
          code: string | null
          created_at: string
          decided_at: string | null
          decided_by: number | null
          doc_path: string
          id: number
          profile_id: number
          reason: string | null
          status: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: number | null
          doc_path: string
          id?: never
          profile_id: number
          reason?: string | null
          status?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: number | null
          doc_path?: string
          id?: never
          profile_id?: number
          reason?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "verifications_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_admin_queue: {
        Row: {
          claims_open: number | null
          courier_open: number | null
          in_kind_pending: number | null
          issues_open: number | null
          participants_pending: number | null
          supports_pending: number | null
          transfers_overdue: number | null
          verifications_pending: number | null
        }
        Relationships: []
      }
      v_challenge_progress: {
        Row: {
          challenge_id: number | null
          challenge_points: number | null
          code: string | null
          metric: string | null
          participant_id: number | null
          period_end: string | null
          period_start: string | null
          points: number | null
          profile_id: number | null
          progress: number | null
          status: string | null
          target_count: number | null
          title: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_participants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      v_impact_donor: {
        Row: {
          agreed: number | null
          donor_id: number | null
          month: string | null
          received: number | null
          rejected: number | null
          transfers: number | null
          unit: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transfers_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      v_impact_recipient: {
        Row: {
          distributed: number | null
          month: string | null
          received: number | null
          recipient_id: number | null
          transfers: number | null
          unit: string | null
          unreported: number | null
          used: number | null
          wasted: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transfers_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      v_offer_cards: {
        Row: {
          allergens: string | null
          area: string | null
          available: number | null
          category: string | null
          code: string | null
          created_at: string | null
          description: string | null
          donor_name: string | null
          donor_type: string | null
          donor_verified: boolean | null
          estimate: boolean | null
          id: number | null
          initial: number | null
          label_date: string | null
          methods: string[] | null
          name: string | null
          photo_path: string | null
          pickup_end: string | null
          pickup_start: string | null
          prepared_at: string | null
          storage: string | null
          unit: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_assign_courier: {
        Args: {
          p_cost?: number
          p_courier_id?: number
          p_payer?: string
          p_program_id?: number
          p_transfer_id: number
        }
        Returns: {
          code: string | null
          cost: number
          courier_id: number | null
          created_at: string
          delivered: number | null
          fail_reason: string | null
          id: number
          payer: string
          picked: number | null
          program_id: number | null
          status: string
          transfer_id: number
        }
        SetofOptions: {
          from: "*"
          to: "courier_tasks"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_decide_in_kind: {
        Args: { p_id: number; p_reason: string; p_status: string }
        Returns: {
          amount_text: string
          client_id: string | null
          code: string | null
          created_at: string
          id: number
          kind: string
          profile_id: number
          reason: string | null
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "in_kind_supports"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_decide_participant: {
        Args: { p_decision: string; p_id: number; p_reason: string }
        Returns: {
          challenge_id: number
          code: string | null
          id: number
          joined_at: string
          period_end: string
          period_start: string
          points: number
          profile_id: number
          reason: string | null
          status: string
          verified_at: string | null
          verified_by: number | null
        }
        SetofOptions: {
          from: "*"
          to: "challenge_participants"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_decide_support: {
        Args: {
          p_decision: string
          p_id: number
          p_provider_ref?: string
          p_reason: string
        }
        Returns: {
          allocation: string
          amount: number
          client_id: string | null
          code: string | null
          created_at: string
          decided_at: string | null
          decided_by: number | null
          fund: string
          id: number
          note: string | null
          profile_id: number
          program_id: number | null
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "supports"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_decide_verification: {
        Args: { p_decision: string; p_id: number; p_reason: string }
        Returns: {
          code: string | null
          created_at: string
          decided_at: string | null
          decided_by: number | null
          doc_path: string
          id: number
          profile_id: number
          reason: string | null
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "verifications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_propose_appreciation: {
        Args: { p_caption: string; p_image_path?: string; p_profile_id: number }
        Returns: {
          approved_at: string | null
          caption: string
          created_at: string
          created_by: number | null
          id: number
          image_path: string | null
          note: string | null
          profile_id: number
          status: string
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "appreciation_materials"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_publish_content: {
        Args: { p_id: number }
        Returns: {
          author: string
          body: Json
          category: string
          created_at: string
          id: number
          kind: string
          minutes: number | null
          photo_path: string | null
          reviewed_at: string | null
          reviewed_by: number | null
          slug: string
          status: string
          summary: string
          title: string
          updated_at: string
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "contents"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_record_ledger: {
        Args: {
          p_amount: number
          p_fund: string
          p_kind: string
          p_note: string
          p_program_id?: number
          p_provider_ref?: string
          p_source: string
          p_transfer_id?: number
        }
        Returns: {
          amount: number
          at: string
          code: string | null
          fund: string
          id: number
          kind: string
          note: string | null
          program_id: number | null
          provider_ref: string | null
          recorded_by: number | null
          reverses_id: number | null
          source: string
          support_id: number | null
          transfer_id: number | null
        }
        SetofOptions: {
          from: "*"
          to: "ledger_entries"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_reply_ticket: {
        Args: { p_id: number; p_reply: string; p_status: string }
        Returns: {
          client_id: string | null
          code: string | null
          created_at: string
          id: number
          kind: string
          message: string
          profile_id: number
          related: string | null
          reply: string | null
          status: string
          topic: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "support_tickets"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_reverse_ledger: {
        Args: { p_id: number; p_reason: string }
        Returns: {
          amount: number
          at: string
          code: string | null
          fund: string
          id: number
          kind: string
          note: string | null
          program_id: number | null
          provider_ref: string | null
          recorded_by: number | null
          reverses_id: number | null
          source: string
          support_id: number | null
          transfer_id: number | null
        }
        SetofOptions: {
          from: "*"
          to: "ledger_entries"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_save_challenge: {
        Args: { p_fields: Json; p_id: number }
        Returns: {
          code: string | null
          created_at: string
          description: string
          id: number
          metric: string
          period_end: string
          period_start: string
          points: number
          roles: string[]
          status: string
          target_count: number
          title: string
        }
        SetofOptions: {
          from: "*"
          to: "challenges"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_save_content: {
        Args: { p_fields: Json; p_id: number; p_submit?: boolean }
        Returns: {
          author: string
          body: Json
          category: string
          created_at: string
          id: number
          kind: string
          minutes: number | null
          photo_path: string | null
          reviewed_at: string | null
          reviewed_by: number | null
          slug: string
          status: string
          summary: string
          title: string
          updated_at: string
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "contents"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_save_program: {
        Args: { p_fields: Json; p_id: number }
        Returns: {
          budget: number
          code: string | null
          created_at: string
          id: number
          period_end: string
          period_start: string
          sponsor: string
          status: string
          title: string
        }
        SetofOptions: {
          from: "*"
          to: "programs"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_save_promotion: {
        Args: { p_fields: Json; p_id: number }
        Returns: {
          active: boolean
          area: string | null
          code: string | null
          created_at: string
          ends_on: string | null
          id: number
          image_path: string
          link: string | null
          placement: string
          sort: number
          starts_on: string | null
          title: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "promotions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_save_reward_pack: {
        Args: { p_fields: Json; p_id: number }
        Returns: {
          active: boolean
          claimed: number
          code: string | null
          cost: number
          created_at: string
          detail: string
          eligible_roles: string[]
          id: number
          quota: number
          sponsor: string
          title: string
        }
        SetofOptions: {
          from: "*"
          to: "reward_packs"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_update_claim: {
        Args: { p_id: number; p_reason: string; p_status: string }
        Returns: {
          client_id: string | null
          code: string | null
          created_at: string
          id: number
          pack_id: number
          participant_id: number | null
          points: number
          profile_id: number
          reason: string | null
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "reward_claims"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_update_issue: {
        Args: {
          p_id: number
          p_priority?: string
          p_resolution?: string
          p_status: string
        }
        Returns: {
          category: string
          client_id: string | null
          code: string | null
          created_at: string
          description: string
          id: number
          priority: string
          reporter_id: number
          resolution: string | null
          status: string
          transfer_id: number
        }
        SetofOptions: {
          from: "*"
          to: "issues"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_verify_receipt: {
        Args: { p_approve: boolean; p_id: number; p_note: string }
        Returns: {
          agreed: number
          code: string | null
          created_at: string
          distributed: number | null
          distribution_reported_at: string | null
          donor_id: number
          fee_payer: string
          fee_request: boolean
          handed_over: number | null
          id: number
          method: string
          offer_id: number
          overdue_notified_at: string | null
          pending_receipt: Json | null
          pending_schedule: Json | null
          pickup_at: string
          prep: string[]
          received: number | null
          recipient_id: number
          rejected: number | null
          request_id: number
          status: string
          unit: string
          used: number | null
          wasted: number | null
          window_end: string
          window_start: string
        }
        SetofOptions: {
          from: "*"
          to: "transfers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      donation_cancel_request: {
        Args: { p_id: number; p_reason: string }
        Returns: {
          client_id: string | null
          code: string | null
          created_at: string
          id: number
          method: string
          note: string | null
          offer_id: number
          pickup_at: string
          proposal_at: string | null
          proposal_quantity: number | null
          proposal_reason: string | null
          quantity: number
          reason: string | null
          recipient_id: number
          status: string
          unit: string
        }
        SetofOptions: {
          from: "*"
          to: "requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      donation_close_offer: {
        Args: { p_id: number }
        Returns: {
          allergens: string | null
          area: string
          available: number
          category: string
          client_id: string | null
          code: string | null
          created_at: string
          description: string | null
          donor_id: number
          estimate: boolean
          handed_over: number
          id: number
          initial: number
          label_date: string | null
          max_per_recipient: number | null
          methods: string[]
          name: string
          photo_path: string | null
          pickup_end: string
          pickup_start: string
          prepared_at: string | null
          record_id: number | null
          reserved: number
          status: string
          storage: string
          unit: string
        }
        SetofOptions: {
          from: "*"
          to: "offers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      donation_decide_request: {
        Args: { p_decision: string; p_id: number; p_reason?: string }
        Returns: {
          client_id: string | null
          code: string | null
          created_at: string
          id: number
          method: string
          note: string | null
          offer_id: number
          pickup_at: string
          proposal_at: string | null
          proposal_quantity: number | null
          proposal_reason: string | null
          quantity: number
          reason: string | null
          recipient_id: number
          status: string
          unit: string
        }
        SetofOptions: {
          from: "*"
          to: "requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      donation_propose_adjustment: {
        Args: { p_id: number; p_quantity: number; p_reason: string }
        Returns: {
          client_id: string | null
          code: string | null
          created_at: string
          id: number
          method: string
          note: string | null
          offer_id: number
          pickup_at: string
          proposal_at: string | null
          proposal_quantity: number | null
          proposal_reason: string | null
          quantity: number
          reason: string | null
          recipient_id: number
          status: string
          unit: string
        }
        SetofOptions: {
          from: "*"
          to: "requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      donation_publish_offer: {
        Args: {
          p_allergens?: string
          p_area: string
          p_category: string
          p_client_id: string
          p_description?: string
          p_estimate?: boolean
          p_label_date?: string
          p_max_per_recipient?: number
          p_methods: string[]
          p_name: string
          p_photo_path?: string
          p_pickup_end: string
          p_pickup_start: string
          p_prepared_at?: string
          p_quantity: number
          p_record_id?: number
          p_storage: string
          p_unit: string
        }
        Returns: {
          allergens: string | null
          area: string
          available: number
          category: string
          client_id: string | null
          code: string | null
          created_at: string
          description: string | null
          donor_id: number
          estimate: boolean
          handed_over: number
          id: number
          initial: number
          label_date: string | null
          max_per_recipient: number | null
          methods: string[]
          name: string
          photo_path: string | null
          pickup_end: string
          pickup_start: string
          prepared_at: string | null
          record_id: number | null
          reserved: number
          status: string
          storage: string
          unit: string
        }
        SetofOptions: {
          from: "*"
          to: "offers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      donation_respond_adjustment: {
        Args: { p_accept: boolean; p_id: number }
        Returns: {
          client_id: string | null
          code: string | null
          created_at: string
          id: number
          method: string
          note: string | null
          offer_id: number
          pickup_at: string
          proposal_at: string | null
          proposal_quantity: number | null
          proposal_reason: string | null
          quantity: number
          reason: string | null
          recipient_id: number
          status: string
          unit: string
        }
        SetofOptions: {
          from: "*"
          to: "requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      donation_submit_request: {
        Args: {
          p_client_id: string
          p_method: string
          p_note?: string
          p_offer_id: number
          p_pickup_at: string
          p_quantity: number
        }
        Returns: {
          client_id: string | null
          code: string | null
          created_at: string
          id: number
          method: string
          note: string | null
          offer_id: number
          pickup_at: string
          proposal_at: string | null
          proposal_quantity: number | null
          proposal_reason: string | null
          quantity: number
          reason: string | null
          recipient_id: number
          status: string
          unit: string
        }
        SetofOptions: {
          from: "*"
          to: "requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      donation_update_offer: {
        Args: {
          p_available: number
          p_description?: string
          p_id: number
          p_pickup_end: string
          p_pickup_start: string
          p_reason?: string
          p_storage?: string
        }
        Returns: {
          allergens: string | null
          area: string
          available: number
          category: string
          client_id: string | null
          code: string | null
          created_at: string
          description: string | null
          donor_id: number
          estimate: boolean
          handed_over: number
          id: number
          initial: number
          label_date: string | null
          max_per_recipient: number | null
          methods: string[]
          name: string
          photo_path: string | null
          pickup_end: string
          pickup_start: string
          prepared_at: string | null
          record_id: number | null
          reserved: number
          status: string
          storage: string
          unit: string
        }
        SetofOptions: {
          from: "*"
          to: "offers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      engagement_claim_reward: {
        Args: { p_client_id: string; p_pack_id: number }
        Returns: {
          client_id: string | null
          code: string | null
          created_at: string
          id: number
          pack_id: number
          participant_id: number | null
          points: number
          profile_id: number
          reason: string | null
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "reward_claims"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      engagement_finish_challenge: {
        Args: { p_participant_id: number }
        Returns: {
          challenge_id: number
          code: string | null
          id: number
          joined_at: string
          period_end: string
          period_start: string
          points: number
          profile_id: number
          reason: string | null
          status: string
          verified_at: string | null
          verified_by: number | null
        }
        SetofOptions: {
          from: "*"
          to: "challenge_participants"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      engagement_join_challenge: {
        Args: { p_challenge_id: number }
        Returns: {
          challenge_id: number
          code: string | null
          id: number
          joined_at: string
          period_end: string
          period_start: string
          points: number
          profile_id: number
          reason: string | null
          status: string
          verified_at: string | null
          verified_by: number | null
        }
        SetofOptions: {
          from: "*"
          to: "challenge_participants"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      engagement_respond_appreciation: {
        Args: { p_decision: string; p_material_id: number; p_note?: string }
        Returns: {
          approved_at: string | null
          caption: string
          created_at: string
          created_by: number | null
          id: number
          image_path: string | null
          note: string | null
          profile_id: number
          status: string
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "appreciation_materials"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      engagement_toggle_saved: {
        Args: { p_content_id: number }
        Returns: boolean
      }
      fulfillment_handover: {
        Args: { p_id: number; p_note?: string; p_quantity: number }
        Returns: {
          agreed: number
          code: string | null
          created_at: string
          distributed: number | null
          distribution_reported_at: string | null
          donor_id: number
          fee_payer: string
          fee_request: boolean
          handed_over: number | null
          id: number
          method: string
          offer_id: number
          overdue_notified_at: string | null
          pending_receipt: Json | null
          pending_schedule: Json | null
          pickup_at: string
          prep: string[]
          received: number | null
          recipient_id: number
          rejected: number | null
          request_id: number
          status: string
          unit: string
          used: number | null
          wasted: number | null
          window_end: string
          window_start: string
        }
        SetofOptions: {
          from: "*"
          to: "transfers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      fulfillment_receive: {
        Args: {
          p_id: number
          p_note?: string
          p_reason?: string
          p_received: number
        }
        Returns: {
          agreed: number
          code: string | null
          created_at: string
          distributed: number | null
          distribution_reported_at: string | null
          donor_id: number
          fee_payer: string
          fee_request: boolean
          handed_over: number | null
          id: number
          method: string
          offer_id: number
          overdue_notified_at: string | null
          pending_receipt: Json | null
          pending_schedule: Json | null
          pickup_at: string
          prep: string[]
          received: number | null
          recipient_id: number
          rejected: number | null
          request_id: number
          status: string
          unit: string
          used: number | null
          wasted: number | null
          window_end: string
          window_start: string
        }
        SetofOptions: {
          from: "*"
          to: "transfers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      fulfillment_report_distribution: {
        Args: {
          p_distributed: number
          p_id: number
          p_used: number
          p_wasted: number
        }
        Returns: {
          agreed: number
          code: string | null
          created_at: string
          distributed: number | null
          distribution_reported_at: string | null
          donor_id: number
          fee_payer: string
          fee_request: boolean
          handed_over: number | null
          id: number
          method: string
          offer_id: number
          overdue_notified_at: string | null
          pending_receipt: Json | null
          pending_schedule: Json | null
          pickup_at: string
          prep: string[]
          received: number | null
          recipient_id: number
          rejected: number | null
          request_id: number
          status: string
          unit: string
          used: number | null
          wasted: number | null
          window_end: string
          window_start: string
        }
        SetofOptions: {
          from: "*"
          to: "transfers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      fulfillment_request_fee: {
        Args: { p_id: number }
        Returns: {
          agreed: number
          code: string | null
          created_at: string
          distributed: number | null
          distribution_reported_at: string | null
          donor_id: number
          fee_payer: string
          fee_request: boolean
          handed_over: number | null
          id: number
          method: string
          offer_id: number
          overdue_notified_at: string | null
          pending_receipt: Json | null
          pending_schedule: Json | null
          pickup_at: string
          prep: string[]
          received: number | null
          recipient_id: number
          rejected: number | null
          request_id: number
          status: string
          unit: string
          used: number | null
          wasted: number | null
          window_end: string
          window_start: string
        }
        SetofOptions: {
          from: "*"
          to: "transfers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      fulfillment_respond_fee: {
        Args: { p_accept: boolean; p_id: number }
        Returns: {
          agreed: number
          code: string | null
          created_at: string
          distributed: number | null
          distribution_reported_at: string | null
          donor_id: number
          fee_payer: string
          fee_request: boolean
          handed_over: number | null
          id: number
          method: string
          offer_id: number
          overdue_notified_at: string | null
          pending_receipt: Json | null
          pending_schedule: Json | null
          pickup_at: string
          prep: string[]
          received: number | null
          recipient_id: number
          rejected: number | null
          request_id: number
          status: string
          unit: string
          used: number | null
          wasted: number | null
          window_end: string
          window_start: string
        }
        SetofOptions: {
          from: "*"
          to: "transfers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      fulfillment_respond_schedule: {
        Args: { p_accept: boolean; p_id: number }
        Returns: {
          agreed: number
          code: string | null
          created_at: string
          distributed: number | null
          distribution_reported_at: string | null
          donor_id: number
          fee_payer: string
          fee_request: boolean
          handed_over: number | null
          id: number
          method: string
          offer_id: number
          overdue_notified_at: string | null
          pending_receipt: Json | null
          pending_schedule: Json | null
          pickup_at: string
          prep: string[]
          received: number | null
          recipient_id: number
          rejected: number | null
          request_id: number
          status: string
          unit: string
          used: number | null
          wasted: number | null
          window_end: string
          window_start: string
        }
        SetofOptions: {
          from: "*"
          to: "transfers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      fulfillment_set_method: {
        Args: { p_id: number; p_method: string }
        Returns: {
          agreed: number
          code: string | null
          created_at: string
          distributed: number | null
          distribution_reported_at: string | null
          donor_id: number
          fee_payer: string
          fee_request: boolean
          handed_over: number | null
          id: number
          method: string
          offer_id: number
          overdue_notified_at: string | null
          pending_receipt: Json | null
          pending_schedule: Json | null
          pickup_at: string
          prep: string[]
          received: number | null
          recipient_id: number
          rejected: number | null
          request_id: number
          status: string
          unit: string
          used: number | null
          wasted: number | null
          window_end: string
          window_start: string
        }
        SetofOptions: {
          from: "*"
          to: "transfers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      fulfillment_set_prep: {
        Args: { p_checks: string[]; p_id: number }
        Returns: {
          agreed: number
          code: string | null
          created_at: string
          distributed: number | null
          distribution_reported_at: string | null
          donor_id: number
          fee_payer: string
          fee_request: boolean
          handed_over: number | null
          id: number
          method: string
          offer_id: number
          overdue_notified_at: string | null
          pending_receipt: Json | null
          pending_schedule: Json | null
          pickup_at: string
          prep: string[]
          received: number | null
          recipient_id: number
          rejected: number | null
          request_id: number
          status: string
          unit: string
          used: number | null
          wasted: number | null
          window_end: string
          window_start: string
        }
        SetofOptions: {
          from: "*"
          to: "transfers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      fulfillment_task_deliver: {
        Args: { p_quantity: number; p_task_id: number }
        Returns: {
          code: string | null
          cost: number
          courier_id: number | null
          created_at: string
          delivered: number | null
          fail_reason: string | null
          id: number
          payer: string
          picked: number | null
          program_id: number | null
          status: string
          transfer_id: number
        }
        SetofOptions: {
          from: "*"
          to: "courier_tasks"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      fulfillment_task_fail: {
        Args: { p_reason: string; p_task_id: number }
        Returns: {
          code: string | null
          cost: number
          courier_id: number | null
          created_at: string
          delivered: number | null
          fail_reason: string | null
          id: number
          payer: string
          picked: number | null
          program_id: number | null
          status: string
          transfer_id: number
        }
        SetofOptions: {
          from: "*"
          to: "courier_tasks"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      fulfillment_task_pickup: {
        Args: { p_quantity: number; p_task_id: number }
        Returns: {
          code: string | null
          cost: number
          courier_id: number | null
          created_at: string
          delivered: number | null
          fail_reason: string | null
          id: number
          payer: string
          picked: number | null
          program_id: number | null
          status: string
          transfer_id: number
        }
        SetofOptions: {
          from: "*"
          to: "courier_tasks"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      funding_add_in_kind: {
        Args: { p_amount_text: string; p_client_id: string; p_kind: string }
        Returns: {
          amount_text: string
          client_id: string | null
          code: string | null
          created_at: string
          id: number
          kind: string
          profile_id: number
          reason: string | null
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "in_kind_supports"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      funding_add_support: {
        Args: {
          p_allocation: string
          p_amount: number
          p_client_id: string
          p_fund: string
          p_program_id?: number
        }
        Returns: {
          allocation: string
          amount: number
          client_id: string | null
          code: string | null
          created_at: string
          decided_at: string | null
          decided_by: number | null
          fund: string
          id: number
          note: string | null
          profile_id: number
          program_id: number | null
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "supports"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      funding_set_recurring: {
        Args: { p_amount?: number; p_day?: number; p_fund?: string }
        Returns: {
          amount: number
          day: number
          fund: string
          profile_id: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "recurring_supports"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      funding_summary: {
        Args: never
        Returns: {
          fund: string
          keluar: number
          masuk: number
          program_id: number
          program_title: string
          saldo: number
        }[]
      }
      identity_complete_onboarding: {
        Args: {
          p_address: string
          p_area: string
          p_capacity?: string
          p_hours?: string
          p_org_name: string
          p_org_type: string
          p_phone: string
          p_pic: string
          p_role: string
          p_storage?: string
        }
        Returns: {
          admin_scope: string | null
          area: string
          capacity: string | null
          code: string | null
          created_at: string
          hours: string | null
          id: number
          org_name: string
          org_type: string
          prefs: Json
          role: string
          storage: string | null
          user_id: string
          verification_status: string
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      identity_me: { Args: never; Returns: Json }
      identity_save_profile: {
        Args: { p_fields: Json }
        Returns: {
          admin_scope: string | null
          area: string
          capacity: string | null
          code: string | null
          created_at: string
          hours: string | null
          id: number
          org_name: string
          org_type: string
          prefs: Json
          role: string
          storage: string | null
          user_id: string
          verification_status: string
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      identity_set_pref: {
        Args: { p_key: string; p_value: boolean }
        Returns: {
          admin_scope: string | null
          area: string
          capacity: string | null
          code: string | null
          created_at: string
          hours: string | null
          id: number
          org_name: string
          org_type: string
          prefs: Json
          role: string
          storage: string | null
          user_id: string
          verification_status: string
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      identity_submit_verification: {
        Args: { p_doc_path: string }
        Returns: {
          code: string | null
          created_at: string
          decided_at: string | null
          decided_by: number | null
          doc_path: string
          id: number
          profile_id: number
          reason: string | null
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "verifications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      inventory_add_record: {
        Args: {
          p_category: string
          p_client_id: string
          p_estimate?: boolean
          p_name: string
          p_quantity: number
          p_storage?: string
          p_unit: string
        }
        Returns: {
          category: string
          client_id: string | null
          code: string | null
          created_at: string
          estimate: boolean
          id: number
          name: string
          owner_id: number
          quantity: number
          source_transfer_id: number | null
          status: string
          storage: string
          unit: string
        }
        SetofOptions: {
          from: "*"
          to: "food_records"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      inventory_correct_record: {
        Args: {
          p_client_id: string
          p_id: number
          p_quantity: number
          p_reason: string
        }
        Returns: {
          category: string
          client_id: string | null
          code: string | null
          created_at: string
          estimate: boolean
          id: number
          name: string
          owner_id: number
          quantity: number
          source_transfer_id: number | null
          status: string
          storage: string
          unit: string
        }
        SetofOptions: {
          from: "*"
          to: "food_records"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      inventory_move_record: {
        Args: {
          p_client_id: string
          p_id: number
          p_kind: string
          p_note?: string
          p_quantity: number
        }
        Returns: {
          category: string
          client_id: string | null
          code: string | null
          created_at: string
          estimate: boolean
          id: number
          name: string
          owner_id: number
          quantity: number
          source_transfer_id: number | null
          status: string
          storage: string
          unit: string
        }
        SetofOptions: {
          from: "*"
          to: "food_records"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      issues_object: {
        Args: { p_id: number; p_note: string }
        Returns: {
          category: string
          client_id: string | null
          code: string | null
          created_at: string
          description: string
          id: number
          priority: string
          reporter_id: number
          resolution: string | null
          status: string
          transfer_id: number
        }
        SetofOptions: {
          from: "*"
          to: "issues"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      issues_report: {
        Args: {
          p_category: string
          p_client_id: string
          p_description: string
          p_transfer_id: number
        }
        Returns: {
          category: string
          client_id: string | null
          code: string | null
          created_at: string
          description: string
          id: number
          priority: string
          reporter_id: number
          resolution: string | null
          status: string
          transfer_id: number
        }
        SetofOptions: {
          from: "*"
          to: "issues"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      notify_mark_read: { Args: { p_id?: number }; Returns: number }
      support_create_ticket: {
        Args: {
          p_client_id: string
          p_kind: string
          p_message: string
          p_related?: string
          p_topic: string
        }
        Returns: {
          client_id: string | null
          code: string | null
          created_at: string
          id: number
          kind: string
          message: string
          profile_id: number
          related: string | null
          reply: string | null
          status: string
          topic: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "support_tickets"
          isOneToOne: true
          isSetofReturn: false
        }
      }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
