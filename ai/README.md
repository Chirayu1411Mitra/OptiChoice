# AI explanation layer

The AI layer will explain a result that has already been calculated by the deterministic decision engine. It may summarize trade-offs, strengths, weaknesses, and assumptions; it must never change the ranking or invent score values.

Planned boundaries:

- `src/services/` calls a model from server-side code only.
- `src/prompts/` contains bounded prompts built from validated decision data.
- `src/validation/` checks model responses before they reach the frontend.
- `src/reports/` can later format a decision and its explanation for export.

No AI provider or API key is configured yet.
