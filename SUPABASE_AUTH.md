# Supabase authentication

Project reference: `duxzmtvrcaphljakflod`.

This repository must never contain database passwords, personal access tokens,
`service_role` keys, OAuth secrets, or user passwords. The browser-facing anon
key is public by design, but privileged credentials still belong in an approved
secret store.

## CLI access

Authenticate interactively with the official CLI and link the project:

```bash
npx supabase login
npx supabase link --project-ref duxzmtvrcaphljakflod
npx supabase migration list --linked
```

The CLI stores its local session outside the repository. Do not pass personal
access tokens on the command line and do not commit `supabase/.temp/`.

## Administrative scripts

Legacy scripts that embedded privileged credentials were removed. New scripts
must read `SUPABASE_SERVICE_ROLE_KEY` or a database URL from the process
environment and fail when it is absent. Never provide a privileged key to Vite
or any variable prefixed with `VITE_`.

Prefer migrations and `supabase db query --linked` over custom SQL-execution
RPCs. Use a service-role secret only in a trusted server or Edge Function after
validating the caller.

## Rotation

Treat any credential committed to Git as compromised even after deleting it
from the current branch. Revoke it at the service owner, update legitimate
consumers through secure storage, and coordinate any history rewrite with all
repository collaborators.
