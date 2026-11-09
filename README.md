# Field Ready

Build a mobile-first web app prototype called AdvantiQ for technicians in small technical installation companies (heating, electrical, mechanical, welding). Purpose: make sure the technician has the right information before work starts. This is a prototype for user testing, not a production product.
User: a technician on site using a phone, one-handed, sometimes with gloves and in poor light. No login. Large tap targets, high contrast, short text, one main action per screen.
Design: no reference image yet, so propose a design yourself. Think of a rugged, professional field tool, not a consumer app. Use a dark neutral base with a strong safety-yellow accent, high contrast, big rounded buttons, and clear status colors (red for changes and missing items, green for ready). Use a clean, bold sans-serif font. Keep layouts simple: one clear primary action per screen, short text, generous spacing for tapping with gloves. Define the colors, fonts and spacing once as theme settings (design tokens) so the whole look can be changed later in one place.
For now, build ONLY the Job overview screen with hardcoded dummy data (no backend, no Supabase yet): - Project name, customer, address, timeslot - Short list of main tasks - An "Update" section under the tasks, marked in a clearly visible color, showing what changed (old value → new value). The changed item (15 m scissor lift) is highlighted in the task list. - A "Seen" button that confirms the update - Bottom buttons: Route, Checklist, Contact supervisor (not functional yet) Do not add any other screens or features yet. Set up the project so more screens can be added later with a shared style and navigation.

## Development

Install dependencies and run the app:

```powershell
npm install
npm run dev
```

The app now uses the linked Supabase project `readyness-check`. The schema and
seed data are in
[`supabase/migrations/20261109143000_create_advantiq_demo.sql`](supabase/migrations/20261109143000_create_advantiq_demo.sql).
The migration has been applied remotely with the Supabase CLI.

Create `.env.local` from `.env.example` and fill in the project URL and public
anon key from Supabase Project Settings → API. Never commit `.env.local`.

To apply future migrations:

```powershell
npx supabase login
npx supabase link --project-ref mfalvukmboozmmrbqxwe
npx supabase db push --remote
```

This is an unauthenticated, dummy-data prototype. The anonymous RLS policies
allow the demo devices to read and modify shared data. Do not use real
customer information until authentication and authorization are added.
