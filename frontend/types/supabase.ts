// Auto-generated types for Supabase — regenerate with:
// npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/supabase.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          tier: "free" | "pro";
          messages_used_this_month: number;
          usage_period_start: string;
          stripe_customer_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          tier?: "free" | "pro";
          messages_used_this_month?: number;
          usage_period_start?: string;
          stripe_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          tier?: "free" | "pro";
          messages_used_this_month?: number;
          usage_period_start?: string;
          stripe_customer_id?: string | null;
          updated_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: "user" | "assistant" | "system";
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          role: "user" | "assistant" | "system";
          content: string;
          created_at?: string;
        };
        Update: never;
      };
      usage_logs: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          tokens_used: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action: string;
          tokens_used?: number | null;
          created_at?: string;
        };
        Update: never;
      };
    };
    Views: Record<string, never>;
    Functions: {
      increment_message_usage: {
        Args: { p_user_id: string };
        Returns: {
          messages_used: number;
          messages_limit: number;
          tier: string;
          quota_exceeded: boolean;
        };
      };
    };
    Enums: {
      tier_type: "free" | "pro";
    };
  };
}
