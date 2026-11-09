
## Project rules
- Screens use `src/components/field/AppShell` + `FieldButton` so all screens share layout and tap-size rules; theme tokens live only in `src/styles.css`.
- Prototype data is hardcoded in `src/data/` until a backend is added.
- Keep prototype job mutations in `src/data/store.ts` and shared state in `TechnicianProvider`; browser persistence is demo-only so technician and supervisor views share one replaceable data layer.
- Share supervisor create/edit fields through `JobForm`; keep supervisor routes independent so job edit screens do not mount inside detail pages.
