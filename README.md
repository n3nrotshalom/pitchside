# Pitchside Backend

Node.js + Express API using Supabase Auth and PostgreSQL.

## Included
- Fan / Organizer sign-up and login
- Authenticated profile endpoint
- Organizer-only tournament creation, editing and deletion
- Team creation
- Match fixture creation and score updates
- Supabase SQL schema and Row Level Security policies

## Setup
1. Install Node.js (LTS recommended).
2. Open this folder in VS Code.
3. Run `npm install`.
4. Copy `.env.example` to `.env`.
5. Fill in `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` from Supabase Project Settings > API.
6. In Supabase SQL Editor, run `database/schema.sql`.
7. Run `npm start`.
8. API runs at `http://localhost:3000`.

Do not share `.env`, API keys, passwords or access tokens. Never put a Supabase secret/service-role key in frontend code.

## Authentication
For protected endpoints, send:
`Authorization: Bearer <access_token>`

The login endpoint returns `session.access_token`. The frontend should store it securely and attach it to protected requests. On logout, discard the access and refresh tokens on the frontend; this API does not revoke a JWT server-side.

If Supabase email confirmation is enabled, sign-up may return `session: null`; the user must confirm their email before logging in.

## Endpoints

### Health
- `GET /`

### Auth
- `POST /api/auth/signup`
  JSON: `{ "fullName": "Example User", "email": "user@example.com", "password": "password123", "role": "fan" }`
  `role` must be `fan` or `organizer`.
- `POST /api/auth/login`
  JSON: `{ "email": "user@example.com", "password": "password123" }`
- `GET /api/auth/me` (Bearer token)
- `POST /api/auth/logout` (Bearer token; frontend must discard tokens)

### Tournaments
- `GET /api/tournaments` (published tournaments)
- `GET /api/tournaments/:id`
- `POST /api/tournaments` (organizer; Bearer token)
- `PATCH /api/tournaments/:id` (owner organizer; Bearer token)
- `DELETE /api/tournaments/:id` (owner organizer; Bearer token)

### Teams
- `GET /api/teams/tournament/:tournamentId`
- `POST /api/teams` (organizer; Bearer token)

### Matches
- `GET /api/matches/tournament/:tournamentId`
- `POST /api/matches` (organizer; Bearer token)
- `PATCH /api/matches/:id/result` (organizer; Bearer token)

## Example request body: create tournament
```json
{
  "name": "Pitchside Campus Cup",
  "description": "University football tournament",
  "location": "Jos",
  "start_date": "2026-12-01",
  "end_date": "2026-12-20"
}
```

## Notes for frontend developer
- Base URL in local development: `http://localhost:3000`
- Signup/login response contains `user` and `session`.
- For protected requests, use `session.access_token` as a Bearer token.
- Public tournament/team/match reads are subject to Supabase RLS and published tournament visibility.
- League tables, scorers, assists, cards and player squads are not included in this first backend version; they can be added as the next feature set.
