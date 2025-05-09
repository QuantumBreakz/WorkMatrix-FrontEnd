export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      employees: {
        Row: {
          id: string
          user_id: string
          position: string | null
          department: string | null
          hire_date: string
          is_active: boolean
          location: string | null
          phone: string | null
          profile_image: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          position?: string | null
          department?: string | null
          hire_date?: string
          is_active?: boolean
          location?: string | null
          phone?: string | null
          profile_image?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          position?: string | null
          department?: string | null
          hire_date?: string
          is_active?: boolean
          location?: string | null
          phone?: string | null
          profile_image?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      keystrokes: {
        Row: {
          id: string
          user_id: string
          application_name: string | null
          window_title: string | null
          count: number
          timestamp: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          application_name?: string | null
          window_title?: string | null
          count: number
          timestamp: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          application_name?: string | null
          window_title?: string | null
          count?: number
          timestamp?: string
          created_at?: string
        }
      }
      screenshots: {
        Row: {
          id: string
          user_id: string
          filename: string
          file_path: string
          content_type: string
          file_size: number
          capture_time: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          filename: string
          file_path: string
          content_type: string
          file_size: number
          capture_time: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          filename?: string
          file_path?: string
          content_type?: string
          file_size?: number
          capture_time?: string
          notes?: string | null
          created_at?: string
        }
      }
      tickets: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string
          category: string | null
          priority: string
          status: string
          resolution: string | null
          created_at: string
          last_updated: string
          closed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description: string
          category?: string | null
          priority?: string
          status?: string
          resolution?: string | null
          created_at?: string
          last_updated?: string
          closed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string
          category?: string | null
          priority?: string
          status?: string
          resolution?: string | null
          created_at?: string
          last_updated?: string
          closed_at?: string | null
        }
      }
      time_logs: {
        Row: {
          id: string
          user_id: string
          start_time: string
          end_time: string | null
          duration_minutes: number | null
          activity_type: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          start_time: string
          end_time?: string | null
          duration_minutes?: number | null
          activity_type?: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          start_time?: string
          end_time?: string | null
          duration_minutes?: number | null
          activity_type?: string
          notes?: string | null
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          auth_id: string | null
          email: string
          full_name: string | null
          role: string
          is_active: boolean
          created_at: string
          last_login: string | null
        }
        Insert: {
          id?: string
          auth_id?: string | null
          email: string
          full_name?: string | null
          role?: string
          is_active?: boolean
          created_at?: string
          last_login?: string | null
        }
        Update: {
          id?: string
          auth_id?: string | null
          email?: string
          full_name?: string | null
          role?: string
          is_active?: boolean
          created_at?: string
          last_login?: string | null
        }
      }
      admin_requests: {
        Row: {
          id: string
          user_id: string
          status: string
          requested_at: string
          approved_by: string | null
          approved_at: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          user_id: string
          status?: string
          requested_at?: string
          approved_by?: string | null
          approved_at?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          status?: string
          requested_at?: string
          approved_by?: string | null
          approved_at?: string | null
          notes?: string | null
        }
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
  }
}
