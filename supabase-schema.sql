-- ═══════════════════════════════════════════════════════════
--  BROTINHO — Schema do Banco de Dados (Supabase)
--  Cole este SQL no Editor SQL do Supabase e execute
-- ═══════════════════════════════════════════════════════════

-- ── PERFIS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  mode          TEXT NOT NULL DEFAULT 'gestacao'
                  CHECK (mode IN ('gestacao','post','tentando','pai')),
  baby_name     TEXT,
  baby_gender   TEXT CHECK (baby_gender IN ('menino','menina','surpresa')),
  dpp           DATE,          -- data prevista do parto
  baby_birth    DATE,          -- data de nascimento do bebê
  partner_name  TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── DIÁRIO ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.diary_entries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mood        TEXT NOT NULL DEFAULT '😊',
  text        TEXT NOT NULL,
  week        INTEGER,         -- semana gestacional ou de vida do bebê
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── REGISTROS DE SAÚDE ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.health_records (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type          TEXT NOT NULL CHECK (type IN ('peso','pressao','barriga')),
  value         NUMERIC,       -- peso em kg ou barriga em cm
  sys           INTEGER,       -- pressão sistólica
  dia           INTEGER,       -- pressão diastólica
  week          INTEGER,
  recorded_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── EXAMES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.exam_records (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  done        BOOLEAN DEFAULT FALSE,
  done_at     TIMESTAMPTZ
);

-- ── VACINAS DO BEBÊ ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vaccine_records (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  done        BOOLEAN DEFAULT FALSE,
  done_at     TIMESTAMPTZ
);

-- ── SEGURANÇA (Row Level Security) ───────────────────────
-- Cada usuário só vê e edita seus próprios dados

ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_records  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaccine_records ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "profiles_own" ON public.profiles
  FOR ALL USING (auth.uid() = id);

-- Políticas para diary_entries
CREATE POLICY "diary_own" ON public.diary_entries
  FOR ALL USING (auth.uid() = user_id);

-- Políticas para health_records
CREATE POLICY "health_own" ON public.health_records
  FOR ALL USING (auth.uid() = user_id);

-- Políticas para exam_records
CREATE POLICY "exams_own" ON public.exam_records
  FOR ALL USING (auth.uid() = user_id);

-- Políticas para vaccine_records
CREATE POLICY "vaccines_own" ON public.vaccine_records
  FOR ALL USING (auth.uid() = user_id);

-- ── TRIGGER: atualiza updated_at automaticamente ──────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── TRIGGER: cria perfil ao registrar ────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
