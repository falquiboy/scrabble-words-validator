-- Keep extension-owned objects out of the PostgREST-exposed public schema.
-- The previous migration pins project functions to a trusted path that already
-- includes extensions, so unqualified unaccent/pg_trgm/vector calls keep working.

begin;

create schema if not exists extensions;
revoke create on schema extensions from public;
grant usage on schema extensions to anon, authenticated, service_role;

alter extension unaccent set schema extensions;
alter extension vector set schema extensions;
alter extension pg_trgm set schema extensions;

commit;
