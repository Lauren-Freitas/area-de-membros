-- lesson_comments/product_comments têm RLS habilitada (confirmado: INSERT sem
-- policy correspondente já retorna 403 "violates row-level security policy"),
-- mas nenhuma policy de DELETE existe pra nenhuma das duas. Sem policy, o
-- Postgres nega por padrão — mas silenciosamente (a query roda, afeta 0
-- linhas, sem erro nenhum), então o delete "funciona" do ponto de vista do
-- client (sem exceção) e a UI otimista remove o comentário, mas a linha
-- nunca sai do banco: reaparece no próximo reload.
create policy "lesson_comments: membro exclui o próprio comentário"
  on public.lesson_comments
  for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "product_comments: membro exclui o próprio comentário"
  on public.product_comments
  for delete
  to authenticated
  using (auth.uid() = user_id);
