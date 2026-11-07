# Plan: Supervisor role for AdvantiQ

## What stays untouched
- Theme, colors, fonts (`src/styles.css`), and the technician screens' look.
- `src/data/jobs.ts` dummy data as the seed; `FieldButton`, `AppShell`, `JobCard`, `UpdateBanner` reused as-is.
- Ready check and Report stay placeholder screens.

## Data model (extend, don't replace)
In `src/data/jobs.ts`:
- Add to `Job`: `jobType` (e.g. Heating / Electrical / Mechanical / Welding), `items` (required equipment / personnel / material, each with a label and kind), `workspaceAvailable: boolean`.
- Add `history: UpdateEntry[]` to `Job`. Each entry: `{ id, at, kind: "created" | "assigned" | "reassigned" | "edited", field, oldValue, newValue, taskId?, message?, seenAt? }`. The existing `update` field becomes the latest entry of the history (kept so the banner and update section keep working).
- Seed data gets the new fields filled in with plausible dummy values.

## One data access layer (new)
New file `src/data/store.ts` — the single place all screens read and write jobs:
- Holds the job list in React state, persisted to `localStorage` (survives refresh; supervisor edits visible after switching technician).
- Functions: `getJobs()`, `getJob(id)`, `createJob(...)`, `editJob(id, changes, { message, notify })`, `reassignJob(id, technicianId)`, `markUpdateSeen(jobId)`, `resetDemo()`.
- Every create/edit/reassign appends a `history` entry; `markUpdateSeen` stamps `seenAt` on the open entry so the supervisor can see it.
- The existing `TechnicianProvider` is extended to expose this store (renamed conceptually to a demo-state provider); screens stop importing `jobs` directly and go through the store. Later swap to Supabase = rewrite this one file.

## New screens (4 routes)
1. `/supervisor` — all jobs across technicians, filter chips/dropdowns by technician and by status, "New job" button, "Reset demo data" button with a confirmation step. Wider layout on laptop (same shell, larger max width).
2. `/supervisor/new` — create-job form: project, customer, address, timeslot, job type, assigned technician, tasks (add/remove lines), required items (label + kind), workspace available toggle. Saving creates the job and a "created/assigned" history entry that notifies the technician.
3. `/supervisor/job/$jobId` — everything the technician sees (info, tasks, update section, actions; ready check / report shown as "Not available yet"), plus an **update history** list: each entry with what changed (old → new), the optional supervisor message, and "Seen by technician · <time>" or "Not seen yet".
4. `/supervisor/job/$jobId_/edit` — edit any field, reassign to another technician, optional short message, "Notify technician" toggle (on by default). Saving appends a history entry per changed field.

## Changes to existing files
- `src/routes/index.tsx`: the technician dropdown gets a "Supervisor" option that navigates to `/supervisor` (and supervisor screens get a way back to the technician view).
- `src/state/technician.tsx`: extended to hold jobs + seen state together, backed by the store; `markUpdateSeen` now records the timestamp.
- `src/routes/job.$jobId.tsx`: reads the job through the store instead of the static import; visuals unchanged.
- New routes get their own `head()` metadata; routing test extended to cover the new paths.

## Notification behavior (as specified)
- Create / assign / reassign → new history entry → existing red banner + highlighted update section for that technician; reassigned job disappears from the previous technician's list.
- Edit → old → new shown per changed field, with the optional message; toggle off = no banner.
- "Seen" tap is timestamped and shown in the supervisor's history.

## Not building (flagged, per instructions)
- No login for the supervisor either — anyone can switch roles via the dropdown (fine for a prototype, but worth noting for user testing).
- No real push notifications — in-app banner only.
- Timeslot is free text (e.g. "Today · 08:00 – 12:30"), not date pickers, to keep the form glove-friendly.

## Verification
- Extend the routing test for the new routes, run the test suite.
- Browser check at phone size: full loop — supervisor creates a job → technician sees banner → taps Seen → supervisor sees "Seen" with time → reset demo restores original data.
