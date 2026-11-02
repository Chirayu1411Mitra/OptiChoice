/**
 * Deterministic weighted-sum decision evaluation.
 *
 * Relative mode normalizes each raw criterion across the compared alternatives
 * to 0–100 before applying weighted sum. Rating mode remains for legacy data.
 */

export interface EvaluationAlternative {
  id: string;
  name: string;
}

export interface EvaluationCriterion {
  id: string;
  name: string;
  type: "benefit" | "cost";
  weight: number;
  unit?: string;
}

export type ScoringMode = "rating" | "relative";

export interface EvaluationRating {
  alternativeId: string;
  criterionId: string;
  value: number;
}

export interface EvaluationInput {
  alternatives: EvaluationAlternative[];
  criteria: EvaluationCriterion[];
  ratings: EvaluationRating[];
  scoringMode?: ScoringMode;
}

export interface EvaluationRanking {
  alternativeId: string;
  alternativeName: string;
  rank: number;
  score: number;
}

export interface EvaluationContribution {
  criterionId: string;
  criterionName: string;
  value: number;
  inputValue?: number;
  normalizedValue?: number;
  unit?: string;
}

export interface EvaluationBreakdown {
  alternativeId: string;
  contributions: EvaluationContribution[];
}

export interface EvaluationResult {
  ranking: EvaluationRanking[];
  breakdown: EvaluationBreakdown[];
}

function assertUniqueIds(items: { id: string; name: string }[], label: string): void {
  const ids = new Set<string>();
  for (const item of items) {
    if (!item.id.trim()) throw new Error(`${label} must have an ID.`);
    if (ids.has(item.id)) throw new Error(`${label} IDs must be unique.`);
    if (!item.name.trim()) throw new Error(`Every ${label.toLowerCase()} needs a name.`);
    ids.add(item.id);
  }
}

function roundScore(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Calculate a weighted score for every alternative, then rank highest first. */
export function evaluateDecision(input: EvaluationInput): EvaluationResult {
  const { alternatives, criteria, ratings } = input;
  const scoringMode = input.scoringMode ?? "rating";

  if (alternatives.length < 2) throw new Error("Add at least two alternatives to compare.");
  if (criteria.length < 1) throw new Error("Add at least one criterion.");
  assertUniqueIds(alternatives, "Alternative");
  assertUniqueIds(criteria, "Criterion");

  for (const criterion of criteria) {
    if (!Number.isFinite(criterion.weight) || criterion.weight < 0 || criterion.weight > 100) {
      throw new Error(`Weight for ${criterion.name} must be between 0 and 100.`);
    }
  }
  const weightTotal = criteria.reduce((total, criterion) => total + criterion.weight, 0);
  if (Math.abs(weightTotal - 100) > 1e-9) {
    throw new Error(`Criterion weights must total 100 (currently ${roundScore(weightTotal)}).`);
  }

  const alternativeIds = new Set(alternatives.map((alternative) => alternative.id));
  const criterionIds = new Set(criteria.map((criterion) => criterion.id));
  const ratingByPair = new Map<string, number>();
  for (const rating of ratings) {
    if (!alternativeIds.has(rating.alternativeId)) throw new Error("A rating refers to an unknown alternative.");
    if (!criterionIds.has(rating.criterionId)) throw new Error("A rating refers to an unknown criterion.");
    if (!Number.isFinite(rating.value) || (scoringMode === "rating" && (rating.value < 0 || rating.value > 100))) {
      throw new Error("Every rating must be a number from 0 to 100.");
    }
    const key = `${rating.alternativeId}\u0000${rating.criterionId}`;
    if (ratingByPair.has(key)) throw new Error("Each alternative can have only one rating per criterion.");
    ratingByPair.set(key, rating.value);
  }

  const expectedRatings = alternatives.length * criteria.length;
  if (ratingByPair.size !== expectedRatings) {
    throw new Error("Add a rating for every alternative and criterion.");
  }

  const normalizedByPair = new Map<string, number>();
  for (const criterion of criteria) {
    const values = alternatives.map((alternative) => ratingByPair.get(`${alternative.id}\u0000${criterion.id}`));
    if (values.some((value) => value === undefined)) throw new Error("Add a value for every alternative and criterion.");
    if (scoringMode === "rating") {
      for (const alternative of alternatives) {
        const key = `${alternative.id}\u0000${criterion.id}`;
        normalizedByPair.set(key, ratingByPair.get(key)!);
      }
      continue;
    }
    const min = Math.min(...values as number[]);
    const max = Math.max(...values as number[]);
    for (const alternative of alternatives) {
      const key = `${alternative.id}\u0000${criterion.id}`;
      const value = ratingByPair.get(key)!;
      const normalized = max === min
        ? 100
        : criterion.type === "benefit"
          ? ((value - min) / (max - min)) * 100
          : ((max - value) / (max - min)) * 100;
      normalizedByPair.set(key, normalized);
    }
  }

  const evaluated = alternatives.map((alternative, inputIndex) => {
    const contributions = criteria.map((criterion) => {
      const key = `${alternative.id}\u0000${criterion.id}`;
      const inputValue = ratingByPair.get(key);
      const normalizedValue = normalizedByPair.get(key);
      if (inputValue === undefined || normalizedValue === undefined) throw new Error("Add a value for every alternative and criterion.");
      return {
        criterionId: criterion.id,
        criterionName: criterion.name,
        value: roundScore((criterion.weight / 100) * normalizedValue),
        inputValue,
        normalizedValue: roundScore(normalizedValue),
        unit: criterion.unit ?? "",
      };
    });
    const exactScore = criteria.reduce((total, criterion) => {
      const value = normalizedByPair.get(`${alternative.id}\u0000${criterion.id}`);
      return total + (criterion.weight / 100) * (value ?? 0);
    }, 0);
    return {
      alternativeId: alternative.id,
      alternativeName: alternative.name,
      exactScore,
      score: roundScore(exactScore),
      inputIndex,
      contributions,
    };
  });

  // Stable tie-break: if exact scores match, preserve the user's input order.
  evaluated.sort((a, b) => b.exactScore - a.exactScore || a.inputIndex - b.inputIndex);

  return {
    ranking: evaluated.map((item, index) => ({
      alternativeId: item.alternativeId,
      alternativeName: item.alternativeName,
      rank: index + 1,
      score: item.score,
    })),
    breakdown: evaluated.map((item) => ({
      alternativeId: item.alternativeId,
      contributions: item.contributions,
    })),
  };
}
