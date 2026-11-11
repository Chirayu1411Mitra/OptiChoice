import { evaluateDecision } from "@optichoice/decision-engine";
import type { EvaluationRequestBody } from "../validation/evaluation.schema.js";

export function runEvaluation(input: EvaluationRequestBody) {
  return evaluateDecision({
    alternatives: input.alternatives,
    criteria: input.criteria,
    ratings: input.ratings,
    scoringMode: input.scoringMode,
  });
}
