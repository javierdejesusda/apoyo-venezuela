<div align="center">

# Apoyo Venezuela

**Coordinate earthquake relief in Venezuela: map affected zones, post needs, and find verified emergency numbers.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![CI](https://github.com/javierdejesusda/apoyo-venezuela/actions/workflows/ci.yml/badge.svg)](https://github.com/javierdejesusda/apoyo-venezuela/actions/workflows/ci.yml)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[![Next.js 16](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres_+_Realtime-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com/)

**Live site: [apoyovenezuela.com](https://apoyovenezuela.com)**

</div>

> A citizen initiative with no political affiliation. Information is community-contributed, so verify before acting or sharing. In a life-threatening emergency, call 911.

Apoyo Venezuela is a mobile-first, crowd-coordination web app created after the June 24, 2026 earthquake in Venezuela (a doublet of roughly M7.1 and M7.5). It lets people report affected zones, post needs per location, mark structural status, and consult verified emergency phone numbers.

## Table of contents

- [About](#about)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Connecting Supabase](#connecting-supabase)
- [Database](#database)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [Emergency data](#emergency-data)
- [Contributing](#contributing)
- [Code of conduct](#code-of-conduct)
- [Security](#security)
- [License](#license)
- [Acknowledgments](#acknowledgments)

## About

What the app does:

- **Interactive map of affected zones** with a structural-status traffic light (collapsed, damaged, stable, unconfirmed), always shown as color plus icon plus text label.
- **Zone reporting** with address autocomplete, reverse geocoding, geolocation, or by dragging a pin on the map, including photo uploads restricted to safe raster image types.
- **Needs per zone** (rescue, water, food, medicine, shelter, and more) with a lifecycle of needed, then on the way, then covered.
- **Verified emergency phone directory** by state, with tap-to-call and the source of each number.
- **Aid guide**: what to donate and what to avoid, shelters and collection centers, aid organizations.
- **Link to the sister project** for missing persons: [desaparecidosterremotovenezuela.com](https://desaparecidosterremotovenezuela.com).
- **Live updates** on the map and lists via Supabase Realtime.
- **PWA**, light and dark mode, mobile-first.

## Tech stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router) + React 19 + strict TypeScript.
- **Styling**: Tailwind CSS v4 with design tokens defined in `app/globals.css` via `@theme`.
- **Map**: Leaflet + react-leaflet using OpenStreetMap tiles (no API key). Address autocomplete and reverse geocoding use the Mapbox Geocoding API (optional; see below).
- **Data**: Supabase (Postgres + Realtime); validation with Zod.
- **Icons**: lucide-react.
- **Tests**: Vitest.

## Getting started

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

**Demo mode**: with no environment variables, the app runs in demo mode using an in-memory store with sample data for the affected zones. Data is not shared between users in this mode, so it is ideal for trying the app locally without any backend.

## Connecting Supabase

To use live, shared data, set both of these variables (for example in `.env.local` or in your hosting provider's panel):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

When both are set, the app uses Supabase automatically instead of demo mode.

> The anon key is public by design (it ships in the browser bundle). Never expose the `service_role` key or any secret key.

## Address autocomplete (Mapbox)

The report form can autocomplete addresses and reverse-geocode a dropped pin using the Mapbox Geocoding API. Set a Mapbox access token to enable it (for example in `.env.local`):

```bash
MAPBOX_TOKEN=pk.your-mapbox-token
```

The token is read only on the server (it is not prefixed with `NEXT_PUBLIC_`, so it never ships in the browser bundle), and requests are biased to Venezuela. Restrict the token by URL in the Mapbox dashboard. Without a token the form still works: autocomplete returns no suggestions and the user places the pin manually, falling back to the per-state approximate location.

## Database

The schema lives in the `supabase/migrations/` directory as a series of migration files: the tables `locations` and `needs`, indexes, RLS policies, the Realtime publication, and photo support.

Apply the migrations with the Supabase CLI:

```bash
supabase db push
```

Alternatively, paste the SQL into the SQL editor in the Supabase panel.

Row Level Security allows **read, insert, and update** (this is an emergency tool with no login) and does **not** allow delete. Moderation is future work.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run the test suite (Vitest) |
| `npm run typecheck` | Type-check with `tsc --noEmit` |

## Project structure

```text
app/            App Router routes (home, reportar, telefonos, guia, zona/[id]) plus PWA and SEO metadata
components/     UI: map, forms, cards, navigation, and states
components/ui/  Primitives: button, form, badge
lib/data/       Data model, store (demo vs Supabase), selectors, seed, and contacts
lib/status.ts   Visual traffic-light system: icons, labels, and tones
supabase/       Schema migrations
tests/          Pure-logic tests
```

## Emergency data

Phone numbers and resources were collected from public sources and marked verified when confirmed by at least one credible source. Lines can be saturated or change, so **verify a number before calling**.

## Contributing

Contributions are welcome. Data corrections (phone numbers, shelters, organizations) are especially valuable, and each correction should include its source. See [CONTRIBUTING.md](CONTRIBUTING.md) for details, and please keep the project's conventions: design tokens, lucide icons, and strictly non-partisan content.

## Code of conduct

This project follows a [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold it.

## Security

Please report vulnerabilities responsibly. See [SECURITY.md](SECURITY.md) for how to disclose issues privately.

## License

Released under the [MIT License](LICENSE).

## Acknowledgments

- [OpenStreetMap](https://www.openstreetmap.org/) contributors for the map tiles.
- [Supabase](https://supabase.com/) for Postgres and Realtime.
- The Venezuelan volunteer community contributing data and time on the ground.
- The sister project for missing persons: [desaparecidosterremotovenezuela.com](https://desaparecidosterremotovenezuela.com).
