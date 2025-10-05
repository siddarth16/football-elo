import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Client-side Supabase client (for auth and public data)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side Supabase client (for admin operations)
export function createServerClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_KEY
  if (!serviceKey) {
    throw new Error('Missing SUPABASE_SERVICE_KEY environment variable')
  }
  return createClient(supabaseUrl, serviceKey)
}
