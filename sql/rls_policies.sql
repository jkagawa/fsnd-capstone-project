-- Row Level Security (RLS) policies for the Climbing Spot app (Supabase / PostgreSQL).
--
-- These policies were originally applied directly in the Supabase SQL editor and are
-- recorded here so they live alongside the code. Run this in the Supabase SQL editor
-- (or psql) against the project database. Statements are idempotent-ish: re-running the
-- CREATE POLICY statements will error if the policy already exists, so drop first if needed.
--
-- How ownership is enforced:
--   On every write request the app calls _set_rls_user() (app.py), which runs
--   SELECT set_config('app.current_user_id', <auth0 sub>, TRUE) -- transaction-local.
--   Policies then compare a row's owner column against
--   current_setting('app.current_user_id', TRUE).
--   The second arg TRUE ("missing_ok") returns NULL instead of erroring on anonymous
--   reads, so the public SELECT policies still work when no user is set.
--
-- ENABLE turns RLS on; FORCE makes it apply even to the table owner / the role the app
-- connects as (without FORCE, an owner/superuser connection bypasses RLS silently).

-- =====================================================================
-- climbingspot  (owner column: added_by = Auth0 sub)
-- =====================================================================
ALTER TABLE climbingspot ENABLE ROW LEVEL SECURITY;
ALTER TABLE climbingspot FORCE ROW LEVEL SECURITY;

-- Anyone can read
CREATE POLICY "spots_select" ON climbingspot FOR SELECT USING (TRUE);

-- Insert: added_by must equal the current user
CREATE POLICY "spots_insert" ON climbingspot FOR INSERT WITH CHECK (
    added_by = current_setting('app.current_user_id', TRUE)
);

-- Update: only the owner
CREATE POLICY "spots_update" ON climbingspot FOR UPDATE USING (
    added_by = current_setting('app.current_user_id', TRUE)
);

-- Delete: only the owner
CREATE POLICY "spots_delete" ON climbingspot FOR DELETE USING (
    added_by = current_setting('app.current_user_id', TRUE)
);

-- =====================================================================
-- climber  (owner column: added_by = Auth0 sub)
-- =====================================================================
ALTER TABLE climber ENABLE ROW LEVEL SECURITY;
ALTER TABLE climber FORCE ROW LEVEL SECURITY;

CREATE POLICY "climbers_select" ON climber FOR SELECT USING (TRUE);

CREATE POLICY "climbers_insert" ON climber FOR INSERT WITH CHECK (
    added_by = current_setting('app.current_user_id', TRUE)
);

CREATE POLICY "climbers_update" ON climber FOR UPDATE USING (
    added_by = current_setting('app.current_user_id', TRUE)
);

CREATE POLICY "climbers_delete" ON climber FOR DELETE USING (
    added_by = current_setting('app.current_user_id', TRUE)
);

-- =====================================================================
-- visitedspot  (ownership derived via climber_id -> climber.added_by)
-- =====================================================================
ALTER TABLE visitedspot ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitedspot FORCE ROW LEVEL SECURITY;

CREATE POLICY "visited_select" ON visitedspot FOR SELECT USING (TRUE);

CREATE POLICY "visited_insert" ON visitedspot FOR INSERT WITH CHECK (
    climber_id IN (
        SELECT id FROM climber
        WHERE added_by = current_setting('app.current_user_id', TRUE)
    )
);

CREATE POLICY "visited_delete" ON visitedspot FOR DELETE USING (
    climber_id IN (
        SELECT id FROM climber
        WHERE added_by = current_setting('app.current_user_id', TRUE)
    )
);

-- =====================================================================
-- review  (owner column: added_by = Auth0 sub)
-- =====================================================================
ALTER TABLE review ENABLE ROW LEVEL SECURITY;
ALTER TABLE review FORCE ROW LEVEL SECURITY;

-- Anyone can read
CREATE POLICY "reviews_select" ON review FOR SELECT USING (TRUE);

-- Insert: added_by must equal the current user
CREATE POLICY "reviews_insert" ON review FOR INSERT WITH CHECK (
    added_by = current_setting('app.current_user_id', TRUE)
);

-- Update: only the owner
CREATE POLICY "reviews_update" ON review FOR UPDATE USING (
    added_by = current_setting('app.current_user_id', TRUE)
);

-- Delete: only the owner
CREATE POLICY "reviews_delete" ON review FOR DELETE USING (
    added_by = current_setting('app.current_user_id', TRUE)
);
