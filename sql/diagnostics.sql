-- ==========================================================================
-- Les Employeurs · base des diagnostics (Neon, Postgres)
-- À exécuter une fois sur la base du projet Neon « les-employeurs »,
-- après avoir activé Neon Auth et la Data API (voir README, section Diagnostics).
-- ==========================================================================

-- 1. Table : un diagnostic = une pièce, des réponses, des scores, une date
create table if not exists public.diagnostics (
  id            uuid primary key default gen_random_uuid(),
  user_id       text not null default (auth.user_id()),
  piece         text not null check (piece in ('strategie','rh','finance','commerce','digital','achats','qvct','sante','board')),
  version       smallint not null default 1,
  answers       jsonb not null,
  scores        jsonb not null,
  score_global  smallint not null check (score_global between 0 and 100),
  created_at    timestamptz not null default now()
);

create index if not exists diagnostics_user_piece_idx
  on public.diagnostics (user_id, piece, created_at desc);

-- 2. Sécurité : chaque utilisateur ne voit, n'ajoute et ne supprime que ses diagnostics.
--    Pas de modification : un diagnostic enregistré est une photo à une date.
alter table public.diagnostics enable row level security;

drop policy if exists diagnostics_select_own on public.diagnostics;
create policy diagnostics_select_own on public.diagnostics
  for select to authenticated using (user_id = auth.user_id());

drop policy if exists diagnostics_insert_own on public.diagnostics;
create policy diagnostics_insert_own on public.diagnostics
  for insert to authenticated with check (user_id = auth.user_id());

drop policy if exists diagnostics_delete_own on public.diagnostics;
create policy diagnostics_delete_own on public.diagnostics
  for delete to authenticated using (user_id = auth.user_id());

revoke all on public.diagnostics from anonymous, authenticated;
grant select, insert, delete on public.diagnostics to authenticated;

-- 3. Purge RGPD : comptes sans connexion depuis 3 ans, avec leurs diagnostics.
--    À lancer une fois par mois (SQL Editor de Neon, ou tâche planifiée) :
--      select public.purge_comptes_inactifs();
create or replace function public.purge_comptes_inactifs()
returns integer
language plpgsql
security definer
set search_path = public, neon_auth
as $$
declare
  n integer;
begin
  with inactifs as (
    select u.id::text as id
    from neon_auth."user" u
    where coalesce(
      (select max(s."updatedAt") from neon_auth.session s where s."userId" = u.id),
      u."createdAt"
    ) < now() - interval '3 years'
  ), d as (
    delete from public.diagnostics where user_id in (select id from inactifs)
  )
  delete from neon_auth."user" where id::text in (select id from inactifs);
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.purge_comptes_inactifs() from public, anonymous, authenticated;
