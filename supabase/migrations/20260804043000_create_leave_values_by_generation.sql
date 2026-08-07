create table if not exists public.leave_values_by_generation (
  generation smallint not null check (generation >= 0),
  leave text not null,
  value double precision not null,
  primary key (generation, leave)
);

comment on table public.leave_values_by_generation is
  'Valores KLV2 por generación; public.leaves conserva la semilla histórica.';

alter table public.leave_values_by_generation enable row level security;

create policy "Anyone can read generated leave values"
  on public.leave_values_by_generation
  for select
  to anon, authenticated
  using (true);

grant select on table public.leave_values_by_generation to anon, authenticated;
