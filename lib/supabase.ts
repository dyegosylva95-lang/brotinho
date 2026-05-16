import { createBrowserClient } from '@supabase/ssr'

// Cliente para uso no browser (componentes client-side)
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// ── TIPOS DO BANCO ─────────────────────────────────────────
export type Profile = {
  id: string
  name: string
  email: string
  mode: 'gestacao' | 'post' | 'tentando' | 'pai'
  baby_name: string | null
  baby_gender: 'menino' | 'menina' | 'surpresa' | null
  dpp: string | null          // data prevista do parto (YYYY-MM-DD)
  baby_birth: string | null   // data nascimento (YYYY-MM-DD)
  partner_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export type DiaryEntry = {
  id: string
  user_id: string
  mood: string
  text: string
  week: number | null
  created_at: string
}

export type HealthRecord = {
  id: string
  user_id: string
  type: 'peso' | 'pressao' | 'barriga'
  value: number
  sys?: number   // pressão sistólica
  dia?: number   // pressão diastólica
  week: number | null
  recorded_at: string
}

export type ExamRecord = {
  id: string
  user_id: string
  name: string
  done: boolean
  done_at: string | null
}
