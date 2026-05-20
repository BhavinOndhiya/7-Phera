export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Role = 'bride' | 'groom' | 'family' | 'planner';
export type EventType =
  | 'engagement'
  | 'wedding'
  | 'reception'
  | 'sangeet'
  | 'mehendi'
  | 'haldi'
  | 'other';
export type Side = 'bride' | 'groom';
export type AgeGroup = 'child' | 'adult' | 'senior';
export type InvitationStatus = 'not_sent' | 'sent' | 'delivered' | 'opened';
export type RsvpStatus = 'pending' | 'accepted' | 'declined' | 'tentative';
export type PaymentStatus = 'unpaid' | 'partial' | 'paid';
export type Priority = 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled';
export type PaymentMethod =
  | 'cash'
  | 'card'
  | 'upi'
  | 'bank_transfer'
  | 'cheque'
  | 'razorpay';
export type DocumentCategory =
  | 'contract'
  | 'invoice'
  | 'inspiration'
  | 'guest_list'
  | 'photo'
  | 'other';
export type CollaboratorRole = 'owner' | 'editor' | 'viewer';

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: Role;
          phone: string | null;
          avatar_url: string | null;
          preferred_locale: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role?: Role;
          phone?: string | null;
          avatar_url?: string | null;
          preferred_locale?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: Role;
          phone?: string | null;
          avatar_url?: string | null;
          preferred_locale?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          name: string;
          event_type: EventType;
          event_date: string;
          venue: string | null;
          venue_address: string | null;
          theme_name: string | null;
          theme_colors: string[] | null;
          theme_description: string | null;
          estimated_guests: number | null;
          notes: string | null;
          seating_layout: Json | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          event_type: EventType;
          event_date: string;
          venue?: string | null;
          venue_address?: string | null;
          theme_name?: string | null;
          theme_colors?: string[] | null;
          theme_description?: string | null;
          estimated_guests?: number | null;
          notes?: string | null;
          seating_layout?: Json | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          event_type?: EventType;
          event_date?: string;
          venue?: string | null;
          venue_address?: string | null;
          theme_name?: string | null;
          theme_colors?: string[] | null;
          theme_description?: string | null;
          estimated_guests?: number | null;
          notes?: string | null;
          seating_layout?: Json | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      guests: {
        Row: {
          id: string;
          full_name: string;
          side: Side;
          relation: string;
          phone: string | null;
          email: string | null;
          address: string | null;
          age_group: AgeGroup;
          dietary_restrictions: string[] | null;
          plus_one: boolean;
          party_size: number;
          invitation_status: InvitationStatus;
          rsvp_status: RsvpStatus;
          rsvp_date: string | null;
          qr_code: string | null;
          arrival_date: string | null;
          hotel_name: string | null;
          hotel_address: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          side: Side;
          relation: string;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          age_group?: AgeGroup;
          dietary_restrictions?: string[] | null;
          plus_one?: boolean;
          party_size?: number;
          invitation_status?: InvitationStatus;
          rsvp_status?: RsvpStatus;
          rsvp_date?: string | null;
          qr_code?: string | null;
          arrival_date?: string | null;
          hotel_name?: string | null;
          hotel_address?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          side?: Side;
          relation?: string;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          age_group?: AgeGroup;
          dietary_restrictions?: string[] | null;
          plus_one?: boolean;
          party_size?: number;
          invitation_status?: InvitationStatus;
          rsvp_status?: RsvpStatus;
          rsvp_date?: string | null;
          qr_code?: string | null;
          arrival_date?: string | null;
          hotel_name?: string | null;
          hotel_address?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      event_guests: {
        Row: {
          id: string;
          event_id: string;
          guest_id: string;
          invited: boolean;
          attended: boolean;
          checked_in_at: string | null;
          table_number: number | null;
        };
        Insert: {
          id?: string;
          event_id: string;
          guest_id: string;
          invited?: boolean;
          attended?: boolean;
          checked_in_at?: string | null;
          table_number?: number | null;
        };
        Update: {
          id?: string;
          event_id?: string;
          guest_id?: string;
          invited?: boolean;
          attended?: boolean;
          checked_in_at?: string | null;
          table_number?: number | null;
        };
        Relationships: [];
      };
      budget_categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          parent_category_id: string | null;
          icon: string | null;
          sort_order: number;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          parent_category_id?: string | null;
          icon?: string | null;
          sort_order?: number;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          parent_category_id?: string | null;
          icon?: string | null;
          sort_order?: number;
        };
        Relationships: [];
      };
      budget_items: {
        Row: {
          id: string;
          event_id: string;
          category_id: string | null;
          item_name: string;
          description: string | null;
          estimated_cost: number;
          actual_cost: number | null;
          paid_amount: number;
          payment_status: PaymentStatus;
          priority: Priority;
          vendor_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          category_id?: string | null;
          item_name: string;
          description?: string | null;
          estimated_cost?: number;
          actual_cost?: number | null;
          paid_amount?: number;
          payment_status?: PaymentStatus;
          priority?: Priority;
          vendor_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          category_id?: string | null;
          item_name?: string;
          description?: string | null;
          estimated_cost?: number;
          actual_cost?: number | null;
          paid_amount?: number;
          payment_status?: PaymentStatus;
          priority?: Priority;
          vendor_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      vendors: {
        Row: {
          id: string;
          name: string;
          category: string;
          contact_person: string | null;
          phone: string | null;
          email: string | null;
          address: string | null;
          website: string | null;
          rating: number | null;
          price_range: string | null;
          notes: string | null;
          contract_signed: boolean;
          contract_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category: string;
          contact_person?: string | null;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          website?: string | null;
          rating?: number | null;
          price_range?: string | null;
          notes?: string | null;
          contract_signed?: boolean;
          contract_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string;
          contact_person?: string | null;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          website?: string | null;
          rating?: number | null;
          price_range?: string | null;
          notes?: string | null;
          contract_signed?: boolean;
          contract_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          budget_item_id: string;
          amount: number;
          payment_date: string;
          payment_method: PaymentMethod | null;
          transaction_id: string | null;
          receipt_url: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          budget_item_id: string;
          amount: number;
          payment_date?: string;
          payment_method?: PaymentMethod | null;
          transaction_id?: string | null;
          receipt_url?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          budget_item_id?: string;
          amount?: number;
          payment_date?: string;
          payment_method?: PaymentMethod | null;
          transaction_id?: string | null;
          receipt_url?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          event_id: string;
          title: string;
          description: string | null;
          category: string | null;
          due_date: string | null;
          priority: Priority;
          status: TaskStatus;
          assigned_to: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          title: string;
          description?: string | null;
          category?: string | null;
          due_date?: string | null;
          priority?: Priority;
          status?: TaskStatus;
          assigned_to?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          title?: string;
          description?: string | null;
          category?: string | null;
          due_date?: string | null;
          priority?: Priority;
          status?: TaskStatus;
          assigned_to?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          id: string;
          event_id: string;
          file_name: string;
          file_url: string;
          storage_path: string | null;
          file_type: string | null;
          file_size: number | null;
          category: DocumentCategory;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          file_name: string;
          file_url: string;
          storage_path?: string | null;
          file_type?: string | null;
          file_size?: number | null;
          category?: DocumentCategory;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          file_name?: string;
          file_url?: string;
          storage_path?: string | null;
          file_type?: string | null;
          file_size?: number | null;
          category?: DocumentCategory;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      timeline_items: {
        Row: {
          id: string;
          event_id: string;
          title: string;
          description: string | null;
          start_time: string;
          end_time: string | null;
          location: string | null;
          assigned_to: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          title: string;
          description?: string | null;
          start_time: string;
          end_time?: string | null;
          location?: string | null;
          assigned_to?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          title?: string;
          description?: string | null;
          start_time?: string;
          end_time?: string | null;
          location?: string | null;
          assigned_to?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      vendor_reviews: {
        Row: {
          id: string;
          vendor_id: string;
          reviewer_id: string | null;
          rating: number;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          vendor_id: string;
          reviewer_id?: string | null;
          rating: number;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          vendor_id?: string;
          reviewer_id?: string | null;
          rating?: number;
          comment?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      gifts: {
        Row: {
          id: string;
          event_id: string;
          name: string;
          description: string | null;
          price: number | null;
          url: string | null;
          image_url: string | null;
          claimed_by: string | null;
          claimed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          name: string;
          description?: string | null;
          price?: number | null;
          url?: string | null;
          image_url?: string | null;
          claimed_by?: string | null;
          claimed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          name?: string;
          description?: string | null;
          price?: number | null;
          url?: string | null;
          image_url?: string | null;
          claimed_by?: string | null;
          claimed_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      event_collaborators: {
        Row: {
          id: string;
          event_id: string;
          user_id: string;
          role: CollaboratorRole;
          invited_at: string;
          accepted_at: string | null;
        };
        Insert: {
          id?: string;
          event_id: string;
          user_id: string;
          role?: CollaboratorRole;
          invited_at?: string;
          accepted_at?: string | null;
        };
        Update: {
          id?: string;
          event_id?: string;
          user_id?: string;
          role?: CollaboratorRole;
          invited_at?: string;
          accepted_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

export type UserProfile = Tables<'users'>;
export type Event = Tables<'events'>;
export type Guest = Tables<'guests'>;
export type EventGuest = Tables<'event_guests'>;
export type BudgetCategory = Tables<'budget_categories'>;
export type BudgetItem = Tables<'budget_items'>;
export type Vendor = Tables<'vendors'>;
export type Payment = Tables<'payments'>;
export type Task = Tables<'tasks'>;
export type DocumentRow = Tables<'documents'>;
export type TimelineItem = Tables<'timeline_items'>;
export type VendorReview = Tables<'vendor_reviews'>;
export type Gift = Tables<'gifts'>;
export type EventCollaborator = Tables<'event_collaborators'>;
