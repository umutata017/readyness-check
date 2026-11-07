# Field Ready

Build a mobile-first web app prototype called AdvantiQ for technicians in small technical installation companies (heating, electrical, mechanical, welding). Purpose: make sure the technician has the right information before work starts. This is a prototype for user testing, not a production product. 
User: a technician on site using a phone, one-handed, sometimes with gloves and in poor light. No login. Large tap targets, high contrast, short text, one main action per screen.
Design: no reference image yet, so propose a design yourself. Think of a rugged, professional field tool, not a consumer app. Use a dark neutral base with a strong safety-yellow accent, high contrast, big rounded buttons, and clear status colors (red for changes and missing items, green for ready). Use a clean, bold sans-serif font. Keep layouts simple: one clear primary action per screen, short text, generous spacing for tapping with gloves. Define the colors, fonts and spacing once as theme settings (design tokens) so the whole look can be changed later in one place.
For now, build ONLY the Job overview screen with hardcoded dummy data (no backend, no Supabase yet): - Project name, customer, address, timeslot - Short list of main tasks - An "Update" section under the tasks, marked in a clearly visible color, showing what changed (old value → new value). The changed item (15 m scissor lift) is highlighted in the task list. - A "Seen" button that confirms the update - Bottom buttons: Route, Checklist, Contact supervisor (not functional yet) Do not add any other screens or features yet. Set up the project so more screens can be added later with a shared style and navigation.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/14976e42-ece9-4f0c-bab9-3f58fefe1da5).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
