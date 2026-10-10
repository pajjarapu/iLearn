# letthemcook

HackATL 2026 project. Kitchen Line is a restaurant kitchen for a team of AI coding agents. Each task is an order ticket. Each agent is a cook. The main screen is a 3D kitchen. Drag to look around, scroll to zoom. Tickets stay on the rail above the room.

Token counts in this phase are simulated. Dollar amounts use a real price table (`$3` per million input tokens and `$15` per million output tokens by default).

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:5173 and click **Fire the demo ticket**.

The API is on http://127.0.0.1:3001. Copy `.env.example` to `.env` if you do not already have one.

| Variable | Default | Meaning |
| --- | --- | --- |
| `PORT` | `3001` | API and WebSocket port |
| `MOCK_AGENTS` | `true` | Simulated cooks in `/sandbox`. `false` opens a git branch in the repo path you set |
| `ANTHROPIC_API_KEY` | empty | Unused in phase 1 |
| `PRICE_INPUT_PER_MTOK` | `3` | Dollars per million input tokens |
| `PRICE_OUTPUT_PER_MTOK` | `15` | Dollars per million output tokens |
| `DATABASE_PATH` | `server/data/kitchen.db` | SQLite file |

To fire the demo order from another terminal while the server is running:

```bash
npm run seed
```

## What you should see

The demo order is "Add a payment section to the app" with a **$0.0500 budget per ticket**.

- Alma (head chef) splits it into prep, grill, and sauce.
- Jules, Rio, and Nia work in parallel. Costs and timers move on each ticket.
- Rio holds `src/app/checkout.ts`. Nia waits, and the ticket says **Waiting for a burner**.
- Nia's ticket turns red and the tape says she is over budget. She keeps working. Pausing her is phase 4.
- Tickets stop at **At the expo window**. Nothing is marked served. Expo is phase 4.
- The scoreboard names Nia as the most expensive cook.

Ticket color is never the only signal:

- On pace
- Over half the budget, or past 2 minutes (amber)
- Over budget, or past 5 minutes (red)

## Folder structure

```
shared/     types shared by the server and the pass window
server/     Express, SQLite, mock cooks, WebSocket
client/     Pass window for watching tickets, cost, and the event tape
```

## Data model

`orders` — one user request

| Column | Meaning |
| --- | --- |
| `id` | `ord_…` |
| `title` | The order text |
| `acceptance_criteria` | JSON list of strings |
| `status` | `placed`, `cooking`, `ready`, `served`, `cancelled` |
| `ticket_budget_usd` | Max dollars for each station ticket |
| `mode` | `mock` or `anthropic` |
| `repo_path`, `branch`, `base_sha` | Set in real mode. Mock leaves them empty and does not touch git |
| `test_command` | Command expo runs in the repo. Default `npm test` |
| `changed_files` | JSON list filled when the order is served |
| `created_at`, `served_at` | Unix ms |

`tickets` — one cook's piece of the order

| Column | Meaning |
| --- | --- |
| `station` | `head_chef`, `prep`, `grill`, `sauce` |
| `cook_id` | Alma, Jules, Rio, or Nia |
| `status` | `queued`, `working`, `waiting_burner`, `ready_for_expo`, `sent_back`, `paused`, `served`, `cancelled`, `done` |
| `input_tokens`, `output_tokens`, `cost_usd` | Usage and dollars from the price table |
| `budget_usd` | Copy of the order's per-ticket budget |
| `files` | JSON list of burners this cook claimed |
| `started_at`, `finished_at` | Unix ms |

`events` — the tape. `type`, `message`, and a JSON `payload`.

`send_backs` — `ticket_id` and `reason`. The table exists. Phase 1 does not write rows. Expo will.

`cooks` — Alma, Jules, Rio, Nia, plus live `status` (`idle`, `working`, `waiting`, `blocked`).

Cost is always recomputed from total tokens:

```
dollars = input / 1_000_000 * PRICE_INPUT_PER_MTOK
        + output / 1_000_000 * PRICE_OUTPUT_PER_MTOK
```

## API

| Method | Path | What it does |
| --- | --- | --- |
| `GET` | `/health` | Process is up |
| `GET` | `/api/state` | Orders, tickets, events, cooks |
| `GET` | `/api/orders/:id` | One order and its tickets |
| `POST` | `/api/workspace` | `{ repoPath?, testCommand? }`. Checks the folder exists and is a git repo, then remembers it |
| `POST` | `/api/orders` | `{ title, acceptanceCriteria?, ticketBudgetUsd?, repoPath?, testCommand? }` |
| `POST` | `/api/orders/:id/expo` | Real mode runs the test command, then serves the order with the branch and changed files |
| `POST` | `/api/demo` | The payment-section demo |
| `POST` | `/api/reset` | Abort the line and wipe the tables |
| `WS` | `/line` | Snapshot, then live order, ticket, cook, and event messages |

One order at a time. A second order returns 409 until you clear the line.

The **Repo path** and **Test command** fields sit above the order form. The last path is saved on the server. With the path empty, mock orders stay in `/sandbox` and do not touch git. With a path saved, the next order opens `kitchen-line/<short-order-name>-<timestamp>` in that repo and the cooks write files there. Cooks can only read and edit files inside the repo. When expo serves the order, the pass shows the branch, the changed files, and: "Review with git diff, then merge if it looks good."

## Checks

```bash
npm run typecheck
npm run smoke
```

`smoke` boots the server on a temp database, runs the demo, and checks that sauce goes over budget, costs match the price table, a burner wait is recorded, and no ticket is served.

## Next

1. Kitchen floor in PixiJS (phase 2)
2. Real Claude agents on a sandbox repo, with file locks (phase 3)
3. Expo that runs tests itself, send-backs, and budget pause (phase 4)
4. Cook report cards (phase 5)
