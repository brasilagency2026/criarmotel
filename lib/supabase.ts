
import { createBrowserClient } from '@supabase/ssr'
import { createServerClient } from '@supabase/ssr'

const isServer = typeof window === 'undefined'
const supabaseUrl = (isServer ? process.env.SUPABASE_URL : process.env.NEXT_PUBLIC_SUPABASE_URL) ?? ''
const supabaseAnonKey = (isServer ? process.env.SUPABASE_ANON_KEY : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ?? ''

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Key must be defined!')
}

// Client côté navigateur
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Client côté serveur (Server Components / API routes)
export async function createServerSupabaseClient() {
  // Import dynamique pour éviter l'erreur côté client
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll(cookiesToSet: any) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {}
      },
    },
  })
}

// Helper: gera slug único a partir do nome
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}
