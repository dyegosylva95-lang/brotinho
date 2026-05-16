import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const cookieStore = cookies()
  const { action, email, password, name } = await req.json()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get:    (name) => cookieStore.get(name)?.value,
        set:    (name, value, options) => cookieStore.set({ name, value, ...options }),
        remove: (name, options) => cookieStore.set({ name, value: '', ...options }),
      },
    }
  )

  // ── LOGIN ──────────────────────────────────────────────
  if (action === 'login') {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ user: data.user })
  }

  // ── CADASTRO ───────────────────────────────────────────
  if (action === 'register') {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    // Cria o perfil na tabela profiles
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        name,
        email,
        mode: 'gestacao',
      })
    }

    return NextResponse.json({ user: data.user })
  }

  // ── LOGOUT ─────────────────────────────────────────────
  if (action === 'logout') {
    await supabase.auth.signOut()
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
}
