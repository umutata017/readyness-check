## Backend ownership

This project is no longer managed through Lovable. Supabase is the project's
backend and schema changes are made directly through the Supabase CLI using
versioned migrations in `supabase/migrations/`. Never commit service-role keys,
database passwords, or other secrets.

## Project rules

- Screens use `src/components/field/AppShell` + `FieldButton` so all screens share layout and tap-size rules; theme tokens live only in `src/styles.css`.
- Prototype data is seeded in Supabase; the client reads and writes through `src/data/store.ts`.
- Keep prototype job mutations in `src/data/store.ts` and shared state in `TechnicianProvider`; the anonymous Supabase database is demo-only so technician and supervisor devices share one replaceable data layer.
- Share supervisor create/edit fields through `JobForm`; keep supervisor routes independent so job edit screens do not mount inside detail pages.
