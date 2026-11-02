# API foundation

The Express app is in `backend/src/`. Routes are mounted under `/api`, with shared not-found and error handling middleware. The frontend sends its original evaluation request to this API. During development, Vite proxies `/api` to `http://127.0.0.1:3001`.

| Method | Path | Status | Purpose |
| --- | --- | --- | --- |
| GET | `/api/health` | Implemented | Confirms the API process is responding |
| POST | `/api/auth/register` | Implemented | Creates an account and sends an email verification link |
| POST | `/api/auth/login` | Implemented | Verifies credentials and starts a session |
| POST | `/api/auth/verify-email` | Implemented | Confirms an email address using a one time verification token |
| POST | `/api/auth/resend-verification` | Implemented | Sends a fresh verification link without revealing account status |
| POST | `/api/auth/forgot-password` | Implemented | Issues a short lived password reset link without revealing whether an email is registered |
| POST | `/api/auth/reset-password` | Implemented | Changes the password using a valid one time reset token and revokes all sessions |
| GET | `/api/auth/me` | Implemented | Returns the signed-in account |
| POST | `/api/auth/logout` | Implemented | Revokes the current session |
| PATCH | `/api/auth/profile` | Implemented | Updates the signed-in user's display name |
| POST | `/api/auth/password` | Implemented | Changes the password after checking the current password and revokes other sessions |
| DELETE | `/api/auth/account` | Implemented | Deletes the account and owned records after confirming the password |
| POST | `/api/decisions/evaluate` | Implemented | Validates the decision, calculates a ranking, saves the evaluation, and returns scores and contributions |
| GET | `/api/decisions` | Implemented | Returns saved evaluations newest first for History |
| DELETE | `/api/decisions/:id` | Implemented | Permanently removes a saved evaluation |
| GET | `/api/decisions/drafts` | Implemented | Returns unfinished drafts newest first for the dashboard |
| POST | `/api/decisions/drafts` | Implemented | Creates a draft before the workspace opens |
| GET | `/api/decisions/drafts/:id` | Implemented | Loads the latest saved draft for resuming |
| PUT | `/api/decisions/drafts/:id` | Implemented | Saves the latest draft inputs as the user works |
| DELETE | `/api/decisions/drafts/:id` | Implemented | Permanently removes a saved draft |

Planned routes, to be specified before implementation:

- `POST /api/decisions` and decision detail/update/delete routes
- Scenario creation and comparison routes
- An explanation route that accepts a calculated result and returns validated narrative only

Decision and draft routes require a valid session and scope every read, update, and delete to its owner. The first account created claims evaluations and drafts already in the local database so they are preserved. What-If previews are calculated locally and are not persisted.
