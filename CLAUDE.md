# Climbing Spot App

Flask web app for browsing and managing rock climbing spots and climber profiles.

## Tech Stack
- Backend: Flask, SQLAlchemy, Flask-Migrate
- Database: PostgreSQL (local and production)
- Auth: Auth0 (OAuth implicit flow, JWT tokens)
- Frontend: Jinja2 templates, vanilla JS, jQuery

## Environment
Requires a `.env` file with:
- `FULL_DATABASE_URL` — full PostgreSQL connection string
  - Example: `postgresql://user:password@localhost/dbname`

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

## Key Conventions
- Auth0 user ID (`payload['sub']`) is stored as `added_by` on both `ClimbingSpot` and `Climber`
- Ownership is enforced on both backend (403 check) and frontend (`data-added-by` attribute)
- One climber profile per user enforced via unique constraint on `climber.added_by`
- `get_climbing_spots()` resolves `added_by_name` by joining against the Climber table — returns "Unknown" if no match or if `added_by` is null
- Auth decorator `@requires_auth(permission)` injects decoded JWT as `payload` into route functions

## Deployment
Render — set `FULL_DATABASE_URL` in the Environment tab of the service dashboard, then redeploy.
If manually adding DB columns instead of running migrations, run `flask db stamp head` afterward so Alembic stays in sync.
