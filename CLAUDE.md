# Climbing Spot App

Flask web app for browsing and managing rock climbing spots and climber profiles.

## Tech Stack
- Backend: Flask, SQLAlchemy, Flask-Migrate
- Database: PostgreSQL (local and production)
- Auth: Auth0 (OAuth implicit flow, JWT tokens)
- Frontend: Jinja2 templates, vanilla JS, jQuery

## Environment
Requires a `.env` file with:
- `FULL_DATABASE_URL` — full PostgreSQL connection string (e.g., `postgresql://user:password@localhost/dbname`)
- `SECRET_KEY` — stable random string used to sign Flask sessions (cookies invalidate on every restart without it)
- `AUTH0_CLIENT_SECRET` — from the Auth0 application dashboard
- `BASE_URL` — root URL of the app (e.g., `http://localhost:5000` for dev, `https://climbing-spot.onrender.com` for prod)
- Optional overrides: `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_AUDIENCE`

## Run Locally
```bash
source env/Scripts/activate
flask run
```

## Database Migrations
```bash
flask db migrate -m "description"
flask db upgrade
```

## Auth Flow
- OAuth 2.0 Authorization Code with PKCE (server-driven). Implicit flow has been removed.
- `/login` generates a PKCE verifier + state, stores them in the Flask session, redirects to Auth0
- `/callback` validates state, exchanges code for token using the verifier + client secret, sets the access token as an `httpOnly`, `SameSite=Lax`, `Secure` (in prod) cookie
- `/logout` clears the cookie and redirects to Auth0 logout
- Every request runs `before_request` to decode the cookie into `g.user` and `g.permissions`; templates read these via the `current_user` and `user_permissions` context variables
- `requires_auth` reads the token from the cookie first, falling back to the `Authorization` header for direct API access

## Key Conventions
- Auth0 user ID (`payload['sub']`) is stored as `added_by` on both `ClimbingSpot` and `Climber`
- Ownership is enforced on both backend (403 check) and frontend (Jinja conditionals on `current_user == row.added_by`)
- One climber profile per user enforced via unique constraint on `climber.added_by`
- `get_climbing_spots()` resolves `added_by_name` by joining against the Climber table — returns "Unknown" if no match or if `added_by` is null
- Auth decorator `@requires_auth(permission)` injects decoded JWT as `payload` into route functions

## Deployment
Render — set `FULL_DATABASE_URL` in the Environment tab of the service dashboard, then redeploy.
If manually adding DB columns instead of running migrations, run `flask db stamp head` afterward so Alembic stays in sync.
