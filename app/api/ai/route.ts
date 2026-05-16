import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(req: NextRequest) {
  try {
    // 1. Verifica se o usuário está autenticado
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get: (name) => cookieStore.get(name)?.value } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // 2. Lê o corpo da requisição
    const { messages, mode, week, babyWeeks } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Mensagens inválidas' }, { status: 400 })
    }

    // 3. Limita histórico para economizar tokens (últimas 10 mensagens)
    const recentMessages = messages.slice(-10)

    // 4. Monta o system prompt baseado no modo do usuário
    const isPost = mode === 'post'
    const contextInfo = isPost
      ? `bebê de ${babyWeeks ?? '?'} semanas de vida`
      : `semana ${week ?? '?'} de gestação`

    const systemPrompt = `Você é a IA especialista em ${isPost ? 'pediatria e desenvolvimento infantil' : 'obstetrícia e gestação'} do app Brotinho, para pais brasileiros.

Responda SEMPRE em português do Brasil, com tom caloroso, empático e científico.
Baseie-se nas diretrizes da ${isPost ? 'SBP (Sociedade Brasileira de Pediatria)' : 'Febrasgo + SBP'}.

Contexto atual do usuário: ${contextInfo}.

REGRAS IMPORTANTES:
- Nunca indique medicamentos com doses específicas
- Para emergências (febre alta em bebê < 3 meses, sangramento, convulsão, dificuldade respiratória): oriente ir ao pronto-socorro IMEDIATAMENTE
- Seja específico e útil — evite respostas genéricas
- Parágrafos curtos para leitura fácil no celular
- Use emojis com moderação (1-2 por resposta no máximo)
- Se não souber algo, admita e indique buscar um especialista
- Nunca substitua uma consulta médica presencial`

    // 5. Chama a API da Anthropic
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: recentMessages,
    })

    const text = response.content[0]?.type === 'text'
      ? response.content[0].text
      : 'Não consegui processar sua pergunta. Tente novamente.'

    return NextResponse.json({ text })

  } catch (error) {
    console.error('Erro na API de IA:', error)
    return NextResponse.json(
      { error: 'Erro interno. Tente novamente em instantes.' },
      { status: 500 }
    )
  }
}
