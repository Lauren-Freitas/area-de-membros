import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const MEMBER_SYSTEM_PROMPT = `Você é Proteíno, assistente de nutrição criado para ajudar os alunos de Thiago Cantalovo, nutricionista especializado em saúde funcional e emagrecimento saudável.

Seu papel:
- Responder dúvidas sobre alimentação saudável, nutrientes, dietas e hábitos alimentares
- Sugerir substituições de alimentos e ideias de refeições equilibradas
- Explicar conceitos de nutrição de forma clara e acessível
- Motivar e apoiar o aluno na sua jornada de saúde
- Basear suas respostas em ciência e boas práticas nutricionais

Limites importantes:
- Não faça diagnósticos médicos ou prescreva dietas específicas (isso é papel do Thiago em consulta)
- Quando a questão for muito individualizada ou clínica, indique agendar uma consulta com o Thiago
- Não contradiga orientações que o Thiago possa ter dado ao aluno
- Não assuma automaticamente que o usuário é paciente — pode ser um profissional de saúde

Seja sempre: simpático, motivador, prático e direto. Responda em português brasileiro.`

const IAN_SYSTEM_PROMPT = `Você é IAN (Inteligência de Apoio Nutricional), assistente exclusivo do painel administrativo da clínica de nutrição de Thiago Cantalovo.

Seu papel:
- Auxiliar o nutricionista Thiago na gestão da plataforma de membros
- Ajudar a redigir respostas para tickets de atendimento de alunos
- Apoiar na criação de descrições e conteúdos para cursos e materiais didáticos
- Responder dúvidas técnicas sobre nutrição que o Thiago queira consultar rapidamente
- Oferecer sugestões de melhoria para a plataforma e a experiência dos alunos

Você está conversando com o administrador do sistema — seja objetivo, técnico quando necessário, e use linguagem profissional.
Responda sempre em português brasileiro.`

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { conversationId, message, history, attachments, persona } = await req.json()
  const attachmentList: { type: string; data: string; mediaType: string }[] = attachments ?? []

  // Salvar mensagem do usuário (apenas quando há conversationId — painel inline não persiste)
  if (conversationId) {
    await supabase.from('ai_messages').insert({
      conversation_id: conversationId,
      role: 'user',
      content: message,
    })
  }

  // Montar sistema prompt com contexto do usuário
  let systemPrompt: string
  if (persona === 'admin') {
    systemPrompt = IAN_SYSTEM_PROMPT
  } else {
    systemPrompt = MEMBER_SYSTEM_PROMPT
    // Adicionar contexto dos produtos do usuário
    const [{ data: profileData }, { data: upData }] = await Promise.all([
      supabase.from('profiles').select('name, role, ai_tone').eq('id', user.id).single(),
      supabase.from('user_products').select('product_id').eq('user_id', user.id),
    ])
    const productIds = (upData ?? []).map(up => up.product_id)
    let productTitles: string[] = []
    if (productIds.length > 0) {
      const { data: productsData } = await supabase.from('products').select('title').in('id', productIds)
      productTitles = (productsData ?? []).map(p => p.title as string)
    }
    const isProfessional = profileData?.role === 'professional'
    const aiTone = (profileData as { ai_tone?: string | null } | null)?.ai_tone ?? 'empatico'
    const toneInstruction = aiTone === 'direto'
      ? 'Tom de voz: seja direto e objetivo. Respostas curtas e práticas, sem rodeios ou introduções longas.'
      : aiTone === 'tecnico'
      ? 'Tom de voz: seja técnico e detalhado. Explique mecanismos, fundamentos e, quando relevante, cite estudos ou referências científicas.'
      : 'Tom de voz: seja empático e motivador. Use linguagem acolhedora, celebre conquistas e encoraje o usuário.'
    systemPrompt += `\n\nContexto do usuário atual:
- Nome: ${profileData?.name ?? 'Usuário'}
- Perfil: ${isProfessional ? 'Profissional de saúde' : 'Paciente/aluno'}
- Conteúdos adquiridos: ${productTitles.length > 0 ? productTitles.join(', ') : 'nenhum ainda'}
${isProfessional ? 'Este usuário é um profissional de saúde — use linguagem técnica quando adequado.' : 'Este usuário é um aluno ou paciente — use linguagem acessível.'}
${toneInstruction}`
  }

  // Montar conteúdo da última mensagem (texto + anexos)
  type ContentPart = Anthropic.TextBlockParam | Anthropic.ImageBlockParam | Anthropic.DocumentBlockParam
  const lastContent: ContentPart[] = []

  for (const att of attachmentList) {
    if (att.type === 'image') {
      lastContent.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: att.mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
          data: att.data,
        },
      })
    } else if (att.type === 'document') {
      lastContent.push({
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: att.data },
      })
    }
  }

  const hasImages = attachmentList.some(a => a.type === 'image')
  const defaultPrompt = attachmentList.length > 0
    ? (hasImages ? 'O que você vê nessas imagens?' : 'Analise estes documentos.')
    : ''

  lastContent.push({ type: 'text', text: message || defaultPrompt })

  // Montar histórico para a API
  const messages: Anthropic.MessageParam[] = [
    ...(history ?? []).map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: lastContent },
  ]

  // Stream da resposta
  const stream = anthropic.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  })

  let fullText = ''
  const encoder = new TextEncoder()

  const readableStream = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          fullText += event.delta.text
          controller.enqueue(encoder.encode(event.delta.text))
        }
      }
      controller.close()

      // Salvar resposta completa (apenas quando há conversationId)
      if (conversationId) {
        await supabase.from('ai_messages').insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: fullText,
        })
      }
    },
  })

  return new Response(readableStream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
