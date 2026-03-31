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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      chevre_groups: {
        Row: {
          created_at: string
          created_by: string
          id: string
          invite_code: string
          name: string
          threshold_pct: number
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          invite_code?: string
          name: string
          threshold_pct?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          invite_code?: string
          name?: string
          threshold_pct?: number
        }
        Relationships: [
          {
            foreignKeyName: "chevre_groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      chevre_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          role: Database["public"]["Enums"]["chevre_role"]
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["chevre_role"]
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["chevre_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chevre_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "chevre_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chevre_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      chevre_scores: {
        Row: {
          date: string
          group_id: string
          hider_id: string
          hider_won: boolean | null
          id: string
          seeker_results: Json
          word_id: string
        }
        Insert: {
          date?: string
          group_id: string
          hider_id: string
          hider_won?: boolean | null
          id?: string
          seeker_results?: Json
          word_id: string
        }
        Update: {
          date?: string
          group_id?: string
          hider_id?: string
          hider_won?: boolean | null
          id?: string
          seeker_results?: Json
          word_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chevre_scores_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "chevre_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chevre_scores_hider_id_fkey"
            columns: ["hider_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chevre_scores_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "words"
            referencedColumns: ["id"]
          },
        ]
      }
      game_results: {
        Row: {
          created_at: string
          duration_seconds: number | null
          guess_history: Json
          guesses: number
          hard_mode: boolean | null
          id: string
          revealed_letters: Json
          solved: boolean
          user_id: string
          word_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          guess_history?: Json
          guesses: number
          hard_mode?: boolean | null
          id?: string
          revealed_letters?: Json
          solved?: boolean
          user_id: string
          word_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          guess_history?: Json
          guesses?: number
          hard_mode?: boolean | null
          id?: string
          revealed_letters?: Json
          solved?: boolean
          user_id?: string
          word_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_results_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "words"
            referencedColumns: ["id"]
          },
        ]
      }
      nemesis_rivalries: {
        Row: {
          challenger_id: string
          created_at: string
          id: string
          receiver_id: string
          status: Database["public"]["Enums"]["rivalry_status"]
        }
        Insert: {
          challenger_id: string
          created_at?: string
          id?: string
          receiver_id: string
          status?: Database["public"]["Enums"]["rivalry_status"]
        }
        Update: {
          challenger_id?: string
          created_at?: string
          id?: string
          receiver_id?: string
          status?: Database["public"]["Enums"]["rivalry_status"]
        }
        Relationships: [
          {
            foreignKeyName: "nemesis_rivalries_challenger_id_fkey"
            columns: ["challenger_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nemesis_rivalries_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      nemesis_scores: {
        Row: {
          challenger_result_id: string | null
          date: string
          id: string
          receiver_result_id: string | null
          rivalry_id: string
          tiebreaker_applied: boolean
          winner_id: string | null
          word_id: string
        }
        Insert: {
          challenger_result_id?: string | null
          date?: string
          id?: string
          receiver_result_id?: string | null
          rivalry_id: string
          tiebreaker_applied?: boolean
          winner_id?: string | null
          word_id: string
        }
        Update: {
          challenger_result_id?: string | null
          date?: string
          id?: string
          receiver_result_id?: string | null
          rivalry_id?: string
          tiebreaker_applied?: boolean
          winner_id?: string | null
          word_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nemesis_scores_challenger_result_id_fkey"
            columns: ["challenger_result_id"]
            isOneToOne: false
            referencedRelation: "game_results"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nemesis_scores_receiver_result_id_fkey"
            columns: ["receiver_result_id"]
            isOneToOne: false
            referencedRelation: "game_results"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nemesis_scores_rivalry_id_fkey"
            columns: ["rivalry_id"]
            isOneToOne: false
            referencedRelation: "nemesis_rivalries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nemesis_scores_rivalry_id_fkey"
            columns: ["rivalry_id"]
            isOneToOne: false
            referencedRelation: "nemesis_summary"
            referencedColumns: ["rivalry_id"]
          },
          {
            foreignKeyName: "nemesis_scores_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nemesis_scores_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "words"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_config: Json | null
          avatar_url: string | null
          best_streak: number
          created_at: string
          current_streak: number
          email: string
          id: string
          last_solved_date: string | null
          username: string
          username_changed_at: string | null
        }
        Insert: {
          avatar_config?: Json | null
          avatar_url?: string | null
          best_streak?: number
          created_at?: string
          current_streak?: number
          email: string
          id: string
          last_solved_date?: string | null
          username: string
          username_changed_at?: string | null
        }
        Update: {
          avatar_config?: Json | null
          avatar_url?: string | null
          best_streak?: number
          created_at?: string
          current_streak?: number
          email?: string
          id?: string
          last_solved_date?: string | null
          username?: string
          username_changed_at?: string | null
        }
        Relationships: []
      }
      words: {
        Row: {
          created_at: string
          created_by: string | null
          date: string | null
          for_group: string | null
          for_user: string | null
          id: string
          language: string
          source: Database["public"]["Enums"]["word_source"]
          word: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date?: string | null
          for_group?: string | null
          for_user?: string | null
          id?: string
          language?: string
          source?: Database["public"]["Enums"]["word_source"]
          word: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date?: string | null
          for_group?: string | null
          for_user?: string | null
          id?: string
          language?: string
          source?: Database["public"]["Enums"]["word_source"]
          word?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_words_for_group"
            columns: ["for_group"]
            isOneToOne: false
            referencedRelation: "chevre_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "words_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "words_for_user_fkey"
            columns: ["for_user"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      leaderboard_alltime: {
        Row: {
          avatar_url: string | null
          avatar_config: Json | null
          avg_guesses: number | null
          best_streak: number | null
          current_streak: number | null
          gibor_badge: boolean | null
          rank: number | null
          total_wins: number | null
          user_id: string | null
          username: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_global: {
        Row: {
          avatar_url: string | null
          avatar_config: Json | null
          date: string | null
          gibor_badge: boolean | null
          guesses: number | null
          rank: number | null
          solved: boolean | null
          user_id: string | null
          username: string | null
          word_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_results_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "words"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_weekly: {
        Row: {
          avatar_url: string | null
          avatar_config: Json | null
          avg_guesses: number | null
          games_played: number | null
          gibor_badge: boolean | null
          perfect_games: number | null
          rank: number | null
          user_id: string | null
          username: string | null
          win_rate: number | null
          wins: number | null
        }
        Relationships: [
          {
            foreignKeyName: "game_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_monthly: {
        Row: {
          avatar_url: string | null
          avatar_config: Json | null
          avg_guesses: number | null
          games_played: number | null
          gibor_badge: boolean | null
          perfect_games: number | null
          rank: number | null
          user_id: string | null
          username: string | null
          win_rate: number | null
          wins: number | null
        }
        Relationships: [
          {
            foreignKeyName: "game_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      nemesis_summary: {
        Row: {
          challenger_id: string | null
          challenger_username: string | null
          challenger_wins: number | null
          draws: number | null
          receiver_id: string | null
          receiver_username: string | null
          receiver_wins: number | null
          rivalry_id: string | null
          rounds_played: number | null
          status: Database["public"]["Enums"]["rivalry_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "nemesis_rivalries_challenger_id_fkey"
            columns: ["challenger_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nemesis_rivalries_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      chevre_role: "admin" | "member"
      rivalry_status: "pending" | "active" | "declined" | "completed"
      word_source: "daily_global" | "nemesis" | "chevre" | "custom"
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
      chevre_role: ["admin", "member"],
      rivalry_status: ["pending", "active", "declined", "completed"],
      word_source: ["daily_global", "nemesis", "chevre", "custom"],
    },
  },
} as const
