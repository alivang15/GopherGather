import { createClient } from '@supabase/supabase-js'

// ! means this variable will exist so don't worry about it being 'null' or 'undefined'
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
