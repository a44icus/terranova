-- Incrément atomique des vues d'un bien
-- Utilise UPDATE avec vues = vues + 1 côté SQL
-- Évite les race conditions du pattern JS : read(vues) → write(vues + 1)

create or replace function public.increment_bien_vues(p_bien_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.biens
  set vues = coalesce(vues, 0) + 1
  where id = p_bien_id;
end;
$$;
