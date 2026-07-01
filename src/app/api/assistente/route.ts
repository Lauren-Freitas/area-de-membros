import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `Você é um assistente de nutrição criado para ajudar os alunos de Thiago Cantalovo, nutricionista especializado em saúde funcional e emagrecimento saudável.

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

Seja sempre: simpático, motivador, prático e direto. Responda em português brasileiro.`

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { conversationId, message, history, attachment } = await req.json()

  // Salvar mensagem do usuário (apenas quando há conversationId — painel inline não persiste)
  if (conversationId) {
    await supabase.from('ai_messages').insert({
      conversation_id: conversationId,
      role: 'user',
      content: message,
    })
  }

  // Montar conteúdo da última mensagem (texto + possível imagem/PDF)
  type ContentPart = Anthropic.TextBlockParam | Anthropic.ImageBlockParam | Anthropic.DocumentBlockParam
  const lastContent: ContentPart[] = []

  if (attachment?.type === 'image') {
    lastContent.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: attachment.mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
        data: attachment.data,
      },
    })
  } else if (attachment?.type === 'document') {
    lastContent.push({
      type: 'document',
      source: { type: 'base64', media_type: 'application/pdf', data: attachment.data },
    })
  }

  lastContent.push({
    type: 'text',
    text: message || (attachment?.type === 'image' ? 'O que você vê nessa imagem?' : 'Analise este documento.'),
  })

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
    system: SYSTEM_PROMPT,
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
