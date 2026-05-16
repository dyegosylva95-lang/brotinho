// ── CÁLCULO DE SEMANAS ────────────────────────────────────

/** Calcula semana gestacional a partir da DPP */
export function calcGestWeek(dpp: string | null): number | null {
  if (!dpp) return null
  const dppDate = new Date(dpp)
  const conception = new Date(dppDate)
  conception.setDate(conception.getDate() - 280)
  const weeks = Math.round((Date.now() - conception.getTime()) / (1000 * 60 * 60 * 24 * 7))
  return Math.max(1, Math.min(40, weeks))
}

/** Calcula semanas de vida do bebê a partir da data de nascimento */
export function calcBabyWeeks(babyBirth: string | null): number | null {
  if (!babyBirth) return null
  const birth = new Date(babyBirth)
  const weeks = Math.floor((Date.now() - birth.getTime()) / (1000 * 60 * 60 * 24 * 7))
  return Math.max(0, weeks)
}

/** Formata a idade do bebê de forma amigável */
export function formatBabyAge(weeks: number | null): string {
  if (weeks === null) return ''
  if (weeks < 4) return `${weeks} semana${weeks !== 1 ? 's' : ''}`
  if (weeks < 52) {
    const months = Math.floor(weeks / 4)
    return `${weeks} sem. (${months} ${months === 1 ? 'mês' : 'meses'})`
  }
  const years = Math.floor(weeks / 52)
  return `${years} ano${years !== 1 ? 's' : ''}`
}

/** Calcula trimestre da gestação */
export function getTrimester(week: number): 1 | 2 | 3 {
  if (week <= 12) return 1
  if (week <= 27) return 2
  return 3
}

/** Formata data para exibição em português */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

/** Verifica se email é válido */
export function isValidEmail(email: string): boolean {
  return /\S+@\S+\.\S+/.test(email)
}

/** Força da senha: 0-4 */
export function passwordStrength(pass: string): { score: number; label: string; color: string } {
  if (pass.length === 0) return { score: 0, label: '', color: '#ebebf0' }
  if (pass.length < 6)   return { score: 1, label: 'Fraca 😬',    color: '#ff8a65' }
  if (pass.length < 10)  return { score: 2, label: 'Razoável 😐', color: '#ffd54f' }
  if (/[A-Z]/.test(pass) && /[0-9]/.test(pass))
                          return { score: 4, label: 'Forte! 💪',   color: '#2a9d72' }
  return                         { score: 3, label: 'Boa 👍',      color: '#4ecba1' }
}
