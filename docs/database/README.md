# Persistence foundation

The backend uses PostgreSQL (hosted on Neon) for accounts, sessions, evaluated decisions, and unfinished drafts. The `users` table stores a one-way password hash and profile details, including optional date of birth, gender, phone number, and location. These profile fields are not used in decision scoring. `user_sessions` stores expiring session token hashes.

Decision and draft rows have a `user_id`, and API reads and changes are scoped to that account. The `decisions` table stores the title, description, alternatives, criteria, weights and ratings, plus ranking and score breakdown snapshots. The `decision_drafts` table stores the latest editable draft, current workspace step, furthest unlocked step, and timestamps. When a draft is evaluated, the completed record is inserted and its draft is deleted in one transaction. Users can delete evaluations and drafts after confirming.

The database connection is configured via `DATABASE_URL` in `.env` (e.g. `postgresql://user:password@ep-example.us-east-2.aws.neon.tech/neondb?sslmode=require`). The tables, indexes, and additive columns are verified and created automatically when the API starts. `GET /api/decisions` returns saved evaluations newest first.

When an account is first registered, existing records without an owner are assigned to that account. Password recovery, email verification, and account deletion are supported. What-If recalculations remain temporary and do not create saved records.
