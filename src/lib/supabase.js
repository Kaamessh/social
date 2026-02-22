import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let supabaseClient;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'your_supabase_url') {
  console.error('Supabase URL or Anon Key is missing or invalid in .env file')
} else {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err)
  }
}

export const supabase = supabaseClient

