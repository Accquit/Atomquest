export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          role: 'employee' | 'manager' | 'admin'
          department: string | null
          manager_id: string | null
          created_at: string
        }
        Insert: {
          id: string
          full_name: string
          role: 'employee' | 'manager' | 'admin'
          department?: string | null
          manager_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          role?: 'employee' | 'manager' | 'admin'
          department?: string | null
          manager_id?: string | null
          created_at?: string
        }
      }
      goal_cycles: {
        Row: {
          id: string
          name: string
          phase1_open: boolean
          q1_open: boolean
          q2_open: boolean
          q3_open: boolean
          q4_open: boolean
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          phase1_open?: boolean
          q1_open?: boolean
          q2_open?: boolean
          q3_open?: boolean
          q4_open?: boolean
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          phase1_open?: boolean
          q1_open?: boolean
          q2_open?: boolean
          q3_open?: boolean
          q4_open?: boolean
          is_active?: boolean
          created_at?: string
        }
      }
      goals: {
        Row: {
          id: string
          employee_id: string
          cycle_id: string
          thrust_area: string
          title: string
          description: string | null
          uom_type: 'numeric_min' | 'numeric_max' | 'timeline' | 'zero'
          target_value: number | null
          target_date: string | null
          weightage: number
          status: 'draft' | 'submitted' | 'approved' | 'rework' | 'locked'
          is_shared: boolean
          shared_from_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          cycle_id: string
          thrust_area: string
          title: string
          description?: string | null
          uom_type: 'numeric_min' | 'numeric_max' | 'timeline' | 'zero'
          target_value?: number | null
          target_date?: string | null
          weightage: number
          status?: 'draft' | 'submitted' | 'approved' | 'rework' | 'locked'
          is_shared?: boolean
          shared_from_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          cycle_id?: string
          thrust_area?: string
          title?: string
          description?: string | null
          uom_type?: 'numeric_min' | 'numeric_max' | 'timeline' | 'zero'
          target_value?: number | null
          target_date?: string | null
          weightage?: number
          status?: 'draft' | 'submitted' | 'approved' | 'rework' | 'locked'
          is_shared?: boolean
          shared_from_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      goal_achievements: {
        Row: {
          id: string
          goal_id: string
          quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Annual'
          actual_value: number | null
          actual_date: string | null
          progress_status: 'not_started' | 'on_track' | 'completed'
          computed_score: number | null
          logged_at: string
        }
        Insert: {
          id?: string
          goal_id: string
          quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Annual'
          actual_value?: number | null
          actual_date?: string | null
          progress_status: 'not_started' | 'on_track' | 'completed'
          computed_score?: number | null
          logged_at?: string
        }
        Update: {
          id?: string
          goal_id?: string
          quarter?: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Annual'
          actual_value?: number | null
          actual_date?: string | null
          progress_status?: 'not_started' | 'on_track' | 'completed'
          computed_score?: number | null
          logged_at?: string
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
