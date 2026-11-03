# OptiChoice

OptiChoice is an AI-assisted decision support app for comparing options against personal priorities. The calculation is deterministic; AI will explain the result but will not decide or change the ranking.

## Scoring rule

For new decisions, enter a real numeric value for every option and criterion, with an optional unit such as ₹, hours, or kg. Mark whether higher or lower values are better. OptiChoice converts values within each criterion to a comparable 0–100 scale using min–max normalization, then applies the criterion weights:

The current score is a weighted sum:

```text
normalized value = (value − minimum) / (maximum − minimum) × 100  [higher is better]
normalized value = (maximum − value) / (maximum − minimum) × 100  [lower is better]
score = Σ (criterion weight / 100 × normalized value)
```

If all options have the same value for a criterion, they all receive 100 for that criterion because it does not distinguish between them. Scores compare only the options in this decision; they do not say whether an option is objectively good. Older drafts and evaluations retain their original 0–100 rating method.

## Project structure

```text
frontend/          React and TypeScript web application
backend/           Express API and request middleware
decision-engine/   Pure deterministic scoring and ranking
ai/                Gemini explanation service and prompt/schema
docs/              Architecture, API, database, and project documentation
```

The backend provides registration, email verification, Google sign-in, profile, password recovery, sessions, evaluation, history, and draft routes. Verification and password recovery use Gmail SMTP when configured; otherwise local development prints the link in the API terminal. Evaluations and unfinished drafts are saved in PostgreSQL (Neon) and belong to the signed-in account. In development, the frontend proxies `/api` to the backend. What-If changes recalculate immediately in the browser and are not saved as new evaluations. Gemini explains completed decisions but does not change their deterministic ranking.

## Run locally

On the first run, install the API dependencies and create its local environment file:

```powershell
cd backend
npm install
Copy-Item .env.example .env
```

For Gmail email delivery, set `SMTP_USER` and `SMTP_APP_PASSWORD` in `backend/.env`; `SMTP_FROM` is optional. For Google sign-in, set the web OAuth client ID as `GOOGLE_CLIENT_ID` in `backend/.env` and `VITE_GOOGLE_CLIENT_ID` in `frontend/.env`. The Google client secret is not used by this ID-token sign-in flow and must never be placed in frontend configuration. Copy `frontend/.env.example` to `frontend/.env` before setting the public client ID.

Gemini explanations require `GEMINI_API_KEY` in `backend/.env`. Keep all server credentials in the backend environment and restart the API after changing them.

Optional shopping search is shown for purchase-oriented decisions and uses SerpApi's Google Shopping results. Create a SerpApi API key, put it in `SERPAPI_API_KEY` in `backend/.env`, and restart the backend. `PRODUCT_SEARCH_COUNTRY` defaults to `in` and `PRODUCT_SEARCH_LANGUAGE` to `en`. The key stays on the backend. Search results are suggestions: check the retailer page for current prices and specifications before relying on them. A selected listing's price can be copied into a matching Price or Cost value in the decision workspace.

Start the API in one terminal:

```powershell
cd backend
npm run dev
```

In a second terminal, install and start the frontend:

```powershell
cd frontend
npm install
npm run dev
```

Open the local address shown by Vite. The development server proxies `/api` requests to the backend, which listens at `http://localhost:3001` by default. Create an account from the registration page, then sign in with that email and password. See [docs/architecture/overview.md](docs/architecture/overview.md) for the system boundaries and current scoring contract.
