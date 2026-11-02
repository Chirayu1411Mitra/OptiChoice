# Local persistence foundation

The backend uses a local SQLite database for accounts, sessions, evaluated decisions, and unfinished drafts. The `users` table stores a one-way password hash and profile details, including optional date of birth, gender, phone number, and location. These profile fields are not used in decision scoring. `user_sessions` stores expiring session token hashes.

Decision and draft rows have a `user_id`, and API reads and changes are scoped to that account. The `decisions` table stores the title, description, alternatives, criteria, weights and ratings, plus ranking and score breakdown snapshots. The `decision_drafts` table stores the latest editable draft, current workspace step, furthest unlocked step, and timestamps. When a draft is evaluated, the completed record is inserted and its draft is deleted in one transaction. Users can delete evaluations and drafts after confirming.

The default database file is `backend/data/optichoice.sqlite`; `DATABASE_PATH` can override it. The file, tables, and additive columns are created automatically when the API starts. `GET /api/decisions` returns saved evaluations newest first.

When an account is first registered, existing records without an owner are assigned to that account. Password recovery, email verification, and account deletion are supported. What-If recalculations remain temporary and do not create saved records.
