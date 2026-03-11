# Krav Milim (קרב מילים)

A competitive Hebrew Wordle game. Solve the daily 5-letter Hebrew word, then see how you ranked against your **Nemesis rivals** — friends you've challenged to an ongoing 1v1 rivalry.

## Features

- **Daily global word** — one 5-letter Hebrew word per day for all players
- **Nemesis rivalries** — challenge any player by username; an ongoing 1v1 score is tracked across every daily word you both play
- **Ranked scoring** — fewer guesses wins; ties broken by solve time
- **Hebrew keyboard** — RTL layout matching the standard Israeli QWERTY mapping; auto-applies final letter forms (sofiot) at position 5
- **Smooth animations** — tile flip reveals color letter-by-letter, keyboard colors update in sync with each tile
- **Admin panel** — schedule words, manage users, reset results for testing
- **Auth** — email/password sign-in via Supabase Auth

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, server components) |
| Database & Auth | Supabase (Postgres, RLS, triggers) |
| Styling | Tailwind CSS v4 |
| Language | TypeScript |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### Installation

```bash
git clone <repo-url>
cd krav-milim
npm install
```

### Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Where to find it | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project → Settings → API | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project → Settings → API | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project → Settings → API | ✅ |
| `ADMIN_EMAIL` | Your email address for admin access | ✅ |
| `NEXT_PUBLIC_APP_URL` | Production domain (e.g. `https://wordwars.app`) | optional |

> **Never commit `.env.local`**. It contains your service role key which has full database access.

### Database Setup

Apply the migrations to your Supabase project in order:

```bash
# Using the Supabase CLI (recommended)
supabase db push

# Or run manually in the Supabase SQL editor in this order:
# supabase/migrations/001_initial_schema.sql
# supabase/migrations/002_nullable_username.sql
# supabase/migrations/003_nemesis_scores_rls.sql
# supabase/migrations/004_fix_nemesis_winner_trigger.sql
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Game Rules

- Guess the 5-letter Hebrew word in 6 attempts
- 🟩 **Green** — correct letter, correct position
- 🟨 **Yellow** — correct letter, wrong position
- ⬛ **Grey** — letter not in the word

## Nemesis Scoring

Two players who both complete the daily word are compared:

1. **Solved beats unsolved** — if only one player solved, they win
2. **Fewer guesses wins** — 2 guesses beats 3 guesses
3. **Faster time breaks a tie** — same guess count? the quicker solve wins
4. **Draw** — only if guesses and time are identical

## Admin Panel

Accessible at `/admin` for the user whose email matches `ADMIN_EMAIL`.

- **Words** (`/admin/words`) — schedule daily words by date
- **Users** (`/admin/users`) — view all users, reset daily results, delete accounts
- **Testing** (`/admin/testing`) — reset your own result or all results for today

## Project Structure

```
src/
  app/
    (app)/          # Auth-guarded routes (game, leaderboard, rivalries)
    (auth)/         # Login & signup pages
    admin/          # Admin panel
    api/            # API route handlers
  components/
    game/           # GameBoard, GameRow, GameTile, HebrewKeyboard
    layout/         # NavBar
  hooks/
    useGame.ts      # Game state machine
  lib/
    game/           # Pure game logic (engine, hebrew, constants)
    supabase/       # Supabase client factories (browser, server, service)
  types/
    database.ts     # Supabase DB types (tables, views, enums)
    shared.ts       # App-level types (TileState, GuessHistoryEntry, etc.)
supabase/
  migrations/       # Postgres migrations (schema, RLS, triggers)
```

## Deployment

The app is configured for standalone output (`next.config.ts`). Deploy to any Node.js host:

```bash
npm run build
npm start
```

Or use [Vercel](https://vercel.com) — connect the repo and add the environment variables in the project settings.

## License

MIT
