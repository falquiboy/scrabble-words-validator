-- Security Advisor remediation for the shared Juez Lexico project.
-- Keep public game/catalog reads working while removing unintended privilege paths.

begin;

-- The underlying dictionary table already has an explicit public SELECT policy.
-- Make the limiting view honor the caller's grants and RLS instead of its owner.
alter view public.dictionary_senses_limited
  set (security_invoker = true);

revoke all privileges on table public.dictionary_senses_limited
  from anon, authenticated;
grant select on table public.dictionary_senses_limited
  to anon, authenticated;

-- Internal snapshots and optimization backups are never client-facing.
alter table public.pre_optimization_stats enable row level security;
alter table public.pre_optimization_indexes enable row level security;
alter table public.leaves_backup_20250105 enable row level security;

revoke all privileges on table
  public.pre_optimization_stats,
  public.pre_optimization_indexes,
  public.leaves_backup_20250105
from anon, authenticated;

-- Tournament board state is intentionally readable and insertable by the
-- anonymous tournament client. Limit it to structurally valid tournament rows
-- and remove destructive client privileges that have never been used.
alter table public.board_states enable row level security;

drop policy if exists "Public can read valid board states"
  on public.board_states;
drop policy if exists "Public can create valid board states"
  on public.board_states;

create policy "Public can read valid board states"
on public.board_states
for select
to anon, authenticated
using (tournament_id is not null and round_number >= 1);

create policy "Public can create valid board states"
on public.board_states
for insert
to anon, authenticated
with check (
  tournament_id is not null
  and round_number >= 1
  and board_data is not null
);

revoke all privileges on table public.board_states
  from anon, authenticated;
grant select, insert on table public.board_states
  to anon, authenticated;

-- Master plays are public scoreboard data, but writes are administrative.
alter table public.master_plays enable row level security;

drop policy if exists "Public can read valid master plays"
  on public.master_plays;

create policy "Public can read valid master plays"
on public.master_plays
for select
to anon, authenticated
using (tournament_id is not null and round_number >= 1);

revoke all privileges on table public.master_plays
  from anon, authenticated;
grant select on table public.master_plays
  to anon, authenticated;

-- Preserve the anonymous tournament workflow while rejecting malformed rows.
drop policy if exists "Allow public insert on players"
  on public.players;
create policy "Allow public insert on players"
on public.players
for insert
to anon, authenticated
with check (
  tournament_id is not null
  and btrim(name) <> ''
  and char_length(name) <= 255
);

drop policy if exists "Allow public insert on player_plays"
  on public.player_plays;
create policy "Allow public insert on player_plays"
on public.player_plays
for insert
to anon, authenticated
with check (
  tournament_id is not null
  and player_id is not null
  and round_number >= 1
);

drop policy if exists "Allow public update on player_plays"
  on public.player_plays;
create policy "Allow public update on player_plays"
on public.player_plays
for update
to anon, authenticated
using (
  tournament_id is not null
  and player_id is not null
  and round_number >= 1
)
with check (
  tournament_id is not null
  and player_id is not null
  and round_number >= 1
);

-- Query history is write-only telemetry for clients. Do not expose everybody's
-- natural-language searches through PostgREST.
drop policy if exists "Enable insert for all users"
  on public.query_history;
drop policy if exists "Enable read access for all users"
  on public.query_history;

create policy "Clients can insert bounded query history"
on public.query_history
for insert
to anon, authenticated
with check (
  char_length(btrim(natural_query)) between 1 and 2048
  and char_length(btrim(sql_query)) between 1 and 20000
);

-- This RPC remains source-compatible with the frontend, but now executes with
-- the caller's RLS and rejects attempts to update another user's progress.
create or replace function public.update_practice_progress(
  p_user_id uuid,
  p_last_practice_group integer,
  p_last_practice_index integer
)
returns void
language plpgsql
security invoker
set search_path = pg_catalog, public, extensions, pg_temp
as $function$
begin
  if auth.uid() is null or auth.uid() is distinct from p_user_id then
    raise exception 'Not authorized to update this progress row'
      using errcode = '42501';
  end if;

  update public.user_progress
  set
    last_practice_group = p_last_practice_group,
    last_practice_index = p_last_practice_index,
    updated_at = pg_catalog.now()
  where user_id = p_user_id;
end;
$function$;

revoke all privileges on function public.update_practice_progress(uuid, integer, integer)
  from public, anon, authenticated, service_role;
grant execute on function public.update_practice_progress(uuid, integer, integer)
  to authenticated, service_role;

-- Fix every project-owned function to use a deterministic path made only of
-- schemas where untrusted API roles cannot CREATE objects. Existing per-function
-- settings such as statement_timeout are preserved.
do $do$
declare
  target_function regprocedure;
begin
  for target_function in
    select p.oid::regprocedure
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prokind = 'f'
      and pg_get_userbyid(p.proowner) = 'postgres'
  loop
    execute format(
      'alter function %s set search_path = pg_catalog, public, extensions, pg_temp',
      target_function
    );
  end loop;
end
$do$;

-- Trigger functions are invoked by their triggers, never as public RPCs.
do $do$
declare
  target_function regprocedure;
begin
  for target_function in
    select distinct p.oid::regprocedure
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    join pg_trigger t on t.tgfoid = p.oid
    where n.nspname = 'public'
      and not t.tgisinternal
  loop
    execute format(
      'revoke all privileges on function %s from public, anon, authenticated, service_role',
      target_function
    );
  end loop;
end
$do$;

-- These legacy SECURITY DEFINER search RPCs depend on tables removed during the
-- dictionary migration. One also executes caller-supplied SQL. Keep the objects
-- for rollback/history, but remove every externally callable path.
do $do$
declare
  target_function regprocedure;
begin
  for target_function in
    select p.oid::regprocedure
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'execute_natural_search',
        'find_exact_anagrams',
        'find_plus_one_letter',
        'find_shorter_words',
        'find_word_variations',
        'search_definitions_safe',
        'search_scrabble_words_safe'
      )
  loop
    execute format(
      'revoke all privileges on function %s from public, anon, authenticated, service_role',
      target_function
    );
  end loop;
end
$do$;

-- Maintenance RPCs are service-only. End-user clients never call them.
do $do$
declare
  target_function regprocedure;
begin
  for target_function in
    select p.oid::regprocedure
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and (
        p.proname = 'populate_scrabble_words'
        or p.proname like 'rebuild_scrabble_%'
      )
  loop
    execute format(
      'revoke all privileges on function %s from public, anon, authenticated',
      target_function
    );
    execute format(
      'grant execute on function %s to service_role',
      target_function
    );
  end loop;
end
$do$;

commit;
