# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Keep React route views focused on rendering and interaction. Use the shared API client for relative `/api` requests and give each view accessible loading, error, empty, and populated states; keep business rules out of the UI.
- Logic tier decision: Keep Express routes responsible for HTTP input validation and status codes, with business rules and database queries in `octofitService.ts`. Validate ID formats and referenced records before writes; keep the API on port `8000` and do not add authentication.
- Data tier decision: Use Mongoose schemas for required fields, references, and safe defaults such as an empty team member list. Keep the seed idempotent and additive so reruns preserve unrelated records; use MongoDB on port `27017`.
- Activity tracking approach: Accept `userId`, `teamId`, `type`, and positive `minutes`; validate that both referenced records exist, then persist their references with `occurredAt` and deterministic points (initially one point per minute). Return deliberate 4xx responses for invalid or missing references.
- Team management approach: Require a non-empty name, preserve the submitted name and mascot, and default members to an empty list. Validate member references before saving and keep team membership consistent when creating or listing teams.
- Leaderboard approach: Aggregate activity points by team, include teams with no activity at zero points, sort highest total first with a deterministic tie-break, and return `teamName`, `totalPoints`, and one-based `rank`.
- Workout suggestions approach: Find the user by email, select a focus from their fitness goal or recent activity, and return matching workouts with a concise reason tied to that signal. Return a deliberate 4xx response when no user matches.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`
- API command: `npm run test:api --prefix octofit-tracker/backend`
- Frontend command: `npm test --prefix octofit-tracker/frontend`
- Backend build command: `npm run build --prefix octofit-tracker/backend`
- Frontend build command: `npm run build --prefix octofit-tracker/frontend`
