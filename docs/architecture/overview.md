# OptiChoice architecture

OptiChoice is organized around four boundaries:

1. **Frontend** (`frontend/`) collects a decision and displays results. It sends the original evaluation to the API; What-If previews recalculate in the browser for an immediate response.
2. **Backend API** (`backend/`) validates requests, provides account sessions, scopes decisions and drafts to their owner, and saves data to SQLite. Evaluation requests call the deterministic decision engine before storing the result.
3. **Decision engine** (`decision-engine/`) is deterministic. It calculates rankings and score contributions from validated inputs. It does not call an AI model.
4. **AI explanation layer** (`ai/`) is planned to receive a calculated result and supporting context. It will explain results without changing them.

## Current scoring contract

- Criterion weights are percentages and must total 100.
- New decisions accept raw numeric values and an optional unit (for example, price in rupees or battery life in hours). Each criterion is marked higher-is-better or lower-is-better.
- The engine applies min–max normalization within each criterion across the compared alternatives, then calculates `sum((weight / 100) * normalizedValue)`.
- If all alternatives have the same value for a criterion, each receives 100 for it because it does not distinguish between them. Results are relative to the alternatives in the decision.
- Older saved evaluations and drafts retain their original 0–100 desirability-rating mode.
- If exact scores tie, the current engine preserves the input order.

This calculation is reproducible for the chosen inputs and formula; it does not establish that user ratings or the resulting choice are objectively correct.
