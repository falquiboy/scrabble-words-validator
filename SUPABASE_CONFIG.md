# Supabase project workflow

The shared Supabase project is `duxzmtvrcaphljakflod`. Configuration in this
repository is intentionally non-secret.

## Common commands

```bash
npx supabase login
npx supabase link --project-ref duxzmtvrcaphljakflod
npx supabase migration list --linked
npx supabase db push --linked --dry-run
npx supabase gen types typescript --linked
```

Use the official Dashboard or CLI login flow for access. Do not record personal
access tokens, database passwords, connection strings containing passwords,
`service_role` keys, or account passwords in Markdown, source files, shell
profiles, command examples, issue comments, or CI logs.

Local-only values belong in an ignored `.env.local` file or an approved OS
credential store. Commit an `.env.example` only when it contains placeholders.

## Migration authority

`supabase/migrations/` records changes already associated with the shared
remote project. Before applying anything:

1. Compare `migration list --linked` with the repository.
2. Run a linked dry run.
3. Validate changes in a transaction ending in `ROLLBACK` when possible.
4. Apply the migration once and verify the production behavior.

The current history is not yet a complete from-zero schema snapshot. Do not use
`db reset` as evidence that the shared production schema is reproducible until
a reviewed baseline migration has been captured.
