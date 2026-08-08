-- Revisão de UX/IA: hoje um chamado de suporte é só a mensagem do membro +
-- status — não existe campo de resposta, então o membro nunca vê o que a
-- equipe respondeu dentro da plataforma. Resposta simples (não thread) —
-- suficiente pro fluxo de "abrir chamado → equipe responde → membro vê".
alter table public.support_tickets
  add column if not exists admin_response text,
  add column if not exists responded_at timestamptz;
