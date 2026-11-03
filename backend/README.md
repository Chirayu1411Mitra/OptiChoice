# OptiChoice API

This folder contains the Express API boundary. It provides account registration, login, profile and password updates, session, decision, and draft routes. Protected decision and draft routes only return or change data owned by the signed-in account. Drafts are saved to PostgreSQL (Neon) as they are edited. A successful evaluation is saved with its original inputs and score breakdown, and removes its draft in the same database transaction. Set `DATABASE_URL` in `.env` with your Neon PostgreSQL connection string.

## Run locally

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

The API listens on port `3001` by default. Its browser origins are restricted to `FRONTEND_ORIGIN` (comma-separated for multiple origins). The first account registered claims existing evaluations and drafts that do not yet have an owner. New email/password accounts must verify their email before login. Google sign-in verifies Google's ID token on the backend and creates a verified account or links the verified identity to an account with the same email. For Gmail email delivery, set `SMTP_USER` and `SMTP_APP_PASSWORD`; `SMTP_FROM` is optional. Without SMTP, local development prints verification and password recovery links in the backend terminal. Set `GOOGLE_CLIENT_ID` on the backend and `VITE_GOOGLE_CLIENT_ID` on the frontend for Google sign-in. This flow does not use the Google client secret. Keep the API key in `GEMINI_API_KEY` on the backend only.
