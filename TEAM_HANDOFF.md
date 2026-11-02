# OptiChoice — Team Handoff

Use this file as project context in a new ChatGPT conversation. Ask the assistant to read the repository and this handoff before changing code. It should verify the current source rather than assuming this note is perfectly current.

## Project goal

OptiChoice helps a user compare options against priorities they choose. It calculates the ranking with a deterministic formula. Any future AI feature may explain the result, but must not choose a winner, change scores, or invent facts.

## Current structure and ownership areas

- `frontend/` — React + TypeScript website: account flows, dashboard, profile, history, decision wizard, comparisons, and results.
- `backend/` — Express + TypeScript API: authentication, email verification and password recovery, user profile/account handling, decisions/drafts, product lookup, SQLite persistence, validation, and API routes.
- `decision-engine/` — deterministic scoring, normalization, rankings, and score breakdowns.
- `ai/` — planning documentation only; the AI explanation feature has not been implemented or connected.
- `docs/` — architecture, API, database, and project documentation.

These are technical areas, not proof that four different people authored the current code. Git commits should identify the people who actually make each change.

## What is implemented

- Account registration, email verification, sign-in, password reset, profile updates, password changes, and account deletion.
- Authenticated dashboard, decision history, and saved drafts. Drafts save progress, can be resumed, and saved decisions/drafts can be deleted.
- A multi-step decision flow for entering a decision, alternatives, criteria, weights, and values, then reviewing/evaluating it.
- Relative numeric scoring: values are normalized per criterion from 0–100 (respecting higher-is-better or lower-is-better), then combined using the user's weights. Results show rankings and per-criterion contributions. What-If weights recalculate in the browser.
- A legacy 0–100 rating mode remains for older drafts/evaluations.
- SerpApi Google Shopping product search for laptop listings and prices. Optional lookups try to find battery life, weight, and a CPU Geekbench 6 multi-core estimate. Values show source links when available; users can enter missing values manually.
- The Values page recently gained a **Try lookup again** action for missing battery, weight, and performance details. It calls the backend product-details lookup and updates the draft if it finds a value. This latest UI change has not been verified yet. It only works for options that have a product ID; lookup can still return no match. Price comes from the shopping listing, not this retry action.
- Current benchmark lookup is best-effort. A CPU score is an estimate, not a guaranteed result for the exact laptop. Ensure the Performance criterion is set to higher-is-better.

## Not implemented / useful next work

1. **AI explanations and reports** — implement in `ai/` and/or a server-side backend service. Explain strengths, trade-offs, and assumptions using validated results. Never change or recalculate the ranking with AI. No AI provider or key is currently configured.
2. Improve product lookup reliability and coverage. Keep sources visible, distinguish product-specific measurements from CPU estimates, and retain manual entry when data is missing.
3. Review usability, accessibility, error handling, and mobile layout across the main workflows.
4. Add or improve automated coverage for the scoring formula, API validation, authentication, draft resume/save, product lookup fallbacks, and UI flows. Check the existing tests first.
5. Keep README and API/database documentation in sync with behavior.

## Local setup

Requirements: Node.js and npm.

Backend terminal:

```powershell
cd backend
npm install
Copy-Item .env.example .env
npm run dev
```

Frontend terminal:

```powershell
cd frontend
npm install
npm run dev
```

The frontend is configured for `http://localhost:8081` and proxies `/api` to the backend at `http://127.0.0.1:3001`. Use the URL printed by Vite if the local configuration differs. The backend creates/uses `backend/data/optichoice.sqlite` by default.

For laptop search, put a personal SerpApi key in `backend/.env` as `SERPAPI_API_KEY=...`. Keep it private; never put real credentials in `.env.example`, source code, commits, screenshots, or ChatGPT prompts. Local email verification/password reset can print links in the backend terminal; real sending needs Resend configuration in `backend/.env`.

## Suggested way to collaborate

Give each teammate a real, bounded task in their area and ask them to make their own changes/commit from their own GitHub account. Good areas to take on include AI explanation, product lookup reliability, decision-engine coverage/edge cases, and frontend usability/documentation. Review and integrate changes through branches or pull requests. Do not copy unchanged code into commits to make it appear another person authored it.

## Prompt to paste into a new ChatGPT chat

> We are continuing the OptiChoice project. Read `TEAM_HANDOFF.md`, `README.md`, and the relevant source files before proposing changes. The current project has frontend, backend, deterministic decision-engine, planned AI, and docs areas. First summarize what exists in the current checkout, then work only on the task I give you. Preserve the deterministic scoring contract: AI may explain results but must never change rankings or invent data. Keep API keys and `.env` files private. Product lookups are best-effort and manual entry must remain possible. Make commits only under the identity of the person who actually made the changes. Do not claim unverified features work; tell me what changed and what still needs checking.
