import { explainDecisionWithModel } from "@optichoice/ai";
import type { SavedDecision } from "../repositories/decision.repository.js";
import { env } from "../config/env.js";

export function generateDecisionExplanation(decision: SavedDecision) {
  const input = {
    title: decision.title,
    context: decision.description,
    scoringMode: decision.scoringMode,
    criteria: decision.criteria.map((criterion) => ({
      name: criterion.name,
      direction: criterion.type === "cost" ? "lower is better" : "higher is better",
      unit: criterion.unit,
      weightPercent: criterion.weight,
    })),
    alternatives: decision.alternatives.map((alternative) => ({
      name: alternative.name,
      values: decision.ratings
        .filter((rating) => rating.alternativeId === alternative.id)
        .map((rating) => ({ criterionId: rating.criterionId, inputValue: rating.value })),
      contributions: decision.breakdown
        .find((item) => item.alternativeId === alternative.id)
        ?.contributions.map((contribution) => ({
          criterionId: contribution.criterionId,
          criterionName: contribution.criterionName,
          ...(contribution.normalizedValue !== undefined ? { normalizedValue: contribution.normalizedValue } : {}),
          weightedPoints: contribution.value,
        })) ?? [],
    })),
    ranking: decision.ranking.map(({ alternativeName, rank, score }) => ({
      alternativeName,
      rank,
      scoreOutOf100: score,
    })),
  };

  return explainDecisionWithModel(input, {
    model: env.geminiModel,
    fallbackModel: env.geminiFallbackModel,
    ...(env.geminiApiKey ? { apiKey: env.geminiApiKey } : {}),
  });
}
