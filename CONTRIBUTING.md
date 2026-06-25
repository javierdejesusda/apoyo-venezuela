# Contributing to Apoyo Venezuela

Thank you for being here. Apoyo Venezuela is a non-partisan citizen initiative built to help people coordinate emergency relief after the June 24, 2026 earthquake in Venezuela. Every contribution, large or small, helps someone find water, shelter, medicine, or a working phone line faster.

The single most valuable contribution you can make is an accurate emergency-data correction: a phone number, a shelter, or an aid organization that is wrong, outdated, or missing. Because people act on this data in real emergencies, every data change MUST include a credible public source. No source, no merge. This rule is not negotiable.

Live site: https://apoyovenezuela.com
Repository: https://github.com/javierdejesusda/ayuda-venezuela
Looking for missing persons? See the sister project: https://desaparecidosterremotovenezuela.com

## Ways to contribute

- **Data corrections**: fix or add emergency phone numbers, shelters, collection centers, and aid organizations, always with a source.
- **Bug reports**: tell us when something is broken, with steps to reproduce.
- **Feature ideas**: propose improvements that help people in an emergency.
- **Documentation**: clarify guides, the README, or setup instructions.
- **Accessibility improvements**: make the app usable for more people, on more devices, in more conditions.
- **Translations**: help reach more people who need this.

## Before you start

- **Search existing issues** first. Your bug, idea, or data correction may already be tracked, and you can add useful context there instead of opening a duplicate.
- **Open an issue to discuss anything large before coding.** For data corrections and small fixes, an issue plus a pull request is enough. For new features or significant refactors, open an issue first so we can agree on the approach. This protects your time and ours.

## Local setup

### Prerequisites

| Requirement | Version |
| --- | --- |
| Node.js | 20 or newer |
| npm | bundled with Node.js |

### Steps

```bash
git clone https://github.com/javierdejesusda/ayuda-venezuela.git
cd ayuda-venezuela
npm install
npm run dev
```

Then open the local URL printed in your terminal.

### Demo mode

With no environment variables set, the app runs in **demo mode** using an in-memory store with sample data. This is perfect for development and reviewing UI changes. Note that in demo mode data is not shared between users and resets when the server restarts.

### Optional: Supabase for live data

To run against a live backend, create a `.env.local` file and set both variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

When both are present, the app uses Supabase automatically. The anon key is public by design (it ships in the browser bundle). Never commit a `.env` file, and never expose the service_role key or any other secret key.

The database schema lives in `supabase/migrations/`. Apply it with `supabase db push` or by pasting the SQL into the Supabase panel.

## Project conventions

| Area | Convention |
| --- | --- |
| Colors and spacing | Use design tokens defined in `app/globals.css` via `@theme`. Do not hard-code colors. |
| Icons | Use icons from `lucide-react`. Do not introduce other icon sets. |
| Language | In-app UI copy is in Spanish with correct accents, because the audience is Venezuelan. Documentation and code identifiers are in English. |
| Non-partisan | Stay strictly non-partisan. No party colors, no political symbols, no political content of any kind. |
| Accessibility | Structural status (collapsed, damaged, stable, unconfirmed) must always combine color plus icon plus text label, never color alone. Keep sufficient contrast in both light and dark mode. |
| Type safety | TypeScript is strict. All external input must be validated with Zod. |

## Quality gates before opening a PR

Run all three and make sure they pass:

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run test`
- [ ] Add or update Vitest tests for any logic change.

Tests for pure logic live in `tests/`.

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/): concise and imperative.

| Type | Use for |
| --- | --- |
| `feat` | a new feature |
| `fix` | a bug fix |
| `docs` | documentation only |
| `refactor` | code change that is neither a fix nor a feature |
| `chore` | tooling, config, or maintenance |
| `test` | adding or updating tests |

Example: `fix: correct saturated rescue line for Carabobo`

## Pull request process

1. Branch from `main`.
2. Keep your PR focused on one change. Smaller PRs are reviewed faster.
3. Fill in the PR template.
4. Link related issues (for example, `Closes #123`).
5. Make sure CI is green: lint, typecheck, and tests all pass.
6. A maintainer reviews your PR and merges it.

## Data correction specifics

Emergency data was collected from public sources and is marked verified when confirmed by at least one credible source. Lines can be saturated or change, so accuracy matters and freshness matters.

To submit a correction, use the **data correction** issue template and include:

- [ ] The corrected value (for example, the right phone number, shelter, or organization).
- [ ] The state or location it belongs to.
- [ ] The source URL or official reference that backs it up.

A change without a credible public source cannot be merged.

## Code of Conduct

By participating in this project you agree to uphold our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it. We are coordinating help for people in a crisis, so respect and good faith are essential.
