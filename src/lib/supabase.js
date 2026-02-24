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
    const sanitizedUrl = supabaseUrl.trim().replace(/\/$/, '')
    const sanitizedKey = supabaseAnonKey.trim()

    // Masked logging for user verification in console
    const maskedUrl = sanitizedUrl.replace(/^(https?:\/\/).{1}(.*).{1}(\.[a-z]{2,})$/, '$1$2...$3');
    console.log('INITIATING SECURE CHANNEL TO:', sanitizedUrl.substring(0, 10) + '...' + sanitizedUrl.slice(-5));

    // Direct connectivity test to see if the domain is reachable
    fetch(`${sanitizedUrl}/rest/v1/?apikey=${sanitizedKey}`, { method: 'GET' })
      .then(r => console.log('SUPABASE API STATUS:', r.status))
      .catch(e => console.error('SUPABASE API ERROR:', e.message));


    supabaseClient = createClient(sanitizedUrl, sanitizedKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'helloall-auth-v1'
      }
    })



  } catch (err) {
    console.error('Failed to initialize Supabase client:', err)
  }
}




export const supabase = supabaseClient

