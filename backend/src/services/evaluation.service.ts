import { evaluateDecision } from "../../../decision-engine/src/index.js";
import type { EvaluationRequestBody } from "../validation/evaluation.schema.js";

export function runEvaluation(input: EvaluationRequestBody) {
  return evaluateDecision({
    alternatives: input.alternatives,
    criteria: input.criteria,
    ratings: input.ratings,
    scoringMode: input.scoringMode,
  });
}
