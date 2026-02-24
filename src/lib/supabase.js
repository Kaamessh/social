import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let supabaseClient;

const isPlaceHolder = (val) => {
  if (!val) return true;
  const v = val.toLowerCase();
  return v.includes('your_') || v.includes('placeholder') || v.includes('url') || v.includes('key');
};

if (!supabaseUrl || !supabaseAnonKey || isPlaceHolder(supabaseUrl) || !supabaseUrl.startsWith('http')) {
  console.error('CRITICAL: Supabase configuration is missing or malformed.');
  if (supabaseUrl && !supabaseUrl.startsWith('http')) {
    console.error('ERROR: Supabase URL must start with http:// or https://');
  }
} else {
  try {
    supabaseClient = createClient(supabaseUrl.trim(), supabaseAnonKey.trim())
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err)
  }
}


export const supabase = supabaseClient

