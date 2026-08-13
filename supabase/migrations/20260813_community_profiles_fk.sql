-- community_posts.user_id e community_replies.user_id nunca tiveram FK para
-- public.profiles(id) (herdado da reconstrução do schema inicial). Sem essa FK,
-- o PostgREST não consegue resolver o embed `profiles(name)` usado em
-- /comunidade e /comunidade/[postId] — a query inteira falha (400) e o erro é
-- descartado silenciosamente pelas páginas, que caem no estado "sem posts".
-- Resultado: a Comunidade parece vazia para todo mundo, mesmo com posts reais.
alter table public.community_posts
  add constraint community_posts_user_id_profiles_fkey
  foreign key (user_id) references public.profiles(id);

alter table public.community_replies
  add constraint community_replies_user_id_profiles_fkey
  foreign key (user_id) references public.profiles(id);
