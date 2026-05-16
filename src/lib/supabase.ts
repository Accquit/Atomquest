import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder'

// Typed client - used where DB types are fully defined
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Untyped client - used for tables not yet in the generated types (avoids 'never' inference)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = createClient<any>(supabaseUrl, supabaseAnonKey)
