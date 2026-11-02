# OptiChoice API

This folder contains the Express API boundary. It provides account registration, login, profile and password updates, session, decision, and draft routes. Protected decision and draft routes only return or change data owned by the signed-in account. Drafts are saved to SQLite as they are edited. A successful evaluation is saved with its original inputs and score breakdown, and removes its draft in the same database transaction. The database file is created automatically at `backend/data/optichoice.sqlite` by default. Set `DATABASE_PATH` in `.env` to use another path.

## Run locally

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

The API listens on port `3001` by default. Its browser origin is restricted to the frontend address in `FRONTEND_ORIGIN`. The first account registered claims existing local evaluations and drafts that do not yet have an owner. New accounts must verify their email before login. Account deletion requires the current password and permanently removes the account's owned records. Password recovery and verification links print in the backend terminal during local development. For email delivery, set `APP_BASE_URL`, `RESEND_API_KEY`, and `RESEND_FROM` in `.env`.
